export type FetchStoresFiltersType = {
  categoryId?: string;
  cityId?: string;
  search?: string;
};

export type FetchStoreOptionsType = {
  criteria?: 'most-listings' | 'most-viewed' | 'multi-category';
  sort?: string; // e.g., 'username:asc' or 'createdAt:desc'
};
