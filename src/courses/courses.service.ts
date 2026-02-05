import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument, CourseStatus } from './schemas/course.schema';
import { Theme, ThemeDocument } from './schemas/theme.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import {
  CreateCourseDto,
  UpdateCourseDto,
  QueryCoursesDto,
  ReorderThemesDto,
} from './dto/course.dto';
import { PlanType } from '../users/schemas/user.schema';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Theme.name) private themeModel: Model<ThemeDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
  ) {}

  // ==================== CRUD OPERATIONS ====================

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    const existingCourse = await this.courseModel.findOne({
      slug: createCourseDto.slug,
    });

    if (existingCourse) {
      throw new BadRequestException('Ya existe un curso con ese slug');
    }

    const course = new this.courseModel(createCourseDto);
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

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
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
}
