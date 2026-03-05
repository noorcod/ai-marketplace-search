import {
  Body,
  Controller,
  Delete,
  Get,
  Head,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { User } from '@common/decorators/user.decorator';
import { UpdateCartItemQuantityDto } from './dto/update-cart-item-quantity.dto';
import { MergeCartDto } from './dto/merge-cart.dto';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Get user's cart with all items grouped by shop
   */
  @ApiOperation({ summary: 'Get Cart for User' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getCart(@User('userId') userId: string) {
    return await this.cartService.getCart(userId);
  }

  /**
   * Clear all items from cart
   */
  @ApiOperation({ summary: 'Clear Cart - Remove all items' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete()
  async clearCart(@User('userId') userId: string) {
    return await this.cartService.clearCart(userId);
  }

  /**
   * Check if cart exists for user (HEAD request returns 200 or 404)
   */
  @ApiOperation({ summary: 'Check if Cart Exists for User' })
  @ApiResponse({ status: 200, description: 'Cart exists' })
  @ApiResponse({ status: 404, description: 'Cart does not exist' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Head('exists')
  @HttpCode(HttpStatus.OK)
  async cartExists(@User('userId') userId: string) {
    return this.cartService.checkCartExists(userId);
    // HEAD request returns no body, just 200 OK status
  }

  /**
   * Validate cart before checkout
   */
  @ApiOperation({ summary: 'Validate Cart for Checkout' })
  @ApiResponse({ status: 200, description: 'Validation result with any issues found' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('validate')
  async validateCart(@User('userId') userId: string) {
    return await this.cartService.validateCart(userId);
  }

  /**
   * Merge guest cart with authenticated user's cart
   */
  @ApiOperation({ summary: 'Merge Guest Cart with User Cart' })
  @ApiBody({ type: MergeCartDto })
  @ApiResponse({ status: 200, description: 'Carts merged successfully' })
  @ApiResponse({ status: 400, description: 'Invalid guest cart ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('merge')
  async mergeGuestCart(@User('userId') userId: string, @Body() mergeCartDto: MergeCartDto) {
    return await this.cartService.mergeCart(userId, mergeCartDto.guestCartId);
  }

  /**
   * Add a single item to cart
   */
  @ApiOperation({ summary: 'Add Item to Cart' })
  @ApiBody({ type: AddCartItemDto })
  @ApiResponse({ status: 201, description: 'Item added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid item data or listing validation failed' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('items')
  async addItem(@User('userId') userId: string, @Body() cartItem: AddCartItemDto) {
    return await this.cartService.addItem(userId, cartItem);
  }

  /**
   * Add multiple items to cart in bulk
   */
  @ApiOperation({ summary: 'Add Items to Cart in Bulk' })
  @ApiBody({ type: [AddCartItemDto] })
  @ApiResponse({ status: 201, description: 'Items added successfully (may include rejected items)' })
  @ApiResponse({ status: 400, description: 'No valid items provided' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('items/bulk')
  async addItemsBulk(@User('userId') userId: string, @Body() cartItems: AddCartItemDto[]) {
    return await this.cartService.addItemsBulk(userId, cartItems);
  }

  /**
   * Update quantity of a cart item
   */
  @ApiOperation({ summary: 'Update Cart Item Quantity' })
  @ApiParam({ name: 'listingId', type: Number, description: 'Listing ID' })
  @ApiBody({ type: UpdateCartItemQuantityDto })
  @ApiResponse({ status: 200, description: 'Quantity updated successfully' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  @ApiResponse({ status: 400, description: 'Invalid quantity or exceeds stock' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Put('items/:listingId')
  async updateItemQuantity(
    @User('userId') userId: string,
    @Param('listingId', ParseIntPipe) listingId: number,
    @Body() data: UpdateCartItemQuantityDto,
  ) {
    return await this.cartService.updateItemQuantity(userId, listingId, data.quantity);
  }

  /**
   * Clear all items from a specific shop
   * NOTE: This route must be defined BEFORE the generic /items/:itemId route
   */
  @ApiOperation({ summary: 'Clear Cart Items by Shop' })
  @ApiParam({ name: 'shopId', type: Number, description: 'Shop ID' })
  @ApiResponse({ status: 200, description: 'Shop items cleared successfully' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete('shops/:shopId/items')
  async clearShopItems(@User('userId') userId: string, @Param('shopId', ParseIntPipe) shopId: number) {
    return await this.cartService.clearShopItems(userId, shopId);
  }

  /**
   * Remove a single item from cart
   */
  @ApiOperation({ summary: 'Remove Item from Cart' })
  @ApiParam({ name: 'listingId', type: Number, description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'Item removed successfully' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete('items/:listingId')
  async removeItem(@User('userId') userId: string, @Param('listingId', ParseIntPipe) listingId: number) {
    return await this.cartService.removeItem(userId, listingId);
  }
}
