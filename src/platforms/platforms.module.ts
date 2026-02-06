import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { Platform, PlatformSchema } from './schemas/platform.schema';

// Service & Controller
import { PlatformsService } from './platforms.service';
import { PlatformsController } from './platforms.controller';

// Auth Module for guards
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Platform.name, schema: PlatformSchema },
    ]),
    AuthModule,
  ],
  controllers: [PlatformsController],
  providers: [PlatformsService],
  exports: [PlatformsService],
})
export class PlatformsModule {}
