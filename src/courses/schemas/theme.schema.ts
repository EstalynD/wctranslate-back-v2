import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ThemeDocument = Theme & Document;

// --- Schema ---
@Schema({ timestamps: true })
export class Theme {
  _id: Types.ObjectId;

  // --- 📝 Información Básica ---
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: String, default: '' })
  description: string;

  // Para destacar parte del título con gradiente (ej: "Manejo de **Trolls y Haters**")
  @Prop({ type: String, default: null })
  highlightedText: string | null;

  // --- 🔗 Relación con Curso (padre) ---
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  // --- 📚 Relación con Lecciones/Tareas ---
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Lesson' }], default: [] })
  lessons: Types.ObjectId[];

  // --- 🔢 Orden dentro del Curso ---
  @Prop({ default: 0 })
  order: number;

  // --- 📈 Metadata calculada ---
  @Prop({ default: 0 })
  totalDurationMinutes: number;

  @Prop({ default: 0 })
  totalLessons: number;

  // --- 🔐 Configuración de Desbloqueo ---
  // Si true, el tema se desbloquea solo si el anterior está completado
  @Prop({ default: true })
  requiresPreviousCompletion: boolean;

  // Porcentaje mínimo del tema anterior para desbloquear (0-100)
  @Prop({ default: 100, min: 0, max: 100 })
  unlockThreshold: number;

  createdAt: Date;
  updatedAt: Date;
}

export const ThemeSchema = SchemaFactory.createForClass(Theme);

// --- Índices ---
// slug ya tiene unique: true en @Prop, no es necesario duplicar
// courseId indexado mediante índice compuesto { courseId: 1, order: 1 }
ThemeSchema.index({ courseId: 1, order: 1 });
