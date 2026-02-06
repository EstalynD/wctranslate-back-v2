import { IsOptional, IsString, IsNumber, IsIn, IsBoolean } from 'class-validator';

// DTO para subir una imagen por URL
export class UploadImageUrlDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsString()
  publicId?: string;

  @IsOptional()
  @IsBoolean()
  overwrite?: boolean;
}

// DTO para transformaciones de imagen
export class TransformImageDto {
  @IsString()
  publicId!: string;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsIn(['auto', 'fill', 'fit', 'scale', 'thumb'])
  crop?: string;

  @IsOptional()
  @IsIn(['auto', 'face', 'center', 'north', 'south', 'east', 'west'])
  gravity?: string;

  @IsOptional()
  quality?: 'auto' | number;

  @IsOptional()
  @IsIn(['auto', 'jpg', 'png', 'webp', 'gif'])
  format?: string;
}

// DTO para eliminar una imagen
export class DeleteImageDto {
  @IsString()
  publicId!: string;

  @IsOptional()
  @IsIn(['image', 'video', 'raw'])
  resourceType?: string;
}
