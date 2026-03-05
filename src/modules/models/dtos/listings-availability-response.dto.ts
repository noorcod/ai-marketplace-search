export class ListingsAvailabilityResponseDto {
  model: {
    id?: number;
    title?: string;
    name?: string;
    brandId?: number;
    brandName?: string;
    categoryId?: number;
    categoryName?: string;
  };

  result: {
    matchedOn: 'modelTitle' | 'modelName' | 'brandName' | 'none';
    searchTerm: string | null;
    total: number;
  };

  samples: Array<{
    listingId: number;
    listingTitle: string;
    effectivePrice?: number;
    cityName?: string;
    conditionName?: string;
    shopName?: string;
    shopUsername?: string;
  }>;
}
