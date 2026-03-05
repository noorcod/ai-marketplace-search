import { QueryOptions, QueryWhere } from '@common/interfaces/repository.interface';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { ListingsQueryDto } from '@modules/listings/dtos/listings-query.dto';
import { Listing } from '../entities/listing.entity';
import { QueryOptionsBuilder } from './query-options.builder';
import { ListingFilterBuilder } from './listing-filter.builder';

export class ListingsQueryOptionsBuilder {
  private where: QueryWhere<Listing> = {};
  private options: QueryOptions<Listing> = {};

  constructor(
    private readonly dto: ListingsQueryDto,
    private readonly pagination?: PaginationOptions,
  ) {}

  private buildWhere(): this {
    const {
      categoryName,
      cityName,
      conditionName,
      brandName,
      minPrice,
      maxPrice,
      store,
      search,
      colorName,
      // listingSpecification mapped fields
      model,
      laptopType,
      ramType,
      ramCapacity,
      primaryStorageType,
      primaryStorageCapacity,
      secondaryStorageType,
      secondaryStorageCapacity,
      processor,
      generation,
      graphicsCardName,
      graphicsCardType,
      graphicsCardMemory,
      screenSize,
      screenType,
      screenProtection,
      resolution,
      keyboard,
      speaker,
      batteryType,
      batteryCapacity,
      isTouchScreen,
      isBacklitKeyboard,
      fingerprint,
      isPtaApproved,
      cameraSpecs,
      isESim,
      networkBand,
      refreshRate,
      simType,
      bodyType,
      isSimSupport,
      displayType,
      operatingSystem,
      isSmartTv,
      isWebcam,
      isTvCertified,
      desktopType,
      accessoryType,
      tvMonitorType,
    } = (this.dto || {}) as ListingsQueryDto;

    const base = new ListingFilterBuilder().withGeneralClauses().withItemFilters().withCategory(categoryName).build();

    // Apply search on listing title
    if (search) {
      (base as any).listingTitle = { $like: `%${search}%` };
    }

    // Apply array-based filters on root entity
    if (cityName?.length) {
      (base as any).city = { cityName: { $in: cityName } };
    }

    if (conditionName?.length) {
      (base as any).conditionName = { $in: conditionName };
    }

    if (brandName?.length) {
      (base as any).brandName = { $in: brandName };
    }

    if (colorName?.length) {
      (base as any).colorName = { $in: colorName };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      (base as any).effectivePrice = {
        ...(minPrice !== undefined && { $gte: minPrice }),
        ...(maxPrice !== undefined && { $lte: maxPrice }),
      };
    }

    if (store !== undefined) {
      (base as any).shop = { shopId: Number(store) };
    }

    // Map listingSpecification filters
    const spec: any = {};
    if (model?.length) spec.model = { $in: model };
    if (laptopType?.length) spec.laptopType = { $in: laptopType };
    if (ramType?.length) spec.ramType = { $in: ramType };
    if (ramCapacity?.length) spec.ramCapacity = { $in: ramCapacity };
    if (primaryStorageType?.length) spec.primaryStorageType = { $in: primaryStorageType };
    if (primaryStorageCapacity?.length) spec.primaryStorageCapacity = { $in: primaryStorageCapacity };
    if (secondaryStorageType?.length) spec.secondaryStorageType = { $in: secondaryStorageType };
    if (secondaryStorageCapacity?.length) spec.secondaryStorageCapacity = { $in: secondaryStorageCapacity };
    if (processor?.length) spec.processor = { $in: processor };
    if (generation?.length) spec.generation = { $in: generation };
    if (graphicsCardName?.length) spec.graphicsCardName = { $in: graphicsCardName };
    if (graphicsCardType?.length) spec.graphicsCardType = { $in: graphicsCardType };
    if (graphicsCardMemory?.length) spec.graphicsCardMemory = { $in: graphicsCardMemory };
    if (screenSize?.length) spec.screenSize = { $in: screenSize };
    if (screenType?.length) spec.screenType = { $in: screenType };
    if (screenProtection?.length) spec.screenProtection = { $in: screenProtection };
    if (resolution?.length) spec.resolution = { $in: resolution };
    if (keyboard?.length) spec.keyboard = { $in: keyboard };
    if (speaker?.length) spec.speaker = { $in: speaker };
    if (batteryType?.length) spec.batteryType = { $in: batteryType };
    if (batteryCapacity?.length) spec.batteryCapacity = { $in: batteryCapacity };

    if (typeof isTouchScreen === 'boolean') spec.isTouchScreen = isTouchScreen;
    if (typeof isBacklitKeyboard === 'boolean') spec.isBacklitKeyboard = isBacklitKeyboard;
    if (typeof isPtaApproved === 'boolean') spec.isPtaApproved = isPtaApproved;
    if (typeof isESim === 'boolean') spec.isESim = isESim;
    if (typeof isSimSupport === 'boolean') spec.isSimSupport = isSimSupport;
    if (typeof isSmartTv === 'boolean') spec.isSmartTv = isSmartTv;
    if (typeof isWebcam === 'boolean') spec.isWebcam = isWebcam;
    if (typeof isTvCertified === 'boolean') spec.isTvCertified = isTvCertified;

    if (fingerprint) spec.fingerprint = fingerprint;
    if (cameraSpecs) spec.cameraSpecs = cameraSpecs;
    if (networkBand?.length) spec.networkBand = { $in: networkBand };
    if (refreshRate?.length) spec.refreshRate = { $in: refreshRate };
    if (simType?.length) spec.simType = { $in: simType };
    if (bodyType?.length) spec.bodyType = { $in: bodyType };
    if (displayType?.length) spec.displayType = { $in: displayType };
    if (operatingSystem?.length) spec.operatingSystem = { $in: operatingSystem };
    if (desktopType?.length) spec.desktopType = { $in: desktopType };
    if (accessoryType?.length) spec.accessoryType = { $in: accessoryType };
    if (tvMonitorType?.length) spec.tvMonitorType = { $in: tvMonitorType };

    if (Object.keys(spec).length > 0) {
      (base as any).listingSpecification = spec;
    }
    this.where = base;
    return this;
  }

  private buildOptions(): this {
    const builder = QueryOptionsBuilder.create().withType('listing');

    if (this.pagination) {
      builder.withLimit(this.pagination.limit()).withOffset(this.pagination.offset());
    }

    const sortKey = this.dto?.sort?.toLowerCase();
    switch (sortKey) {
      case 'price_asc':
      case 'price-asc':
        builder.withOrderBy('effectivePrice' as keyof Listing, 'ASC');
        break;
      case 'price_desc':
      case 'price-desc':
        builder.withOrderBy('effectivePrice' as keyof Listing, 'DESC');
        break;
      case 'discount_asc':
      case 'discount-asc':
        builder.withOrderBy('effectiveDiscount' as keyof Listing, 'ASC');
        break;
      case 'discount_desc':
      case 'discount-desc':
        builder.withOrderBy('effectiveDiscount' as keyof Listing, 'DESC');
        break;
      case 'popularity':
      case 'most_popular':
      case 'most-popular':
        builder.withOrderBy('visits' as keyof Listing, 'DESC');
        break;
      case 'rating':
        builder.withOrderBy('rating' as keyof Listing, 'DESC');
        break;
      case 'newest':
      default:
        builder.withRelationOrderBy('shop', { onPayment: 'DESC' }).withOrderByMultiple([
          { field: 'activationDate', direction: 'DESC' },
          { field: 'listingId', direction: 'DESC' },
        ]);
        break;
    }

    this.options = builder.build();
    return this;
  }

  build(): { where: QueryWhere<Listing>; options: QueryOptions<Listing> } {
    this.buildWhere().buildOptions();
    return { where: this.where, options: this.options };
  }
}
