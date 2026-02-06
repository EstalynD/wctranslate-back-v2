import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import {
  User,
  UserDocument,
  UserStatus,
  UserRole,
  PlanType,
  UserStage,
} from './schemas/user.schema';
import {
  CreateUserDto,
  AdminCreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UpdateGamificationDto,
  UpdateSubscriptionAccessDto,
  AssignPlatformDto,
  QueryUsersDto,
} from './dto';
import { Platform, PlatformDocument } from '../platforms/schemas/platform.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Platform.name) private platformModel: Model<PlatformDocument>,
    private configService: ConfigService,
  ) {}

  // ==================== HELPERS ====================

  /**
   * Determina si un rol es administrativo (sin gamificación ni progreso diario)
   */
  private isAdministrativeRole(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.STUDIO;
  }

  // ==================== CREATE ====================

  /**
   * Crea un usuario básico (usado por auth.register para auto-registro de modelos)
   */
  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email.toLowerCase(),
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await this.hashPassword(createUserDto.password);
    const role = createUserDto.role || UserRole.MODEL;
    const isAdmin = this.isAdministrativeRole(role);

    const user = new this.userModel({
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
      role,
      profile: {
        firstName: createUserDto.profile.firstName,
        lastName: createUserDto.profile.lastName,
        nickName: createUserDto.profile.nickName || null,
        avatarUrl: null,
        bio: null,
      },
      // Admins/Studios NO tienen gamificación
      gamification: isAdmin
        ? { level: 0, stars: 0, currentXp: 0 }
        : { level: 1, stars: 0, currentXp: 0 },
      // Admins/Studios NO tienen progreso diario
      dailyProgress: isAdmin
        ? { tasksCompletedToday: 0, lastTaskDate: null, maxDailyTasks: 0 }
        : { tasksCompletedToday: 0, lastTaskDate: null, maxDailyTasks: 1 },
      subscriptionAccess: {
        isActive: true,
        planType: PlanType.TESTER,
        expiresAt: null,
      },
      modelConfig: {
        platformId: null,
        stage: UserStage.INICIACION,
        isSuperUser: false,
        isDemo: false,
        studioId: null,
      },
    });

    return user.save();
  }

  /**
   * Crea un usuario desde el panel de admin con opciones avanzadas
   * (plataforma, plan, estudio, rol, etc.)
   */
  async adminCreate(dto: AdminCreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await this.hashPassword(dto.password);
    const role = dto.role || UserRole.MODEL;
    const isAdmin = this.isAdministrativeRole(role);

    // Validar que la plataforma exista si se proporcionó
    let platformId: Types.ObjectId | null = null;
    if (!isAdmin && dto.platformId) {
      const platform = await this.platformModel.findById(dto.platformId).exec();
      if (!platform) {
        throw new BadRequestException('La plataforma especificada no existe');
      }
      platformId = platform._id as Types.ObjectId;
    }

    const user = new this.userModel({
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      role,
      profile: {
        firstName: dto.profile.firstName,
        lastName: dto.profile.lastName,
        nickName: dto.profile.nickName || null,
        avatarUrl: null,
        bio: null,
      },
      // Admins/Studios NO tienen gamificación
      gamification: isAdmin
        ? { level: 0, stars: 0, currentXp: 0 }
        : { level: 1, stars: 0, currentXp: 0 },
      // Admins/Studios NO tienen progreso diario
      dailyProgress: isAdmin
        ? { tasksCompletedToday: 0, lastTaskDate: null, maxDailyTasks: 0 }
        : { tasksCompletedToday: 0, lastTaskDate: null, maxDailyTasks: 1 },
      subscriptionAccess: {
        isActive: true,
        planType: dto.planType || PlanType.TESTER,
        expiresAt: null,
      },
      modelConfig: {
        platformId: isAdmin ? null : (platformId || null),
        stage: isAdmin ? UserStage.INICIACION : (dto.stage || UserStage.INICIACION),
        isSuperUser: dto.isSuperUser || false,
        isDemo: dto.isDemo || false,
        studioId: dto.studioId ? new Types.ObjectId(dto.studioId) : null,
      },
    });

    return user.save();
  }

  // ==================== READ ====================

  async findAll(query: QueryUsersDto): Promise<{
    users: UserDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { status, role, search, page = 1, limit = 10 } = query;

    // Sanitizar paginación
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (safePage - 1) * safeLimit;

    const filter: Record<string, any> = {};

    if (status) filter.status = status;
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { 'profile.nickName': { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .skip(skip)
        .limit(safeLimit)
        .sort({ createdAt: -1 }),
      this.userModel.countDocuments(filter),
    ]);

    return {
      users,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findById(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password');
  }

  // ==================== UPDATE ====================

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.findById(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('El email ya está en uso');
      }
      user.email = updateUserDto.email.toLowerCase();
    }

    if (updateUserDto.profile) {
      user.profile = {
        ...user.profile,
        ...updateUserDto.profile,
      };
    }

    if (updateUserDto.role) {
      const wasAdmin = this.isAdministrativeRole(user.role);
      const willBeAdmin = this.isAdministrativeRole(updateUserDto.role);

      user.role = updateUserDto.role;

      // Si cambia de admin a modelo, inicializar gamificación
      if (wasAdmin && !willBeAdmin && user.gamification.level === 0) {
        user.gamification = { level: 1, stars: 0, currentXp: 0 };
        user.dailyProgress = { tasksCompletedToday: 0, lastTaskDate: null, maxDailyTasks: 1 };
      }

      // Si cambia de modelo a admin, limpiar gamificación
      if (!wasAdmin && willBeAdmin) {
        user.gamification = { level: 0, stars: 0, currentXp: 0 };
        user.dailyProgress = { tasksCompletedToday: 0, lastTaskDate: null, maxDailyTasks: 0 };
      }
    }

    if (updateUserDto.status) {
      user.status = updateUserDto.status;
    }

    return user.save();
  }

  async updateProfile(
    id: string,
    profileUpdate: Partial<CreateUserDto['profile']>,
  ): Promise<UserDocument> {
    const user = await this.findById(id);

    user.profile = {
      ...user.profile,
      ...profileUpdate,
    };

    return user.save();
  }

  // ==================== PLATFORM ASSIGNMENT ====================

  /**
   * Asigna o cambia la plataforma de streaming a un modelo.
   * Retorna el usuario actualizado.
   * Solo aplica a usuarios con rol MODEL.
   */
  async assignPlatform(
    id: string,
    dto: AssignPlatformDto,
  ): Promise<UserDocument> {
    const user = await this.findById(id);

    if (this.isAdministrativeRole(user.role)) {
      throw new BadRequestException(
        'Solo se puede asignar plataforma a usuarios con rol MODELO',
      );
    }

    // Validar que la plataforma existe
    const platform = await this.platformModel.findById(dto.platformId).exec();
    if (!platform) {
      throw new BadRequestException('La plataforma especificada no existe');
    }

    user.modelConfig = {
      ...user.modelConfig,
      platformId: platform._id as Types.ObjectId,
    };

    return user.save();
  }

  // ==================== GAMIFICATION ====================

  async updateGamification(
    id: string,
    gamificationUpdate: UpdateGamificationDto,
  ): Promise<UserDocument> {
    const user = await this.findById(id);

    if (this.isAdministrativeRole(user.role)) {
      throw new BadRequestException(
        'Los usuarios administrativos no tienen gamificación',
      );
    }

    user.gamification = {
      ...user.gamification,
      ...gamificationUpdate,
    };

    return user.save();
  }

  async addXp(id: string, xpAmount: number): Promise<UserDocument> {
    if (!xpAmount || xpAmount < 1) {
      throw new BadRequestException('La cantidad de XP debe ser al menos 1');
    }

    const user = await this.findById(id);

    if (this.isAdministrativeRole(user.role)) {
      throw new BadRequestException(
        'Los usuarios administrativos no tienen gamificación',
      );
    }

    user.gamification.currentXp += xpAmount;

    // Lógica de level up (100 XP por nivel)
    const xpPerLevel = 100;
    while (user.gamification.currentXp >= xpPerLevel) {
      user.gamification.currentXp -= xpPerLevel;
      user.gamification.level += 1;
    }

    return user.save();
  }

  async addStars(id: string, starsAmount: number): Promise<UserDocument> {
    if (!starsAmount || starsAmount < 1) {
      throw new BadRequestException('La cantidad de estrellas debe ser al menos 1');
    }

    const user = await this.findById(id);

    if (this.isAdministrativeRole(user.role)) {
      throw new BadRequestException(
        'Los usuarios administrativos no tienen gamificación',
      );
    }

    user.gamification.stars += starsAmount;
    return user.save();
  }

  // ==================== SUBSCRIPTION ====================

  async updateSubscriptionAccess(
    id: string,
    subscriptionUpdate: UpdateSubscriptionAccessDto,
  ): Promise<UserDocument> {
    const user = await this.findById(id);

    user.subscriptionAccess = {
      ...user.subscriptionAccess,
      ...subscriptionUpdate,
    };

    return user.save();
  }

  // ==================== PASSWORD ====================

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userModel.findById(id).select('+password');

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isPasswordValid = await this.validatePassword(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    user.password = await this.hashPassword(changePasswordDto.newPassword);
    await user.save();
  }

  // ==================== METADATA ====================

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      lastLoginAt: new Date(),
    });
  }

  // ==================== DELETE ====================

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    await user.deleteOne();
  }

  async softDelete(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    user.status = UserStatus.INACTIVE;
    return user.save();
  }

  // ==================== UTILS ====================

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds =
      this.configService.get<number>('security.bcryptSaltRounds') || 12;
    return bcrypt.hash(password, saltRounds);
  }
}
