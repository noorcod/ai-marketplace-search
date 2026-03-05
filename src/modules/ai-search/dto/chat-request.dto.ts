import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({
    description: 'User message to the AI assistant',
    example: 'I need a gaming laptop under 100,000 PKR',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
