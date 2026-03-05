import { QueryOptions, QueryWhere } from '@common/interfaces/repository.interface';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { Injectable, Logger } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { DeliveryChargesRepository } from './repositories/delivery-charges.repository';
import { ListingsRepository } from '@modules/listings/repositories/listings.repository';
import { AppResponse } from '@common/responses/app-response';
import { DeliveryCharges } from './entities/delivery-charges.entity';
import { CalculateShippingDto } from './dto/shipping/calculate-shipping.dto';
import { Listing } from '@modules/listings/entities/listing.entity';
import { ShippingListingMeta } from './types/shipping.type';
import { DEFAULT_DELIVERY_CHARGES } from './constants/shipping.constants';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly deliveryChargesRepository: DeliveryChargesRepository,
    private readonly listingsRepository: ListingsRepository,
  ) {}

  async fetchShippingRates(pagination: PaginationOptions) {
    try {
      const where: QueryWhere = { isDeleted: false };
      const options: QueryOptions = {
        limit: pagination.limit(),
        offset: pagination.offset(),
      };
      const deliveryCharges = await this.deliveryChargesRepository.fetch(where, options);
      if (!deliveryCharges.success || !deliveryCharges.data) {
        return AppResponse.Err('No delivery charges found') as AppResponse<Partial<DeliveryCharges>[]>;
      }
      return AppResponse.fromDataLayer(deliveryCharges) as AppResponse<Partial<DeliveryCharges>[]>;
    } catch (error) {
      this.logger.error(`Error fetching delivery charges: ${error.message}`, error.stack);
      return AppResponse.Err('Failed to fetch delivery charges') as AppResponse<Partial<DeliveryCharges>[]>;
    }
  }

  /**
   * Calculate delivery charges for cart items
   * Logic:
   * 1. Group items by shop, then by category
   * 2. For each shop+category combination, find delivery charge row (city + category)
   * 3. If not found, use category-based default values
   * 4. If shop city = destination city, use intraCityCharges, else interCityCharges
   * 5. Return per-product shipping charges
   */
  async calculateShipping(body: CalculateShippingDto) {
    try {
      const { cartItems, destinationCityId } = body;
      const list = Array.isArray(cartItems) ? cartItems.filter(Boolean) : cartItems ? [cartItems] : [];

      if (!list.length) return AppResponse.Err('No items provided');

      const listingIds = list.map(i => i.listingId).filter(id => typeof id === 'number');
      if (!listingIds.length) return AppResponse.Err('Could not determine listing IDs from items');

      // Fetch listing details (city, category, shop info)
      const uniqueIds = [...new Set(listingIds)];
      const listingsRes = await this.listingsRepository.fetchFields({ listingId: { $in: uniqueIds } }, [
        'listingId',
        'city',
        'category',
        'shop',
      ]);
      if (!listingsRes.success) return AppResponse.Err('Failed to fetch listing details');

      const listings: Partial<Listing>[] = Array.isArray(listingsRes.data)
        ? (listingsRes.data as Partial<Listing>[])
        : listingsRes.data
          ? ([listingsRes.data] as Partial<Listing>[])
          : [];
      // Map listings by ID and collect unique city+category pairs
      const listingsMap = new Map<number, ShippingListingMeta>();
      const cityCategories = new Set<string>();

      // TODO: Category Name (label) might not be coming in... fix that.
      for (const l of listings) {
        if (typeof l.listingId !== 'number') continue;
        const shopCityId = l.city?.cityId;
        const categoryId = l.category?.id;
        const categoryName = (l.category as any)?.label ?? '';
        const shopId = (l as any).shop?.shopId ?? (l as any).shop?.id;

        listingsMap.set(l.listingId, { shopCityId, categoryId, categoryName, shopId });

        if (shopCityId && categoryId) {
          cityCategories.add(`${shopCityId}::${categoryId}`);
        }
      }

      // Fetch delivery charges for all city+category combinations
      const deliveryChargesMap = new Map<string, DeliveryCharges>();
      if (cityCategories.size > 0) {
        const cityIds = [...new Set(Array.from(cityCategories).map(cc => Number(cc.split('::')[0])))];
        const categoryIds = [...new Set(Array.from(cityCategories).map(cc => Number(cc.split('::')[1])))];

        const deliveryRes = await this.deliveryChargesRepository.fetch({
          city: { $in: cityIds },
          category: { $in: categoryIds },
          isDeleted: 0,
        });

        if (deliveryRes.success && deliveryRes.data) {
          const deliveryEntries: DeliveryCharges[] = Array.isArray(deliveryRes.data)
            ? (deliveryRes.data as DeliveryCharges[])
            : [deliveryRes.data as DeliveryCharges];

          for (const entry of deliveryEntries) {
            const cityId = (entry.city as any)?.cityId ?? (entry as any).city;
            const catId = (entry.category as any)?.id ?? (entry as any).category;
            if (cityId && catId) {
              deliveryChargesMap.set(`${cityId}::${catId}`, entry);
            }
          }
        }
      }

      // Calculate shipping and group by shop → category
      const shopGroups = new Map<
        number,
        Map<
          string,
          {
            categoryId: number;
            categoryName: string;
            shopCityId: number;
            isSameCity: boolean;
            itemCount: number;
            totalShippingCharge: number;
            items: Array<{ listingId: number; itemId?: number; shippingCharge: number }>;
          }
        >
      >();

      let totalShippingCharges = 0;
      const errors: Array<{ listingId: number; itemId?: number; error: string }> = [];

      for (const item of list) {
        const meta = listingsMap.get(item.listingId);
        if (!meta || !meta.shopCityId || !meta.categoryId) {
          this.logger.warn(`Listing ${item.listingId} missing city or category information`);
          errors.push({
            listingId: item.listingId,
            itemId: item.itemId,
            error: 'Listing missing city or category information',
          });
          continue;
        }

        const { shopCityId, categoryId, categoryName, shopId } = meta;
        const isSameCity = Number(shopCityId) === Number(destinationCityId);

        // Find delivery charge row for shop city + category
        const deliveryChargeKey = `${shopCityId}::${categoryId}`;
        const deliveryCharge = deliveryChargesMap.get(deliveryChargeKey);

        // Get default values for this category
        const categoryKey = categoryName.toLowerCase();
        const defaults = DEFAULT_DELIVERY_CHARGES[categoryKey] || DEFAULT_DELIVERY_CHARGES.default;

        const intraCityCharge = deliveryCharge ? Number(deliveryCharge.intraCityCharges) : defaults.intraCityCharges;
        const interCityCharge = deliveryCharge ? Number(deliveryCharge.interCityCharges) : defaults.interCityCharges;
        const averageWeight = deliveryCharge ? Number(deliveryCharge.averageWeight) || 1 : defaults.averageWeight;

        // Select charge based on same city or not
        const baseCharge = isSameCity ? intraCityCharge : interCityCharge;
        const shippingCharge = baseCharge * averageWeight;
        totalShippingCharges += shippingCharge;

        // Group by shop → category
        if (!shopGroups.has(shopId)) {
          shopGroups.set(shopId, new Map());
        }
        const shopGroup = shopGroups.get(shopId)!;
        const categoryKey2 = `${categoryId}::${categoryName}`;

        if (!shopGroup.has(categoryKey2)) {
          shopGroup.set(categoryKey2, {
            categoryId,
            categoryName,
            shopCityId,
            isSameCity,
            itemCount: 0,
            totalShippingCharge: 0,
            items: [],
          });
        }

        const categoryGroup = shopGroup.get(categoryKey2)!;
        categoryGroup.itemCount++;
        categoryGroup.totalShippingCharge += shippingCharge;
        categoryGroup.items.push({
          listingId: item.listingId,
          itemId: item.itemId,
          shippingCharge,
        });
      }

      // Build clean response structure
      const shops = Array.from(shopGroups.entries()).map(([shopId, categories]) => ({
        shopId,
        categories: Array.from(categories.values()).map(cat => ({
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          shopCityId: cat.shopCityId,
          destinationCityId,
          isSameCity: cat.isSameCity,
          itemCount: cat.itemCount,
          totalShippingCharge: cat.totalShippingCharge,
          items: cat.items,
        })),
      }));

      const response = Array.isArray(cartItems)
        ? {
            shops,
            totalShippingCharges,
            ...(errors.length > 0 && { errors }),
          }
        : {
            shippingCharge: totalShippingCharges,
            ...(errors.length > 0 && { errors }),
          };

      return AppResponse.Ok(response);
    } catch (e) {
      this.logger.error(e.message, e.stack);
      return AppResponse.Err(e.message || 'Failed to calculate delivery charges');
    }
  }
}
