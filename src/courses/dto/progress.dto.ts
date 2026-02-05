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

// --- Mark Lesson Complete DTO ---
export class MarkLessonCompleteDto {
  @IsMongoId()
  lessonId: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  completedBlocks?: number[];
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
  unlockedContent?: {
    nextLesson?: string;
    nextTheme?: string;
  };
}
