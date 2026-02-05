import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

import { Session, SessionDocument } from './schemas/session.schema';

export interface TokenPayload {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class TokenService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    private configService: ConfigService,
  ) {}

  /**
   * Genera un token opaco criptográficamente seguro
   * Los tokens opacos no contienen información del usuario
   * Son simplemente identificadores únicos que referencian una sesión en la base de datos
   */
  generateOpaqueToken(): string {
    // 32 bytes = 256 bits de entropía, convertidos a hex = 64 caracteres
    return randomBytes(32).toString('hex');
  }

  /**
   * Crea una nueva sesión con token opaco
   */
  async createSession(
    userId: Types.ObjectId,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<TokenPayload> {
    const token = this.generateOpaqueToken();
    const expirationHours = this.configService.get<number>(
      'security.tokenExpirationHours',
    ) || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const session = new this.sessionModel({
      userId,
      token,
      expiresAt,
      userAgent: metadata?.userAgent || null,
      ipAddress: metadata?.ipAddress || null,
      lastActivityAt: new Date(),
    });

    await session.save();

    return {
      token,
      expiresAt,
    };
  }

  /**
   * Valida un token y retorna la sesión si es válida
   */
  async validateToken(token: string): Promise<SessionDocument | null> {
    const session = await this.sessionModel.findOne({
      token,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return null;
    }

    // Actualizar última actividad
    session.lastActivityAt = new Date();
    await session.save();

    return session;
  }

  /**
   * Invalida un token específico (logout)
   */
  async invalidateToken(token: string): Promise<boolean> {
    const result = await this.sessionModel.updateOne(
      { token },
      { isActive: false },
    );

    return result.modifiedCount > 0;
  }

  /**
   * Invalida todas las sesiones de un usuario (logout de todos los dispositivos)
   */
  async invalidateAllUserSessions(userId: Types.ObjectId): Promise<number> {
    const result = await this.sessionModel.updateMany(
      { userId, isActive: true },
      { isActive: false },
    );

    return result.modifiedCount;
  }

  /**
   * Obtiene todas las sesiones activas de un usuario
   */
  async getUserActiveSessions(userId: Types.ObjectId): Promise<SessionDocument[]> {
    return this.sessionModel.find({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActivityAt: -1 });
  }

  /**
   * Renueva un token existente (genera uno nuevo manteniendo la sesión)
   */
  async refreshToken(oldToken: string): Promise<TokenPayload | null> {
    const session = await this.validateToken(oldToken);

    if (!session) {
      return null;
    }

    // Generar nuevo token
    const newToken = this.generateOpaqueToken();
    const expirationHours = this.configService.get<number>(
      'security.tokenExpirationHours',
    ) || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    // Actualizar sesión con nuevo token
    session.token = newToken;
    session.expiresAt = expiresAt;
    session.lastActivityAt = new Date();
    await session.save();

    return {
      token: newToken,
      expiresAt,
    };
  }

  /**
   * Limpia sesiones expiradas o inactivas (para mantenimiento)
   */
  async cleanupSessions(): Promise<number> {
    const result = await this.sessionModel.deleteMany({
      $or: [{ expiresAt: { $lt: new Date() } }, { isActive: false }],
    });

    return result.deletedCount;
  }
}
