import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { Roles } from '../auth/auth.metadata';
import { CreateUserInput, UsersQuery } from './users.dto';
import { UsersService } from './users.service';

@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}
  @Get() list(@Query() query: UsersQuery) { return this.users.list(query); }
  @Post() create(@Body() input: CreateUserInput) { return this.users.create(input); }
}
