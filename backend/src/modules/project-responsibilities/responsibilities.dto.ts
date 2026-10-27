import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { PaginationQuery, parseBoolean } from '../../infrastructure/http/pagination';

export class ResponsibilityQuery extends PaginationQuery {
  @Transform(({ value }: { value: unknown }) => parseBoolean(value, 'active'))
  @IsOptional() @IsBoolean()
  active?: boolean;

  @IsOptional() @IsUUID()
  operatorId?: string;
}

export class GrantResponsibilityInput {
  @IsUUID()
  operatorId!: string;
}
