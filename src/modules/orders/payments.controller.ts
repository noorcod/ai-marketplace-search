import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApgService } from './apg.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly apgService: ApgService) {}

  @ApiOperation({ summary: 'APG Payment Webhook Listener' })
  @ApiResponse({ status: 200, description: 'Payment status updated successfully' })
  @Post('/apg/listener')
  async apgListener(@Query('url') url: string) {
    return this.apgService.listenAndUpdateOrderStatusAfterTrxnCompletion(url);
  }

  @ApiOperation({ summary: 'Get APG Transaction Status by Order Number' })
  @ApiParam({ name: 'orderNumber', description: 'Order Number', type: String })
  @ApiResponse({ status: 200, description: 'Transaction status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @Get('/apg/status/:orderNumber')
  async getTransactionStatus(@Param('orderNumber') orderNumber: string) {
    return this.apgService.apgTransactionStatus(orderNumber);
  }
}
