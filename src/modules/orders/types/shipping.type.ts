export type ShippingListingMeta = {
  categoryId?: number;
  categoryName?: string;
  shopCityId?: number;
  shopId?: number;
};

export type ShippingCalculationResult = {
  listingId: number;
  itemId?: number;
  categoryId?: number;
  categoryName?: string;
  shopCityId?: number;
  shopId?: number;
  destinationCityId?: number;
  isSameCity?: boolean;
  shippingCharge?: number;
  error?: string;
};
