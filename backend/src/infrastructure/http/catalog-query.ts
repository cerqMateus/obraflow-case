import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationQuery } from './pagination';

export const trimText = ({ value }: { value: unknown }): unknown => typeof value === 'string' ? value.trim() : value;

export class CatalogQuery extends PaginationQuery {
  @Transform(trimText) @IsOptional() @IsString() @MinLength(1) @MaxLength(120)
  search?: string;
}

export class SupplierQuery extends PaginationQuery {
  @Transform(trimText) @IsOptional() @IsString() @MinLength(1) @MaxLength(160)
  search?: string;
}

export class ProjectInput {
  @Transform(trimText) @IsString() @MinLength(1) @MaxLength(120)
  name!: string;
}

export class SupplierInput {
  @Transform(trimText) @IsString() @MinLength(1) @MaxLength(160)
  name!: string;
}

// Prisma's contains uses LIKE: escape pattern characters to search literal text.
export const literalSearch = (search: string): string => search.replace(/[\\%_]/g, '\\$&');
