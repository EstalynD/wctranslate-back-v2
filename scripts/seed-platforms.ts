/**
 * Script para cargar plataformas base
 *
 * Uso:
 *   pnpm ts-node scripts/seed-platforms.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Platform,
  PlatformDocument,
  PlatformType,
  PlatformStatus,
  generatePlatformSlug,
} from '../src/platforms';

interface PlatformSeed {
  name: string;
  type: PlatformType;
  favicon: string;
  websiteUrl?: string;
}

const PLATFORM_SEEDS: PlatformSeed[] = [
  // Tokens/Cam
  {
    name: 'Chaturbate',
    type: PlatformType.TOKENS_CAM,
    favicon: 'https://chaturbate.com/favicon.ico',
    websiteUrl: 'https://chaturbate.com',
  },
  {
    name: 'Stripchat',
    type: PlatformType.TOKENS_CAM,
    favicon: 'https://es.stripchat.com/favicon.ico',
    websiteUrl: 'https://stripchat.com',
  },
  {
    name: 'BongaCams',
    type: PlatformType.TOKENS_CAM,
    favicon: 'https://bongacams.com/favicon.ico',
    websiteUrl: 'https://bongacams.com',
  },
  {
    name: 'Cam4',
    type: PlatformType.TOKENS_CAM,
    favicon: 'https://cam4.com/favicon.ico',
    websiteUrl: 'https://cam4.com',
  },
  {
    name: 'MyFreeCams',
    type: PlatformType.TOKENS_CAM,
    favicon: 'https://www.myfreecams.com/favicon.ico',
    websiteUrl: 'https://www.myfreecams.com',
  },
  {
    name: 'CamSoda',
    type: PlatformType.TOKENS_CAM,
    favicon: 'https://www.camsoda.com/favicon.ico',
    websiteUrl: 'https://www.camsoda.com',
  },
  {
    name: 'Cherry.tv',
    type: PlatformType.TOKENS_CAM,
    favicon: 'https://cherry.tv/favicon.ico',
    websiteUrl: 'https://cherry.tv',
  },
  {
    name: 'XLove',
    type: PlatformType.TOKENS_CAM,
    favicon: 'https://i.ibb.co/G47C1wL3/Xlove.jpg',
  },
  {
    name: 'Amateur.tv',
    type: PlatformType.TOKENS_CAM,
    favicon: 'https://www.amateur.tv/favicon.ico',
    websiteUrl: 'https://www.amateur.tv',
  },
  {
    name: 'LSL',
    type: PlatformType.TOKENS_CAM,
    favicon:
      'https://static1.dditscdn.com/cob/site/lsl/200005/image/picture/favicon_61d4630d4328f626321765.png?vl900',
    websiteUrl: 'https://www.lsl.com',
  },

  // Privadas
  {
    name: 'Jerkmate',
    type: PlatformType.PRIVATE,
    favicon:
      'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://jerkmate.com&size=128',
    websiteUrl: 'https://jerkmate.com',
  },
  {
    name: 'LiveJasmin',
    type: PlatformType.PRIVATE,
    favicon:
      'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://livejasmin.com&size=128',
    websiteUrl: 'https://livejasmin.com',
  },
  {
    name: 'Cams.com',
    type: PlatformType.PRIVATE,
    favicon:
      'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://cams.com&size=128',
    websiteUrl: 'https://cams.com',
  },
  {
    name: 'Streamate',
    type: PlatformType.PRIVATE,
    favicon: 'https://i.ibb.co/nqbq3JRc/Streamate.jpg',
    websiteUrl: 'https://streamate.com',
  },
  {
    name: 'Flirt',
    type: PlatformType.PRIVATE,
    favicon: 'https://i.ibb.co/4nw3Sy9M/Flirt.png',
  },
  {
    name: 'AdultWork',
    type: PlatformType.PRIVATE,
    favicon: 'https://www.adultwork.com/favicon.ico',
    websiteUrl: 'https://www.adultwork.com',
  },
  {
    name: 'SakuraLive',
    type: PlatformType.PRIVATE,
    favicon: 'https://www.sakuralive.com/favicon.ico',
    websiteUrl: 'https://www.sakuralive.com',
  },
  {
    name: 'IMLive',
    type: PlatformType.PRIVATE,
    favicon: 'https://imlive.com/favicon.ico',
    websiteUrl: 'https://imlive.com',
  },

  // Contenido
  {
    name: 'Sky',
    type: PlatformType.CONTENT,
    favicon: 'https://i.ibb.co/ZzP3mH4N/Sky.png',
  },
  {
    name: 'OnlyFans',
    type: PlatformType.CONTENT,
    favicon: 'https://onlyfans.com/favicon.ico',
    websiteUrl: 'https://onlyfans.com',
  },
  {
    name: 'Fansly',
    type: PlatformType.CONTENT,
    favicon: 'https://fansly.com/favicon.ico',
    websiteUrl: 'https://fansly.com',
  },
  {
    name: 'ManyVids',
    type: PlatformType.CONTENT,
    favicon: 'https://www.manyvids.com/favicon.ico',
    websiteUrl: 'https://www.manyvids.com',
  },
];

async function seedPlatforms() {
  console.log('🚀 Iniciando carga de plataformas...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const platformModel = app.get(getModelToken('Platform')) as Model<PlatformDocument>;

    let created = 0;
    let updated = 0;

    for (let index = 0; index < PLATFORM_SEEDS.length; index += 1) {
      const seed = PLATFORM_SEEDS[index];
      const displayOrder = index + 1;

      const existing = await platformModel.findOne({
        name: { $regex: new RegExp(`^${seed.name}$`, 'i') },
      });

      if (existing) {
        await platformModel.updateOne(
          { _id: existing._id },
          {
            $set: {
              type: seed.type,
              favicon: seed.favicon,
              websiteUrl: seed.websiteUrl,
              status: PlatformStatus.ACTIVE,
              displayOrder,
            },
          },
        );
        updated += 1;
        console.log(`♻️  Actualizada: ${seed.name}`);
      } else {
        const platform = new platformModel({
          name: seed.name,
          type: seed.type,
          slug: generatePlatformSlug(seed.name),
          favicon: seed.favicon,
          websiteUrl: seed.websiteUrl,
          status: PlatformStatus.ACTIVE,
          displayOrder,
        });

        await platform.save();
        created += 1;
        console.log(`✅ Creada: ${seed.name}`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📌 Resumen de carga');
    console.log(`✅ Creadas:     ${created}`);
    console.log(`♻️  Actualizadas: ${updated}`);
    console.log(`📦 Total:       ${PLATFORM_SEEDS.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('\n❌ Error al cargar plataformas:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seedPlatforms()
  .then(() => {
    console.log('🏁 Script finalizado correctamente.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
