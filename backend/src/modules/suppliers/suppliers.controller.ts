import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { SupplierInput, SupplierQuery } from '../../infrastructure/http/catalog-query';
import { Roles } from '../auth/auth.metadata';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(@Inject(SuppliersService) private readonly suppliers: SuppliersService) {}
  @Get() list(@Query() query: SupplierQuery) { return this.suppliers.list(query); }
  @Roles('admin') @Post() create(@Body() input: SupplierInput) { return this.suppliers.create(input); }
}
