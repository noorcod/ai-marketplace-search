import { IsDate, IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';

export class BecomeSellerDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsPhoneNumber('PK')
  @IsNotEmpty()
  @IsString()
  @Length(15, 15)
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  shopName?: string;

  @IsNotEmpty()
  @IsString()
  inquiry: string;

  @IsOptional()
  @IsDate()
  createdAt?: Date;
}
