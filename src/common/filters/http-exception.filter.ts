import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface MongoErrorLike {
  code?: number;
  name?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let error = 'Internal Server Error';

    // Manejo de excepciones HTTP de NestJS
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message =
          (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || 'Error';
      } else {
        message = exceptionResponse as string;
      }
    }
    // Manejo de errores de MongoDB (duplicados, validación, etc.)
    else if (this.isMongoError(exception) && (exception as MongoErrorLike).code === 11000) {
      status = HttpStatus.CONFLICT;
      message = 'El registro ya existe';
      error = 'Conflict';
    }
    // Manejo de errores de validación de Mongoose
    else if ((exception as any)?.name === 'ValidationError') {
      status = HttpStatus.BAD_REQUEST;
      message = Object.values((exception as any).errors)
        .map((err: any) => err.message)
        .join(', ');
      error = 'Validation Error';
    }
    // Otros errores
    else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log del error en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('Exception:', exception);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error,
      message: Array.isArray(message) ? message : [message],
      timestamp: new Date().toISOString(),
    });
  }

  private isMongoError(exception: unknown): exception is MongoErrorLike {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception
    );
  }
}
