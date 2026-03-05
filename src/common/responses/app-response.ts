// src/common/dto/app-response.ts
import { BaseResponse } from './base-response';
import { DataLayerResponse } from './data-layer-response';
import { HttpStatus } from '@nestjs/common';
import { ErrorPayload } from '../types/error-payload.type';

export class AppResponse<T = unknown> extends BaseResponse<T | T[]> {
  private constructor(
    status: number,
    success: boolean,
    message?: string | Record<string, any>,
    data?: T | T[],
    meta?: Record<string, any>,
  ) {
    super({ status, success, message, data, meta });
  }

  static Ok<U>(data: U | U[], meta?: Record<string, any>) {
    return new AppResponse(200, true, 'Data retrieved successfully', data, meta);
  }

  static OkWithMessage<U>(message: string, data?: U) {
    return new AppResponse(200, true, message, data);
  }

  static Err(message: string | Record<string, any>, status = HttpStatus.BAD_REQUEST): AppResponse<null> {
    return new AppResponse(status, false, message, null);
  }

  // static fromDataLayer<U>(res: DataLayerResponse<U>) {
  //   return res.success ? this.Ok(res.data!, res.meta) : this.Err(res.message as any, res.status);
  // }
  static fromDataLayer<U>(res: DataLayerResponse<U>) {
    if (res.success) {
      return this.Ok(res.data!, res.meta);
    }
    // here `res.message` is guaranteed to be an ErrorPayload
    return new AppResponse(res.status, false, res.message as ErrorPayload);
  }

  static Generic<U>(status: number, success: boolean, message: string, data?: U) {
    return new AppResponse(status, success, message, data);
  }
}
