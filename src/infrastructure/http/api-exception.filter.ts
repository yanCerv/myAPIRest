import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const apiError = this.toApiError(exception);

    if (!(exception instanceof HttpException)) {
      const error = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(
        `Unhandled error for ${request.method} ${request.url}: ${error.message}`,
        error.stack,
      );
    }

    response.status(apiError.statusCode).json(apiError);
  }

  private toApiError(exception: unknown): ApiErrorResponse {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_ERROR',
        message: 'Ocurrió un error inesperado. Inténtalo de nuevo más tarde.',
      };
    }

    const statusCode = exception.getStatus();
    const message = this.getExceptionMessage(exception);

    if (statusCode === HttpStatus.BAD_REQUEST) {
      if (message === 'Payment details are invalid.') {
        return {
          statusCode,
          code: 'PAYMENT_INVALID_DETAILS',
          message: 'Verifica nuevamente los datos de tu cuenta bancaria e inténtalo nuevamente.',
        };
      }
      return {
        statusCode,
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son válidos.',
      };
    }

    if (statusCode === HttpStatus.UNAUTHORIZED) {
      return this.unauthorizedError(message);
    }

    if (statusCode === HttpStatus.FORBIDDEN) {
      return {
        statusCode,
        code: 'AUTH_FORBIDDEN',
        message: 'No tienes permiso para realizar esta acción.',
      };
    }

    if (statusCode === HttpStatus.NOT_FOUND) {
      return {
        statusCode,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Recurso no encontrado.',
      };
    }

    if (statusCode === HttpStatus.CONFLICT) {
      if (message === 'Seats are no longer available.') {
        return {
          statusCode,
          code: 'SEATS_UNAVAILABLE',
          message: 'Uno o más asientos ya no están disponibles. Selecciona otros e inténtalo nuevamente.',
        };
      }
      if (message === 'Google account link required.') {
        return {
          statusCode,
          code: 'AUTH_PROVIDER_LINK_REQUIRED',
          message: 'Inicia sesión con tu método original antes de vincular Google.',
        };
      }
      return {
        statusCode,
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'El correo ya está registrado.',
      };
    }

    if (statusCode === HttpStatus.TOO_MANY_REQUESTS) {
      return {
        statusCode,
        code: 'RATE_LIMITED',
        message: 'Demasiados intentos. Inténtalo de nuevo más tarde.',
      };
    }

    if (statusCode === HttpStatus.PAYMENT_REQUIRED) {
      return {
        statusCode,
        code: 'PAYMENT_DECLINED',
        message: 'El banco rechazó la compra. Inténtalo nuevamente más tarde.',
      };
    }

    if (statusCode === HttpStatus.SERVICE_UNAVAILABLE) {
      return {
        statusCode,
        code: 'UPSTREAM_UNAVAILABLE',
        message: 'El servicio externo no está disponible. Inténtalo de nuevo más tarde.',
      };
    }

    return {
      statusCode,
      code: 'HTTP_ERROR',
      message: 'No fue posible completar la solicitud.',
    };
  }

  private unauthorizedError(message: string): ApiErrorResponse {
    const knownErrors: Record<string, Omit<ApiErrorResponse, 'statusCode'>> = {
      'Invalid email or password.': {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Correo o contraseña inválidos.',
      },
      'Invalid refresh token.': {
        code: 'AUTH_INVALID_REFRESH_TOKEN',
        message: 'La sesión ya no es válida. Inicia sesión nuevamente.',
      },
      'Invalid or expired password reset code.': {
        code: 'PASSWORD_RESET_INVALID_OR_EXPIRED',
        message: 'El código de recuperación es inválido o expiró.',
      },
      'Invalid or expired login code.': {
        code: 'AUTH_INVALID_LOGIN_OTP',
        message: 'El código de inicio de sesión es inválido o expiró.',
      },
      'Invalid Google ID token.': {
        code: 'AUTH_INVALID_GOOGLE_ID_TOKEN',
        message: 'No fue posible verificar tu cuenta de Google.',
      },
    };

    return {
      statusCode: HttpStatus.UNAUTHORIZED,
      ...(knownErrors[message] ?? {
        code: 'AUTH_UNAUTHORIZED',
        message: 'No estás autorizado para realizar esta acción.',
      }),
    };
  }

  private getExceptionMessage(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === 'string') return response;
    const message = (response as { message?: unknown }).message;
    if (Array.isArray(message)) return 'Validation error';
    return typeof message === 'string' ? message : exception.message;
  }
}
