import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsMongoId,
  Min,
  Max,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import {
  TransactionType,
  TransactionStatus,
  ReferenceType,
} from '../schemas/token-transaction.schema';

// ==================== TRANSACTION DTOs ====================

export class CreateTransactionDto {
  @IsMongoId()
  userId: string;

  @IsNumber()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  internalNote?: string;

  @IsOptional()
  @IsEnum(ReferenceType)
  referenceType?: ReferenceType;

  @IsOptional()
  @IsMongoId()
  referenceId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  xpAmount?: number;

  @IsOptional()
  @IsMongoId()
  grantedBy?: string;
}

export class AdminGrantTokensDto {
  @IsMongoId()
  userId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  internalNote?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  xpAmount?: number;
}

export class AdminAdjustTokensDto {
  @IsMongoId()
  userId: string;

  @IsNumber()
  amount: number; // Puede ser positivo o negativo

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  internalNote?: string;
}

// ==================== QUERY DTOs ====================

export class GetTransactionsQueryDto {
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsEnum(ReferenceType)
  referenceType?: ReferenceType;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

// ==================== RESPONSE DTOs ====================

export class TokenWalletDto {
  userId: string;

  // Balances
  totalEarned: number;
  totalSpent: number;
  availableBalance: number;

  // Última actividad
  lastTransaction: {
    id: string;
    type: TransactionType;
    amount: number;
    description: string;
    createdAt: Date;
  } | null;

  // Estadísticas
  transactionCount: number;
  thisMonthEarned: number;
  thisWeekEarned: number;
}

export class TransactionResponseDto {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  referenceType: ReferenceType | null;
  referenceId: string | null;
  balanceAfter: number;
  xpAmount: number;
  createdAt: Date;
}

export class TransactionHistoryResponseDto {
  transactions: TransactionResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  // Resumen del período
  summary: {
    totalEarned: number;
    totalSpent: number;
    netChange: number;
  };
}

// ==================== XP & LEVEL DTOs ====================

export class XpProgressDto {
  userId: string;

  // Nivel actual
  currentLevel: number;
  levelName: string;
  levelColor: string | null;
  levelBadgeUrl: string | null;

  // XP
  totalXp: number;
  currentLevelXp: number;      // XP acumulado en el nivel actual
  xpToNextLevel: number;       // XP necesario para subir
  xpProgress: number;          // Porcentaje de progreso (0-100)

  // Multiplicadores activos
  tokenMultiplier: number;
  xpMultiplier: number;

  // Próximo nivel
  nextLevel: {
    level: number;
    name: string;
    xpRequired: number;
    rewards: {
      tokens: number;
      badge?: string;
      title?: string;
    };
  } | null;
}

export class LevelUpResponseDto {
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  levelName: string;
  rewards: {
    tokens: number;
    badge?: string;
    title?: string;
    unlocks?: string[];
  };
  xpProgress: XpProgressDto;
}

// ==================== STATS DTOs ====================

export class GamificationStatsDto {
  userId: string;

  // Tokens
  wallet: TokenWalletDto;

  // XP & Nivel
  xpProgress: XpProgressDto;

  // Rankings (opcional)
  ranking?: {
    position: number;
    totalUsers: number;
    percentile: number;
  };
}

export class LeaderboardEntryDto {
  position: number;
  userId: string;
  userName: string;
  avatarUrl: string | null;
  level: number;
  levelName: string;
  totalXp: number;
  totalTokens: number;
}

export class LeaderboardResponseDto {
  entries: LeaderboardEntryDto[];
  total: number;
  userPosition: number | null;  // Posición del usuario actual
  period: 'all_time' | 'monthly' | 'weekly';
}
