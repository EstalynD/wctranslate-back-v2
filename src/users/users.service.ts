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
  PlanType,
} from './schemas/user.schema';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UpdateGamificationDto,
  UpdateSubscriptionAccessDto,
} from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email.toLowerCase(),
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await this.hashPassword(createUserDto.password);

    const user = new this.userModel({
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
      role: createUserDto.role,
      profile: {
        firstName: createUserDto.profile.firstName,
        lastName: createUserDto.profile.lastName,
        nickName: createUserDto.profile.nickName || null,
        avatarUrl: null,
        bio: null,
      },
      gamification: {
        level: 1,
        stars: 0,
        currentXp: 0,
      },
      subscriptionAccess: {
        isActive: true,
        planType: PlanType.TESTER,
        expiresAt: null, // Ilimitado para TESTER
      },
    });

    return user.save();
  }

  async findAll(
    page = 1,
    limit = 10,
    status?: UserStatus,
  ): Promise<{
    users: UserDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      this.userModel.countDocuments(query),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
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
      user.role = updateUserDto.role;
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

  async updateGamification(
    id: string,
    gamificationUpdate: UpdateGamificationDto,
  ): Promise<UserDocument> {
    const user = await this.findById(id);

    user.gamification = {
      ...user.gamification,
      ...gamificationUpdate,
    };

    return user.save();
  }

  async addXp(id: string, xpAmount: number): Promise<UserDocument> {
    const user = await this.findById(id);

    user.gamification.currentXp += xpAmount;

    // Lógica simple de level up (100 XP por nivel)
    const xpPerLevel = 100;
    while (user.gamification.currentXp >= xpPerLevel) {
      user.gamification.currentXp -= xpPerLevel;
      user.gamification.level += 1;
    }

    return user.save();
  }

  async addStars(id: string, starsAmount: number): Promise<UserDocument> {
    const user = await this.findById(id);
    user.gamification.stars += starsAmount;
    return user.save();
  }

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

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      lastLoginAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    await user.deleteOne();
  }

  async softDelete(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    user.status = UserStatus.INACTIVE;
    return user.save();
  }

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
