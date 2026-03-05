import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoreQueryDto } from './dtos/store.dto';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { ThemeConfigDto } from './dtos/theme-config.dto';
import { OptionalJwtAuthGuard } from '@common/guards/optional-auth.guard';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('')
  async fetchStores(@Query() query: StoreQueryDto) {
    const { criteria, categoryId, cityId, search, page, size, sort } = query;
    const filters = { categoryId, cityId, search };
    const pagination = new PaginationOptions(page || 1, size || 10);
    const options = { criteria, sort };
    return this.storesService.fetchStores(filters, pagination, options);
  }

  @ApiParam({ name: 'username', description: 'Enter Shop username', required: true })
  @ApiQuery({ name: 'city', description: 'Enter City Name', required: false })
  @Get(':username')
  async fetchByUsername(@Param('username') username: string, @Query('city') city?: string) {
    return this.storesService.fetchByUsername(username, city);
  }

  @ApiParam({ name: 'username', description: 'Enter Shop username', required: true })
  @ApiHeader({
    name: 'X-Forwarded-For',
    description: 'Client IP for testing (overrides actual client IP) - used for testing purposes (i.e. 192.168.100.1)',
    required: false,
    schema: { type: 'string' },
  })
  @Get(':username/cell-number')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  async fetchShopCellNumberByUsername(@Param('username') username: string, @Req() req: Request) {
    const userIp = (req.headers['x-forwarded-for'] || req.ip) as string;
    return this.storesService.fetchShopContactInformationByUsername(username, { ip: userIp, userInfo: req.user });
  }

  // TODO: Store Filters -- Queries (category, city)
  // Response {
  //   categories: {
  //     key: 'category_id',
  //     label: 'Category',
  //     inputType: 'radio',
  //     values: filters['categories']
  //   },
  //   cities: {
  //     key: 'city_id',
  //     label: 'City',
  //     inputType: 'radio',
  //     values: filters['cities']
  //   }
  // }

  @Get('/:username/verify')
  async verifyStoreLogin(@Param('username') username: string, @Query('token') token: string) {
    return this.storesService.verityShopLogin(username, token);
  }

  @ApiOperation({ summary: 'add shop configuration' })
  @ApiParam({ name: 'shopId', description: 'Enter the id of shop' })
  @Post('/banner/:shopId')
  async addShopConfiguration(@Param('shopId') shopId: number, @Body() body: ThemeConfigDto) {
    return await this.storesService.addShopConfiguration(shopId, body);
  }
}
