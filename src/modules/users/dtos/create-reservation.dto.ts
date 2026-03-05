import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiPropertyOptional({ description: 'Enter customer email', required: false })
  @IsOptional()
  @IsString()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Enter customer name', required: true })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiPropertyOptional({ description: 'Enter customer number', required: true })
  @IsPhoneNumber('PK')
  @IsNotEmpty()
  @IsString()
  @Length(11, 16)
  customerNumber: string;

  @ApiPropertyOptional({ description: 'Enter item Id', required: true })
  @IsNotEmpty()
  @IsInt()
  itemId: number;

  @ApiPropertyOptional({ description: 'Enter location Id', required: true })
  @IsNotEmpty()
  @IsInt()
  location: number;

  @ApiPropertyOptional({ description: 'Enter quantity', required: true })
  @IsNotEmpty()
  @IsInt()
  quantity: number;

  @ApiPropertyOptional({ description: 'Enter shop Id', required: true })
  @IsNotEmpty()
  @IsInt()
  shop: number;

  @ApiPropertyOptional({ description: 'Enter status', required: true })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ description: 'Enter listing Id', required: true })
  @IsNotEmpty()
  @IsInt()
  listing: number;

  @ApiPropertyOptional({ description: 'Enter customer Id', required: true })
  @IsNotEmpty()
  @IsString()
  customer: string;

  @IsOptional()
  @IsDate()
  createdAt: Date;

  @IsOptional()
  @IsBoolean()
  isCustomerNumberModified: boolean;
}
