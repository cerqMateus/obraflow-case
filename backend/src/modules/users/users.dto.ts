import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CatalogQuery, ProjectInput } from '../../infrastructure/http/catalog-query';

export class UsersQuery extends CatalogQuery {
  @IsOptional() @IsIn(['admin', 'operator'])
  role?: 'admin' | 'operator';
}

export class CreateUserInput extends ProjectInput {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail() @MaxLength(254)
  email!: string;

  @IsString() @MinLength(12) @MaxLength(128)
  password!: string;

  @IsIn(['admin', 'operator'])
  role!: 'admin' | 'operator';
}
