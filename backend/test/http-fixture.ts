import { Body, Controller, Get, HttpCode, Module, Param, Post, Query } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQuery, parseBoolean } from '../src/infrastructure/http/pagination';
import { UuidPipe } from '../src/infrastructure/http/uuid.pipe';
import { HealthController } from '../src/infrastructure/health.controller';
import { DatabaseModule } from '../src/infrastructure/database/database.module';

export class Input {
  @IsString() @Matches(/^(0|[1-9]\d*)(\.\d{1,2})?$/)
  amount!: string;
}

class ProbeQuery extends PaginationQuery {
  @IsOptional() @IsBoolean()
  @Transform(({ value }: { value: unknown }) => parseBoolean(value, 'active'))
  active?: boolean;
}

// Only the test module imports these routes. They are absent from AppModule/runtime.
@Controller('probe')
class ProbeController {
  @Post() create(@Body() input: Input): Input { return input; }
  @Get() list(@Query() query: ProbeQuery): ProbeQuery { return query; }
  @Get('uuid/:id') id(@Param('id', new UuidPipe()) id: string): { id: string } { return { id }; }
  @Get('failure') fail(): never { throw new Error('password=secret SQL SELECT token'); }
  @Post('empty') @HttpCode(204) empty(): void { return; }
}

@Module({ imports: [DatabaseModule], controllers: [HealthController, ProbeController] })
export class HttpTestModule {}
