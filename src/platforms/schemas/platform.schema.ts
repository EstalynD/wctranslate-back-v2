import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlatformDocument = Platform & Document;

// --- Enums ---
export enum PlatformStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum PlatformType {
  TOKENS_CAM = 'TOKENS_CAM',
  PRIVATE = 'PRIVATE',
  CONTENT = 'CONTENT',
}

// --- Schema ---
@Schema({
  timestamps: true,
  collection: 'platforms',
})
export class Platform {
  // --- Información Básica ---
  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
    unique: true,
  })
  name!: string;

  @Prop({
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  })
  slug!: string;

  @Prop({
    type: String,
    enum: PlatformType,
    required: true,
    default: PlatformType.TOKENS_CAM,
  })
  type!: PlatformType;

  @Prop({
    type: String,
    trim: true,
    maxlength: 500,
  })
  description!: string;

  @Prop({
    type: String,
    trim: true,
  })
  favicon!: string;

  @Prop({
    type: String,
    trim: true,
  })
  logoUrl!: string;

  @Prop({
    type: String,
    trim: true,
  })
  websiteUrl!: string;

  @Prop({
    type: String,
    enum: PlatformStatus,
    default: PlatformStatus.ACTIVE,
  })
  status!: PlatformStatus;

  @Prop({
    type: Number,
    default: 0,
  })
  displayOrder!: number;

  // Timestamps virtuales (createdAt, updatedAt)
}

export const PlatformSchema = SchemaFactory.createForClass(Platform);

// --- Indexes ---
PlatformSchema.index({ name: 1 });
PlatformSchema.index({ slug: 1 });
PlatformSchema.index({ type: 1 });
PlatformSchema.index({ status: 1 });
PlatformSchema.index({ displayOrder: 1 });

// --- Genera slug a partir de un nombre ---
export function generatePlatformSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
