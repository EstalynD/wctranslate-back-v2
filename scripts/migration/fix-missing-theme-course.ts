/**
 * Fix: reasignar un theme a su curso correcto cuando el module_id legacy no existe.
 *
 * Uso:
 *   pnpm ts-node scripts/migration/fix-missing-theme-course.ts
 */

import { NestFactory } from '@nestjs/core';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../../src/app.module';
import { Course, CourseDocument } from '../../src/courses/schemas/course.schema';
import { Theme, ThemeDocument } from '../../src/courses/schemas/theme.schema';

const CONFIG = {
  THEME_TITLE: 'Psicologia usuario',
  COURSE_TITLE: 'Psicología Webcam',
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function syncCourseThemesOrder(
  courseModel: Model<CourseDocument>,
  themeModel: Model<ThemeDocument>,
  courseId: Types.ObjectId,
): Promise<void> {
  const themes = await themeModel
    .find({ courseId }, { _id: 1, order: 1 })
    .sort({ order: 1, _id: 1 })
    .exec();

  await courseModel.updateOne(
    { _id: courseId },
    { $set: { themes: themes.map((t) => t._id) } },
  );
}

async function main() {
  console.log('Fix: reasignar theme a curso correcto\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const courseModel = app.get<Model<CourseDocument>>(getModelToken(Course.name));
  const themeModel = app.get<Model<ThemeDocument>>(getModelToken(Theme.name));

  try {
    const theme = await themeModel.findOne(
      { title: { $regex: new RegExp(`^${escapeRegex(CONFIG.THEME_TITLE)}$`, 'i') } },
      { _id: 1, title: 1, courseId: 1, order: 1 },
    );

    if (!theme) {
      console.log(`Theme no encontrado: ${CONFIG.THEME_TITLE}`);
      return;
    }

    const course = await courseModel.findOne(
      { title: { $regex: new RegExp(`^${escapeRegex(CONFIG.COURSE_TITLE)}$`, 'i') } },
      { _id: 1, title: 1 },
    );

    if (!course) {
      console.log(`Curso no encontrado: ${CONFIG.COURSE_TITLE}`);
      return;
    }

    const currentCourseId = theme.courseId ? theme.courseId.toString() : null;
    const targetCourseId = course._id.toString();

    if (currentCourseId === targetCourseId) {
      console.log('El theme ya esta asignado al curso correcto.');
      return;
    }

    await themeModel.updateOne(
      { _id: theme._id },
      { $set: { courseId: course._id } },
    );

    await courseModel.updateOne(
      { _id: course._id },
      { $addToSet: { themes: theme._id } },
    );

    if (currentCourseId) {
      await courseModel.updateOne(
        { _id: new Types.ObjectId(currentCourseId) },
        { $pull: { themes: theme._id } },
      );
      await syncCourseThemesOrder(
        courseModel,
        themeModel,
        new Types.ObjectId(currentCourseId),
      );
    }

    await syncCourseThemesOrder(courseModel, themeModel, course._id);

    console.log(`Theme "${theme.title}" reasignado a "${course.title}".`);
  } catch (error) {
    console.error('Error en el fix:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

main();
