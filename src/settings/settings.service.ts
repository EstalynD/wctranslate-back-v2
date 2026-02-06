import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SystemSettings,
  SystemSettingsDocument,
  DailyTasksConfig,
} from './schemas/system-settings.schema';
import { UpdateSystemSettingsDto } from './dto/system-settings.dto';

@Injectable()
export class SettingsService implements OnModuleInit {
  // Cache en memoria para evitar consultas repetitivas a la DB
  private cachedSettings: SystemSettings | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL_MS = 60_000; // 1 minuto

  constructor(
    @InjectModel(SystemSettings.name)
    private settingsModel: Model<SystemSettingsDocument>,
  ) {}

  // ==================== INITIALIZATION ====================

  /**
   * Al iniciar el módulo, crea el documento singleton si no existe
   */
  async onModuleInit() {
    await this.ensureSettingsExist();
  }

  private async ensureSettingsExist(): Promise<SystemSettings> {
    let settings = await this.settingsModel.findOne({ key: 'global' }).exec();

    if (!settings) {
      settings = new this.settingsModel({
        key: 'global',
        dailyTasks: { maxDailyTasks: 1, enabled: true },
      });
      await settings.save();
      console.log('✅ Configuración del sistema inicializada');
    }

    this.cachedSettings = settings;
    this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;

    return settings;
  }

  // ==================== READ ====================

  /**
   * Obtiene la configuración actual del sistema (con cache)
   */
  async getSettings(): Promise<SystemSettings> {
    if (this.cachedSettings && Date.now() < this.cacheExpiry) {
      return this.cachedSettings;
    }

    const settings = await this.settingsModel.findOne({ key: 'global' }).exec();
    if (!settings) {
      return this.ensureSettingsExist();
    }

    this.cachedSettings = settings;
    this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;

    return settings;
  }

  /**
   * Obtiene solo la configuración de tareas diarias
   */
  async getDailyTasksConfig(): Promise<DailyTasksConfig> {
    const settings = await this.getSettings();
    return settings.dailyTasks;
  }

  /**
   * Obtiene el máximo de tareas diarias (acceso rápido para otros servicios)
   */
  async getMaxDailyTasks(): Promise<number> {
    const config = await this.getDailyTasksConfig();
    return config.enabled ? config.maxDailyTasks : Infinity;
  }

  // ==================== UPDATE (Admin) ====================

  /**
   * Actualiza la configuración del sistema
   * Solo admin puede ejecutar esto (guard en controller)
   */
  async updateSettings(
    dto: UpdateSystemSettingsDto,
    adminId: string,
  ): Promise<SystemSettings> {
    const updateData: Record<string, unknown> = {
      lastModifiedBy: new Types.ObjectId(adminId),
    };

    if (dto.dailyTasks) {
      if (dto.dailyTasks.maxDailyTasks !== undefined) {
        updateData['dailyTasks.maxDailyTasks'] = dto.dailyTasks.maxDailyTasks;
      }
      if (dto.dailyTasks.enabled !== undefined) {
        updateData['dailyTasks.enabled'] = dto.dailyTasks.enabled;
      }
    }

    const updated = await this.settingsModel
      .findOneAndUpdate({ key: 'global' }, { $set: updateData }, { new: true })
      .exec();

    if (!updated) {
      return this.ensureSettingsExist();
    }

    // Invalidar cache
    this.cachedSettings = updated;
    this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;

    return updated;
  }
}
