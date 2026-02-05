import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { QuestionType } from './quiz.schema';

export type QuizAttemptDocument = QuizAttempt & Document;

// --- Enums ---
export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',   // Usuario está respondiendo
  COMPLETED = 'COMPLETED',       // Quiz completado
  TIMED_OUT = 'TIMED_OUT',       // Se acabó el tiempo
  ABANDONED = 'ABANDONED',       // Usuario abandonó
}

// --- Interface para Respuesta Individual ---
export interface QuestionAnswer {
  questionId: string;           // ID de la pregunta
  questionType: QuestionType;

  // Respuesta del usuario según el tipo
  selectedOptionIds?: string[];  // Para MULTIPLE_CHOICE, MULTIPLE_ANSWER, TRUE_FALSE
  textAnswer?: string;           // Para TEXT, FILL_BLANK
  matchingAnswers?: { leftId: string; rightId: string }[];  // Para MATCHING
  orderAnswer?: string[];        // Para ORDERING (IDs en el orden dado)

  // Evaluación
  isCorrect: boolean;
  isPartiallyCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;

  // Metadata
  answeredAt: Date;
  timeSpentSeconds: number;      // Tiempo dedicado a esta pregunta

  // Feedback mostrado
  feedbackShown?: string;
}

// --- Interface para Resumen del Intento ---
export interface AttemptSummary {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  partiallyCorrectAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;

  totalPoints: number;
  earnedPoints: number;
  percentage: number;

  passed: boolean;
  passingScore: number;

  // Desglose por tipo de pregunta
  byQuestionType: {
    type: QuestionType;
    total: number;
    correct: number;
  }[];

  // Desglose por dificultad
  byDifficulty: {
    level: string;
    total: number;
    correct: number;
  }[];
}

// --- Schema Principal ---
@Schema({ timestamps: true })
export class QuizAttempt {
  _id: Types.ObjectId;

  // --- 🔗 Relaciones ---
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true, index: true })
  quizId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // Opcional: relacionar con lección/progreso para actualizar
  @Prop({ type: Types.ObjectId, ref: 'Lesson', default: null })
  lessonId: Types.ObjectId | null;

  // --- 📊 Estado del Intento ---
  @Prop({
    type: String,
    enum: AttemptStatus,
    default: AttemptStatus.IN_PROGRESS,
  })
  status: AttemptStatus;

  @Prop({ required: true })
  attemptNumber: number;         // Número de intento (1, 2, 3...)

  // --- ⏱️ Tiempo ---
  @Prop({ type: Date, required: true })
  startedAt: Date;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: Date, default: null })
  expiresAt: Date | null;        // Cuándo expira (si tiene tiempo límite)

  @Prop({ default: 0 })
  totalTimeSeconds: number;      // Tiempo total del intento

  // --- ❓ Respuestas ---
  @Prop({
    type: [{
      questionId: { type: String, required: true },
      questionType: { type: String, enum: QuestionType, required: true },

      selectedOptionIds: { type: [String], default: [] },
      textAnswer: { type: String, default: null },
      matchingAnswers: {
        type: [{
          leftId: { type: String, required: true },
          rightId: { type: String, required: true },
        }],
        default: [],
      },
      orderAnswer: { type: [String], default: [] },

      isCorrect: { type: Boolean, default: false },
      isPartiallyCorrect: { type: Boolean, default: false },
      pointsEarned: { type: Number, default: 0 },
      maxPoints: { type: Number, required: true },

      answeredAt: { type: Date, default: Date.now },
      timeSpentSeconds: { type: Number, default: 0 },
      feedbackShown: { type: String, default: null },
    }],
    default: [],
  })
  answers: QuestionAnswer[];

  // --- 📈 Puntuación ---
  @Prop({ default: 0 })
  score: number;                 // Puntos obtenidos

  @Prop({ default: 0 })
  maxScore: number;              // Puntos máximos posibles

  @Prop({ default: 0 })
  percentage: number;            // Porcentaje obtenido

  @Prop({ default: false })
  passed: boolean;               // Si aprobó

  // --- 📊 Resumen (calculado al completar) ---
  @Prop({
    type: {
      totalQuestions: Number,
      answeredQuestions: Number,
      correctAnswers: Number,
      partiallyCorrectAnswers: Number,
      incorrectAnswers: Number,
      skippedQuestions: Number,
      totalPoints: Number,
      earnedPoints: Number,
      percentage: Number,
      passed: Boolean,
      passingScore: Number,
      byQuestionType: [{
        type: { type: String },
        total: Number,
        correct: Number,
      }],
      byDifficulty: [{
        level: String,
        total: Number,
        correct: Number,
      }],
    },
    default: null,
  })
  summary: AttemptSummary | null;

  // --- 🎁 Recompensas Otorgadas ---
  @Prop({ default: 0 })
  tokensEarned: number;

  @Prop({ default: 0 })
  xpEarned: number;

  @Prop({ default: false })
  rewardsGranted: boolean;       // Si ya se otorgaron las recompensas

  // --- 📝 Metadata ---
  @Prop({ type: String, default: null })
  ipAddress: string | null;

  @Prop({ type: String, default: null })
  userAgent: string | null;

  // --- 🔄 Orden de Preguntas (si shuffle está activo) ---
  @Prop({ type: [String], default: [] })
  questionOrder: string[];       // Orden en que se presentaron las preguntas

  createdAt: Date;
  updatedAt: Date;
}

export const QuizAttemptSchema = SchemaFactory.createForClass(QuizAttempt);

// --- Índices ---
QuizAttemptSchema.index({ quizId: 1, userId: 1 });
QuizAttemptSchema.index({ userId: 1, status: 1 });
QuizAttemptSchema.index({ quizId: 1, status: 1 });
QuizAttemptSchema.index({ userId: 1, lessonId: 1 });
QuizAttemptSchema.index({ createdAt: -1 });

// Índice compuesto para buscar el mejor intento
QuizAttemptSchema.index({ quizId: 1, userId: 1, passed: 1, percentage: -1 });
