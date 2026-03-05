import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize, ArrayMaxSize, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class FetchListingsByIdsDto {
  @ApiProperty({
    description: 'Array of listing IDs to fetch',
    type: [Number],
    example: [1, 2, 3, 4, 5],
    minimum: 1,
    maximum: 50,
  })
  @IsArray({ message: 'IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one listing ID is required' })
  @ArrayMaxSize(50, { message: 'Cannot fetch more than 50 listings at once' })
  @IsInt({ each: true, message: 'All IDs must be valid integers' })
  @Type(() => Number)
  ids: number[];

  @ApiProperty({
    description: 'Include listingPrice relation for cost price data',
    type: Boolean,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeListingPrice?: boolean = false;
}
