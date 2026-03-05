import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { PaginationQueryDto } from '@common/dtos/pagination-query.dto';
import { OptionalJwtAuthGuard } from '@common/guards/optional-auth.guard';
import { VouchersService } from './vouchers.service';
import { ValidateVoucherDto } from './dto/vouchers/validate-voucher.dto';
import { VoucherValidationResponseDto } from './dto/vouchers/voucher-validation-response.dto';

@ApiTags('Vouchers')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @ApiOperation({ summary: 'Fetch Available Vouchers' })
  @ApiResponse({ status: 200, description: 'Vouchers retrieved successfully' })
  @Get()
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  async fetchAllVouchers(@Query() queryParams: PaginationQueryDto) {
    const { page, size } = queryParams;
    const paginationOptions = new PaginationOptions(page ?? 1, size ?? 10);
    return this.vouchersService.fetchAllVouchers(paginationOptions);
  }

  @ApiOperation({ summary: 'Validate Voucher Code' })
  @ApiBody({ type: ValidateVoucherDto })
  @ApiResponse({
    status: 200,
    description: 'Voucher validation result',
    type: VoucherValidationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  @ApiResponse({ status: 400, description: 'Voucher validation failed' })
  @Post('validate')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  async validateVoucher(@Body() body: ValidateVoucherDto) {
    const { code, ...validationData } = body;
    return this.vouchersService.fetchVoucherByCodeWithValidation(code, validationData);
  }
}
