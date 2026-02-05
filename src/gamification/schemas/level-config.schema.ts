import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LevelConfigDocument = LevelConfig & Document;

// --- Interface para Recompensa de Nivel ---
export interface LevelReward {
  tokens: number;
  badge?: string;
  title?: string;
  unlocks?: string[];              // Features que se desbloquean
}

// --- Schema ---
@Schema({ timestamps: true })
export class LevelConfig {
  _id: Types.ObjectId;

  // --- 🎚️ Nivel ---
  @Prop({ required: true, unique: true })
  level: number;

  // --- 📊 XP Requerido ---
  @Prop({ required: true })
  xpRequired: number;              // XP total necesario para alcanzar este nivel

  @Prop({ required: true })
  xpToNextLevel: number;           // XP adicional para el siguiente nivel

  // --- 🏷️ Información del Nivel ---
  @Prop({ required: true })
  name: string;                    // Nombre del nivel (ej: "Principiante", "Experto")

  @Prop({ type: String, default: null })
  description: string | null;

  @Prop({ type: String, default: null })
  badgeUrl: string | null;         // Imagen/icono del nivel

  @Prop({ type: String, default: null })
  color: string | null;            // Color asociado (hex)

  // --- 🎁 Recompensas al alcanzar ---
  @Prop({
    type: {
      tokens: { type: Number, default: 0 },
      badge: { type: String, default: null },
      title: { type: String, default: null },
      unlocks: { type: [String], default: [] },
    },
    default: { tokens: 0, badge: null, title: null, unlocks: [] },
    _id: false,
  })
  rewards: LevelReward;

  // --- 🔢 Multiplicadores ---
  @Prop({ default: 1.0 })
  tokenMultiplier: number;         // Multiplicador de tokens ganados

  @Prop({ default: 1.0 })
  xpMultiplier: number;            // Multiplicador de XP ganado

  // --- ✅ Estado ---
  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const LevelConfigSchema = SchemaFactory.createForClass(LevelConfig);

// --- Índices ---
// level ya tiene unique: true en @Prop, no es necesario duplicar
LevelConfigSchema.index({ xpRequired: 1 });
LevelConfigSchema.index({ isActive: 1 });

// --- Configuración por defecto de niveles ---
export const DEFAULT_LEVELS: Partial<LevelConfig>[] = [
  { level: 1, xpRequired: 0, xpToNextLevel: 100, name: 'Novato', color: '#9CA3AF', rewards: { tokens: 0 } },
  { level: 2, xpRequired: 100, xpToNextLevel: 150, name: 'Aprendiz', color: '#60A5FA', rewards: { tokens: 10 } },
  { level: 3, xpRequired: 250, xpToNextLevel: 200, name: 'Estudiante', color: '#34D399', rewards: { tokens: 20 } },
  { level: 4, xpRequired: 450, xpToNextLevel: 300, name: 'Practicante', color: '#FBBF24', rewards: { tokens: 30 } },
  { level: 5, xpRequired: 750, xpToNextLevel: 400, name: 'Competente', color: '#F97316', rewards: { tokens: 50 } },
  { level: 6, xpRequired: 1150, xpToNextLevel: 500, name: 'Hábil', color: '#EC4899', rewards: { tokens: 75 } },
  { level: 7, xpRequired: 1650, xpToNextLevel: 650, name: 'Experto', color: '#8B5CF6', rewards: { tokens: 100 } },
  { level: 8, xpRequired: 2300, xpToNextLevel: 800, name: 'Maestro', color: '#EF4444', rewards: { tokens: 150 } },
  { level: 9, xpRequired: 3100, xpToNextLevel: 1000, name: 'Gran Maestro', color: '#14B8A6', rewards: { tokens: 200 } },
  { level: 10, xpRequired: 4100, xpToNextLevel: 1500, name: 'Leyenda', color: '#FFD700', rewards: { tokens: 500 } },
];
