import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ModelVariantsQueryDto {
  @ApiProperty({
    description: 'Model name to fetch variants for',
    example: 'iPhone 15',
    required: true,
  })
  @IsNotEmpty({ message: 'Model name is required' })
  @IsString()
  name: string;
}
