import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FeaturedListingsDto {
  @ApiProperty({
    description: 'Number of listings to fetch',
    example: 10,
    required: false,
  })
  @IsOptional()
  count: number;

  @ApiProperty({
    description: 'The location at which the featured listings is going to be placed',
    enum: ['home-top', 'home-middle', 'home-bottom', 'plp-top', 'store-top'],
  })
  @IsOptional()
  place: 'home-top' | 'home-middle' | 'home-bottom' | 'plp-top' | 'store-top';

  @ApiProperty({
    description: 'Name of the city',
    example: 'Lahore',
    required: false,
  })
  @IsOptional()
  city: string;

  @ApiProperty({
    description: 'Category of the listing',
    example: 'mobiles',
    required: false,
  })
  @IsOptional()
  category: string;

  @ApiProperty({
    description: 'shop username to fetch shop specific listings',
    example: 'abc-store',
    required: false,
  })
  shopUsername: string;
}
