import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { Studio, StudioSchema } from './schemas/studio.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

// Service & Controller
import { StudiosService } from './studios.service';
import { StudiosController } from './studios.controller';

// Auth Module for guards
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Studio.name, schema: StudioSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [StudiosController],
  providers: [StudiosService],
  exports: [StudiosService],
})
export class StudiosModule {}
