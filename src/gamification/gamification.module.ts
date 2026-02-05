import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import {
  TokenTransaction,
  TokenTransactionSchema,
} from './schemas/token-transaction.schema';
import {
  LevelConfig,
  LevelConfigSchema,
} from './schemas/level-config.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

// Service & Controller
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';

// Auth Module for guards
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TokenTransaction.name, schema: TokenTransactionSchema },
      { name: LevelConfig.name, schema: LevelConfigSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
