import { PaginationQueryDto } from '@common/dtos/pagination-query.dto';

/**
 * DTO for fetching related models
 * Uses only pagination parameters
 */
export class RelatedModelsQueryDto extends PaginationQueryDto {
  // Inherits: page, size
}
