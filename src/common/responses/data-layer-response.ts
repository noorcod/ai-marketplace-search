// src/common/dto/data-layer-response.ts
import { HttpStatus } from '@nestjs/common';
import { BaseResponse } from './base-response';
import { ErrorPayload } from '../types/error-payload.type';
import { PaginationInfo } from '../types/pagination.type';

export class DataLayerResponse<T = unknown> extends BaseResponse<T | T[]> {
  private constructor(
    status: number,
    success: boolean,
    message: string | Record<string, any>,
    data?: T | T[],
    meta?: Record<string, any>,
  ) {
    super({ status, success, message, data, meta });
  }

  // --- success with full object ---
  static Ok<U>(data: U): DataLayerResponse<U> {
    return new DataLayerResponse(HttpStatus.OK, true, 'Data retrieved', data);
  }

  static OkWithPagination<U>(data: U[], meta: PaginationInfo): DataLayerResponse<U[]> {
    return new DataLayerResponse<U[]>(HttpStatus.OK, true, 'Data retrieved', data, meta);
  }

  // --- created: return full object or just its id ---
  static Created<U>(data: U): DataLayerResponse<U>;
  static Created(id: number | string): DataLayerResponse<number | string>;
  static Created(arg: any): DataLayerResponse<any> {
    const isPrimitive = ['string', 'number'].includes(typeof arg);
    return new DataLayerResponse(
      HttpStatus.CREATED,
      true,
      'Resource created',
      isPrimitive ? undefined : arg,
      isPrimitive ? { id: arg } : undefined,
    );
  }

  // --- updated: same pattern ---
  static Updated<U>(data: U): DataLayerResponse<U>;
  static Updated(id: number | string): DataLayerResponse<number | string>;
  static Updated(arg: any): DataLayerResponse<any> {
    const isPrimitive = ['string', 'number'].includes(typeof arg);
    return new DataLayerResponse(
      HttpStatus.OK,
      true,
      'Resource updated',
      isPrimitive ? undefined : arg,
      isPrimitive ? { id: arg } : undefined,
    );
  }

  static Deleted(id?: number | string): DataLayerResponse<null> {
    return new DataLayerResponse(HttpStatus.OK, true, 'Resource deleted', null, id !== undefined ? { id } : undefined);
  }

  static EmptyPage<T>(): DataLayerResponse<T[]> {
    return new DataLayerResponse(HttpStatus.OK, true, 'No data found', []);
  }

  // --- error cases ---
  static NotFound(): DataLayerResponse<null> {
    return new DataLayerResponse(HttpStatus.NOT_FOUND, false, 'Not found');
  }

  static AlreadyExists(): DataLayerResponse<null> {
    return new DataLayerResponse(HttpStatus.CONFLICT, false, 'Already exists');
  }

  static QueryError(): DataLayerResponse<null> {
    return new DataLayerResponse(HttpStatus.INTERNAL_SERVER_ERROR, false, 'Query error');
  }

  static GenericError(payload: ErrorPayload, status = HttpStatus.INTERNAL_SERVER_ERROR): DataLayerResponse<null> {
    return new DataLayerResponse(status, false, payload, null);
  }
}
