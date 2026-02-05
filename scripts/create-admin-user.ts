/**
 * Script para crear un usuario administrador de demostración
 *
 * Ejecutar con: pnpm seed:admin-user
 *
 * Este script crea un usuario administrador con credenciales predefinidas
 * para pruebas y desarrollo del panel de administración.
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as bcrypt from 'bcrypt';

// Configuración de conexión
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'wctraining';

// Datos del usuario administrador
const ADMIN_USER = {
  email: 'admin@wctraining.com',
  password: 'AdminSecure2024!',
  firstName: 'Super',
  lastName: 'Administrador',
};

// Enums que coinciden con el backend
enum UserRole {
  MODEL = 'MODEL',
  ADMIN = 'ADMIN',
}

enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

enum UserStage {
  ONBOARDING = 'ONBOARDING',
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

async function createAdminUser(): Promise<void> {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔌 Conectando a MongoDB...');
    await client.connect();
    console.log('✅ Conexión establecida');

    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Verificar si el usuario ya existe
    const existingUser = await usersCollection.findOne({
      email: ADMIN_USER.email.toLowerCase()
    });

    if (existingUser) {
      console.log('⚠️  El usuario administrador ya existe');
      console.log(`📧 Email: ${ADMIN_USER.email}`);
      console.log(`🔑 Password: ${ADMIN_USER.password}`);
      console.log(`👤 Rol: ${existingUser.role}`);
      return;
    }

    // Hash de la contraseña
    console.log('🔐 Generando hash de contraseña...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(ADMIN_USER.password, saltRounds);

    // Crear el documento del usuario administrador
    const now = new Date();
    const adminDocument = {
      _id: new ObjectId(),
      email: ADMIN_USER.email.toLowerCase(),
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      profile: {
        firstName: ADMIN_USER.firstName,
        lastName: ADMIN_USER.lastName,
        displayName: `${ADMIN_USER.firstName} ${ADMIN_USER.lastName}`,
        avatarUrl: null,
        bio: 'Administrador del sistema WC Training',
        phone: null,
        country: 'Ecuador',
        timezone: 'America/Guayaquil',
        language: 'es',
        dateOfBirth: null,
        gender: null,
        socialLinks: {
          instagram: null,
          twitter: null,
          tiktok: null,
          onlyFans: null,
          website: null,
        },
      },
      gamification: {
        level: 99,
        currentXP: 999999,
        totalXP: 999999,
        streak: {
          current: 0,
          longest: 0,
          lastActivityDate: now,
        },
        badges: ['admin_supreme', 'platform_master'],
        achievements: ['system_administrator'],
      },
      subscriptionAccess: {
        plan: PlanType.ENTERPRISE,
        startDate: now,
        endDate: new Date(now.getFullYear() + 100, 11, 31), // 100 años
        isActive: true,
        autoRenew: true,
        features: ['*'], // Acceso a todas las características
      },
      stage: UserStage.EXPERT,
      preferences: {
        notifications: {
          email: true,
          push: true,
          sms: false,
          marketing: false,
        },
        privacy: {
          profileVisibility: 'private',
          showProgress: false,
          showBadges: false,
        },
        learning: {
          dailyGoalMinutes: 0,
          reminderTime: null,
          preferredContentType: 'all',
        },
      },
      metadata: {
        registrationSource: 'system_seed',
        lastLoginAt: null,
        loginCount: 0,
        deviceInfo: [],
        ipHistory: [],
      },
      adminConfig: {
        permissions: ['*'], // Todos los permisos
        canManageUsers: true,
        canManageCourses: true,
        canManageSubscriptions: true,
        canViewAnalytics: true,
        canManageSystem: true,
        isSuperAdmin: true,
      },
      createdAt: now,
      updatedAt: now,
    };

    // Insertar el usuario
    console.log('💾 Creando usuario administrador...');
    const result = await usersCollection.insertOne(adminDocument);

    if (result.acknowledged) {
      console.log('\n🎉 ¡Usuario administrador creado exitosamente!\n');
      console.log('═'.repeat(50));
      console.log('📋 CREDENCIALES DE ADMINISTRADOR');
      console.log('═'.repeat(50));
      console.log(`📧 Email:    ${ADMIN_USER.email}`);
      console.log(`🔑 Password: ${ADMIN_USER.password}`);
      console.log(`👤 Rol:      ${UserRole.ADMIN}`);
      console.log(`🆔 ID:       ${result.insertedId.toString()}`);
      console.log('═'.repeat(50));
      console.log('\n⚠️  IMPORTANTE: Cambia la contraseña en producción\n');
    } else {
      throw new Error('No se pudo crear el usuario');
    }

  } catch (error) {
    console.error('❌ Error al crear usuario administrador:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Conexión a MongoDB cerrada');
  }
}

// Ejecutar el script
createAdminUser()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
