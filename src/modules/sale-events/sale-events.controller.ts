import { Controller, Get, Param } from '@nestjs/common';
import { SaleEventsService } from '@modules/sale-events/sale-events.service';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { FetchActiveSalesResponseDto } from '@modules/sale-events/dtos/fetch-active-sales-response.dto';
import { FetchSaleByNameResponseDto } from '@modules/sale-events/dtos/fetch-sale-by-name-response.dto';

@ApiTags('Sale Events')
@Controller('sale-events')
export class SaleEventsController {
  constructor(private readonly saleEventsService: SaleEventsService) {}

  @ApiOperation({ summary: 'Fetch active sale events (10 most recent)' })
  @ApiOkResponse({ type: FetchActiveSalesResponseDto })
  @Get('')
  async fetchActiveSales() {
    return this.saleEventsService.fetchAllSales();
  }

  @ApiOperation({ summary: 'Fetch sale event by name' })
  @ApiParam({ name: 'name', type: 'string', example: '11-11-sale' })
  @ApiOkResponse({ type: FetchSaleByNameResponseDto })
  @Get(':name')
  async fetchSaleByName(@Param('name') name: string) {
    return this.saleEventsService.fetchSaleByName(name);
  }
}
