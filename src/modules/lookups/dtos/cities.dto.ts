import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationSearchQueryDto } from 'src/common/dtos/pagination-search-query.dto';

export class CityQueryDto extends PaginationSearchQueryDto {
  @ApiPropertyOptional({ description: 'Province ID', required: false })
  @IsOptional()
  @IsString()
  provinceId?: number;
}
