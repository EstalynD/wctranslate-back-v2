import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GamificationService } from './gamification.service';

// Guards & Decorators
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/schemas/user.schema';

// DTOs
import {
  AdminGrantTokensDto,
  AdminAdjustTokensDto,
  GetTransactionsQueryDto,
} from './dto/gamification.dto';
import {
  CreateLevelConfigDto,
  UpdateLevelConfigDto,
} from './dto/level-config.dto';

@Controller('gamification')
@UseGuards(AuthGuard, RolesGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // ==================== USER ENDPOINTS ====================

  /**
   * Obtener mi wallet (balance de tokens)
   * GET /gamification/wallet
   */
  @Get('wallet')
  async getMyWallet(@CurrentUser('_id') userId: string) {
    const wallet = await this.gamificationService.getWallet(userId);
    return {
      success: true,
      data: wallet,
    };
  }

  /**
   * Obtener mi progreso de XP y nivel
   * GET /gamification/xp
   */
  @Get('xp')
  async getMyXpProgress(@CurrentUser('_id') userId: string) {
    const progress = await this.gamificationService.getXpProgress(userId);
    return {
      success: true,
      data: progress,
    };
  }

  /**
   * Obtener mis estadísticas completas de gamificación
   * GET /gamification/stats
   */
  @Get('stats')
  async getMyStats(@CurrentUser('_id') userId: string) {
    const stats = await this.gamificationService.getGamificationStats(userId);
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Obtener mi historial de transacciones
   * GET /gamification/transactions
   */
  @Get('transactions')
  async getMyTransactions(
    @CurrentUser('_id') userId: string,
    @Query() query: GetTransactionsQueryDto,
  ) {
    const result = await this.gamificationService.getUserTransactions(userId, query);
    return {
      success: true,
      data: result.transactions,
      meta: {
        total: result.total,
        page: query.page || 1,
        limit: query.limit || 20,
        summary: result.summary,
      },
    };
  }

  /**
   * Reclamar bonus de login diario
   * POST /gamification/daily-login
   */
  @Post('daily-login')
  async claimDailyLogin(@CurrentUser('_id') userId: string) {
    const transaction = await this.gamificationService.rewardDailyLogin(userId);

    if (!transaction) {
      return {
        success: false,
        message: 'Ya reclamaste tu bonus de login hoy',
        data: null,
      };
    }

    return {
      success: true,
      message: '¡Bonus de login diario reclamado!',
      data: {
        tokensEarned: transaction.amount,
        xpEarned: transaction.xpAmount,
        newBalance: transaction.balanceAfter,
      },
    };
  }

  // ==================== LEADERBOARD ====================

  /**
   * Obtener leaderboard
   * GET /gamification/leaderboard
   */
  @Get('leaderboard')
  async getLeaderboard(
    @CurrentUser('_id') userId: string,
    @Query('period') period: 'all_time' | 'monthly' | 'weekly' = 'all_time',
    @Query('limit') limit: number = 10,
  ) {
    const leaderboard = await this.gamificationService.getLeaderboard(
      period,
      Math.min(limit, 50),
      userId,
    );
    return {
      success: true,
      data: leaderboard,
    };
  }

  // ==================== LEVEL CONFIG (Public Read) ====================

  /**
   * Obtener todos los niveles
   * GET /gamification/levels
   */
  @Get('levels')
  async getAllLevels() {
    const levels = await this.gamificationService.getAllLevelConfigs();
    return {
      success: true,
      data: {
        levels,
        maxLevel: levels.length > 0 ? Math.max(...levels.map((l) => l.level)) : 1,
        totalLevels: levels.length,
      },
    };
  }

  /**
   * Obtener configuración de un nivel específico
   * GET /gamification/levels/:level
   */
  @Get('levels/:level')
  async getLevelConfig(@Param('level') level: number) {
    const config = await this.gamificationService.getLevelConfig(level);
    return {
      success: true,
      data: config,
    };
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Otorgar tokens a un usuario (Admin)
   * POST /gamification/admin/grant
   */
  @Post('admin/grant')
  @Roles(UserRole.ADMIN)
  async adminGrantTokens(
    @Body() dto: AdminGrantTokensDto,
    @CurrentUser('_id') adminId: string,
  ) {
    const transaction = await this.gamificationService.adminGrantTokens(dto, adminId);
    return {
      success: true,
      message: 'Tokens otorgados exitosamente',
      data: transaction,
    };
  }

  /**
   * Ajustar tokens de un usuario (Admin)
   * POST /gamification/admin/adjust
   */
  @Post('admin/adjust')
  @Roles(UserRole.ADMIN)
  async adminAdjustTokens(
    @Body() dto: AdminAdjustTokensDto,
    @CurrentUser('_id') adminId: string,
  ) {
    const transaction = await this.gamificationService.adminAdjustTokens(dto, adminId);
    return {
      success: true,
      message: 'Balance ajustado exitosamente',
      data: transaction,
    };
  }

  /**
   * Obtener wallet de cualquier usuario (Admin)
   * GET /gamification/admin/wallet/:userId
   */
  @Get('admin/wallet/:userId')
  @Roles(UserRole.ADMIN)
  async getUserWallet(@Param('userId') userId: string) {
    const wallet = await this.gamificationService.getWallet(userId);
    return {
      success: true,
      data: wallet,
    };
  }

  /**
   * Obtener transacciones de cualquier usuario (Admin)
   * GET /gamification/admin/transactions
   */
  @Get('admin/transactions')
  @Roles(UserRole.ADMIN)
  async getAllTransactions(@Query() query: GetTransactionsQueryDto) {
    const result = await this.gamificationService.getTransactions(query);
    return {
      success: true,
      data: result.transactions,
      meta: {
        total: result.total,
        page: query.page || 1,
        limit: query.limit || 20,
        summary: result.summary,
      },
    };
  }

  /**
   * Obtener stats de un usuario específico (Admin)
   * GET /gamification/admin/stats/:userId
   */
  @Get('admin/stats/:userId')
  @Roles(UserRole.ADMIN)
  async getUserStats(@Param('userId') userId: string) {
    const stats = await this.gamificationService.getGamificationStats(userId);
    return {
      success: true,
      data: stats,
    };
  }

  // ==================== LEVEL CONFIG MANAGEMENT (Admin) ====================

  /**
   * Crear configuración de nivel (Admin)
   * POST /gamification/admin/levels
   */
  @Post('admin/levels')
  @Roles(UserRole.ADMIN)
  async createLevelConfig(@Body() dto: CreateLevelConfigDto) {
    const config = await this.gamificationService.createLevelConfig(dto);
    return {
      success: true,
      message: 'Nivel creado exitosamente',
      data: config,
    };
  }

  /**
   * Actualizar configuración de nivel (Admin)
   * PUT /gamification/admin/levels/:level
   */
  @Put('admin/levels/:level')
  @Roles(UserRole.ADMIN)
  async updateLevelConfig(
    @Param('level') level: number,
    @Body() dto: UpdateLevelConfigDto,
  ) {
    const config = await this.gamificationService.updateLevelConfig(level, dto);
    return {
      success: true,
      message: 'Nivel actualizado exitosamente',
      data: config,
    };
  }

  /**
   * Eliminar configuración de nivel (Admin)
   * DELETE /gamification/admin/levels/:level
   */
  @Delete('admin/levels/:level')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteLevelConfig(@Param('level') level: number) {
    await this.gamificationService.deleteLevelConfig(level);
    return {
      success: true,
      message: 'Nivel eliminado exitosamente',
    };
  }
}
