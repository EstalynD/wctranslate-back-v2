import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuizService } from './quiz.service';

// Guards & Decorators
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/schemas/user.schema';

// DTOs
import {
  CreateQuizDto,
  UpdateQuizDto,
  AddQuestionDto,
  UpdateQuestionDto,
  GetQuizzesQueryDto,
} from './dto/quiz.dto';
import {
  StartAttemptDto,
  SubmitAttemptDto,
  SaveProgressDto,
  GetAttemptsQueryDto,
} from './dto/quiz-attempt.dto';

@Controller('quiz')
@UseGuards(AuthGuard, RolesGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // ==================== QUIZ CRUD (Admin) ====================

  /**
   * Crear un nuevo quiz
   * POST /quiz
   */
  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateQuizDto) {
    const quiz = await this.quizService.create(dto);
    return {
      success: true,
      message: 'Quiz creado exitosamente',
      data: quiz,
    };
  }

  /**
   * Obtener todos los quizzes (con filtros)
   * GET /quiz
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query() query: GetQuizzesQueryDto) {
    const { quizzes, total } = await this.quizService.findAll(query);
    return {
      success: true,
      data: quizzes,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
      },
    };
  }

  /**
   * Obtener quiz por ID (admin - con respuestas correctas)
   * GET /quiz/:id
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findById(@Param('id') id: string) {
    const quiz = await this.quizService.findById(id);
    return {
      success: true,
      data: quiz,
    };
  }

  /**
   * Obtener quizzes de una lección
   * GET /quiz/lesson/:lessonId
   */
  @Get('lesson/:lessonId')
  async findByLesson(@Param('lessonId') lessonId: string) {
    const quizzes = await this.quizService.findByLesson(lessonId);
    return {
      success: true,
      data: quizzes,
    };
  }

  /**
   * Actualizar quiz
   * PUT /quiz/:id
   */
  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
    const quiz = await this.quizService.update(id, dto);
    return {
      success: true,
      message: 'Quiz actualizado exitosamente',
      data: quiz,
    };
  }

  /**
   * Eliminar quiz
   * DELETE /quiz/:id
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    await this.quizService.delete(id);
    return {
      success: true,
      message: 'Quiz eliminado exitosamente',
    };
  }

  /**
   * Publicar quiz
   * PATCH /quiz/:id/publish
   */
  @Patch(':id/publish')
  @Roles(UserRole.ADMIN)
  async publish(@Param('id') id: string) {
    const quiz = await this.quizService.publish(id);
    return {
      success: true,
      message: 'Quiz publicado exitosamente',
      data: quiz,
    };
  }

  /**
   * Archivar quiz
   * PATCH /quiz/:id/archive
   */
  @Patch(':id/archive')
  @Roles(UserRole.ADMIN)
  async archive(@Param('id') id: string) {
    const quiz = await this.quizService.archive(id);
    return {
      success: true,
      message: 'Quiz archivado exitosamente',
      data: quiz,
    };
  }

  // ==================== QUESTION MANAGEMENT (Admin) ====================

  /**
   * Agregar pregunta al quiz
   * POST /quiz/:id/questions
   */
  @Post(':id/questions')
  @Roles(UserRole.ADMIN)
  async addQuestion(@Param('id') quizId: string, @Body() dto: AddQuestionDto) {
    const quiz = await this.quizService.addQuestion(quizId, dto);
    return {
      success: true,
      message: 'Pregunta agregada exitosamente',
      data: quiz,
    };
  }

  /**
   * Actualizar pregunta
   * PUT /quiz/:quizId/questions/:questionId
   */
  @Put(':quizId/questions/:questionId')
  @Roles(UserRole.ADMIN)
  async updateQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    const quiz = await this.quizService.updateQuestion(quizId, questionId, dto);
    return {
      success: true,
      message: 'Pregunta actualizada exitosamente',
      data: quiz,
    };
  }

  /**
   * Eliminar pregunta
   * DELETE /quiz/:quizId/questions/:questionId
   */
  @Delete(':quizId/questions/:questionId')
  @Roles(UserRole.ADMIN)
  async deleteQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
  ) {
    const quiz = await this.quizService.deleteQuestion(quizId, questionId);
    return {
      success: true,
      message: 'Pregunta eliminada exitosamente',
      data: quiz,
    };
  }

  /**
   * Reordenar preguntas
   * PATCH /quiz/:id/questions/reorder
   */
  @Patch(':id/questions/reorder')
  @Roles(UserRole.ADMIN)
  async reorderQuestions(
    @Param('id') quizId: string,
    @Body('questionIds') questionIds: string[],
  ) {
    const quiz = await this.quizService.reorderQuestions(quizId, questionIds);
    return {
      success: true,
      message: 'Preguntas reordenadas exitosamente',
      data: quiz,
    };
  }

  // ==================== STUDENT ENDPOINTS ====================

  /**
   * Obtener quiz para estudiante (sin respuestas correctas)
   * GET /quiz/:id/student
   */
  @Get(':id/student')
  async getQuizForStudent(
    @Param('id') quizId: string,
    @CurrentUser('_id') userId: string,
  ) {
    const quiz = await this.quizService.getQuizForStudent(quizId, userId);
    return {
      success: true,
      data: quiz,
    };
  }

  /**
   * Verificar si puede iniciar un intento
   * GET /quiz/:id/can-start
   */
  @Get(':id/can-start')
  async canStartAttempt(
    @Param('id') quizId: string,
    @CurrentUser('_id') userId: string,
  ) {
    const result = await this.quizService.canStartAttempt(userId, quizId);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Iniciar un intento de quiz
   * POST /quiz/attempts/start
   */
  @Post('attempts/start')
  async startAttempt(
    @CurrentUser('_id') userId: string,
    @Body() dto: StartAttemptDto,
  ) {
    const attempt = await this.quizService.startAttempt(userId, dto);
    const quiz = await this.quizService.getQuizForStudent(dto.quizId, userId);

    return {
      success: true,
      message: 'Intento iniciado',
      data: {
        attemptId: attempt._id.toString(),
        quizId: attempt.quizId.toString(),
        attemptNumber: attempt.attemptNumber,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        questionOrder: attempt.questionOrder,
        quiz,
      },
    };
  }

  /**
   * Guardar progreso del intento (sin enviar)
   * PATCH /quiz/attempts/:attemptId/progress
   */
  @Patch('attempts/:attemptId/progress')
  async saveProgress(
    @CurrentUser('_id') userId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: SaveProgressDto,
  ) {
    const attempt = await this.quizService.saveProgress(userId, attemptId, dto);
    return {
      success: true,
      message: 'Progreso guardado',
      data: {
        attemptId: attempt._id.toString(),
        answersCount: attempt.answers.length,
      },
    };
  }

  /**
   * Enviar intento completado
   * POST /quiz/attempts/:attemptId/submit
   */
  @Post('attempts/:attemptId/submit')
  async submitAttempt(
    @CurrentUser('_id') userId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    const attempt = await this.quizService.submitAttempt(userId, attemptId, dto);
    const quiz = await this.quizService.findById(attempt.quizId.toString());

    // Preparar respuesta según configuración del quiz
    const response: Record<string, unknown> = {
      attemptId: attempt._id.toString(),
      status: attempt.status,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      passed: attempt.passed,
      totalTimeSeconds: attempt.totalTimeSeconds,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      summary: attempt.summary,
    };

    // Recompensas
    if (attempt.passed) {
      response.rewards = {
        tokensEarned: attempt.tokensEarned,
        xpEarned: attempt.xpEarned,
        isFirstPass: attempt.attemptNumber === 1 && attempt.passed,
        isPerfectScore: attempt.percentage === 100,
      };
    }

    // Feedback según configuración
    if (quiz.settings.showCorrectAnswers || quiz.settings.showExplanations) {
      response.feedback = {
        message: attempt.passed
          ? quiz.settings.preQuizBehavior?.congratsMessageOnPass ||
            '¡Felicitaciones! Has aprobado el quiz.'
          : quiz.settings.postQuizBehavior?.retryMessageOnFail ||
            quiz.settings.preQuizBehavior?.motivationalMessageOnFail ||
            'No te preocupes, puedes intentarlo de nuevo.',
      };

      if (quiz.settings.showCorrectAnswers) {
        response.correctAnswers = quiz.questions.map((q) => ({
          questionId: q.id,
          correctOptionIds: q.options?.filter((o) => o.isCorrect).map((o) => o.id),
          correctAnswers: q.correctAnswers,
          correctOrder: q.correctOrder,
          matchingPairs: q.matchingPairs,
        }));
      }

      if (quiz.settings.showExplanations) {
        response.explanations = quiz.questions.map((q) => ({
          questionId: q.id,
          explanation: q.explanation,
        }));
      }
    }

    // Info para reintentar
    const canRetry = await this.quizService.canStartAttempt(userId, quiz._id.toString());
    response.retryInfo = {
      canRetry: canRetry.canStart,
      attemptsRemaining: quiz.settings.maxAttempts > 0
        ? quiz.settings.maxAttempts - canRetry.attemptsUsed
        : null,
      cooldownEndsAt: canRetry.cooldownEndsAt,
    };

    return {
      success: true,
      message: attempt.passed ? '¡Quiz completado exitosamente!' : 'Quiz completado',
      data: response,
    };
  }

  /**
   * Abandonar intento
   * POST /quiz/attempts/:attemptId/abandon
   */
  @Post('attempts/:attemptId/abandon')
  async abandonAttempt(
    @CurrentUser('_id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    const attempt = await this.quizService.abandonAttempt(userId, attemptId);
    return {
      success: true,
      message: 'Intento abandonado',
      data: {
        attemptId: attempt._id.toString(),
        status: attempt.status,
      },
    };
  }

  /**
   * Obtener mis intentos
   * GET /quiz/attempts/me
   */
  @Get('attempts/me')
  async getMyAttempts(
    @CurrentUser('_id') userId: string,
    @Query() query: GetAttemptsQueryDto,
  ) {
    const { attempts, total } = await this.quizService.getUserAttempts(userId, query);
    return {
      success: true,
      data: attempts,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
      },
    };
  }

  /**
   * Obtener detalle de un intento
   * GET /quiz/attempts/:attemptId
   */
  @Get('attempts/:attemptId')
  async getAttemptDetail(
    @CurrentUser('_id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    const attempt = await this.quizService.getAttempt(attemptId);

    // Verificar acceso (admin puede ver todos, usuario solo los suyos)
    if (attempt.userId.toString() !== userId) {
      // Aquí podrías verificar si es admin
      throw new Error('No tienes acceso a este intento');
    }

    return {
      success: true,
      data: attempt,
    };
  }

  /**
   * Obtener historial de quiz para un usuario
   * GET /quiz/:quizId/history
   */
  @Get(':quizId/history')
  async getQuizHistory(
    @CurrentUser('_id') userId: string,
    @Param('quizId') quizId: string,
  ) {
    const history = await this.quizService.getUserQuizHistory(userId, quizId);
    return {
      success: true,
      data: history,
    };
  }

  /**
   * Obtener mejor intento de un quiz
   * GET /quiz/:quizId/best-attempt
   */
  @Get(':quizId/best-attempt')
  async getBestAttempt(
    @CurrentUser('_id') userId: string,
    @Param('quizId') quizId: string,
  ) {
    const bestAttempt = await this.quizService.getUserBestAttempt(userId, quizId);
    return {
      success: true,
      data: bestAttempt,
    };
  }

  // ==================== STATISTICS (Admin) ====================

  /**
   * Obtener estadísticas de un quiz
   * GET /quiz/:id/statistics
   */
  @Get(':id/statistics')
  @Roles(UserRole.ADMIN)
  async getStatistics(@Param('id') quizId: string) {
    const stats = await this.quizService.getQuizStatistics(quizId);
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Obtener todos los intentos de un quiz (Admin)
   * GET /quiz/:id/all-attempts
   */
  @Get(':id/all-attempts')
  @Roles(UserRole.ADMIN)
  async getAllAttempts(
    @Param('id') quizId: string,
    @Query() query: GetAttemptsQueryDto,
  ) {
    const { attempts, total } = await this.quizService.getUserAttempts('', {
      ...query,
      quizId,
    });
    return {
      success: true,
      data: attempts,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
      },
    };
  }
}
