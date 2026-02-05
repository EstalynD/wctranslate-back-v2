import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Schemas
import {
  TokenTransaction,
  TokenTransactionDocument,
  TransactionType,
  TransactionStatus,
  ReferenceType,
} from './schemas/token-transaction.schema';
import {
  LevelConfig,
  LevelConfigDocument,
  DEFAULT_LEVELS,
} from './schemas/level-config.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

// DTOs
import {
  CreateTransactionDto,
  AdminGrantTokensDto,
  AdminAdjustTokensDto,
  GetTransactionsQueryDto,
  TokenWalletDto,
  XpProgressDto,
  LevelUpResponseDto,
} from './dto/gamification.dto';
import {
  CreateLevelConfigDto,
  UpdateLevelConfigDto,
} from './dto/level-config.dto';

@Injectable()
export class GamificationService implements OnModuleInit {
  constructor(
    @InjectModel(TokenTransaction.name)
    private transactionModel: Model<TokenTransactionDocument>,
    @InjectModel(LevelConfig.name)
    private levelConfigModel: Model<LevelConfigDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  // ==================== INITIALIZATION ====================

  async onModuleInit() {
    await this.initializeDefaultLevels();
  }

  private async initializeDefaultLevels(): Promise<void> {
    const existingLevels = await this.levelConfigModel.countDocuments();

    if (existingLevels === 0) {
      await this.levelConfigModel.insertMany(DEFAULT_LEVELS);
      console.log('✅ Default level configurations initialized');
    }
  }

  // ==================== TOKEN WALLET ====================

  async getWallet(userId: string): Promise<TokenWalletDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Calcular totales desde transacciones
    const [totals] = await this.transactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), status: TransactionStatus.COMPLETED } },
      {
        $group: {
          _id: null,
          totalEarned: {
            $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] },
          },
          totalSpent: {
            $sum: { $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Transacciones de esta semana y mes
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [periodTotals] = await this.transactionModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          status: TransactionStatus.COMPLETED,
          amount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          thisWeek: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfWeek] }, '$amount', 0],
            },
          },
          thisMonth: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfMonth] }, '$amount', 0],
            },
          },
        },
      },
    ]);

    // Última transacción
    const lastTransaction = await this.transactionModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();

    const totalEarned = totals?.totalEarned || 0;
    const totalSpent = totals?.totalSpent || 0;

    return {
      userId,
      totalEarned,
      totalSpent,
      availableBalance: totalEarned - totalSpent,
      lastTransaction: lastTransaction
        ? {
            id: lastTransaction._id.toString(),
            type: lastTransaction.type,
            amount: lastTransaction.amount,
            description: lastTransaction.description,
            createdAt: lastTransaction.createdAt,
          }
        : null,
      transactionCount: totals?.count || 0,
      thisMonthEarned: periodTotals?.thisMonth || 0,
      thisWeekEarned: periodTotals?.thisWeek || 0,
    };
  }

  async getBalance(userId: string): Promise<number> {
    const wallet = await this.getWallet(userId);
    return wallet.availableBalance;
  }

  // ==================== TOKEN TRANSACTIONS ====================

  async createTransaction(dto: CreateTransactionDto): Promise<TokenTransaction> {
    // Obtener balance actual
    const currentBalance = await this.getBalance(dto.userId);
    const newBalance = currentBalance + dto.amount;

    const transaction = new this.transactionModel({
      userId: new Types.ObjectId(dto.userId),
      amount: dto.amount,
      type: dto.type,
      status: TransactionStatus.COMPLETED,
      description: dto.description,
      internalNote: dto.internalNote || null,
      referenceType: dto.referenceType || null,
      referenceId: dto.referenceId ? new Types.ObjectId(dto.referenceId) : null,
      balanceAfter: newBalance,
      xpAmount: dto.xpAmount || 0,
      grantedBy: dto.grantedBy ? new Types.ObjectId(dto.grantedBy) : null,
    });

    const savedTransaction = await transaction.save();

    // Si hay XP, actualizar el usuario
    if (dto.xpAmount && dto.xpAmount > 0) {
      await this.addXp(dto.userId, dto.xpAmount);
    }

    return savedTransaction;
  }

  async grantTokens(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    options?: {
      referenceType?: ReferenceType;
      referenceId?: string;
      xpAmount?: number;
      grantedBy?: string;
    },
  ): Promise<TokenTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('El monto debe ser positivo');
    }

    return this.createTransaction({
      userId,
      amount,
      type,
      description,
      referenceType: options?.referenceType,
      referenceId: options?.referenceId,
      xpAmount: options?.xpAmount,
      grantedBy: options?.grantedBy,
    });
  }

  async adminGrantTokens(
    dto: AdminGrantTokensDto,
    adminId: string,
  ): Promise<TokenTransaction> {
    return this.grantTokens(
      dto.userId,
      dto.amount,
      TransactionType.BONUS,
      dto.description,
      {
        referenceType: ReferenceType.ADMIN,
        xpAmount: dto.xpAmount,
        grantedBy: adminId,
      },
    );
  }

  async adminAdjustTokens(
    dto: AdminAdjustTokensDto,
    adminId: string,
  ): Promise<TokenTransaction> {
    // Verificar que no quede en negativo
    if (dto.amount < 0) {
      const currentBalance = await this.getBalance(dto.userId);
      if (currentBalance + dto.amount < 0) {
        throw new BadRequestException(
          `El ajuste dejaría el balance en negativo. Balance actual: ${currentBalance}`,
        );
      }
    }

    return this.createTransaction({
      userId: dto.userId,
      amount: dto.amount,
      type: TransactionType.ADJUSTMENT,
      description: dto.reason,
      internalNote: dto.internalNote,
      referenceType: ReferenceType.ADMIN,
      grantedBy: adminId,
    });
  }

  // ==================== TRANSACTION HISTORY ====================

  async getTransactions(
    query: GetTransactionsQueryDto,
  ): Promise<{
    transactions: TokenTransaction[];
    total: number;
    summary: { totalEarned: number; totalSpent: number; netChange: number };
  }> {
    const {
      userId,
      type,
      status,
      referenceType,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query;

    const filter: Record<string, unknown> = {};

    if (userId) filter.userId = new Types.ObjectId(userId);
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (referenceType) filter.referenceType = referenceType;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) (filter.createdAt as Record<string, unknown>).$gte = startDate;
      if (endDate) (filter.createdAt as Record<string, unknown>).$lte = endDate;
    }

    const [transactions, total, summaryResult] = await Promise.all([
      this.transactionModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.transactionModel.countDocuments(filter).exec(),
      this.transactionModel.aggregate([
        { $match: { ...filter, status: TransactionStatus.COMPLETED } },
        {
          $group: {
            _id: null,
            totalEarned: {
              $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] },
            },
            totalSpent: {
              $sum: { $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0] },
            },
          },
        },
      ]),
    ]);

    const summary = summaryResult[0] || { totalEarned: 0, totalSpent: 0 };

    return {
      transactions,
      total,
      summary: {
        totalEarned: summary.totalEarned,
        totalSpent: summary.totalSpent,
        netChange: summary.totalEarned - summary.totalSpent,
      },
    };
  }

  async getUserTransactions(
    userId: string,
    query: Omit<GetTransactionsQueryDto, 'userId'>,
  ) {
    return this.getTransactions({ ...query, userId });
  }

  // ==================== XP & LEVELS ====================

  async addXp(userId: string, xpAmount: number): Promise<LevelUpResponseDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const previousLevel = user.gamification.level;
    const previousXp = user.gamification.currentXp;
    const newTotalXp = previousXp + xpAmount;

    // Obtener configuración de niveles
    const levels = await this.levelConfigModel
      .find({ isActive: true })
      .sort({ level: 1 })
      .exec();

    // Calcular nuevo nivel
    let newLevel = previousLevel;
    let levelConfig = levels.find((l) => l.level === previousLevel);

    for (const level of levels) {
      if (newTotalXp >= level.xpRequired) {
        newLevel = level.level;
        levelConfig = level;
      } else {
        break;
      }
    }

    // Actualizar usuario
    user.gamification.currentXp = newTotalXp;
    user.gamification.level = newLevel;
    await user.save();

    // Si subió de nivel, dar recompensas
    const leveledUp = newLevel > previousLevel;
    let levelUpRewards = { tokens: 0 };

    if (leveledUp && levelConfig?.rewards) {
      levelUpRewards = levelConfig.rewards;

      // Dar tokens de recompensa por subir de nivel
      if (levelConfig.rewards.tokens > 0) {
        await this.grantTokens(
          userId,
          levelConfig.rewards.tokens,
          TransactionType.ACHIEVEMENT,
          `¡Subiste al nivel ${newLevel}: ${levelConfig.name}!`,
          { referenceType: ReferenceType.SYSTEM },
        );
      }
    }

    const xpProgress = await this.getXpProgress(userId);

    return {
      leveledUp,
      previousLevel,
      newLevel,
      levelName: levelConfig?.name || 'Desconocido',
      rewards: levelUpRewards,
      xpProgress,
    };
  }

  async getXpProgress(userId: string): Promise<XpProgressDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const levels = await this.levelConfigModel
      .find({ isActive: true })
      .sort({ level: 1 })
      .exec();

    const currentLevelConfig = levels.find(
      (l) => l.level === user.gamification.level,
    );
    const nextLevelConfig = levels.find(
      (l) => l.level === user.gamification.level + 1,
    );

    // Calcular XP en nivel actual
    const xpInCurrentLevel =
      user.gamification.currentXp - (currentLevelConfig?.xpRequired || 0);
    const xpNeededForNext = currentLevelConfig?.xpToNextLevel || 100;
    const xpProgress = Math.min(
      100,
      Math.round((xpInCurrentLevel / xpNeededForNext) * 100),
    );

    return {
      userId,
      currentLevel: user.gamification.level,
      levelName: currentLevelConfig?.name || 'Novato',
      levelColor: currentLevelConfig?.color || null,
      levelBadgeUrl: currentLevelConfig?.badgeUrl || null,
      totalXp: user.gamification.currentXp,
      currentLevelXp: xpInCurrentLevel,
      xpToNextLevel: xpNeededForNext - xpInCurrentLevel,
      xpProgress,
      tokenMultiplier: currentLevelConfig?.tokenMultiplier || 1,
      xpMultiplier: currentLevelConfig?.xpMultiplier || 1,
      nextLevel: nextLevelConfig
        ? {
            level: nextLevelConfig.level,
            name: nextLevelConfig.name,
            xpRequired: nextLevelConfig.xpRequired,
            rewards: {
              tokens: nextLevelConfig.rewards?.tokens || 0,
              badge: nextLevelConfig.rewards?.badge,
              title: nextLevelConfig.rewards?.title,
            },
          }
        : null,
    };
  }

  async getUserMultipliers(
    userId: string,
  ): Promise<{ tokenMultiplier: number; xpMultiplier: number }> {
    const xpProgress = await this.getXpProgress(userId);
    return {
      tokenMultiplier: xpProgress.tokenMultiplier,
      xpMultiplier: xpProgress.xpMultiplier,
    };
  }

  // ==================== LEVEL CONFIG MANAGEMENT ====================

  async getAllLevelConfigs(): Promise<LevelConfig[]> {
    return this.levelConfigModel.find().sort({ level: 1 }).exec();
  }

  async getLevelConfig(level: number): Promise<LevelConfig> {
    const config = await this.levelConfigModel.findOne({ level }).exec();
    if (!config) {
      throw new NotFoundException(`Configuración de nivel ${level} no encontrada`);
    }
    return config;
  }

  async createLevelConfig(dto: CreateLevelConfigDto): Promise<LevelConfig> {
    // Verificar que el nivel no exista
    const existing = await this.levelConfigModel.findOne({ level: dto.level });
    if (existing) {
      throw new BadRequestException(`El nivel ${dto.level} ya existe`);
    }

    const config = new this.levelConfigModel(dto);
    return config.save();
  }

  async updateLevelConfig(
    level: number,
    dto: UpdateLevelConfigDto,
  ): Promise<LevelConfig> {
    const config = await this.levelConfigModel.findOneAndUpdate(
      { level },
      dto,
      { new: true },
    );
    if (!config) {
      throw new NotFoundException(`Configuración de nivel ${level} no encontrada`);
    }
    return config;
  }

  async deleteLevelConfig(level: number): Promise<void> {
    const result = await this.levelConfigModel.findOneAndDelete({ level });
    if (!result) {
      throw new NotFoundException(`Configuración de nivel ${level} no encontrada`);
    }
  }

  // ==================== REWARD HELPERS (para otros servicios) ====================

  async rewardLessonComplete(
    userId: string,
    lessonId: string,
    tokensAmount: number,
    xpAmount: number,
  ): Promise<TokenTransaction> {
    const multipliers = await this.getUserMultipliers(userId);

    const finalTokens = Math.round(tokensAmount * multipliers.tokenMultiplier);
    const finalXp = Math.round(xpAmount * multipliers.xpMultiplier);

    return this.grantTokens(
      userId,
      finalTokens,
      TransactionType.LESSON_COMPLETE,
      'Lección completada',
      {
        referenceType: ReferenceType.LESSON,
        referenceId: lessonId,
        xpAmount: finalXp,
      },
    );
  }

  async rewardQuizPass(
    userId: string,
    quizAttemptId: string,
    tokensAmount: number,
    xpAmount: number,
    isPerfect: boolean,
  ): Promise<TokenTransaction> {
    const multipliers = await this.getUserMultipliers(userId);

    const finalTokens = Math.round(tokensAmount * multipliers.tokenMultiplier);
    const finalXp = Math.round(xpAmount * multipliers.xpMultiplier);

    return this.grantTokens(
      userId,
      finalTokens,
      isPerfect ? TransactionType.QUIZ_PERFECT : TransactionType.QUIZ_PASS,
      isPerfect ? 'Quiz perfecto' : 'Quiz aprobado',
      {
        referenceType: ReferenceType.QUIZ_ATTEMPT,
        referenceId: quizAttemptId,
        xpAmount: finalXp,
      },
    );
  }

  async rewardStreakBonus(
    userId: string,
    streakDays: number,
    tokensAmount: number,
  ): Promise<TokenTransaction> {
    return this.grantTokens(
      userId,
      tokensAmount,
      TransactionType.STREAK_BONUS,
      `Racha de ${streakDays} días`,
      {
        referenceType: ReferenceType.STREAK,
        xpAmount: streakDays * 5, // 5 XP por día de racha
      },
    );
  }

  async rewardDailyLogin(userId: string): Promise<TokenTransaction | null> {
    // Verificar si ya recibió el bonus hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingToday = await this.transactionModel.findOne({
      userId: new Types.ObjectId(userId),
      type: TransactionType.DAILY_LOGIN,
      createdAt: { $gte: today },
    });

    if (existingToday) {
      return null; // Ya recibió el bonus hoy
    }

    return this.grantTokens(
      userId,
      5, // 5 tokens por login diario
      TransactionType.DAILY_LOGIN,
      'Bonus de login diario',
      {
        referenceType: ReferenceType.SYSTEM,
        xpAmount: 10, // 10 XP por login
      },
    );
  }

  // ==================== LEADERBOARD ====================

  async getLeaderboard(
    period: 'all_time' | 'monthly' | 'weekly' = 'all_time',
    limit: number = 10,
    currentUserId?: string,
  ) {
    let dateFilter: Date | null = null;

    if (period === 'weekly') {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === 'monthly') {
      dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    }

    const matchStage: Record<string, unknown> = {
      status: TransactionStatus.COMPLETED,
      amount: { $gt: 0 },
    };

    if (dateFilter) {
      matchStage.createdAt = { $gte: dateFilter };
    }

    const leaderboard = await this.transactionModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$userId',
          totalTokens: { $sum: '$amount' },
          totalXp: { $sum: '$xpAmount' },
        },
      },
      { $sort: { totalTokens: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          totalTokens: 1,
          totalXp: 1,
          userName: {
            $concat: ['$user.profile.firstName', ' ', '$user.profile.lastName'],
          },
          avatarUrl: '$user.profile.avatarUrl',
          level: '$user.gamification.level',
        },
      },
    ]);

    // Obtener nombres de niveles
    const levels = await this.levelConfigModel.find().exec();
    const levelMap = new Map(levels.map((l) => [l.level, l.name]));

    const entries = leaderboard.map((entry, index) => ({
      position: index + 1,
      userId: entry.userId.toString(),
      userName: entry.userName,
      avatarUrl: entry.avatarUrl,
      level: entry.level,
      levelName: levelMap.get(entry.level) || 'Novato',
      totalXp: entry.totalXp,
      totalTokens: entry.totalTokens,
    }));

    // Obtener posición del usuario actual si se proporciona
    let userPosition: number | null = null;
    if (currentUserId) {
      const userEntry = entries.find((e) => e.userId === currentUserId);
      userPosition = userEntry?.position || null;
    }

    return {
      entries,
      total: entries.length,
      userPosition,
      period,
    };
  }

  // ==================== STATS ====================

  async getGamificationStats(userId: string) {
    const [wallet, xpProgress] = await Promise.all([
      this.getWallet(userId),
      this.getXpProgress(userId),
    ]);

    // Obtener ranking del usuario
    const allTimeStats = await this.transactionModel.aggregate([
      {
        $match: {
          status: TransactionStatus.COMPLETED,
          amount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalTokens: { $sum: '$amount' },
        },
      },
      { $sort: { totalTokens: -1 } },
    ]);

    const userRankIndex = allTimeStats.findIndex(
      (s) => s._id.toString() === userId,
    );

    return {
      userId,
      wallet,
      xpProgress,
      ranking:
        userRankIndex >= 0
          ? {
              position: userRankIndex + 1,
              totalUsers: allTimeStats.length,
              percentile: Math.round(
                ((allTimeStats.length - userRankIndex) / allTimeStats.length) * 100,
              ),
            }
          : null,
    };
  }
}
