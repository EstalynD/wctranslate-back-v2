import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSystemSettingsDto } from './dto/system-settings.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('settings')
@UseGuards(AuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ==================== PUBLIC (autenticado) ====================

  /**
   * Obtiene la configuración de tareas diarias
   * Cualquier usuario autenticado puede consultarla
   */
  @Get('daily-tasks')
  async getDailyTasksConfig() {
    return this.settingsService.getDailyTasksConfig();
  }

  // ==================== ADMIN ====================

  /**
   * Obtiene TODA la configuración del sistema
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getSettings() {
    return this.settingsService.getSettings();
  }

  /**
   * Actualiza la configuración del sistema
   */
  @Put()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateSettings(
    @CurrentUser() user: any,
    @Body() dto: UpdateSystemSettingsDto,
  ) {
    return this.settingsService.updateSettings(dto, user.userId);
  }
}
