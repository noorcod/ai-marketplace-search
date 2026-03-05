import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { CartRepository } from './repositories/cart.repository';
import { AppResponse } from '@common/responses/app-response';
import { Cart } from './entities/cart.entity';
import { QueryOptions, QueryWhere } from '@common/interfaces/repository.interface';
import { nestedObjectToDotFields } from '@common/utilities/nested-object-to-dot-fields';
import { CART_COLUMNS } from '@common/constants/column-selections.constants';
import { CART_POPULATE } from '@common/constants/populate-tables.constants';
import { CartItem } from './entities/cart-item.entity';
import { ListingsService } from '@modules/listings/listings.service';
import { Listing } from '@modules/listings/entities/listing.entity';
import { ACTIVE_LISTING_STATUSES } from '@common/enums/listing-status.enum';
import { CartItemRepository } from './repositories/cart-item.repository';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly cartRepository: CartRepository,
    private readonly cartItemRepository: CartItemRepository,
    private readonly listingsService: ListingsService,
  ) {}

  /**
   * Check if cart exists for user
   * Used by HEAD /cart/exists endpoint
   */
  async checkCartExists(userId: string): Promise<AppResponse<boolean>> {
    try {
      const existsResult = await this.cartRepository.exists({ user: userId });
      if (!existsResult.success) {
        return AppResponse.Err('Failed to check cart existence');
      }
      return AppResponse.Ok(existsResult.data === true);
    } catch (e) {
      this.logger.error(`Error checking cart existence: ${e.message}`, e.stack);
      return AppResponse.Err(e.message);
    }
  }

  /**
   * Get cart for user with all items grouped by shop
   * Used by GET /cart endpoint
   */
  async getCart(userId: string): Promise<AppResponse<any>> {
    try {
      const where: QueryWhere<Cart> = { user: userId, isEmpty: false, isDummy: false };
      const cartColumns = nestedObjectToDotFields(CART_COLUMNS);
      const cartPopulatedTables = nestedObjectToDotFields(CART_POPULATE);
      const options: QueryOptions<Cart> = {
        populate: cartPopulatedTables,
        fields: cartColumns,
      };

      const result = await this.cartRepository.fetch(where, options);

      if (!result.success) {
        return AppResponse.Err('Cart not found / is empty', HttpStatus.NOT_FOUND);
      }

      const original = result.data as Cart | Cart[];

      // If fetch returned an empty array, treat as not found
      if (Array.isArray(original) && original.length === 0) {
        return AppResponse.Err('Cart is empty', HttpStatus.NOT_FOUND);
      }

      const cart: Cart = Array.isArray(original) ? original[0] : original;

      if (!cart) {
        return AppResponse.Err('Cart not found');
      }

      // Transform cart to response format
      const response = this.transformCartToResponse(cart);
      return AppResponse.Ok(response);
    } catch (e) {
      this.logger.error(`Error getting cart: ${e.message}`, e.stack);
      return AppResponse.Err(e.message);
    }
  }

  /**
   * Add a single item to cart
   * Used by POST /cart/items endpoint
   */
  async addItem(userId: string, cartItemDto: any): Promise<AppResponse<any>> {
    try {
      // Validate the listing first
      const listingId = cartItemDto.listingId ?? cartItemDto.listing?.listingId;
      if (!listingId) {
        return AppResponse.Err('Listing ID is required');
      }

      const quantity = cartItemDto.quantity ?? 1;
      const validationResult = await this.validateListingForCart(listingId, quantity);
      if (!validationResult.success) {
        return AppResponse.Err(validationResult.message || 'Listing validation failed');
      }

      const listing = validationResult.data as any;

      // Get or create cart
      const cart = await this.getOrCreateCart(userId);
      if (!cart.success || !cart.data) {
        return AppResponse.Err('Failed to get or create cart');
      }

      const cartEntity = cart.data as Cart;

      // Check if item already exists in cart
      const existingItem = await this.findCartItemByListing(cartEntity.id, listingId);

      if (existingItem) {
        // Update quantity of existing item
        const newQuantity = existingItem.quantity + quantity;

        // Validate new quantity against stock
        const qtyValidation = await this.validateListingForCart(listingId, newQuantity);
        if (!qtyValidation.success) {
          return AppResponse.Err(qtyValidation.message || 'Quantity exceeds available stock');
        }

        const updateResult = await this.cartItemRepository.updateEntity(
          { id: existingItem.id },
          { quantity: newQuantity, isUpdated: true },
        );

        if (!updateResult.success) {
          return AppResponse.Err('Failed to update cart item quantity');
        }
      } else {
        // Add new item to cart
        const mappedItem: Partial<CartItem> = {
          cart: cartEntity.id,
          listing: listingId,
          item: listing?.item?.itemId ?? listing?.item,
          shop: listing?.shop?.shopId ?? listing?.shop,
          location: listing?.location?.locationId ?? listing?.location,
          quantity: Number(quantity),
          unitPrice: String(listing?.effectivePrice ?? '0.00'),
          unitDiscount: String(listing?.effectiveDiscount ?? '0.00'),
          isUpdated: false,
          isNla: false,
          isDummy: false,
        } as any;
        const addResult = await this.cartItemRepository.createEntity(mappedItem as CartItem);

        if (!addResult.success) {
          return AppResponse.Err('Failed to add item to cart');
        }
      }

      // Note: Cart totals are recalculated by DB triggers
      // Return updated cart
      return await this.getCart(userId);
    } catch (e) {
      this.logger.error(`Error adding item to cart: ${e.message}`, e.stack);
      return AppResponse.Err(e.message);
    }
  }

  /**
   * Add multiple items to cart in bulk
   * Used by POST /cart/items/bulk endpoint
   * Optimized with batch listing validation to avoid N+1 queries
   */
  async addItemsBulk(userId: string, cartItemDtos: any[]): Promise<AppResponse<any>> {
    try {
      if (!Array.isArray(cartItemDtos) || cartItemDtos.length === 0) {
        return AppResponse.Err('No cart items provided');
      }

      // Get or create cart
      const cart = await this.getOrCreateCart(userId);
      if (!cart.success || !cart.data) {
        return AppResponse.Err('Failed to get or create cart');
      }

      const cartEntity = cart.data as Cart;
      const rejectedItems: Array<{ listingId: number; message: string }> = [];
      const itemsToAdd: Partial<CartItem>[] = [];
      const itemsToUpdate: Array<{ id: number; quantity: number }> = [];

      // Extract all listing IDs upfront for batch validation
      const listingIdsToValidate: number[] = [];
      const dtoByListingId = new Map<number, any[]>();

      for (const dto of cartItemDtos) {
        const listingId = dto.listingId ?? dto.listing?.listingId;
        if (!listingId) {
          this.logger.warn(`Skipping cart item without listing ID`);
          continue;
        }
        listingIdsToValidate.push(listingId);
        const existing = dtoByListingId.get(listingId) ?? [];
        existing.push(dto);
        dtoByListingId.set(listingId, existing);
      }

      if (listingIdsToValidate.length === 0) {
        return AppResponse.Err('No valid listing IDs provided');
      }

      // Batch fetch all listings in a single query
      const uniqueListingIds = [...new Set(listingIdsToValidate)];
      const listingsResult = await this.listingsService.fetchListingsByIds({ ids: uniqueListingIds });

      // Build listings map for quick lookup
      const listingsMap = new Map<number, Listing>();
      if (listingsResult.success && listingsResult.data) {
        const listingsData = (listingsResult.data as any).listings ?? [];
        for (const listing of listingsData) {
          listingsMap.set(listing.listingId, listing);
        }
      }

      // Get existing cart items
      const existingItems = await this.getCartItemsMap(cartEntity.id);

      // Process each DTO using cached listings
      for (const dto of cartItemDtos) {
        const listingId = dto.listingId ?? dto.listing?.listingId;
        if (!listingId) continue;

        const quantity = dto.quantity ?? 1;
        const listing = listingsMap.get(listingId);

        // Validate listing from cache
        const validationResult = this.validateListingFromCache(listing, listingId, quantity);
        if (!validationResult.success) {
          rejectedItems.push({
            listingId,
            message: String(validationResult.message || 'Listing validation failed'),
          });
          continue;
        }

        // Check if item already exists
        const existingItem = existingItems.get(listingId);
        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;

          // Validate new quantity against cached listing
          const qtyValidation = this.validateListingFromCache(listing, listingId, newQuantity);
          if (!qtyValidation.success) {
            rejectedItems.push({
              listingId,
              message: String(qtyValidation.message || 'Quantity exceeds available stock'),
            });
            continue;
          }

          itemsToUpdate.push({ id: existingItem.id, quantity: newQuantity });
        } else {
          itemsToAdd.push({
            cart: cartEntity.id,
            listing: listingId,
            item: (listing as any)?.item?.itemId ?? (listing as any)?.item,
            shop: (listing as any)?.shop?.shopId ?? (listing as any)?.shop,
            location: (listing as any)?.location?.locationId ?? (listing as any)?.location,
            quantity: Number(quantity),
            unitPrice: String((listing as any)?.effectivePrice ?? '0.00'),
            unitDiscount: String((listing as any)?.effectiveDiscount ?? '0.00'),
            isUpdated: false,
            isNla: false,
            isDummy: false,
          } as any);
        }
      }

      // Perform updates
      if (itemsToUpdate.length > 0) {
        await Promise.all(
          itemsToUpdate.map(item =>
            this.cartItemRepository.updateEntity({ id: item.id }, { quantity: item.quantity, isUpdated: true }),
          ),
        );
      }

      // Perform additions
      if (itemsToAdd.length > 0) {
        await this.cartItemRepository.createEntities(itemsToAdd as CartItem[]);
      }

      // Note: Cart totals are recalculated by DB triggers
      // Return updated cart with rejected items info
      const cartResponse = await this.getCart(userId);
      if (rejectedItems.length > 0 && cartResponse.success) {
        return AppResponse.Ok({ ...(cartResponse.data as any), rejectedItems });
      }

      return cartResponse;
    } catch (e) {
      this.logger.error(`Error adding items in bulk: ${e.message}`, e.stack);
      return AppResponse.Err(e.message);
    }
  }

  /**
   * Update quantity of a cart item
   * Used by PUT /cart/items/:listingId endpoint
   */
  async updateItemQuantity(userId: string, listingId: number, quantity: number): Promise<AppResponse<any>> {
    try {
      // Verify cart item exists for user + listing
      const cartItem = await this.findCartItemByListingForUser(userId, listingId);
      if (!cartItem) {
        return AppResponse.Err('Cart item not found');
      }

      // Validate quantity
      if (quantity < 1) {
        return AppResponse.Err('Quantity must be at least 1');
      }

      const validationResult = await this.validateListingForCart(listingId, quantity);
      if (!validationResult.success) {
        return AppResponse.Err(validationResult.message || 'Quantity validation failed');
      }

      // Update quantity
      const updateResult = await this.cartItemRepository.updateEntity(
        { id: cartItem.id },
        { quantity, isUpdated: true },
      );

      if (!updateResult.success) {
        return AppResponse.Err('Failed to update cart item quantity');
      }

      // Note: Cart totals are recalculated by DB triggers
      return AppResponse.Ok(updateResult.data);
    } catch (e) {
      this.logger.error(`Error updating item quantity: ${e.message}`, e.stack);
      return AppResponse.Err(e.message);
    }
  }

  /**
   * Remove a single item from cart
   * Used by DELETE /cart/items/:listingId endpoint
   */
  async removeItem(userId: string, listingId: number): Promise<AppResponse<boolean>> {
    try {
      // Verify cart item exists for user + listing
      const cartItem = await this.findCartItemByListingForUser(userId, listingId);
      if (!cartItem) {
        return AppResponse.Err('Cart item not found');
      }

      // Delete the item
      const deleteResult = await this.cartItemRepository.deleteMany({ id: cartItem.id });
      if (!deleteResult.success) {
        return AppResponse.Err('Failed to remove cart item');
      }

      // Note: Cart totals are recalculated by DB triggers
      return AppResponse.Ok(true);
    } catch (e) {
      this.logger.error(`Error removing cart item: ${e.message}`, e.stack);
      return AppResponse.Err(e.message);
    }
  }

  /**
   * Clear all items from cart
   * Used by DELETE /cart endpoint
   */
  async clearCart(userId: string): Promise<AppResponse<boolean>> {
    try {
      // Delete all cart items for user
      const deleteResult = await this.cartItemRepository.deleteMany({
        cart: { user: userId },
      });

      if (!deleteResult.success) {
        return AppResponse.Err('Failed to clear cart');
      }

      // Note: Cart totals are recalculated by DB triggers
      return AppResponse.Ok(true);
    } catch (e) {
      this.logger.error(`Error clearing cart: ${e.message}`, e.stack);
      return AppResponse.Err(e.message);
    }
  }

  /**
   * Clear all items from a specific shop
   * Used by DELETE /cart/shops/:shopId/items endpoint
   */
  async clearShopItems(userId: string, shopId: number): Promise<AppResponse<boolean>> {
    try {
      // Delete all cart items for this shop
      const deleteResult = await this.cartItemRepository.deleteMany({
        cart: { user: userId },
        shop: shopId,
      });

      if (!deleteResult.success) {
        return AppResponse.Err('Failed to clear shop items');
      }

      // Note: Cart totals are recalculated by DB triggers
      return AppResponse.Ok(true);
    } catch (e) {
      this.logger.error(`Error clearing shop items: ${e.message}`, e.stack);
      return AppResponse.Err(e.message);
    }
  }

  async removeItemsByListingIds(userId: string, listingIds: number[]): Promise<AppResponse<boolean>> {
    try {
      const uniqueIds = [...new Set(listingIds)].filter(id => Number.isFinite(id) && id > 0);
      if (uniqueIds.length === 0) {
        return AppResponse.Ok(true);
      }

      const deleteResult = await this.cartItemRepository.deleteMany({
        cart: { user: userId },
        listing: { listingId: { $in: uniqueIds } },
      } as any);

      if (!deleteResult.success) {
        return AppResponse.Err('Failed to remove cart items');
      }

      return AppResponse.Ok(true);
    } catch (e) {
      this.logger.error(`Error removing cart items by listingIds: ${e.message}`, e.stack);
      return AppResponse.Err(e.message);
    }
  }

  /**
   * Validate cart before checkout
   * Used by POST /cart/validate endpoint
   * Optimized with batch listing validation to avoid N+1 queries
   */
  async validateCart(userId: string): Promise<AppResponse<any>> {
    try {
      const cartResult = await this.getCart(userId);
      if (!cartResult.success) {
        return AppResponse.Err('Cart not found');
      }

      const cart = cartResult.data;
      const issues: Array<{
        itemId: number;
        listingId: number;
        type: string;
        message: string;
        details?: any;
      }> = [];

      // Flatten items from grouped shops
      const allItems: any[] = [];
      for (const shop of cart.shops || []) {
        for (const item of shop.items || []) {
          allItems.push({ ...item, shopId: shop.shopId });
        }
      }

      if (allItems.length === 0) {
        return AppResponse.Ok({
          valid: true,
          issues: [],
          itemCount: 0,
          totalAmount: cart.totalAmount,
          totalDiscount: cart.totalDiscount,
        });
      }

      // Extract all listing IDs for batch fetch
      const listingIds: number[] = [];
      for (const item of allItems) {
        const listingId = item.listing?.listingId ?? item.listingId;
        if (listingId) {
          listingIds.push(listingId);
        }
      }

      // Batch fetch all listings in a single query
      const uniqueListingIds = [...new Set(listingIds)];
      const listingsMap = new Map<number, Listing>();

      if (uniqueListingIds.length > 0) {
        const listingsResult = await this.listingsService.fetchListingsByIds({ ids: uniqueListingIds });
        if (listingsResult.success && listingsResult.data) {
          const listingsData = (listingsResult.data as any).listings ?? [];
          for (const listing of listingsData) {
            listingsMap.set(listing.listingId, listing);
          }
        }
      }

      // Validate each item using cached listings
      for (const item of allItems) {
        const listingId = item.listing?.listingId ?? item.listingId;
        if (!listingId) {
          issues.push({
            itemId: item.id,
            listingId: 0,
            type: 'MISSING_LISTING',
            message: 'Listing information missing',
          });
          continue;
        }

        const listing = listingsMap.get(listingId);
        const validationResult = this.validateListingFromCache(listing, listingId, item.quantity);
        if (!validationResult.success) {
          issues.push({
            itemId: item.id,
            listingId,
            type: 'VALIDATION_FAILED',
            message: String(validationResult.message || 'Validation failed'),
          });
          continue;
        }

        const validListing = validationResult.data as Listing;

        // Check for price changes
        const currentPrice = parseFloat(validListing.effectivePrice?.toString() ?? '0');
        const cartPrice = parseFloat(item.unitPrice?.toString() ?? '0');
        if (Math.abs(currentPrice - cartPrice) > 0.01) {
          issues.push({
            itemId: item.id,
            listingId,
            type: 'PRICE_CHANGED',
            message: 'Item price has changed',
            details: { oldPrice: cartPrice, newPrice: currentPrice },
          });
        }

        // Check stock availability
        if (validListing.listedQty < item.quantity) {
          issues.push({
            itemId: item.id,
            listingId,
            type: 'INSUFFICIENT_STOCK',
            message: `Only ${validListing.listedQty} items available`,
            details: { available: validListing.listedQty, requested: item.quantity },
          });
        }
      }

      return AppResponse.Ok({
        valid: issues.length === 0,
        issues,
        itemCount: allItems.length,
        totalAmount: cart.totalAmount,
        totalDiscount: cart.totalDiscount,
      });
    } catch (e) {
      this.logger.error(`Error validating cart: ${e.message}`, e.stack);
      return AppResponse.Err(e.message);
    }
  }

  /**
   * Merge guest cart with user cart (placeholder for future implementation)
   * Used by POST /cart/merge endpoint
   */
  async mergeCart(userId: string, guestCartId: string): Promise<AppResponse<any>> {
    try {
      // TODO: Implement guest cart merge logic
      // 1. Fetch guest cart by ID
      // 2. Fetch or create user cart
      // 3. Merge items (combine quantities for duplicates)
      // 4. Delete guest cart
      // 5. Return merged cart

      this.logger.warn('Cart merge functionality not yet implemented');
      return AppResponse.Err('Cart merge functionality coming soon');
    } catch (e) {
      this.logger.error(`Error merging cart: ${e.message}`, e.stack);
      return AppResponse.Err(e.message);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get or create cart for user
   * Uses transaction to prevent race conditions when multiple requests
   * try to create a cart for the same user simultaneously
   */
  private async getOrCreateCart(userId: string): Promise<AppResponse<Cart>> {
    try {
      // First, try to find existing cart (fast path)
      let cart = await this.cartRepository.findOne({ user: userId });

      if (cart) {
        return AppResponse.Ok(cart);
      }

      // Cart doesn't exist - use transaction to safely create one
      return await this.em.transactional(async em => {
        // Re-check within transaction to handle race condition
        const existingCart = await this.cartRepository.findOne({ user: userId });

        if (existingCart) {
          return AppResponse.Ok(existingCart);
        }

        // Create new cart within transaction
        const createResult = await this.cartRepository.createEntity({
          user: userId,
          quantity: 0,
          isEmpty: true,
          totalAmount: '0.00',
          totalDiscount: '0.00',
          totalItems: 0,
        });

        if (!createResult.success) {
          return AppResponse.Err('Failed to create cart');
        }

        const newCart = Array.isArray(createResult.data) ? createResult.data[0] : createResult.data;
        return AppResponse.Ok(newCart);
      });
    } catch (e) {
      // Handle unique constraint violation (concurrent cart creation)
      if (e.code === 'ER_DUP_ENTRY' || e.message?.includes('Duplicate entry')) {
        // Another request created the cart, fetch it
        const cart = await this.cartRepository.findOne({ user: userId });
        if (cart) {
          return AppResponse.Ok(cart);
        }
      }
      return AppResponse.Err(e.message);
    }
  }

  /**
   * Find cart item by listing ID
   */
  private async findCartItemByListing(cartId: string, listingId: number): Promise<CartItem | null> {
    try {
      const result = await this.cartItemRepository.findOne({
        cart: cartId,
        listing: listingId,
      });
      return result || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Find cart item by listing ID and verify it belongs to user
   */
  private async findCartItemByListingForUser(userId: string, listingId: number): Promise<CartItem | null> {
    try {
      const result = await this.cartItemRepository.findOne({
        cart: { user: userId },
        listing: listingId as any,
      });
      return result || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get map of existing cart items by listing ID
   */
  private async getCartItemsMap(cartId: string): Promise<Map<number, CartItem>> {
    try {
      const items = await this.cartItemRepository.find({ cart: cartId });
      const map = new Map<number, CartItem>();

      for (const item of items) {
        const listingId = (item.listing as any)?.listingId ?? item.listing;
        if (typeof listingId === 'number') {
          map.set(listingId, item);
        }
      }

      return map;
    } catch (e) {
      return new Map();
    }
  }

  /**
   * Recalculate cart totals (manual fallback)
   * NOTE: Cart totals are normally calculated by DB triggers on cart_items table.
   * This method is kept as a fallback for manual recalculation if needed.
   */
  async recalculateCartTotals(cartId: string): Promise<void> {
    try {
      const items = await this.cartItemRepository.find({ cart: cartId });

      let totalAmount = 0;
      let totalDiscount = 0;
      let totalItems = 0;

      for (const item of items) {
        const price = parseFloat(item.unitPrice?.toString() ?? '0');
        const discount = parseFloat(item.unitDiscount?.toString() ?? '0');
        const quantity = item.quantity ?? 1;

        totalAmount += price * quantity;
        totalDiscount += discount * quantity;
        totalItems += quantity;
      }

      await this.cartRepository.updateEntity(
        { id: cartId },
        {
          totalAmount: totalAmount.toFixed(2),
          totalDiscount: totalDiscount.toFixed(2),
          totalItems,
          quantity: items.length,
          isEmpty: items.length === 0,
        },
      );
    } catch (e) {
      this.logger.error(`Error recalculating cart totals: ${e.message}`, e.stack);
    }
  }

  /**
   * Transform cart entity to response format (lean response)
   */
  private transformCartToResponse(cart: Cart): any {
    // Ensure cartItems is an array
    const cartItemsArray = Array.isArray((cart as any).cartItems)
      ? (cart as any).cartItems
      : ((cart as any).cartItems?.toArray?.() ?? []);

    // Group items by shop
    const groupedShops = cartItemsArray.reduce((acc: any, currItem: any) => {
      const shopId = currItem.shop?.shopId ?? currItem.shop;

      if (!acc[shopId]) {
        acc[shopId] = {
          shopId: currItem.shop?.shopId ?? shopId,
          shopName: currItem.shop?.shopName ?? null,
          logoPath: currItem.shop?.logoPath ?? null,
          username: currItem.shop?.username ?? null,
          onTrial: currItem.shop?.onTrial ?? false,
          onPayment: currItem.shop?.onPayment ?? false,
          // Only include essential location info
          location: currItem.location
            ? {
                locationId: currItem.location?.locationId ?? currItem.location,
                cityId: currItem.location?.city?.cityId ?? currItem.location?.city,
                cityName: currItem.location?.city?.cityName ?? null,
              }
            : null,
          items: [],
        };
      }

      // Only include essential cart item fields
      acc[shopId].items.push({
        id: currItem.id,
        quantity: currItem.quantity,
        unitPrice: currItem.unitPrice,
        unitDiscount: currItem.unitDiscount,
        isUpdated: currItem.isUpdated,
        isNla: currItem.isNla,
        oldPrice: currItem.oldPrice,
        oldDiscount: currItem.oldDiscount,
        // Only essential listing info
        listing: currItem.listing
          ? {
              listingId: currItem.listing?.listingId ?? currItem.listing,
              listingTitle: currItem.listing?.listingTitle ?? null,
              listedQty: currItem.listing?.listedQty ?? null,
              effectivePrice: currItem.listing?.effectivePrice ?? null,
              effectiveDiscount: currItem.listing?.effectiveDiscount ?? null,
              primaryImage: currItem.listing?.primaryImage ?? null,
              url: currItem.listing?.url ?? null,
              isFeatured: currItem.listing?.isFeatured ?? false,
            }
          : null,
        // Only essential item info (just the ID)
        itemId: currItem.item?.itemId ?? currItem.item ?? null,
      });

      return acc;
    }, {});

    return {
      id: cart.id,
      itemCount: cart.quantity,
      isEmpty: cart.isEmpty,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
      totalDiscount: cart.totalDiscount,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      userId: typeof cart.user === 'object' ? (cart.user as any)?.id : cart.user,
      shops: Object.values(groupedShops),
    };
  }

  /**
   * Validate listing for cart operations
   */
  private async validateListingForCart(listingId: number, desiredQty?: number): Promise<AppResponse<Listing>> {
    try {
      const listingResp = await this.listingsService.fetchListingById(listingId);
      if (!listingResp.success || !listingResp.data) {
        return AppResponse.Err('Listing not found');
      }

      const listingData = listingResp.data as Listing;
      return this.validateListingFromCache(listingData, listingId, desiredQty);
    } catch (e) {
      return AppResponse.Err(e.message);
    }
  }

  /**
   * Validate listing from cached data (avoids extra DB call)
   * Used for batch operations where listings are pre-fetched
   */
  private validateListingFromCache(
    listing: Listing | undefined,
    listingId: number,
    desiredQty?: number,
  ): AppResponse<Listing> {
    if (!listing) {
      return AppResponse.Err('Listing not found');
    }

    // Active status check
    if (!ACTIVE_LISTING_STATUSES.includes(listing.status as any)) {
      return AppResponse.Err('Listing is not active');
    }

    // Check basic availability
    if (typeof listing.listedQty !== 'number' || listing.listedQty <= 0) {
      return AppResponse.Err('Listing out of stock');
    }

    // Deleted / archived checks
    if (listing.isDeleted) return AppResponse.Err('Listing has been deleted');
    if (listing.deletedAt) return AppResponse.Err('Listing has been deleted');
    if ((listing as any).archivedOn) return AppResponse.Err('Listing has been archived');

    // Quantity limits
    if (typeof desiredQty === 'number') {
      if (desiredQty > listing.listedQty) {
        return AppResponse.Err(`Quantity exceeds available stock (${listing.listedQty} available)`);
      }
      // TODO: Add max quantity per item check when business rule is defined
      // if (desiredQty > MAX_QUANTITY_PER_ITEM) {
      //   return AppResponse.Err(`Maximum ${MAX_QUANTITY_PER_ITEM} items allowed per listing`);
      // }
    }

    return AppResponse.Ok(listing);
  }
}
