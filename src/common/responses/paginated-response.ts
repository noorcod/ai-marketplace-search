// src/common/dto/paginated-response.ts
import { HttpStatus } from '@nestjs/common';
import { BaseResponse } from './base-response';
import { PaginationInfo } from '../types/pagination.type';
import { DataLayerResponse } from './data-layer-response';

export class PaginatedResponse<T> extends BaseResponse<T[]> {
  public readonly pagination?: PaginationInfo;
  private constructor(
    items: T[],
    pagination: PaginationInfo | null,
    status: number,
    success: boolean,
    message: string,
  ) {
    // Expose pagination under `pagination` (not `meta`)
    super({ status, success, message, data: items, meta: undefined });
    this.pagination = pagination ?? undefined;
  }

  static Ok<U>(items: U[], pagination: PaginationInfo): PaginatedResponse<U> {
    return new PaginatedResponse<U>(items, pagination, HttpStatus.OK, true, 'Paged data retrieved');
  }

  static Empty(): PaginatedResponse<never> {
    return new PaginatedResponse<never>([], null, HttpStatus.NOT_FOUND, false, 'No data found');
  }

  static GenericError(message: string): PaginatedResponse<never> {
    return new PaginatedResponse<never>([], null, HttpStatus.BAD_REQUEST, false, message);
  }

  // Handle the case where DataLayerResponse has paginated data
  static fromDataLayer<U>(res: DataLayerResponse<U>): PaginatedResponse<U> {
    return new PaginatedResponse<U>(
      res.data as U[],
      res.meta as PaginationInfo,
      HttpStatus.OK,
      true,
      'Paged data retrieved',
    );
  }
}
