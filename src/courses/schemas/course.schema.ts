import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PlanType } from '../../users/schemas/user.schema';

export type CourseDocument = Course & Document;

// --- Enums ---
export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum CourseLevel {
  BASIC = 'BASIC',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum CourseCategory {
  MARKETING = 'MARKETING',
  TECHNICAL = 'TECHNICAL',
  PSYCHOLOGY = 'PSYCHOLOGY',
  LEGAL = 'LEGAL',
  STYLING = 'STYLING',
  COMMUNICATION = 'COMMUNICATION',
}

// --- Schema ---
@Schema({ timestamps: true })
export class Course {
  _id: Types.ObjectId;

  // --- 📝 Información Básica ---
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: String, default: null })
  thumbnail: string | null;

  // --- 🏷️ Categorización ---
  @Prop({
    type: String,
    enum: CourseCategory,
    required: true,
  })
  category: CourseCategory;

  @Prop({
    type: String,
    enum: CourseLevel,
    default: CourseLevel.BASIC,
  })
  level: CourseLevel;

  // --- 📊 Estado y Visibilidad ---
  @Prop({
    type: String,
    enum: CourseStatus,
    default: CourseStatus.DRAFT,
  })
  status: CourseStatus;

  @Prop({ default: false })
  isFeatured: boolean;

  // --- 🔐 Acceso por Plan ---
  // Define qué planes pueden acceder a este curso
  @Prop({
    type: [String],
    enum: PlanType,
    default: [PlanType.PRO, PlanType.ELITE],
  })
  allowedPlans: PlanType[];

  // --- 📚 Relación con Temas ---
  // Array ordenado de IDs de temas
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Theme' }], default: [] })
  themes: Types.ObjectId[];

  // --- 📈 Metadata ---
  @Prop({ default: 0 })
  totalDurationMinutes: number;

  @Prop({ default: 0 })
  totalLessons: number;

  @Prop({ default: 0 })
  enrolledCount: number;

  // --- 🔢 Orden de visualización ---
  @Prop({ default: 0 })
  displayOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export const CourseSchema = SchemaFactory.createForClass(Course);

// --- Índices ---
// slug ya tiene unique: true en @Prop, no es necesario duplicar
CourseSchema.index({ status: 1, category: 1 });
CourseSchema.index({ allowedPlans: 1 });
CourseSchema.index({ displayOrder: 1 });
CourseSchema.index({ isFeatured: 1, status: 1 });
