import { Controller, Get, Param, Query, UseGuards, Patch, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { User } from '@common/decorators/user.decorator';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { UpdateOrderDto } from './dto/orders/update-order.dto';
import { FetchOrdersQueryDto } from './dto/orders/fetch-orders-query.dto';
import { OrderListResponseDto, OrderResponseDto } from './dto/orders/order-response.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({
    summary: 'Fetch Orders for Signed In User',
    description:
      'Retrieve a paginated list of orders for the authenticated user. Supports filtering by status, order number, and payment method.',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    type: OrderListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'size', required: false, type: Number, example: 10, description: 'Items per page (default: 10)' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'Pending',
      'Verifying Payment',
      'Payment Failed',
      'In Progress',
      'Partially Fulfilled',
      'Completed',
      'Cancelled',
    ],
    description: 'Filter by order status',
  })
  @ApiQuery({ name: 'orderNumber', required: false, type: String, description: 'Search by order number' })
  @ApiQuery({
    name: 'paymentMethod',
    required: false,
    enum: ['Cash', 'Card', 'Bank Transfer', 'BNPL', 'Raast'],
    description: 'Filter by payment method',
  })
  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async fetchAllOrders(@Query() queryParams: FetchOrdersQueryDto, @User('userId') userId: string) {
    const { page, size, ...rest } = queryParams || {};
    const paginationOptions = new PaginationOptions(page ?? 1, size ?? 10);
    return this.ordersService.fetchAllDeliveryOrders(userId, paginationOptions, rest);
  }

  @ApiOperation({
    summary: 'Fetch Order by Order Number',
    description:
      'Retrieve detailed information about a specific order including all order sources, items, delivery address, and payment details.',
  })
  @ApiParam({
    name: 'orderNumber',
    description: 'Unique order number (format: TB-XXXXXXXXXXXXX-X)',
    type: String,
    example: 'TB-1234567890123-1',
  })
  @ApiResponse({
    status: 200,
    description: 'Order details retrieved successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found - No order exists with the provided order number',
  })
  @Get(':orderNumber')
  async fetchOrderByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.fetchDeliveryOrderByOrderNumber(orderNumber);
  }

  @ApiOperation({
    summary: 'Update Order Data',
    description:
      'Update order status and payment transaction details. Primarily used by payment gateway callbacks and admin operations.',
  })
  @ApiParam({
    name: 'orderNumber',
    description: 'Unique order number to update',
    type: String,
    example: 'TB-1234567890123-1',
  })
  @ApiResponse({
    status: 200,
    description: 'Order updated successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found - No order exists with the provided order number',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid order status or transaction status',
  })
  @Patch(':orderNumber')
  async updateOrder(@Param('orderNumber') orderNumber: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.updateOrderData(orderNumber, updateOrderDto);
  }
}
