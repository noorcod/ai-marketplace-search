import { OmitType } from '@nestjs/swagger';
import { ModelFiltersQueryDto } from './model-filters-query.dto';

/**
 * DTO for fetching a specific filter by name
 * Inherits all filter properties from ModelFiltersQueryDto for interdependent filtering
 */
export class ModelFilterByNameDto extends OmitType(ModelFiltersQueryDto, [] as const) {
  // Inherits: page, size, search, categoryName, and all filter properties
  // filterName comes from path parameter, not from DTO
}
