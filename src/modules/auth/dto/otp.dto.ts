import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';

export class SendOtpDto {
  @ApiPropertyOptional({
    description: 'Send the OTP on the registered phone number',
    required: true,
    example: '+92-300-1234567',
  })
  @IsString()
  @IsPhoneNumber('PK')
  @Length(15, 15)
  phoneNumber: string;
}

export class VerifyOtpDto {
  @ApiPropertyOptional({ description: 'Enter phone number', required: true, example: '+92-300-1234567' })
  @IsPhoneNumber('PK')
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Enter OTP received on your phone number', required: true })
  @IsString()
  @Length(4, 6)
  otp: string;

  @ApiPropertyOptional({ description: 'Enter your first name', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Enter your last name', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;
}
