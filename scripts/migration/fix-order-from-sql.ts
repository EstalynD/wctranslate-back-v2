/**
 * Script de Fix: corregir el orden de Themes y Lessons segun el SQL legacy
 *
 * Uso:
 *   pnpm ts-node scripts/migration/fix-order-from-sql.ts
 *   pnpm ts-node scripts/migration/fix-order-from-sql.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../../src/app.module';
import { Course, CourseDocument } from '../../src/courses/schemas/course.schema';
import { Theme, ThemeDocument } from '../../src/courses/schemas/theme.schema';
import { Lesson, LessonDocument } from '../../src/courses/schemas/lesson.schema';

const CONFIG = {
  SQL_FILE: path.join(__dirname, '../../db_Migration/u659030826_GMeRd.sql'),
  DRY_RUN: process.argv.includes('--dry-run'),
};

interface ParsedModule {
  id: number;
  name: string;
}

interface ParsedTheme {
  id: number;
  module_id: number;
  name: string;
  order_position: number;
}

interface ParsedTask {
  id: number;
  theme_id: number;
  name: string;
  order_position: number;
}

interface LegacyData {
  modules: ParsedModule[];
  themes: ParsedTheme[];
  tasks: ParsedTask[];
}

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

function parseModules(sql: string): ParsedModule[] {
  const rows = extractInsertValues(sql, 'wp_training_wc_modules');
  return rows.map((row) => ({
    id: parseInt(cleanValue(row[0])) || 0,
    name: cleanValue(row[1]),
  }));
}

function parseThemes(sql: string): ParsedTheme[] {
  const rows = extractInsertValues(sql, 'wp_training_wc_themes');
  return rows.map((row) => ({
    id: parseInt(cleanValue(row[0])) || 0,
    module_id: parseInt(cleanValue(row[1])) || 0,
    name: cleanValue(row[2]),
    order_position: parseInt(cleanValue(row[4])) || 0,
  }));
}

function parseTasks(sql: string): ParsedTask[] {
  const rows = extractInsertValues(sql, 'wp_training_wc_tasks');
  return rows.map((row) => ({
    id: parseInt(cleanValue(row[0])) || 0,
    theme_id: parseInt(cleanValue(row[1])) || 0,
    name: cleanValue(row[2]),
    order_position: parseInt(cleanValue(row[6])) || 0,
  }));
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
  console.log('Fix de orden desde SQL legacy\n');

  if (CONFIG.DRY_RUN) {
    console.log('Modo DRY_RUN activo. No se guardaran cambios.\n');
  }

  if (!fs.existsSync(CONFIG.SQL_FILE)) {
    console.error(`Archivo SQL no encontrado: ${CONFIG.SQL_FILE}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(CONFIG.SQL_FILE, 'utf-8');

  const legacyData: LegacyData = {
    modules: parseModules(sqlContent),
    themes: parseThemes(sqlContent),
    tasks: parseTasks(sqlContent),
  };

  const moduleNameById = new Map<number, string>(
    legacyData.modules.map((m) => [m.id, m.name]),
  );

  const app = await NestFactory.createApplicationContext(AppModule);
  const courseModel = app.get<Model<CourseDocument>>(getModelToken(Course.name));
  const themeModel = app.get<Model<ThemeDocument>>(getModelToken(Theme.name));
  const lessonModel = app.get<Model<LessonDocument>>(getModelToken(Lesson.name));

  try {
    const courses = await courseModel.find({}, { _id: 1, title: 1 }).exec();
    const courseByTitle = new Map<string, Types.ObjectId>();

    courses.forEach((course) => {
      courseByTitle.set(normalizeKey(course.title), course._id);
    });

    const themeIdByLegacyId = new Map<number, Types.ObjectId>();
    const themesByCourse = new Map<string, Array<{ themeId: Types.ObjectId; order: number; legacyId: number }>>();

    for (const legacyTheme of legacyData.themes) {
      const moduleName = moduleNameById.get(legacyTheme.module_id);
      if (!moduleName) {
        console.warn(`Theme ${legacyTheme.id}: modulo ${legacyTheme.module_id} no encontrado`);
        continue;
      }

      const courseId = courseByTitle.get(normalizeKey(moduleName));
      if (!courseId) {
        console.warn(`Theme ${legacyTheme.id}: curso "${moduleName}" no encontrado`);
        continue;
      }

      const themeDoc = await themeModel.findOne(
        {
          courseId,
          title: { $regex: new RegExp(`^${escapeRegex(legacyTheme.name)}$`, 'i') },
        },
        { _id: 1, order: 1 },
      );

      if (!themeDoc) {
        console.warn(`Theme ${legacyTheme.id}: "${legacyTheme.name}" no encontrado en MongoDB`);
        continue;
      }

      themeIdByLegacyId.set(legacyTheme.id, themeDoc._id);

      if (!themesByCourse.has(courseId.toString())) {
        themesByCourse.set(courseId.toString(), []);
      }

      themesByCourse.get(courseId.toString())!.push({
        themeId: themeDoc._id,
        order: legacyTheme.order_position,
        legacyId: legacyTheme.id,
      });

      if (!CONFIG.DRY_RUN) {
        await themeModel.updateOne(
          { _id: themeDoc._id },
          { $set: { order: legacyTheme.order_position } },
        );
      }
    }

    for (const [courseId, themes] of themesByCourse) {
      const orderedThemes = themes
        .sort((a, b) => a.order - b.order || a.legacyId - b.legacyId)
        .map((item) => item.themeId);

      if (!CONFIG.DRY_RUN) {
        await courseModel.updateOne(
          { _id: new Types.ObjectId(courseId) },
          { $set: { themes: orderedThemes } },
        );
      }
    }

    const lessonsByTheme = new Map<string, Array<{ lessonId: Types.ObjectId; order: number; legacyId: number }>>();
    let lessonUpdated = 0;

    for (const legacyTask of legacyData.tasks) {
      const themeId = themeIdByLegacyId.get(legacyTask.theme_id);
      if (!themeId) {
        console.warn(`Task ${legacyTask.id}: theme ${legacyTask.theme_id} no mapeado`);
        continue;
      }

      const lessonDoc = await lessonModel.findOne(
        {
          themeId,
          title: { $regex: new RegExp(`^${escapeRegex(legacyTask.name)}$`, 'i') },
        },
        { _id: 1, order: 1 },
      );

      if (!lessonDoc) {
        console.warn(`Task ${legacyTask.id}: "${legacyTask.name}" no encontrado en MongoDB`);
        continue;
      }

      if (!lessonsByTheme.has(themeId.toString())) {
        lessonsByTheme.set(themeId.toString(), []);
      }

      lessonsByTheme.get(themeId.toString())!.push({
        lessonId: lessonDoc._id,
        order: legacyTask.order_position,
        legacyId: legacyTask.id,
      });

      if (!CONFIG.DRY_RUN) {
        await lessonModel.updateOne(
          { _id: lessonDoc._id },
          { $set: { order: legacyTask.order_position } },
        );
      }

      lessonUpdated++;
    }

    for (const [themeId, lessons] of lessonsByTheme) {
      const orderedLessons = lessons
        .sort((a, b) => a.order - b.order || a.legacyId - b.legacyId)
        .map((item) => item.lessonId);

      if (!CONFIG.DRY_RUN) {
        await themeModel.updateOne(
          { _id: new Types.ObjectId(themeId) },
          { $set: { lessons: orderedLessons } },
        );
      }
    }

    console.log('Orden actualizado.');
    console.log(`Themes mapeados: ${themesByCourse.size}`);
    console.log(`Lessons actualizadas: ${lessonUpdated}`);
  } catch (error) {
    console.error('Error durante el fix:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

main();
