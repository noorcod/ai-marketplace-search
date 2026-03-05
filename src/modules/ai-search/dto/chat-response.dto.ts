import { ApiProperty } from '@nestjs/swagger';

export class ChatResponseDto {
  @ApiProperty({
    description: 'AI assistant reply',
    example: 'Here are some great gaming laptops within your budget...',
  })
  reply: string;

  @ApiProperty({
    description: 'Array of matching products',
    type: 'array',
    items: { type: 'object' },
  })
  products: any[];

  @ApiProperty({
    description: 'Session ID for conversation continuity',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Follow-up question if more information is needed',
    example: 'What is your budget range?',
    nullable: true,
  })
  followUpQuestion: string | null;
}
