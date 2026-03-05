import { IsBoolean, IsDate, IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';

export class CreateUserDto {
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
  authType: string;

  @IsBoolean()
  isEmailVerified: boolean;

  @IsBoolean()
  isPhoneNumberVerified: boolean;

  @IsOptional()
  @IsDate()
  createdAt?: Date;
}
