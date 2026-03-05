import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';
export class DeliveryAddressDto {
  @ApiPropertyOptional({ description: 'Enter name', required: true, example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Enter email', required: true, example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Enter the phone number',
    required: true,
    example: '+92-300-0000000',
  })
  @IsString()
  @IsPhoneNumber('PK')
  @Length(15, 15)
  contact: string;

  @ApiPropertyOptional({
    description: 'Enter alternative phone number',
    required: false,
    example: '+92-300-0000000',
  })
  @IsOptional()
  @IsString()
  @IsPhoneNumber('PK')
  @Length(15, 15)
  alternativeNumber?: string;

  @ApiPropertyOptional({ description: 'Enter street address', required: true })
  @IsNotEmpty()
  @IsString()
  streetAddress: string;

  @ApiPropertyOptional({ description: 'Enter city', required: true })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiPropertyOptional({ description: 'Enter province', required: true })
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiPropertyOptional({ description: 'Enter country', required: true })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Enter near landmark', required: false })
  @IsOptional()
  @IsString()
  nearLandmark?: string;
}
