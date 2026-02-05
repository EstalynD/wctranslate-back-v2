import { Injectable, NotFoundException } from '@nestjs/common';
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
  MarkLessonCompleteDto,
  ProgressUpdateResponse,
} from './dto/progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(UserProgress.name)
    private progressModel: Model<UserProgressDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Theme.name) private themeModel: Model<ThemeDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
  ) {}

  // ==================== GET PROGRESS ====================

  async getUserProgress(userId: string): Promise<UserProgress> {
    let progress = await this.progressModel.findOne({ userId }).exec();

    if (!progress) {
      // Crear documento de progreso si no existe
      progress = new this.progressModel({
        userId: new Types.ObjectId(userId),
        courses: [],
      });
      await progress.save();
    }

    return progress;
  }

  async getCourseProgress(
    userId: string,
    courseId: string,
  ): Promise<CourseProgress | null> {
    const progress = await this.progressModel.findOne({ userId }).exec();

    if (!progress) return null;

    return (
      progress.courses.find((c) => c.courseId.toString() === courseId) || null
    );
  }

  // ==================== ENROLLMENT ====================

  async enrollInCourse(userId: string, courseId: string): Promise<UserProgress> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    let progress = await this.progressModel.findOne({ userId }).exec();

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
    dto: MarkLessonCompleteDto,
  ): Promise<ProgressUpdateResponse> {
    const lesson = await this.lessonModel.findById(dto.lessonId).exec();
    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    const theme = await this.themeModel.findById(lesson.themeId).exec();
    if (!theme) {
      throw new NotFoundException('Tema no encontrado');
    }

    const progress = await this.progressModel.findOne({ userId }).exec();
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

    // Marcar lección como completada
    lessonProgress.status = ProgressStatus.COMPLETED;
    lessonProgress.completedAt = new Date();

    if (dto.completedBlocks) {
      lessonProgress.completedBlocks = dto.completedBlocks;
    }

    // Actualizar progreso del tema
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

    // Actualizar progreso del curso
    const completedThemes = courseProgress.themesProgress.filter(
      (t) => t.status === ProgressStatus.COMPLETED,
    ).length;
    courseProgress.progressPercentage = Math.round(
      (completedThemes / courseProgress.themesProgress.length) * 100,
    );

    const courseCompleted = courseProgress.progressPercentage === 100;
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

    // Actualizar streak
    await this.updateStreak(progress);

    await progress.save();

    return {
      success: true,
      courseProgress: courseProgress.progressPercentage,
      themeProgress: themeProgress.progressPercentage,
      lessonCompleted: true,
      themeCompleted,
      courseCompleted,
    };
  }

  // ==================== SUBMISSIONS ====================

  async submitExercise(
    userId: string,
    dto: SubmitExerciseDto,
  ): Promise<ProgressUpdateResponse> {
    const progress = await this.progressModel.findOne({ userId }).exec();
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

    // Guardar submission
    lessonProgress.submission = {
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      comment: dto.comment || '',
      submittedAt: new Date(),
      grade: null,
      feedback: null,
    };

    // Marcar como completada (pendiente de calificación)
    lessonProgress.status = ProgressStatus.COMPLETED;
    lessonProgress.completedAt = new Date();

    await progress.save();

    // Recalcular progresos
    return this.markLessonComplete(userId, { lessonId: dto.lessonId });
  }

  async submitQuiz(
    userId: string,
    dto: SubmitQuizDto,
  ): Promise<ProgressUpdateResponse> {
    const progress = await this.progressModel.findOne({ userId }).exec();
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

    if (passed) {
      lessonProgress.status = ProgressStatus.COMPLETED;
      lessonProgress.completedAt = new Date();
    }

    await progress.save();

    if (passed) {
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

  async canAccessLesson(
    userId: string,
    lessonId: string,
  ): Promise<{ canAccess: boolean; reason?: string }> {
    const lesson = await this.lessonModel.findById(lessonId).exec();
    if (!lesson) {
      return { canAccess: false, reason: 'Lección no encontrada' };
    }

    // Si es preview, siempre accesible
    if (lesson.isPreview) {
      return { canAccess: true };
    }

    // Si no requiere completar anterior, accesible
    if (!lesson.requiresPreviousCompletion) {
      return { canAccess: true };
    }

    // Verificar si la lección anterior está completada
    const theme = await this.themeModel.findById(lesson.themeId).exec();
    if (!theme) {
      return { canAccess: false, reason: 'Tema no encontrado' };
    }

    const progress = await this.progressModel.findOne({ userId }).exec();
    if (!progress) {
      return { canAccess: false, reason: 'No estás inscrito' };
    }

    const courseProgress = progress.courses.find(
      (c) => c.courseId.toString() === theme.courseId.toString(),
    );
    if (!courseProgress) {
      return { canAccess: false, reason: 'No estás inscrito en este curso' };
    }

    const themeProgress = courseProgress.themesProgress.find(
      (t) => t.themeId.toString() === theme._id.toString(),
    );
    if (!themeProgress) {
      return { canAccess: false, reason: 'Tema no encontrado en progreso' };
    }

    // Encontrar índice de la lección
    const lessonIndex = themeProgress.lessonsProgress.findIndex(
      (l) => l.lessonId.toString() === lessonId,
    );

    if (lessonIndex === 0) {
      // Primera lección, siempre accesible
      return { canAccess: true };
    }

    const previousLesson = themeProgress.lessonsProgress[lessonIndex - 1];
    if (previousLesson.status === ProgressStatus.COMPLETED) {
      return { canAccess: true };
    }

    return {
      canAccess: false,
      reason: 'Debes completar la lección anterior',
    };
  }

  // ==================== ADDITIONAL METHODS ====================

  async findByUser(userId: string): Promise<UserProgress | null> {
    return this.progressModel.findOne({ userId }).exec();
  }

  async getLessonProgress(
    userId: string,
    lessonId: string,
  ): Promise<LessonProgress | null> {
    const lesson = await this.lessonModel.findById(lessonId).exec();
    if (!lesson) return null;

    const theme = await this.themeModel.findById(lesson.themeId).exec();
    if (!theme) return null;

    const progress = await this.progressModel.findOne({ userId }).exec();
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
    const progress = await this.progressModel.findOne({ userId }).exec();

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
    const progress = await this.progressModel.findOne({ userId }).exec();

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

    const progress = await this.progressModel.findOne({ userId }).exec();
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
    const progress = await this.progressModel.findOne({ userId }).exec();

    if (!progress) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    return {
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
    };
  }
}
