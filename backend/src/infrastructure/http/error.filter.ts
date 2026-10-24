import { Catch, HttpException } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import type { Response } from 'express';
import { ApiError } from './api-error';
import { databaseError } from './database-error';

const safeErrors: Record<number, [string, string]> = {
  400: ['VALIDATION_ERROR', 'Revise os campos informados.'],
  401: ['UNAUTHENTICATED', 'Entre para continuar.'],
  403: ['FORBIDDEN', 'Operação não permitida.'],
  404: ['RESOURCE_NOT_FOUND', 'Recurso não encontrado.'],
  413: ['PAYLOAD_TOO_LARGE', 'O corpo excede o limite de 1 MiB.'],
  415: ['UNSUPPORTED_MEDIA_TYPE', 'Envie o corpo como application/json.'],
  500: ['INTERNAL_ERROR', 'Não foi possível concluir a operação.'],
  503: ['INTERNAL_ERROR', 'Serviço indisponível.'],
};

const statusOf = (error: unknown): number => {
  if (error instanceof HttpException) return error.getStatus();
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') return 404;
    if (['P1001', 'P1002', 'P1017', 'P2024'].includes(error.code)) return 503;
  }
  if (error instanceof Prisma.PrismaClientInitializationError) return 503;
  if (typeof error === 'object' && error !== null && 'type' in error) {
    if (error.type === 'entity.too.large') return 413;
    if (['entity.parse.failed', 'request.aborted', 'request.size.invalid'].includes(String(error.type))) return 400;
    if (['charset.unsupported', 'encoding.unsupported'].includes(String(error.type))) return 415;
  }
  return 500;
};

@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    error = databaseError(error);
    const response = host.switchToHttp().getResponse<Response>();
    const status = statusOf(error);
    const [code, message] = safeErrors[status] ?? safeErrors[500] ?? ['INTERNAL_ERROR', 'Erro interno.'];
    const requestId = String(response.getHeader('X-Request-Id'));
    // Allowlist log fields: never serialize exceptions, inputs, headers or database messages.
    if (status >= 500) console.error(JSON.stringify({ event: 'http_error', requestId, status, code }));
    response.status(status).json({ error: {
      code: error instanceof ApiError ? error.code : code,
      message: error instanceof ApiError ? error.message : message,
      fields: error instanceof ApiError ? error.fields : [],
      details: error instanceof ApiError ? error.details : {},
      requestId,
    } });
  }
}
