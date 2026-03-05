import { PaginationQueryDto } from '@common/dtos/pagination-query.dto';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class MostViewedListingsDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'Number of most viewed listings to fetch',
    minimum: 10,
    maximum: 100,
    default: 10,
    type: Number,
  })
  @IsNotEmpty({ message: 'Count is required' })
  @IsNumber({}, { message: 'Count must be a valid number' })
  @Min(10, { message: 'Count must be at least 10' })
  @Max(100, { message: 'Count cannot exceed 100' })
  @Type(() => Number)
  count!: number;
  @ApiPropertyOptional({ description: 'Category Name', required: false })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional({ description: 'City Name', required: false })
  @IsOptional()
  @IsString()
  cityName?: string;

  @ApiPropertyOptional({ description: 'Shop User Name', required: false })
  @IsOptional()
  @IsString()
  shopUsername?: string;

  @ApiPropertyOptional({ description: 'Brand Name', required: false })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Condition Name', required: false })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({ description: 'Min Price', required: false, type: Number })
  @IsOptional()
  @IsNumber({}, { message: 'Min price must be a valid number' })
  @Min(0, { message: 'Min price cannot be negative' })
  @Max(1000000, { message: 'Min price cannot exceed 1,000,000' })
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Max Price', required: false, type: Number })
  @IsOptional()
  @IsNumber({}, { message: 'Max price must be a valid number' })
  @Min(0, { message: 'Max price cannot be negative' })
  @Max(1000000, { message: 'Max price cannot exceed 1,000,000' })
  @Type(() => Number)
  maxPrice?: number;
}
