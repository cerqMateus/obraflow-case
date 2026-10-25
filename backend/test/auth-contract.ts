import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const document: unknown = JSON.parse(readFileSync(resolve(__dirname, '../../docs/openapi.json'), 'utf8'));
const ajv = new Ajv({ strict: false });
addFormats(ajv);
if (typeof document !== 'object' || document === null || Array.isArray(document)) throw new Error('Invalid contract.');
ajv.addSchema(document, 'contract');
const session = ajv.compile({ $ref: 'contract#/components/schemas/Session' });
const csrf = ajv.compile({ $ref: 'contract#/components/schemas/Csrf' });

export const expectAuthContract = (schema: 'Session' | 'Csrf', body: unknown): void => {
  const validate = schema === 'Session' ? session : csrf;
  expect({ valid: validate(body), errors: validate.errors ?? [] }).toEqual({ valid: true, errors: [] });
};
