import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsMongoId,
  IsNumber,
  Min,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '../schemas/quiz.schema';
import { AttemptStatus, AttemptSummary } from '../schemas/quiz-attempt.schema';

// ==================== ANSWER SUBMISSION DTOs ====================

export class MatchingAnswerDto {
  @IsString()
  leftId: string;

  @IsString()
  rightId: string;
}

export class SubmitAnswerDto {
  @IsString()
  questionId: string;

  // Para MULTIPLE_CHOICE, MULTIPLE_ANSWER, TRUE_FALSE
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptionIds?: string[];

  // Para TEXT, FILL_BLANK
  @IsOptional()
  @IsString()
  textAnswer?: string;

  // Para MATCHING
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchingAnswerDto)
  matchingAnswers?: MatchingAnswerDto[];

  // Para ORDERING
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderAnswer?: string[];

  // Tiempo dedicado a esta pregunta
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpentSeconds?: number;
}

// ==================== ATTEMPT DTOs ====================

export class StartAttemptDto {
  @IsMongoId()
  quizId: string;

  @IsOptional()
  @IsMongoId()
  lessonId?: string;
}

export class SubmitAttemptDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];

  // Tiempo total del intento (en segundos)
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalTimeSeconds?: number;
}

export class SaveProgressDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];

  // Pregunta actual (para tracking)
  @IsOptional()
  @IsString()
  currentQuestionId?: string;
}

// ==================== QUERY DTOs ====================

export class GetAttemptsQueryDto {
  @IsOptional()
  @IsMongoId()
  quizId?: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsEnum(AttemptStatus)
  status?: AttemptStatus;

  @IsOptional()
  @IsBoolean()
  passed?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ==================== RESPONSE DTOs ====================

export class AttemptStartResponseDto {
  attemptId: string;
  quizId: string;
  attemptNumber: number;
  startedAt: Date;
  expiresAt: Date | null;
  questionOrder: string[];  // Orden de preguntas (puede estar shuffled)

  // Quiz info para el frontend
  quiz: {
    title: string;
    description: string;
    instructions: string;
    totalQuestions: number;
    totalPoints: number;
    settings: {
      timeLimit: number | null;
      showTimer: boolean;
      allowSkip: boolean;
      allowBackNavigation: boolean;
      allowReview: boolean;
    };
    questions: {
      id: string;
      type: QuestionType;
      question: string;
      imageUrl?: string;
      videoUrl?: string;
      points: number;
      order: number;
      isRequired: boolean;
      options?: { id: string; text: string; imageUrl?: string }[];
      matchingLeft?: { id: string; text: string }[];
      matchingRight?: { id: string; text: string }[];
      orderItems?: { id: string; text: string }[];
    }[];
  };
}

export class AttemptResultResponseDto {
  attemptId: string;
  status: AttemptStatus;

  // Puntuación
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;

  // Tiempo
  totalTimeSeconds: number;
  startedAt: Date;
  completedAt: Date;

  // Resumen
  summary: AttemptSummary;

  // Recompensas (si aplica)
  rewards: {
    tokensEarned: number;
    xpEarned: number;
    isFirstPass: boolean;
    isPerfectScore: boolean;
  } | null;

  // Feedback según configuración
  feedback?: {
    correctAnswers?: {
      questionId: string;
      correctOptionIds?: string[];
      correctAnswer?: string;
      explanation?: string;
    }[];
    message: string;
  };

  // Info para reintentar
  retryInfo?: {
    canRetry: boolean;
    attemptsRemaining: number;
    cooldownEndsAt: Date | null;
  };
}

export class AttemptDetailResponseDto {
  attemptId: string;
  quizId: string;
  userId: string;
  status: AttemptStatus;
  attemptNumber: number;

  // Respuestas con evaluación
  answers: {
    questionId: string;
    questionText: string;
    questionType: QuestionType;

    // Lo que respondió el usuario
    userAnswer: {
      selectedOptionIds?: string[];
      textAnswer?: string;
      matchingAnswers?: { leftId: string; rightId: string }[];
      orderAnswer?: string[];
    };

    // Evaluación
    isCorrect: boolean;
    isPartiallyCorrect: boolean;
    pointsEarned: number;
    maxPoints: number;

    // Feedback (si está configurado para mostrarse)
    correctAnswer?: {
      optionIds?: string[];
      text?: string;
      matchingPairs?: { leftId: string; rightId: string }[];
      correctOrder?: string[];
    };
    explanation?: string;
    timeSpentSeconds: number;
  }[];

  // Puntuación total
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;

  // Tiempo
  totalTimeSeconds: number;
  startedAt: Date;
  completedAt: Date | null;

  // Resumen
  summary: AttemptSummary | null;
}

export class UserQuizHistoryDto {
  quizId: string;
  quizTitle: string;
  quizType: string;

  attempts: {
    attemptId: string;
    attemptNumber: number;
    status: AttemptStatus;
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    totalTimeSeconds: number;
    completedAt: Date | null;
  }[];

  bestAttempt: {
    attemptId: string;
    percentage: number;
    score: number;
  } | null;

  totalAttempts: number;
  attemptsRemaining: number | null;  // null = ilimitado
  canRetry: boolean;
  cooldownEndsAt: Date | null;
}

// ==================== VALIDATION RESPONSE ====================

export class CanStartQuizResponseDto {
  canStart: boolean;
  reason?: string;

  // Info útil
  attemptsUsed: number;
  maxAttempts: number;
  cooldownEndsAt: Date | null;

  // Si hay un intento en progreso
  inProgressAttemptId?: string;
}
