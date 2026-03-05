import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class SectionListingsDto {
  @ApiProperty({
    description: 'Section name to fetch listings from',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  sectionName: string;

  @ApiProperty({
    description: 'List of listing IDs for this section',
    type: Number,
    isArray: true,
    example: [1, 2, 3, 4],
    required: true,
  })
  @IsNotEmpty()
  @IsInt({ each: true })
  sectionItems: number[];
}
