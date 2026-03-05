import { PaginationQueryDto } from './pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class PaginationSearchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 100) // We can adjust length as needed
  search?: string;
}
