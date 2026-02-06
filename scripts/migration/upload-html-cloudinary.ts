/**
 * Script: Subir HTML a Cloudinary y actualizar Lessons
 *
 * Lee los archivos HTML de training-wc-html/ y:
 * 1. Los sube a Cloudinary como archivos raw
 * 2. Actualiza las Lessons en MongoDB con las URLs de Cloudinary
 *
 * Uso:
 *   pnpm ts-node scripts/migration/upload-html-cloudinary.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Lesson, LessonDocument, BlockType } from '../../src/courses/schemas/lesson.schema';

// ==================== CONFIGURACIÓN ====================

const CONFIG = {
  // Directorio de archivos HTML
  HTML_DIR: path.join(__dirname, '../../training-wc-html'),

  // Carpeta en Cloudinary
  CLOUDINARY_FOLDER: 'wctraining/training-content',

  // Modo seco (no sube ni actualiza, solo muestra)
  DRY_RUN: false,

  // Límite de archivos a procesar (0 = todos)
  LIMIT: 0,

  // Delay entre uploads para evitar rate limiting (ms)
  UPLOAD_DELAY: 100,
};

// ==================== HELPERS ====================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadHtmlToCloudinary(
  filePath: string,
  filename: string
): Promise<UploadApiResponse> {
  const publicId = filename.replace('.html', '');

  return cloudinary.uploader.upload(filePath, {
    folder: CONFIG.CLOUDINARY_FOLDER,
    public_id: publicId,
    resource_type: 'raw',
    overwrite: true,
  });
}

function extractFilenameFromIframeSrc(iframeSrc: string): string | null {
  // Formato: /training-content/task-xxx.html
  const match = iframeSrc.match(/\/training-content\/(.+\.html)$/);
  return match ? match[1] : null;
}

// ==================== MAIN ====================

async function main() {
  console.log('🚀 Upload HTML a Cloudinary\n');

  // Verificar directorio HTML
  if (!fs.existsSync(CONFIG.HTML_DIR)) {
    console.error(`❌ Directorio no encontrado: ${CONFIG.HTML_DIR}`);
    process.exit(1);
  }

  // Listar archivos HTML
  const htmlFiles = fs.readdirSync(CONFIG.HTML_DIR).filter((f) => f.endsWith('.html'));
  console.log(`📁 Encontrados ${htmlFiles.length} archivos HTML`);

  if (CONFIG.DRY_RUN) {
    console.log('\n⚠️  MODO DRY_RUN ACTIVO\n');
  }

  // Configurar Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Verificar credenciales
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('❌ Variables de Cloudinary no configuradas');
    console.log('   Asegúrate de tener en .env:');
    console.log('   CLOUDINARY_CLOUD_NAME=xxx');
    console.log('   CLOUDINARY_API_KEY=xxx');
    console.log('   CLOUDINARY_API_SECRET=xxx');
    process.exit(1);
  }

  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}`);

  // Mapa de filename -> URL de Cloudinary
  const uploadedUrls = new Map<string, string>();

  // Subir archivos HTML
  console.log('\n📤 Subiendo archivos a Cloudinary...');

  const filesToProcess = CONFIG.LIMIT > 0 ? htmlFiles.slice(0, CONFIG.LIMIT) : htmlFiles;
  let uploadedCount = 0;
  let errorCount = 0;

  for (const filename of filesToProcess) {
    const filePath = path.join(CONFIG.HTML_DIR, filename);

    if (CONFIG.DRY_RUN) {
      console.log(`  [DRY] Subiría: ${filename}`);
      uploadedUrls.set(filename, `https://res.cloudinary.com/xxx/${filename}`);
      continue;
    }

    try {
      const result = await uploadHtmlToCloudinary(filePath, filename);
      uploadedUrls.set(filename, result.secure_url);
      uploadedCount++;

      if (uploadedCount % 20 === 0) {
        console.log(`  ✅ Subidos ${uploadedCount}/${filesToProcess.length}...`);
      }

      // Pequeño delay para evitar rate limiting
      await sleep(CONFIG.UPLOAD_DELAY);
    } catch (error) {
      console.error(`  ❌ Error subiendo ${filename}:`, error);
      errorCount++;
    }
  }

  console.log(`\n✅ Subidos: ${uploadedCount}`);
  if (errorCount > 0) {
    console.log(`❌ Errores: ${errorCount}`);
  }

  // Iniciar NestJS para actualizar MongoDB
  console.log('\n🔄 Actualizando Lessons en MongoDB...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const lessonModel = app.get<Model<LessonDocument>>(getModelToken(Lesson.name));

  // Buscar lessons con iframeSrc que apunten a /training-content/
  const lessons = await lessonModel.find({
    'contentBlocks.iframeSrc': { $regex: '^/training-content/' },
  });

  console.log(`📝 Encontradas ${lessons.length} lessons con referencias HTML locales`);

  let updatedCount = 0;

  for (const lesson of lessons) {
    let modified = false;

    for (const block of lesson.contentBlocks) {
      if (block.type === BlockType.IFRAME && block.iframeSrc?.startsWith('/training-content/')) {
        const filename = extractFilenameFromIframeSrc(block.iframeSrc);

        if (filename && uploadedUrls.has(filename)) {
          const newUrl = uploadedUrls.get(filename)!;

          if (CONFIG.DRY_RUN) {
            console.log(`  [DRY] ${lesson.title}: ${filename} → ${newUrl}`);
          } else {
            block.iframeSrc = newUrl;
            modified = true;
          }
        } else if (filename) {
          console.warn(`  ⚠️ URL no encontrada para: ${filename}`);
        }
      }
    }

    if (modified && !CONFIG.DRY_RUN) {
      await lesson.save();
      updatedCount++;
    }
  }

  console.log(`\n✅ Lessons actualizadas: ${updatedCount}`);

  await app.close();

  // Resumen final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(50));
  console.log(`  Archivos HTML subidos: ${uploadedCount}`);
  console.log(`  Lessons actualizadas: ${updatedCount}`);
  console.log(`  Errores de upload: ${errorCount}`);

  if (uploadedUrls.size > 0) {
    const sampleUrl = uploadedUrls.values().next().value;
    console.log(`\n📎 Ejemplo de URL: ${sampleUrl}`);
  }
}

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
