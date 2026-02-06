import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserProgress,
  UserProgressDocument,
  ProgressStatus,
  CourseProgress,
  ThemeProgress,
  LessonProgress,
} from './schemas/user-progress.schema';
import { Course, CourseDocument } from './schemas/course.schema';
import { Theme, ThemeDocument } from './schemas/theme.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import {
  SubmitExerciseDto,
  SubmitQuizDto,
  MarkLessonCompletePayload,
  ProgressUpdateResponse,
  StartingPointResponse,
  DailyStatusResponse,
  ThemeAccessResponse,
  LessonAccessResponse,
  DashboardHomeResponse,
  DashboardCourseItem,
  DashboardNextTask,
} from './dto/progress.dto';

// Quiz Service para integración
import { QuizService } from '../quiz/quiz.service';
import { QuizType } from '../quiz/schemas/quiz.schema';

// Gamification Service para recompensas
import { GamificationService } from '../gamification/gamification.service';
import { TransactionType, ReferenceType } from '../gamification/schemas/token-transaction.schema';

// User model para límite diario
import { User, UserDocument } from '../users/schemas/user.schema';

// Settings Service para configuración global del sistema
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(UserProgress.name)
    private progressModel: Model<UserProgressDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Theme.name) private themeModel: Model<ThemeDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => QuizService))
    private quizService: QuizService,
    private gamificationService: GamificationService,
    private settingsService: SettingsService,
  ) {}

  // ==================== HELPERS ====================

  /** Busca el documento de progreso por userId (convierte string a ObjectId) */
  private findProgressByUserId(userId: string) {
    return this.progressModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  /**
   * Recalcula los porcentajes de progreso de un CourseProgress
   * Se ejecuta en memoria, sin guardar en BD
   */
  private recalculateCourseProgressPercentages(courseProgress: CourseProgress): void {
    // Recalcular progreso de cada tema
    for (const themeProgress of courseProgress.themesProgress) {
      const completedLessons = themeProgress.lessonsProgress.filter(
        (l) => l.status === ProgressStatus.COMPLETED,
      ).length;
      const totalLessons = themeProgress.lessonsProgress.length;

      themeProgress.progressPercentage = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;
    }

    // Recalcular progreso del curso como promedio de los temas
    const totalThemeProgress = courseProgress.themesProgress.reduce(
      (sum, t) => sum + t.progressPercentage,
      0,
    );
    courseProgress.progressPercentage = courseProgress.themesProgress.length > 0
      ? Math.round(totalThemeProgress / courseProgress.themesProgress.length)
      : 0;
  }

  // ==================== GET PROGRESS ====================

  async getUserProgress(userId: string): Promise<UserProgress> {
    let progress = await this.findProgressByUserId(userId);

    if (!progress) {
      // Crear documento de progreso si no existe
      progress = new this.progressModel({
        userId: new Types.ObjectId(userId),
        courses: [],
      });
      await progress.save();
    }

    // Recalcular porcentajes antes de devolver
    for (const courseProgress of progress.courses) {
      this.recalculateCourseProgressPercentages(courseProgress);
    }

    return progress;
  }

  async getCourseProgress(
    userId: string,
    courseId: string,
  ): Promise<{ enrolled: boolean; progress: CourseProgress | null }> {
    const progressDoc = await this.findProgressByUserId(userId);

    if (!progressDoc) {
      return { enrolled: false, progress: null };
    }

    const courseProgress = progressDoc.courses.find(
      (c) => c.courseId.toString() === courseId,
    ) || null;

    // Recalcular porcentajes antes de devolver
    if (courseProgress) {
      this.recalculateCourseProgressPercentages(courseProgress);
    }

    return {
      enrolled: courseProgress !== null,
      progress: courseProgress,
    };
  }

  // ==================== ENROLLMENT ====================

  async enrollInCourse(userId: string, courseId: string): Promise<UserProgress> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    let progress = await this.findProgressByUserId(userId);

    if (!progress) {
      progress = new this.progressModel({
        userId: new Types.ObjectId(userId),
        courses: [],
      });
    }

    // Verificar si ya está inscrito
    const existingEnrollment = progress.courses.find(
      (c) => c.courseId.toString() === courseId,
    );

    if (existingEnrollment) {
      return progress;
    }

    // Obtener temas del curso
    const themes = await this.themeModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .sort({ order: 1 })
      .exec();

    // Crear estructura de progreso para el curso
    const courseProgress: CourseProgress = {
      courseId: new Types.ObjectId(courseId),
      status: ProgressStatus.NOT_STARTED,
      progressPercentage: 0,
      enrolledAt: new Date(),
      startedAt: null,
      completedAt: null,
      lastAccessedAt: new Date(),
      themesProgress: await Promise.all(
        themes.map(async (theme) => this.createThemeProgress(theme)),
      ),
    };

    progress.courses.push(courseProgress);
    await progress.save();

    // Incrementar contador de inscritos
    await this.courseModel.findByIdAndUpdate(courseId, {
      $inc: { enrolledCount: 1 },
    });

    return progress;
  }

  private async createThemeProgress(theme: Theme): Promise<ThemeProgress> {
    const lessons = await this.lessonModel
      .find({ themeId: theme._id })
      .sort({ order: 1 })
      .exec();

    return {
      themeId: theme._id,
      status: ProgressStatus.NOT_STARTED,
      progressPercentage: 0,
      startedAt: null,
      completedAt: null,
      lessonsProgress: lessons.map((lesson) => ({
        lessonId: lesson._id,
        status: ProgressStatus.NOT_STARTED,
        completedAt: null,
        completedBlocks: [],
      })),
    };
  }

  // ==================== MARK PROGRESS ====================

  async markLessonComplete(
    userId: string,
    dto: MarkLessonCompletePayload,
  ): Promise<ProgressUpdateResponse> {
    const lesson = await this.lessonModel.findById(dto.lessonId).exec();
    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    // ─── REGLA 1: Verificar límite diario de tareas ───
    const dailyCheck = await this.checkDailyLimit(userId);
    if (!dailyCheck.canComplete) {
      return {
        success: false,
        courseProgress: 0,
        themeProgress: 0,
        lessonCompleted: false,
        themeCompleted: false,
        courseCompleted: false,
        dailyLimitReached: true,
        message: dailyCheck.message,
        dailyProgress: {
          tasksCompletedToday: dailyCheck.tasksCompletedToday,
          maxDailyTasks: dailyCheck.maxDailyTasks,
          tasksRemaining: 0,
        },
      };
    }

    // ─── REGLA 2: Verificar POST_QUIZ antes de permitir completar ───
    const postQuizStatus = await this.quizService.getPostQuizStatus(userId, dto.lessonId);
    if (!postQuizStatus.canComplete) {
      return {
        success: false,
        courseProgress: 0,
        themeProgress: 0,
        lessonCompleted: false,
        themeCompleted: false,
        courseCompleted: false,
        message: postQuizStatus.message,
        postQuizRequired: {
          quizId: postQuizStatus.quizId,
          attemptsCount: postQuizStatus.attemptsCount,
          maxAttempts: postQuizStatus.maxAttempts,
          bestScore: postQuizStatus.bestScore,
        },
      };
    }

    const theme = await this.themeModel.findById(lesson.themeId).exec();
    if (!theme) {
      throw new NotFoundException('Tema no encontrado');
    }

    const progress = await this.findProgressByUserId(userId);
    if (!progress) {
      throw new NotFoundException('Progreso no encontrado. Inscríbete primero.');
    }

    const courseProgress = progress.courses.find(
      (c) => c.courseId.toString() === theme.courseId.toString(),
    );
    if (!courseProgress) {
      throw new NotFoundException('No estás inscrito en este curso');
    }

    const themeProgress = courseProgress.themesProgress.find(
      (t) => t.themeId.toString() === theme._id.toString(),
    );
    if (!themeProgress) {
      throw new NotFoundException('Tema no encontrado en progreso');
    }

    const lessonProgress = themeProgress.lessonsProgress.find(
      (l) => l.lessonId.toString() === dto.lessonId,
    );
    if (!lessonProgress) {
      throw new NotFoundException('Lección no encontrada en progreso');
    }

    // Evitar completar una lección ya completada (idempotencia)
    if (lessonProgress.status === ProgressStatus.COMPLETED) {
      const nextContent = await this.getNextContent(
        dto.lessonId,
        theme._id.toString(),
        theme.courseId.toString(),
      );
      return {
        success: true,
        courseProgress: courseProgress.progressPercentage,
        themeProgress: themeProgress.progressPercentage,
        lessonCompleted: true,
        themeCompleted: themeProgress.status === ProgressStatus.COMPLETED,
        courseCompleted: courseProgress.status === ProgressStatus.COMPLETED,
        message: 'Esta lección ya estaba completada',
        unlockedContent: nextContent,
      };
    }

    // ─── Marcar lección como completada ───
    lessonProgress.status = ProgressStatus.COMPLETED;
    lessonProgress.completedAt = new Date();

    // Guardar resultado del quiz en el progreso si aplica
    if (postQuizStatus.hasPostQuiz && postQuizStatus.hasPassed) {
      lessonProgress.quizResult = {
        score: postQuizStatus.bestScore || 0,
        maxScore: 100,
        percentage: postQuizStatus.bestScore || 0,
        attempts: postQuizStatus.attemptsCount,
        lastAttemptAt: new Date(),
        passed: true,
      };
    }

    if (dto.completedBlocks) {
      lessonProgress.completedBlocks = dto.completedBlocks;
    }

    // ─── Actualizar progreso del tema ───
    const completedLessons = themeProgress.lessonsProgress.filter(
      (l) => l.status === ProgressStatus.COMPLETED,
    ).length;
    themeProgress.progressPercentage = Math.round(
      (completedLessons / themeProgress.lessonsProgress.length) * 100,
    );

    const themeCompleted = themeProgress.progressPercentage === 100;
    if (themeCompleted && themeProgress.status !== ProgressStatus.COMPLETED) {
      themeProgress.status = ProgressStatus.COMPLETED;
      themeProgress.completedAt = new Date();
    } else if (themeProgress.status === ProgressStatus.NOT_STARTED) {
      themeProgress.status = ProgressStatus.IN_PROGRESS;
      themeProgress.startedAt = new Date();
    }

    // ─── Actualizar progreso del curso ───
    // Calcular progreso como promedio de los progresos de todos los temas
    const totalThemeProgress = courseProgress.themesProgress.reduce(
      (sum, t) => sum + t.progressPercentage,
      0,
    );
    courseProgress.progressPercentage = Math.round(
      totalThemeProgress / courseProgress.themesProgress.length,
    );

    const completedThemes = courseProgress.themesProgress.filter(
      (t) => t.status === ProgressStatus.COMPLETED,
    ).length;
    const courseCompleted = completedThemes === courseProgress.themesProgress.length;
    if (courseCompleted && courseProgress.status !== ProgressStatus.COMPLETED) {
      courseProgress.status = ProgressStatus.COMPLETED;
      courseProgress.completedAt = new Date();
      progress.totalCoursesCompleted += 1;
    } else if (courseProgress.status === ProgressStatus.NOT_STARTED) {
      courseProgress.status = ProgressStatus.IN_PROGRESS;
      courseProgress.startedAt = new Date();
    }

    courseProgress.lastAccessedAt = new Date();
    progress.totalLessonsCompleted += 1;

    // ─── REGLA 3: Actualizar streak ───
    await this.updateStreak(progress);

    await progress.save();

    // ─── REGLA 4: Incrementar progreso diario ───
    await this.incrementDailyProgress(userId);

    // ─── REGLA 5: Obtener siguiente contenido (auto-avance) ───
    const unlockedContent = await this.getNextContent(
      dto.lessonId,
      theme._id.toString(),
      theme.courseId.toString(),
    );

    // ─── REGLA 6: Otorgar recompensas de gamificación ───
    const rewards = await this.awardCompletionRewards(
      userId,
      dto.lessonId,
      theme,
      themeCompleted,
      courseCompleted,
      progress.currentStreak,
    );

    // Calcular tareas restantes del día
    const updatedDaily = await this.checkDailyLimit(userId);

    return {
      success: true,
      courseProgress: courseProgress.progressPercentage,
      themeProgress: themeProgress.progressPercentage,
      lessonCompleted: true,
      themeCompleted,
      courseCompleted,
      unlockedContent,
      rewards,
      dailyProgress: {
        tasksCompletedToday: updatedDaily.tasksCompletedToday,
        maxDailyTasks: updatedDaily.maxDailyTasks,
        tasksRemaining: Math.max(0, updatedDaily.maxDailyTasks - updatedDaily.tasksCompletedToday),
      },
    };
  }

  // ==================== SUBMISSIONS ====================

  async submitExercise(
    userId: string,
    dto: SubmitExerciseDto,
  ): Promise<ProgressUpdateResponse> {
    const progress = await this.findProgressByUserId(userId);
    if (!progress) {
      throw new NotFoundException('Progreso no encontrado');
    }

    const lesson = await this.lessonModel.findById(dto.lessonId).exec();
    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    const theme = await this.themeModel.findById(lesson.themeId).exec();
    if (!theme) {
      throw new NotFoundException('Tema no encontrado');
    }

    const courseProgress = progress.courses.find(
      (c) => c.courseId.toString() === theme.courseId.toString(),
    );
    if (!courseProgress) {
      throw new NotFoundException('No estás inscrito en este curso');
    }

    const themeProgress = courseProgress.themesProgress.find(
      (t) => t.themeId.toString() === theme._id.toString(),
    );
    if (!themeProgress) {
      throw new NotFoundException('Tema no encontrado en progreso');
    }

    const lessonProgress = themeProgress.lessonsProgress.find(
      (l) => l.lessonId.toString() === dto.lessonId,
    );
    if (!lessonProgress) {
      throw new NotFoundException('Lección no encontrada en progreso');
    }

    // Guardar submission (sin marcar como completada, markLessonComplete se encarga)
    lessonProgress.submission = {
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      comment: dto.comment || '',
      submittedAt: new Date(),
      grade: null,
      feedback: null,
    };

    await progress.save();

    // Delegar la completación real a markLessonComplete
    // (actualiza status, progreso, streak, daily, gamificación)
    return this.markLessonComplete(userId, { lessonId: dto.lessonId });
  }

  async submitQuiz(
    userId: string,
    dto: SubmitQuizDto,
  ): Promise<ProgressUpdateResponse> {
    const progress = await this.findProgressByUserId(userId);
    if (!progress) {
      throw new NotFoundException('Progreso no encontrado');
    }

    const lesson = await this.lessonModel.findById(dto.lessonId).exec();
    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    const theme = await this.themeModel.findById(lesson.themeId).exec();
    if (!theme) {
      throw new NotFoundException('Tema no encontrado');
    }

    const courseProgress = progress.courses.find(
      (c) => c.courseId.toString() === theme.courseId.toString(),
    );
    if (!courseProgress) {
      throw new NotFoundException('No estás inscrito en este curso');
    }

    const themeProgress = courseProgress.themesProgress.find(
      (t) => t.themeId.toString() === theme._id.toString(),
    );
    if (!themeProgress) {
      throw new NotFoundException('Tema no encontrado en progreso');
    }

    const lessonProgress = themeProgress.lessonsProgress.find(
      (l) => l.lessonId.toString() === dto.lessonId,
    );
    if (!lessonProgress) {
      throw new NotFoundException('Lección no encontrada en progreso');
    }

    const percentage = Math.round((dto.score / dto.maxScore) * 100);
    const passed = percentage >= 70; // Umbral configurable

    // Guardar resultado del quiz
    lessonProgress.quizResult = {
      score: dto.score,
      maxScore: dto.maxScore,
      percentage,
      attempts: (lessonProgress.quizResult?.attempts || 0) + 1,
      lastAttemptAt: new Date(),
      passed,
    };

    await progress.save();

    if (passed) {
      // Delegar la completación real a markLessonComplete
      // (actualiza status, progreso, streak, daily, gamificación)
      return this.markLessonComplete(userId, { lessonId: dto.lessonId });
    }

    return {
      success: true,
      courseProgress: courseProgress.progressPercentage,
      themeProgress: themeProgress.progressPercentage,
      lessonCompleted: false,
      themeCompleted: false,
      courseCompleted: false,
    };
  }

  // ==================== STREAK ====================

  private async updateStreak(progress: UserProgress): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastStudy = progress.lastStudyDate
      ? new Date(progress.lastStudyDate)
      : null;

    if (lastStudy) {
      lastStudy.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        // Día consecutivo
        progress.currentStreak += 1;
        if (progress.currentStreak > progress.longestStreak) {
          progress.longestStreak = progress.currentStreak;
        }
      } else if (diffDays > 1) {
        // Se rompió la racha
        progress.currentStreak = 1;
      }
      // Si diffDays === 0, es el mismo día, no cambia
    } else {
      progress.currentStreak = 1;
    }

    progress.lastStudyDate = today;
  }

  // ==================== UNLOCK CHECK ====================

  /**
   * Verifica si el usuario puede acceder a un tema específico
   * Regla: Un tema solo se desbloquea si el anterior alcanzó el unlockThreshold
   */
  async canAccessTheme(
    userId: string,
    themeId: string,
    courseId: string,
  ): Promise<ThemeAccessResponse> {
    const theme = await this.themeModel.findById(themeId).exec();
    if (!theme) {
      return { canAccess: false, reason: 'Tema no encontrado', themeId, requiresCompletion: false };
    }

    // Si no requiere completar anterior, siempre accesible
    if (!theme.requiresPreviousCompletion) {
      return { canAccess: true, themeId, requiresCompletion: false };
    }

    // Obtener todos los temas del curso ordenados
    const themes = await this.themeModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .sort({ order: 1 })
      .exec();

    const themeIndex = themes.findIndex((t) => t._id.toString() === themeId);

    // Primer tema del curso: siempre accesible
    if (themeIndex <= 0) {
      return { canAccess: true, themeId, requiresCompletion: true };
    }

    // Verificar progreso del tema anterior
    const previousTheme = themes[themeIndex - 1];
    const progress = await this.findProgressByUserId(userId);
    if (!progress) {
      return {
        canAccess: false,
        reason: 'No estás inscrito en ningún curso',
        themeId,
        requiresCompletion: true,
      };
    }

    const courseProgress = progress.courses.find(
      (c) => c.courseId.toString() === courseId,
    );
    if (!courseProgress) {
      return {
        canAccess: false,
        reason: 'No estás inscrito en este curso',
        themeId,
        requiresCompletion: true,
      };
    }

    const prevThemeProgress = courseProgress.themesProgress.find(
      (t) => t.themeId.toString() === previousTheme._id.toString(),
    );

    if (!prevThemeProgress) {
      return {
        canAccess: false,
        reason: 'Debes completar el tema anterior para continuar',
        themeId,
        requiresCompletion: true,
        previousThemeProgress: 0,
        unlockThreshold: theme.unlockThreshold,
      };
    }

    // Verificar si el tema anterior cumple el threshold de desbloqueo
    if (prevThemeProgress.progressPercentage < theme.unlockThreshold) {
      return {
        canAccess: false,
        reason: `Debes completar al menos ${theme.unlockThreshold}% del tema "${previousTheme.title}" para desbloquear este tema (actual: ${prevThemeProgress.progressPercentage}%)`,
        themeId,
        requiresCompletion: true,
        previousThemeProgress: prevThemeProgress.progressPercentage,
        unlockThreshold: theme.unlockThreshold,
      };
    }

    return { canAccess: true, themeId, requiresCompletion: true };
  }

  /**
   * Verifica si el usuario puede acceder a una lección
   * Incluye verificación de tema secuencial + lección secuencial + PRE_QUIZ
   */
  async canAccessLesson(
    userId: string,
    lessonId: string,
  ): Promise<LessonAccessResponse> {
    const lesson = await this.lessonModel.findById(lessonId).exec();
    if (!lesson) {
      return { canAccess: false, reason: 'Lección no encontrada' };
    }

    // Si es preview, siempre accesible
    if (lesson.isPreview) {
      return { canAccess: true, themeAccessible: true };
    }

    const theme = await this.themeModel.findById(lesson.themeId).exec();
    if (!theme) {
      return { canAccess: false, reason: 'Tema no encontrado' };
    }

    // ─── REGLA: Verificar acceso al tema primero ───
    const themeAccess = await this.canAccessTheme(
      userId,
      theme._id.toString(),
      theme.courseId.toString(),
    );
    if (!themeAccess.canAccess) {
      return {
        canAccess: false,
        reason: themeAccess.reason,
        themeAccessible: false,
      };
    }

    // Si no requiere completar anterior, verificar solo PRE_QUIZ
    if (!lesson.requiresPreviousCompletion) {
      const preQuizStatus = await this.quizService.getPreQuizStatus(userId, lessonId);
      if (preQuizStatus.mustTakeQuiz) {
        return {
          canAccess: true,
          preQuizRequired: true,
          preQuizId: preQuizStatus.quizId,
          reason: preQuizStatus.message,
          themeAccessible: true,
        };
      }
      return { canAccess: true, themeAccessible: true };
    }

    // Verificar progreso secuencial de lecciones
    const progress = await this.findProgressByUserId(userId);
    if (!progress) {
      return { canAccess: false, reason: 'No estás inscrito', themeAccessible: true };
    }

    const courseProgress = progress.courses.find(
      (c) => c.courseId.toString() === theme.courseId.toString(),
    );
    if (!courseProgress) {
      return { canAccess: false, reason: 'No estás inscrito en este curso', themeAccessible: true };
    }

    const themeProgress = courseProgress.themesProgress.find(
      (t) => t.themeId.toString() === theme._id.toString(),
    );
    if (!themeProgress) {
      return { canAccess: false, reason: 'Tema no encontrado en progreso', themeAccessible: true };
    }

    // Encontrar índice de la lección en el progreso
    const lessonIndex = themeProgress.lessonsProgress.findIndex(
      (l) => l.lessonId.toString() === lessonId,
    );

    if (lessonIndex === 0) {
      // Primera lección del tema, verificar PRE_QUIZ
      const preQuizStatus = await this.quizService.getPreQuizStatus(userId, lessonId);
      if (preQuizStatus.mustTakeQuiz) {
        return {
          canAccess: true,
          preQuizRequired: true,
          preQuizId: preQuizStatus.quizId,
          reason: preQuizStatus.message,
          themeAccessible: true,
        };
      }
      return { canAccess: true, themeAccessible: true };
    }

    // ─── REGLA: Verificar lección anterior completada ───
    const previousLessonProgress = themeProgress.lessonsProgress[lessonIndex - 1];
    const previousLessonId = previousLessonProgress.lessonId.toString();

    if (previousLessonProgress.status !== ProgressStatus.COMPLETED) {
      return {
        canAccess: false,
        reason: 'Debes completar la lección anterior para continuar',
        themeAccessible: true,
      };
    }

    // ─── REGLA: Verificar POST_QUIZ de la lección anterior ───
    const postQuizCheck = await this.quizService.hasPassedPreviousLessonPostQuiz(
      userId,
      previousLessonId,
    );

    if (!postQuizCheck.canProceed) {
      return {
        canAccess: false,
        reason: postQuizCheck.reason || 'Debes aprobar el quiz de la lección anterior',
        themeAccessible: true,
      };
    }

    // ─── REGLA: Verificar PRE_QUIZ de esta lección ───
    const preQuizStatus = await this.quizService.getPreQuizStatus(userId, lessonId);
    if (preQuizStatus.mustTakeQuiz) {
      return {
        canAccess: true,
        preQuizRequired: true,
        preQuizId: preQuizStatus.quizId,
        reason: preQuizStatus.message,
        themeAccessible: true,
      };
    }

    return { canAccess: true, themeAccessible: true };
  }

  /**
   * Batch: Verifica acceso a múltiples lecciones en una sola llamada
   * Optimización para evitar N+1 queries desde el frontend
   */
  async canAccessLessonsBatch(
    userId: string,
    lessonIds: string[],
  ): Promise<Record<string, LessonAccessResponse>> {
    // Ejecutar todas las verificaciones en paralelo
    const accessResults = await Promise.all(
      lessonIds.map(async (lessonId) => {
        const access = await this.canAccessLesson(userId, lessonId);
        return { lessonId, access };
      }),
    );

    // Convertir a mapa para fácil acceso en el frontend
    return accessResults.reduce<Record<string, LessonAccessResponse>>(
      (acc, { lessonId, access }) => {
        acc[lessonId] = access;
        return acc;
      },
      {},
    );
  }

  /**
   * Verifica si el usuario puede ver el contenido de una lección
   * (después de hacer el PRE_QUIZ si es requerido)
   */
  async canViewLessonContent(
    userId: string,
    lessonId: string,
  ): Promise<{
    canView: boolean;
    canBypass: boolean;
    preQuiz?: {
      required: boolean;
      quizId?: string;
      hasPassed: boolean;
      message: string;
    };
    postQuiz?: {
      required: boolean;
      quizId?: string;
      hasPassed: boolean;
      message: string;
    };
  }> {
    const preQuizStatus = await this.quizService.getPreQuizStatus(userId, lessonId);
    const postQuizStatus = await this.quizService.getPostQuizStatus(userId, lessonId);

    return {
      canView: preQuizStatus.canViewContent,
      canBypass: preQuizStatus.canBypass,
      preQuiz: preQuizStatus.hasPreQuiz
        ? {
            required: preQuizStatus.mustTakeQuiz,
            quizId: preQuizStatus.quizId,
            hasPassed: preQuizStatus.hasPassed,
            message: preQuizStatus.message,
          }
        : undefined,
      postQuiz: postQuizStatus.hasPostQuiz
        ? {
            required: postQuizStatus.requiresPass,
            quizId: postQuizStatus.quizId,
            hasPassed: postQuizStatus.hasPassed,
            message: postQuizStatus.message,
          }
        : undefined,
    };
  }

  // ==================== ADDITIONAL METHODS ====================

  async findByUser(userId: string): Promise<UserProgress | null> {
    const progress = await this.findProgressByUserId(userId);

    // Recalcular porcentajes antes de devolver
    if (progress) {
      for (const courseProgress of progress.courses) {
        this.recalculateCourseProgressPercentages(courseProgress);
      }
    }

    return progress;
  }

  /**
   * Recalcula el progreso de todos los cursos del usuario
   * Útil para corregir inconsistencias en los porcentajes
   */
  async recalculateUserProgress(userId: string): Promise<{
    success: boolean;
    coursesUpdated: number;
    details: Array<{ courseId: string; oldProgress: number; newProgress: number }>;
  }> {
    const progress = await this.findProgressByUserId(userId);
    if (!progress) {
      return { success: false, coursesUpdated: 0, details: [] };
    }

    const details: Array<{ courseId: string; oldProgress: number; newProgress: number }> = [];

    for (const courseProgress of progress.courses) {
      const oldProgress = courseProgress.progressPercentage;

      // Recalcular progreso de cada tema
      for (const themeProgress of courseProgress.themesProgress) {
        const completedLessons = themeProgress.lessonsProgress.filter(
          (l) => l.status === ProgressStatus.COMPLETED,
        ).length;
        const totalLessons = themeProgress.lessonsProgress.length;

        themeProgress.progressPercentage = totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

        // Actualizar estado del tema si es necesario
        if (themeProgress.progressPercentage === 100 && themeProgress.status !== ProgressStatus.COMPLETED) {
          themeProgress.status = ProgressStatus.COMPLETED;
          themeProgress.completedAt = themeProgress.completedAt || new Date();
        } else if (themeProgress.progressPercentage > 0 && themeProgress.status === ProgressStatus.NOT_STARTED) {
          themeProgress.status = ProgressStatus.IN_PROGRESS;
          themeProgress.startedAt = themeProgress.startedAt || new Date();
        }
      }

      // Recalcular progreso del curso como promedio de los temas
      const totalThemeProgress = courseProgress.themesProgress.reduce(
        (sum, t) => sum + t.progressPercentage,
        0,
      );
      courseProgress.progressPercentage = courseProgress.themesProgress.length > 0
        ? Math.round(totalThemeProgress / courseProgress.themesProgress.length)
        : 0;

      // Actualizar estado del curso si es necesario
      const allThemesCompleted = courseProgress.themesProgress.every(
        (t) => t.status === ProgressStatus.COMPLETED,
      );
      if (allThemesCompleted && courseProgress.status !== ProgressStatus.COMPLETED) {
        courseProgress.status = ProgressStatus.COMPLETED;
        courseProgress.completedAt = courseProgress.completedAt || new Date();
      } else if (courseProgress.progressPercentage > 0 && courseProgress.status === ProgressStatus.NOT_STARTED) {
        courseProgress.status = ProgressStatus.IN_PROGRESS;
        courseProgress.startedAt = courseProgress.startedAt || new Date();
      }

      details.push({
        courseId: courseProgress.courseId.toString(),
        oldProgress,
        newProgress: courseProgress.progressPercentage,
      });
    }

    await progress.save();

    return {
      success: true,
      coursesUpdated: details.filter((d) => d.oldProgress !== d.newProgress).length,
      details,
    };
  }

  async getLessonProgress(
    userId: string,
    lessonId: string,
  ): Promise<LessonProgress | null> {
    const lesson = await this.lessonModel.findById(lessonId).exec();
    if (!lesson) return null;

    const theme = await this.themeModel.findById(lesson.themeId).exec();
    if (!theme) return null;

    const progress = await this.findProgressByUserId(userId);
    if (!progress) return null;

    const courseProgress = progress.courses.find(
      (c) => c.courseId.toString() === theme.courseId.toString(),
    );
    if (!courseProgress) return null;

    const themeProgress = courseProgress.themesProgress.find(
      (t) => t.themeId.toString() === theme._id.toString(),
    );
    if (!themeProgress) return null;

    return (
      themeProgress.lessonsProgress.find(
        (l) => l.lessonId.toString() === lessonId,
      ) || null
    );
  }

  async getUserStats(userId: string): Promise<{
    totalCoursesEnrolled: number;
    totalCoursesCompleted: number;
    totalLessonsCompleted: number;
    currentStreak: number;
    longestStreak: number;
    totalTimeSpentMinutes: number;
  }> {
    const progress = await this.findProgressByUserId(userId);

    if (!progress) {
      return {
        totalCoursesEnrolled: 0,
        totalCoursesCompleted: 0,
        totalLessonsCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalTimeSpentMinutes: 0,
      };
    }

    return {
      totalCoursesEnrolled: progress.courses.length,
      totalCoursesCompleted: progress.totalCoursesCompleted,
      totalLessonsCompleted: progress.totalLessonsCompleted,
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
      totalTimeSpentMinutes: progress.totalTimeSpent || 0,
    };
  }

  async getRecentActivity(
    userId: string,
    limit: number = 10,
  ): Promise<
    Array<{
      courseId: string;
      lastAccessedAt: Date;
      progressPercentage: number;
    }>
  > {
    const progress = await this.findProgressByUserId(userId);

    if (!progress) return [];

    return progress.courses
      .filter((c) => c.lastAccessedAt)
      .sort(
        (a, b) =>
          new Date(b.lastAccessedAt!).getTime() -
          new Date(a.lastAccessedAt!).getTime(),
      )
      .slice(0, limit)
      .map((c) => ({
        courseId: c.courseId.toString(),
        lastAccessedAt: c.lastAccessedAt!,
        progressPercentage: c.progressPercentage,
      }));
  }

  async updateTimeSpent(
    userId: string,
    lessonId: string,
    seconds: number,
  ): Promise<void> {
    const lesson = await this.lessonModel.findById(lessonId).exec();
    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    const theme = await this.themeModel.findById(lesson.themeId).exec();
    if (!theme) {
      throw new NotFoundException('Tema no encontrado');
    }

    const progress = await this.findProgressByUserId(userId);
    if (!progress) {
      throw new NotFoundException('Progreso no encontrado');
    }

    const courseProgress = progress.courses.find(
      (c) => c.courseId.toString() === theme.courseId.toString(),
    );
    if (!courseProgress) {
      throw new NotFoundException('No estás inscrito en este curso');
    }

    const themeProgress = courseProgress.themesProgress.find(
      (t) => t.themeId.toString() === theme._id.toString(),
    );
    if (!themeProgress) return;

    const lessonProgress = themeProgress.lessonsProgress.find(
      (l) => l.lessonId.toString() === lessonId,
    );
    if (!lessonProgress) return;

    lessonProgress.timeSpent = (lessonProgress.timeSpent || 0) + seconds;
    progress.totalTimeSpent = (progress.totalTimeSpent || 0) + seconds;
    courseProgress.lastAccessedAt = new Date();

    await progress.save();
  }

  async getSubmissions(
    userId: string,
    lessonId: string,
  ): Promise<LessonProgress | null> {
    return this.getLessonProgress(userId, lessonId);
  }

  async getCourseStats(courseId: string): Promise<{
    totalEnrolled: number;
    averageProgress: number;
    completionRate: number;
  }> {
    const enrollments = await this.progressModel
      .find({ 'courses.courseId': new Types.ObjectId(courseId) })
      .exec();

    if (enrollments.length === 0) {
      return {
        totalEnrolled: 0,
        averageProgress: 0,
        completionRate: 0,
      };
    }

    let totalProgress = 0;
    let completedCount = 0;

    enrollments.forEach((enrollment) => {
      const courseProgress = enrollment.courses.find(
        (c) => c.courseId.toString() === courseId,
      );
      if (courseProgress) {
        totalProgress += courseProgress.progressPercentage;
        if (courseProgress.status === ProgressStatus.COMPLETED) {
          completedCount++;
        }
      }
    });

    return {
      totalEnrolled: enrollments.length,
      averageProgress: Math.round(totalProgress / enrollments.length),
      completionRate: Math.round((completedCount / enrollments.length) * 100),
    };
  }

  async getCourseEnrollments(
    courseId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    enrollments: Array<{
      userId: string;
      enrolledAt: Date;
      progressPercentage: number;
      status: ProgressStatus;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const total = await this.progressModel
      .countDocuments({ 'courses.courseId': new Types.ObjectId(courseId) })
      .exec();

    const enrollments = await this.progressModel
      .find({ 'courses.courseId': new Types.ObjectId(courseId) })
      .skip(skip)
      .limit(limit)
      .exec();

    const mappedEnrollments = enrollments
      .map((enrollment) => {
        const courseProgress = enrollment.courses.find(
          (c) => c.courseId.toString() === courseId,
        );
        if (!courseProgress) return null;

        return {
          userId: enrollment.userId.toString(),
          enrolledAt: courseProgress.enrolledAt,
          progressPercentage: courseProgress.progressPercentage,
          status: courseProgress.status,
        };
      })
      .filter(Boolean) as Array<{
      userId: string;
      enrolledAt: Date;
      progressPercentage: number;
      status: ProgressStatus;
    }>;

    return {
      enrollments: mappedEnrollments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLeaderboard(
    limit: number = 10,
  ): Promise<
    Array<{
      userId: string;
      totalLessonsCompleted: number;
      currentStreak: number;
      longestStreak: number;
    }>
  > {
    const leaders = await this.progressModel
      .find()
      .sort({ totalLessonsCompleted: -1, longestStreak: -1 })
      .limit(limit)
      .exec();

    return leaders.map((p) => ({
      userId: p.userId.toString(),
      totalLessonsCompleted: p.totalLessonsCompleted,
      currentStreak: p.currentStreak,
      longestStreak: p.longestStreak,
    }));
  }

  async getStreak(
    userId: string,
  ): Promise<{ currentStreak: number; longestStreak: number }> {
    const progress = await this.findProgressByUserId(userId);

    if (!progress) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    return {
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
    };
  }

  // ==================== DAILY TASK LIMIT ====================

  /**
   * Verifica si el usuario puede completar más tareas hoy
   * Regla: El límite diario viene de SystemSettings (configurado por admin)
   */
  private async checkDailyLimit(userId: string): Promise<{
    canComplete: boolean;
    tasksCompletedToday: number;
    maxDailyTasks: number;
    message?: string;
  }> {
    // Obtener límite desde configuración del sistema
    const maxDailyTasks = await this.settingsService.getMaxDailyTasks();

    // Si el límite está desactivado (Infinity), siempre puede completar
    if (!isFinite(maxDailyTasks)) {
      return { canComplete: true, tasksCompletedToday: 0, maxDailyTasks: 0 };
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastTaskDate = user.dailyProgress.lastTaskDate
      ? new Date(user.dailyProgress.lastTaskDate)
      : null;

    let tasksToday = user.dailyProgress.tasksCompletedToday;

    // Si el último registro es de otro día, el contador real es 0
    if (lastTaskDate) {
      lastTaskDate.setHours(0, 0, 0, 0);
      if (lastTaskDate.getTime() !== today.getTime()) {
        tasksToday = 0;
      }
    } else {
      tasksToday = 0;
    }

    if (tasksToday >= maxDailyTasks) {
      return {
        canComplete: false,
        tasksCompletedToday: tasksToday,
        maxDailyTasks,
        message: `Has alcanzado tu límite diario de ${maxDailyTasks} tarea(s). Vuelve mañana para continuar tu entrenamiento.`,
      };
    }

    return {
      canComplete: true,
      tasksCompletedToday: tasksToday,
      maxDailyTasks,
    };
  }

  /**
   * Incrementa el contador de tareas diarias del usuario
   */
  private async incrementDailyProgress(userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const user = await this.userModel.findById(userId).exec();
    if (!user) return;

    const lastTaskDate = user.dailyProgress.lastTaskDate
      ? new Date(user.dailyProgress.lastTaskDate)
      : null;

    if (lastTaskDate) {
      lastTaskDate.setHours(0, 0, 0, 0);
      if (lastTaskDate.getTime() !== today.getTime()) {
        // Nuevo día: resetear contador
        user.dailyProgress.tasksCompletedToday = 1;
      } else {
        user.dailyProgress.tasksCompletedToday += 1;
      }
    } else {
      user.dailyProgress.tasksCompletedToday = 1;
    }

    user.dailyProgress.lastTaskDate = today;
    await user.save();
  }

  /**
   * Obtiene el estado del progreso diario del usuario
   */
  async getDailyStatus(userId: string): Promise<DailyStatusResponse> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Obtener límite desde configuración del sistema
    const maxDailyTasks = await this.settingsService.getMaxDailyTasks();
    const limitEnabled = isFinite(maxDailyTasks);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let tasksToday = user.dailyProgress.tasksCompletedToday;
    const lastTaskDate = user.dailyProgress.lastTaskDate
      ? new Date(user.dailyProgress.lastTaskDate)
      : null;

    // Resetear si es nuevo día
    if (lastTaskDate) {
      lastTaskDate.setHours(0, 0, 0, 0);
      if (lastTaskDate.getTime() !== today.getTime()) {
        tasksToday = 0;
      }
    } else {
      tasksToday = 0;
    }

    const remaining = limitEnabled
      ? Math.max(0, maxDailyTasks - tasksToday)
      : Infinity;

    return {
      tasksCompletedToday: tasksToday,
      maxDailyTasks: limitEnabled ? maxDailyTasks : 0,
      tasksRemaining: limitEnabled ? remaining : -1,
      canCompleteMore: !limitEnabled || remaining > 0,
      lastTaskDate: user.dailyProgress.lastTaskDate,
    };
  }

  // ==================== REWARDS INTEGRATION ====================

  /**
   * Otorga recompensas de gamificación al completar contenido
   * Regla: Tokens + XP por lección, bonus por tema/curso, bonus por racha
   */
  private async awardCompletionRewards(
    userId: string,
    lessonId: string,
    theme: Theme,
    themeCompleted: boolean,
    courseCompleted: boolean,
    currentStreak: number,
  ): Promise<{
    tokensEarned: number;
    xpEarned: number;
    streakBonus?: number;
    themeBonus?: number;
    courseBonus?: number;
    leveledUp?: boolean;
    newLevel?: number;
  }> {
    const rewards = {
      tokensEarned: 0,
      xpEarned: 0,
    } as {
      tokensEarned: number;
      xpEarned: number;
      streakBonus?: number;
      themeBonus?: number;
      courseBonus?: number;
      leveledUp?: boolean;
      newLevel?: number;
    };

    try {
      // Capturar nivel antes de otorgar recompensas
      const userBefore = await this.userModel.findById(userId).exec();
      const levelBefore = userBefore?.gamification?.level ?? 1;

      // Recompensa base por completar lección: 10 tokens + 20 XP
      const lessonReward = await this.gamificationService.rewardLessonComplete(
        userId,
        lessonId,
        10,
        20,
      );
      rewards.tokensEarned += lessonReward.amount;
      rewards.xpEarned += lessonReward.xpAmount;

      // Bonus por completar tema: 25 tokens + 50 XP
      if (themeCompleted) {
        const themeReward = await this.gamificationService.grantTokens(
          userId,
          25,
          TransactionType.THEME_COMPLETE,
          `Tema completado: ${theme.title}`,
          {
            referenceType: ReferenceType.THEME,
            referenceId: theme._id.toString(),
            xpAmount: 50,
          },
        );
        rewards.themeBonus = themeReward.amount;
        rewards.tokensEarned += themeReward.amount;
        rewards.xpEarned += themeReward.xpAmount;
      }

      // Bonus por completar curso: 100 tokens + 200 XP
      if (courseCompleted) {
        const courseReward = await this.gamificationService.grantTokens(
          userId,
          100,
          TransactionType.COURSE_COMPLETE,
          'Curso completado',
          {
            referenceType: ReferenceType.COURSE,
            referenceId: theme.courseId.toString(),
            xpAmount: 200,
          },
        );
        rewards.courseBonus = courseReward.amount;
        rewards.tokensEarned += courseReward.amount;
        rewards.xpEarned += courseReward.xpAmount;
      }

      // Bonus por racha cada 3 días: (días/3) * 5 tokens
      if (currentStreak >= 3 && currentStreak % 3 === 0) {
        const streakTokens = Math.floor(currentStreak / 3) * 5;
        const streakReward = await this.gamificationService.rewardStreakBonus(
          userId,
          currentStreak,
          streakTokens,
        );
        rewards.streakBonus = streakReward.amount;
        rewards.tokensEarned += streakReward.amount;
        rewards.xpEarned += streakReward.xpAmount;
      }

      // Verificar si subió de nivel comparando antes vs después
      const userAfter = await this.userModel.findById(userId).exec();
      const levelAfter = userAfter?.gamification?.level ?? levelBefore;
      if (levelAfter > levelBefore) {
        rewards.leveledUp = true;
        rewards.newLevel = levelAfter;
      }
    } catch (error) {
      // No fallar la operación principal si la gamificación falla
      console.error('Error al otorgar recompensas de gamificación:', error);
    }

    return rewards;
  }

  // ==================== AUTO-ADVANCE / NEXT CONTENT ====================

  /**
   * Determina el siguiente contenido después de completar una lección
   * Regla: Siguiente lección en el tema, o primera lección del siguiente tema
   */
  private async getNextContent(
    lessonId: string,
    themeId: string,
    courseId: string,
  ): Promise<{ nextLesson?: string; nextTheme?: string; nextCourse?: string }> {
    // Obtener lecciones del tema actual ordenadas
    const lessons = await this.lessonModel
      .find({ themeId: new Types.ObjectId(themeId) })
      .sort({ order: 1 })
      .exec();

    const currentIndex = lessons.findIndex(
      (l) => l._id.toString() === lessonId,
    );

    // Si hay una lección siguiente en el mismo tema
    if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
      return { nextLesson: lessons[currentIndex + 1]._id.toString() };
    }

    // Tema completado: buscar el siguiente tema del curso
    const themes = await this.themeModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .sort({ order: 1 })
      .exec();

    const themeIndex = themes.findIndex((t) => t._id.toString() === themeId);

    if (themeIndex >= 0 && themeIndex < themes.length - 1) {
      const nextTheme = themes[themeIndex + 1];
      const firstLesson = await this.lessonModel
        .findOne({ themeId: nextTheme._id })
        .sort({ order: 1 })
        .exec();

      return {
        nextTheme: nextTheme._id.toString(),
        nextLesson: firstLesson?._id.toString(),
      };
    }

    // Curso completado: buscar el siguiente curso por displayOrder
    const currentCourse = await this.courseModel.findById(courseId).exec();
    if (currentCourse) {
      const nextCourse = await this.courseModel
        .findOne({
          displayOrder: { $gt: currentCourse.displayOrder },
          status: 'PUBLISHED',
        })
        .sort({ displayOrder: 1 })
        .exec();

      if (nextCourse) {
        // Obtener el primer tema y primera lección del siguiente curso
        const firstTheme = await this.themeModel
          .findOne({ courseId: nextCourse._id })
          .sort({ order: 1 })
          .exec();

        const firstLesson = firstTheme
          ? await this.lessonModel
              .findOne({ themeId: firstTheme._id })
              .sort({ order: 1 })
              .exec()
          : null;

        return {
          nextCourse: nextCourse._id.toString(),
          nextTheme: firstTheme?._id.toString(),
          nextLesson: firstLesson?._id.toString(),
        };
      }
    }

    // Último curso completado, no hay siguiente
    return {};
  }

  // ==================== STARTING POINT ====================

  /**
   * Obtiene el punto de inicio para un usuario (primera lección incompleta)
   * Regla: Seguir el orden secuencial de módulos → temas → lecciones
   */
  async getStartingPoint(
    userId: string,
    courseId?: string,
  ): Promise<StartingPointResponse> {
    const progress = await this.findProgressByUserId(userId);

    if (!progress || progress.courses.length === 0) {
      throw new NotFoundException(
        'No estás inscrito en ningún curso. Inscríbete primero.',
      );
    }

    // Función auxiliar para encontrar la primera lección incompleta en un curso
    const findFirstIncomplete = async (
      cp: CourseProgress,
    ): Promise<StartingPointResponse | null> => {
      for (const tp of cp.themesProgress) {
        if (tp.status === ProgressStatus.COMPLETED) continue;

        for (const lp of tp.lessonsProgress) {
          if (lp.status === ProgressStatus.COMPLETED) continue;

          const [lesson, themeDoc, courseDoc] = await Promise.all([
            this.lessonModel.findById(lp.lessonId).exec(),
            this.themeModel.findById(tp.themeId).exec(),
            this.courseModel.findById(cp.courseId).exec(),
          ]);

          if (lesson && themeDoc && courseDoc) {
            return {
              courseId: cp.courseId.toString(),
              themeId: tp.themeId.toString(),
              lessonId: lp.lessonId.toString(),
              courseName: courseDoc.title,
              themeName: themeDoc.title,
              lessonName: lesson.title,
              themeOrder: themeDoc.order,
              lessonOrder: lesson.order,
            };
          }
        }
      }
      return null;
    };

    // Si se especifica un curso
    if (courseId) {
      const courseProgress = progress.courses.find(
        (c) => c.courseId.toString() === courseId,
      );
      if (!courseProgress) {
        throw new NotFoundException('No estás inscrito en este curso');
      }

      const result = await findFirstIncomplete(courseProgress);
      if (result) return result;

      throw new NotFoundException(
        'Ya has completado todas las lecciones de este curso',
      );
    }

    // Buscar en todos los cursos del usuario (priorizando por último acceso)
    const sortedCourses = [...progress.courses]
      .filter((c) => c.status !== ProgressStatus.COMPLETED)
      .sort((a, b) => {
        const dateA = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
        const dateB = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
        return dateB - dateA;
      });

    for (const cp of sortedCourses) {
      const result = await findFirstIncomplete(cp);
      if (result) return result;
    }

    throw new NotFoundException(
      'No hay lecciones pendientes. ¡Has completado todo tu entrenamiento!',
    );
  }

  // ==================== FULL LESSON STATUS ====================

  /**
   * Obtiene el estado completo de acceso a una lección
   * Combina: acceso al tema + acceso a lección + PRE_QUIZ + POST_QUIZ + límite diario
   */
  async getFullLessonStatus(
    userId: string,
    lessonId: string,
  ): Promise<{
    access: LessonAccessResponse;
    contentStatus: {
      canView: boolean;
      canBypass: boolean;
      preQuiz?: { required: boolean; quizId?: string; hasPassed: boolean; message: string };
      postQuiz?: { required: boolean; quizId?: string; hasPassed: boolean; message: string };
    };
    dailyStatus: DailyStatusResponse;
    lessonProgress: LessonProgress | null;
  }> {
    const [access, contentStatus, dailyStatus, lessonProgress] = await Promise.all([
      this.canAccessLesson(userId, lessonId),
      this.canViewLessonContent(userId, lessonId),
      this.getDailyStatus(userId),
      this.getLessonProgress(userId, lessonId),
    ]);

    return {
      access,
      contentStatus,
      dailyStatus,
      lessonProgress,
    };
  }

  // ==================== DASHBOARD HOME ====================

  /**
   * Obtiene los datos necesarios para el dashboard home
   * Incluye: usuario, cursos en progreso (con populate), próxima tarea, estadísticas
   */
  async getDashboardHome(userId: string): Promise<DashboardHomeResponse> {
    // Obtener usuario con perfil
    const user = await this.userModel.findById(userId).select('profile').exec();
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Obtener progreso del usuario
    const progress = await this.findProgressByUserId(userId);

    // Si no tiene progreso, retornar datos vacíos
    if (!progress || progress.courses.length === 0) {
      return {
        user: {
          firstName: user.profile?.firstName || 'Usuario',
          lastName: user.profile?.lastName || '',
          nickName: user.profile?.nickName,
          avatarUrl: user.profile?.avatarUrl,
        },
        stats: {
          totalProgress: 0,
          coursesEnrolled: 0,
          coursesCompleted: 0,
          lessonsCompleted: 0,
          currentStreak: 0,
          pendingTasks: 0,
          modulesRemaining: 0,
        },
        coursesInProgress: [],
        nextTask: null,
      };
    }

    // Obtener cursos en progreso (no completados) con populate
    const coursesInProgress = progress.courses.filter(
      (c) => c.status !== ProgressStatus.COMPLETED,
    );

    // Obtener IDs de cursos para populate
    const courseIds = coursesInProgress.map((c) => c.courseId);

    // Populate de cursos
    const courses = await this.courseModel
      .find({ _id: { $in: courseIds } })
      .select('title slug level thumbnail')
      .exec();

    // Mapear cursos con su progreso
    const coursesMap = new Map(
      courses.map((c) => [c._id.toString(), c]),
    );

    const mappedCourses = coursesInProgress
      .map((cp) => {
        const course = coursesMap.get(cp.courseId.toString());
        if (!course) return null;

        return {
          id: cp.courseId.toString(),
          title: course.title,
          slug: course.slug,
          level: course.level as string,
          thumbnail: course.thumbnail,
          progress: cp.progressPercentage,
          status: cp.status as string,
          lastAccessedAt: cp.lastAccessedAt,
        };
      })
      .filter((c) => c !== null);

    const dashboardCourses: DashboardCourseItem[] = mappedCourses
      .sort((a, b) => {
        // Ordenar por último acceso (más reciente primero)
        const dateA = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
        const dateB = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 4); // Máximo 4 cursos

    // Obtener próxima tarea
    let nextTask: DashboardNextTask | null = null;
    try {
      const startingPoint = await this.getStartingPoint(userId);
      if (startingPoint) {
        // Obtener descripción de la lección
        const lesson = await this.lessonModel
          .findById(startingPoint.lessonId)
          .select('description slug')
          .exec();

        nextTask = {
          lessonId: startingPoint.lessonId,
          lessonTitle: startingPoint.lessonName,
          lessonSlug: lesson?.slug || '',
          lessonDescription: lesson?.description || '',
          themeId: startingPoint.themeId,
          themeName: startingPoint.themeName,
          courseId: startingPoint.courseId,
          courseName: startingPoint.courseName,
        };
      }
    } catch {
      // Sin próxima tarea disponible
      nextTask = null;
    }

    // Calcular estadísticas
    const totalProgress = progress.courses.length > 0
      ? Math.round(
          progress.courses.reduce((sum, c) => sum + c.progressPercentage, 0) /
            progress.courses.length,
        )
      : 0;

    // Contar lecciones pendientes
    let pendingTasks = 0;
    for (const cp of coursesInProgress) {
      for (const tp of cp.themesProgress) {
        pendingTasks += tp.lessonsProgress.filter(
          (l) => l.status !== ProgressStatus.COMPLETED,
        ).length;
      }
    }

    // Calcular módulos restantes para completar nivel (cursos no completados)
    const modulesRemaining = coursesInProgress.length;

    return {
      user: {
        firstName: user.profile?.firstName || 'Usuario',
        lastName: user.profile?.lastName || '',
        nickName: user.profile?.nickName,
        avatarUrl: user.profile?.avatarUrl,
      },
      stats: {
        totalProgress,
        coursesEnrolled: progress.courses.length,
        coursesCompleted: progress.totalCoursesCompleted,
        lessonsCompleted: progress.totalLessonsCompleted,
        currentStreak: progress.currentStreak,
        pendingTasks,
        modulesRemaining,
      },
      coursesInProgress: dashboardCourses,
      nextTask,
    };
  }
}
