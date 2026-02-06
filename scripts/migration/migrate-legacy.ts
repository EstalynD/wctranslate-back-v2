/**
 * Script de Migración: JSON Legacy → NestJS/MongoDB
 *
 * Este script migra usando el JSON generado por sql-to-json.ts:
 * - modules → Course
 * - themes → Theme
 * - tasks → Lesson
 * - quiz_questions → Quiz (si existen)
 *
 * Uso:
 *   1. Primero: pnpm ts-node scripts/migration/sql-to-json.ts
 *   2. Luego:  pnpm ts-node scripts/migration/migrate-legacy.ts
 *
 * Requisitos:
 *   - MongoDB conectado
 *   - Archivo legacy-data.json generado
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as path from 'path';

// Función slugify simple sin dependencias externas
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .substring(0, 100); // Limitar longitud
}

// Importar schemas
import {
  Course,
  CourseDocument,
  CourseStatus,
  CourseCategory,
  CourseLevel,
} from '../../src/courses/schemas/course.schema';
import { Theme, ThemeDocument } from '../../src/courses/schemas/theme.schema';
import {
  Lesson,
  LessonDocument,
  LessonType,
  LessonStatus,
  BlockType,
} from '../../src/courses/schemas/lesson.schema';
import {
  Quiz,
  QuizDocument,
  QuizType,
  QuizStatus,
  QuestionType,
  DifficultyLevel,
} from '../../src/quiz/schemas/quiz.schema';
import { Platform, PlatformDocument } from '../../src/platforms/schemas/platform.schema';

// ==================== CONFIGURACIÓN ====================

const CONFIG = {
  // Thumbnail por defecto para cursos
  DEFAULT_THUMBNAIL:
    'https://res.cloudinary.com/dkzrxuhsc/image/upload/v1770313578/wctraining/courses/ko5jd3iwi8tvsuvtyzze.png',

  // Ruta base de archivos HTML (para referencia en contentBlocks)
  HTML_BASE_URL: '/training-content/',

  // Archivo JSON con datos legacy
  LEGACY_DATA_PATH: path.join(__dirname, './legacy-data.json'),

  // Modo seco (no guarda en DB, solo muestra lo que haría)
  DRY_RUN: false,

  // Limpiar colecciones antes de migrar (CUIDADO en producción)
  CLEAN_BEFORE_MIGRATE: true,
};

// ==================== INTERFACES ====================

interface LegacyModule {
  id: number;
  name: string;
  description: string;
  duration: number;
  tokens: number;
  order_position: number;
  status: string;
  platform_specific: number;
  platform_name: string;
  module_order: number;
}

interface LegacyTheme {
  id: number;
  module_id: number;
  name: string;
  description: string;
  order_position: number;
  status: string;
}

interface LegacyTask {
  id: number;
  theme_id: number;
  name: string;
  description: string;
  content: string;
  token_reward: number;
  order_position: number;
  status: string;
  has_quiz: number;
}

interface LegacyQuizQuestion {
  id: number;
  task_id: number;
  question: string;
  options: string; // JSON string
  correct_answer: string;
  type: string;
  quiz_position: string; // 'pre' | 'post'
  order_position: number;
  status: string;
}

interface LegacyData {
  modules: LegacyModule[];
  themes: LegacyTheme[];
  tasks: LegacyTask[];
  quiz_questions: LegacyQuizQuestion[];
}

interface IdMapping {
  modules: Map<number, Types.ObjectId>;
  themes: Map<number, Types.ObjectId>;
  tasks: Map<number, Types.ObjectId>;
  platforms: Map<string, Types.ObjectId>;
}

// ==================== HELPERS ====================

function generateSlug(text: string, existingSlugs: Set<string>): string {
  let baseSlug = slugify(text);
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  existingSlugs.add(slug);
  return slug;
}

function mapModuleToCategory(module: LegacyModule): CourseCategory {
  const name = module.name.toLowerCase();

  // Módulos específicos de plataforma
  if (module.platform_specific === 1) {
    return CourseCategory.TECHNICAL;
  }

  // Mapeo por nombre
  if (name.includes('psicología') || name.includes('psicolog') || name.includes('fetiche')) {
    return CourseCategory.PSYCHOLOGY;
  }
  if (name.includes('marketing') || name.includes('monetización') || name.includes('fidelización') || name.includes('tendencias')) {
    return CourseCategory.MARKETING;
  }
  if (name.includes('técnico') || name.includes('equipamiento') || name.includes('software')) {
    return CourseCategory.TECHNICAL;
  }
  if (name.includes('legal') || name.includes('seguridad')) {
    return CourseCategory.LEGAL;
  }
  if (name.includes('diseño') || name.includes('room') || name.includes('color') || name.includes('corporal')) {
    return CourseCategory.STYLING;
  }
  if (name.includes('comunicación') || name.includes('multilingü') || name.includes('negociación')) {
    return CourseCategory.COMMUNICATION;
  }
  if (name.includes('emocional') || name.includes('burnout') || name.includes('bienestar')) {
    return CourseCategory.PSYCHOLOGY;
  }

  return CourseCategory.GENERAL;
}

function extractHtmlFilename(content: string): string | null {
  const match = content.match(/\[html_file\](.+?)\[\/html_file\]/);
  return match ? match[1].replace('training-wc-html/', '') : null;
}

/**
 * Procesa el contenido de una task y genera el contentBlock apropiado
 */
function processTaskContent(task: LegacyTask): {
  type: BlockType;
  content?: string;
  iframeSrc?: string;
} {
  const htmlFilename = extractHtmlFilename(task.content);

  if (htmlFilename) {
    // El contenido es una referencia a archivo HTML
    return {
      type: BlockType.IFRAME,
      iframeSrc: `${CONFIG.HTML_BASE_URL}${htmlFilename}`,
    };
  }

  // El contenido es HTML inline
  return {
    type: BlockType.TEXT,
    content: task.content || '',
  };
}

function parseQuizOptions(optionsJson: string): Array<{
  id: string;
  text: string;
  isCorrect: boolean;
}> {
  try {
    const options = JSON.parse(optionsJson);
    if (Array.isArray(options)) {
      return options.map((opt, index) => ({
        id: `opt-${index + 1}`,
        text: typeof opt === 'string' ? opt : opt.text || opt.label || String(opt),
        isCorrect: false, // Se marca después con correct_answer
      }));
    }
    return [];
  } catch {
    // Si no es JSON válido, intentar parsear como lista separada por comas
    return optionsJson.split(',').map((opt, index) => ({
      id: `opt-${index + 1}`,
      text: opt.trim(),
      isCorrect: false,
    }));
  }
}

// ==================== MIGRATION FUNCTIONS ====================

async function migrateModules(
  data: LegacyData,
  courseModel: Model<CourseDocument>,
  idMapping: IdMapping,
  existingSlugs: Set<string>
): Promise<void> {
  console.log('\n📚 Migrando Módulos → Courses...');

  for (const module of data.modules) {
    const slug = generateSlug(module.name, existingSlugs);
    const category = mapModuleToCategory(module);

    // Buscar plataforma si es específico
    let platformId: Types.ObjectId | null = null;
    if (module.platform_specific === 1 && module.platform_name) {
      const platformName = module.platform_name.toLowerCase();
      platformId = idMapping.platforms.get(platformName) || null;
    }

    const courseData = {
      title: module.name,
      slug,
      description: module.description || '',
      thumbnail: CONFIG.DEFAULT_THUMBNAIL,
      category,
      level: CourseLevel.BASIC,
      status: module.status === 'active' ? CourseStatus.PUBLISHED : CourseStatus.DRAFT,
      isFeatured: false,
      allowedPlans: ['PRO', 'ELITE'],
      themes: [],
      platformId,
      totalDurationMinutes: module.duration || 0,
      totalLessons: 0,
      enrolledCount: 0,
      displayOrder: module.order_position || module.module_order || 0,
    };

    if (CONFIG.DRY_RUN) {
      console.log(`  [DRY] Crearía Course: ${module.name} (${category})`);
      idMapping.modules.set(module.id, new Types.ObjectId());
    } else {
      const course = new courseModel(courseData);
      await course.save();
      idMapping.modules.set(module.id, course._id);
      console.log(`  ✅ Course creado: ${module.name} (${category})`);
    }
  }
}

async function migrateThemes(
  data: LegacyData,
  themeModel: Model<ThemeDocument>,
  courseModel: Model<CourseDocument>,
  idMapping: IdMapping,
  existingSlugs: Set<string>
): Promise<void> {
  console.log('\n📑 Migrando Themes...');

  for (const theme of data.themes) {
    const courseId = idMapping.modules.get(theme.module_id);
    if (!courseId) {
      console.warn(`  ⚠️ Module ID ${theme.module_id} no encontrado para theme: ${theme.name}`);
      continue;
    }

    const slug = generateSlug(theme.name, existingSlugs);

    const themeData = {
      title: theme.name,
      slug,
      description: theme.description || '',
      highlightedText: null,
      courseId,
      lessons: [],
      order: theme.order_position || 0,
      totalDurationMinutes: 0,
      totalLessons: 0,
      requiresPreviousCompletion: true,
      unlockThreshold: 100,
    };

    if (CONFIG.DRY_RUN) {
      console.log(`  [DRY] Crearía Theme: ${theme.name}`);
      idMapping.themes.set(theme.id, new Types.ObjectId());
    } else {
      const themeDoc = new themeModel(themeData);
      await themeDoc.save();
      idMapping.themes.set(theme.id, themeDoc._id);

      // Actualizar array de themes en el Course
      await courseModel.findByIdAndUpdate(courseId, {
        $push: { themes: themeDoc._id },
      });

      console.log(`  ✅ Theme creado: ${theme.name}`);
    }
  }
}

async function migrateTasks(
  data: LegacyData,
  lessonModel: Model<LessonDocument>,
  themeModel: Model<ThemeDocument>,
  idMapping: IdMapping,
  existingSlugs: Set<string>
): Promise<void> {
  console.log('\n📝 Migrando Tasks → Lessons...');

  let processedCount = 0;

  for (const task of data.tasks) {
    const themeId = idMapping.themes.get(task.theme_id);
    if (!themeId) {
      console.warn(`  ⚠️ Theme ID ${task.theme_id} no encontrado para task: ${task.name}`);
      continue;
    }

    const slug = generateSlug(task.name, existingSlugs);

    // Procesar contenido HTML
    const contentBlock = processTaskContent(task);

    const lessonData = {
      title: task.name,
      slug,
      description: task.description || '',
      type: LessonType.READING,
      status: task.status === 'active' ? LessonStatus.PUBLISHED : LessonStatus.DRAFT,
      themeId,
      contentBlocks: [
        {
          type: contentBlock.type,
          order: 0,
          content: contentBlock.content || null,
          mediaUrl: null,
          iframeSrc: contentBlock.iframeSrc || null,
          settings: {
            allowFullScreen: true,
            height: '800px',
          },
        },
      ],
      resources: [],
      durationMinutes: 15, // Estimado por defecto
      order: task.order_position || 0,
      requiresPreviousCompletion: true,
      isPreview: false,
      tokensReward: task.token_reward || 0,
    };

    if (CONFIG.DRY_RUN) {
      console.log(`  [DRY] Crearía Lesson: ${task.name}`);
      idMapping.tasks.set(task.id, new Types.ObjectId());
    } else {
      const lesson = new lessonModel(lessonData);
      await lesson.save();
      idMapping.tasks.set(task.id, lesson._id);

      // Actualizar array de lessons en el Theme
      await themeModel.findByIdAndUpdate(themeId, {
        $push: { lessons: lesson._id },
        $inc: { totalLessons: 1 },
      });

      processedCount++;
      if (processedCount % 50 === 0) {
        console.log(`  ✅ Procesadas ${processedCount} lecciones...`);
      }
    }
  }

  console.log(`  ✅ Total de ${processedCount} Lessons creadas`);
}

async function migrateQuizzes(
  data: LegacyData,
  quizModel: Model<QuizDocument>,
  idMapping: IdMapping
): Promise<void> {
  console.log('\n❓ Migrando Quiz Questions → Quizzes...');

  // Agrupar preguntas por task_id y quiz_position
  const quizGroups = new Map<string, LegacyQuizQuestion[]>();

  for (const question of data.quiz_questions) {
    const key = `${question.task_id}-${question.quiz_position}`;
    if (!quizGroups.has(key)) {
      quizGroups.set(key, []);
    }
    quizGroups.get(key)!.push(question);
  }

  let createdCount = 0;

  for (const [key, questions] of quizGroups) {
    const [taskIdStr, quizPosition] = key.split('-');
    const taskId = parseInt(taskIdStr);
    const lessonId = idMapping.tasks.get(taskId);

    if (!lessonId) {
      console.warn(`  ⚠️ Task ID ${taskId} no encontrado para quiz`);
      continue;
    }

    const quizType = quizPosition === 'pre' ? QuizType.PRE_QUIZ : QuizType.POST_QUIZ;
    const firstQuestion = questions[0];

    // Procesar preguntas
    const quizQuestions = questions
      .sort((a, b) => a.order_position - b.order_position)
      .map((q, index) => {
        const options = parseQuizOptions(q.options);

        // Marcar respuesta correcta
        options.forEach((opt) => {
          if (opt.text.toLowerCase() === q.correct_answer.toLowerCase()) {
            opt.isCorrect = true;
          }
        });

        // Si ninguna quedó correcta, marcar la primera que coincida parcialmente
        if (!options.some((o) => o.isCorrect) && options.length > 0) {
          const correctIndex = options.findIndex((o) =>
            o.text.toLowerCase().includes(q.correct_answer.toLowerCase()) ||
            q.correct_answer.toLowerCase().includes(o.text.toLowerCase())
          );
          if (correctIndex >= 0) {
            options[correctIndex].isCorrect = true;
          } else {
            // Última opción: marcar la primera como correcta
            options[0].isCorrect = true;
          }
        }

        return {
          id: `q-${taskId}-${index + 1}`,
          type: QuestionType.MULTIPLE_CHOICE,
          question: q.question,
          explanation: null,
          imageUrl: null,
          videoUrl: null,
          options,
          points: 1,
          partialCredit: false,
          difficulty: DifficultyLevel.MEDIUM,
          tags: [],
          order: index,
          isRequired: true,
        };
      });

    const quizData = {
      title: `Quiz ${quizType === QuizType.PRE_QUIZ ? 'de Entrada' : 'de Evaluación'}`,
      description: '',
      instructions: quizType === QuizType.PRE_QUIZ
        ? 'Responde las siguientes preguntas para evaluar tus conocimientos previos.'
        : 'Responde las siguientes preguntas para completar la lección.',
      type: quizType,
      status: firstQuestion.status === 'active' ? QuizStatus.PUBLISHED : QuizStatus.DRAFT,
      lessonId,
      themeId: null,
      courseId: null,
      questions: quizQuestions,
      settings: {
        timeLimit: null,
        showTimer: false,
        maxAttempts: quizType === QuizType.PRE_QUIZ ? 1 : 3,
        cooldownMinutes: 0,
        passingScore: 70,
        showScoreImmediately: true,
        allowSkip: false,
        allowReview: true,
        allowBackNavigation: true,
        showCorrectAnswers: true,
        showExplanations: true,
        feedbackTiming: 'after_submit',
        shuffleQuestions: false,
        shuffleOptions: false,
        preQuizBehavior: quizType === QuizType.PRE_QUIZ
          ? {
              showContentOnFail: true,
              bypassOnSuccess: false,
              motivationalMessageOnFail: '¡No te preocupes! Hoy aprenderás sobre este tema.',
              congratsMessageOnPass: '¡Excelente! Ya tienes conocimientos previos sobre este tema.',
            }
          : null,
        postQuizBehavior: quizType === QuizType.POST_QUIZ
          ? {
              requirePassToComplete: true,
              unlockNextOnPass: true,
              retryMessageOnFail: 'Necesitas repasar el contenido. ¡Inténtalo de nuevo!',
            }
          : null,
      },
      tokensReward: 0,
      xpReward: 10,
      bonusTokensForPerfect: 0,
    };

    if (CONFIG.DRY_RUN) {
      console.log(`  [DRY] Crearía Quiz: ${quizData.title} (${quizQuestions.length} preguntas)`);
    } else {
      const quiz = new quizModel(quizData);
      await quiz.save();
      createdCount++;
    }
  }

  console.log(`  ✅ Total de ${createdCount} Quizzes creados`);
}

async function loadPlatforms(
  platformModel: Model<PlatformDocument>,
  idMapping: IdMapping
): Promise<void> {
  console.log('\n🎯 Cargando Plataformas existentes...');

  const platforms = await platformModel.find().exec();

  for (const platform of platforms) {
    const key = platform.name.toLowerCase();
    idMapping.platforms.set(key, platform._id as Types.ObjectId);
    console.log(`  ✅ Plataforma cargada: ${platform.name}`);
  }
}

async function updateCourseTotals(
  courseModel: Model<CourseDocument>,
  themeModel: Model<ThemeDocument>
): Promise<void> {
  console.log('\n📊 Actualizando totales de cursos...');

  const courses = await courseModel.find().exec();

  for (const course of courses) {
    const themes = await themeModel.find({ courseId: course._id }).exec();
    const totalLessons = themes.reduce((sum, t) => sum + (t.totalLessons || 0), 0);

    await courseModel.findByIdAndUpdate(course._id, {
      totalLessons,
    });
  }

  console.log('  ✅ Totales actualizados');
}

// ==================== MAIN ====================

async function main() {
  console.log('🚀 Iniciando migración de datos legacy...\n');

  // Verificar archivo de datos
  if (!fs.existsSync(CONFIG.LEGACY_DATA_PATH)) {
    console.error(`❌ Archivo de datos no encontrado: ${CONFIG.LEGACY_DATA_PATH}`);
    console.log('\n📝 Primero ejecuta: pnpm ts-node scripts/migration/sql-to-json.ts');
    process.exit(1);
  }

  // Cargar datos legacy
  const legacyData: LegacyData = JSON.parse(
    fs.readFileSync(CONFIG.LEGACY_DATA_PATH, 'utf-8')
  );

  console.log(`📦 Datos cargados:`);
  console.log(`  - Módulos: ${legacyData.modules.length}`);
  console.log(`  - Temas: ${legacyData.themes.length}`);
  console.log(`  - Tareas: ${legacyData.tasks.length}`);
  console.log(`  - Preguntas: ${legacyData.quiz_questions.length}`);

  if (CONFIG.DRY_RUN) {
    console.log('\n⚠️  MODO DRY_RUN ACTIVO - No se guardarán cambios\n');
  }

  // Iniciar aplicación NestJS
  const app = await NestFactory.createApplicationContext(AppModule);

  // Obtener modelos
  const courseModel = app.get<Model<CourseDocument>>(getModelToken(Course.name));
  const themeModel = app.get<Model<ThemeDocument>>(getModelToken(Theme.name));
  const lessonModel = app.get<Model<LessonDocument>>(getModelToken(Lesson.name));
  const quizModel = app.get<Model<QuizDocument>>(getModelToken(Quiz.name));
  const platformModel = app.get<Model<PlatformDocument>>(getModelToken(Platform.name));

  // Mapeo de IDs
  const idMapping: IdMapping = {
    modules: new Map(),
    themes: new Map(),
    tasks: new Map(),
    platforms: new Map(),
  };

  // Sets para slugs únicos
  const courseSlugs = new Set<string>();
  const themeSlugs = new Set<string>();
  const lessonSlugs = new Set<string>();

  try {
    // Limpiar colecciones si está configurado
    if (CONFIG.CLEAN_BEFORE_MIGRATE && !CONFIG.DRY_RUN) {
      console.log('\n🗑️  Limpiando colecciones existentes...');
      await courseModel.deleteMany({});
      await themeModel.deleteMany({});
      await lessonModel.deleteMany({});
      // No borramos quizzes por si hay datos importantes
      console.log('  ✅ Colecciones limpiadas');
    }

    // 1. Cargar plataformas existentes
    await loadPlatforms(platformModel, idMapping);

    // 2. Migrar módulos → cursos
    await migrateModules(legacyData, courseModel, idMapping, courseSlugs);

    // 3. Migrar temas
    await migrateThemes(legacyData, themeModel, courseModel, idMapping, themeSlugs);

    // 4. Migrar tareas → lecciones
    await migrateTasks(legacyData, lessonModel, themeModel, idMapping, lessonSlugs);

    // 5. Migrar preguntas → quizzes (si hay)
    if (legacyData.quiz_questions.length > 0) {
      await migrateQuizzes(legacyData, quizModel, idMapping);
    } else {
      console.log('\n❓ Sin preguntas de quiz para migrar');
    }

    // 6. Actualizar totales
    if (!CONFIG.DRY_RUN) {
      await updateCourseTotals(courseModel, themeModel);
    }

    console.log('\n✅ Migración completada exitosamente!');
    console.log(`\n📈 Resumen:`);
    console.log(`  - Courses creados: ${idMapping.modules.size}`);
    console.log(`  - Themes creados: ${idMapping.themes.size}`);
    console.log(`  - Lessons creados: ${idMapping.tasks.size}`);
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    throw error;
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
