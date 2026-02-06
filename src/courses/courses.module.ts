import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { Course, CourseSchema } from './schemas/course.schema';
import { Theme, ThemeSchema } from './schemas/theme.schema';
import { Lesson, LessonSchema } from './schemas/lesson.schema';
import { UserProgress, UserProgressSchema } from './schemas/user-progress.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Platform, PlatformSchema } from '../platforms/schemas/platform.schema';

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

// Quiz Module para integración de quizzes con progreso
import { QuizModule } from '../quiz/quiz.module';

// Gamification Module para recompensas al completar contenido
import { GamificationModule } from '../gamification/gamification.module';

// Settings Module para configuración del sistema
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Theme.name, schema: ThemeSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: User.name, schema: UserSchema },
      { name: Platform.name, schema: PlatformSchema },
    ]),
    AuthModule,
    forwardRef(() => QuizModule),
    GamificationModule,
    SettingsModule,
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
