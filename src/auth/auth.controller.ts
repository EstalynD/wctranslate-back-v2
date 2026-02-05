import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Get,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { CurrentToken } from './decorators/current-token.decorator';
import { AuthGuard } from './guards/auth.guard';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    const sessionInfo = {
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    };

    const result = await this.authService.register(registerDto, sessionInfo);

    return {
      message: 'Usuario registrado exitosamente',
      user: result.user,
      token: result.token,
      expiresAt: result.expiresAt,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const sessionInfo = {
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    };

    const result = await this.authService.login(loginDto, sessionInfo);

    return {
      message: 'Inicio de sesión exitoso',
      user: result.user,
      token: result.token,
      expiresAt: result.expiresAt,
    };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentToken() token: string) {
    await this.authService.logout(token);

    return {
      message: 'Sesión cerrada exitosamente',
    };
  }

  @UseGuards(AuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: UserDocument) {
    const result = await this.authService.logoutAll(user._id.toString());

    return {
      message: 'Todas las sesiones han sido cerradas',
      sessionsInvalidated: result.sessionsInvalidated,
    };
  }

  @UseGuards(AuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@CurrentToken() token: string) {
    const result = await this.authService.refreshToken(token);

    if (!result) {
      return {
        message: 'No se pudo renovar el token',
        success: false,
      };
    }

    return {
      message: 'Token renovado exitosamente',
      token: result.token,
      expiresAt: result.expiresAt,
    };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: UserDocument) {
    return {
      user,
    };
  }

  @UseGuards(AuthGuard)
  @Get('sessions')
  async getSessions(@CurrentUser() user: UserDocument) {
    const sessions = await this.authService.getActiveSessions(
      user._id.toString(),
    );

    return {
      sessions,
      count: sessions.length,
    };
  }

  @Public()
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
