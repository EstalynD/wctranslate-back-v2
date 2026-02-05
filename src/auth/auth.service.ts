import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UsersService } from '../users/users.service';
import { TokenService, TokenPayload } from './token.service';
import { LoginDto, RegisterDto } from './dto';
import { User, UserDocument, UserStatus } from '../users/schemas/user.schema';

export interface AuthResponse {
  user: UserDocument;
  token: string;
  expiresAt: Date;
}

export interface SessionInfo {
  userAgent: string | null;
  ipAddress: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private tokenService: TokenService,
  ) {}

  /**
   * Registra un nuevo usuario y crea una sesión
   */
  async register(
    registerDto: RegisterDto,
    sessionInfo?: SessionInfo,
  ): Promise<AuthResponse> {
    // Crear usuario con la nueva estructura
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      profile: {
        firstName: registerDto.profile.firstName,
        lastName: registerDto.profile.lastName,
        nickName: registerDto.profile.nickName,
      },
    });

    // Crear sesión con token opaco
    const tokenPayload = await this.tokenService.createSession(user._id, {
      userAgent: sessionInfo?.userAgent ?? undefined,
      ipAddress: sessionInfo?.ipAddress ?? undefined,
    });

    // Actualizar último login
    await this.usersService.updateLastLogin(user._id.toString());

    return {
      user,
      token: tokenPayload.token,
      expiresAt: tokenPayload.expiresAt,
    };
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async login(loginDto: LoginDto, sessionInfo?: SessionInfo): Promise<AuthResponse> {
    // Buscar usuario con contraseña
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar estado del usuario
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Tu cuenta está inactiva. Contacta al administrador.',
      );
    }

    // Verificar acceso de suscripción
    if (!user.subscriptionAccess?.isActive) {
      throw new UnauthorizedException(
        'Tu suscripción no está activa. Contacta al administrador.',
      );
    }

    // Verificar contraseña - necesitamos obtener el usuario con la contraseña
    const userWithPassword = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );

    if (!userWithPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      userWithPassword.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Crear sesión con token opaco
    const tokenPayload = await this.tokenService.createSession(user._id, {
      userAgent: sessionInfo?.userAgent ?? undefined,
      ipAddress: sessionInfo?.ipAddress ?? undefined,
    });

    // Actualizar último login
    await this.usersService.updateLastLogin(user._id.toString());

    return {
      user,
      token: tokenPayload.token,
      expiresAt: tokenPayload.expiresAt,
    };
  }

  /**
   * Cierra sesión invalidando el token
   */
  async logout(token: string): Promise<void> {
    await this.tokenService.invalidateToken(token);
  }

  /**
   * Cierra todas las sesiones del usuario
   */
  async logoutAll(userId: string): Promise<{ sessionsInvalidated: number }> {
    const user = await this.usersService.findById(userId);
    const count = await this.tokenService.invalidateAllUserSessions(user._id);
    return { sessionsInvalidated: count };
  }

  /**
   * Valida un token y retorna el usuario
   */
  async validateToken(token: string): Promise<UserDocument | null> {
    const session = await this.tokenService.validateToken(token);

    if (!session) {
      return null;
    }

    try {
      const user = await this.usersService.findById(session.userId.toString());

      if (user.status !== UserStatus.ACTIVE) {
        // Invalidar sesión si el usuario ya no está activo
        await this.tokenService.invalidateToken(token);
        return null;
      }

      return user;
    } catch {
      return null;
    }
  }

  /**
   * Refresca el token (obtiene uno nuevo)
   */
  async refreshToken(token: string): Promise<TokenPayload | null> {
    const session = await this.tokenService.validateToken(token);

    if (!session) {
      return null;
    }

    // Verificar que el usuario sigue activo
    try {
      const user = await this.usersService.findById(session.userId.toString());
      if (user.status !== UserStatus.ACTIVE) {
        await this.tokenService.invalidateToken(token);
        return null;
      }
    } catch {
      return null;
    }

    return this.tokenService.refreshToken(token);
  }

  /**
   * Obtiene las sesiones activas del usuario
   */
  async getActiveSessions(userId: string) {
    const user = await this.usersService.findById(userId);
    const sessions = await this.tokenService.getUserActiveSessions(user._id);

    return sessions.map((session) => ({
      id: session._id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      lastActivityAt: session.lastActivityAt,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }));
  }
}
