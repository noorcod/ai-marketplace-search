import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UserAddressDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Add tag ID', required: true })
  @IsNotEmpty()
  @IsNumber()
  tagId: number;

  @ApiPropertyOptional({ description: 'Enter street address', required: true })
  @IsNotEmpty()
  @IsString()
  streetAddress: string;

  @ApiPropertyOptional({ description: 'Enter city ID', required: true })
  @IsNotEmpty()
  @IsNumber()
  cityId: number;

  @ApiPropertyOptional({ description: 'Enter city', required: true })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiPropertyOptional({ description: 'Enter province ID', required: true })
  @IsNotEmpty()
  @IsNumber()
  provinceId: number;

  @ApiPropertyOptional({ description: 'Enter province', required: true })
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiPropertyOptional({ description: 'Enter country', required: true })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Is main address', required: true })
  @IsNotEmpty()
  @IsBoolean()
  isMain?: boolean = false;

  @ApiPropertyOptional({ description: 'Enter near landmark', required: true })
  @IsNotEmpty()
  @IsString()
  nearLandmark: string;

  @ApiPropertyOptional({ description: 'Enter zip code', required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5)
  zipCode: string;

  @IsOptional()
  @IsDate()
  createdAt?: Date;
}
