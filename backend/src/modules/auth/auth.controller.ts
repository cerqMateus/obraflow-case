import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentIdentity, LoginRoute, Public } from './auth.metadata';
import type { CsrfResponse, Identity, IdentityRequest, SessionResponse } from './auth.types';
import { LoginInput } from './login.dto';
import { AuthInputGuard } from './auth-input.guard';

@Controller('auth')
@UseGuards(AuthInputGuard)
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Public() @Get('csrf')
  csrf(@Req() req: IdentityRequest): Promise<CsrfResponse> { return this.auth.csrf(req); }

  @Public() @LoginRoute() @Post('login') @HttpCode(200)
  login(@Req() req: IdentityRequest, @Body(new ValidationPipe({ expectedType: LoginInput })) input: LoginInput): Promise<SessionResponse> {
    return this.auth.login(req, input);
  }

  @Get('me')
  me(@Req() req: IdentityRequest, @CurrentIdentity() user: Identity): SessionResponse { return this.auth.me(req, user); }

  @Post('logout') @HttpCode(204)
  logout(@Req() req: IdentityRequest, @Res({ passthrough: true }) res: Response): Promise<void> {
    return this.auth.logout(req, res);
  }
}
