import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LessonDocument = Lesson & Document;

// --- Enums ---
export enum LessonType {
  VIDEO = 'VIDEO',
  EXERCISE = 'EXERCISE',
  QUIZ = 'QUIZ',
  READING = 'READING',
  DOWNLOAD = 'DOWNLOAD',
}

export enum LessonStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

// --- Content Block Types ---
export enum BlockType {
  TEXT = 'TEXT',           // HTML del editor de texto rico
  VIDEO = 'VIDEO',         // Reproductor de video (YouTube/Vimeo/Bunny)
  IFRAME = 'IFRAME',       // HTML externo (juegos, SCORM)
  FILE = 'FILE',           // Archivo descargable (PDF, ZIP)
  QUIZ = 'QUIZ',           // Quiz incrustado
  CODE = 'CODE',           // Bloque de código
  IMAGE = 'IMAGE',         // Imagen con caption
}

// --- Interfaces para Content Blocks ---
export interface ContentBlock {
  type: BlockType;
  order: number;

  // Contenido según el tipo
  content?: string;         // Para TEXT, CODE
  mediaUrl?: string;        // Para VIDEO, FILE, IMAGE
  iframeSrc?: string;       // Para IFRAME

  // Configuración extra
  settings?: {
    autoPlay?: boolean;
    allowFullScreen?: boolean;
    height?: string;
    language?: string;      // Para CODE (ej: 'javascript')
    caption?: string;       // Para IMAGE
    fileName?: string;      // Para FILE
    fileSize?: string;      // Para FILE
  };
}

// --- Interface para Recursos Descargables ---
export interface LessonResource {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'image' | 'document' | 'other';
  size: string;
  url: string;
}

// --- Schema ---
@Schema({ timestamps: true })
export class Lesson {
  _id: Types.ObjectId;

  // --- 📝 Información Básica ---
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: String, default: '' })
  description: string;

  // --- 🏷️ Tipo de Tarea ---
  @Prop({
    type: String,
    enum: LessonType,
    required: true,
  })
  type: LessonType;

  @Prop({
    type: String,
    enum: LessonStatus,
    default: LessonStatus.DRAFT,
  })
  status: LessonStatus;

  // --- 🔗 Relación con Tema (padre) ---
  @Prop({ type: Types.ObjectId, ref: 'Theme', required: true })
  themeId: Types.ObjectId;

  // --- 🧱 Content Blocks (Sistema Flexible) ---
  @Prop({
    type: [
      {
        type: { type: String, enum: BlockType, required: true },
        order: { type: Number, required: true },
        content: { type: String, default: null },
        mediaUrl: { type: String, default: null },
        iframeSrc: { type: String, default: null },
        settings: {
          type: {
            autoPlay: { type: Boolean, default: false },
            allowFullScreen: { type: Boolean, default: true },
            height: { type: String, default: null },
            language: { type: String, default: null },
            caption: { type: String, default: null },
            fileName: { type: String, default: null },
            fileSize: { type: String, default: null },
          },
          default: {},
        },
      },
    ],
    default: [],
  })
  contentBlocks: ContentBlock[];

  // --- 📎 Recursos Descargables ---
  @Prop({
    type: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, enum: ['pdf', 'video', 'image', 'document', 'other'], required: true },
        size: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    default: [],
  })
  resources: LessonResource[];

  // --- ⏱️ Tiempo y Orden ---
  @Prop({ default: 0 })
  durationMinutes: number;

  @Prop({ default: 0 })
  order: number;

  // --- 🔐 Configuración de Desbloqueo ---
  @Prop({ default: true })
  requiresPreviousCompletion: boolean;

  // --- 📅 Fecha Límite (para ejercicios) ---
  @Prop({ type: Date, default: null })
  deadline: Date | null;

  // --- 📊 Para Ejercicios: Configuración de Entrega ---
  @Prop({
    type: {
      maxFileSize: { type: String, default: '50MB' },
      acceptedFormats: { type: [String], default: ['jpg', 'png', 'mp4', 'pdf'] },
      requiresComment: { type: Boolean, default: false },
    },
    default: null,
  })
  submissionConfig: {
    maxFileSize: string;
    acceptedFormats: string[];
    requiresComment: boolean;
  } | null;

  // --- 📝 Para Quiz: Referencia al Quiz ---
  @Prop({ type: Types.ObjectId, ref: 'Quiz', default: null })
  quizId: Types.ObjectId | null;

  // --- 🎁 Preview (visible sin suscripción) ---
  @Prop({ default: false })
  isPreview: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);

// --- Índices ---
// slug ya tiene unique: true en @Prop, no es necesario duplicar
// themeId indexado mediante índice compuesto { themeId: 1, order: 1 }
LessonSchema.index({ themeId: 1, order: 1 });
LessonSchema.index({ type: 1 });
LessonSchema.index({ status: 1 });
