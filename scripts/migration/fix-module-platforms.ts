/**
 * Script de Fix: Asignar courseType=MODULE y platformId a módulos de plataforma faltantes
 *
 * Algunos módulos de plataforma legados no tenían platformId porque sus plataformas
 * no existían al momento de la migración original. Este script los corrige.
 *
 * Uso:
 *   pnpm ts-node scripts/migration/fix-module-platforms.ts
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
import {
  Platform,
  PlatformDocument,
} from '../../src/platforms/schemas/platform.schema';

// Mapeo de nombres de curso legacy → slug de plataforma en MongoDB
const COURSE_TO_PLATFORM_SLUG: Record<string, string> = {
  'Módulo XLoveCam': 'xlove',
  'Módulo Flirt4Free': 'flirt',
  'Módulo ImLive': 'imlive',
  'Módulo LiveJasmin': 'livejasmin',
  'Módulo Streamate': 'streamate',
  'Módulo Camsoda': 'camsoda',
  'Módulo iFriends': '', // Sin plataforma registrada
  'Módulo DreamCam': '', // Sin plataforma registrada
  'Módulo NudeAudition': '', // Sin plataforma registrada
  'Módulo Sexier': '', // Sin plataforma registrada
  'Módulo PassionSearch': '', // Sin plataforma registrada
};

async function bootstrap() {
  console.log('🔧 Fix: Asignar courseType=MODULE y platformId a módulos faltantes...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const courseModel = app.get<Model<CourseDocument>>(getModelToken(Course.name));
    const platformModel = app.get<Model<PlatformDocument>>(getModelToken(Platform.name));

    // Cargar todas las plataformas para búsqueda rápida
    const platforms = await platformModel.find().exec();
    const platformBySlug = new Map(platforms.map((p) => [p.slug, p._id]));

    console.log(`📋 Plataformas disponibles: ${platforms.map((p) => p.slug).join(', ')}\n`);

    // Buscar cursos que empiezan con "Módulo" y NO tienen platformId
    const moduleCourses = await courseModel.find({
      title: { $regex: /^Módulo\s/i },
      $or: [{ platformId: null }, { platformId: { $exists: false } }],
    }).exec();

    console.log(`📚 Cursos "Módulo" sin platformId: ${moduleCourses.length}\n`);

    let fixedCount = 0;
    let noMatchCount = 0;

    for (const course of moduleCourses) {
      const slugMapping = COURSE_TO_PLATFORM_SLUG[course.title];
      const platformId = slugMapping ? platformBySlug.get(slugMapping) || null : null;

      const updateData: Record<string, unknown> = {
        courseType: CourseType.MODULE,
      };

      if (platformId) {
        updateData.platformId = platformId;
      }

      await courseModel.updateOne({ _id: course._id }, { $set: updateData });

      if (platformId) {
        const platformName = platforms.find((p) => p.slug === slugMapping)?.name;
        console.log(`  ✅ ${course.title} → MODULE + platformId (${platformName})`);
        fixedCount++;
      } else {
        console.log(`  ⚠️  ${course.title} → MODULE (sin plataforma registrada)`);
        noMatchCount++;
      }
    }

    console.log('\n✅ Fix completado:');
    console.log(`   ✅ Con platformId: ${fixedCount}`);
    console.log(`   ⚠️  Sin plataforma: ${noMatchCount}`);
    console.log(`   📚 Total corregidos: ${moduleCourses.length}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
