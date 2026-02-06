/**
 * Script: Migrar Quiz Questions del SQL legacy a MongoDB
 *
 * Los quiz_questions están en u659030826_GMeRd.sql pero el parser original
 * solo leyó u280021736_gDPoM.sql (que tiene la estructura pero no los datos).
 *
 * Este script:
 * 1. Parsea quiz_questions de u659030826_GMeRd.sql
 * 2. Parsea tasks de u280021736_gDPoM.sql para mapear task_id → nombre
 * 3. Busca lessons en MongoDB por título para obtener ObjectId
 * 4. Agrupa preguntas por (task_id, quiz_position)
 * 5. Crea documentos Quiz en MongoDB
 *
 * Uso:
 *   cd wctraining-back
 *   pnpm ts-node scripts/migration/migrate-quizzes.ts
 *   pnpm ts-node scripts/migration/migrate-quizzes.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../../src/app.module';
import {
  Quiz,
  QuizDocument,
  QuizType,
  QuizStatus,
  QuestionType,
  DifficultyLevel,
} from '../../src/quiz/schemas/quiz.schema';
import { Lesson, LessonDocument } from '../../src/courses/schemas/lesson.schema';

// ==================== CONFIGURACIÓN ====================

const CONFIG = {
  // Archivo SQL con datos de quiz_questions
  QUIZ_SQL: path.join(__dirname, '../../db_Migration/u659030826_GMeRd.sql'),
  // Archivo SQL con datos de tasks (para mapear task_id → nombre)
  TASKS_SQL: path.join(__dirname, '../../db_Migration/u280021736_gDPoM.sql'),
  // Modo simulación
  DRY_RUN: process.argv.includes('--dry-run'),
  // Limpiar quizzes existentes antes de migrar
  CLEAN_BEFORE: process.argv.includes('--clean'),
};

// ==================== INTERFACES ====================

interface ParsedQuizQuestion {
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

interface ParsedTask {
  id: number;
  name: string;
}

// ==================== SQL PARSER ====================

/**
 * Extrae los VALUES de INSERT statements para una tabla específica.
 * Maneja comillas escapadas y paréntesis anidados.
 */
function extractInsertValues(sql: string, tableName: string): string[][] {
  const allRows: string[][] = [];

  const tablePattern = new RegExp(
    `INSERT INTO \`?${tableName}\`?\\s*\\([^)]+\\)\\s*VALUES\\s*`,
    'gi',
  );

  let match;
  const regex = new RegExp(tablePattern.source, 'gi');

  while ((match = regex.exec(sql)) !== null) {
    const valuesStart = match.index + match[0].length;

    let depth = 0;
    let inString = false;
    let stringChar = '';
    let currentValue = '';
    let currentRow: string[] = [];

    for (let i = valuesStart; i < sql.length; i++) {
      const char = sql[i];
      const prevChar = i > 0 ? sql[i - 1] : '';

      // Manejar strings
      if ((char === "'" || char === '"') && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          if (sql[i + 1] === char) {
            currentValue += char;
            i++;
            continue;
          }
          inString = false;
          stringChar = '';
        }
      }

      if (inString) {
        currentValue += char;
        continue;
      }

      if (char === '(') {
        if (depth === 0) {
          currentRow = [];
          currentValue = '';
        } else {
          currentValue += char;
        }
        depth++;
        continue;
      }

      if (char === ')') {
        depth--;
        if (depth === 0) {
          currentRow.push(currentValue.trim());
          allRows.push(currentRow);
          currentValue = '';
        } else {
          currentValue += char;
        }
        continue;
      }

      if (char === ',' && depth === 1) {
        currentRow.push(currentValue.trim());
        currentValue = '';
        continue;
      }

      if (char === ';' && depth === 0) {
        break;
      }

      if (depth > 0) {
        currentValue += char;
      }
    }
  }

  return allRows;
}

/**
 * Limpia un valor extraído del SQL
 */
function cleanValue(value: string): string {
  if (!value) return '';

  value = value.trim();
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    value = value.slice(1, -1);
  }

  value = value
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');

  if (value.toUpperCase() === 'NULL') {
    return '';
  }

  return value;
}

// ==================== PARSERS ====================

function parseQuizQuestions(sql: string): ParsedQuizQuestion[] {
  const rows = extractInsertValues(sql, 'wp_training_wc_quiz_questions');
  console.log(`  ❓ Encontradas ${rows.length} filas de quiz_questions`);

  return rows.map((row) => ({
    id: parseInt(cleanValue(row[0])) || 0,
    task_id: parseInt(cleanValue(row[1])) || 0,
    question: cleanValue(row[2]),
    options: cleanValue(row[3]),
    correct_answer: cleanValue(row[4]),
    type: cleanValue(row[5]) || 'multiple',
    quiz_position: cleanValue(row[6]) || 'pre',
    order_position: parseInt(cleanValue(row[7])) || 0,
    status: cleanValue(row[8]) || 'active',
  }));
}

function parseTasks(sql: string): ParsedTask[] {
  const rows = extractInsertValues(sql, 'wp_training_wc_tasks');
  console.log(`  📝 Encontradas ${rows.length} filas de tasks`);

  return rows.map((row) => ({
    id: parseInt(cleanValue(row[0])) || 0,
    name: cleanValue(row[2]),
  }));
}

function parseQuizOptions(
  optionsJson: string,
): Array<{ id: string; text: string; isCorrect: boolean }> {
  try {
    const options = JSON.parse(optionsJson);
    if (Array.isArray(options)) {
      return options.map((opt, index) => ({
        id: `opt-${index + 1}`,
        text: typeof opt === 'string' ? opt : opt.text || opt.label || String(opt),
        isCorrect: false,
      }));
    }
    return [];
  } catch {
    // Si no es JSON, intentar como lista separada por comas
    return optionsJson
      .split(',')
      .filter((s) => s.trim())
      .map((opt, index) => ({
        id: `opt-${index + 1}`,
        text: opt.trim(),
        isCorrect: false,
      }));
  }
}

// ==================== MAIN ====================

async function main() {
  console.log('🚀 Migración de Quiz Questions\n');

  if (CONFIG.DRY_RUN) {
    console.log('⚠️  MODO DRY_RUN - No se guardarán cambios\n');
  }

  // Verificar archivos SQL
  if (!fs.existsSync(CONFIG.QUIZ_SQL)) {
    console.error(`❌ Archivo SQL de quizzes no encontrado: ${CONFIG.QUIZ_SQL}`);
    process.exit(1);
  }
  if (!fs.existsSync(CONFIG.TASKS_SQL)) {
    console.error(`❌ Archivo SQL de tasks no encontrado: ${CONFIG.TASKS_SQL}`);
    process.exit(1);
  }

  // Leer y parsear SQL
  console.log('📂 Leyendo archivos SQL...');
  const quizSql = fs.readFileSync(CONFIG.QUIZ_SQL, 'utf-8');
  const tasksSql = fs.readFileSync(CONFIG.TASKS_SQL, 'utf-8');

  console.log('\n🔍 Parseando datos...');
  const quizQuestions = parseQuizQuestions(quizSql);
  const tasks = parseTasks(tasksSql);

  if (quizQuestions.length === 0) {
    console.log('❌ No se encontraron quiz_questions en el SQL');
    process.exit(1);
  }

  // Crear mapa task_id → nombre
  const taskNameMap = new Map<number, string>();
  for (const task of tasks) {
    taskNameMap.set(task.id, task.name);
  }

  console.log(`\n📊 Datos parseados:`);
  console.log(`  - Quiz questions: ${quizQuestions.length}`);
  console.log(`  - Tasks (para mapeo): ${tasks.length}`);

  // Obtener task_ids únicos de las preguntas
  const uniqueTaskIds = new Set(quizQuestions.map((q) => q.task_id));
  console.log(`  - Tasks con quiz: ${uniqueTaskIds.size}`);

  // Iniciar NestJS para acceder a MongoDB
  console.log('\n🔌 Conectando a MongoDB...');
  const app = await NestFactory.createApplicationContext(AppModule);

  const quizModel = app.get<Model<QuizDocument>>(getModelToken(Quiz.name));
  const lessonModel = app.get<Model<LessonDocument>>(getModelToken(Lesson.name));

  try {
    // Verificar quizzes existentes
    const existingCount = await quizModel.countDocuments();
    console.log(`  📊 Quizzes existentes en MongoDB: ${existingCount}`);

    if (existingCount > 0 && CONFIG.CLEAN_BEFORE && !CONFIG.DRY_RUN) {
      console.log('  🗑️  Limpiando quizzes existentes...');
      await quizModel.deleteMany({});
      console.log('  ✅ Quizzes eliminados');
    } else if (existingCount > 0 && !CONFIG.CLEAN_BEFORE) {
      console.log('  ⚠️  Ya existen quizzes. Usa --clean para limpiar primero.');
      console.log('  ℹ️  Continuando sin limpiar (se crearán duplicados si ya existen)...');
    }

    // Construir mapeo task_id → lessonId buscando por título
    console.log('\n🔗 Mapeando tasks → lessons por título...');
    const taskToLessonMap = new Map<number, Types.ObjectId>();
    let mapSuccess = 0;
    let mapFailed = 0;

    for (const taskId of uniqueTaskIds) {
      const taskName = taskNameMap.get(taskId);
      if (!taskName) {
        console.warn(`  ⚠️  Task ID ${taskId}: sin nombre en el SQL`);
        mapFailed++;
        continue;
      }

      // Buscar lesson por título exacto (case-insensitive)
      const lesson = await lessonModel.findOne(
        { title: { $regex: new RegExp(`^${escapeRegex(taskName)}$`, 'i') } },
        { _id: 1, title: 1 },
      );

      if (lesson) {
        taskToLessonMap.set(taskId, lesson._id);
        mapSuccess++;
      } else {
        console.warn(`  ⚠️  Task ID ${taskId} "${taskName}": no encontrado en MongoDB`);
        mapFailed++;
      }
    }

    console.log(`  ✅ Mapeados: ${mapSuccess}/${uniqueTaskIds.size} (${mapFailed} sin mapear)`);

    // Agrupar preguntas por (task_id, quiz_position)
    console.log('\n❓ Creando quizzes...');
    const quizGroups = new Map<string, ParsedQuizQuestion[]>();

    for (const question of quizQuestions) {
      const key = `${question.task_id}-${question.quiz_position}`;
      if (!quizGroups.has(key)) {
        quizGroups.set(key, []);
      }
      quizGroups.get(key)!.push(question);
    }

    console.log(`  📦 Grupos de quiz: ${quizGroups.size}`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const [key, questions] of quizGroups) {
      const [taskIdStr, quizPosition] = key.split('-');
      const taskId = parseInt(taskIdStr);
      const lessonId = taskToLessonMap.get(taskId);

      if (!lessonId) {
        const taskName = taskNameMap.get(taskId) || 'desconocido';
        console.warn(
          `  ⏭️  Saltando quiz para task ${taskId} "${taskName}" (${quizPosition}): sin lesson`,
        );
        skippedCount++;
        continue;
      }

      const quizType =
        quizPosition === 'pre' ? QuizType.PRE_QUIZ : QuizType.POST_QUIZ;
      const firstQuestion = questions[0];
      const taskName = taskNameMap.get(taskId) || `Task ${taskId}`;

      // Procesar preguntas
      const quizQuestions = questions
        .sort((a, b) => a.order_position - b.order_position)
        .map((q, index) => {
          const options = parseQuizOptions(q.options);

          // Marcar respuesta correcta
          options.forEach((opt) => {
            if (opt.text.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()) {
              opt.isCorrect = true;
            }
          });

          // Si ninguna quedó correcta, buscar coincidencia parcial
          if (!options.some((o) => o.isCorrect) && options.length > 0) {
            const correctIndex = options.findIndex(
              (o) =>
                o.text.toLowerCase().includes(q.correct_answer.toLowerCase()) ||
                q.correct_answer.toLowerCase().includes(o.text.toLowerCase()),
            );
            if (correctIndex >= 0) {
              options[correctIndex].isCorrect = true;
            } else {
              // Última opción: marcar la primera como correcta y advertir
              options[0].isCorrect = true;
              console.warn(
                `  ⚠️  Pregunta "${q.question.substring(0, 50)}..." respuesta "${q.correct_answer}" no coincide con opciones`,
              );
            }
          }

          return {
            id: `q-${taskId}-${quizPosition}-${index + 1}`,
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
        title: `Quiz ${quizType === QuizType.PRE_QUIZ ? 'de Entrada' : 'de Evaluación'} - ${taskName}`,
        description: '',
        instructions:
          quizType === QuizType.PRE_QUIZ
            ? 'Responde las siguientes preguntas para evaluar tus conocimientos previos.'
            : 'Responde las siguientes preguntas para completar la lección.',
        type: quizType,
        status:
          firstQuestion.status === 'active'
            ? QuizStatus.PUBLISHED
            : QuizStatus.DRAFT,
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
          preQuizBehavior:
            quizType === QuizType.PRE_QUIZ
              ? {
                  showContentOnFail: true,
                  bypassOnSuccess: false,
                  motivationalMessageOnFail:
                    '¡No te preocupes! Hoy aprenderás sobre este tema.',
                  congratsMessageOnPass:
                    '¡Excelente! Ya tienes conocimientos previos sobre este tema.',
                }
              : null,
          postQuizBehavior:
            quizType === QuizType.POST_QUIZ
              ? {
                  requirePassToComplete: true,
                  unlockNextOnPass: true,
                  retryMessageOnFail:
                    'Necesitas repasar el contenido. ¡Inténtalo de nuevo!',
                }
              : null,
        },
        tokensReward: 0,
        xpReward: 10,
        bonusTokensForPerfect: 0,
      };

      // Calcular totales manualmente (evita el middleware pre-save que falla fuera de NestJS)
      const totalQuestions = quizQuestions.length;
      const totalPoints = quizQuestions.reduce(
        (sum, q) => sum + (q.points || 1),
        0,
      );

      if (CONFIG.DRY_RUN) {
        console.log(
          `  [DRY] Quiz: "${quizData.title}" (${totalQuestions} preguntas)`,
        );
      } else {
        await quizModel.collection.insertOne({
          ...quizData,
          totalQuestions,
          totalPoints,
          averageScore: 0,
          totalAttempts: 0,
          passRate: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(
          `  ✅ Quiz: "${quizData.title}" (${totalQuestions} preguntas)`,
        );
      }

      createdCount++;
    }

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📈 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`  Total quiz groups:    ${quizGroups.size}`);
    console.log(`  Quizzes creados:      ${createdCount}`);
    console.log(`  Quizzes saltados:     ${skippedCount}`);
    console.log(`  Preguntas totales:    ${quizQuestions.length}`);
    console.log(`  Tasks mapeados:       ${mapSuccess}/${uniqueTaskIds.size}`);

    if (CONFIG.DRY_RUN) {
      console.log('\n⚠️  Modo DRY_RUN - No se guardaron cambios');
      console.log('  Ejecuta sin --dry-run para guardar los quizzes');
    }

    // Verificación final
    if (!CONFIG.DRY_RUN) {
      const finalCount = await quizModel.countDocuments();
      console.log(`\n  📊 Total quizzes en MongoDB: ${finalCount}`);
    }

    console.log('\n✅ Migración completada!');
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    throw error;
  } finally {
    await app.close();
  }
}

/**
 * Escapa caracteres especiales de regex
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
