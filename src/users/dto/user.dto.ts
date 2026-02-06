import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  Matches,
  ValidateNested,
  IsNumber,
  IsBoolean,
  IsMongoId,
  Min,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, UserStatus, PlanType, UserStage } from '../schemas/user.schema';

// --- Profile DTOs ---
export class CreateProfileDto {
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El apellido no puede exceder 50 caracteres' })
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}

// --- User DTOs ---

/**
 * DTO base para crear un usuario (usado internamente por auth.register)
 */
export class CreateUserDto {
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100, { message: 'La contraseña no puede exceder 100 caracteres' })
  password: string;

  @ValidateNested()
  @Type(() => CreateProfileDto)
  profile: CreateProfileDto;

  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol no es válido' })
  role?: UserRole;
}

/**
 * DTO para que un Admin cree un usuario (modelo/admin/studio) con asignación de plataforma
 */
export class AdminCreateUserDto {
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100, { message: 'La contraseña no puede exceder 100 caracteres' })
  password: string;

  @ValidateNested()
  @Type(() => CreateProfileDto)
  profile: CreateProfileDto;

  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol no es válido' })
  role?: UserRole;

  // --- Campos específicos para modelos ---

  @IsOptional()
  @IsMongoId({ message: 'ID de plataforma inválido' })
  platformId?: string;

  @IsOptional()
  @IsEnum(UserStage, { message: 'Etapa no válida' })
  stage?: UserStage;

  @IsOptional()
  @IsBoolean()
  isSuperUser?: boolean;

  @IsOptional()
  @IsBoolean()
  isDemo?: boolean;

  @IsOptional()
  @IsMongoId({ message: 'ID de estudio inválido' })
  studioId?: string;

  // --- Campos de suscripción ---

  @IsOptional()
  @IsEnum(PlanType, { message: 'Tipo de plan no válido' })
  planType?: PlanType;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProfileDto)
  profile?: UpdateProfileDto;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

/**
 * DTO para asignar/cambiar plataforma de streaming a un modelo
 */
export class AssignPlatformDto {
  @IsMongoId({ message: 'ID de plataforma inválido' })
  platformId: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  newPassword: string;
}

// --- Gamification DTO ---
export class UpdateGamificationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  level?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stars?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentXp?: number;
}

/**
 * DTO para agregar XP o estrellas con validación
 */
export class AddAmountDto {
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  amount: number;
}

// --- Subscription Access DTO ---
export class UpdateSubscriptionAccessDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date | null;

  @IsOptional()
  @IsString()
  subscriptionId?: string;
}

// --- Query DTO para listado de usuarios ---
export class QueryUsersDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
