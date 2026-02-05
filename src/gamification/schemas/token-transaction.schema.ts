import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TokenTransactionDocument = TokenTransaction & Document;

// --- Enums ---
export enum TransactionType {
  // Ganancias
  LESSON_COMPLETE = 'LESSON_COMPLETE',       // Completar lección
  QUIZ_PASS = 'QUIZ_PASS',                   // Aprobar quiz
  QUIZ_PERFECT = 'QUIZ_PERFECT',             // Quiz con puntuación perfecta
  THEME_COMPLETE = 'THEME_COMPLETE',         // Completar tema
  COURSE_COMPLETE = 'COURSE_COMPLETE',       // Completar curso
  STREAK_BONUS = 'STREAK_BONUS',             // Bonus por racha
  ACHIEVEMENT = 'ACHIEVEMENT',               // Logro desbloqueado
  DAILY_LOGIN = 'DAILY_LOGIN',               // Login diario
  BONUS = 'BONUS',                           // Bonus manual (admin)
  REFERRAL = 'REFERRAL',                     // Referido

  // Gastos (para futuro)
  SPEND = 'SPEND',                           // Gasto genérico
  REDEMPTION = 'REDEMPTION',                 // Canjeo de recompensa

  // Ajustes
  ADJUSTMENT = 'ADJUSTMENT',                 // Ajuste manual (admin)
  REFUND = 'REFUND',                         // Devolución
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REVERSED = 'REVERSED',
}

// --- Reference Types ---
export enum ReferenceType {
  LESSON = 'LESSON',
  QUIZ = 'QUIZ',
  QUIZ_ATTEMPT = 'QUIZ_ATTEMPT',
  THEME = 'THEME',
  COURSE = 'COURSE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  STREAK = 'STREAK',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
}

// --- Schema ---
@Schema({ timestamps: true })
export class TokenTransaction {
  _id: Types.ObjectId;

  // --- 🔗 Usuario ---
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // --- 💰 Transacción ---
  @Prop({ required: true })
  amount: number;                            // Positivo = ganar, Negativo = gastar

  @Prop({
    type: String,
    enum: TransactionType,
    required: true,
  })
  type: TransactionType;

  @Prop({
    type: String,
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  // --- 📝 Descripción ---
  @Prop({ required: true })
  description: string;                       // Descripción legible

  @Prop({ type: String, default: null })
  internalNote: string | null;               // Nota interna (solo admin)

  // --- 🔗 Referencia ---
  @Prop({
    type: String,
    enum: ReferenceType,
    default: null,
  })
  referenceType: ReferenceType | null;

  @Prop({ type: Types.ObjectId, default: null })
  referenceId: Types.ObjectId | null;        // ID del objeto referenciado

  // --- 📊 Balance después de transacción ---
  @Prop({ required: true })
  balanceAfter: number;                      // Balance total después de esta transacción

  // --- 🎮 XP asociado (si aplica) ---
  @Prop({ default: 0 })
  xpAmount: number;                          // XP ganado en esta transacción

  // --- 📅 Metadata ---
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  grantedBy: Types.ObjectId | null;          // Admin que otorgó (si aplica)

  @Prop({ type: String, default: null })
  ipAddress: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const TokenTransactionSchema = SchemaFactory.createForClass(TokenTransaction);

// --- Índices ---
TokenTransactionSchema.index({ userId: 1, createdAt: -1 });
TokenTransactionSchema.index({ userId: 1, type: 1 });
TokenTransactionSchema.index({ userId: 1, status: 1 });
TokenTransactionSchema.index({ referenceType: 1, referenceId: 1 });
TokenTransactionSchema.index({ createdAt: -1 });
TokenTransactionSchema.index({ type: 1, createdAt: -1 });
