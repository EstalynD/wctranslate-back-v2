import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  IsMongoId,
  IsDate,
  ValidateNested,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LessonType, LessonStatus, BlockType } from '../schemas/lesson.schema';

// --- Block Settings DTO (debe estar antes de ContentBlockDto) ---
export class BlockSettingsDto {
  @IsOptional()
  @IsBoolean()
  autoPlay?: boolean;

  @IsOptional()
  @IsBoolean()
  allowFullScreen?: boolean;

  @IsOptional()
  @IsString()
  height?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  fileSize?: string;
}

// --- Content Block DTO ---
export class ContentBlockDto {
  @IsEnum(BlockType)
  type: BlockType;

  @IsNumber()
  @Min(0)
  order: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  iframeSrc?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BlockSettingsDto)
  settings?: BlockSettingsDto;
}

// --- Resource DTO ---
export class LessonResourceDto {
  @IsString()
  id: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsEnum(['pdf', 'video', 'image', 'document', 'other'])
  type: 'pdf' | 'video' | 'image' | 'document' | 'other';

  @IsString()
  size: string;

  @IsString()
  url: string;
}

// --- Submission Config DTO ---
export class SubmissionConfigDto {
  @IsOptional()
  @IsString()
  maxFileSize?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  acceptedFormats?: string[];

  @IsOptional()
  @IsBoolean()
  requiresComment?: boolean;
}

// --- Create Lesson DTO ---
export class CreateLessonDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title: string;

  @IsString()
  @MinLength(3)
  @MaxLength(150)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(LessonType)
  type: LessonType;

  @IsOptional()
  @IsEnum(LessonStatus)
  status?: LessonStatus;

  @IsMongoId()
  themeId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentBlockDto)
  contentBlocks?: ContentBlockDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonResourceDto)
  resources?: LessonResourceDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  requiresPreviousCompletion?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deadline?: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => SubmissionConfigDto)
  submissionConfig?: SubmissionConfigDto;

  @IsOptional()
  @IsMongoId()
  quizId?: string;

  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;
}

// --- Update Lesson DTO ---
export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(LessonType)
  type?: LessonType;

  @IsOptional()
  @IsEnum(LessonStatus)
  status?: LessonStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentBlockDto)
  contentBlocks?: ContentBlockDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonResourceDto)
  resources?: LessonResourceDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  requiresPreviousCompletion?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deadline?: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => SubmissionConfigDto)
  submissionConfig?: SubmissionConfigDto;

  @IsOptional()
  @IsMongoId()
  quizId?: string;

  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;
}
