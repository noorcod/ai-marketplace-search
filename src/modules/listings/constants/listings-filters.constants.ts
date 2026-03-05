import { RequestSource } from '@modules/listings/dtos/listings-filters.dto';
import { COMMON_FILTERS, CATEGORY_FILTERS, getAllUniqueFilters } from '../config/filter.config';

// Dynamically generated from filter.config.ts to ensure consistency
export const COMMON_FILTER_NAMES = COMMON_FILTERS.map(filter => filter.name);
export const ALL_FILTER_NAMES = getAllUniqueFilters();
export const PRICE_FILTER_NAMES = ['minPrice', 'maxPrice'];
export const CATEGORY_NAMES = ['Laptop', 'Mobile', 'Tablet', 'TV / Monitor', 'Desktop Computer', 'Accessories'];

// Backend-only filters (not user-selectable but affect filtering)
export const BACKEND_ONLY_FILTERS = ['store', 'search'];

// Range filters that have min/max variants
export const RANGE_FILTERS = ['price'];

// Boolean filters
export const BOOLEAN_FILTERS = [
  'isTouchScreen',
  'isBacklitKeyboard',
  'isPtaApproved',
  'isESim',
  'isSimSupport',
  'isSmartTv',
  'isWebcam',
  'isTvCertified',
];

// Filter display order for UI - dynamically generated from config
export const FILTER_DISPLAY_ORDER = {
  common: COMMON_FILTER_NAMES,
  // Category-specific display orders (prioritized filters first)
  laptop: [
    'model',
    'processor',
    'generation',
    'ramCapacity',
    'ramType',
    'primaryStorageCapacity',
    'primaryStorageType',
    'screenSize',
    'graphicsCardType',
    'laptopType',
    'isTouchScreen',
    'isBacklitKeyboard',
  ],
  mobile: [
    'model',
    'ramCapacity',
    'primaryStorageCapacity',
    'screenSize',
    'batteryCapacity',
    'networkBand',
    'isPtaApproved',
    'simType',
    'isESim',
  ],
  tablet: [
    'model',
    'ramCapacity',
    'primaryStorageCapacity',
    'screenSize',
    'batteryCapacity',
    'isPtaApproved',
    'isSimSupport',
  ],
  tv_monitor: [
    'model',
    'screenSize',
    'resolution',
    'displayType',
    'refreshRate',
    'tvMonitorType',
    'isSmartTv',
    'isTvCertified',
  ],
  desktop_computer: [
    'model',
    'desktopType',
    'processor',
    'generation',
    'ramCapacity',
    'ramType',
    'primaryStorageCapacity',
    'primaryStorageType',
    'graphicsCardType',
  ],
  accessories: ['model', 'accessoryType', 'isWebcam'],
};

// Helper function to get display order for a category
export const getFilterDisplayOrder = (categoryName?: string): string[] => {
  if (!categoryName) return FILTER_DISPLAY_ORDER.common;

  const normalizedCategory = categoryName.toLowerCase().replace(/\s+/g, '_').replace('/', '');
  return FILTER_DISPLAY_ORDER[normalizedCategory] || [];
};

// Mobile-specific filter subsets (prioritized filters for mobile UX)
export const MOBILE_FILTER_SUBSETS = {
  common: ['categoryName', 'price', 'conditionName', 'brandName', 'cityName'], // Removed colorName for mobile
  laptop: ['model', 'processor', 'ramCapacity', 'primaryStorageCapacity', 'screenSize'],
  mobile: ['model', 'ramCapacity', 'primaryStorageCapacity', 'batteryCapacity', 'isPtaApproved'],
  tablet: ['model', 'ramCapacity', 'primaryStorageCapacity', 'screenSize', 'isPtaApproved'],
  tv_monitor: ['model', 'screenSize', 'resolution', 'isSmartTv'],
  desktop_computer: ['model', 'processor', 'ramCapacity', 'primaryStorageCapacity'],
  accessories: ['model', 'accessoryType'],
};

// Get filters by request source (web/mobile)
export const getFiltersBySource = (source: RequestSource) => {
  // Mobile apps need fewer filter options for better UX
  if (source === RequestSource.MOBILE) {
    return {
      maxFiltersPerCategory: 5,
      maxValuesPerFilter: 5,
      showAdvancedFilters: false,
      useFilterSubset: true,
    };
  }

  // Web can show all filters
  return {
    maxFiltersPerCategory: 20,
    maxValuesPerFilter: 10,
    showAdvancedFilters: true,
    useFilterSubset: false,
  };
};

// Get mobile filter subset for a category
export const getMobileFilterSubset = (categoryName?: string): string[] => {
  if (!categoryName) return MOBILE_FILTER_SUBSETS.common;

  const normalizedCategory = categoryName.toLowerCase().replace(/\s+/g, '_').replace('/', '');
  return MOBILE_FILTER_SUBSETS[normalizedCategory] || MOBILE_FILTER_SUBSETS.common;
};

// Check if a filter should be shown for mobile
export const shouldShowFilterForMobile = (filterName: string, categoryName?: string): boolean => {
  const mobileFilters = getMobileFilterSubset(categoryName);
  const commonMobileFilters = MOBILE_FILTER_SUBSETS.common;

  return mobileFilters.includes(filterName) || commonMobileFilters.includes(filterName);
};

// Default filter values for different categories (smart defaults for better UX)
export const DEFAULT_FILTER_VALUES: Record<string, any> = {
  laptop: {
    conditionName: ['New', 'Like New', 'Excellent'],
    ramCapacity: ['8', '16', '32'],
    primaryStorageType: ['SSD'],
  },
  mobile: {
    conditionName: ['New', 'Like New', 'Excellent'],
    isPtaApproved: true,
    ramCapacity: ['4', '6', '8'],
    networkBand: ['4G', '5G'],
  },
  tablet: {
    conditionName: ['New', 'Like New'],
    ramCapacity: ['4', '6', '8'],
  },
  tv_monitor: {
    conditionName: ['New', 'Like New'],
    resolution: ['FHD', '4K'],
  },
  desktop_computer: {
    conditionName: ['New', 'Like New'],
    ramCapacity: ['8', '16', '32'],
    primaryStorageType: ['SSD'],
  },
  accessories: {
    conditionName: ['New', 'Like New'],
  },
};

// Validation rules for filter combinations
export const FILTER_VALIDATION_RULES = {
  price: {
    validate: (minPrice?: number, maxPrice?: number) => {
      if (minPrice && maxPrice) {
        return minPrice <= maxPrice;
      }
      return true;
    },
    message: 'Minimum price cannot be greater than maximum price',
  },
  ramCapacity: {
    validate: (value: string) => {
      const numValue = parseInt(value);
      return numValue > 0 && numValue <= 128;
    },
    message: 'RAM capacity must be between 1 and 128 GB',
  },
  screenSize: {
    validate: (value: string) => {
      const numValue = parseFloat(value);
      return numValue > 0 && numValue <= 100;
    },
    message: 'Screen size must be between 0 and 100 inches',
  },
};

// Utility functions
export const isCommonFilter = (filterName: string): boolean => {
  return COMMON_FILTER_NAMES.includes(filterName);
};

export const isBackendOnlyFilter = (filterName: string): boolean => {
  return BACKEND_ONLY_FILTERS.includes(filterName);
};

export const isBooleanFilter = (filterName: string): boolean => {
  return BOOLEAN_FILTERS.includes(filterName);
};

export const isRangeFilter = (filterName: string): boolean => {
  return RANGE_FILTERS.includes(filterName);
};

export const getCategoryDefaultValues = (categoryName: string): Record<string, any> => {
  const normalizedCategory = categoryName.toLowerCase().replace(/\s+/g, '_').replace('/', '');
  return DEFAULT_FILTER_VALUES[normalizedCategory] || {};
};

// Get filter count comparison (web vs mobile)
export const getFilterCountComparison = (categoryName?: string) => {
  const webFilters = getFilterDisplayOrder(categoryName);
  const mobileFilters = getMobileFilterSubset(categoryName);

  return {
    web: webFilters.length,
    mobile: mobileFilters.length,
    reduction: webFilters.length - mobileFilters.length,
    reductionPercentage: Math.round(((webFilters.length - mobileFilters.length) / webFilters.length) * 100),
  };
};
