import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { LegacyOrdersService } from './legacy-orders.service';
import { ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PaginationQueryDto } from '@common/dtos/pagination-query.dto';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@common/decorators/user.decorator';
import { UpdateLegacyOrderDto } from './dto/update-legacy-order.dto';
import { ReCaptchaGuard } from '@common/guards/reCaptcha.guard';
import { CreateLegacyOrderDto } from './dto/create-legacy-order.dto';
import { HashVerificationGuard } from '@common/guards/hash-verification.guard';
import { SendOtpDto, VerifyOtpDto } from '@modules/auth/dto/otp.dto';

@Controller('legacy-orders')
export class LegacyOrdersController {
  constructor(private readonly legacyOrdersService: LegacyOrdersService) {}

  @ApiOperation({ summary: 'Fetch Delivery Charges' })
  @Get('delivery-charges')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async fetchAllDeliveryCharges(@Query() queryParams: PaginationQueryDto) {
    const { page, size } = queryParams;
    const paginationOptions = new PaginationOptions(page ?? 1, size ?? 10);
    return this.legacyOrdersService.fetchAllDeliveryCharges(paginationOptions);
  }

  @ApiOperation({ summary: 'Fetch voucher details' })
  @Get('voucher/:code')
  async fetchVoucherDetails(@Param('code') voucherCode: string) {
    return this.legacyOrdersService.fetchVoucherDetails(voucherCode);
  }

  @ApiParam({ name: 'id', description: 'Enter the id of user' })
  @ApiOperation({ summary: 'Fetch Delivery Orders of User' })
  @Get('/')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async fetchAllDeliveryOrders(@Query() queryParams, @User('userId') userId: string) {
    const { page, size, ...queryStrings } = queryParams;
    const paginationOptions = new PaginationOptions(page ?? 1, size ?? 10);
    return this.legacyOrdersService.fetchAllDeliveryOrders(userId, paginationOptions, queryStrings);
  }

  @ApiOperation({ summary: 'Add Delivery Orders of User' })
  @Post('/')
  // @UseGuards(ReCaptchaGuard, AuthGuard('jwt'), HashVerificationGuard)
  // @ApiBearerAuth()
  async addDeliveryOrders(@Body() deliveryOrderObj: CreateLegacyOrderDto) {
    if (deliveryOrderObj.hasOwnProperty('userType')) {
      delete deliveryOrderObj['userType'];
    }
    if (deliveryOrderObj.hasOwnProperty('token')) {
      delete deliveryOrderObj['token'];
    }
    return this.legacyOrdersService.addDeliveryOrder(deliveryOrderObj);
  }

  @ApiOperation({ summary: 'Send an otp to user mobile for verification' })
  @Post('send-otp')
  async sendOtpToUser(@Body() body: SendOtpDto, @Req() req: Request) {
    const { phoneNumber: phoneNumber } = body;
    return this.legacyOrdersService.sendOtpToUser(phoneNumber, req);
  }

  @ApiOperation({ summary: 'Verify user mobile number' })
  @Post('verify-otp')
  async verifyUserMobile(@Body() data: VerifyOtpDto, @Req() req: Request) {
    const { phoneNumber, otp } = data;
    return this.legacyOrdersService.verifyUserMobile(phoneNumber, otp, req);
  }

  @ApiOperation({ summary: 'fetch Delivery Orders by order number' })
  @Get(':orderNumber')
  async fetchDeliveryOrderByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.legacyOrdersService.fetchDeliveryOrderByOrderNumber(orderNumber);
  }

  @ApiOperation({ summary: 'Update order data' })
  @Patch(':orderNumber')
  async updateOrderData(@Param('orderNumber') orderNumber: string, @Body() updateOrderObj: UpdateLegacyOrderDto) {
    return this.legacyOrdersService.updateOrderData(orderNumber, updateOrderObj);
  }
}
