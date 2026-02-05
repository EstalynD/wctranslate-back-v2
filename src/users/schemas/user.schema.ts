import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

// --- Enums ---
export enum UserRole {
  MODEL = 'MODEL',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum PlanType {
  TESTER = 'TESTER',
  FREE = 'FREE',
  PRO = 'PRO',
  ELITE = 'ELITE',
}

export enum UserStage {
  INICIACION = 'INICIACION',
  INTERMEDIO = 'INTERMEDIO',
  AVANZADO = 'AVANZADO',
}

export enum StreamingPlatform {
  CHATURBATE = 'CHATURBATE',
  LIVEJASMIN = 'LIVEJASMIN',
  STRIPCHAT = 'STRIPCHAT',
  BONGACAMS = 'BONGACAMS',
  CAM4 = 'CAM4',
  MYFREECAMS = 'MYFREECAMS',
  FLIRT4FREE = 'FLIRT4FREE',
  STREAMATE = 'STREAMATE',
  OTHER = 'OTHER',
}

// --- Subdocument Interfaces ---
export interface UserProfile {
  firstName: string;
  lastName: string;
  nickName?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UserGamification {
  level: number;
  stars: number;
  currentXp: number;
}

export interface SubscriptionAccess {
  isActive: boolean;
  planType: PlanType;
  expiresAt: Date | null;
  subscriptionId?: string;
}

// --- Nuevo: Control de Tareas Diarias ---
export interface DailyProgress {
  tasksCompletedToday: number;
  lastTaskDate: Date | null;
  maxDailyTasks: number;
}

// --- Nuevo: Configuración del Modelo ---
export interface ModelConfig {
  streamingPlatform: StreamingPlatform | null;
  stage: UserStage;
  isSuperUser: boolean;      // Acceso completo sin restricciones
  isDemo: boolean;           // Cuenta de demostración
  studioId: Types.ObjectId | null;  // Referencia al estudio (futuro)
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret: Record<string, unknown>) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  _id: Types.ObjectId;

  // --- 🆔 Identidad ---
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
    minlength: 8,
    select: false,
  })
  password: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.MODEL,
  })
  role: UserRole;

  @Prop({
    type: String,
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  // --- 👩‍🎤 Perfil (Visible en Frontend) ---
  @Prop({
    type: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      nickName: { type: String, default: null },
      avatarUrl: { type: String, default: null },
      bio: { type: String, default: null },
    },
    required: true,
    _id: false,
  })
  profile: UserProfile;

  // --- 🎮 Gamificación ---
  @Prop({
    type: {
      level: { type: Number, default: 1 },
      stars: { type: Number, default: 0 },
      currentXp: { type: Number, default: 0 },
    },
    default: { level: 1, stars: 0, currentXp: 0 },
    _id: false,
  })
  gamification: UserGamification;

  // --- 🚦 Semáforo de Acceso (SaaS) ---
  @Prop({
    type: {
      isActive: { type: Boolean, default: true },
      planType: { type: String, enum: PlanType, default: PlanType.TESTER },
      expiresAt: { type: Date, default: null },
      subscriptionId: { type: String, default: null },
    },
    default: { isActive: true, planType: PlanType.TESTER, expiresAt: null, subscriptionId: null },
    _id: false,
  })
  subscriptionAccess: SubscriptionAccess;

  // --- �‍💻 Configuración del Modelo ---
  @Prop({
    type: {
      streamingPlatform: { type: String, enum: StreamingPlatform, default: null },
      stage: { type: String, enum: UserStage, default: UserStage.INICIACION },
      isSuperUser: { type: Boolean, default: false },
      isDemo: { type: Boolean, default: false },
      studioId: { type: Types.ObjectId, ref: 'Studio', default: null },
    },
    default: {
      streamingPlatform: null,
      stage: UserStage.INICIACION,
      isSuperUser: false,
      isDemo: false,
      studioId: null,
    },
    _id: false,
  })
  modelConfig: ModelConfig;

  // --- 📅 Progreso Diario ---
  @Prop({
    type: {
      tasksCompletedToday: { type: Number, default: 0 },
      lastTaskDate: { type: Date, default: null },
      maxDailyTasks: { type: Number, default: 1 },
    },
    default: {
      tasksCompletedToday: 0,
      lastTaskDate: null,
      maxDailyTasks: 1,
    },
    _id: false,
  })
  dailyProgress: DailyProgress;

  // --- 📊 Metadata ---
  @Prop({
    type: Date,
    default: null,
  })
  lastLoginAt: Date | null;

  @Prop({
    type: Boolean,
    default: false,
  })
  emailVerified: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Índices para optimizar consultas
UserSchema.index({ status: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'subscriptionAccess.isActive': 1 });
UserSchema.index({ 'subscriptionAccess.planType': 1 });
UserSchema.index({ 'gamification.level': -1 });
UserSchema.index({ 'modelConfig.streamingPlatform': 1 });
UserSchema.index({ 'modelConfig.stage': 1 });
UserSchema.index({ 'modelConfig.studioId': 1 });
UserSchema.index({ 'modelConfig.isSuperUser': 1 });
