import { IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateListingReviewDto {
  @ApiProperty({ description: 'ID of the listing review', example: 1 })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ description: 'ID of the listing', example: 101 })
  @IsNumber()
  listing: number;

  @ApiProperty({
    description: 'UUID of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4')
  user?: string;

  @ApiProperty({ description: 'ID of the order', example: 202 })
  @IsNumber()
  order: number;

  @ApiProperty({ description: 'Rating given by the user', example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review text provided by the user', example: 'Great product!' })
  @IsOptional()
  @IsString()
  review?: string;
}
