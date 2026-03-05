import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ModelsService } from './models.service';
import { PaginationOptions } from '../../common/utilities/pagination-options';
import {
  AccessoryTypeDto,
  ModelDetailDto,
  ModelFilterByNameDto,
  ModelFiltersQueryDto,
  ModelListItemDto,
  ModelsFiltersResponseDto,
  ModelsQueryDto,
  ModelVariantDto,
  ModelVariantsQueryDto,
  RelatedModelsQueryDto,
  SingleModelsFilterResponseDto,
} from './dtos';

@ApiTags('Models')
@Controller('models')
export class ModelsController {
  constructor(private readonly modelService: ModelsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all models',
    description: 'Fetch a paginated list of models with optional filtering and sorting',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved models',
    type: [ModelListItemDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  async fetchAllModels(@Query() queryDto: ModelsQueryDto) {
    const { page = 1, size = 10, search, sort, categoryName, ...filters } = queryDto;
    const paginationOptions = new PaginationOptions(page, size);
    return this.modelService.findAll(categoryName, paginationOptions, search, sort, filters);
  }

  @Get('/accessory-types')
  @ApiOperation({
    summary: 'Get accessory types',
    description: 'Fetch all available accessory types',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved accessory types',
    type: [AccessoryTypeDto],
  })
  @ApiResponse({
    status: 404,
    description: 'No accessory types found',
  })
  async fetchAccessoryTypes() {
    return this.modelService.fetchAccessoryTypes();
  }

  @Get('/filters')
  @ApiOperation({
    summary: 'Get model filters',
    description: 'Fetch all available filters for models with their values',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved model filters',
    type: ModelsFiltersResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  async fetchModelFilters(@Query() queryDto: ModelFiltersQueryDto) {
    const { page = 1, size = 10, search, categoryName, source = 'mobile', perFilterMaxValues, ...filters } = queryDto;
    // Dynamic defaults aligned with listings: 10 for web, 5 for mobile
    const perFilterMax = perFilterMaxValues ?? (source === 'web' ? 10 : 5);
    return this.modelService.getAvailableFilters(categoryName, filters, perFilterMax, search);
  }

  @Get('/filters/:filterName')
  @ApiOperation({
    summary: 'Get specific model filter',
    description: 'Fetch values for a specific filter with optional interdependent filtering',
  })
  @ApiParam({
    name: 'filterName',
    description: 'Name of the filter to fetch',
    example: 'processor',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved filter values',
    type: SingleModelsFilterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Filter not found or no data available',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  async fetchModelFilterByName(@Param('filterName') filterName: string, @Query() queryDto: ModelFilterByNameDto) {
    const {
      page = 1,
      size = 10,
      search,
      categoryName,
      source, // exclude from filters
      perFilterMaxValues, // exclude from filters
      includeEmpty, // exclude from filters
      ...filters
    } = queryDto;
    return this.modelService.getFilterByName(filterName, categoryName, filters, page, size, search);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get model by ID',
    description: 'Fetch detailed information about a specific model',
  })
  @ApiParam({
    name: 'id',
    description: 'Model ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved model',
    type: ModelDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Model not found',
  })
  async fetchModelById(@Param('id', ParseIntPipe) id: number) {
    return this.modelService.findOne(id);
  }

  @Get(':id/related')
  @ApiOperation({
    summary: 'Get related models',
    description: 'Fetch models related to the specified model (same category and brand)',
  })
  @ApiParam({
    name: 'id',
    description: 'Model ID to find related models for',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved related models',
    type: [ModelListItemDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Model not found or no related models available',
  })
  async fetchRelatedModels(@Param('id', ParseIntPipe) id: number, @Query() queryDto: RelatedModelsQueryDto) {
    const { page = 1, size = 10 } = queryDto;
    const paginationOptions = new PaginationOptions(page, size);
    return this.modelService.fetchRelatedModels(id, paginationOptions);
  }

  @Get(':id/variants')
  @ApiOperation({
    summary: 'Get model variants',
    description: 'Fetch all variants of a specific model (same brand and model name)',
  })
  @ApiParam({
    name: 'id',
    description: 'Model ID to find variants for',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'name',
    description: 'Model name to fetch variants for',
    example: 'iPhone 15',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved model variants',
    type: [ModelVariantDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Model name is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Model not found or no variants available',
  })
  async fetchModelVariants(@Param('id', ParseIntPipe) id: number, @Query() queryDto: ModelVariantsQueryDto) {
    return this.modelService.fetchModelVariants(id, queryDto.name);
  }

  @Get(':id/listings-availability')
  @ApiOperation({
    summary: 'Get listings availability by model ID',
    description: 'Fetch availability information for listings based on model',
  })
  @ApiParam({
    name: 'id',
    description: 'Model ID to check listings availability for',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved listings availability',
  })
  @ApiResponse({
    status: 404,
    description: 'Model not found or no listings available',
  })
  async fetchListingsAvailabilityByModelId(@Param('id', ParseIntPipe) id: number) {
    return this.modelService.fetchListingsAvailabilityByModelId(id);
  }
}
