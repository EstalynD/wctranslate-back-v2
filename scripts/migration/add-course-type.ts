/**
 * Script de Migración: Agregar courseType a los Course existentes
 *
 * Clasifica los cursos en:
 *   - GENERAL: Cursos sin plataforma específica (platformId === null)
 *   - MODULE: Cursos específicos de una plataforma (platformId !== null)
 *
 * Uso:
 *   pnpm ts-node scripts/migration/add-course-type.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import {
  Course,
  CourseDocument,
  CourseType,
} from '../../src/courses/schemas/course.schema';

async function bootstrap() {
  console.log('🚀 Iniciando migración: Agregar courseType a Courses...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const courseModel = app.get<Model<CourseDocument>>(
      getModelToken(Course.name),
    );

    // Obtener todos los cursos
    const courses = await courseModel.find().exec();
    console.log(`📚 Total de cursos encontrados: ${courses.length}\n`);

    let generalCount = 0;
    let moduleCount = 0;

    for (const course of courses) {
      // Si tiene platformId → MODULE, sino → GENERAL
      const courseType = course.platformId
        ? CourseType.MODULE
        : CourseType.GENERAL;

      await courseModel.updateOne(
        { _id: course._id },
        { $set: { courseType } },
      );

      const label = courseType === CourseType.MODULE ? '🔧 MODULE' : '📗 GENERAL';
      console.log(`  ${label} → ${course.title}`);

      if (courseType === CourseType.MODULE) {
        moduleCount++;
      } else {
        generalCount++;
      }
    }

    console.log('\n✅ Migración completada:');
    console.log(`   📗 GENERAL: ${generalCount} cursos`);
    console.log(`   🔧 MODULE:  ${moduleCount} cursos`);
    console.log(`   📚 Total:   ${courses.length} cursos`);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
