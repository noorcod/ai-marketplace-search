import { QueryOptions, QueryWhere } from '@common/interfaces/repository.interface';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Temporal } from '@js-temporal/polyfill';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { VouchersRepository } from './repositories/vouchers.repository';
import { VoucherConditionsRepository } from './repositories/voucher-conditions.repository';
import { VoucherUsageLogRepository } from './repositories/voucher-usage-log.repository';
import { AppResponse } from '@common/responses/app-response';
import { Voucher } from './entities/voucher.entity';
import {
  VoucherCondition,
  VoucherConditionConditionType,
  VoucherConditionOperator,
} from './entities/voucher-condition.entity';
import { nestedObjectToDotFields } from '@common/utilities/nested-object-to-dot-fields';
import { VOUCHER_POPULATE } from '@common/constants/populate-tables.constants';

type VoucherValidationData = {
  userId?: string;
  cityId?: number;
  categoryIds?: number[];
  productIds?: number[];
  shopId?: number;
  orderAmount?: number;
  paymentMethod?: string;
};

@Injectable()
export class VouchersService {
  private readonly logger = new Logger(VouchersService.name);

  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly vouchersRepository: VouchersRepository,
    private readonly voucherConditionsRepository: VoucherConditionsRepository,
    private readonly voucherUsageLogRepository: VoucherUsageLogRepository,
  ) {}

  async fetchAllVouchers(pagination: PaginationOptions) {
    try {
      const where: QueryWhere = { isActive: true, isDeleted: false };
      const voucherPopulatedTable = nestedObjectToDotFields(VOUCHER_POPULATE);
      const options: QueryOptions = {
        populate: voucherPopulatedTable,
        limit: pagination.limit(),
        offset: pagination.offset(),
      };
      const vouchers = await this.vouchersRepository.fetch(where, options);
      if (!vouchers.success || !vouchers.data) {
        return AppResponse.Err('No vouchers found') as AppResponse<Partial<Voucher>[]>;
      }
      return AppResponse.fromDataLayer(vouchers) as AppResponse<Partial<Voucher>[]>;
    } catch (error) {
      this.logger.error(`Error fetching vouchers: ${error.message}`, error.stack);
      return AppResponse.Err('Failed to fetch vouchers') as AppResponse<Partial<Voucher>[]>;
    }
  }

  async fetchVoucherByCodeWithValidation(voucherCode: string, validationData?: VoucherValidationData) {
    try {
      const where: QueryWhere<Voucher> = {
        voucherCode: voucherCode,
        isActive: true,
        isDeleted: false,
      };
      const voucherPopulatedTable = nestedObjectToDotFields(VOUCHER_POPULATE);
      const options: QueryOptions = {
        populate: voucherPopulatedTable,
      };
      const voucherResult = await this.vouchersRepository.fetchOne(where, options);
      if (!voucherResult.success || !voucherResult.data) {
        return AppResponse.Err('Voucher not found', HttpStatus.NOT_FOUND);
      }

      const voucherEntity = voucherResult.data as Voucher;

      // Fetch usage counts: total and unique users (unique computed in-memory)
      let totalUsageCount = 0;
      let uniqueUserCount = 0;
      try {
        totalUsageCount = await this.voucherUsageLogRepository.count({ voucher: voucherEntity.id });

        // fallback to fetching userIds if repository doesn't support distinct count
        const usageRes = await this.voucherUsageLogRepository.fetch(
          { voucher: voucherEntity.id },
          { populate: ['user'] },
        );
        if (usageRes.success && usageRes.data) {
          const raw = usageRes.data as unknown;
          const rows: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
          const users = rows.map(r => r.user?.id).filter(Boolean);
          uniqueUserCount = new Set(users).size;
        }
      } catch (e) {
        this.logger.warn(`Failed to fetch voucher usage info for voucher=${voucherEntity.id}: ${e.message}`);
      }

      // If caller provided validation data (e.g., logged-in user info, order amount, etc.)
      // delegate to fetchVoucherById which already runs full validation (dates, conditions, usage limits)
      if (validationData) {
        const detailed = await this.fetchVoucherById(voucherEntity.id, validationData);
        if (!detailed.success) {
          return AppResponse.Err(detailed.message || 'Voucher validation failed', HttpStatus.BAD_REQUEST);
        }

        const detailedData = detailed.data as any;
        const calculatedDiscount = detailedData.calculatedDiscount;

        // Return simplified response
        const simplifiedResponse = {
          id: voucherEntity.id,
          code: voucherEntity.voucherCode,
          isValid: detailedData.isValid,
          type: voucherEntity.voucherType,
          discountAmount: calculatedDiscount?.discountAmount || 0,
          orderAmount: calculatedDiscount?.originalAmount || validationData.orderAmount,
          finalAmount: calculatedDiscount?.finalAmount || validationData.orderAmount,
          freeShipping: voucherEntity.voucherType === 'FREE_SHIPPING',
          minOrderAmount: voucherEntity.minOrderAmount ? Number(voucherEntity.minOrderAmount) : undefined,
          cappedAmount: voucherEntity.cappedAmount ? Number(voucherEntity.cappedAmount) : undefined,
          expiryDate: voucherEntity.expiryDate,
          message: detailedData.isValid ? 'Voucher is valid and can be applied' : 'Voucher validation failed',
          errors: detailedData.validationErrors || undefined,
        };

        return AppResponse.Ok(simplifiedResponse);
      }

      // No validation data provided — perform basic validity checks (dates + global usage)
      const validationErrors: string[] = [];
      let isValid = true;

      const dateError = this.getVoucherDateValidationError(voucherEntity);
      if (dateError) {
        isValid = false;
        validationErrors.push(dateError);
      }

      if (voucherEntity.maxGlobalUsage) {
        try {
          if (totalUsageCount >= Number(voucherEntity.maxGlobalUsage)) {
            isValid = false;
            validationErrors.push('Voucher has reached maximum global usage limit');
          }
        } catch (e) {
          this.logger.warn(`Error checking global usage limit for voucher=${voucherEntity.id}: ${e.message}`);
        }
      }

      // Return simplified response for basic validation (no validation data provided)
      const simplifiedResponse = {
        id: voucherEntity.id,
        code: voucherEntity.voucherCode,
        isValid,
        type: voucherEntity.voucherType,
        minOrderAmount: voucherEntity.minOrderAmount ? Number(voucherEntity.minOrderAmount) : undefined,
        cappedAmount: voucherEntity.cappedAmount ? Number(voucherEntity.cappedAmount) : undefined,
        expiryDate: voucherEntity.expiryDate,
        message: isValid ? 'Voucher is valid' : 'Voucher validation failed',
        errors: validationErrors.length ? validationErrors : undefined,
      };

      return AppResponse.Ok(simplifiedResponse);
    } catch (error) {
      this.logger.error(`Error fetching voucher: ${error.message}`, error.stack);
      return AppResponse.Err('Failed to fetch voucher', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  /**
   * Fetch voucher by ID with condition validation
   */
  async fetchVoucherById(voucherId: number, validationData?: VoucherValidationData) {
    try {
      this.logger.debug(`fetchVoucherById called for voucher ID: ${voucherId}`);

      // Fetch voucher
      const voucherWhere: QueryWhere<Voucher> = {
        id: voucherId,
        isDeleted: false,
        isActive: true,
      };

      const voucherResult = await this.vouchersRepository.fetchOne(voucherWhere);
      if (!voucherResult.success || !voucherResult.data) {
        this.logger.warn(`Voucher not found: ID=${voucherId}`);
        return AppResponse.Err('Voucher not found', HttpStatus.NOT_FOUND);
      }

      const voucher = voucherResult.data as Voucher;
      this.logger.debug(
        `Voucher found: code=${voucher.voucherCode}, type=${voucher.voucherType}, discountValue=${voucher.discountValue}, discountUnit=${voucher.discountUnit}`,
      );

      // Check expiry date
      const dateError = this.getVoucherDateValidationError(voucher);
      if (dateError) {
        this.logger.warn(`Voucher date validation failed: ${dateError}`);
        return AppResponse.Err(dateError, HttpStatus.BAD_REQUEST);
      }
      this.logger.debug(`Voucher date validation passed`);

      // Fetch voucher conditions
      const conditionsWhere: QueryWhere<VoucherCondition> = {
        voucher: voucherId,
      };
      const conditionsResult = await this.voucherConditionsRepository.fetch(conditionsWhere);
      const conditions = (conditionsResult.data || []) as VoucherCondition[];
      this.logger.debug(`Found ${conditions.length} conditions for voucher`);

      // If validation data is provided, validate conditions
      let isValid = true;
      const validationErrors: string[] = [];

      // Check minimum order amount first
      if (validationData?.orderAmount && voucher.minOrderAmount) {
        const minOrderAmount = Number(voucher.minOrderAmount);
        this.logger.debug(`Checking minimum order amount: ${validationData.orderAmount} >= ${minOrderAmount}`);
        if (validationData.orderAmount < minOrderAmount) {
          isValid = false;
          validationErrors.push(`Minimum order amount of ${minOrderAmount} not met`);
          this.logger.warn(`Minimum order amount validation failed: ${validationData.orderAmount} < ${minOrderAmount}`);
        } else {
          this.logger.debug(`Minimum order amount validation passed`);
        }
      }

      if (validationData && conditions.length > 0) {
        this.logger.debug(`Validating ${conditions.length} conditions...`);
        for (const condition of conditions) {
          const conditionValid = this.validateCondition(condition, validationData);
          this.logger.debug(
            `Condition ${condition.conditionType} validation: ${conditionValid.valid} - ${conditionValid.message}`,
          );
          if (!conditionValid.valid) {
            isValid = false;
            validationErrors.push(conditionValid.message);
          }
        }
      }

      // Check usage limits if userId is provided
      let usageInfo: any = null;
      if (validationData?.userId) {
        this.logger.debug(`Checking usage limits for user: ${validationData.userId}`);
        const usageCheck = await this.checkUsageLimits(voucherId, validationData.userId, voucher);
        this.logger.debug(`Usage check result: valid=${usageCheck.valid}, message=${usageCheck.message}`);
        if (!usageCheck.valid) {
          isValid = false;
          validationErrors.push(usageCheck.message);
        }
        usageInfo = usageCheck.data;
      }

      this.logger.debug(`Overall validation status: isValid=${isValid}, errors=${JSON.stringify(validationErrors)}`);

      // Calculate discount amount if order amount is provided
      let calculatedDiscount: any = null;
      if (validationData?.orderAmount && isValid) {
        this.logger.debug(`Calculating discount for order amount: ${validationData.orderAmount}`);
        calculatedDiscount = this.calculateDiscount(voucher, validationData.orderAmount);
        this.logger.debug(`Calculated discount: ${JSON.stringify(calculatedDiscount)}`);
      } else if (validationData?.orderAmount && !isValid) {
        this.logger.debug(`Skipping discount calculation because validation failed`);
      }

      const response = {
        voucher,
        conditions,
        isValid,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
        usageInfo,
        calculatedDiscount,
      };

      return AppResponse.Ok(response);
    } catch (error) {
      this.logger.error(`Error fetching voucher: ${error.message}`, error.stack);
      return AppResponse.Err('Failed to fetch voucher', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Validate a single voucher condition
   */
  private validateCondition(condition: VoucherCondition, data: any): { valid: boolean; message: string } {
    const { conditionType, operator, value } = condition;

    try {
      switch (conditionType) {
        case VoucherConditionConditionType.CITY:
          return this.validateOperator(data.cityId, value, operator, 'City');

        case VoucherConditionConditionType.CATEGORY:
          if (!data.categoryIds || !Array.isArray(data.categoryIds)) {
            this.logger.warn(
              `Category validation failed: categoryIds not provided or not an array. Received: ${JSON.stringify(data.categoryIds)}`,
            );
            return { valid: false, message: 'Category IDs not provided' };
          }
          return this.validateArrayOperator(data.categoryIds, value, operator, 'Category');

        case VoucherConditionConditionType.PRODUCT:
          if (!data.productIds || !Array.isArray(data.productIds)) {
            return { valid: false, message: 'Product IDs not provided' };
          }
          return this.validateArrayOperator(data.productIds, value, operator, 'Product');

        case VoucherConditionConditionType.USER:
          return this.validateOperator(data.userId, value, operator, 'User');

        case VoucherConditionConditionType.SHOP:
          return this.validateOperator(data.shopId, value, operator, 'Shop');

        case VoucherConditionConditionType.PAYMENT_METHOD:
          return this.validateOperator(data.paymentMethod, value, operator, 'Payment method');

        case VoucherConditionConditionType.MIN_ORDER:
          if (!data.orderAmount) {
            return { valid: false, message: 'Order amount not provided' };
          }
          return this.validateNumericOperator(data.orderAmount, value, operator, 'Minimum order amount');

        default:
          return { valid: true, message: 'Unknown condition type, skipping validation' };
      }
    } catch (e) {
      this.logger.error(`Error validating condition: ${e.message}`, e.stack);
      return { valid: false, message: `Condition validation error: ${e.message}` };
    }
  }

  /**
   * Validate operator for single values
   * Uses string comparison to handle type mismatches between stored values and input data
   */
  private validateOperator(dataValue: any, conditionValue: any, operator: VoucherConditionOperator, fieldName: string) {
    switch (operator) {
      case VoucherConditionOperator.EQ:
        // Convert both to strings for comparison to handle type mismatches
        if (String(dataValue) === String(conditionValue)) {
          return { valid: true, message: '' };
        }
        return { valid: false, message: `${fieldName} does not match` };

      case VoucherConditionOperator.IN:
        const inArray = Array.isArray(conditionValue) ? conditionValue : [conditionValue];
        // Convert all values to strings for comparison
        if (inArray.map(v => String(v)).includes(String(dataValue))) {
          return { valid: true, message: '' };
        }
        return { valid: false, message: `${fieldName} not in allowed List` };

      case VoucherConditionOperator.NOT_IN:
        const notInArray = Array.isArray(conditionValue) ? conditionValue : [conditionValue];
        // Convert all values to strings for comparison
        if (!notInArray.map(v => String(v)).includes(String(dataValue))) {
          return { valid: true, message: '' };
        }
        return { valid: false, message: `${fieldName} is in excluded List` };

      default:
        return { valid: true, message: '' };
    }
  }

  /**
   * Validate operator for array values (like categories, products)
   * Uses string comparison to handle type mismatches between stored values and input data
   */
  private validateArrayOperator(
    dataArray: any[],
    conditionValue: any,
    operator: VoucherConditionOperator,
    fieldName: string,
  ) {
    const conditionArray = Array.isArray(conditionValue) ? conditionValue : [conditionValue];

    // Convert all values to strings for comparison
    const conditionStrings = conditionArray.map(v => String(v));
    const dataStrings = dataArray.map(v => String(v));

    switch (operator) {
      case VoucherConditionOperator.IN:
        const hasMatch = dataStrings.some(item => conditionStrings.includes(item));
        if (hasMatch) {
          return { valid: true, message: '' };
        }
        return { valid: false, message: `${fieldName} not in allowed List` };

      case VoucherConditionOperator.NOT_IN:
        const hasExcluded = dataStrings.some(item => conditionStrings.includes(item));
        if (!hasExcluded) {
          return { valid: true, message: '' };
        }
        return { valid: false, message: `${fieldName} contains excluded values` };

      default:
        return { valid: true, message: '' };
    }
  }

  /**
   * Validate numeric operators (like min order amount)
   */
  private validateNumericOperator(
    dataValue: number,
    conditionValue: any,
    operator: VoucherConditionOperator,
    fieldName: string,
  ) {
    const conditionNum = Number(conditionValue);

    switch (operator) {
      case VoucherConditionOperator.GTE:
        if (dataValue >= conditionNum) {
          return { valid: true, message: '' };
        }
        return { valid: false, message: `${fieldName} must be at least ${conditionNum}` };

      case VoucherConditionOperator.LTE:
        if (dataValue <= conditionNum) {
          return { valid: true, message: '' };
        }
        return { valid: false, message: `${fieldName} must be at most ${conditionNum}` };

      case VoucherConditionOperator.EQ:
        if (dataValue === conditionNum) {
          return { valid: true, message: '' };
        }
        return { valid: false, message: `${fieldName} must equal ${conditionNum}` };

      case VoucherConditionOperator.BETWEEN:
        if (Array.isArray(conditionValue) && conditionValue.length === 2) {
          const [min, max] = conditionValue.map(Number);
          if (dataValue >= min && dataValue <= max) {
            return { valid: true, message: '' };
          }
          return { valid: false, message: `${fieldName} must be between ${min} and ${max}` };
        }
        return { valid: false, message: 'Invalid BETWEEN condition format' };

      default:
        return { valid: true, message: '' };
    }
  }

  /**
   * Check if user has exceeded usage limits
   */
  private async checkUsageLimits(voucherId: number, userId: string, voucher: Voucher) {
    try {
      // Check global usage limit
      if (voucher.maxGlobalUsage) {
        const globalUsageWhere: QueryWhere = { voucher: voucherId };
        const globalUsageCount = await this.voucherUsageLogRepository.count(globalUsageWhere);

        if (globalUsageCount >= voucher.maxGlobalUsage) {
          return {
            valid: false,
            message: 'Voucher has reached maximum global usage limit',
            data: { globalUsage: globalUsageCount, maxGlobalUsage: voucher.maxGlobalUsage },
          };
        }
      }

      // Check per-user usage limit
      // Check per-user usage limit
      const userUsageWhere: QueryWhere = { voucher: voucherId, userId };
      const userUsageCount = await this.voucherUsageLogRepository.count(userUsageWhere);
      if (userUsageCount >= voucher.maxPerUserUsage) {
        return {
          valid: false,
          message: 'You have reached maximum usage limit for this voucher',
          data: { userUsage: userUsageCount, maxPerUserUsage: voucher.maxPerUserUsage },
        };
      }

      return {
        valid: true,
        message: '',
        data: { userUsage: userUsageCount, maxPerUserUsage: voucher.maxPerUserUsage },
      };
    } catch (e) {
      this.logger.error(`Error checking usage limits: ${e.message}`, e.stack);
      return { valid: false, message: 'Error checking usage limits', data: null };
    }
  }

  /**
   * Calculate discount amount based on voucher type
   */
  private calculateDiscount(voucher: Voucher, orderAmount: number) {
    this.logger.debug(`=== DISCOUNT CALCULATION START ===`);
    this.logger.debug(`Order Amount: ${orderAmount}`);
    this.logger.debug(`Voucher Discount Value: ${voucher.discountValue}`);
    this.logger.debug(`Voucher Discount Unit: ${voucher.discountUnit}`);
    this.logger.debug(`Voucher Min Order Amount: ${voucher.minOrderAmount}`);
    this.logger.debug(`Voucher Capped Amount: ${voucher.cappedAmount}`);

    let discountAmount = 0;
    const discountValue = Number(voucher.discountValue);

    // Check minimum order amount
    if (voucher.minOrderAmount && orderAmount < Number(voucher.minOrderAmount)) {
      this.logger.warn(`Minimum order amount not met: ${orderAmount} < ${voucher.minOrderAmount}`);
      return {
        applicable: false,
        reason: `Minimum order amount of ${voucher.minOrderAmount} not met`,
        discountAmount: 0,
        finalAmount: orderAmount,
      };
    }

    // Calculate discount based on unit type (case-insensitive)
    const discountUnit = voucher.discountUnit?.toUpperCase();
    if (discountUnit === '%' || discountUnit === 'PERCENTAGE') {
      discountAmount = (orderAmount * discountValue) / 100;
      this.logger.debug(
        `Percentage discount calculated: (${orderAmount} * ${discountValue}) / 100 = ${discountAmount}`,
      );
    } else if (discountUnit === 'FIXED' || discountUnit === 'PKR') {
      discountAmount = discountValue;
      this.logger.debug(`Fixed discount applied: ${discountAmount}`);
    } else {
      this.logger.warn(`Unknown discount unit: ${voucher.discountUnit}`);
    }

    // Apply capped amount if specified
    if (voucher.cappedAmount && discountAmount > Number(voucher.cappedAmount)) {
      this.logger.debug(
        `Applying cap: ${discountAmount} > ${voucher.cappedAmount}, capping to ${voucher.cappedAmount}`,
      );
      discountAmount = Number(voucher.cappedAmount);
    }

    // Ensure discount doesn't exceed order amount
    if (discountAmount > orderAmount) {
      this.logger.debug(`Discount exceeds order amount: ${discountAmount} > ${orderAmount}, capping to ${orderAmount}`);
      discountAmount = orderAmount;
    }

    const finalAmount = orderAmount - discountAmount;

    this.logger.debug(`Final discount amount: ${discountAmount}`);
    this.logger.debug(`Final order amount after discount: ${finalAmount}`);
    this.logger.debug(`=== DISCOUNT CALCULATION END ===`);

    return {
      applicable: true,
      discountAmount: Number(discountAmount.toFixed(2)),
      finalAmount: Number(finalAmount.toFixed(2)),
      originalAmount: orderAmount,
      discountType: voucher.discountUnit,
      discountValue: discountValue,
    };
  }

  /**
   * Apply voucher to order - validates and calculates discount/free shipping
   */
  async applyVoucherToOrder(
    voucherId: number,
    orderData: {
      userId: string;
      cartItems: any[];
      listingsMap?: Map<number, any>;
      orderAmount: number;
      deliveryChargeAmount: number;
      deliveryCityId?: number;
      paymentMethod?: string;
    },
  ) {
    try {
      this.logger.debug(`=== VOUCHER APPLICATION START ===`);
      this.logger.debug(`Voucher ID: ${voucherId}`);
      this.logger.debug(`Order Amount: ${orderData.orderAmount}`);
      this.logger.debug(`User ID: ${orderData.userId}`);
      this.logger.debug(`Delivery City ID: ${orderData.deliveryCityId}`);
      this.logger.debug(`Payment Method: ${orderData.paymentMethod}`);
      this.logger.debug(`Cart Items Count: ${orderData.cartItems.length}`);

      // Extract category and product IDs from cart items
      // Extract category IDs from listingsMap if available, otherwise from cart items
      let categoryIds: number[] = [];
      if (orderData.listingsMap) {
        categoryIds = [
          ...new Set(
            orderData.cartItems
              .map((item: any) => {
                const listing = orderData.listingsMap!.get(item.listingId);
                // Category can be an object {id: X} or a direct number
                const category = listing?.category;
                const categoryId = typeof category === 'object' && category?.id ? category.id : category;
                return categoryId;
              })
              .filter(Boolean),
          ),
        ];
      } else {
        categoryIds = [...new Set(orderData.cartItems.map((item: any) => item.categoryId).filter(Boolean))];
      }

      const productIds = [
        ...new Set(orderData.cartItems.map((item: any) => item.listingId || item.itemId).filter(Boolean)),
      ];
      // TODO: Fix shop ID extraction to handle multi-shop carts properly
      // Currently only takes first shop ID, should either:
      // 1. Extract all unique shop IDs and validate as array (like categories/products)
      // 2. Enforce single-shop validation when voucher has shop conditions
      // 3. Validate voucher separately for each shop's items
      const shopId = orderData.cartItems[0]?.shopId;

      // Validate voucher with all conditions
      const validationData = {
        userId: orderData.userId,
        cityId: orderData.deliveryCityId,
        categoryIds,
        productIds,
        shopId,
        orderAmount: orderData.orderAmount,
        paymentMethod: orderData.paymentMethod,
      };

      this.logger.debug(`Calling fetchVoucherById with validation data...`);
      const voucherResult = await this.fetchVoucherById(voucherId, validationData);
      this.logger.debug(`fetchVoucherById result: success=${voucherResult.success}, message=${voucherResult.message}`);

      if (!voucherResult.success) {
        return AppResponse.Err(voucherResult.message || 'Voucher validation failed', HttpStatus.BAD_REQUEST);
      }

      const voucherData = voucherResult.data as any;

      if (!voucherData.isValid) {
        this.logger.warn(`Voucher validation failed: ${voucherData.validationErrors?.join(', ')}`);
        return AppResponse.Err(
          `Voucher is not applicable: ${voucherData.validationErrors?.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const voucher = voucherData.voucher as Voucher;
      this.logger.debug(`Voucher is valid. Type: ${voucher.voucherType}`);
      this.logger.debug(`Calculated discount data: ${JSON.stringify(voucherData.calculatedDiscount)}`);

      let discountAmount = 0;
      let freeShipping = false;
      let finalDeliveryCharge = orderData.deliveryChargeAmount;

      // Apply voucher based on type
      if (voucher.voucherType === 'PRICE_DISCOUNT') {
        const discount = voucherData.calculatedDiscount;
        this.logger.debug(
          `Processing PRICE_DISCOUNT - applicable: ${discount?.applicable}, amount: ${discount?.discountAmount}`,
        );
        if (discount?.applicable) {
          discountAmount = discount.discountAmount;
        }
      } else if (voucher.voucherType === 'FREE_SHIPPING') {
        this.logger.debug(`Processing FREE_SHIPPING`);
        freeShipping = true;
        finalDeliveryCharge = 0;
      }

      this.logger.debug(`Final discount amount: ${discountAmount}`);
      this.logger.debug(`=== VOUCHER APPLICATION END ===`);

      // Return simplified response consistent with validation endpoint
      return AppResponse.Ok({
        id: voucher.id,
        code: voucher.voucherCode,
        isValid: true,
        type: voucher.voucherType,
        discountAmount: discountAmount,
        orderAmount: orderData.orderAmount,
        finalAmount: orderData.orderAmount - discountAmount,
        freeShipping: freeShipping,
        deliveryChargeAmount: finalDeliveryCharge,
        originalDeliveryCharge: orderData.deliveryChargeAmount,
        minOrderAmount: voucher.minOrderAmount ? Number(voucher.minOrderAmount) : undefined,
        cappedAmount: voucher.cappedAmount ? Number(voucher.cappedAmount) : undefined,
        expiryDate: voucher.expiryDate,
        message: 'Voucher applied successfully',
      });
    } catch (e) {
      this.logger.error(`Error applying voucher: ${e.message}`, e.stack);
      return AppResponse.Err('Failed to apply voucher', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private getVoucherDateValidationError(voucher: { startDate: any; expiryDate: any }): string | null {
    const timeZoneId = Temporal.Now.timeZoneId();
    const today = Temporal.Now.plainDateISO(timeZoneId);
    const startDay = Temporal.Instant.fromEpochMilliseconds(new Date(voucher.startDate).getTime())
      .toZonedDateTimeISO(timeZoneId)
      .toPlainDate();
    const expiryDay = Temporal.Instant.fromEpochMilliseconds(new Date(voucher.expiryDate).getTime())
      .toZonedDateTimeISO(timeZoneId)
      .toPlainDate();

    if (Temporal.PlainDate.compare(today, startDay) < 0) {
      return 'Voucher is not yet valid';
    }

    if (Temporal.PlainDate.compare(today, expiryDay) > 0) {
      return 'Voucher has expired';
    }

    return null;
  }
}
