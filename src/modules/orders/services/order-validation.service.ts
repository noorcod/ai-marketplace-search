import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { AppResponse } from '@common/responses/app-response';
import { CheckoutItemDto } from '../dto/checkout/checkout-item.dto';
import { ListingsService } from '@modules/listings/listings.service';
import { CartService } from '@modules/carts/cart.service';
import { Listing } from '@modules/listings/entities/listing.entity';
import {
  PLATFORM_FEE_RATES,
  PRICE_VALIDATION_TOLERANCE,
  calculatePlatformFee,
  calculateBnplPlatformFee,
  getPlatformFeeRate,
  requiresPlatformFee,
} from '../constants/platform-fee.constants';
import {
  ValidationErrorType,
  ValidationErrorDetail,
  PriceValidationError,
  PlatformFeeValidationError,
  TotalAmountValidationError,
} from '../dto/validation/validation-error.dto';

@Injectable()
export class OrderValidationService {
  private readonly logger = new Logger(OrderValidationService.name);

  constructor(
    private readonly listingsService: ListingsService,
    private readonly cartService: CartService,
  ) {}

  /**
   * Validate cart items and fetch listings in a single operation.
   * Returns both validation result and listings map to avoid duplicate fetches.
   * Note: DTO validation already ensures items array is non-empty and listingIds are valid numbers.
   */
  async validateCartItems(items: CheckoutItemDto[]): Promise<
    AppResponse<{
      valid: boolean;
      issues: any[];
      itemCount: number;
      listingsMap: Map<number, Listing>;
    }>
  > {
    try {
      const issues: any[] = [];

      // Collect unique listing IDs (DTO ensures listingId is a valid number)
      const listingIds = items.map(item => item.listingId);
      const uniqueListingIds = [...new Set(listingIds)];
      const listingsMap = new Map<number, Listing>();

      // Fetch listings in a single batch with listingPrice relation for cost price data
      const listingsResult = await this.listingsService.fetchListingsByIds({
        ids: uniqueListingIds,
        includeListingPrice: true,
      });

      if (listingsResult.success && listingsResult.data) {
        const listingsData = this.extractListingsData(listingsResult.data);
        for (const listing of listingsData) {
          listingsMap.set(listing.listingId, listing);
        }
      }

      // Validate each item (business rules: stock, price changes, listing status)
      for (const item of items) {
        const validationIssues = this.validateSingleItem(item, listingsMap);
        issues.push(...validationIssues);
      }

      return AppResponse.Ok({
        valid: issues.length === 0,
        issues,
        itemCount: items.length,
        listingsMap, // Return listings map to avoid duplicate fetch
      });
    } catch (e) {
      this.logger.error(`Error validating items: ${e.message}`, e.stack);
      return AppResponse.Err(e.message);
    }
  }

  /**
   * Extract listings data from various response formats
   */
  private extractListingsData(data: any): any[] {
    let listingsData: any[] = [];

    if (Array.isArray(data)) {
      // If array of pages (each with .listings), flatten them
      if (data.length > 0 && data[0] && Array.isArray(data[0].listings)) {
        listingsData = data.flatMap(p => p.listings || []);
      } else {
        // Otherwise treat it as an array of listing objects
        listingsData = data;
      }
    } else {
      // Single page response with listings property
      listingsData = data.listings || [];
    }

    return listingsData;
  }

  /**
   * Validate a single cart item for business rules (stock, price, listing status).
   * Note: DTO validation already ensures listingId is a valid non-empty number.
   */
  private validateSingleItem(item: CheckoutItemDto, listingsMap: Map<number, Listing>): any[] {
    const issues: any[] = [];
    const listingId = item.listingId;
    const listing = listingsMap.get(listingId);

    // Validate listing existence or status
    const validationResult = (this.cartService as any).validateListingFromCache(listing, listingId, item.quantity);

    if (!validationResult.success) {
      issues.push({
        itemId: item.itemId,
        listingId,
        type: 'INVALID_LISTING',
        message: validationResult.message || 'Listing validation failed',
      });
      return issues;
    }

    const validatedListing = validationResult.data as Listing;

    // Check for price changes
    const currentPrice = Number(validatedListing.effectivePrice ?? 0);
    if (Math.abs(currentPrice - Number(item.unitPrice)) > 0.01) {
      issues.push({
        itemId: item.itemId,
        listingId,
        type: 'PRICE_CHANGED',
        message: 'Item price no longer matches current listing price',
        details: {
          oldPrice: item.unitPrice,
          newPrice: currentPrice,
        },
      });
    }

    // Check for stock
    if (validatedListing.listedQty < item.quantity) {
      issues.push({
        itemId: item.itemId,
        listingId,
        type: 'INSUFFICIENT_STOCK',
        message: `Only ${validatedListing.listedQty} in stock`,
        details: {
          available: validatedListing.listedQty,
          requested: item.quantity,
        },
      });
    }

    return issues;
  }

  /**
   * Validate cart item prices against database listings
   * Prevents price manipulation by ensuring frontend prices match database
   *
   * Note: This uses the already-fetched listingsMap to avoid redundant queries
   */
  validateCartItemPrices(
    cartItems: CheckoutItemDto[],
    listingsMap: Map<number, Listing>,
  ): AppResponse<{ validated: boolean; error?: PriceValidationError }> {
    for (const item of cartItems) {
      const listing = listingsMap.get(item.listingId);

      if (!listing) {
        this.logger.error(`Listing ${item.listingId} not found in listingsMap`);

        const error: ValidationErrorDetail = {
          type: ValidationErrorType.LISTING_NOT_FOUND,
          message: `Listing ${item.listingId} not found`,
          listingId: item.listingId,
          field: 'cartItems.listingId',
        };

        return AppResponse.Err(error as any, HttpStatus.NOT_FOUND);
      }

      // Validate unit price matches database
      const dbPrice = Number(listing.effectivePrice || 0);
      const frontendPrice = Number(item.unitPrice);

      if (Math.abs(frontendPrice - dbPrice) > PRICE_VALIDATION_TOLERANCE.BASE) {
        this.logger.warn(
          `[SECURITY] Price manipulation detected! Listing ${item.listingId} (${listing.listingTitle}): ` +
            `Frontend=₨${frontendPrice}, Database=₨${dbPrice}`,
        );

        const error: PriceValidationError = {
          type: ValidationErrorType.PRICE_MANIPULATION,
          message: `Invalid price for ${listing.listingTitle}. Expected: ₨${dbPrice.toFixed(2)}`,
          listingId: item.listingId,
          field: 'cartItems.unitPrice',
          productName: listing.listingTitle,
          databasePrice: dbPrice,
          frontendPrice: frontendPrice,
          expected: dbPrice,
          received: frontendPrice,
        };

        return AppResponse.Err(error as any, HttpStatus.BAD_REQUEST);
      }

      // Validate discount if present
      if (item.unitDiscount) {
        const dbDiscount = Number(listing.effectiveDiscount || 0);
        const frontendDiscount = Number(item.unitDiscount);

        if (Math.abs(frontendDiscount - dbDiscount) > PRICE_VALIDATION_TOLERANCE.BASE) {
          this.logger.warn(
            `[SECURITY] Discount manipulation detected! Listing ${item.listingId}: ` +
              `Frontend=₨${frontendDiscount}, Database=₨${dbDiscount}`,
          );

          const error: PriceValidationError = {
            type: ValidationErrorType.DISCOUNT_MANIPULATION,
            message: `Invalid discount for ${listing.listingTitle}. Expected: ₨${dbDiscount.toFixed(2)}`,
            listingId: item.listingId,
            field: 'cartItems.unitDiscount',
            productName: listing.listingTitle,
            databasePrice: dbDiscount,
            frontendPrice: frontendDiscount,
            expected: dbDiscount,
            received: frontendDiscount,
          };

          return AppResponse.Err(error as any, HttpStatus.BAD_REQUEST);
        }
      }
    }

    return AppResponse.Ok({ validated: true });
  }

  /**
   * Calculate platform fee and grand total based on payment method
   * Uses constants instead of magic numbers
   */
  calculateOrderTotals(
    subtotal: number,
    deliveryCharges: number,
    voucherDiscount: number,
    paymentMethod: string,
  ): {
    platformFee: number;
    grandTotal: number;
    breakdown: {
      baseAmount: number;
      platformFeePercent: number;
      bnplMarkup?: number;
    };
  } {
    const baseAmount = subtotal + deliveryCharges - voucherDiscount;

    // Special handling for BNPL
    if (paymentMethod === 'Card - BNPL') {
      const bnplCalc = calculateBnplPlatformFee(subtotal, deliveryCharges, voucherDiscount);
      return {
        platformFee: bnplCalc.platformFee,
        grandTotal: bnplCalc.grandTotal,
        breakdown: {
          baseAmount,
          platformFeePercent: PLATFORM_FEE_RATES.BNPL * 100,
          bnplMarkup: bnplCalc.subtotalWithMarkup - subtotal,
        },
      };
    }

    // Standard platform fee calculation for other methods
    const feeRate = getPlatformFeeRate(paymentMethod);
    const platformFee = calculatePlatformFee(baseAmount, feeRate);

    return {
      platformFee,
      grandTotal: baseAmount + platformFee,
      breakdown: {
        baseAmount,
        platformFeePercent: feeRate * 100,
      },
    };
  }

  /**
   * Validate that frontend total amount matches backend calculation
   * Prevents total price manipulation
   */
  validateTotalAmount(
    frontendTotal: number,
    backendCalculation: ReturnType<typeof this.calculateOrderTotals>,
    paymentMethod: string,
    subtotal: number,
    deliveryCharges: number,
    voucherDiscount: number,
  ): AppResponse<{ validated: boolean; error?: TotalAmountValidationError }> {
    // Use appropriate tolerance based on payment method
    const tolerance = requiresPlatformFee(paymentMethod)
      ? PRICE_VALIDATION_TOLERANCE.APG
      : PRICE_VALIDATION_TOLERANCE.BASE;

    const difference = Math.abs(frontendTotal - backendCalculation.grandTotal);

    if (difference > tolerance) {
      this.logger.warn(
        `[SECURITY] Total amount manipulation detected! ` +
          `Method=${paymentMethod}, Frontend=₨${frontendTotal.toFixed(2)}, ` +
          `Backend=₨${backendCalculation.grandTotal.toFixed(2)}, ` +
          `Difference=₨${difference.toFixed(2)}, Tolerance=₨${tolerance}`,
      );

      const error: TotalAmountValidationError = {
        type: ValidationErrorType.TOTAL_AMOUNT_INVALID,
        message: `Invalid total amount. Expected: ₨${backendCalculation.grandTotal.toFixed(2)}`,
        field: 'paymentDetails.amountReceivable',
        paymentMethod,
        expectedTotal: backendCalculation.grandTotal,
        receivedTotal: frontendTotal,
        expected: backendCalculation.grandTotal,
        received: frontendTotal,
        breakdown: {
          subtotal,
          delivery: deliveryCharges,
          voucher: voucherDiscount,
          platformFee: backendCalculation.platformFee,
        },
        details: {
          difference: difference.toFixed(2),
          tolerance,
          feePercent: backendCalculation.breakdown.platformFeePercent,
        },
      };

      return AppResponse.Err(error as any, HttpStatus.BAD_REQUEST);
    }

    return AppResponse.Ok({ validated: true });
  }

  /**
   * Validate platform fee for APG payment methods
   * Ensures platform charges match the expected calculation
   */
  validatePlatformFee(
    frontendPlatformFee: number | undefined,
    backendCalculation: ReturnType<typeof this.calculateOrderTotals>,
    paymentMethod: string,
  ): AppResponse<{ validated: boolean; error?: PlatformFeeValidationError }> {
    // Skip validation for non-APG methods
    if (!requiresPlatformFee(paymentMethod)) {
      return AppResponse.Ok({ validated: true });
    }

    // Platform fee is required for APG methods
    if (frontendPlatformFee === undefined || frontendPlatformFee === null) {
      this.logger.warn(`[SECURITY] Missing platform fee for APG payment method: ${paymentMethod}`);

      const error: PlatformFeeValidationError = {
        type: ValidationErrorType.PLATFORM_FEE_INVALID,
        message: 'Platform charges required for this payment method',
        field: 'paymentDetails.platformCharges',
        paymentMethod,
        expectedFee: backendCalculation.platformFee,
        receivedFee: 0,
        feePercent: backendCalculation.breakdown.platformFeePercent,
        expected: backendCalculation.platformFee,
        received: 0,
      };

      return AppResponse.Err(error as any, HttpStatus.BAD_REQUEST);
    }

    const difference = Math.abs(frontendPlatformFee - backendCalculation.platformFee);

    if (difference > PRICE_VALIDATION_TOLERANCE.APG) {
      this.logger.warn(
        `[SECURITY] Platform fee manipulation detected! ` +
          `Method=${paymentMethod}, Frontend=₨${frontendPlatformFee.toFixed(2)}, ` +
          `Backend=₨${backendCalculation.platformFee.toFixed(2)}, ` +
          `Difference=₨${difference.toFixed(2)}`,
      );

      const error: PlatformFeeValidationError = {
        type: ValidationErrorType.PLATFORM_FEE_INVALID,
        message: `Invalid platform charges. Expected: ₨${backendCalculation.platformFee.toFixed(2)}`,
        field: 'paymentDetails.platformCharges',
        paymentMethod,
        expectedFee: backendCalculation.platformFee,
        receivedFee: frontendPlatformFee,
        feePercent: backendCalculation.breakdown.platformFeePercent,
        expected: backendCalculation.platformFee,
        received: frontendPlatformFee,
        details: {
          difference: difference.toFixed(2),
          tolerance: PRICE_VALIDATION_TOLERANCE.APG,
        },
      };

      return AppResponse.Err(error as any, HttpStatus.BAD_REQUEST);
    }

    return AppResponse.Ok({ validated: true });
  }
}
