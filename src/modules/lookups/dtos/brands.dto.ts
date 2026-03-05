import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationSearchQueryDto } from 'src/common/dtos/pagination-search-query.dto';

export class BrandQueryDto extends PaginationSearchQueryDto {
  @ApiPropertyOptional({ description: 'Category Id', required: false })
  @IsOptional()
  @IsString()
  categoryId?: number;
}
export type TopBrand = {
  id: number;
  label: string;
  logo: string;
  total_listings: number;
  category_id: number;
  category: string;
};
