import { Model } from '../../modules/models/entities/Model.entity';
import { Images } from '../../modules/models/entities/Images.entity';
import { convertMbToGb, formatNumberAsCurrency } from '../utilities/convertors';
import { Loaded } from '@mikro-orm/mysql';

interface ModelResponseTransformerStrategy {
  transformModelResponse(data: Loaded<Partial<Model>>): any;
}

abstract class BaseModelResponseTransformer implements ModelResponseTransformerStrategy {
  transformModelResponse(data: Loaded<Partial<Model>>): any {
    // Preliminary transformation
    const availableColorIds = JSON.parse(data.colorsAvailable).map((c: { id: number; label: string }) => c.id);
    // We make sure that images for available colors are present
    const images = data.images.filter((image: Images) => availableColorIds.includes(image.color));
    const colors = images.map((imageRow: Images) => {
      const imgList = Object.entries(imageRow)
        .filter(([key, val]) => key.startsWith('img') && val !== 'nil')
        .map(([key, val]) => val);
      return {
        colorName: imageRow.colorName,
        images: imgList,
      };
    });
    const launchPrice = data.launchPrice ? formatNumberAsCurrency(data.launchPrice) : data.launchPrice;

    return {
      basic: {
        Title: data.modelTitle,
        Model: data.modelName,
        Brand: data.brandName,
        Description: data.description,
      },
      colors: colors,
      metaData: data.meta,
      launch: {
        date: data.releaseDate,
        text: 'Release Date',
      },
      price: {
        value: `${launchPrice}`,
        text: 'Launch Price',
      },
    };
  }

  protected formatValue(value: string, suffix: string = ''): string | number {
    return value === 'nil' ? 0 : `${parseFloat(value)} ${suffix}`;
  }
}

class MobileModelResponseTransformer extends BaseModelResponseTransformer {
  transformModelResponse(data: Loaded<Partial<Model>>): any {
    const baseResponse = super.transformModelResponse(data);
    const transformedResponse = {
      ...baseResponse,
      general: {
        Processor: data.processor,
        'Camera Specs': this.formatValue(data.cameraSpecs, 'MP'),
        Speaker: data.speaker,
        Body: data.bodyType,
        OS: data.os,
        Ports: data.ports,
      },
      display: {
        Resolution: this.formatValue(data.resolution, 'pixels'),
        Size: this.formatValue(data.screenSize, 'inches'),
        'Refresh Rate': this.formatValue(data.refreshRate, 'Hz'),
        'Screen Type': data.screenType,
        'Display Type': data.displayType,
        Protection: data.screenProtection,
      },
      storage: {
        RAM: this.formatValue(data.ram, 'GB'),
        ROM: this.formatValue(data.mobileStorage, 'GB'),
      },
      simSupport: {
        'Sim Type': data.simType,
        'Network Bands': data.networkBands,
        'E-Sim Enabled': data.hasESim === true ? 'Yes' : 'No',
      },
      battery: {
        Capacity: this.formatValue(data.batteryCapacity, 'mAh'),
      },
      security: {
        Fingerprint: data.fingerPrint === 'nil' ? 'No' : data.fingerPrint,
      },
    };
    return transformedResponse;
  }
}

class LaptopModelResponseTransformer extends BaseModelResponseTransformer {
  transformModelResponse(data: Loaded<Partial<Model>>): any {
    const baseResponse = super.transformModelResponse(data);
    const transformedResponse = {
      ...baseResponse,
      general: {
        'Laptop Type': data.laptopType,
        Ports: data.ports,
      },
      processor: {
        Processor: data.processor,
        Generation: data.generation,
      },
      graphics: {
        Type: data.graphicCardType,
        Memory: data.graphicCardMemory === 'nil' ? 0 : `${convertMbToGb(parseFloat(data.graphicCardMemory))} GB`,
        Name: data.graphicCardName,
      },
      storage: {
        RAM: this.formatValue(data.ram, 'GB'),
        'RAM Type': data.ramType,
        SSD: this.formatValue(data.storageSsd, 'GB'),
        HDD: this.formatValue(data.storage, 'GB'),
      },
      miscellaneous: {
        Speaker: data.speaker,
        'Camera Specs': this.formatValue(data.cameraSpecs, 'MP'),
        'Camera Type': data.cameraType,
        Keyboard: data.keyboard,
        'Touch Screen': data.hasTouchScreen === true ? 'Yes' : 'No',
        Backlit: data.hasBacklitKeyboard === 1 ? 'Yes' : 'No',
      },
      battery: {
        Battery: data.battery,
      },
      display: {
        Resolution: this.formatValue(data.resolution, 'pixels'),
        Size: this.formatValue(data.screenSize, 'inches'),
        'Refresh Rate': this.formatValue(data.refreshRate, 'Hz'),
        'Screen Type': data.screenType,
        'Display Type': data.displayType,
        Protection: data.screenProtection,
      },
      security: {
        Fingerprint: data.fingerPrint === 'nil' ? 'No' : data.fingerPrint,
      },
    };
    return transformedResponse;
  }
}

class TabletModelResponseTransformer extends BaseModelResponseTransformer {
  transformModelResponse(data: Loaded<Partial<Model>>): any {
    const baseResponse = super.transformModelResponse(data);
    const transformedResponse = {
      ...baseResponse,
      general: {
        Processor: data.processor,
        'Camera Specs': this.formatValue(data.cameraSpecs, 'MP'),
        Speaker: data.speaker,
        Body: data.bodyType,
        OS: data.os,
        Ports: data.ports,
      },
      display: {
        Resolution: this.formatValue(data.resolution, 'pixels'),
        Size: this.formatValue(data.screenSize, 'inches'),
        'Refresh Rate': this.formatValue(data.refreshRate, 'Hz'),
        'Screen Type': data.screenType,
        'Display Type': data.displayType,
        Protection: data.screenProtection,
      },
      storage: {
        RAM: this.formatValue(data.ram, 'GB'),
        ROM: this.formatValue(data.mobileStorage, 'GB'),
      },
      simSupport: {
        'Supports SIM': data.hasSimSupport === true ? 'Yes' : 'No',
        'Sim Type': data.simType,
        'Network Bands': data.networkBands,
        'E-Sim Enabled': data.hasESim === true ? 'Yes' : 'No',
      },

      battery: {
        Capacity: this.formatValue(data.batteryCapacity, 'mAh'),
      },
      security: {
        Fingerprint: data.fingerPrint === 'nil' ? 'No' : data.fingerPrint,
      },
    };
    return transformedResponse;
  }
}

class TvMonitorModelResponseTransformer extends BaseModelResponseTransformer {
  transformModelResponse(data: Loaded<Partial<Model>>): any {
    const baseResponse = super.transformModelResponse(data);
    const transformedResponse = {
      ...baseResponse,
      general: {
        Type: data.tvMonitorType,
        Ports: data.ports,
      },
      display: {
        Resolution: this.formatValue(data.resolution, 'pixels'),
        Size: this.formatValue(data.screenSize, 'inches'),
        'Refresh Rate': this.formatValue(data.refreshRate, 'Hz'),
        'Screen Type': data.screenType,
        'Display Type': data.displayType,
      },
      miscellaneous: {
        'TV Certification': data.hasTvCertification === 1 ? 'Yes' : 'No',
        Speaker: data.speaker,
      },
    };
    return transformedResponse;
  }
}

class DesktopModelResponseTransformer extends BaseModelResponseTransformer {
  transformModelResponse(data: Loaded<Partial<Model>>): any {
    const baseResponse = super.transformModelResponse(data);
    const transformedResponse = {
      ...baseResponse,
      general: {
        'Desktop Type': data.desktopType,
        Ports: data.ports,
      },
      processor: {
        Processor: data.processor,
        Generation: data.generation,
      },
      graphics: {
        Type: data.graphicCardType,
        Memory: data.graphicCardMemory === 'nil' ? 0 : `${convertMbToGb(Number(data.graphicCardMemory))} GB`,
        Name: data.graphicCardName,
      },
      storage: {
        RAM: data.ram === 'nil' ? 0 : `${Number(data.ram)} GB`,
        'RAM Type': data.ramType,
        SSD: this.formatValue(data.storageSsd, 'GB'),
        HDD: this.formatValue(data.storage, 'GB'),
      },
      miscellaneous: {
        Speaker: data.speaker,
      },
      display: {
        Resolution: this.formatValue(data.resolution, 'pixels'),
        Size: this.formatValue(data.screenSize, 'inches'),
        'Refresh Rate': this.formatValue(data.refreshRate, 'Hz'),
        'Screen Type': data.screenType,
        'Display Type': data.displayType,
        Protection: data.screenProtection,
      },
    };
    return transformedResponse;
  }
}

class AccessoryModelResponseTransformer extends BaseModelResponseTransformer {
  transformModelResponse(data: Loaded<Partial<Model>>): any {
    const baseResponse = super.transformModelResponse(data);
    const transformedResponse = {
      ...baseResponse,
      miscellaneous: {
        'Accessory Type': data.accessoryType,
      },
    };
    return transformedResponse;
  }
}

class DefaultModelResponseTransformer extends BaseModelResponseTransformer {
  transformModelResponse(data: Loaded<Partial<Model>>): any {
    const baseResponse = super.transformModelResponse(data);
    const transformedResponse = {
      ...baseResponse,
    };
    return transformedResponse;
  }
}

export class ModelResponseTransformer {
  private modelResponseTransformer: ModelResponseTransformerStrategy;

  constructor(category: string) {
    this.modelResponseTransformer = this.getTransformer(category);
  }

  private getTransformer(category: string): ModelResponseTransformerStrategy {
    switch (category) {
      case 'Mobile':
        return new MobileModelResponseTransformer();
      case 'Laptop':
        return new LaptopModelResponseTransformer();
      case 'Tablet':
        return new TabletModelResponseTransformer();
      case 'TV / Monitor':
        return new TvMonitorModelResponseTransformer();
      case 'Desktop Computer':
        return new DesktopModelResponseTransformer();
      case 'Accessories':
        return new AccessoryModelResponseTransformer();
      default:
        return new DefaultModelResponseTransformer();
    }
  }

  transformModelResponse(data: Loaded<Partial<Model>>): any {
    return this.modelResponseTransformer.transformModelResponse(data);
  }
}
