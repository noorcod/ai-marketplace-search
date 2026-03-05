import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@common/decorators/user.decorator';
import { CheckoutDto } from './dto/checkout/checkout.dto';
import { OptionalJwtAuthGuard } from '@common/guards/optional-auth.guard';
import { CheckoutService } from './services/checkout.service';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @ApiOperation({ summary: 'Perform Checkout' })
  @ApiBody({ type: CheckoutDto })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or validation failed' })
  @ApiResponse({ status: 404, description: 'Cart items not found' })
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  async checkout(@User('userId') userId: string, @Body() checkoutDto: CheckoutDto) {
    return this.checkoutService.processCheckout(userId, checkoutDto);
  }
}
