// database-error.ts
import { BaseError } from './base-error';

export class DatabaseError extends BaseError {
  constructor(message: string) {
    super(message, 500);
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(message: string) {
    super(`Database Connection Error: ${message}`);
  }
}

export class DatabaseQueryError extends DatabaseError {
  constructor(message: string) {
    super(`Database Query Error: ${message}`);
  }
}

export class DatabaseTransactionError extends DatabaseError {
  constructor(message: string) {
    super(`Database Transaction Error: ${message}`);
  }
}

export class DatabaseValidationError extends DatabaseError {
  constructor(message: string) {
    super(`Database Validation Error: ${message}`);
  }
}
