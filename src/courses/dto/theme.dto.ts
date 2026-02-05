import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsMongoId,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

// --- Create Theme DTO ---
export class CreateThemeDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  highlightedText?: string;

  @IsMongoId()
  courseId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  requiresPreviousCompletion?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  unlockThreshold?: number;
}

// --- Update Theme DTO ---
export class UpdateThemeDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  highlightedText?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  requiresPreviousCompletion?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  unlockThreshold?: number;
}

// --- Reorder Lessons DTO ---
export class ReorderLessonsDto {
  @IsArray()
  @IsMongoId({ each: true })
  lessonIds: string[];
}
