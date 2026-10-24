import { HttpException } from '@nestjs/common';

export interface FieldError { path: string; code: string; message: string }

export class ApiError extends HttpException {
  constructor(
    status: number,
    readonly code: string,
    message: string,
    readonly fields: FieldError[] = [],
    readonly details: Record<string, unknown> = {},
  ) { super(message, status); }
}

export const invalidField = (path: string): ApiError => new ApiError(
  400, 'VALIDATION_ERROR', 'Revise os campos informados.',
  [{ path, code: 'INVALID_VALUE', message: 'Informe um valor válido.' }],
);
