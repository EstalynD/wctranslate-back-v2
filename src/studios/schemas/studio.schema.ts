import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudioDocument = Studio & Document;

// --- Enums ---
export enum StudioStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

// --- Interfaces ---
export interface StudioContact {
  whatsapp?: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface StudioAddress {
  country?: string;
  city?: string;
  address?: string;
}

export interface StudioStats {
  totalModels: number;
  activeModels: number;
  totalTokensEarned: number;
  totalLessonsCompleted: number;
}

// --- Schema ---
@Schema({
  timestamps: true,
  collection: 'studios',
})
export class Studio {
  // --- 📋 Información Básica ---
  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  name: string;

  @Prop({
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  })
  slug: string;

  @Prop({
    type: String,
    trim: true,
    maxlength: 500,
  })
  description?: string;

  @Prop({
    type: String,
    default: null,
  })
  logoUrl?: string;

  // --- 👤 Propietario ---
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  })
  ownerName: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  ownerId?: Types.ObjectId;

  // --- 📞 Contacto ---
  @Prop({
    type: {
      whatsapp: { type: String, default: null },
      email: { type: String, default: null },
      phone: { type: String, default: null },
      website: { type: String, default: null },
    },
    default: {
      whatsapp: null,
      email: null,
      phone: null,
      website: null,
    },
    _id: false,
  })
  contact: StudioContact;

  // --- 📍 Ubicación ---
  @Prop({
    type: {
      country: { type: String, default: null },
      city: { type: String, default: null },
      address: { type: String, default: null },
    },
    default: {
      country: null,
      city: null,
      address: null,
    },
    _id: false,
  })
  location: StudioAddress;

  // --- 📊 Estadísticas ---
  @Prop({
    type: {
      totalModels: { type: Number, default: 0 },
      activeModels: { type: Number, default: 0 },
      totalTokensEarned: { type: Number, default: 0 },
      totalLessonsCompleted: { type: Number, default: 0 },
    },
    default: {
      totalModels: 0,
      activeModels: 0,
      totalTokensEarned: 0,
      totalLessonsCompleted: 0,
    },
    _id: false,
  })
  stats: StudioStats;

  // --- 🚦 Estado ---
  @Prop({
    type: String,
    enum: StudioStatus,
    default: StudioStatus.ACTIVE,
  })
  status: StudioStatus;

  // --- 📅 Timestamps ---
  createdAt: Date;
  updatedAt: Date;
}

export const StudioSchema = SchemaFactory.createForClass(Studio);

// Índices para optimizar consultas
StudioSchema.index({ status: 1 });
StudioSchema.index({ ownerName: 1 });
StudioSchema.index({ ownerId: 1 });
StudioSchema.index({ 'stats.totalModels': -1 });
StudioSchema.index({ createdAt: -1 });

// Middleware para generar slug automáticamente
StudioSchema.pre('save', function (this: StudioDocument, next: Function) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});
