import { Loaded } from '@mikro-orm/mysql';
import { Listing } from '@modules/listings/entities/listing.entity';

interface ListingResponseTransformerStrategy {
  transformListingResponse(data: Loaded<Partial<Listing>>): any;
}

abstract class BaseListingResponseTransformer implements ListingResponseTransformerStrategy {
  transformListingResponse(data: Loaded<Partial<Listing>>): any {
    const isInactive = data.status?.includes('Inactive');
    return {
      summary: {
        listingId: data.listingId,
        listingTitle: data.listingTitle,
        visits: data.visits,
        isFeatured: data.isFeatured,
        primaryImage: data.primaryImage,
        status: data.status,
        activationDate: isInactive ? null : data.activationDate,
        archivedOn: isInactive ? null : data.archivedOn,
        isDeleted: data.isDeleted,
        listedQty: data.listedQty,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        effectivePrice: isInactive ? null : data.effectivePrice,
        conditionName: data.conditionName,
        effectiveDiscount: isInactive ? null : data.effectiveDiscount,
        onlinePrice: isInactive ? null : data.listingPrice.onlinePrice,
        isNoLongerAvailable: isInactive,
        rating: data.rating,
        totalRatings: data.rating,
        category: data.category,
        categoryName: data.categoryName,
        color: data.color,
        colorName: data.colorName,
        item: {
          itemId: data.item?.itemId,
          quantity: data.item?.quantity,
        },
        images: Object.values(data.images ?? {}).filter(val => typeof val === 'string' && val !== 'nil'),
        ...(data?.devicePorts && { ports: data.devicePorts.map(port => port.portName) }),
      },
      meta: { metaKey: data.listingMetadata?.metaKey, metaValue: data.listingMetadata?.metaValue },
      text: { description: data.listingText?.description, notes: data.listingText?.notes },
      store: {
        username: data.shop?.username,
        shopLogo: data.shop?.logoPath,
        shopId: data.shop?.shopId,
        shopName: data.shop?.shopName,
        onTrial: data.shop?.onTrial,
        onPayment: data.shop?.onPayment,
        shopAddress: data.location?.address,
        ShopOption: {
          isD4uEnabled: data.shop?.shopOption?.isD4uEnabled,
          isD4uModuleIncluded: data.shop?.shopOption?.isD4uModuleIncluded,
        },
        location: {
          latitude: data.location?.latitude,
          longitude: data.location?.longitude,
          locationNick: data.location?.locationNick,
          locationId: data.location?.locationId,
          city: data.location?.city?.cityName,
        },
      },
    };
  }

  protected formatValue(value: string, suffix: string = ''): string | number {
    return value === 'nil' ? 0 : `${parseFloat(value)} ${suffix}`;
  }
}

class MobileListingResponseTransformer extends BaseListingResponseTransformer {
  transformListingResponse(data: Loaded<Partial<Listing>>): any {
    const baseResponse = super.transformListingResponse(data);
    const transformedResponse = {
      ...baseResponse,
      highlights: {
        brand: data.listingSpecification.brand,
        model: data.listingSpecification.model,
        condition: data.conditionName,
        ram: this.formatValue(data.listingSpecification.ramCapacity, 'GB'),
        storage: this.formatValue(data.listingSpecification.primaryStorageCapacity, 'GB'),
      },
      detail: {
        isPtaApproved: data.listingSpecification.isPtaApproved,
        model: data.listingSpecification.model,
        brand: data.listingSpecification.brand,
        screenSize: data.listingSpecification.screenSize,
        processor: data.listingSpecification.processor,
        refreshRate: data.listingSpecification.refreshRate,
        resolution: data.listingSpecification.resolution,
        isTouchScreen: data.listingSpecification.isTouchScreen,
        // cameraType: data.listingSpecification.cameraType,
        fingerprint: data.listingSpecification.fingerprint,
        speaker: data.listingSpecification.speaker,
        batteryType: data.listingSpecification.batteryType,
        batteryCapacity: data.listingSpecification.batteryCapacity,
        screenType: data.listingSpecification.screenType,
        cameraSpecs: data.listingSpecification.cameraSpecs,
        screenProtection: data.listingSpecification.screenProtection,
        simType: data.listingSpecification.simType,
        bodyType: data.listingSpecification.bodyType,
        isESim: data.listingSpecification.isESim,
        networkBand: data.listingSpecification.networkBand,
        ramCapacity: data.listingSpecification.ramCapacity,
        primaryStorageCapacity: data.listingSpecification.primaryStorageCapacity,
      },
    };
    return transformedResponse;
  }
}

class LaptopListingResponseTransformer extends BaseListingResponseTransformer {
  transformListingResponse(data: Loaded<Partial<Listing>>): any {
    const baseResponse = super.transformListingResponse(data);
    const transformedResponse = {
      ...baseResponse,
      highlights: {
        brand: data.listingSpecification.brand,
        model: data.listingSpecification.model,
        condition: data.conditionName,
        ram: this.formatValue(data.listingSpecification.ramCapacity, 'GB'),
        storage: {
          primaryStorageCapacity: this.formatValue(data.listingSpecification.primaryStorageCapacity, 'GB'),
          primaryStorageType: data.listingSpecification.primaryStorageType,
          secondaryStorageCapacity: this.formatValue(data.listingSpecification.secondaryStorageCapacity, 'GB'),
          secondaryStorageType: data.listingSpecification.secondaryStorageType,
        },
        GPU: {
          graphicsCardMemory: this.formatValue(data.listingSpecification.graphicsCardMemory, 'GB'),
          graphicsCardName: data.listingSpecification.graphicsCardName,
          graphicsCardType: data.listingSpecification.graphicsCardType,
        },
      },
      detail: {
        batteryCapacity: data.listingSpecification.batteryCapacity,
        batteryType: data.listingSpecification.batteryType,
        bodyType: data.listingSpecification.bodyType,
        brand: data.listingSpecification.brand,
        cameraSpecs: data.listingSpecification.cameraSpecs,
        fingerprint: data.listingSpecification.fingerprint,
        generation: data.listingSpecification.generation,
        graphicsCardMemory: data.listingSpecification.graphicsCardMemory,
        graphicsCardName: data.listingSpecification.graphicsCardName,
        graphicsCardType: data.listingSpecification.graphicsCardType,
        isBacklitKeyboard: data.listingSpecification.isBacklitKeyboard,
        isTouchScreen: data.listingSpecification.isTouchScreen,
        isWebcam: data.listingSpecification.isWebcam,
        keyboard: data.listingSpecification.keyboard,
        laptopType: data.listingSpecification.laptopType,
        model: data.listingSpecification.model,
        operatingSystem: data.listingSpecification.operatingSystem,
        primaryStorageCapacity: data.listingSpecification.primaryStorageCapacity,
        primaryStorageType: data.listingSpecification.primaryStorageType,
        processor: data.listingSpecification.processor,
        ramCapacity: data.listingSpecification.ramCapacity,
        ramType: data.listingSpecification.ramType,
        refreshRate: data.listingSpecification.refreshRate,
        resolution: data.listingSpecification.resolution,
        screenProtection: data.listingSpecification.screenProtection,
        screenSize: data.listingSpecification.screenSize,
        screenType: data.listingSpecification.screenType,
        secondaryStorageCapacity: data.listingSpecification.secondaryStorageCapacity,
        secondaryStorageType: data.listingSpecification.secondaryStorageType,
        speaker: data.listingSpecification.speaker,
      },
    };
    return transformedResponse;
  }
}

class TabletListingResponseTransformer extends BaseListingResponseTransformer {
  transformListingResponse(data: Loaded<Partial<Listing>>): any {
    const baseResponse = super.transformListingResponse(data);
    const transformedResponse = {
      ...baseResponse,
      highlights: {
        brand: data.listingSpecification.brand,
        model: data.listingSpecification.model,
        condition: data.conditionName,
        ram: this.formatValue(data.listingSpecification.ramCapacity, 'GB'),
        storage: this.formatValue(data.listingSpecification.primaryStorageCapacity, 'GB'),
      },
      detail: {
        isPtaApproved: data.listingSpecification.isPtaApproved,
        model: data.listingSpecification.model,
        brand: data.listingSpecification.brand,
        listing: data.listingSpecification.listing,
        screenSize: data.listingSpecification.screenSize,
        processor: data.listingSpecification.processor,
        refreshRate: data.listingSpecification.refreshRate,
        resolution: data.listingSpecification.resolution,
        isTouchScreen: data.listingSpecification.isTouchScreen,
        fingerprint: data.listingSpecification.fingerprint,
        speaker: data.listingSpecification.speaker,
        batteryType: data.listingSpecification.batteryType,
        batteryCapacity: data.listingSpecification.batteryCapacity,
        screenType: data.listingSpecification.screenType,
        cameraSpecs: data.listingSpecification.cameraSpecs,
        screenProtection: data.listingSpecification.screenProtection,
        simType: data.listingSpecification.simType,
        bodyType: data.listingSpecification.bodyType,
        isESim: data.listingSpecification.isESim,
        networkBand: data.listingSpecification.networkBand,
      },
    };
    return transformedResponse;
  }
}

class TvMonitorListingResponseTransformer extends BaseListingResponseTransformer {
  transformListingResponse(data: Loaded<Partial<Listing>>): any {
    const baseResponse = super.transformListingResponse(data);
    const transformedResponse = {
      ...baseResponse,
      highlights: {
        brand: data.listingSpecification.brand,
        model: data.listingSpecification.model,
        condition: data.conditionName,
        screenSize: this.formatValue(data.listingSpecification.screenSize, 'inches'),
      },
      detail: {
        model: data.listingSpecification.model,
        brand: data.listingSpecification.brand,
        screenSize: data.listingSpecification.screenSize,
        speaker: data.listingSpecification.speaker,
        refreshRate: data.listingSpecification.refreshRate,
        resolution: data.listingSpecification.resolution,
        screenType: data.listingSpecification.screenType,
        displayType: data.listingSpecification.displayType,
        isSmartTv: data.listingSpecification.isSmartTv,
        isTvCertified: data.listingSpecification.isTvCertified,
        isWebcam: data.listingSpecification.isWebcam,
        tvMonitorType: data.listingSpecification.tvMonitorType,
        operatingSystem: data.listingSpecification.operatingSystem,
      },
    };
    return transformedResponse;
  }
}

class DesktopListingResponseTransformer extends BaseListingResponseTransformer {
  transformListingResponse(data: Loaded<Partial<Listing>>): any {
    const baseResponse = super.transformListingResponse(data);
    const transformedResponse = {
      ...baseResponse,
      highlights: {
        brand: data.listingSpecification.brand,
        model: data.listingSpecification.model,
        condition: data.conditionName,
      },
      detail: {
        brand: data.listingSpecification.brand,
        desktopType: data.listingSpecification.desktopType,
        generation: data.listingSpecification.generation,
        // graphicsCard: data.listingSpecification.graphicsCard,
        graphicsCardMemory: data.listingSpecification.graphicsCardMemory,
        graphicsCardName: data.listingSpecification.graphicsCardName,
        graphicsCardType: data.listingSpecification.graphicsCardType,
        isTouchScreen: data.listingSpecification.isTouchScreen,
        keyboard: data.listingSpecification.keyboard,
        model: data.listingSpecification.model,
        processor: data.listingSpecification.processor,
        primaryStorageCapacity: data.listingSpecification.primaryStorageCapacity,
        primaryStorageType: data.listingSpecification.primaryStorageType,
        ramCapacity: data.listingSpecification.ramCapacity,
        ramType: data.listingSpecification.ramType,
        resolution: data.listingSpecification.resolution,
        secondaryStorageCapacity: data.listingSpecification.secondaryStorageCapacity,
        secondaryStorageType: data.listingSpecification.secondaryStorageType,
        screenSize: data.listingSpecification.screenSize,
        screenType: data.listingSpecification.screenType,
        speaker: data.listingSpecification.speaker,
      },
    };
    return transformedResponse;
  }
}

class AccessoryListingResponseTransformer extends BaseListingResponseTransformer {
  transformListingResponse(data: Loaded<Partial<Listing>>): any {
    const baseResponse = super.transformListingResponse(data);
    const transformedResponse = {
      ...baseResponse,
      highlights: {
        brand: data.listingSpecification.brand,
        model: data.listingSpecification.model,
        condition: data.conditionName,
      },
      detail: {
        accessoryType: data.listingSpecification.accessoryType,
        brand: data.listingSpecification.brand,
        model: data.listingSpecification.model,
      },
    };
    return transformedResponse;
  }
}

class DefaultListingResponseTransformer extends BaseListingResponseTransformer {
  transformListingResponse(data: Loaded<Partial<Listing>>): any {
    const baseResponse = super.transformListingResponse(data);
    const transformedResponse = {
      ...baseResponse,
    };
    return transformedResponse;
  }
}
export class ListingResponseTransformer {
  private listingResponseTransformer: ListingResponseTransformerStrategy;

  constructor(category: string) {
    this.listingResponseTransformer = this.getTransformer(category);
  }

  private getTransformer(category: string): ListingResponseTransformerStrategy {
    switch (category) {
      case 'Mobile':
        return new MobileListingResponseTransformer();
      case 'Laptop':
        return new LaptopListingResponseTransformer();
      case 'Tablet':
        return new TabletListingResponseTransformer();
      case 'TV / Monitor':
        return new TvMonitorListingResponseTransformer();
      case 'Desktop Computer':
        return new DesktopListingResponseTransformer();
      case 'Accessories':
        return new AccessoryListingResponseTransformer();
      default:
        return new DefaultListingResponseTransformer();
    }
  }

  transformListingResponse(data: Loaded<Partial<Listing>>): any {
    const transformed = this.listingResponseTransformer.transformListingResponse(data);
    return sanitizeBigInt(transformed);
  }
}
function sanitizeBigInt(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (_, value) => (typeof value === 'bigint' ? value.toString() : value)));
}
