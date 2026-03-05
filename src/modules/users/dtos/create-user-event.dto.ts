import { IsBoolean, IsInt, IsIP, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserEventDto {
  @ApiPropertyOptional({
    description: 'The name of the event',
    required: true,
    type: String,
    example: 'contact-phone | contact-whatsapp | reserve | visit-store',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  eventName: string;

  @ApiPropertyOptional({
    description: 'The uuid of the user who performed the event',
    required: false,
    type: String,
    example: 'f4b4b3b8-3f8f-4e3b-8c1b-5f8f4e3b8c1b',
  })
  @IsString()
  @IsOptional()
  @Length(36, 36)
  userId: string;

  @IsIP()
  @IsOptional()
  ip: string;

  @ApiPropertyOptional({
    description: "The user is guest and didn't login",
    required: false,
    type: Boolean,
    example: true,
  })
  @IsBoolean()
  isGuest: boolean;

  @ApiPropertyOptional({
    description: 'The id of the listing, the user is viewing',
    required: false,
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  listingId?: number;

  @ApiPropertyOptional({
    description: 'The id of the model, the user is viewing',
    required: false,
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  modelId?: number;

  @ApiPropertyOptional({
    description: 'The id of the shop, the user is viewing',
    required: false,
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  shopId?: number;
}
