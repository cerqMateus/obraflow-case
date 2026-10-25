import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { SessionService } from './session.service';
import { LoginRateLimit } from './login-rate-limit';
import { AuthInputGuard } from './auth-input.guard';

@Module({
  imports: [DatabaseModule], controllers: [AuthController],
  providers: [AuthService, SessionService, LoginRateLimit, AuthInputGuard, { provide: APP_GUARD, useClass: AuthGuard }],
  exports: [SessionService],
})
export class AuthModule {}
