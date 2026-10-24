import { configuration } from '../src/infrastructure/configuration';
import { parseBoolean, parsePositiveInteger, projectPage } from '../src/infrastructure/http/pagination';
import { databaseError } from '../src/infrastructure/http/database-error';
import { Prisma } from '../generated/prisma';
import { ApiError } from '../src/infrastructure/http/api-error';

const valid: NodeJS.ProcessEnv = {
  APP_ENV: 'local', APP_ORIGIN: 'http://localhost:8080', SESSION_SECRET: 'a'.repeat(64),
  DATABASE_URL: 'postgresql://demo:demo@localhost:5432/demo',
};

describe('Validated runtime configuration', () => {
  it('derives cookies from the canonical origin', () => {
    expect(configuration(valid)).toMatchObject({ port: 3000, secureCookie: false });
    expect(configuration({ ...valid, APP_ENV: 'production', APP_ORIGIN: 'https://obraflow.test' }).secureCookie).toBe(true);
  });
  it.each([
    { SESSION_SECRET: '' }, { SESSION_SECRET: 'replace-me'.repeat(10) }, { APP_ENV: 'unknown' },
    { APP_ORIGIN: 'http://localhost:8080/path' }, { APP_ORIGIN: 'http://localhost:8080/' },
    { APP_ORIGIN: 'https://user:password@demo.test' }, { APP_ENV: 'production' },
    { COOKIE_SECURE: 'true' }, { PORT: '1e3' }, { PORT: '65536' }, { PORT: '0' },
    { DATABASE_URL: 'https://database.test' }, { DATABASE_URL: 'postgresql://demo@localhost/demo' },
  ])('refuses unsafe or incomplete settings %j', (override) => {
    expect(() => configuration({ ...valid, ...override })).toThrow();
  });
});

describe('Strict parsing and explicit response projection', () => {
  it.each(['1', '0', 'TRUE', '', true, false, [], undefined])('rejects noncanonical boolean %j', (value) => {
    expect(() => parseBoolean(value, 'active')).toThrow();
  });
  it('accepts only literal query booleans', () => {
    expect(parseBoolean('true', 'active')).toBe(true);
    expect(parseBoolean('false', 'active')).toBe(false);
    expect(parsePositiveInteger('1', 'page')).toBe(1);
  });
  it('requires projection and preserves pages beyond the end', () => {
    const query = { page: 3, pageSize: 20 };
    expect(projectPage([], 1, query, (row: { id: string }) => ({ id: row.id })))
      .toEqual({ data: [], meta: { ...query, total: 1, totalPages: 1 } });
    expect(projectPage([{ id: 'visible', passwordHash: 'private' }], 1, query, (row) => ({ id: row.id })).data)
      .toEqual([{ id: 'visible' }]);
  });
});

describe('Safe database error translation', () => {
  it.each([
    ['P2002', { target: ['email'] }, 'EMAIL_ALREADY_EXISTS', 409],
    ['P2003', {}, 'RESOURCE_NOT_FOUND', 404],
    ['P2004', {}, 'VALIDATION_ERROR', 400],
  ] as const)('translates predictable %s without exposing database messages', (code, meta, expected, status) => {
    const result = databaseError(new Prisma.PrismaClientKnownRequestError('SQL password=secret', {
      code, clientVersion: '6.19.3', meta,
    }));
    expect(result).toBeInstanceOf(ApiError);
    if (!(result instanceof ApiError)) throw new Error('Expected translated error.');
    expect(result.code).toBe(expected);
    expect(result.getStatus()).toBe(status);
    expect(result.message).not.toContain('secret');
  });
  it('does not invent a conflict without use case context', () => {
    const error = new Prisma.PrismaClientKnownRequestError('private', {
      code: 'P2002', clientVersion: '6.19.3', meta: { target: ['unknown'] },
    });
    expect(databaseError(error)).toBe(error);
  });
});
