import {
  COMMON_MODEL_FILTERS,
  CATEGORY_MODEL_FILTERS,
  getAllUniqueFilterNames,
  getBooleanFilterNames,
  getFilterByName,
} from '../config/model-filters.config';

// Export all filter names
export const ALL_MODEL_FILTER_NAMES = getAllUniqueFilterNames();

// Export common filter names
export const COMMON_MODEL_FILTER_NAMES = COMMON_MODEL_FILTERS.map(f => f.name);

// Export boolean filter names
export const BOOLEAN_MODEL_FILTER_NAMES = getBooleanFilterNames();

// Category-specific filter display order (prioritized)
export const MODEL_FILTER_DISPLAY_ORDER: Record<string, string[]> = {
  Laptop: [
    'brandName',
    'laptopType',
    'processor',
    'generation',
    'ram',
    'ramType',
    'storage',
    'storageSsd',
    'graphicCardName',
    'graphicCardType',
    'graphicCardMemory',
    'screenSize',
    'screenType',
    'resolution',
    'refreshRate',
    'hasTouchScreen',
    'hasBacklitKeyboard',
    'keyboard',
    'battery',
    'speaker',
    'cameraType',
    'fingerPrint',
  ],
  Mobile: [
    'brandName',
    'processor',
    'ram',
    'mobileStorage',
    'batteryCapacity',
    'cameraSpecs',
    'screenSize',
    'screenType',
    'resolution',
    'refreshRate',
    'screenProtection',
    'networkBands',
    'simType',
    'hasESim',
    'bodyType',
    'fingerPrint',
    'speaker',
  ],
  Tablet: [
    'brandName',
    'processor',
    'ram',
    'mobileStorage',
    'screenSize',
    'screenType',
    'resolution',
    'refreshRate',
    'screenProtection',
    'batteryCapacity',
    'cameraSpecs',
    'hasSimSupport',
    'simType',
    'hasESim',
    'bodyType',
    'fingerPrint',
    'speaker',
  ],
  'TV / Monitor': [
    'brandName',
    'screenSize',
    'screenType',
    'resolution',
    'refreshRate',
    'displayType',
    'isSmartTv',
    'hasWebcam',
    'hasTvCertification',
    'os',
    'speaker',
  ],
  'Desktop Computer': [
    'brandName',
    'desktopType',
    'processor',
    'generation',
    'ram',
    'ramType',
    'storage',
    'storageSsd',
    'graphicCardName',
    'graphicCardType',
    'graphicCardMemory',
    'screenSize',
    'screenType',
    'resolution',
    'refreshRate',
    'hasTouchScreen',
    'hasWebcam',
    'speaker',
  ],
  Accessories: ['brandName', 'accessoryType'],
};

/**
 * Get display order for a specific category
 */
export function getFilterDisplayOrder(categoryName: string): string[] {
  return MODEL_FILTER_DISPLAY_ORDER[categoryName] || COMMON_MODEL_FILTER_NAMES;
}

/**
 * Get formatted label for a filter value
 */
export function getFilterValueLabel(filterName: string, value: string | number | boolean): string {
  // Models table stores most values already with units (e.g., '16GB', '15.6"', '144Hz').
  // To avoid duplicating units, only format booleans; otherwise return as-is string.
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

/**
 * Validation rules for filter values
 */
export const MODEL_FILTER_VALIDATION_RULES = {
  ram: {
    min: 1,
    max: 128,
    type: 'number' as const,
  },
  mobileStorage: {
    min: 1,
    max: 2048,
    type: 'number' as const,
  },
  storage: {
    min: 1,
    max: 10240,
    type: 'number' as const,
  },
  storageSsd: {
    min: 1,
    max: 10240,
    type: 'number' as const,
  },
  screenSize: {
    min: 0,
    max: 100,
    type: 'number' as const,
  },
  batteryCapacity: {
    min: 0,
    max: 50000,
    type: 'number' as const,
  },
};

/**
 * Check if a filter name is valid
 */
export function isValidFilterName(filterName: string): boolean {
  return ALL_MODEL_FILTER_NAMES.includes(filterName);
}

/**
 * Check if a filter is applicable to a category
 */
export function isFilterApplicableToCategory(filterName: string, categoryName: string): boolean {
  const filter = getFilterByName(filterName);
  return filter?.categories.includes(categoryName) ?? false;
}

/**
 * Get all filters applicable to a category
 */
export function getApplicableFilters(categoryName: string): string[] {
  return ALL_MODEL_FILTER_NAMES.filter(name => isFilterApplicableToCategory(name, categoryName));
}
