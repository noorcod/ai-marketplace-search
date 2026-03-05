import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class TopDiscountedListingsQueryDto {
  @ApiPropertyOptional({
    name: 'count',
    description: 'Enter the number of listings to fetch',
    required: false,
    default: 20,
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Count must be a valid number' })
  @Min(10, { message: 'Count must be at least 10' })
  @Max(100, { message: 'Count cannot exceed 100' })
  @Type(() => Number)
  count?: number;

  @ApiPropertyOptional({
    name: 'criteria',
    description: 'Enter the criteria to fetch listings (mixed or category)',
    required: false,
    enum: ['mixed', 'category'],
    default: 'mixed',
  })
  @IsOptional()
  @IsEnum(['mixed', 'category'], { message: 'Criteria must be either "mixed" or "category"' })
  criteria?: 'mixed' | 'category';

  @ApiPropertyOptional({
    name: 'category',
    description: 'Enter the category name to fetch listings from a specific category',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    name: 'city',
    description: 'Enter the city name to fetch listings from a specific city',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;
}
