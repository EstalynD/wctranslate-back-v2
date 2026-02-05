import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsMongoId,
  Min,
  Max,
  ArrayMinSize,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import {
  QuizType,
  QuizStatus,
  QuestionType,
  DifficultyLevel,
} from '../schemas/quiz.schema';

// ==================== OPTION DTOs ====================

export class QuestionOptionDto {
  @IsString()
  id: string;

  @IsString()
  text: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class MatchingPairDto {
  @IsString()
  id: string;

  @IsString()
  left: string;

  @IsString()
  right: string;
}

export class OrderItemDto {
  @IsString()
  id: string;

  @IsString()
  text: string;
}

// ==================== QUESTION DTOs ====================

export class QuizQuestionDto {
  @IsString()
  id: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  // Para MULTIPLE_CHOICE, MULTIPLE_ANSWER, TRUE_FALSE
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  // Para TEXT y FILL_BLANK
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  correctAnswers?: string[];

  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean;

  // Para MATCHING
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchingPairDto)
  matchingPairs?: MatchingPairDto[];

  // Para ORDERING
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  correctOrder?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems?: OrderItemDto[];

  @IsNumber()
  @Min(0)
  points: number;

  @IsOptional()
  @IsBoolean()
  partialCredit?: boolean;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsNumber()
  @Min(0)
  order: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

// ==================== SETTINGS DTOs ====================

export class PreQuizBehaviorDto {
  @IsOptional()
  @IsBoolean()
  showContentOnFail?: boolean;

  @IsOptional()
  @IsBoolean()
  bypassOnSuccess?: boolean;

  @IsOptional()
  @IsString()
  motivationalMessageOnFail?: string;

  @IsOptional()
  @IsString()
  congratsMessageOnPass?: string;
}

export class PostQuizBehaviorDto {
  @IsOptional()
  @IsBoolean()
  requirePassToComplete?: boolean;

  @IsOptional()
  @IsBoolean()
  unlockNextOnPass?: boolean;

  @IsOptional()
  @IsString()
  retryMessageOnFail?: string;
}

export class QuizSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  timeLimit?: number;

  @IsOptional()
  @IsBoolean()
  showTimer?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAttempts?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cooldownMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @IsOptional()
  @IsBoolean()
  showScoreImmediately?: boolean;

  @IsOptional()
  @IsBoolean()
  allowSkip?: boolean;

  @IsOptional()
  @IsBoolean()
  allowReview?: boolean;

  @IsOptional()
  @IsBoolean()
  allowBackNavigation?: boolean;

  @IsOptional()
  @IsBoolean()
  showCorrectAnswers?: boolean;

  @IsOptional()
  @IsBoolean()
  showExplanations?: boolean;

  @IsOptional()
  @IsEnum(['immediate', 'after_submit', 'after_all_attempts'])
  feedbackTiming?: 'immediate' | 'after_submit' | 'after_all_attempts';

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  shuffleOptions?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => PreQuizBehaviorDto)
  preQuizBehavior?: PreQuizBehaviorDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PostQuizBehaviorDto)
  postQuizBehavior?: PostQuizBehaviorDto;
}

// ==================== MAIN QUIZ DTOs ====================

export class CreateQuizDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsEnum(QuizType)
  type: QuizType;

  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;

  @IsOptional()
  @IsMongoId()
  lessonId?: string;

  @IsOptional()
  @IsMongoId()
  themeId?: string;

  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions?: QuizQuestionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => QuizSettingsDto)
  settings?: QuizSettingsDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tokensReward?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  xpReward?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonusTokensForPerfect?: number;
}

export class UpdateQuizDto extends PartialType(CreateQuizDto) {}

// ==================== QUESTION CRUD DTOs ====================

export class AddQuestionDto {
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  correctAnswers?: string[];

  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchingPairDto)
  matchingPairs?: MatchingPairDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  correctOrder?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems?: OrderItemDto[];

  @IsNumber()
  @Min(0)
  points: number;

  @IsOptional()
  @IsBoolean()
  partialCredit?: boolean;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class UpdateQuestionDto extends PartialType(AddQuestionDto) {}

// ==================== QUERY DTOs ====================

export class GetQuizzesQueryDto {
  @IsOptional()
  @IsEnum(QuizType)
  type?: QuizType;

  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;

  @IsOptional()
  @IsMongoId()
  lessonId?: string;

  @IsOptional()
  @IsMongoId()
  themeId?: string;

  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ==================== RESPONSE DTOs ====================

export class QuizResponseDto {
  id: string;
  title: string;
  description: string;
  instructions: string;
  type: QuizType;
  status: QuizStatus;
  lessonId: string | null;
  themeId: string | null;
  courseId: string | null;
  totalQuestions: number;
  totalPoints: number;
  settings: QuizSettingsDto;
  tokensReward: number;
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
}

export class QuizWithQuestionsResponseDto extends QuizResponseDto {
  questions: QuizQuestionDto[];
}

// Para el frontend: quiz sin respuestas correctas
export class QuizForStudentDto {
  id: string;
  title: string;
  description: string;
  instructions: string;
  type: QuizType;
  totalQuestions: number;
  totalPoints: number;
  settings: Partial<QuizSettingsDto>;
  questions: StudentQuestionDto[];
}

export class StudentQuestionDto {
  id: string;
  type: QuestionType;
  question: string;
  imageUrl?: string;
  videoUrl?: string;
  points: number;
  order: number;
  isRequired: boolean;

  // Opciones SIN isCorrect
  options?: { id: string; text: string; imageUrl?: string }[];

  // Para MATCHING: solo los items (mezclados)
  matchingLeft?: { id: string; text: string }[];
  matchingRight?: { id: string; text: string }[];

  // Para ORDERING: items a ordenar
  orderItems?: { id: string; text: string }[];
}

// ==================== STATISTICS DTOs ====================

export class QuizStatisticsDto {
  quizId: string;
  totalAttempts: number;
  uniqueUsers: number;
  averageScore: number;
  averageTimeSeconds: number;
  passRate: number;

  scoreDistribution: {
    range: string;    // "0-20%", "21-40%", etc.
    count: number;
  }[];

  questionStats: {
    questionId: string;
    question: string;
    correctRate: number;
    averageTimeSeconds: number;
    mostSelectedOption?: string;
  }[];
}
