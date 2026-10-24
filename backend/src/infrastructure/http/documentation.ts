import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

const isDocument = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const configureDocumentation = (app: NestExpressApplication): void => {
  // The same versioned file is copied into runtime images; never generate fake controllers.
  const packaged = resolve(__dirname, '../../../contract/openapi.json');
  const document: unknown = JSON.parse(readFileSync(existsSync(packaged) ? packaged :
    resolve(__dirname, '../../../../docs/openapi.json'), 'utf8'));
  if (!isDocument(document)) throw new Error('Invalid packaged OpenAPI document.');
  app.use('/api/docs/openapi.json', (_req: Request, res: Response) => { res.json(document); });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(document, {
    customSiteTitle: 'ObraFlow — contrato planejado',
    swaggerOptions: { supportedSubmitMethods: [], validatorUrl: null, persistAuthorization: false },
  }));
};
