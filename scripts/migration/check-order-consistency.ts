/**
 * Script de diagnostico: comparar orden y relaciones SQL legacy vs MongoDB
 *
 * Uso:
 *   pnpm ts-node scripts/migration/check-order-consistency.ts
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

function buildKey(a: Types.ObjectId, b: string): string {
  return `${a.toString()}::${b}`;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

async function main() {
  console.log('Diagnostico SQL vs Mongo\n');

  if (!fs.existsSync(CONFIG.SQL_FILE)) {
    console.error(`Archivo SQL no encontrado: ${CONFIG.SQL_FILE}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(CONFIG.SQL_FILE, 'utf-8');
  const modules = parseModules(sqlContent);
  const themes = parseThemes(sqlContent);
  const tasks = parseTasks(sqlContent);

  const moduleNameById = new Map<number, string>(modules.map((m) => [m.id, m.name]));

  const app = await NestFactory.createApplicationContext(AppModule);
  const courseModel = app.get<Model<CourseDocument>>(getModelToken(Course.name));
  const themeModel = app.get<Model<ThemeDocument>>(getModelToken(Theme.name));
  const lessonModel = app.get<Model<LessonDocument>>(getModelToken(Lesson.name));

  try {
    const [courses, themeDocs, lessonDocs] = await Promise.all([
      courseModel.find({}, { _id: 1, title: 1, themes: 1 }).exec(),
      themeModel.find({}, { _id: 1, title: 1, courseId: 1, order: 1, lessons: 1 }).exec(),
      lessonModel.find({}, { _id: 1, title: 1, themeId: 1, order: 1 }).exec(),
    ]);

    const courseByTitle = new Map<string, Types.ObjectId>();
    courses.forEach((course) => {
      courseByTitle.set(normalizeKey(course.title), course._id);
    });

    const themeByCourseAndTitle = new Map<string, ThemeDocument>();
    themeDocs.forEach((theme) => {
      themeByCourseAndTitle.set(buildKey(theme.courseId, normalizeKey(theme.title)), theme);
    });

    const lessonByThemeAndTitle = new Map<string, LessonDocument>();
    lessonDocs.forEach((lesson) => {
      lessonByThemeAndTitle.set(buildKey(lesson.themeId, normalizeKey(lesson.title)), lesson);
    });

    const missingModuleIds: number[] = [];
    const missingCourses: Array<{ themeId: number; moduleId: number; moduleName?: string }> = [];
    const missingThemes: Array<{ themeId: number; themeName: string; moduleName: string }> = [];
    const themeOrderMismatch: Array<{ themeId: number; themeName: string; expected: number; actual: number }> = [];

    const themeIdByLegacyId = new Map<number, Types.ObjectId>();

    themes.forEach((legacyTheme) => {
      const moduleName = moduleNameById.get(legacyTheme.module_id);
      if (!moduleName) {
        missingModuleIds.push(legacyTheme.module_id);
        return;
      }

      const courseId = courseByTitle.get(normalizeKey(moduleName));
      if (!courseId) {
        missingCourses.push({
          themeId: legacyTheme.id,
          moduleId: legacyTheme.module_id,
          moduleName,
        });
        return;
      }

      const themeDoc = themeByCourseAndTitle.get(
        buildKey(courseId, normalizeKey(legacyTheme.name)),
      );

      if (!themeDoc) {
        missingThemes.push({
          themeId: legacyTheme.id,
          themeName: legacyTheme.name,
          moduleName,
        });
        return;
      }

      themeIdByLegacyId.set(legacyTheme.id, themeDoc._id);

      if ((themeDoc.order || 0) !== legacyTheme.order_position) {
        themeOrderMismatch.push({
          themeId: legacyTheme.id,
          themeName: legacyTheme.name,
          expected: legacyTheme.order_position,
          actual: themeDoc.order || 0,
        });
      }
    });

    const missingLessons: Array<{ taskId: number; taskName: string; themeId: number }> = [];
    const lessonOrderMismatch: Array<{ taskId: number; taskName: string; expected: number; actual: number }> = [];
    const missingThemeForTask: Array<{ taskId: number; taskName: string; themeId: number }> = [];

    tasks.forEach((legacyTask) => {
      const themeId = themeIdByLegacyId.get(legacyTask.theme_id);
      if (!themeId) {
        missingThemeForTask.push({
          taskId: legacyTask.id,
          taskName: legacyTask.name,
          themeId: legacyTask.theme_id,
        });
        return;
      }

      const lessonDoc = lessonByThemeAndTitle.get(
        buildKey(themeId, normalizeKey(legacyTask.name)),
      );

      if (!lessonDoc) {
        missingLessons.push({
          taskId: legacyTask.id,
          taskName: legacyTask.name,
          themeId: legacyTask.theme_id,
        });
        return;
      }

      if ((lessonDoc.order || 0) !== legacyTask.order_position) {
        lessonOrderMismatch.push({
          taskId: legacyTask.id,
          taskName: legacyTask.name,
          expected: legacyTask.order_position,
          actual: lessonDoc.order || 0,
        });
      }
    });

    const courseThemesMismatch: Array<{ courseId: string; courseTitle: string; reason: string }> = [];

    courses.forEach((course) => {
      const themesForCourse = themeDocs
        .filter((theme) => theme.courseId.toString() === course._id.toString())
        .sort((a, b) => (a.order || 0) - (b.order || 0) || a._id.toString().localeCompare(b._id.toString()))
        .map((theme) => theme._id.toString());

      const stored = (course.themes || []).map((id) => id.toString());

      if (!arraysEqual(stored, themesForCourse)) {
        courseThemesMismatch.push({
          courseId: course._id.toString(),
          courseTitle: course.title,
          reason: 'Array themes desalineado con order de themes',
        });
      }
    });

    const themeLessonsMismatch: Array<{ themeId: string; themeTitle: string; reason: string }> = [];

    themeDocs.forEach((theme) => {
      const lessonsForTheme = lessonDocs
        .filter((lesson) => lesson.themeId.toString() === theme._id.toString())
        .sort((a, b) => (a.order || 0) - (b.order || 0) || a._id.toString().localeCompare(b._id.toString()))
        .map((lesson) => lesson._id.toString());

      const stored = (theme.lessons || []).map((id) => id.toString());

      if (!arraysEqual(stored, lessonsForTheme)) {
        themeLessonsMismatch.push({
          themeId: theme._id.toString(),
          themeTitle: theme.title,
          reason: 'Array lessons desalineado con order de lessons',
        });
      }
    });

    console.log('Resumen:');
    console.log(`- Modulos legacy: ${modules.length}`);
    console.log(`- Themes legacy: ${themes.length}`);
    console.log(`- Tasks legacy: ${tasks.length}`);
    console.log('');
    console.log(`- Module IDs faltantes en SQL: ${new Set(missingModuleIds).size}`);
    console.log(`- Themes sin curso padre en Mongo: ${missingCourses.length}`);
    console.log(`- Themes no encontrados en Mongo: ${missingThemes.length}`);
    console.log(`- Themes con order distinto: ${themeOrderMismatch.length}`);
    console.log(`- Tasks con theme no mapeado: ${missingThemeForTask.length}`);
    console.log(`- Lessons no encontradas en Mongo: ${missingLessons.length}`);
    console.log(`- Lessons con order distinto: ${lessonOrderMismatch.length}`);
    console.log(`- Courses con array themes desalineado: ${courseThemesMismatch.length}`);
    console.log(`- Themes con array lessons desalineado: ${themeLessonsMismatch.length}`);

    if (missingCourses.length > 0) {
      console.log('\nEjemplos de themes sin curso padre:');
      missingCourses.slice(0, 5).forEach((item) => {
        console.log(`- Theme ${item.themeId} -> module ${item.moduleId} (${item.moduleName})`);
      });
    }

    if (missingThemes.length > 0) {
      console.log('\nEjemplos de themes no encontrados en Mongo:');
      missingThemes.slice(0, 5).forEach((item) => {
        console.log(`- Theme ${item.themeId} "${item.themeName}" (curso ${item.moduleName})`);
      });
    }

    if (themeOrderMismatch.length > 0) {
      console.log('\nEjemplos de themes con order distinto:');
      themeOrderMismatch.slice(0, 5).forEach((item) => {
        console.log(`- Theme ${item.themeId} "${item.themeName}" SQL=${item.expected} Mongo=${item.actual}`);
      });
    }

    if (missingLessons.length > 0) {
      console.log('\nEjemplos de lessons no encontradas en Mongo:');
      missingLessons.slice(0, 5).forEach((item) => {
        console.log(`- Task ${item.taskId} "${item.taskName}" (theme ${item.themeId})`);
      });
    }

    if (lessonOrderMismatch.length > 0) {
      console.log('\nEjemplos de lessons con order distinto:');
      lessonOrderMismatch.slice(0, 5).forEach((item) => {
        console.log(`- Task ${item.taskId} "${item.taskName}" SQL=${item.expected} Mongo=${item.actual}`);
      });
    }

    if (courseThemesMismatch.length > 0) {
      console.log('\nEjemplos de courses con array themes desalineado:');
      courseThemesMismatch.slice(0, 5).forEach((item) => {
        console.log(`- Course ${item.courseTitle} (${item.courseId})`);
      });
    }

    if (themeLessonsMismatch.length > 0) {
      console.log('\nEjemplos de themes con array lessons desalineado:');
      themeLessonsMismatch.slice(0, 5).forEach((item) => {
        console.log(`- Theme ${item.themeTitle} (${item.themeId})`);
      });
    }
  } catch (error) {
    console.error('Error durante el diagnostico:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

main();
