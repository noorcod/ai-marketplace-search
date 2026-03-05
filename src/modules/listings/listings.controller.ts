import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { RandomListingsQueryDto } from './dtos/random-listings.dto';
import { MostViewedListingsDto } from './dtos/most-viewed-listings.dto';
import { TopDiscountedListingsQueryDto } from './dtos/top-discounted-listings.dto';
import { SectionListingsDto } from './dtos/section-listings.dto';
import { FetchListingsByIdsDto } from './dtos/fetch-listings-by-ids.dto';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { FeaturedListingsDto } from './dtos/featured-listings.dto';
import { FeaturedListingsService } from './featured-listings.service';
import { ListingsQueryDto } from '@modules/listings/dtos/listings-query.dto';
import { ListingsFiltersDto } from './dtos/listings-filters.dto';
import { GetFilterByNameDto } from './dtos/get-filter-by-name.dto';
import { ListingsFilterService } from './listings-filter.service';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly featuredListingsService: FeaturedListingsService,
    private readonly listingsFilterService: ListingsFilterService,
  ) {}

  @ApiOperation({ summary: 'Fetch all listings' })
  @Get()
  async fetchAllListings(@Query() queryParams: ListingsQueryDto) {
    const { page, size, ...filters } = queryParams;
    const paginationOptions = new PaginationOptions(page, size);
    return this.listingsService.fetchAllListings(paginationOptions, filters);
  }

  @Get('random')
  async fetchRandomListings(@Query() query: RandomListingsQueryDto) {
    return this.listingsService.fetchRandomListings(query);
  }

  @Get('most-viewed')
  async fetchMostViewedListings(@Query() query: MostViewedListingsDto) {
    return this.listingsService.fetchMostViewedListings(query);
  }
  @Get('top-discounted')
  async fetchTopDiscountedListings(@Query() query: TopDiscountedListingsQueryDto) {
    return this.listingsService.fetchTopDiscountedListings(query);
  }

  @Post('theme-sections')
  async fetchListingsBySections(@Body() body: SectionListingsDto[]) {
    return this.listingsService.fetchListingsForSections(body);
  }

  @ApiOperation({ summary: 'Fetch Featured Listings' })
  @Get('featured')
  async fetchFeaturedListings(@Query() query: FeaturedListingsDto) {
    // const { place, city, count, category, shopId } = queryParams;
    return this.featuredListingsService.fetchFeaturedListings(query);
  }

  @ApiOperation({ summary: 'Fetch multiple listings by their IDs' })
  @Post('by-ids')
  async fetchListingsByIds(@Body() body: FetchListingsByIdsDto) {
    return this.listingsService.fetchListingsByIds(body);
  }

  @ApiOperation({
    summary: 'Fetch available filters for Listings',
    description: 'Returns all available filters with their values based on current context and applied filters',
  })
  @Get('filters')
  async fetchAvailableFilters(@Query() queryParams: ListingsFiltersDto) {
    return await this.listingsFilterService.getAvailableFilters(queryParams);
  }

  @ApiOperation({
    summary: 'Fetch filter values by name',
    description:
      'Returns values for a specific filter with optional search and category context, considering all applied filters',
  })
  @ApiParam({ name: 'filterName', description: 'Name of the filter to fetch values for' })
  @Get('filters/:filterName')
  async fetchFilterByName(@Param('filterName') filterName: string, @Query() queryParams: GetFilterByNameDto) {
    return await this.listingsFilterService.getFilterByName(filterName, queryParams);
  }

  /**
   * Fetch suggestions for a search query
   * @param search The search query string
   * @param limit The maximum number of suggestions to return
   * @returns A list of suggested listings matching the search query
   */
  @ApiOperation({ summary: 'Fetch search suggestions for listings' })
  @ApiQuery({ name: 'q', description: 'Search query string', required: true })
  @ApiQuery({ name: 'limit', description: 'Maximum number of suggestions to return', required: false })
  @Get('search/suggestions')
  async fetchSearchSuggestions(
    @Query('q') search: string,
    @Query('limit', new (require('@nestjs/common').DefaultValuePipe)(10), ParseIntPipe) limit: number,
  ) {
    return this.listingsService.fetchSearchSuggestions(search, limit);
  }

  @ApiOperation({
    summary: 'Search filter suggestions',
    description: 'Returns filter suggestions based on search query',
  })
  @Get('filters/search/suggestions')
  async getFilterSuggestions(
    @Query('q') search: string,
    @Query('categoryName') categoryName?: string,
    @Query('limit') limit: number = 10,
  ) {
    return await this.listingsFilterService.getFilterSuggestions(search, categoryName, limit);
  }

  @ApiParam({ name: 'id', description: 'Enter the id of listing' })
  @Get(':id')
  async fetchListingDetail(@Param('id', ParseIntPipe) listingId: number) {
    return this.listingsService.fetchListingDetailById(listingId);
  }

  @ApiOperation({ summary: 'Fetch Related Items for Product Detail Page' })
  @ApiParam({ name: 'id', description: 'Enter the id of item' })
  @Get(':id/related')
  async fetchRelatedItems(@Param('id', ParseIntPipe) id: number, @Query() queryParams: any) {
    const currentPage = queryParams.page;
    const perPage = queryParams.size;
    const paginationOptions = new PaginationOptions(currentPage, perPage);
    return this.listingsService.fetchRelatedProducts(id, paginationOptions);
  }
}
