import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserProgressDocument = UserProgress & Document;

// --- Enums ---
export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

// --- Subdocumentos ---
export interface LessonProgress {
  lessonId: Types.ObjectId;
  status: ProgressStatus;
  completedAt: Date | null;
  timeSpent?: number; // Tiempo en segundos

  // Para ejercicios: info de entrega
  submission?: {
    fileUrl: string;
    fileName: string;
    comment: string;
    submittedAt: Date;
    grade: number | null;
    feedback: string | null;
  };

  // Para quizzes: resultado
  quizResult?: {
    score: number;
    maxScore: number;
    percentage: number;
    attempts: number;
    lastAttemptAt: Date;
    passed: boolean;
  };

  // Bloques completados (para lecciones con múltiples bloques)
  completedBlocks: number[];
}

export interface ThemeProgress {
  themeId: Types.ObjectId;
  status: ProgressStatus;
  progressPercentage: number;
  lessonsProgress: LessonProgress[];
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface CourseProgress {
  courseId: Types.ObjectId;
  status: ProgressStatus;
  progressPercentage: number;
  themesProgress: ThemeProgress[];
  enrolledAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  lastAccessedAt: Date;
}

// --- Schema Principal ---
@Schema({ timestamps: true })
export class UserProgress {
  _id: Types.ObjectId;

  // --- 🔗 Relación con Usuario ---
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // --- 📚 Progreso por Curso ---
  @Prop({
    type: [
      {
        courseId: { type: Types.ObjectId, ref: 'Course', required: true },
        status: { type: String, enum: ProgressStatus, default: ProgressStatus.NOT_STARTED },
        progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
        enrolledAt: { type: Date, default: Date.now },
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        lastAccessedAt: { type: Date, default: Date.now },

        themesProgress: [
          {
            themeId: { type: Types.ObjectId, ref: 'Theme', required: true },
            status: { type: String, enum: ProgressStatus, default: ProgressStatus.NOT_STARTED },
            progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
            startedAt: { type: Date, default: null },
            completedAt: { type: Date, default: null },

            lessonsProgress: [
              {
                lessonId: { type: Types.ObjectId, ref: 'Lesson', required: true },
                status: { type: String, enum: ProgressStatus, default: ProgressStatus.NOT_STARTED },
                completedAt: { type: Date, default: null },
                completedBlocks: { type: [Number], default: [] },
                timeSpent: { type: Number, default: 0 }, // Tiempo en segundos

                submission: {
                  type: {
                    fileUrl: String,
                    fileName: String,
                    comment: String,
                    submittedAt: Date,
                    grade: { type: Number, default: null },
                    feedback: { type: String, default: null },
                  },
                  default: null,
                },

                quizResult: {
                  type: {
                    score: Number,
                    maxScore: Number,
                    percentage: Number,
                    attempts: { type: Number, default: 0 },
                    lastAttemptAt: Date,
                    passed: Boolean,
                  },
                  default: null,
                },
              },
            ],
          },
        ],
      },
    ],
    default: [],
  })
  courses: CourseProgress[];

  // --- 🏆 Estadísticas Globales ---
  @Prop({ default: 0 })
  totalCoursesCompleted: number;

  @Prop({ default: 0 })
  totalLessonsCompleted: number;

  @Prop({ default: 0 })
  totalTimeSpentMinutes: number;

  @Prop({ default: 0 })
  totalTimeSpent: number; // Tiempo total en segundos

  @Prop({ default: 0 })
  currentStreak: number; // Días consecutivos de estudio

  @Prop({ default: 0 })
  longestStreak: number;

  @Prop({ type: Date, default: null })
  lastStudyDate: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const UserProgressSchema = SchemaFactory.createForClass(UserProgress);

// --- Índices ---
UserProgressSchema.index({ userId: 1 }, { unique: true });
UserProgressSchema.index({ 'courses.courseId': 1 });
UserProgressSchema.index({ 'courses.status': 1 });
UserProgressSchema.index({ userId: 1, 'courses.courseId': 1 });
