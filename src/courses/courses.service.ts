import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument, CourseStatus, CourseType } from './schemas/course.schema';
import { Theme, ThemeDocument } from './schemas/theme.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import { UserProgress, UserProgressDocument, ProgressStatus } from './schemas/user-progress.schema';
import {
  CreateCourseDto,
  UpdateCourseDto,
  QueryCoursesDto,
  ReorderThemesDto,
} from './dto/course.dto';
import { PlanType, UserRole, UserDocument } from '../users/schemas/user.schema';
import { CloudinaryService } from '../cloudinary';
import { Platform, PlatformDocument } from '../platforms/schemas/platform.schema';

// Interfaz para cursos con estado de bloqueo
export interface CourseWithLockStatus extends Course {
  isLocked: boolean;
  lockReason?: string;
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Theme.name) private themeModel: Model<ThemeDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(Platform.name) private platformModel: Model<PlatformDocument>,
    @InjectModel(UserProgress.name) private progressModel: Model<UserProgressDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ==================== CRUD OPERATIONS ====================

  async create(
    createCourseDto: CreateCourseDto,
    file?: Express.Multer.File,
  ): Promise<Course> {
    const existingCourse = await this.courseModel.findOne({
      slug: createCourseDto.slug,
    });

    if (existingCourse) {
      throw new BadRequestException('Ya existe un curso con ese slug');
    }

    // Subir imagen a Cloudinary si se proporciona
    let thumbnailUrl: string | null = null;
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(file, {
        folder: 'wctraining/courses',
        resourceType: 'image',
      });
      thumbnailUrl = uploadResult.secureUrl;
    }

    const course = new this.courseModel({
      ...createCourseDto,
      thumbnail: thumbnailUrl || createCourseDto.thumbnail || null,
    });
    return course.save();
  }

  async findAll(query: QueryCoursesDto): Promise<{
    courses: Course[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { status, category, level, plan, isFeatured, page = 1, limit = 10 } = query;

    const filter: Record<string, any> = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (plan) filter.allowedPlans = plan;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      this.courseModel
        .find(filter)
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.courseModel.countDocuments(filter),
    ]);

    return {
      courses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.courseModel.findById(id).exec();

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    return course;
  }

  async findBySlug(slug: string): Promise<Course> {
    const course = await this.courseModel.findOne({ slug }).exec();

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    return course;
  }

  async findWithThemes(id: string): Promise<Course & { themes: Theme[] }> {
    const course = await this.courseModel
      .findById(id)
      .populate({
        path: 'themes',
        options: { sort: { order: 1 } },
      })
      .exec();

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    return course as unknown as Course & { themes: Theme[] };
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    file?: Express.Multer.File,
  ): Promise<Course> {
    // Subir nueva imagen si se proporciona
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(file, {
        folder: 'wctraining/courses',
        resourceType: 'image',
      });
      updateCourseDto.thumbnail = uploadResult.secureUrl;
    }

    const course = await this.courseModel
      .findByIdAndUpdate(id, { $set: updateCourseDto }, { new: true })
      .exec();

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    return course;
  }

  async remove(id: string): Promise<void> {
    const course = await this.courseModel.findById(id).exec();

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    // Eliminar temas y lecciones asociadas
    const themes = await this.themeModel.find({ courseId: id }).exec();
    const themeIds = themes.map((t) => t._id);

    await this.lessonModel.deleteMany({ themeId: { $in: themeIds } });
    await this.themeModel.deleteMany({ courseId: id });
    await this.courseModel.findByIdAndDelete(id);
  }

  // ==================== THEMES MANAGEMENT ====================

  async addTheme(courseId: string, themeId: Types.ObjectId): Promise<Course> {
    const course = await this.courseModel
      .findByIdAndUpdate(
        courseId,
        { $addToSet: { themes: themeId } },
        { new: true },
      )
      .exec();

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    return course;
  }

  async removeTheme(courseId: string, themeId: string): Promise<Course> {
    const course = await this.courseModel
      .findByIdAndUpdate(
        courseId,
        { $pull: { themes: new Types.ObjectId(themeId) } },
        { new: true },
      )
      .exec();

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    return course;
  }

  async reorderThemes(
    courseId: string,
    reorderDto: ReorderThemesDto,
  ): Promise<Course> {
    const course = await this.courseModel.findById(courseId).exec();

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    // Actualizar el orden de cada tema
    const updatePromises = reorderDto.themeIds.map((themeId, index) =>
      this.themeModel.findByIdAndUpdate(themeId, { order: index }),
    );

    await Promise.all(updatePromises);

    // Actualizar array de temas en el curso
    course.themes = reorderDto.themeIds.map((id) => new Types.ObjectId(id));
    await course.save();

    return course;
  }

  // ==================== STATISTICS ====================

  async updateCourseStats(courseId: string): Promise<void> {
    const themes = await this.themeModel.find({ courseId }).exec();
    const themeIds = themes.map((t) => t._id);

    const lessons = await this.lessonModel.find({ themeId: { $in: themeIds } }).exec();

    const totalDurationMinutes = lessons.reduce(
      (acc, lesson) => acc + (lesson.durationMinutes || 0),
      0,
    );

    await this.courseModel.findByIdAndUpdate(courseId, {
      totalLessons: lessons.length,
      totalDurationMinutes,
    });
  }

  // ==================== ACCESS CONTROL ====================

  async canUserAccess(courseId: string, userPlan: PlanType): Promise<boolean> {
    const course = await this.courseModel.findById(courseId).exec();

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    // Verificar si el plan del usuario está en los planes permitidos
    return course.allowedPlans.includes(userPlan);
  }

  async getAccessibleCourses(userPlan: PlanType): Promise<Course[]> {
    return this.courseModel
      .find({
        status: CourseStatus.PUBLISHED,
        allowedPlans: userPlan,
      })
      .sort({ displayOrder: 1 })
      .exec();
  }

  // ==================== CURSOS POR PLATAFORMA (REGLA DE NEGOCIO) ====================

  /**
   * Obtiene los IDs de cursos completados por el usuario
   */
  private async getCompletedCourseIds(userId: string): Promise<Set<string>> {
    const progress = await this.progressModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!progress) {
      return new Set();
    }

    const completedIds = progress.courses
      .filter((c) => c.status === ProgressStatus.COMPLETED)
      .map((c) => c.courseId.toString());

    return new Set(completedIds);
  }

  /**
   * Obtiene los cursos ordenados según la regla:
   * - Si la modelo tiene plataforma específica → Todos los cursos EXCEPTO "General":
   *   - Su módulo de plataforma desbloqueado (y primero)
   *   - Los demás cursos bloqueados
   * - Si la modelo es general (sin plataforma) → TODOS los módulos:
   *   - Módulo "General" siempre desbloqueado
   *   - Los demás módulos bloqueados hasta completar el anterior (por displayOrder)
   * - Admin/Studio → retorna lista vacía (no tienen cursos)
   */
  async getCoursesForUser(user: UserDocument): Promise<{
    platformCourses: CourseWithLockStatus[];
    generalCourses: CourseWithLockStatus[];
    allCourses: CourseWithLockStatus[];
  }> {
    // Usuarios administrativos no tienen cursos asignados
    if (user.role === UserRole.ADMIN || user.role === UserRole.STUDIO) {
      return {
        platformCourses: [],
        generalCourses: [],
        allCourses: [],
      };
    }

    const userPlan = user.subscriptionAccess?.planType || PlanType.TESTER;
    const platformId = user.modelConfig?.platformId || null;

    // Filtro base: solo cursos publicados
    const baseFilter: Record<string, any> = {
      status: CourseStatus.PUBLISHED,
      ...(userPlan === PlanType.FREE ? {} : { allowedPlans: userPlan }),
    };

    // ========== CASO 1: Modelo con plataforma específica ==========
    // Ve todos los cursos EXCEPTO el módulo "General"
    // Solo el de su plataforma está desbloqueado, los demás bloqueados
    if (platformId) {
      // Obtener todos los cursos EXCEPTO el curso "General" (slug: 'general')
      const allCoursesRaw = await this.courseModel
        .find({
          ...baseFilter,
          slug: { $ne: 'general' }, // Excluir solo el curso General
        })
        .sort({ displayOrder: 1 })
        .exec();

      // Convertir a CourseWithLockStatus
      const coursesWithLockStatus: CourseWithLockStatus[] = allCoursesRaw.map(
        (course) => {
          // Solo desbloqueado si es el módulo de su plataforma
          const isUserPlatformModule =
            course.platformId?.toString() === platformId.toString();

          return {
            ...course.toObject(),
            isLocked: !isUserPlatformModule,
            lockReason: isUserPlatformModule
              ? undefined
              : 'Solo tienes acceso al módulo de tu plataforma',
          };
        },
      );

      // Separar para compatibilidad
      const platformCourses = coursesWithLockStatus.filter(
        (c) => c.platformId?.toString() === platformId.toString(),
      );
      const otherCourses = coursesWithLockStatus.filter(
        (c) => c.platformId?.toString() !== platformId.toString(),
      );

      // El módulo de la plataforma del usuario va primero, luego los demás
      const allCoursesSorted = [...platformCourses, ...otherCourses];

      return {
        platformCourses,
        generalCourses: otherCourses,
        allCourses: allCoursesSorted,
      };
    }

    // ========== CASO 2: Modelo general (sin plataforma) ==========
    // Ve TODOS los módulos con sistema de desbloqueo progresivo

    // Obtener TODOS los cursos (generales + módulos de plataforma)
    const allCoursesRaw = await this.courseModel
      .find(baseFilter)
      .sort({ displayOrder: 1 })
      .exec();

    // Obtener cursos completados del usuario
    const completedCourseIds = await this.getCompletedCourseIds(user._id.toString());

    // Aplicar lógica de desbloqueo progresivo
    const coursesWithLockStatus: CourseWithLockStatus[] = [];
    let previousCourseCompleted = true; // El primero siempre está desbloqueado

    for (const course of allCoursesRaw) {
      const courseId = course._id.toString();
      const isCompleted = completedCourseIds.has(courseId);
      const isGeneralCourse = course.courseType === CourseType.GENERAL && course.platformId === null;

      // Determinar si está bloqueado:
      // - El módulo "General" (slug: 'general') siempre desbloqueado
      // - Los demás se desbloquean cuando el anterior está completado
      let isLocked = false;
      let lockReason: string | undefined;

      if (course.slug === 'general') {
        // El curso General siempre está desbloqueado
        isLocked = false;
      } else if (!previousCourseCompleted) {
        // El curso anterior no está completado
        isLocked = true;
        lockReason = 'Completa el módulo anterior para desbloquear';
      }

      coursesWithLockStatus.push({
        ...course.toObject(),
        isLocked,
        lockReason,
      });

      // Actualizar estado para el siguiente curso
      previousCourseCompleted = isCompleted;
    }

    // Separar en categorías para compatibilidad
    const generalCourses = coursesWithLockStatus.filter(
      (c) => c.courseType === CourseType.GENERAL || !c.platformId,
    );
    const platformCourses = coursesWithLockStatus.filter(
      (c) => c.courseType === CourseType.MODULE && c.platformId,
    );

    return {
      platformCourses,
      generalCourses,
      allCourses: coursesWithLockStatus,
    };
  }

  /**
   * Retorna cursos accesibles para el usuario autenticado
   */
  async getMyCoursesForUser(user: UserDocument): Promise<{
    courses: CourseWithLockStatus[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { allCourses } = await this.getCoursesForUser(user);

    const uniqueCourses = Array.from(
      new Map(allCourses.map((course) => [course._id.toString(), course])).values(),
    );

    return {
      courses: uniqueCourses,
      total: uniqueCourses.length,
      page: 1,
      totalPages: 1,
    };
  }
}
