import { Controller, Get, Param, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ConditionsService } from './conditions.service';
import { AreasService } from './areas.service';
import { BrandsService } from './brands.service';
import { PaginationSearchQueryDto } from '../../common/dtos/pagination-search-query.dto';
import { ApiParam } from '@nestjs/swagger';
import { CityQueryDto } from './dtos/cities.dto';
import { BrandQueryDto } from './dtos/brands.dto';

@Controller('lookups')
export class LookupsController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly conditionsService: ConditionsService,
    private readonly areasService: AreasService,
    private readonly brandsService: BrandsService,
  ) {}

  //  CITIES APIs
  @Get('cities')
  async getCities(@Query() query: CityQueryDto) {
    return this.areasService.getCities(query);
  }

  @Get('active-for-delivery')
  async fetchCitiesActiveForDelivery() {
    return this.areasService.fetchCitiesActiveForDelivery();
  }

  @ApiParam({ name: 'cityName', required: true })
  @Get('active-for-delivery/:cityName')
  async isCityActiveForDelivery(@Param('cityName') cityName: string) {
    return this.areasService.isCityActiveForDelivery(cityName);
  }

  // Provinces APIs
  @Get('provinces')
  async getProvinces(@Query() query: PaginationSearchQueryDto) {
    return this.areasService.getProvinces(query);
  }

  // Conditions APIs
  @Get('conditions')
  async fetchAllConditions(@Query() query: PaginationSearchQueryDto) {
    return this.conditionsService.fetchAllConditions(query);
  }

  //Categories APIs
  @Get('categories')
  async fetchAllCategories(@Query() query: PaginationSearchQueryDto) {
    return this.categoriesService.fetchAllCategories(query);
  }

  @Get('listed-categories')
  async fetchListedCategories() {
    return this.categoriesService.fetchListedCategories();
  }

  //Brands APIs
  @Get('brands')
  async fetchAllBrands(@Query() query: BrandQueryDto) {
    return this.brandsService.fetchAllBrands(query);
  }

  @Get('listed-brands')
  async fetchListedBrandsByCategory(@Query() query: BrandQueryDto) {
    return this.brandsService.fetchListedBrandsByCategory(query);
  }

  @Get('nav-categories')
  async fetchListedBrandsForAllCategories() {
    return this.brandsService.fetchListedBrandsForAllCategories();
  }
  @Get('top-10-listed-brands')
  async fetchTop10ListedBrands() {
    return this.brandsService.fetchTop10ListedBrands();
  }
}
