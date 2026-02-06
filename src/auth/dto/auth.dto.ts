import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

// --- Profile DTO for Registration ---
export class RegisterProfileDto {
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El apellido no puede exceder 50 caracteres' })
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickName?: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @IsString({ message: 'La contraseña es requerida' })
  password: string;
}

export class RegisterDto {
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100, { message: 'La contraseña no puede exceder 100 caracteres' })
  password: string;

  @ValidateNested()
  @Type(() => RegisterProfileDto)
  profile: RegisterProfileDto;
}

export class RefreshTokenDto {
  @IsString()
  token: string;
}
