import mongoose from 'mongoose';

async function main() {
  await mongoose.connect('mongodb://localhost:27017/wctraining');

  const themes = await mongoose.connection.collection('themes').find({}).toArray();

  // Buscar temas que contengan "psicolog"
  const psicologThemes = themes.filter(t =>
    t.title && t.title.toLowerCase().includes('psicolog')
  );
  console.log('Temas con "psicolog":', JSON.stringify(psicologThemes.map(t => ({
    _id: t._id,
    title: t.title,
    courseId: t.courseId,
    order: t.order,
  })), null, 2));

  // Verificar si existe "Psicologia usuario" exacto
  const exact = themes.find(t => t.title === 'Psicologia usuario');
  console.log('\n"Psicologia usuario" exacto:', exact ? 'ENCONTRADO' : 'NO EXISTE en MongoDB');

  // Contar total de temas
  console.log('\nTotal temas en MongoDB:', themes.length);

  // Buscar curso "Psicología Webcam"
  const courses = await mongoose.connection.collection('courses').find({}).toArray();
  const psicCourse = courses.filter(c =>
    c.title && c.title.toLowerCase().includes('psicolog')
  );
  console.log('\nCursos con "psicolog":', JSON.stringify(psicCourse.map(c => ({
    _id: c._id,
    title: c.title,
    themesCount: c.themes?.length || 0,
  })), null, 2));

  await mongoose.disconnect();
}

main();
