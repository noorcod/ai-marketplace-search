import { ApiProperty } from '@nestjs/swagger';
import { SaleBannerDto } from '@modules/sale-events/dtos/fetch-active-sales-response.dto';

export class SaleEventShopDto {
  @ApiProperty({ example: 1188 })
  shopId!: number;

  @ApiProperty({ example: 'Cell n Sell' })
  shopName!: string;

  @ApiProperty({ example: 'cell-n-sell' })
  username!: string;

  @ApiProperty({ example: true })
  onTrial!: boolean;

  @ApiProperty({ example: false })
  onPayment!: boolean;

  @ApiProperty({ example: 'images/profiles/xdBSI88Hrbb1gZKi1719318143929.webp', nullable: true })
  logoPath?: string;
}

export class SaleEventCityDto {
  @ApiProperty({ example: 1 })
  cityId!: number;

  @ApiProperty({ example: 'Lahore' })
  cityName!: string;
}

export class SaleEventLocationDto {
  @ApiProperty({ example: 526 })
  locationId!: number;

  @ApiProperty({ type: () => SaleEventCityDto })
  city!: SaleEventCityDto;

  @ApiProperty({ example: 'Shop No G3, Ground Floor, Gate 2, Hafeez Center, Main Boulevard Gulberg Phase III Lahore.' })
  address!: string;

  @ApiProperty({ example: '31.516104', nullable: true })
  latitude?: string;

  @ApiProperty({ example: '74.343528', nullable: true })
  longitude?: string;

  @ApiProperty({ example: 'Main', nullable: true })
  locationNick?: string;
}

export class SaleEventListingPriceDto {
  @ApiProperty({ example: 2134 })
  id!: number;

  @ApiProperty({ example: '25999.00' })
  onlinePrice!: string;
}

export class SaleEventListingDto {
  @ApiProperty({ example: 2137 })
  listingId!: number;

  @ApiProperty({ example: 'Xiaomi Redmi A3 4/128 Star Blue' })
  listingTitle!: string;

  @ApiProperty({ example: 10 })
  listedQty!: number;

  @ApiProperty({ example: 'https://techbazaar.pk/products/xiaomi-redmi-a3-4128-star-blue-2137', nullable: true })
  url?: string;

  @ApiProperty({ example: '25999.00', nullable: true })
  effectivePrice?: string;

  @ApiProperty({ example: '0.00', nullable: true })
  effectiveDiscount?: string;

  @ApiProperty({ example: 111, nullable: true })
  visits?: number;

  @ApiProperty({ example: '0.0', nullable: true })
  rating?: string;

  @ApiProperty({ type: () => SaleEventShopDto })
  shop!: SaleEventShopDto;

  @ApiProperty({ type: () => SaleEventLocationDto })
  location!: SaleEventLocationDto;

  @ApiProperty({ example: 2 })
  category!: number;

  @ApiProperty({ example: 'Mobile' })
  categoryName!: string;

  @ApiProperty({ example: 'New' })
  conditionName!: string;

  @ApiProperty({ example: 'images/inventoryImages/mw2R2MPNMmtPZaXo1713789949111.webp', nullable: true })
  primaryImage?: string;

  @ApiProperty({ example: 187, nullable: true })
  color?: number;

  @ApiProperty({ example: 'Star Blue', nullable: true })
  colorName?: string;

  @ApiProperty({ example: false })
  isFeatured!: boolean;

  @ApiProperty({ example: 'Validated,Active', nullable: true })
  status?: string;

  @ApiProperty({ example: '2024-06-26T10:48:32.000Z', nullable: true })
  createdAt?: string;

  @ApiProperty({ example: '2024-11-13T13:47:42.000Z', nullable: true })
  activationDate?: string;

  @ApiProperty({ example: null, nullable: true })
  archivedOn?: string | null;

  @ApiProperty({ example: '2024-07-23T19:11:20.000Z', nullable: true })
  updatedAt?: string;

  @ApiProperty({ example: false, nullable: true })
  isDeleted?: boolean;

  @ApiProperty({ type: () => SaleEventListingPriceDto, nullable: true })
  listingPrice?: SaleEventListingPriceDto;
}

export class SaleByNameDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '2025-12-13T12:57:07.000Z', nullable: true })
  startDate?: string;

  @ApiProperty({ example: '2025-12-19T12:57:14.000Z', nullable: true })
  endDate?: string;

  @ApiProperty({ example: 'demo-sale' })
  name!: string;

  @ApiProperty({ example: 'linear-gradient(to right, #FFA500, #FF4500)' })
  colorScheme!: string;

  @ApiProperty({ example: '30', nullable: true })
  discountUpto?: string;

  @ApiProperty({ type: () => [SaleEventListingDto] })
  listings!: SaleEventListingDto[];

  @ApiProperty({ example: 'keyA, keyB', nullable: true })
  metaKeywords?: string;

  @ApiProperty({ example: 'lorem epsum', nullable: true })
  metaDescription?: string;

  @ApiProperty({ example: 'Demo Sale', nullable: true })
  metaTitle?: string;

  @ApiProperty({ example: true, nullable: true })
  isActive?: boolean;

  @ApiProperty({ example: false, nullable: true })
  isDeleted?: boolean;

  @ApiProperty({ type: () => [SaleBannerDto] })
  banners!: SaleBannerDto[];

  @ApiProperty({ example: false })
  saleEnded!: boolean;
}

export class FetchSaleByNameResponseDto {
  @ApiProperty({ example: 200 })
  status!: number;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Data retrieved successfully' })
  message!: string;

  @ApiProperty({ type: () => SaleByNameDto })
  data!: SaleByNameDto;
}
