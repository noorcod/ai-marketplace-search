import { ModelFilterDefinition, ModelFilterType } from '../types/model-filter.types';

// Common filters that appear across all categories
export const COMMON_MODEL_FILTERS: ModelFilterDefinition[] = [
  {
    name: 'brandName',
    label: 'Brand',
    type: ModelFilterType.CHECKBOX,
    dbColumn: 'brand_name',
    categories: ['Laptop', 'Mobile', 'Tablet', 'TV / Monitor', 'Desktop Computer', 'Accessories'],
  },
  {
    name: 'categoryName',
    label: 'Category',
    type: ModelFilterType.RADIO,
    dbColumn: 'category_name',
    categories: ['Laptop', 'Mobile', 'Tablet', 'TV / Monitor', 'Desktop Computer', 'Accessories'],
  },
];

// Category-specific filters
export const CATEGORY_MODEL_FILTERS: Record<string, ModelFilterDefinition[]> = {
  Laptop: [
    {
      name: 'laptopType',
      label: 'Laptop Type',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'laptop_type',
      categories: ['Laptop'],
    },
    {
      name: 'processor',
      label: 'Processor',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'processor',
      categories: ['Laptop', 'Desktop Computer'],
    },
    {
      name: 'generation',
      label: 'Generation',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'generation',
      categories: ['Laptop', 'Desktop Computer'],
    },
    {
      name: 'ramType',
      label: 'RAM Type',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'ram_type',
      categories: ['Laptop', 'Desktop Computer'],
    },
    {
      name: 'ram',
      label: 'RAM',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'ram',
      unit: 'GB',
      categories: ['Laptop', 'Desktop Computer', 'Mobile', 'Tablet'],
    },
    {
      name: 'storage',
      label: 'HDD Storage',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'storage',
      unit: 'GB',
      categories: ['Laptop', 'Desktop Computer'],
    },
    {
      name: 'storageSsd',
      label: 'SSD Storage',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'storage_ssd',
      unit: 'GB',
      categories: ['Laptop', 'Desktop Computer'],
    },
    {
      name: 'graphicCardName',
      label: 'Graphics Card',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'graphic_card_name',
      categories: ['Laptop', 'Desktop Computer'],
    },
    {
      name: 'graphicCardType',
      label: 'Graphics Card Type',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'graphic_card_type',
      categories: ['Laptop', 'Desktop Computer'],
    },
    {
      name: 'graphicCardMemory',
      label: 'Graphics Card Memory',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'graphic_card_memory',
      unit: 'GB',
      categories: ['Laptop', 'Desktop Computer'],
    },
    {
      name: 'screenSize',
      label: 'Screen Size',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'screen_size',
      unit: 'inch',
      categories: ['Laptop', 'Desktop Computer', 'Mobile', 'Tablet', 'TV / Monitor'],
    },
    {
      name: 'screenType',
      label: 'Screen Type',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'screen_type',
      categories: ['Laptop', 'Desktop Computer', 'Mobile', 'Tablet', 'TV / Monitor'],
    },
    {
      name: 'resolution',
      label: 'Resolution',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'resolution',
      unit: 'px',
      categories: ['Laptop', 'Desktop Computer', 'Mobile', 'Tablet', 'TV / Monitor'],
    },
    {
      name: 'refreshRate',
      label: 'Refresh Rate',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'refresh_rate',
      unit: 'Hz',
      categories: ['Laptop', 'Desktop Computer', 'Mobile', 'Tablet', 'TV / Monitor'],
    },
    {
      name: 'speaker',
      label: 'Speaker',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'speaker',
      categories: ['Laptop', 'Desktop Computer', 'Mobile', 'Tablet', 'TV / Monitor'],
    },
    {
      name: 'hasTouchScreen',
      label: 'Touch Screen',
      type: ModelFilterType.BOOLEAN,
      dbColumn: 'touch_screen',
      categories: ['Laptop', 'Desktop Computer'],
    },
    {
      name: 'cameraType',
      label: 'Camera Type',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'camera_type',
      categories: ['Laptop'],
    },
    {
      name: 'battery',
      label: 'Battery',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'battery',
      categories: ['Laptop'],
    },
    {
      name: 'keyboard',
      label: 'Keyboard',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'keyboard',
      categories: ['Laptop'],
    },
    {
      name: 'hasBacklitKeyboard',
      label: 'Backlit Keyboard',
      type: ModelFilterType.BOOLEAN,
      dbColumn: 'backlit',
      categories: ['Laptop'],
    },
    {
      name: 'fingerPrint',
      label: 'Fingerprint',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'finger_print',
      categories: ['Laptop', 'Mobile', 'Tablet'],
    },
  ],
  Mobile: [
    {
      name: 'processor',
      label: 'Processor',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'processor',
      categories: ['Mobile', 'Tablet'],
    },
    {
      name: 'mobileStorage',
      label: 'Storage',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'mobile_storage',
      unit: 'GB',
      categories: ['Mobile', 'Tablet'],
    },
    {
      name: 'ram',
      label: 'RAM',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'ram',
      unit: 'GB',
      categories: ['Mobile', 'Tablet'],
    },
    {
      name: 'cameraSpecs',
      label: 'Camera Specs',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'camera_specs',
      categories: ['Mobile', 'Tablet'],
    },
    {
      name: 'screenSize',
      label: 'Screen Size',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'screen_size',
      unit: 'inch',
      categories: ['Mobile', 'Tablet'],
    },
    {
      name: 'screenType',
      label: 'Screen Type',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'screen_type',
      categories: ['Mobile', 'Tablet'],
    },
    {
      name: 'resolution',
      label: 'Resolution',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'resolution',
      unit: 'px',
      categories: ['Mobile', 'Tablet'],
    },
    {
      name: 'refreshRate',
      label: 'Refresh Rate',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'refresh_rate',
      unit: 'Hz',
      categories: ['Mobile', 'Tablet'],
    },
    {
      name: 'screenProtection',
      label: 'Screen Protection',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'screen_protection',
      categories: ['Mobile', 'Tablet'],
    },
    {
      name: 'speaker',
      label: 'Speaker',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'speaker',
      categories: ['Mobile', 'Tablet'],
    },
    {
      name: 'batteryCapacity',
      label: 'Battery Capacity',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'battery_capacity',
      unit: 'mAh',
      categories: ['Mobile', 'Tablet'],
    },
    {
      name: 'bodyType',
      label: 'Body Type',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'body_type',
      categories: ['Mobile', 'Tablet'],
    },
    {
      name: 'fingerPrint',
      label: 'Fingerprint',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'finger_print',
      categories: ['Mobile', 'Tablet'],
    },
    {
      name: 'simType',
      label: 'SIM Type',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'sim_type',
      categories: ['Mobile', 'Tablet'],
    },
    {
      name: 'networkBands',
      label: 'Network Bands',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'network_bands',
      categories: ['Mobile', 'Tablet'],
    },
    {
      name: 'hasESim',
      label: 'E-SIM Support',
      type: ModelFilterType.BOOLEAN,
      dbColumn: 'e_sim',
      categories: ['Mobile', 'Tablet'],
    },
  ],
  Tablet: [
    {
      name: 'hasSimSupport',
      label: 'SIM Support',
      type: ModelFilterType.BOOLEAN,
      dbColumn: 'sim_support',
      categories: ['Tablet'],
    },
  ],
  'TV / Monitor': [
    {
      name: 'screenSize',
      label: 'Screen Size',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'screen_size',
      unit: 'inch',
      categories: ['TV / Monitor'],
    },
    {
      name: 'screenType',
      label: 'Screen Type',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'screen_type',
      categories: ['TV / Monitor'],
    },
    {
      name: 'resolution',
      label: 'Resolution',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'resolution',
      unit: 'px',
      categories: ['TV / Monitor'],
    },
    {
      name: 'refreshRate',
      label: 'Refresh Rate',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'refresh_rate',
      unit: 'Hz',
      categories: ['TV / Monitor'],
    },
    {
      name: 'speaker',
      label: 'Speaker',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'speaker',
      categories: ['TV / Monitor'],
    },
    {
      name: 'displayType',
      label: 'Display Type',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'display_type',
      categories: ['TV / Monitor'],
    },
    {
      name: 'os',
      label: 'Operating System',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'os',
      categories: ['TV / Monitor'],
    },
    {
      name: 'isSmartTv',
      label: 'Smart TV',
      type: ModelFilterType.BOOLEAN,
      dbColumn: 'smart_tv',
      categories: ['TV / Monitor'],
    },
    {
      name: 'hasTvCertification',
      label: 'TV Certification',
      type: ModelFilterType.BOOLEAN,
      dbColumn: 'tv_certification',
      categories: ['TV / Monitor'],
    },
    {
      name: 'hasWebcam',
      label: 'Webcam',
      type: ModelFilterType.BOOLEAN,
      dbColumn: 'webcam',
      categories: ['TV / Monitor', 'Desktop Computer'],
    },
  ],
  'Desktop Computer': [
    {
      name: 'desktopType',
      label: 'Desktop Type',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'desktop_type',
      categories: ['Desktop Computer'],
    },
  ],
  Accessories: [
    {
      name: 'accessoryType',
      label: 'Accessory Type',
      type: ModelFilterType.CHECKBOX,
      dbColumn: 'accessory_type',
      categories: ['Accessories'],
    },
  ],
};

/**
 * Normalize an incoming category name (case-insensitive, trims) to a canonical category key
 */
export function normalizeCategoryName(input?: string): string | undefined {
  if (!input) return undefined;
  const target = input.trim().toLowerCase();

  // Build a lookup from all known category keys and labels
  const categoryKeys = Object.keys(CATEGORY_MODEL_FILTERS);

  // 1) Try direct key match (case-insensitive)
  const keyMatch = categoryKeys.find(k => k.toLowerCase() === target);
  if (keyMatch) return keyMatch;

  // 2) Try matching against common filter categories array
  const allCategoryLabels = new Set<string>();
  COMMON_MODEL_FILTERS.forEach(cf => cf.categories.forEach(c => allCategoryLabels.add(c)));

  const labelMatch = Array.from(allCategoryLabels).find(c => c.toLowerCase() === target);
  if (labelMatch) {
    // If label exists but key differs (e.g., 'TV / Monitor'), it should also exist as a key
    const keyFromLabel = categoryKeys.find(k => k.toLowerCase() === labelMatch.toLowerCase());
    return keyFromLabel ?? labelMatch;
  }

  return undefined;
}

/**
 * Get all filters for a specific category (common + category-specific)
 */
export function getFiltersForCategory(categoryName: string): ModelFilterDefinition[] {
  const normalized = normalizeCategoryName(categoryName) ?? categoryName;
  const commonFilters = COMMON_MODEL_FILTERS.filter(f =>
    f.categories.some(c => c.toLowerCase() === normalized.toLowerCase()),
  );
  const categoryFilters = CATEGORY_MODEL_FILTERS[normalized] || [];

  // Merge and deduplicate by name
  const allFilters = [...commonFilters, ...categoryFilters];
  const uniqueFilters = allFilters.filter(
    (filter, index, self) => index === self.findIndex(f => f.name === filter.name),
  );

  return uniqueFilters;
}

/**
 * Get all unique filter names across all categories
 */
export function getAllUniqueFilterNames(): string[] {
  const allFilters = new Set<string>();

  // Add common filters
  COMMON_MODEL_FILTERS.forEach(filter => allFilters.add(filter.name));

  // Add category-specific filters
  Object.values(CATEGORY_MODEL_FILTERS).forEach(filters => {
    filters.forEach(filter => allFilters.add(filter.name));
  });

  return Array.from(allFilters);
}

/**
 * Get filter definition by name
 */
export function getFilterByName(filterName: string, categoryName?: string): ModelFilterDefinition | undefined {
  // Check common filters first
  const commonFilter = COMMON_MODEL_FILTERS.find(f => f.name === filterName);
  if (commonFilter) return commonFilter;

  // Check category-specific filters
  if (categoryName) {
    const normalized = normalizeCategoryName(categoryName) ?? categoryName;
    const categoryFilters = CATEGORY_MODEL_FILTERS[normalized] || [];
    const filter = categoryFilters.find(f => f.name === filterName);
    if (filter) return filter;
  }

  // Search all categories
  for (const filters of Object.values(CATEGORY_MODEL_FILTERS)) {
    const filter = filters.find(f => f.name === filterName);
    if (filter) return filter;
  }

  return undefined;
}

/**
 * Check if a filter is a boolean filter
 */
export function isBooleanFilter(filterName: string): boolean {
  const filter = getFilterByName(filterName);
  return filter?.type === ModelFilterType.BOOLEAN;
}

/**
 * Get all boolean filter names
 */
export function getBooleanFilterNames(): string[] {
  return getAllUniqueFilterNames().filter(name => isBooleanFilter(name));
}
