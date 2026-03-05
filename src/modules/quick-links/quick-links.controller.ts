import { Controller, Get, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { QuickLinksService } from '@modules/quick-links/quick-links.service';
import {
  FetchQuickLinkDetailBySlugResponseDto,
  FetchQuickLinksGroupedByCategoryResponseDto,
  QuickLinksGroupedCategoryDto,
} from '@modules/quick-links/dtos/quick-links-response.dto';

@ApiTags('Quick Links')
@ApiExtraModels(QuickLinksGroupedCategoryDto)
@Controller('quick-links')
export class QuickLinksController {
  constructor(private readonly quickLinksService: QuickLinksService) {}

  @ApiOperation({ description: 'Fetch all quick links grouped by their categories' })
  @ApiOkResponse({ type: FetchQuickLinksGroupedByCategoryResponseDto })
  @Get('grouped-by-category')
  async fetchAllQuickLinksGroupedByCategory() {
    return this.quickLinksService.fetchAllQuickLinksGroupedByCategory();
  }

  @ApiOperation({ description: 'Fetch quick link detail by its slug' })
  @Get('')
  @ApiQuery({ name: 'slug', type: 'string', example: 'laptops-in-lahore' })
  @ApiOkResponse({ type: FetchQuickLinkDetailBySlugResponseDto })
  async fetchQuickLinkDetailBySlug(@Query('slug') slug: string) {
    return this.quickLinksService.fetchQuickLinkDetailBySlug(slug);
  }
}
