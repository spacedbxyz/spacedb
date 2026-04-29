import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import type { Request } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const path = String(httpAdapter.getRequestUrl(request));

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this.buildResponseBody(exception, statusCode, path);
    this.logException(exception, path, statusCode);
    httpAdapter.reply(ctx.getResponse(), body, statusCode);
  }

  private buildResponseBody(
    exception: unknown,
    statusCode: number,
    path: string,
  ) {
    const timestamp = new Date().toISOString();
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object') return { ...response, path, timestamp };
      return { statusCode, message: response, path, timestamp };
    }
    return {
      statusCode,
      message: this.getErrorMessage(exception),
      error: 'Internal Server Error',
      path,
      timestamp,
    };
  }

  private getErrorMessage(exception: unknown): string {
    return exception instanceof Error
      ? exception.message
      : 'An unexpected error occurred';
  }

  private logException(exception: unknown, path: string, statusCode: number) {
    const message = this.getErrorMessage(exception);
    if (statusCode >= 500) {
      this.logger.error(
        `${path} - ${statusCode}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${path} - ${statusCode}: ${message}`);
    }
  }
}
