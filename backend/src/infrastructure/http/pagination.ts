import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { invalidField } from './api-error';

export const parsePositiveInteger = (value: unknown, path: string): number => {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) throw invalidField(path);
  const result = Number(value);
  if (!Number.isSafeInteger(result)) throw invalidField(path);
  return result;
};

export const parseBoolean = (value: unknown, path: string): boolean => {
  if (value !== 'true' && value !== 'false') throw invalidField(path);
  return value === 'true';
};

export class PaginationQuery {
  @Transform(({ value }: { value: unknown }) => parsePositiveInteger(value, 'page'))
  @IsInt() @Min(1)
  page = 1;

  @Transform(({ value }: { value: unknown }) => parsePositiveInteger(value, 'pageSize'))
  @IsInt() @Min(1) @Max(100)
  pageSize = 20;
}

// Callers must supply an authorized count and rows from the same database snapshot.
// Projection is mandatory; ORM records can never be returned implicitly.
export const projectPage = <Row, Dto>(
  rows: readonly Row[], total: number, query: PaginationQuery, project: (row: Row) => Dto,
): { data: Dto[]; meta: { page: number; pageSize: number; total: number; totalPages: number } } => ({
  data: rows.map(project),
  meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
});
