import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizDocument = Quiz & Document;

// --- Enums ---
export enum QuizType {
  PRE_QUIZ = 'PRE_QUIZ',   // Antes de ver el contenido (diagnóstico)
  POST_QUIZ = 'POST_QUIZ', // Después del contenido (evaluación)
  PRACTICE = 'PRACTICE',   // Quiz de práctica (sin afectar progreso)
  FINAL = 'FINAL',         // Examen final del curso/tema
}

export enum QuizStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',     // Una respuesta correcta
  MULTIPLE_ANSWER = 'MULTIPLE_ANSWER',     // Varias respuestas correctas
  TRUE_FALSE = 'TRUE_FALSE',               // Verdadero/Falso
  TEXT = 'TEXT',                           // Respuesta de texto libre
  FILL_BLANK = 'FILL_BLANK',               // Completar espacios en blanco
  MATCHING = 'MATCHING',                   // Emparejar opciones
  ORDERING = 'ORDERING',                   // Ordenar elementos
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

// --- Interfaces para Opciones de Pregunta ---
export interface QuestionOption {
  id: string;                    // UUID único para la opción
  text: string;                  // Texto de la opción
  isCorrect: boolean;            // Si es respuesta correcta
  feedback?: string;             // Retroalimentación específica para esta opción
  imageUrl?: string;             // Imagen opcional para la opción
}

// --- Interface para Pares de Matching ---
export interface MatchingPair {
  id: string;
  left: string;                  // Elemento izquierdo
  right: string;                 // Elemento derecho (respuesta correcta)
}

// --- Interface para Pregunta ---
export interface QuizQuestion {
  id: string;                    // UUID único
  type: QuestionType;
  question: string;              // Texto de la pregunta (puede incluir HTML)
  explanation?: string;          // Explicación que se muestra después de responder
  imageUrl?: string;             // Imagen opcional para la pregunta
  videoUrl?: string;             // Video opcional para la pregunta

  // Para MULTIPLE_CHOICE, MULTIPLE_ANSWER, TRUE_FALSE
  options?: QuestionOption[];

  // Para TEXT y FILL_BLANK
  correctAnswers?: string[];     // Respuestas correctas aceptadas
  caseSensitive?: boolean;       // Si distingue mayúsculas/minúsculas

  // Para MATCHING
  matchingPairs?: MatchingPair[];

  // Para ORDERING
  correctOrder?: string[];       // IDs en el orden correcto
  orderItems?: { id: string; text: string }[];

  // Configuración de puntos
  points: number;                // Puntos que vale esta pregunta
  partialCredit: boolean;        // Si permite puntuación parcial

  // Metadata
  difficulty: DifficultyLevel;
  tags?: string[];               // Etiquetas para categorizar
  order: number;                 // Orden en el quiz
  isRequired: boolean;           // Si es obligatoria
}

// --- Interface para Configuración del Quiz ---
export interface QuizSettings {
  // Tiempo
  timeLimit?: number;            // Límite de tiempo en minutos (null = sin límite)
  showTimer: boolean;            // Mostrar temporizador

  // Intentos
  maxAttempts: number;           // Máximo de intentos (0 = ilimitado)
  cooldownMinutes?: number;      // Tiempo de espera entre intentos

  // Puntuación
  passingScore: number;          // Porcentaje mínimo para aprobar (0-100)
  showScoreImmediately: boolean; // Mostrar puntuación al terminar

  // Navegación
  allowSkip: boolean;            // Permitir saltar preguntas
  allowReview: boolean;          // Permitir revisar respuestas antes de enviar
  allowBackNavigation: boolean;  // Permitir volver a preguntas anteriores

  // Feedback
  showCorrectAnswers: boolean;   // Mostrar respuestas correctas después
  showExplanations: boolean;     // Mostrar explicaciones
  feedbackTiming: 'immediate' | 'after_submit' | 'after_all_attempts';

  // Aleatorización
  shuffleQuestions: boolean;     // Mezclar orden de preguntas
  shuffleOptions: boolean;       // Mezclar opciones de respuesta

  // Comportamiento Pre-Quiz específico
  preQuizBehavior?: {
    showContentOnFail: boolean;  // Mostrar contenido incluso si falla
    bypassOnSuccess: boolean;    // Saltar contenido si aprueba
    motivationalMessageOnFail?: string;
    congratsMessageOnPass?: string;
  };

  // Comportamiento Post-Quiz específico
  postQuizBehavior?: {
    requirePassToComplete: boolean;  // Requiere aprobar para completar lección
    unlockNextOnPass: boolean;       // Desbloquea siguiente lección al aprobar
    retryMessageOnFail?: string;
  };
}

// --- Schema Principal ---
@Schema({ timestamps: true })
export class Quiz {
  _id: Types.ObjectId;

  // --- 📝 Información Básica ---
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: String, default: '' })
  instructions: string;          // Instrucciones antes de comenzar

  // --- 🏷️ Tipo y Estado ---
  @Prop({
    type: String,
    enum: QuizType,
    required: true,
  })
  type: QuizType;

  @Prop({
    type: String,
    enum: QuizStatus,
    default: QuizStatus.DRAFT,
  })
  status: QuizStatus;

  // --- 🔗 Relación con Lección (opcional) ---
  // Un quiz puede estar asociado a una lección o ser independiente
  @Prop({ type: Types.ObjectId, ref: 'Lesson', default: null, index: true })
  lessonId: Types.ObjectId | null;

  // --- 🔗 Relación con Tema (para quizzes de tema) ---
  @Prop({ type: Types.ObjectId, ref: 'Theme', default: null, index: true })
  themeId: Types.ObjectId | null;

  // --- 🔗 Relación con Curso (para exámenes finales) ---
  @Prop({ type: Types.ObjectId, ref: 'Course', default: null, index: true })
  courseId: Types.ObjectId | null;

  // --- ❓ Preguntas ---
  @Prop({
    type: [{
      id: { type: String, required: true },
      type: { type: String, enum: QuestionType, required: true },
      question: { type: String, required: true },
      explanation: { type: String, default: null },
      imageUrl: { type: String, default: null },
      videoUrl: { type: String, default: null },

      options: {
        type: [{
          id: { type: String, required: true },
          text: { type: String, required: true },
          isCorrect: { type: Boolean, required: true },
          feedback: { type: String, default: null },
          imageUrl: { type: String, default: null },
        }],
        default: [],
      },

      correctAnswers: { type: [String], default: [] },
      caseSensitive: { type: Boolean, default: false },

      matchingPairs: {
        type: [{
          id: { type: String, required: true },
          left: { type: String, required: true },
          right: { type: String, required: true },
        }],
        default: [],
      },

      correctOrder: { type: [String], default: [] },
      orderItems: {
        type: [{
          id: { type: String, required: true },
          text: { type: String, required: true },
        }],
        default: [],
      },

      points: { type: Number, default: 1, min: 0 },
      partialCredit: { type: Boolean, default: false },
      difficulty: { type: String, enum: DifficultyLevel, default: DifficultyLevel.MEDIUM },
      tags: { type: [String], default: [] },
      order: { type: Number, required: true },
      isRequired: { type: Boolean, default: true },
    }],
    default: [],
  })
  questions: QuizQuestion[];

  // --- ⚙️ Configuración ---
  @Prop({
    type: {
      timeLimit: { type: Number, default: null },
      showTimer: { type: Boolean, default: true },
      maxAttempts: { type: Number, default: 3 },
      cooldownMinutes: { type: Number, default: 0 },
      passingScore: { type: Number, default: 70, min: 0, max: 100 },
      showScoreImmediately: { type: Boolean, default: true },
      allowSkip: { type: Boolean, default: false },
      allowReview: { type: Boolean, default: true },
      allowBackNavigation: { type: Boolean, default: true },
      showCorrectAnswers: { type: Boolean, default: true },
      showExplanations: { type: Boolean, default: true },
      feedbackTiming: { type: String, default: 'after_submit' },
      shuffleQuestions: { type: Boolean, default: false },
      shuffleOptions: { type: Boolean, default: false },
      preQuizBehavior: {
        type: {
          showContentOnFail: { type: Boolean, default: true },
          bypassOnSuccess: { type: Boolean, default: false },
          motivationalMessageOnFail: { type: String, default: '¡No te preocupes! Hoy aprenderás sobre este tema.' },
          congratsMessageOnPass: { type: String, default: '¡Excelente! Ya tienes conocimientos previos sobre este tema.' },
        },
        default: null,
      },
      postQuizBehavior: {
        type: {
          requirePassToComplete: { type: Boolean, default: true },
          unlockNextOnPass: { type: Boolean, default: true },
          retryMessageOnFail: { type: String, default: 'Necesitas repasar el contenido. ¡Inténtalo de nuevo!' },
        },
        default: null,
      },
    },
    default: {},
    _id: false,
  })
  settings: QuizSettings;

  // --- 📊 Estadísticas (calculadas) ---
  @Prop({ default: 0 })
  totalQuestions: number;

  @Prop({ default: 0 })
  totalPoints: number;           // Suma de puntos de todas las preguntas

  @Prop({ default: 0 })
  averageScore: number;          // Promedio de puntuación de todos los intentos

  @Prop({ default: 0 })
  totalAttempts: number;         // Total de intentos realizados

  @Prop({ default: 0 })
  passRate: number;              // Porcentaje de aprobación

  // --- 🎁 Recompensas ---
  @Prop({ default: 0 })
  tokensReward: number;          // Tokens que se ganan al aprobar

  @Prop({ default: 0 })
  xpReward: number;              // XP que se gana al aprobar

  @Prop({ default: 0 })
  bonusTokensForPerfect: number; // Bonus por puntuación perfecta

  createdAt: Date;
  updatedAt: Date;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

// --- Índices ---
QuizSchema.index({ lessonId: 1, type: 1 });
QuizSchema.index({ themeId: 1 });
QuizSchema.index({ courseId: 1 });
QuizSchema.index({ status: 1 });
QuizSchema.index({ type: 1, status: 1 });

// --- Middleware para calcular totales antes de guardar ---
QuizSchema.pre('save', function (next: () => void) {
  if (this.questions && this.questions.length > 0) {
    this.totalQuestions = this.questions.length;
    this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  }
  next();
});
