import { ApiProperty } from '@nestjs/swagger';
import { PaginationInfoDto } from '@common/dtos/pagination-info.dto';

export class SaleListingDto {
  @ApiProperty({ example: 'Sony Xperia Z4 Tablet LTE SIM-Supported - 2137' })
  label!: string;

  @ApiProperty({ example: 2137 })
  value!: number;
}

export class SaleBannerDto {
  @ApiProperty({ example: 14 })
  id!: number;

  @ApiProperty({ example: 'images/marketplace/banners/udPt6R2TTGto0thZ1754567754613.webp' })
  bannerKey!: string;

  @ApiProperty({ example: 1 })
  sale!: number;

  @ApiProperty({ example: 'main-header', nullable: true })
  location?: string;

  @ApiProperty({ example: false, nullable: true })
  isDeleted?: boolean;
}

export class ActiveSaleDto {
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

  @ApiProperty({ type: () => [SaleListingDto] })
  listings!: SaleListingDto[];

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
}

export class FetchActiveSalesResponseDto {
  @ApiProperty({ example: 200 })
  status!: number;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Paged data retrieved' })
  message!: string;

  @ApiProperty({ type: () => [ActiveSaleDto] })
  data!: ActiveSaleDto[];

  @ApiProperty({ type: () => PaginationInfoDto })
  pagination!: PaginationInfoDto;
}
