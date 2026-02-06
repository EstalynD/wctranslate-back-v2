import mongoose from 'mongoose';

// Cargar .env manualmente
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
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Conectado a MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      dailyProgress: {
        tasksCompletedToday: Number,
        lastTaskDate: Date,
        maxDailyTasks: Number
      }
    }));

    // ID del usuario según el JSON de progreso
    const userId = '69852308711c1664290993f9';
    const user = await User.findById(userId).lean();

    if (user) {
      console.log('Usuario encontrado:', user.email);
      console.log('Progreso diario:', JSON.stringify(user.dailyProgress, null, 2));

      // Verificar si lastTaskDate es de hoy
      const lastDate = user.dailyProgress?.lastTaskDate;
      if (lastDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = new Date(lastDate);
        taskDate.setHours(0, 0, 0, 0);

        console.log('Última tarea:', taskDate.toISOString());
        console.log('Hoy:', today.toISOString());
        console.log('Es del mismo día:', taskDate.getTime() === today.getTime());
      }
    } else {
      console.log('Usuario no encontrado');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
