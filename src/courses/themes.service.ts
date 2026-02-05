import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Theme, ThemeDocument } from './schemas/theme.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import { Course, CourseDocument } from './schemas/course.schema';
import {
  CreateThemeDto,
  UpdateThemeDto,
  ReorderLessonsDto,
} from './dto/theme.dto';

@Injectable()
export class ThemesService {
  constructor(
    @InjectModel(Theme.name) private themeModel: Model<ThemeDocument>,
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  // ==================== CRUD OPERATIONS ====================

  async create(createThemeDto: CreateThemeDto): Promise<Theme> {
    // Verificar que el curso existe
    const course = await this.courseModel.findById(createThemeDto.courseId).exec();
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    // Verificar slug único
    const existingTheme = await this.themeModel.findOne({
      slug: createThemeDto.slug,
    });
    if (existingTheme) {
      throw new BadRequestException('Ya existe un tema con ese slug');
    }

    // Obtener el siguiente orden si no se especifica
    if (createThemeDto.order === undefined) {
      const lastTheme = await this.themeModel
        .findOne({ courseId: createThemeDto.courseId })
        .sort({ order: -1 })
        .exec();
      createThemeDto.order = lastTheme ? lastTheme.order + 1 : 0;
    }

    const theme = new this.themeModel(createThemeDto);
    const savedTheme = await theme.save();

    // Agregar al array de temas del curso
    await this.courseModel.findByIdAndUpdate(createThemeDto.courseId, {
      $push: { themes: savedTheme._id },
    });

    return savedTheme;
  }

  async findAll(courseId?: string): Promise<Theme[]> {
    const filter = courseId ? { courseId: new Types.ObjectId(courseId) } : {};
    return this.themeModel.find(filter).sort({ order: 1 }).exec();
  }

  async findOne(id: string): Promise<Theme> {
    const theme = await this.themeModel.findById(id).exec();

    if (!theme) {
      throw new NotFoundException('Tema no encontrado');
    }

    return theme;
  }

  async findBySlug(slug: string): Promise<Theme> {
    const theme = await this.themeModel.findOne({ slug }).exec();

    if (!theme) {
      throw new NotFoundException('Tema no encontrado');
    }

    return theme;
  }

  async findWithLessons(id: string): Promise<Theme & { lessons: Lesson[] }> {
    const theme = await this.themeModel
      .findById(id)
      .populate({
        path: 'lessons',
        options: { sort: { order: 1 } },
      })
      .exec();

    if (!theme) {
      throw new NotFoundException('Tema no encontrado');
    }

    return theme as unknown as Theme & { lessons: Lesson[] };
  }

  async update(id: string, updateThemeDto: UpdateThemeDto): Promise<Theme> {
    const theme = await this.themeModel
      .findByIdAndUpdate(id, { $set: updateThemeDto }, { new: true })
      .exec();

    if (!theme) {
      throw new NotFoundException('Tema no encontrado');
    }

    return theme;
  }

  async remove(id: string): Promise<void> {
    const theme = await this.themeModel.findById(id).exec();

    if (!theme) {
      throw new NotFoundException('Tema no encontrado');
    }

    // Eliminar lecciones asociadas
    await this.lessonModel.deleteMany({ themeId: id });

    // Remover del array de temas del curso
    await this.courseModel.findByIdAndUpdate(theme.courseId, {
      $pull: { themes: theme._id },
    });

    await this.themeModel.findByIdAndDelete(id);
  }

  // ==================== LESSONS MANAGEMENT ====================

  async addLesson(themeId: string, lessonId: Types.ObjectId): Promise<Theme> {
    const theme = await this.themeModel
      .findByIdAndUpdate(
        themeId,
        { $addToSet: { lessons: lessonId } },
        { new: true },
      )
      .exec();

    if (!theme) {
      throw new NotFoundException('Tema no encontrado');
    }

    // Actualizar estadísticas
    await this.updateThemeStats(themeId);

    return theme;
  }

  async removeLesson(themeId: string, lessonId: string): Promise<Theme> {
    const theme = await this.themeModel
      .findByIdAndUpdate(
        themeId,
        { $pull: { lessons: new Types.ObjectId(lessonId) } },
        { new: true },
      )
      .exec();

    if (!theme) {
      throw new NotFoundException('Tema no encontrado');
    }

    // Actualizar estadísticas
    await this.updateThemeStats(themeId);

    return theme;
  }

  async reorderLessons(
    themeId: string,
    reorderDto: ReorderLessonsDto,
  ): Promise<Theme> {
    const theme = await this.themeModel.findById(themeId).exec();

    if (!theme) {
      throw new NotFoundException('Tema no encontrado');
    }

    // Actualizar el orden de cada lección
    const updatePromises = reorderDto.lessonIds.map((lessonId, index) =>
      this.lessonModel.findByIdAndUpdate(lessonId, { order: index }),
    );

    await Promise.all(updatePromises);

    // Actualizar array de lecciones en el tema
    theme.lessons = reorderDto.lessonIds.map((id) => new Types.ObjectId(id));
    await theme.save();

    return theme;
  }

  // ==================== STATISTICS ====================

  async updateThemeStats(themeId: string): Promise<void> {
    const lessons = await this.lessonModel.find({ themeId }).exec();

    const totalDurationMinutes = lessons.reduce(
      (acc, lesson) => acc + (lesson.durationMinutes || 0),
      0,
    );

    await this.themeModel.findByIdAndUpdate(themeId, {
      totalLessons: lessons.length,
      totalDurationMinutes,
    });
  }

  // ==================== COURSE THEMES ====================

  async getByCourse(courseId: string): Promise<Theme[]> {
    return this.themeModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .sort({ order: 1 })
      .exec();
  }
}
