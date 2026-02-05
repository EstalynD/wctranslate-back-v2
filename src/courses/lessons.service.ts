import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lesson, LessonDocument, LessonStatus } from './schemas/lesson.schema';
import { Theme, ThemeDocument } from './schemas/theme.schema';
import { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto';
import { ThemesService } from './themes.service';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
    @InjectModel(Theme.name) private themeModel: Model<ThemeDocument>,
    private themesService: ThemesService,
  ) {}

  // ==================== CRUD OPERATIONS ====================

  async create(createLessonDto: CreateLessonDto): Promise<Lesson> {
    // Verificar que el tema existe
    const theme = await this.themeModel.findById(createLessonDto.themeId).exec();
    if (!theme) {
      throw new NotFoundException('Tema no encontrado');
    }

    // Verificar slug único
    const existingLesson = await this.lessonModel.findOne({
      slug: createLessonDto.slug,
    });
    if (existingLesson) {
      throw new BadRequestException('Ya existe una lección con ese slug');
    }

    // Obtener el siguiente orden si no se especifica
    if (createLessonDto.order === undefined) {
      const lastLesson = await this.lessonModel
        .findOne({ themeId: createLessonDto.themeId })
        .sort({ order: -1 })
        .exec();
      createLessonDto.order = lastLesson ? lastLesson.order + 1 : 0;
    }

    const lesson = new this.lessonModel(createLessonDto);
    const savedLesson = await lesson.save();

    // Agregar al array de lecciones del tema
    await this.themesService.addLesson(
      createLessonDto.themeId,
      savedLesson._id,
    );

    return savedLesson;
  }

  async findAll(themeId?: string): Promise<Lesson[]> {
    const filter = themeId ? { themeId: new Types.ObjectId(themeId) } : {};
    return this.lessonModel.find(filter).sort({ order: 1 }).exec();
  }

  async findOne(id: string): Promise<Lesson> {
    const lesson = await this.lessonModel.findById(id).exec();

    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    return lesson;
  }

  async findBySlug(slug: string): Promise<Lesson> {
    const lesson = await this.lessonModel.findOne({ slug }).exec();

    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    return lesson;
  }

  async update(id: string, updateLessonDto: UpdateLessonDto): Promise<Lesson> {
    const lesson = await this.lessonModel
      .findByIdAndUpdate(id, { $set: updateLessonDto }, { new: true })
      .exec();

    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    // Actualizar estadísticas del tema
    await this.themesService.updateThemeStats(lesson.themeId.toString());

    return lesson;
  }

  async remove(id: string): Promise<void> {
    const lesson = await this.lessonModel.findById(id).exec();

    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    // Remover del array de lecciones del tema
    await this.themesService.removeLesson(lesson.themeId.toString(), id);

    await this.lessonModel.findByIdAndDelete(id);
  }

  // ==================== CONTENT BLOCKS ====================

  async addContentBlock(
    lessonId: string,
    block: Lesson['contentBlocks'][0],
  ): Promise<Lesson> {
    const lesson = await this.lessonModel.findById(lessonId).exec();

    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    // Asignar orden si no se especifica
    if (block.order === undefined) {
      block.order = lesson.contentBlocks.length;
    }

    lesson.contentBlocks.push(block);
    return lesson.save();
  }

  async updateContentBlock(
    lessonId: string,
    blockIndex: number,
    block: Partial<Lesson['contentBlocks'][0]>,
  ): Promise<Lesson> {
    const lesson = await this.lessonModel.findById(lessonId).exec();

    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    if (blockIndex < 0 || blockIndex >= lesson.contentBlocks.length) {
      throw new BadRequestException('Índice de bloque inválido');
    }

    Object.assign(lesson.contentBlocks[blockIndex], block);
    return lesson.save();
  }

  async removeContentBlock(lessonId: string, blockIndex: number): Promise<Lesson> {
    const lesson = await this.lessonModel.findById(lessonId).exec();

    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    if (blockIndex < 0 || blockIndex >= lesson.contentBlocks.length) {
      throw new BadRequestException('Índice de bloque inválido');
    }

    lesson.contentBlocks.splice(blockIndex, 1);

    // Reordenar bloques restantes
    lesson.contentBlocks.forEach((b, i) => {
      b.order = i;
    });

    return lesson.save();
  }

  async reorderContentBlocks(
    lessonId: string,
    newOrder: number[],
  ): Promise<Lesson> {
    const lesson = await this.lessonModel.findById(lessonId).exec();

    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    if (newOrder.length !== lesson.contentBlocks.length) {
      throw new BadRequestException('El nuevo orden no coincide con la cantidad de bloques');
    }

    const reorderedBlocks = newOrder.map((oldIndex, newIndex) => {
      const block = lesson.contentBlocks[oldIndex];
      block.order = newIndex;
      return block;
    });

    lesson.contentBlocks = reorderedBlocks;
    return lesson.save();
  }

  // ==================== RESOURCES ====================

  async addResource(
    lessonId: string,
    resource: Lesson['resources'][0],
  ): Promise<Lesson> {
    const lesson = await this.lessonModel
      .findByIdAndUpdate(
        lessonId,
        { $push: { resources: resource } },
        { new: true },
      )
      .exec();

    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    return lesson;
  }

  async removeResource(lessonId: string, resourceId: string): Promise<Lesson> {
    const lesson = await this.lessonModel
      .findByIdAndUpdate(
        lessonId,
        { $pull: { resources: { id: resourceId } } },
        { new: true },
      )
      .exec();

    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    return lesson;
  }

  // ==================== THEME LESSONS ====================

  async getByTheme(themeId: string): Promise<Lesson[]> {
    return this.lessonModel
      .find({ themeId: new Types.ObjectId(themeId) })
      .sort({ order: 1 })
      .exec();
  }

  async getPublishedByTheme(themeId: string): Promise<Lesson[]> {
    return this.lessonModel
      .find({
        themeId: new Types.ObjectId(themeId),
        status: LessonStatus.PUBLISHED,
      })
      .sort({ order: 1 })
      .exec();
  }
}
