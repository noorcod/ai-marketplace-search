// src/common/dto/base-response.ts
import { HttpStatus } from '@nestjs/common';
import { ResponseOpts } from '../types/response-options.type';
import { ErrorPayload } from '../types/error-payload.type';

export abstract class BaseResponse<T = unknown> {
  public readonly status: number;
  public readonly success: boolean;
  public readonly message?: string | Record<string, any>;
  public data?: T;
  public readonly meta?: Record<string, any>;

  protected constructor(opts: ResponseOpts<T>) {
    this.status = opts.status;
    this.success = opts.success;
    this.message = opts.message;
    this.data = opts.data;
    this.meta = opts.meta;
  }

  /** 3xx redirect—will return subclass type */
  static Redirect<TResp extends BaseResponse<any>>(
    this: new (opts: ResponseOpts<null>) => TResp,
    url: string,
    status = HttpStatus.FOUND,
  ): TResp {
    return new this({
      status,
      success: true,
      message: `Redirect to ${url}`,
      data: null,
      meta: { redirectTo: url },
    });
  }

  /** 204 No Content—returns subclass too */
  static NoContent<TResp extends BaseResponse<any>>(
    this: new (opts: ResponseOpts<null>) => TResp,
    message = 'No content',
  ): TResp {
    return new this({
      status: HttpStatus.NO_CONTENT,
      success: true,
      message,
      data: null,
    });
  }

  /** Error envelope */
  static Error<TResp extends BaseResponse<any>>(
    this: new (opts: ResponseOpts<null>) => TResp,
    payload: ErrorPayload,
    status = HttpStatus.BAD_REQUEST,
  ): TResp {
    return new this({
      status,
      success: false,
      message: payload,
      data: null,
    });
  }
}
