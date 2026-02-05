/**
 * Script para crear un usuario modelo de prueba
 *
 * Este script crea un usuario modelo con datos de demostración
 * que puede ser usado para probar el sistema de autenticación.
 *
 * Uso:
 *   npx ts-node scripts/create-demo-user.ts
 *
 * O con pnpm:
 *   pnpm ts-node scripts/create-demo-user.ts
 *
 * O agregar a package.json:
 *   "scripts": { "seed:demo-user": "ts-node scripts/create-demo-user.ts" }
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { UserRole, PlanType, UserStage, StreamingPlatform } from '../src/users/schemas/user.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

// Configuración del usuario demo
const DEMO_USER_CONFIG = {
  email: 'modelo.demo@wctraining.com',
  password: 'DemoUser123!',
  profile: {
    firstName: 'María',
    lastName: 'García',
    nickName: 'MariaCam',
  },
  role: UserRole.MODEL,
  // Configuración opcional adicional (se aplicará después de crear)
  modelConfig: {
    streamingPlatform: StreamingPlatform.CHATURBATE,
    stage: UserStage.INTERMEDIO,
    isSuperUser: false,
    isDemo: true,
  },
  subscriptionAccess: {
    isActive: true,
    planType: PlanType.PRO,
    expiresAt: null, // Sin expiración para demo
  },
  gamification: {
    level: 5,
    stars: 125,
    currentXp: 2500,
  },
};

async function createDemoUser() {
  console.log('🚀 Iniciando creación de usuario modelo demo...\n');

  // Crear aplicación NestJS
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const usersService = app.get(UsersService);
    const userModel = app.get(getModelToken('User')) as Model<any>;

    // Verificar si ya existe el usuario
    const existingUser = await userModel.findOne({
      email: DEMO_USER_CONFIG.email.toLowerCase()
    });

    if (existingUser) {
      console.log('⚠️  Usuario demo ya existe.');
      console.log('━'.repeat(50));
      console.log(`📧 Email: ${existingUser.email}`);
      console.log(`👤 Nombre: ${existingUser.profile.firstName} ${existingUser.profile.lastName}`);
      console.log(`🎭 Nickname: ${existingUser.profile.nickName || 'N/A'}`);
      console.log(`🔐 ID: ${existingUser._id}`);
      console.log('━'.repeat(50));

      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question('¿Deseas eliminar y recrear el usuario? (s/n): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
        await userModel.deleteOne({ _id: existingUser._id });
        console.log('\n🗑️  Usuario anterior eliminado.');
      } else {
        console.log('\n✅ Conservando usuario existente.');
        await app.close();
        process.exit(0);
      }
    }

    // Crear nuevo usuario
    console.log('\n📝 Creando nuevo usuario demo...');

    const newUser = await usersService.create({
      email: DEMO_USER_CONFIG.email,
      password: DEMO_USER_CONFIG.password,
      profile: DEMO_USER_CONFIG.profile,
      role: DEMO_USER_CONFIG.role,
    });

    // Actualizar campos adicionales directamente en la BD
    await userModel.updateOne(
      { _id: newUser._id },
      {
        $set: {
          modelConfig: DEMO_USER_CONFIG.modelConfig,
          subscriptionAccess: DEMO_USER_CONFIG.subscriptionAccess,
          gamification: DEMO_USER_CONFIG.gamification,
        },
      }
    );

    // Obtener usuario actualizado
    const updatedUser = await userModel.findById(newUser._id);

    console.log('\n✅ Usuario demo creado exitosamente!\n');
    console.log('━'.repeat(60));
    console.log('🎉 DATOS DEL USUARIO DEMO');
    console.log('━'.repeat(60));
    console.log(`📧 Email:          ${updatedUser.email}`);
    console.log(`🔑 Contraseña:     ${DEMO_USER_CONFIG.password}`);
    console.log(`👤 Nombre:         ${updatedUser.profile.firstName} ${updatedUser.profile.lastName}`);
    console.log(`🎭 Nickname:       ${updatedUser.profile.nickName || 'N/A'}`);
    console.log(`🆔 ID:             ${updatedUser._id}`);
    console.log(`🎯 Rol:            ${updatedUser.role}`);
    console.log(`📊 Estado:         ${updatedUser.status}`);
    console.log('━'.repeat(60));
    console.log('🎮 GAMIFICACIÓN');
    console.log('━'.repeat(60));
    console.log(`⭐ Nivel:          ${updatedUser.gamification.level}`);
    console.log(`🌟 Estrellas:      ${updatedUser.gamification.stars}`);
    console.log(`📈 XP Actual:      ${updatedUser.gamification.currentXp}`);
    console.log('━'.repeat(60));
    console.log('💳 SUSCRIPCIÓN');
    console.log('━'.repeat(60));
    console.log(`✅ Activa:         ${updatedUser.subscriptionAccess.isActive ? 'Sí' : 'No'}`);
    console.log(`📦 Plan:           ${updatedUser.subscriptionAccess.planType}`);
    console.log(`📅 Expira:         ${updatedUser.subscriptionAccess.expiresAt || 'Sin expiración'}`);
    console.log('━'.repeat(60));
    console.log('🎬 CONFIGURACIÓN MODELO');
    console.log('━'.repeat(60));
    console.log(`📺 Plataforma:     ${updatedUser.modelConfig.streamingPlatform || 'N/A'}`);
    console.log(`📊 Etapa:          ${updatedUser.modelConfig.stage}`);
    console.log(`👑 Super User:     ${updatedUser.modelConfig.isSuperUser ? 'Sí' : 'No'}`);
    console.log(`🎭 Es Demo:        ${updatedUser.modelConfig.isDemo ? 'Sí' : 'No'}`);
    console.log('━'.repeat(60));
    console.log('\n💡 Usa estas credenciales para iniciar sesión en el frontend:\n');
    console.log(`   Email:     ${updatedUser.email}`);
    console.log(`   Password:  ${DEMO_USER_CONFIG.password}`);
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error al crear usuario demo:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Ejecutar
createDemoUser()
  .then(() => {
    console.log('🏁 Script finalizado correctamente.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
