import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { CartItem } from '../entities/cart-item.entity';

export function mapDtoToCartItemEntity(dto: AddCartItemDto | any, cartId?: string) {
  // Helper to map incoming DTO to entity shape expected by createEntities
  const listing = dto.listingId ?? dto.listing?.listingId ?? null;
  const item = dto.itemId ?? null;
  const shop = dto.shopId ?? null;
  const location = dto.locationId ?? null;
  const quantity = Number(dto.qty ?? dto.quantity ?? 1);
  const unitPrice = dto.unitPrice ?? dto.price ?? '0.00';
  const unitDiscount = dto.unitDiscount ?? 0;
  const isNla = dto.isNla ?? false;

  return {
    cart: cartId ?? dto.cart ?? null,
    listing,
    item,
    shop,
    location,
    quantity,
    unitPrice,
    unitDiscount,
    oldPrice: dto.oldPrice ?? null,
    oldDiscount: dto.oldDiscount ?? null,
    isNla,
    isUpdated: dto.isUpdated ?? false,
    isDummy: dto.isDummy ?? false,
  } as Partial<CartItem>;
}
