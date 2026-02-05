import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

export enum SubscriptionProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  MANUAL = 'MANUAL',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  TRIALING = 'TRIALING',
  INCOMPLETE = 'INCOMPLETE',
}

export interface PaymentHistoryItem {
  amount: number;
  currency: string;
  status: string;
  date: Date;
  invoiceUrl?: string;
}

@Schema({ timestamps: true })
export class Subscription {
  _id: Types.ObjectId;

  // --- 🔗 Relación con Usuario ---
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    // index: true eliminado - ya existe índice compuesto { userId: 1, status: 1 }
  })
  userId: Types.ObjectId;

  // --- 💳 Datos del Proveedor de Pagos ---
  @Prop({
    required: true,
    enum: SubscriptionProvider,
    default: SubscriptionProvider.MANUAL,
  })
  provider: SubscriptionProvider;

  @Prop({ type: String, default: null })
  externalSubscriptionId: string | null; // ID en Stripe/PayPal (ej: sub_1Mny...)

  @Prop({ type: String, default: null })
  customerId: string | null; // ID del cliente en Stripe/PayPal (ej: cus_9sL...)

  // --- 📅 Estado del Ciclo ---
  @Prop({
    required: true,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Prop({ required: true })
  planId: string; // ID interno de tu plan (ej: 'TESTER', 'PRO_MONTHLY')

  @Prop({ required: true })
  currentPeriodStart: Date;

  @Prop({ required: true })
  currentPeriodEnd: Date; // Fecha de próxima renovación

  @Prop({ default: false })
  cancelAtPeriodEnd: boolean; // Si el usuario canceló pero aún tiene días

  @Prop({ type: Date, default: null })
  canceledAt: Date | null; // Fecha de cancelación efectiva

  // --- 🧾 Historial de Pagos ---
  @Prop({
    type: [
      {
        amount: { type: Number, required: true },
        currency: { type: String, default: 'USD' },
        status: { type: String, required: true },
        date: { type: Date, required: true },
        invoiceUrl: { type: String, default: null },
      },
    ],
    default: [],
  })
  paymentHistory: PaymentHistoryItem[];

  // --- 📝 Notas (para gestión manual) ---
  @Prop({ type: String, default: null })
  notes: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Índices para consultas frecuentes
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });
SubscriptionSchema.index({ externalSubscriptionId: 1 });
