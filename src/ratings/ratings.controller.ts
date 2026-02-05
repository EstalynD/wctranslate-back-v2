import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';

// Guards
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/schemas/user.schema';

// Service
import { RatingsService } from './ratings.service';

// DTOs
import {
  CreateLessonRatingDto,
  UpdateLessonRatingDto,
  AdminReviewDto,
  RatingQueryDto,
} from './dto/rating.dto';

@Controller('ratings')
@UseGuards(AuthGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  // ==================== USUARIO ====================

  /**
   * POST /api/ratings - Crear una nueva calificación
   */
  @Post()
  async create(
    @CurrentUser('_id') userId: string,
    @Body() createRatingDto: CreateLessonRatingDto,
  ) {
    const rating = await this.ratingsService.create(userId, createRatingDto);
    return {
      success: true,
      message: '¡Gracias por tu feedback!',
      data: rating,
    };
  }

  /**
   * GET /api/ratings/my-rating/:lessonId - Obtener mi calificación para una lección
   */
  @Get('my-rating/:lessonId')
  async getMyRating(
    @CurrentUser('_id') userId: string,
    @Param('lessonId') lessonId: string,
  ) {
    const rating = await this.ratingsService.findUserRating(userId, lessonId);
    return {
      success: true,
      data: rating,
      hasRated: !!rating,
    };
  }

  /**
   * PUT /api/ratings/:id - Actualizar mi calificación
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Body() updateRatingDto: UpdateLessonRatingDto,
  ) {
    const rating = await this.ratingsService.update(id, userId, updateRatingDto);
    return {
      success: true,
      message: 'Calificación actualizada',
      data: rating,
    };
  }

  /**
   * DELETE /api/ratings/:id - Eliminar mi calificación
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    const isAdmin = role === UserRole.ADMIN;
    await this.ratingsService.delete(id, userId, isAdmin);
    return {
      success: true,
      message: 'Calificación eliminada',
    };
  }

  // ==================== PÚBLICOS ====================

  /**
   * GET /api/ratings - Obtener calificaciones con filtros
   */
  @Get()
  async findAll(@Query() query: RatingQueryDto) {
    const ratings = await this.ratingsService.findAll(query);
    return {
      success: true,
      data: ratings,
      count: ratings.length,
    };
  }

  /**
   * GET /api/ratings/lesson/:lessonId/stats - Obtener estadísticas de una lección
   */
  @Get('lesson/:lessonId/stats')
  async getLessonStats(@Param('lessonId') lessonId: string) {
    const stats = await this.ratingsService.getLessonStats(lessonId);
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * GET /api/ratings/course/:courseId/stats - Obtener estadísticas de un curso
   */
  @Get('course/:courseId/stats')
  async getCourseStats(@Param('courseId') courseId: string) {
    const stats = await this.ratingsService.getCourseStats(courseId);
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * GET /api/ratings/top - Obtener top lecciones mejor calificadas
   */
  @Get('top')
  async getTopRated(@Query('limit') limit?: number) {
    const lessons = await this.ratingsService.getTopRatedLessons(limit || 10);
    return {
      success: true,
      data: lessons,
    };
  }

  /**
   * GET /api/ratings/:id - Obtener una calificación por ID
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    const rating = await this.ratingsService.findById(id);
    return {
      success: true,
      data: rating,
    };
  }

  // ==================== ADMIN ====================

  /**
   * GET /api/ratings/admin/pending - Obtener calificaciones pendientes de revisión
   * Solo admins
   */
  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPendingReviews() {
    const ratings = await this.ratingsService.getPendingReviews();
    return {
      success: true,
      data: ratings,
      count: ratings.length,
    };
  }

  /**
   * GET /api/ratings/admin/low-rated - Obtener lecciones con peores calificaciones
   * Solo admins
   */
  @Get('admin/low-rated')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getLowRated(@Query('limit') limit?: number) {
    const lessons = await this.ratingsService.getLowRatedLessons(limit || 10);
    return {
      success: true,
      data: lessons,
    };
  }

  /**
   * PUT /api/ratings/admin/review/:id - Revisar una calificación (admin)
   * Solo admins
   */
  @Put('admin/review/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async reviewRating(
    @Param('id') id: string,
    @CurrentUser('_id') adminId: string,
    @Body() reviewDto: AdminReviewDto,
  ) {
    const rating = await this.ratingsService.reviewRating(id, adminId, reviewDto);
    return {
      success: true,
      message: 'Calificación revisada',
      data: rating,
    };
  }
}
