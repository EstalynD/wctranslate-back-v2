import {
  IsNumber,
  IsBoolean,
  IsOptional,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// --- Actualizar Tareas Diarias ---
export class UpdateDailyTasksDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxDailyTasks?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

// --- Actualizar Settings ---
export class UpdateSystemSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateDailyTasksDto)
  dailyTasks?: UpdateDailyTasksDto;
}
