import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import {
  LessonRating,
  LessonRatingSchema,
} from './schemas/lesson-rating.schema';

// Service & Controller
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';

// Auth Module for guards
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LessonRating.name, schema: LessonRatingSchema },
    ]),
    AuthModule,
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
