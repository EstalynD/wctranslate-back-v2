import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SystemSettingsDocument = SystemSettings & Document;

// --- Configuración de Tareas Diarias ---
export interface DailyTasksConfig {
  maxDailyTasks: number;  // Máximo de tareas/lecciones que una modelo puede completar por día
  enabled: boolean;       // Si el límite está activo
}

// --- Schema ---
@Schema({
  timestamps: true,
  collection: 'system_settings',
})
export class SystemSettings {
  _id: Types.ObjectId;

  // Clave única para garantizar documento singleton
  @Prop({ type: String, default: 'global', unique: true, immutable: true })
  key: string;

  // --- Configuración de Tareas Diarias ---
  @Prop({
    type: {
      maxDailyTasks: { type: Number, default: 1, min: 1, max: 100 },
      enabled: { type: Boolean, default: true },
    },
    default: { maxDailyTasks: 1, enabled: true },
    _id: false,
  })
  dailyTasks: DailyTasksConfig;

  // --- Metadata ---
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  lastModifiedBy: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

export const SystemSettingsSchema = SchemaFactory.createForClass(SystemSettings);
