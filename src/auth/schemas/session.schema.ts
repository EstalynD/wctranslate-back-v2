import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({
  timestamps: true,
})
export class Session {
  _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  token: string;

  @Prop({
    required: true,
  })
  expiresAt: Date;

  @Prop({
    type: String,
    default: null,
  })
  userAgent: string | null;

  @Prop({
    type: String,
    default: null,
  })
  ipAddress: string | null;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  lastActivityAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Índice TTL para auto-eliminar sesiones expiradas
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Índices para consultas frecuentes
SessionSchema.index({ token: 1, isActive: 1 });
SessionSchema.index({ userId: 1, isActive: 1 });
