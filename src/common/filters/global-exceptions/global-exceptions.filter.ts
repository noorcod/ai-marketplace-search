import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseError } from '../../errors/base-error';
import { AppResponse } from '../../responses/app-response';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine the appropriate HTTP status code
    const status =
      exception instanceof BaseError
        ? exception.statusCode
        : exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract the error message or response
    const message =
      exception instanceof BaseError
        ? exception.message
        : exception instanceof HttpException
          ? exception.getResponse()
          : exception['message']
            ? exception['message']
            : 'Internal server error';

    let responseBody: AppResponse<any>;

    // If the message is a string, wrap it as an object.
    if (typeof message === 'string') {
      responseBody = AppResponse.Err({ text: message }, status);
    } else {
      // If message is an object, adjust its structure.
      if (message['message']) {
        message['text'] = message['message'];
        delete message['message'];
      }
      // Also include the request URL for better debugging.
      responseBody = AppResponse.Err({ ...message, path: request.url }, status);
    }

    // TODO: Handle Validation Errors and other types of errors here.

    // Set the HTTP status and send the JSON response.
    response.status(status).json(responseBody);
  }
}
