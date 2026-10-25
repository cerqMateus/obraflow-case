import { Controller, Get, Module, Post } from '@nestjs/common';
import { AuthModule } from '../src/modules/auth/auth.module';
import { CurrentIdentity, Roles } from '../src/modules/auth/auth.metadata';
import type { Identity } from '../src/modules/auth/auth.types';

// No test authorization routes are registered by the runtime AppModule.
@Controller('auth-probe')
class AuthorizationProbe {
  @Get('private') read(@CurrentIdentity() identity: Identity): Identity { return identity; }
  @Roles('admin') @Get('admin') admin(@CurrentIdentity() identity: Identity): Identity { return identity; }
  @Roles('operator') @Post('operator') operator(@CurrentIdentity() identity: Identity): Identity { return identity; }
}

@Module({ imports: [AuthModule], controllers: [AuthorizationProbe] })
export class AuthTestModule {}
