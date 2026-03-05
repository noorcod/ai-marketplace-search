/**
 * Default delivery charges per category when no specific city configuration is found
 * Key: category name (lowercase)
 */
export const DEFAULT_DELIVERY_CHARGES: Record<
  string,
  { intraCityCharges: number; interCityCharges: number; averageWeight: number }
> = {
  mobile: {
    intraCityCharges: 100,
    interCityCharges: 200,
    averageWeight: 0.5,
  },
  laptop: {
    intraCityCharges: 150,
    interCityCharges: 300,
    averageWeight: 2,
  },
  tablet: {
    intraCityCharges: 100,
    interCityCharges: 200,
    averageWeight: 0.8,
  },
  'tv/monitor': {
    intraCityCharges: 200,
    interCityCharges: 400,
    averageWeight: 5,
  },
  desktop: {
    intraCityCharges: 200,
    interCityCharges: 400,
    averageWeight: 8,
  },
  accessories: {
    intraCityCharges: 50,
    interCityCharges: 100,
    averageWeight: 0.2,
  },
  // Fallback for unknown categories
  default: {
    intraCityCharges: 150,
    interCityCharges: 250,
    averageWeight: 1,
  },
};
