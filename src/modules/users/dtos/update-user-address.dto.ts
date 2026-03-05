import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserAddressDto {
  @ApiPropertyOptional({ description: 'Address tag ID' })
  @IsOptional()
  @IsNumber()
  tagId?: number;

  @ApiPropertyOptional({ description: 'Street address' })
  @IsOptional()
  @IsString()
  streetAddress?: string;

  @ApiPropertyOptional({ description: 'City ID' })
  @IsOptional()
  @IsNumber()
  cityId?: number;

  @ApiPropertyOptional({ description: 'City name' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Province ID' })
  @IsOptional()
  @IsNumber()
  provinceId?: number;

  @ApiPropertyOptional({ description: 'Province name' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ description: 'Country name' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Is main address' })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  @ApiPropertyOptional({ description: 'Near landmark' })
  @IsOptional()
  @IsString()
  nearLandmark?: string;

  @ApiPropertyOptional({ description: 'Zip code (max 5 characters)' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  zipCode?: string;
}
