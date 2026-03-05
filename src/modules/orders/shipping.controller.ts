import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '@common/guards/optional-auth.guard';
import { ShippingService } from './shipping.service';
import { CalculateShippingDto } from './dto/shipping/calculate-shipping.dto';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { PaginationQueryDto } from '@common/dtos/pagination-query.dto';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @ApiOperation({ summary: 'Fetch Shipping Rates' })
  @ApiResponse({ status: 200, description: 'Shipping rates retrieved successfully' })
  @Get('rates')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  async fetchShippingRates(@Query() queryParams: PaginationQueryDto) {
    const { page, size } = queryParams;
    const paginationOptions = new PaginationOptions(page ?? 1, size ?? 10);
    return this.shippingService.fetchShippingRates(paginationOptions);
  }

  @ApiOperation({ summary: 'Calculate Shipping for Cart Items' })
  @ApiBody({ type: CalculateShippingDto })
  @ApiResponse({ status: 200, description: 'Shipping calculated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @Post('calculate')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  async calculateShipping(@Body() body: CalculateShippingDto) {
    return this.shippingService.calculateShipping(body);
  }
}
