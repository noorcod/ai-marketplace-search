export type PaginationInfo = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
};

export type PaginatedResponseType<T> = {
  success: boolean;
  message: string;
  paginationInfo: PaginationInfo;
  data: T[];
};
