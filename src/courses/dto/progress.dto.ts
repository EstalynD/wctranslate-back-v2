import {
  IsString,
  IsOptional,
  IsMongoId,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// --- Submit Exercise DTO ---
export class SubmitExerciseDto {
  @IsMongoId()
  lessonId: string;

  @IsString()
  fileUrl: string;

  @IsString()
  fileName: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

// --- Submit Quiz DTO ---
export class SubmitQuizDto {
  @IsMongoId()
  lessonId: string;

  @IsNumber()
  @Min(0)
  score: number;

  @IsNumber()
  @Min(1)
  maxScore: number;
}

// --- Grade Submission DTO (Admin) ---
export class GradeSubmissionDto {
  @IsMongoId()
  lessonId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  grade: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}

// --- Mark Lesson Complete DTO (body del request) ---
export class MarkLessonCompleteDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  completedBlocks?: number[];
}

// --- Tipo interno con lessonId garantizado (usado por el service) ---
export interface MarkLessonCompletePayload extends MarkLessonCompleteDto {
  lessonId: string;
}

// --- Enroll Course DTO ---
export class EnrollCourseDto {
  @IsMongoId()
  courseId: string;
}

// --- Update Progress Response ---
export interface ProgressUpdateResponse {
  success: boolean;
  courseProgress: number;
  themeProgress: number;
  lessonCompleted: boolean;
  themeCompleted: boolean;
  courseCompleted: boolean;
  message?: string;
  unlockedContent?: {
    nextLesson?: string;
    nextTheme?: string;
  };
  // Información del POST_QUIZ si no se puede completar
  postQuizRequired?: {
    quizId?: string;
    attemptsCount: number;
    maxAttempts: number;
    bestScore?: number;
  };
  // Límite diario de tareas
  dailyLimitReached?: boolean;
  // Recompensas otorgadas al completar
  rewards?: {
    tokensEarned: number;
    xpEarned: number;
    streakBonus?: number;
    themeBonus?: number;
    courseBonus?: number;
    leveledUp?: boolean;
    newLevel?: number;
  };
  // Estado del progreso diario del usuario
  dailyProgress?: {
    tasksCompletedToday: number;
    maxDailyTasks: number;
    tasksRemaining: number;
  };
}

// --- Starting Point Response ---
export interface StartingPointResponse {
  courseId: string;
  themeId: string;
  lessonId: string;
  courseName: string;
  themeName: string;
  lessonName: string;
  themeOrder: number;
  lessonOrder: number;
}

// --- Daily Status Response ---
export interface DailyStatusResponse {
  tasksCompletedToday: number;
  maxDailyTasks: number;
  tasksRemaining: number;
  canCompleteMore: boolean;
  lastTaskDate: Date | null;
}

// --- Theme Access Response ---
export interface ThemeAccessResponse {
  canAccess: boolean;
  reason?: string;
  themeId: string;
  requiresCompletion: boolean;
  previousThemeProgress?: number;
  unlockThreshold?: number;
}

// --- Lesson Access Response ---
export interface LessonAccessResponse {
  canAccess: boolean;
  reason?: string;
  preQuizRequired?: boolean;
  preQuizId?: string;
  themeAccessible?: boolean;
  postQuiz?: {
    required: boolean;
    quizId?: string;
    hasPassed: boolean;
    message: string;
  };
  preQuiz?: {
    required: boolean;
    quizId?: string;
    hasPassed: boolean;
    message: string;
  };
}
