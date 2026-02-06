/**
 * Script: Actualizar displayOrder de Cursos
 *
 * Actualiza SOLO el campo displayOrder de los cursos existentes
 * basándose en el order_position del JSON legacy.
 *
 * NO borra ni modifica otros datos.
 *
 * Uso:
 *   pnpm ts-node scripts/migration/update-display-order.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as path from 'path';

import { Course, CourseDocument } from '../../src/courses/schemas/course.schema';

// ==================== CONFIGURACIÓN ====================

const CONFIG = {
  // Archivo JSON con datos legacy
  LEGACY_DATA_PATH: path.join(__dirname, './legacy-data.json'),

  // Modo seco (solo muestra cambios sin aplicar)
  DRY_RUN: false,
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

interface LegacyData {
  modules: LegacyModule[];
  themes: any[];
  tasks: any[];
  quiz_questions: any[];
}

// ==================== HELPERS ====================

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

// ==================== MAIN ====================

async function main() {
  console.log('🔄 Actualizando displayOrder de Cursos\n');

  // Cargar datos legacy
  if (!fs.existsSync(CONFIG.LEGACY_DATA_PATH)) {
    console.error(`❌ Archivo no encontrado: ${CONFIG.LEGACY_DATA_PATH}`);
    console.log('   Ejecuta primero: pnpm ts-node scripts/migration/sql-to-json.ts');
    process.exit(1);
  }

  const legacyData: LegacyData = JSON.parse(
    fs.readFileSync(CONFIG.LEGACY_DATA_PATH, 'utf-8')
  );

  console.log(`📂 Cargados ${legacyData.modules.length} módulos del JSON\n`);

  // Inicializar NestJS
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });

  const courseModel = app.get<Model<CourseDocument>>(getModelToken(Course.name));

  // Obtener todos los cursos existentes
  const existingCourses = await courseModel.find({}).exec();
  console.log(`📚 Encontrados ${existingCourses.length} cursos en MongoDB\n`);

  // Crear mapas para búsqueda rápida
  const coursesBySlug = new Map<string, CourseDocument>();
  const coursesByTitle = new Map<string, CourseDocument>();

  for (const course of existingCourses) {
    coursesBySlug.set(course.slug, course);
    coursesByTitle.set(course.title.toLowerCase(), course);
  }

  // Actualizar displayOrder
  let updated = 0;
  let notFound = 0;
  let unchanged = 0;

  console.log('📋 Procesando módulos:\n');
  console.log('ID  | Nombre                                           | order_position | Estado');
  console.log('-'.repeat(90));

  for (const module of legacyData.modules) {
    const moduleSlug = slugify(module.name);
    const moduleTitleLower = module.name.toLowerCase();

    // Buscar curso por slug o por título
    let course = coursesBySlug.get(moduleSlug);
    if (!course) {
      course = coursesByTitle.get(moduleTitleLower);
    }

    const idStr = module.id.toString().padStart(3, ' ');
    const nameStr = module.name.substring(0, 48).padEnd(48, ' ');
    const orderStr = module.order_position.toString().padStart(3, ' ');

    if (!course) {
      console.log(`${idStr} | ${nameStr} | ${orderStr}            | ⚠️ No encontrado`);
      notFound++;
      continue;
    }

    // Verificar si necesita actualización
    if (course.displayOrder === module.order_position) {
      console.log(`${idStr} | ${nameStr} | ${orderStr}            | ✓ Sin cambios`);
      unchanged++;
      continue;
    }

    if (CONFIG.DRY_RUN) {
      console.log(`${idStr} | ${nameStr} | ${orderStr} (era ${course.displayOrder.toString().padStart(3, ' ')}) | [DRY] Actualizaría`);
    } else {
      await courseModel.findByIdAndUpdate(course._id, {
        displayOrder: module.order_position,
      });
      console.log(`${idStr} | ${nameStr} | ${orderStr} (era ${course.displayOrder.toString().padStart(3, ' ')}) | ✅ Actualizado`);
    }
    updated++;
  }

  console.log('\n' + '='.repeat(90));
  console.log('\n📊 Resumen:');
  console.log(`  ✅ Actualizados: ${updated}`);
  console.log(`  ✓ Sin cambios: ${unchanged}`);
  console.log(`  ⚠️ No encontrados: ${notFound}`);

  if (CONFIG.DRY_RUN) {
    console.log('\n💡 Modo DRY_RUN activo. Ningún cambio fue aplicado.');
    console.log('   Para aplicar cambios, cambia DRY_RUN a false en el script.');
  }

  await app.close();
  console.log('\n✨ Proceso completado');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
