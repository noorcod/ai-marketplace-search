import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsOptional, IsDate } from 'class-validator';

export class CreateUserWishlistDto {
  @ApiPropertyOptional({ description: 'Enter listing id', required: true })
  @IsNotEmpty()
  @IsInt()
  listingId: number;

  @IsOptional()
  @IsDate()
  createdAt: Date;
}
