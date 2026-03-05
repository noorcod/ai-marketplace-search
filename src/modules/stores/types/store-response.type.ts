export type StoreResponseType = {
  shopId: number;
  shopName: string;
  username: string;
  onTrial: boolean;
  onPayment: boolean;
  logoPath?: string;
  cities: string[];
  locations: {
    locationName: string;
    latitude: number;
    longitude: number;
  };
  reviewSummary: {
    totalReviews: number;
    averageRating: string;
  };
};
