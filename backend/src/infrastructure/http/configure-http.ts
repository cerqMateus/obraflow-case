import { randomUUID } from 'node:crypto';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from './api-error';
import type { FieldError } from './api-error';
import { ErrorFilter } from './error.filter';

const fieldsOf = (errors: ValidationError[], prefix = ''): FieldError[] => errors.flatMap((error) => {
  const path = prefix ? `${prefix}.${error.property}` : error.property;
  return [
    ...Object.keys(error.constraints ?? {}).map((code) => ({ path, code, message: 'Informe um valor válido.' })),
    ...fieldsOf(error.children ?? [], path),
  ];
});

export const configureHttp = (app: NestExpressApplication): void => {
  app.disable('x-powered-by');
  app.set('query parser', 'simple');
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Request-Id', randomUUID());
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const hasBody = req.headers['transfer-encoding'] !== undefined ||
      (req.headers['content-length'] !== undefined && req.headers['content-length'] !== '0');
    if (hasBody && !req.is('application/json')) {
      next(new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Envie o corpo como application/json.'));
      return;
    }
    const keys = new Set<string>();
    for (const key of new URL(req.originalUrl, 'http://internal').searchParams.keys()) {
      if (keys.has(key)) {
        next(new ApiError(400, 'VALIDATION_ERROR', 'Parâmetros duplicados não são permitidos.'));
        return;
      }
      keys.add(key);
    }
    next();
  });
  app.use(json({ limit: 1024 * 1024, strict: true, inflate: false }));
  app.setGlobalPrefix('api/v1', { exclude: [
    { path: 'health/live', method: RequestMethod.GET },
    { path: 'health/ready', method: RequestMethod.GET },
    { path: 'api/technical-status', method: RequestMethod.GET },
  ] });
  app.useGlobalPipes(new ValidationPipe({
    transform: true, whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true,
    transformOptions: { enableImplicitConversion: false },
    validationError: { target: false, value: false },
    exceptionFactory: (errors) => new ApiError(400, 'VALIDATION_ERROR', 'Revise os campos informados.', fieldsOf(errors)),
  }));
  app.useGlobalFilters(new ErrorFilter());
};
