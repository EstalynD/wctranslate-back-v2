import {
  IsString,
  IsOptional,
  IsEnum,
  IsUrl,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { PlatformStatus, PlatformType } from '../schemas/platform.schema';

// --- Create Platform DTO ---
export class CreatePlatformDto {
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name!: string;

  @IsEnum(PlatformType, { message: 'Tipo de plataforma inválido' })
  type!: PlatformType;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'El favicon debe ser una URL válida' })
  favicon?: string;

  @IsOptional()
  @IsUrl({}, { message: 'El logo debe ser una URL válida' })
  logoUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'El sitio web debe ser una URL válida' })
  websiteUrl?: string;

  @IsOptional()
  @IsEnum(PlatformStatus, { message: 'Estado inválido' })
  status?: PlatformStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number;
}

// --- Update Platform DTO ---
export class UpdatePlatformDto extends PartialType(CreatePlatformDto) {}

// --- Query Platform DTO ---
export class QueryPlatformDto {
  @IsOptional()
  @IsEnum(PlatformStatus)
  status?: PlatformStatus;

  @IsOptional()
  @IsEnum(PlatformType)
  type?: PlatformType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
