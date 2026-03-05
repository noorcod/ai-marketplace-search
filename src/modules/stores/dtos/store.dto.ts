import { PaginationSearchQueryDto } from '@common/dtos/pagination-search-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, Matches } from 'class-validator';

const SORT_FIELDS = ['username', 'createdAt', 'shopName'];
const SORT_ORDERS = ['asc', 'desc'];
const SORT_OPTIONS = SORT_FIELDS.flatMap(field => SORT_ORDERS.map(order => `${field}:${order}`));

export class StoreQueryDto extends PaginationSearchQueryDto {
  @ApiPropertyOptional({
    description: 'Criteria for fetching shops',
    enum: ['most-listings', 'most-viewed', 'multi-category'],
    required: false,
  })
  @IsOptional()
  criteria!: 'most-listings' | 'most-viewed' | 'multi-category';

  @ApiPropertyOptional({
    description: 'Category Id',
    required: false,
  })
  @IsOptional()
  categoryId: string;

  @ApiPropertyOptional({
    description: 'City Id',
    required: false,
  })
  @IsOptional()
  cityId: string;

  @ApiPropertyOptional({
    required: false,
    description: 'Sort by field and order (e.g., "username:asc" or "username:desc")',
    enum: SORT_OPTIONS,
  })
  @IsOptional()
  @IsIn(SORT_OPTIONS, {
    message: `sort must be one of: ${SORT_OPTIONS.join(', ')}`,
  })
  sort: string;
}
