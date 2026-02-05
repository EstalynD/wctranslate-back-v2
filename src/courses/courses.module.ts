import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { Course, CourseSchema } from './schemas/course.schema';
import { Theme, ThemeSchema } from './schemas/theme.schema';
import { Lesson, LessonSchema } from './schemas/lesson.schema';
import { UserProgress, UserProgressSchema } from './schemas/user-progress.schema';

// Services
import { CoursesService } from './courses.service';
import { ThemesService } from './themes.service';
import { LessonsService } from './lessons.service';
import { ProgressService } from './progress.service';

// Controllers
import { CoursesController } from './courses.controller';
import { ThemesController } from './themes.controller';
import { LessonsController } from './lessons.controller';
import { ProgressController } from './progress.controller';

// Auth Module for guards
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Theme.name, schema: ThemeSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
    ]),
    AuthModule,
  ],
  controllers: [
    CoursesController,
    ThemesController,
    LessonsController,
    ProgressController,
  ],
  providers: [
    CoursesService,
    ThemesService,
    LessonsService,
    ProgressService,
  ],
  exports: [
    CoursesService,
    ThemesService,
    LessonsService,
    ProgressService,
  ],
})
export class CoursesModule {}
