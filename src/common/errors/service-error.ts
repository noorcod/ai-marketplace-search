import { BaseError } from './base-error';

export class ServiceError extends BaseError {
  constructor(message: string) {
    super(message, 500);
  }
}
