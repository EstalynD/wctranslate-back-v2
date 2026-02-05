import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LessonRatingDocument = LessonRating & Document;

// --- Enums ---
export enum RatingCategory {
  UNDERSTANDING = 'understanding', // ¿Entendiste el contenido?
  USEFULNESS = 'usefulness', // ¿Fue útil?
  DIFFICULTY = 'difficulty', // ¿Qué tan difícil fue?
  ENGAGEMENT = 'engagement', // ¿Qué tan interesante?
}

// --- Interfaces ---
export interface RatingDetails {
  understandingStars: number; // 1-5: ¿Qué tan bien entendiste?
  usefulnessStars: number; // 1-5: ¿Qué tan útil fue?
  difficultyStars?: number; // 1-5: 1=muy fácil, 5=muy difícil
  engagementStars?: number; // 1-5: ¿Qué tan interesante?
}

// --- Schema ---
@Schema({
  timestamps: true,
  collection: 'lesson_ratings',
})
export class LessonRating {
  // --- 🔗 Referencias ---
  // index: true eliminados - ya existen índices compuestos más específicos
  @Prop({
    type: Types.ObjectId,
    ref: 'Lesson',
    required: true,
    // índice cubierto por { lessonId: 1, userId: 1 }
  })
  lessonId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    // índice cubierto por { lessonId: 1, userId: 1 }
  })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Course',
    required: true,
    // índice cubierto por { courseId: 1, averageStars: -1 }
  })
  courseId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Theme',
    // Sin índice individual - añadir si se necesitan consultas por themeId solo
  })
  themeId?: Types.ObjectId;

  // --- ⭐ Calificaciones ---
  @Prop({
    type: Number,
    required: true,
    min: 1,
    max: 5,
  })
  understandingStars: number;

  @Prop({
    type: Number,
    required: true,
    min: 1,
    max: 5,
  })
  usefulnessStars: number;

  @Prop({
    type: Number,
    min: 1,
    max: 5,
    default: null,
  })
  difficultyStars?: number;

  @Prop({
    type: Number,
    min: 1,
    max: 5,
    default: null,
  })
  engagementStars?: number;

  // --- 📊 Promedio Calculado ---
  @Prop({
    type: Number,
    min: 1,
    max: 5,
  })
  averageStars: number;

  // --- 💬 Comentarios ---
  @Prop({
    type: String,
    maxlength: 500,
    default: null,
  })
  improvementText?: string; // ¿Qué mejorarías?

  @Prop({
    type: String,
    maxlength: 1000,
    default: null,
  })
  comment?: string; // Comentario general

  @Prop({
    type: [String],
    default: [],
  })
  tags?: string[]; // Tags de categorización (ej: "confuso", "muy largo", "excelente")

  // --- 📋 Metadata ---
  @Prop({
    type: Boolean,
    default: false,
  })
  isAnonymous: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isReviewed: boolean; // Admin ha revisado este feedback

  @Prop({
    type: String,
    default: null,
  })
  adminResponse?: string; // Respuesta del admin al feedback

  @Prop({
    type: Date,
    default: null,
  })
  reviewedAt?: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  reviewedBy?: Types.ObjectId;

  // --- 📅 Timestamps ---
  createdAt: Date;
  updatedAt: Date;
}

export const LessonRatingSchema = SchemaFactory.createForClass(LessonRating);

// Índices compuestos para optimizar consultas
LessonRatingSchema.index({ lessonId: 1, userId: 1 }, { unique: true }); // Un usuario solo puede calificar una vez por lección
LessonRatingSchema.index({ courseId: 1, averageStars: -1 });
LessonRatingSchema.index({ isReviewed: 1, createdAt: -1 });
LessonRatingSchema.index({ createdAt: -1 });

// Middleware para calcular promedio antes de guardar
LessonRatingSchema.pre('save', function (this: LessonRatingDocument, next: Function) {
  const stars = [this.understandingStars, this.usefulnessStars];

  if (this.difficultyStars) stars.push(this.difficultyStars);
  if (this.engagementStars) stars.push(this.engagementStars);

  this.averageStars =
    Math.round((stars.reduce((a, b) => a + b, 0) / stars.length) * 10) / 10;

  next();
});
