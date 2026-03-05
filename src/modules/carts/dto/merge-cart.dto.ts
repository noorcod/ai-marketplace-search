import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class MergeCartDto {
  @ApiProperty({
    description: 'Guest cart ID to merge with authenticated user cart',
    example: 'a1b2c3d4-e5f6-7g8h-9i10-j11k12l13m14',
  })
  @IsNotEmpty()
  @IsUUID('4')
  guestCartId: string;
}
