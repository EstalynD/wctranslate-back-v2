import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Schemas
import {
  LessonRating,
  LessonRatingDocument,
} from './schemas/lesson-rating.schema';

// DTOs
import {
  CreateLessonRatingDto,
  UpdateLessonRatingDto,
  AdminReviewDto,
  RatingQueryDto,
  LessonRatingStatsDto,
} from './dto/rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectModel(LessonRating.name)
    private ratingModel: Model<LessonRatingDocument>,
  ) {}

  // ==================== CRUD ====================

  /**
   * Crear una nueva calificación
   */
  async create(
    userId: string,
    createRatingDto: CreateLessonRatingDto,
  ): Promise<LessonRatingDocument> {
    // Verificar si ya existe una calificación del usuario para esta lección
    const existing = await this.ratingModel.findOne({
      userId: new Types.ObjectId(userId),
      lessonId: new Types.ObjectId(createRatingDto.lessonId),
    });

    if (existing) {
      throw new ConflictException(
        'Ya has calificado esta lección. Puedes actualizar tu calificación existente.',
      );
    }

    const rating = new this.ratingModel({
      ...createRatingDto,
      userId: new Types.ObjectId(userId),
      lessonId: new Types.ObjectId(createRatingDto.lessonId),
      courseId: new Types.ObjectId(createRatingDto.courseId),
      themeId: createRatingDto.themeId
        ? new Types.ObjectId(createRatingDto.themeId)
        : undefined,
    });

    return rating.save();
  }

  /**
   * Obtener calificaciones con filtros
   */
  async findAll(query: RatingQueryDto): Promise<LessonRatingDocument[]> {
    const filter: any = {};

    if (query.lessonId) {
      filter.lessonId = new Types.ObjectId(query.lessonId);
    }

    if (query.courseId) {
      filter.courseId = new Types.ObjectId(query.courseId);
    }

    if (query.themeId) {
      filter.themeId = new Types.ObjectId(query.themeId);
    }

    if (query.userId) {
      filter.userId = new Types.ObjectId(query.userId);
    }

    if (query.isReviewed !== undefined) {
      filter.isReviewed = query.isReviewed;
    }

    if (query.minStars) {
      filter.averageStars = { $gte: query.minStars };
    }

    if (query.maxStars) {
      filter.averageStars = {
        ...filter.averageStars,
        $lte: query.maxStars,
      };
    }

    // Ordenamiento
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };

    let queryBuilder = this.ratingModel.find(filter).sort(sort);

    if (query.skip) {
      queryBuilder = queryBuilder.skip(query.skip);
    }

    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    return queryBuilder
      .populate('userId', 'profile.displayName profile.avatarUrl')
      .populate('lessonId', 'title')
      .exec();
  }

  /**
   * Obtener una calificación por ID
   */
  async findById(id: string): Promise<LessonRatingDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de calificación inválido');
    }

    const rating = await this.ratingModel
      .findById(id)
      .populate('userId', 'profile.displayName profile.avatarUrl')
      .populate('lessonId', 'title')
      .exec();

    if (!rating) {
      throw new NotFoundException(`Calificación con ID ${id} no encontrada`);
    }

    return rating;
  }

  /**
   * Obtener calificación del usuario para una lección
   */
  async findUserRating(
    userId: string,
    lessonId: string,
  ): Promise<LessonRatingDocument | null> {
    return this.ratingModel
      .findOne({
        userId: new Types.ObjectId(userId),
        lessonId: new Types.ObjectId(lessonId),
      })
      .exec();
  }

  /**
   * Actualizar una calificación
   */
  async update(
    id: string,
    userId: string,
    updateRatingDto: UpdateLessonRatingDto,
  ): Promise<LessonRatingDocument> {
    const rating = await this.findById(id);

    // Verificar que el usuario es el propietario
    if (rating.userId.toString() !== userId) {
      throw new BadRequestException('No tienes permiso para editar esta calificación');
    }

    Object.assign(rating, updateRatingDto);
    return rating.save();
  }

  /**
   * Eliminar una calificación
   */
  async delete(id: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const rating = await this.findById(id);

    // Solo el propietario o un admin puede eliminar
    if (!isAdmin && rating.userId.toString() !== userId) {
      throw new BadRequestException('No tienes permiso para eliminar esta calificación');
    }

    await this.ratingModel.findByIdAndDelete(id);
  }

  // ==================== ADMIN ====================

  /**
   * Revisar una calificación (admin)
   */
  async reviewRating(
    id: string,
    adminId: string,
    reviewDto: AdminReviewDto,
  ): Promise<LessonRatingDocument> {
    const rating = await this.findById(id);

    rating.isReviewed = reviewDto.isReviewed;
    rating.adminResponse = reviewDto.adminResponse;
    rating.reviewedAt = new Date();
    rating.reviewedBy = new Types.ObjectId(adminId);

    return rating.save();
  }

  /**
   * Obtener calificaciones pendientes de revisión
   */
  async getPendingReviews(): Promise<LessonRatingDocument[]> {
    return this.ratingModel
      .find({ isReviewed: false })
      .sort({ createdAt: -1 })
      .populate('userId', 'profile.displayName')
      .populate('lessonId', 'title')
      .exec();
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtener estadísticas de una lección
   */
  async getLessonStats(lessonId: string): Promise<LessonRatingStatsDto> {
    const stats = await this.ratingModel.aggregate([
      { $match: { lessonId: new Types.ObjectId(lessonId) } },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          avgUnderstanding: { $avg: '$understandingStars' },
          avgUsefulness: { $avg: '$usefulnessStars' },
          avgDifficulty: { $avg: '$difficultyStars' },
          avgEngagement: { $avg: '$engagementStars' },
          avgOverall: { $avg: '$averageStars' },
          ratings: { $push: '$averageStars' },
          allTags: { $push: '$tags' },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        lessonId,
        totalRatings: 0,
        averageUnderstanding: 0,
        averageUsefulness: 0,
        overallAverage: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        commonTags: [],
      };
    }

    const data = stats[0];

    // Calcular distribución
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.ratings.forEach((r: number) => {
      const rounded = Math.round(r);
      if (rounded >= 1 && rounded <= 5) {
        distribution[rounded as keyof typeof distribution]++;
      }
    });

    // Calcular tags comunes
    const tagCounts: Record<string, number> = {};
    data.allTags.flat().forEach((tag: string) => {
      if (tag) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    });

    const commonTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      lessonId,
      totalRatings: data.totalRatings,
      averageUnderstanding: Math.round(data.avgUnderstanding * 10) / 10,
      averageUsefulness: Math.round(data.avgUsefulness * 10) / 10,
      averageDifficulty: data.avgDifficulty
        ? Math.round(data.avgDifficulty * 10) / 10
        : undefined,
      averageEngagement: data.avgEngagement
        ? Math.round(data.avgEngagement * 10) / 10
        : undefined,
      overallAverage: Math.round(data.avgOverall * 10) / 10,
      distribution,
      commonTags,
    };
  }

  /**
   * Obtener estadísticas de un curso completo
   */
  async getCourseStats(courseId: string): Promise<{
    totalRatings: number;
    averageRating: number;
    lessonStats: LessonRatingStatsDto[];
  }> {
    const overallStats = await this.ratingModel.aggregate([
      { $match: { courseId: new Types.ObjectId(courseId) } },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          avgRating: { $avg: '$averageStars' },
        },
      },
    ]);

    const lessonIds = await this.ratingModel.distinct('lessonId', {
      courseId: new Types.ObjectId(courseId),
    });

    const lessonStats = await Promise.all(
      lessonIds.map((id) => this.getLessonStats(id.toString())),
    );

    return {
      totalRatings: overallStats[0]?.totalRatings || 0,
      averageRating:
        Math.round((overallStats[0]?.avgRating || 0) * 10) / 10,
      lessonStats,
    };
  }

  /**
   * Obtener top lecciones mejor calificadas
   */
  async getTopRatedLessons(
    limit: number = 10,
  ): Promise<{ lessonId: string; averageRating: number; totalRatings: number }[]> {
    const result = await this.ratingModel.aggregate([
      {
        $group: {
          _id: '$lessonId',
          avgRating: { $avg: '$averageStars' },
          totalRatings: { $sum: 1 },
        },
      },
      { $match: { totalRatings: { $gte: 3 } } }, // Mínimo 3 calificaciones
      { $sort: { avgRating: -1 } },
      { $limit: limit },
    ]);

    return result.map((r) => ({
      lessonId: r._id.toString(),
      averageRating: Math.round(r.avgRating * 10) / 10,
      totalRatings: r.totalRatings,
    }));
  }

  /**
   * Obtener lecciones con peores calificaciones (para mejorar)
   */
  async getLowRatedLessons(
    limit: number = 10,
  ): Promise<{ lessonId: string; averageRating: number; totalRatings: number }[]> {
    const result = await this.ratingModel.aggregate([
      {
        $group: {
          _id: '$lessonId',
          avgRating: { $avg: '$averageStars' },
          totalRatings: { $sum: 1 },
        },
      },
      { $match: { totalRatings: { $gte: 3 } } },
      { $sort: { avgRating: 1 } },
      { $limit: limit },
    ]);

    return result.map((r) => ({
      lessonId: r._id.toString(),
      averageRating: Math.round(r.avgRating * 10) / 10,
      totalRatings: r.totalRatings,
    }));
  }
}
