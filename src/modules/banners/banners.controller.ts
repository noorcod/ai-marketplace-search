import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BannersService } from './banners.service';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannerService: BannersService) {}

  @ApiOperation({ summary: 'Fetch Banners By Page and Source' })
  @ApiParam({ name: 'page', description: 'Page name', example: 'home' })
  @ApiQuery({ name: 'source', description: 'The source of request web / mobile', example: 'mobile' })
  @Get(':page')
  async fetchBannersByPage(@Param('page') page: string, @Query('source') source?: string) {
    return this.bannerService.fetchBannersByPage(page, source);
  }
}
