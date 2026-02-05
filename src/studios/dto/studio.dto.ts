import {
  IsString,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsUrl,
  ValidateNested,
  MinLength,
  MaxLength,
  IsEmail,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { StudioStatus } from '../schemas/studio.schema';

// --- Contact DTO ---
export class StudioContactDto {
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'WhatsApp debe ser un número válido con código de país',
  })
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUrl()
  website?: string;
}

// --- Location DTO ---
export class StudioLocationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  address?: string;
}

// --- Create Studio DTO ---
export class CreateStudioDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  ownerName: string;

  @IsOptional()
  @IsMongoId()
  ownerId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StudioContactDto)
  contact?: StudioContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StudioLocationDto)
  location?: StudioLocationDto;

  @IsOptional()
  @IsEnum(StudioStatus)
  status?: StudioStatus;
}

// --- Update Studio DTO ---
export class UpdateStudioDto extends PartialType(CreateStudioDto) {}

// --- Studio Response DTO ---
export class StudioResponseDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  ownerName: string;
  ownerId?: string;
  contact: {
    whatsapp?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  location: {
    country?: string;
    city?: string;
    address?: string;
  };
  stats: {
    totalModels: number;
    activeModels: number;
    totalTokensEarned: number;
    totalLessonsCompleted: number;
  };
  status: StudioStatus;
  createdAt: Date;
  updatedAt: Date;
}

// --- Studio List Query DTO ---
export class StudioQueryDto {
  @IsOptional()
  @IsEnum(StudioStatus)
  status?: StudioStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'createdAt' | 'totalModels';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

// --- Associate Model DTO ---
export class AssociateModelDto {
  @IsMongoId()
  userId: string;

  @IsMongoId()
  studioId: string;
}
