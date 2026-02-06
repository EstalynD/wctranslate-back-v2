import mongoose from 'mongoose';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '../.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
}

(async () => {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Conectado');

    const Lesson = mongoose.model('Lesson', new mongoose.Schema({
      title: String,
      themeId: mongoose.Schema.Types.ObjectId
    }));

    const Progress = mongoose.model('Progress', new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      courses: mongoose.Schema.Types.Mixed
    }), 'userprogresses');

    const userId = '69852308711c1664290993f9';
    console.log('Buscando progreso para usuario:', userId);
    const progress = await Progress.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean() as any;
    console.log('Progress encontrado:', progress ? 'SI' : 'NO');

    if (progress) {
      console.log('=== LECCIONES COMPLETADAS ===\n');

      for (const course of progress.courses) {
        for (const theme of course.themesProgress) {
          for (const lp of theme.lessonsProgress) {
            if (lp.status === 'COMPLETED') {
              const lesson = await Lesson.findById(lp.lessonId).lean() as any;
              console.log(`✓ ${lesson?.title || 'Sin título'}`);
              console.log(`  ID: ${lp.lessonId}`);
              console.log(`  Completada: ${lp.completedAt}\n`);
            }
          }
        }
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
