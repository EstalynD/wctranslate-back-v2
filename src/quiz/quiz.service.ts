import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Schemas
import {
  Quiz,
  QuizDocument,
  QuizType,
  QuizStatus,
  QuestionType,
  QuizQuestion,
  DifficultyLevel,
} from './schemas/quiz.schema';
import {
  QuizAttempt,
  QuizAttemptDocument,
  AttemptStatus,
  QuestionAnswer,
  AttemptSummary,
} from './schemas/quiz-attempt.schema';

// DTOs
import {
  CreateQuizDto,
  UpdateQuizDto,
  AddQuestionDto,
  UpdateQuestionDto,
  GetQuizzesQueryDto,
  QuizQuestionDto,
} from './dto/quiz.dto';
import {
  StartAttemptDto,
  SubmitAttemptDto,
  SubmitAnswerDto,
  SaveProgressDto,
  GetAttemptsQueryDto,
} from './dto/quiz-attempt.dto';

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
    @InjectModel(QuizAttempt.name) private attemptModel: Model<QuizAttemptDocument>,
  ) {}

  // ==================== QUIZ CRUD ====================

  async create(dto: CreateQuizDto): Promise<Quiz> {
    // Procesar preguntas si vienen incluidas
    const questions = dto.questions?.map((q, index) => ({
      ...q,
      id: q.id || uuidv4(),
      order: q.order ?? index,
      difficulty: q.difficulty || DifficultyLevel.MEDIUM,
      isRequired: q.isRequired ?? true,
      partialCredit: q.partialCredit ?? false,
    })) || [];

    const quiz = new this.quizModel({
      ...dto,
      lessonId: dto.lessonId ? new Types.ObjectId(dto.lessonId) : null,
      themeId: dto.themeId ? new Types.ObjectId(dto.themeId) : null,
      courseId: dto.courseId ? new Types.ObjectId(dto.courseId) : null,
      questions,
      settings: {
        timeLimit: dto.settings?.timeLimit ?? null,
        showTimer: dto.settings?.showTimer ?? true,
        maxAttempts: dto.settings?.maxAttempts ?? 3,
        cooldownMinutes: dto.settings?.cooldownMinutes ?? 0,
        passingScore: dto.settings?.passingScore ?? 70,
        showScoreImmediately: dto.settings?.showScoreImmediately ?? true,
        allowSkip: dto.settings?.allowSkip ?? false,
        allowReview: dto.settings?.allowReview ?? true,
        allowBackNavigation: dto.settings?.allowBackNavigation ?? true,
        showCorrectAnswers: dto.settings?.showCorrectAnswers ?? true,
        showExplanations: dto.settings?.showExplanations ?? true,
        feedbackTiming: dto.settings?.feedbackTiming ?? 'after_submit',
        shuffleQuestions: dto.settings?.shuffleQuestions ?? false,
        shuffleOptions: dto.settings?.shuffleOptions ?? false,
        preQuizBehavior: dto.type === QuizType.PRE_QUIZ ? {
          showContentOnFail: dto.settings?.preQuizBehavior?.showContentOnFail ?? true,
          bypassOnSuccess: dto.settings?.preQuizBehavior?.bypassOnSuccess ?? false,
          motivationalMessageOnFail: dto.settings?.preQuizBehavior?.motivationalMessageOnFail ??
            '¡No te preocupes! Hoy aprenderás sobre este tema.',
          congratsMessageOnPass: dto.settings?.preQuizBehavior?.congratsMessageOnPass ??
            '¡Excelente! Ya tienes conocimientos previos sobre este tema.',
        } : null,
        postQuizBehavior: dto.type === QuizType.POST_QUIZ ? {
          requirePassToComplete: dto.settings?.postQuizBehavior?.requirePassToComplete ?? true,
          unlockNextOnPass: dto.settings?.postQuizBehavior?.unlockNextOnPass ?? true,
          retryMessageOnFail: dto.settings?.postQuizBehavior?.retryMessageOnFail ??
            'Necesitas repasar el contenido. ¡Inténtalo de nuevo!',
        } : null,
      },
    });

    return quiz.save();
  }

  async findAll(query: GetQuizzesQueryDto): Promise<{ quizzes: Quiz[]; total: number }> {
    const {
      type,
      status,
      lessonId,
      themeId,
      courseId,
      page = 1,
      limit = 20,
    } = query;

    const filter: Record<string, unknown> = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (lessonId) filter.lessonId = new Types.ObjectId(lessonId);
    if (themeId) filter.themeId = new Types.ObjectId(themeId);
    if (courseId) filter.courseId = new Types.ObjectId(courseId);

    const [quizzes, total] = await Promise.all([
      this.quizModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.quizModel.countDocuments(filter).exec(),
    ]);

    return { quizzes, total };
  }

  async findById(id: string): Promise<QuizDocument> {
    const quiz = await this.quizModel.findById(id).exec();
    if (!quiz) {
      throw new NotFoundException('Quiz no encontrado');
    }
    return quiz;
  }

  async findByLesson(lessonId: string, type?: QuizType): Promise<Quiz[]> {
    const filter: Record<string, unknown> = {
      lessonId: new Types.ObjectId(lessonId),
      status: QuizStatus.PUBLISHED,
    };
    if (type) filter.type = type;

    return this.quizModel.find(filter).sort({ type: 1 }).exec();
  }

  async update(id: string, dto: UpdateQuizDto): Promise<Quiz> {
    const updateData: Record<string, unknown> = { ...dto };

    // Convertir IDs a ObjectId si están presentes
    if (dto.lessonId) updateData.lessonId = new Types.ObjectId(dto.lessonId);
    if (dto.themeId) updateData.themeId = new Types.ObjectId(dto.themeId);
    if (dto.courseId) updateData.courseId = new Types.ObjectId(dto.courseId);

    // Si se actualizan las preguntas, asegurar IDs
    if (dto.questions) {
      updateData.questions = dto.questions.map((q, index) => ({
        ...q,
        id: q.id || uuidv4(),
        order: q.order ?? index,
      }));
    }

    const quiz = await this.quizModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!quiz) {
      throw new NotFoundException('Quiz no encontrado');
    }

    return quiz;
  }

  async delete(id: string): Promise<void> {
    const result = await this.quizModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Quiz no encontrado');
    }

    // Eliminar intentos asociados
    await this.attemptModel.deleteMany({ quizId: new Types.ObjectId(id) }).exec();
  }

  async publish(id: string): Promise<QuizDocument> {
    const quiz = await this.findById(id);

    // Validar que tiene al menos una pregunta
    if (!quiz.questions || quiz.questions.length === 0) {
      throw new BadRequestException('El quiz debe tener al menos una pregunta para publicarse');
    }

    quiz.status = QuizStatus.PUBLISHED;
    return quiz.save();
  }

  async archive(id: string): Promise<QuizDocument | null> {
    return this.quizModel.findByIdAndUpdate(
      id,
      { status: QuizStatus.ARCHIVED },
      { new: true },
    ).exec();
  }

  // ==================== QUESTION MANAGEMENT ====================

  async addQuestion(quizId: string, dto: AddQuestionDto): Promise<QuizDocument> {
    const quiz = await this.findById(quizId);

    const newQuestion: QuizQuestion = {
      id: uuidv4(),
      type: dto.type,
      question: dto.question,
      explanation: dto.explanation,
      imageUrl: dto.imageUrl,
      videoUrl: dto.videoUrl,
      options: dto.options,
      correctAnswers: dto.correctAnswers,
      caseSensitive: dto.caseSensitive ?? false,
      matchingPairs: dto.matchingPairs,
      correctOrder: dto.correctOrder,
      orderItems: dto.orderItems,
      points: dto.points,
      partialCredit: dto.partialCredit ?? false,
      difficulty: dto.difficulty || DifficultyLevel.MEDIUM,
      tags: dto.tags,
      order: dto.order ?? quiz.questions.length,
      isRequired: dto.isRequired ?? true,
    };

    quiz.questions.push(newQuestion);
    return quiz.save();
  }

  async updateQuestion(
    quizId: string,
    questionId: string,
    dto: UpdateQuestionDto,
  ): Promise<QuizDocument> {
    const quiz = await this.findById(quizId);

    const questionIndex = quiz.questions.findIndex((q) => q.id === questionId);
    if (questionIndex === -1) {
      throw new NotFoundException('Pregunta no encontrada');
    }

    quiz.questions[questionIndex] = {
      ...quiz.questions[questionIndex],
      ...dto,
      id: questionId, // Mantener el ID original
    } as QuizQuestion;

    return quiz.save();
  }

  async deleteQuestion(quizId: string, questionId: string): Promise<QuizDocument> {
    const quiz = await this.findById(quizId);

    const questionIndex = quiz.questions.findIndex((q) => q.id === questionId);
    if (questionIndex === -1) {
      throw new NotFoundException('Pregunta no encontrada');
    }

    quiz.questions.splice(questionIndex, 1);

    // Reordenar
    quiz.questions.forEach((q, index) => {
      q.order = index;
    });

    return quiz.save();
  }

  async reorderQuestions(quizId: string, questionIds: string[]): Promise<QuizDocument> {
    const quiz = await this.findById(quizId);

    const reorderedQuestions = questionIds.map((id, index) => {
      const question = quiz.questions.find((q) => q.id === id);
      if (!question) {
        throw new BadRequestException(`Pregunta con ID ${id} no encontrada`);
      }
      return { ...question, order: index } as QuizQuestion;
    });

    quiz.questions = reorderedQuestions;
    return quiz.save();
  }

  // ==================== ATTEMPT MANAGEMENT ====================

  async canStartAttempt(
    userId: string,
    quizId: string,
  ): Promise<{
    canStart: boolean;
    reason?: string;
    attemptsUsed: number;
    maxAttempts: number;
    cooldownEndsAt: Date | null;
    inProgressAttemptId?: string;
  }> {
    const quiz = await this.findById(quizId);

    if (quiz.status !== QuizStatus.PUBLISHED) {
      return {
        canStart: false,
        reason: 'El quiz no está disponible',
        attemptsUsed: 0,
        maxAttempts: quiz.settings.maxAttempts,
        cooldownEndsAt: null,
      };
    }

    // Buscar intentos previos
    const attempts = await this.attemptModel
      .find({
        quizId: new Types.ObjectId(quizId),
        userId: new Types.ObjectId(userId),
      })
      .sort({ createdAt: -1 })
      .exec();

    // Verificar si hay un intento en progreso
    const inProgressAttempt = attempts.find(
      (a) => a.status === AttemptStatus.IN_PROGRESS,
    );
    if (inProgressAttempt) {
      return {
        canStart: false,
        reason: 'Ya tienes un intento en progreso',
        attemptsUsed: attempts.length,
        maxAttempts: quiz.settings.maxAttempts,
        cooldownEndsAt: null,
        inProgressAttemptId: inProgressAttempt._id.toString(),
      };
    }

    // Verificar límite de intentos
    const completedAttempts = attempts.filter(
      (a) => a.status === AttemptStatus.COMPLETED || a.status === AttemptStatus.TIMED_OUT,
    );

    if (quiz.settings.maxAttempts > 0 && completedAttempts.length >= quiz.settings.maxAttempts) {
      return {
        canStart: false,
        reason: 'Has alcanzado el límite de intentos',
        attemptsUsed: completedAttempts.length,
        maxAttempts: quiz.settings.maxAttempts,
        cooldownEndsAt: null,
      };
    }

    // Verificar cooldown
    if (quiz.settings.cooldownMinutes && completedAttempts.length > 0) {
      const lastAttempt = completedAttempts[0];
      const cooldownEndsAt = new Date(
        lastAttempt.completedAt!.getTime() + quiz.settings.cooldownMinutes * 60 * 1000,
      );

      if (cooldownEndsAt > new Date()) {
        return {
          canStart: false,
          reason: `Debes esperar antes de intentar de nuevo`,
          attemptsUsed: completedAttempts.length,
          maxAttempts: quiz.settings.maxAttempts,
          cooldownEndsAt,
        };
      }
    }

    return {
      canStart: true,
      attemptsUsed: completedAttempts.length,
      maxAttempts: quiz.settings.maxAttempts,
      cooldownEndsAt: null,
    };
  }

  async startAttempt(userId: string, dto: StartAttemptDto): Promise<QuizAttempt> {
    const canStart = await this.canStartAttempt(userId, dto.quizId);

    if (!canStart.canStart) {
      throw new ForbiddenException(canStart.reason);
    }

    const quiz = await this.findById(dto.quizId);

    // Determinar orden de preguntas
    let questionOrder = quiz.questions.map((q) => q.id);
    if (quiz.settings.shuffleQuestions) {
      questionOrder = this.shuffleArray([...questionOrder]);
    }

    // Calcular expiración si hay tiempo límite
    const now = new Date();
    const expiresAt = quiz.settings.timeLimit
      ? new Date(now.getTime() + quiz.settings.timeLimit * 60 * 1000)
      : null;

    const attempt = new this.attemptModel({
      quizId: new Types.ObjectId(dto.quizId),
      userId: new Types.ObjectId(userId),
      lessonId: dto.lessonId ? new Types.ObjectId(dto.lessonId) : null,
      attemptNumber: canStart.attemptsUsed + 1,
      startedAt: now,
      expiresAt,
      questionOrder,
      maxScore: quiz.totalPoints,
      status: AttemptStatus.IN_PROGRESS,
    });

    return attempt.save();
  }

  async saveProgress(
    userId: string,
    attemptId: string,
    dto: SaveProgressDto,
  ): Promise<QuizAttempt> {
    const attempt = await this.getAttemptWithValidation(userId, attemptId);

    // Actualizar respuestas sin evaluar todavía
    for (const answer of dto.answers) {
      const existingIndex = attempt.answers.findIndex(
        (a) => a.questionId === answer.questionId,
      );

      const answerData: Partial<QuestionAnswer> = {
        questionId: answer.questionId,
        selectedOptionIds: answer.selectedOptionIds,
        textAnswer: answer.textAnswer,
        matchingAnswers: answer.matchingAnswers,
        orderAnswer: answer.orderAnswer,
        answeredAt: new Date(),
        timeSpentSeconds: answer.timeSpentSeconds || 0,
        isCorrect: false,
        isPartiallyCorrect: false,
        pointsEarned: 0,
        maxPoints: 0,
        questionType: QuestionType.MULTIPLE_CHOICE, // Se actualizará al evaluar
      };

      if (existingIndex >= 0) {
        attempt.answers[existingIndex] = {
          ...attempt.answers[existingIndex],
          ...answerData,
        } as QuestionAnswer;
      } else {
        attempt.answers.push(answerData as QuestionAnswer);
      }
    }

    return attempt.save();
  }

  async submitAttempt(
    userId: string,
    attemptId: string,
    dto: SubmitAttemptDto,
  ): Promise<QuizAttempt> {
    const attempt = await this.getAttemptWithValidation(userId, attemptId);
    const quiz = await this.findById(attempt.quizId.toString());

    // Verificar tiempo límite
    if (attempt.expiresAt && new Date() > attempt.expiresAt) {
      attempt.status = AttemptStatus.TIMED_OUT;
      attempt.completedAt = attempt.expiresAt;
      await attempt.save();
      throw new BadRequestException('El tiempo para este intento ha expirado');
    }

    // Evaluar respuestas
    const evaluatedAnswers: QuestionAnswer[] = [];
    let totalScore = 0;

    for (const submittedAnswer of dto.answers) {
      const question = quiz.questions.find((q) => q.id === submittedAnswer.questionId);
      if (!question) continue;

      const evaluation = this.evaluateAnswer(question, submittedAnswer);

      evaluatedAnswers.push({
        questionId: submittedAnswer.questionId,
        questionType: question.type,
        selectedOptionIds: submittedAnswer.selectedOptionIds,
        textAnswer: submittedAnswer.textAnswer,
        matchingAnswers: submittedAnswer.matchingAnswers,
        orderAnswer: submittedAnswer.orderAnswer,
        isCorrect: evaluation.isCorrect,
        isPartiallyCorrect: evaluation.isPartiallyCorrect,
        pointsEarned: evaluation.pointsEarned,
        maxPoints: question.points,
        answeredAt: new Date(),
        timeSpentSeconds: submittedAnswer.timeSpentSeconds || 0,
        feedbackShown: evaluation.feedback,
      });

      totalScore += evaluation.pointsEarned;
    }

    // Calcular porcentaje y si aprobó
    const percentage = quiz.totalPoints > 0
      ? Math.round((totalScore / quiz.totalPoints) * 100)
      : 0;
    const passed = percentage >= quiz.settings.passingScore;

    // Generar resumen
    const summary = this.generateSummary(quiz, evaluatedAnswers, percentage, passed);

    // Actualizar intento
    attempt.answers = evaluatedAnswers;
    attempt.score = totalScore;
    attempt.percentage = percentage;
    attempt.passed = passed;
    attempt.status = AttemptStatus.COMPLETED;
    attempt.completedAt = new Date();
    attempt.totalTimeSeconds = dto.totalTimeSeconds ||
      Math.round((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000);
    attempt.summary = summary;

    // Calcular recompensas si aprobó
    if (passed && !attempt.rewardsGranted) {
      attempt.tokensEarned = quiz.tokensReward;
      attempt.xpEarned = quiz.xpReward;

      // Bonus por puntuación perfecta
      if (percentage === 100 && quiz.bonusTokensForPerfect > 0) {
        attempt.tokensEarned += quiz.bonusTokensForPerfect;
      }

      attempt.rewardsGranted = true;
    }

    await attempt.save();

    // Actualizar estadísticas del quiz
    await this.updateQuizStatistics(quiz._id.toString());

    return attempt;
  }

  async abandonAttempt(userId: string, attemptId: string): Promise<QuizAttempt> {
    const attempt = await this.getAttemptWithValidation(userId, attemptId);

    attempt.status = AttemptStatus.ABANDONED;
    attempt.completedAt = new Date();

    return attempt.save();
  }

  // ==================== ATTEMPT QUERIES ====================

  async getAttempt(attemptId: string): Promise<QuizAttempt> {
    const attempt = await this.attemptModel.findById(attemptId).exec();
    if (!attempt) {
      throw new NotFoundException('Intento no encontrado');
    }
    return attempt;
  }

  async getUserAttempts(
    userId: string,
    query: GetAttemptsQueryDto,
  ): Promise<{ attempts: QuizAttempt[]; total: number }> {
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (query.quizId) filter.quizId = new Types.ObjectId(query.quizId);
    if (query.status) filter.status = query.status;
    if (query.passed !== undefined) filter.passed = query.passed;

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [attempts, total] = await Promise.all([
      this.attemptModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.attemptModel.countDocuments(filter).exec(),
    ]);

    return { attempts, total };
  }

  async getUserBestAttempt(userId: string, quizId: string): Promise<QuizAttempt | null> {
    return this.attemptModel
      .findOne({
        userId: new Types.ObjectId(userId),
        quizId: new Types.ObjectId(quizId),
        status: AttemptStatus.COMPLETED,
      })
      .sort({ percentage: -1, completedAt: -1 })
      .exec();
  }

  async getUserQuizHistory(userId: string, quizId: string) {
    const quiz = await this.findById(quizId);
    const attempts = await this.attemptModel
      .find({
        userId: new Types.ObjectId(userId),
        quizId: new Types.ObjectId(quizId),
      })
      .sort({ createdAt: -1 })
      .exec();

    const completedAttempts = attempts.filter(
      (a) => a.status === AttemptStatus.COMPLETED || a.status === AttemptStatus.TIMED_OUT,
    );

    const bestAttempt = completedAttempts.reduce(
      (best, current) => (!best || current.percentage > best.percentage ? current : best),
      null as QuizAttempt | null,
    );

    // Calcular si puede reintentar
    const canRetryInfo = await this.canStartAttempt(userId, quizId);

    return {
      quizId,
      quizTitle: quiz.title,
      quizType: quiz.type,
      attempts: attempts.map((a) => ({
        attemptId: a._id.toString(),
        attemptNumber: a.attemptNumber,
        status: a.status,
        score: a.score,
        maxScore: a.maxScore,
        percentage: a.percentage,
        passed: a.passed,
        totalTimeSeconds: a.totalTimeSeconds,
        completedAt: a.completedAt,
      })),
      bestAttempt: bestAttempt
        ? {
            attemptId: bestAttempt._id.toString(),
            percentage: bestAttempt.percentage,
            score: bestAttempt.score,
          }
        : null,
      totalAttempts: completedAttempts.length,
      attemptsRemaining: quiz.settings.maxAttempts > 0
        ? quiz.settings.maxAttempts - completedAttempts.length
        : null,
      canRetry: canRetryInfo.canStart,
      cooldownEndsAt: canRetryInfo.cooldownEndsAt,
    };
  }

  // ==================== QUIZ FOR STUDENT (sin respuestas) ====================

  async getQuizForStudent(quizId: string, userId: string) {
    const quiz = await this.findById(quizId);

    if (quiz.status !== QuizStatus.PUBLISHED) {
      throw new ForbiddenException('El quiz no está disponible');
    }

    // Preparar preguntas sin respuestas correctas
    const questions = quiz.questions.map((q) => {
      const studentQuestion: Record<string, unknown> = {
        id: q.id,
        type: q.type,
        question: q.question,
        imageUrl: q.imageUrl,
        videoUrl: q.videoUrl,
        points: q.points,
        order: q.order,
        isRequired: q.isRequired,
      };

      // Opciones sin isCorrect
      if (q.options) {
        let options = q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          imageUrl: opt.imageUrl,
        }));

        if (quiz.settings.shuffleOptions) {
          options = this.shuffleArray(options);
        }

        studentQuestion.options = options;
      }

      // Para MATCHING: separar left y right (mezclados)
      if (q.matchingPairs) {
        studentQuestion.matchingLeft = q.matchingPairs.map((p) => ({
          id: p.id,
          text: p.left,
        }));
        studentQuestion.matchingRight = this.shuffleArray(
          q.matchingPairs.map((p) => ({
            id: p.id,
            text: p.right,
          })),
        );
      }

      // Para ORDERING: items mezclados
      if (q.orderItems) {
        studentQuestion.orderItems = this.shuffleArray([...q.orderItems]);
      }

      return studentQuestion;
    });

    // Ordenar preguntas
    let orderedQuestions = questions.sort((a, b) =>
      (a.order as number) - (b.order as number)
    );

    if (quiz.settings.shuffleQuestions) {
      orderedQuestions = this.shuffleArray(orderedQuestions);
    }

    return {
      id: quiz._id.toString(),
      title: quiz.title,
      description: quiz.description,
      instructions: quiz.instructions,
      type: quiz.type,
      totalQuestions: quiz.totalQuestions,
      totalPoints: quiz.totalPoints,
      settings: {
        timeLimit: quiz.settings.timeLimit,
        showTimer: quiz.settings.showTimer,
        allowSkip: quiz.settings.allowSkip,
        allowReview: quiz.settings.allowReview,
        allowBackNavigation: quiz.settings.allowBackNavigation,
      },
      questions: orderedQuestions,
    };
  }

  // ==================== STATISTICS ====================

  async getQuizStatistics(quizId: string) {
    const quiz = await this.findById(quizId);

    const attempts = await this.attemptModel
      .find({
        quizId: new Types.ObjectId(quizId),
        status: AttemptStatus.COMPLETED,
      })
      .exec();

    if (attempts.length === 0) {
      return {
        quizId,
        totalAttempts: 0,
        uniqueUsers: 0,
        averageScore: 0,
        averageTimeSeconds: 0,
        passRate: 0,
        scoreDistribution: [],
        questionStats: [],
      };
    }

    // Usuarios únicos
    const uniqueUsers = new Set(attempts.map((a) => a.userId.toString())).size;

    // Promedios
    const totalScore = attempts.reduce((sum, a) => sum + a.percentage, 0);
    const totalTime = attempts.reduce((sum, a) => sum + a.totalTimeSeconds, 0);
    const passedCount = attempts.filter((a) => a.passed).length;

    // Distribución de puntuación
    const scoreRanges = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
    const scoreDistribution = scoreRanges.map((range, index) => {
      const min = index * 20;
      const max = (index + 1) * 20;
      const count = attempts.filter(
        (a) => a.percentage >= min && a.percentage < (index === 4 ? 101 : max),
      ).length;
      return { range, count };
    });

    // Stats por pregunta
    const questionStats = quiz.questions.map((question) => {
      const questionAnswers = attempts.flatMap((a) =>
        a.answers.filter((ans) => ans.questionId === question.id),
      );

      const correctCount = questionAnswers.filter((a) => a.isCorrect).length;
      const totalAnswered = questionAnswers.length;
      const avgTime = totalAnswered > 0
        ? questionAnswers.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / totalAnswered
        : 0;

      return {
        questionId: question.id,
        question: question.question.substring(0, 100),
        correctRate: totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0,
        averageTimeSeconds: Math.round(avgTime),
      };
    });

    return {
      quizId,
      totalAttempts: attempts.length,
      uniqueUsers,
      averageScore: Math.round(totalScore / attempts.length),
      averageTimeSeconds: Math.round(totalTime / attempts.length),
      passRate: Math.round((passedCount / attempts.length) * 100),
      scoreDistribution,
      questionStats,
    };
  }

  // ==================== PRIVATE HELPERS ====================

  private async getAttemptWithValidation(
    userId: string,
    attemptId: string,
  ): Promise<QuizAttemptDocument> {
    const attempt = await this.attemptModel.findById(attemptId).exec();

    if (!attempt) {
      throw new NotFoundException('Intento no encontrado');
    }

    if (attempt.userId.toString() !== userId) {
      throw new ForbiddenException('No tienes acceso a este intento');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Este intento ya fue completado o abandonado');
    }

    return attempt;
  }

  private evaluateAnswer(
    question: QuizQuestion,
    answer: SubmitAnswerDto,
  ): {
    isCorrect: boolean;
    isPartiallyCorrect: boolean;
    pointsEarned: number;
    feedback?: string;
  } {
    const maxPoints = question.points;

    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.TRUE_FALSE: {
        const correctOption = question.options?.find((o) => o.isCorrect);
        const isCorrect = correctOption &&
          answer.selectedOptionIds?.length === 1 &&
          answer.selectedOptionIds[0] === correctOption.id;

        const selectedOption = question.options?.find(
          (o) => o.id === answer.selectedOptionIds?.[0],
        );

        return {
          isCorrect: !!isCorrect,
          isPartiallyCorrect: false,
          pointsEarned: isCorrect ? maxPoints : 0,
          feedback: selectedOption?.feedback || question.explanation,
        };
      }

      case QuestionType.MULTIPLE_ANSWER: {
        const correctOptionIds = question.options
          ?.filter((o) => o.isCorrect)
          .map((o) => o.id) || [];
        const selectedIds = answer.selectedOptionIds || [];

        const correctSelected = selectedIds.filter((id) => correctOptionIds.includes(id)).length;
        const incorrectSelected = selectedIds.filter((id) => !correctOptionIds.includes(id)).length;

        const isCorrect = correctSelected === correctOptionIds.length && incorrectSelected === 0;
        const isPartiallyCorrect = correctSelected > 0 && !isCorrect;

        let pointsEarned = 0;
        if (isCorrect) {
          pointsEarned = maxPoints;
        } else if (isPartiallyCorrect && question.partialCredit) {
          // Puntuación parcial: correctos - incorrectos (mínimo 0)
          const partialScore = Math.max(0, correctSelected - incorrectSelected);
          pointsEarned = Math.round((partialScore / correctOptionIds.length) * maxPoints);
        }

        return {
          isCorrect,
          isPartiallyCorrect,
          pointsEarned,
          feedback: question.explanation,
        };
      }

      case QuestionType.TEXT:
      case QuestionType.FILL_BLANK: {
        const userAnswer = answer.textAnswer?.trim() || '';
        const correctAnswers = question.correctAnswers || [];

        const isCorrect = correctAnswers.some((correct) => {
          if (question.caseSensitive) {
            return userAnswer === correct;
          }
          return userAnswer.toLowerCase() === correct.toLowerCase();
        });

        return {
          isCorrect,
          isPartiallyCorrect: false,
          pointsEarned: isCorrect ? maxPoints : 0,
          feedback: question.explanation,
        };
      }

      case QuestionType.MATCHING: {
        const pairs = question.matchingPairs || [];
        const userMatches = answer.matchingAnswers || [];

        let correctMatches = 0;
        for (const userMatch of userMatches) {
          const correctPair = pairs.find((p) => p.id === userMatch.leftId);
          if (correctPair && correctPair.id === userMatch.rightId) {
            correctMatches++;
          }
        }

        const isCorrect = correctMatches === pairs.length;
        const isPartiallyCorrect = correctMatches > 0 && !isCorrect;

        let pointsEarned = 0;
        if (isCorrect) {
          pointsEarned = maxPoints;
        } else if (isPartiallyCorrect && question.partialCredit) {
          pointsEarned = Math.round((correctMatches / pairs.length) * maxPoints);
        }

        return {
          isCorrect,
          isPartiallyCorrect,
          pointsEarned,
          feedback: question.explanation,
        };
      }

      case QuestionType.ORDERING: {
        const correctOrder = question.correctOrder || [];
        const userOrder = answer.orderAnswer || [];

        const isCorrect = correctOrder.length === userOrder.length &&
          correctOrder.every((id, index) => id === userOrder[index]);

        // Puntuación parcial: contar posiciones correctas
        let correctPositions = 0;
        if (!isCorrect && question.partialCredit) {
          for (let i = 0; i < Math.min(correctOrder.length, userOrder.length); i++) {
            if (correctOrder[i] === userOrder[i]) {
              correctPositions++;
            }
          }
        }

        const isPartiallyCorrect = correctPositions > 0;
        const pointsEarned = isCorrect
          ? maxPoints
          : (isPartiallyCorrect && question.partialCredit)
            ? Math.round((correctPositions / correctOrder.length) * maxPoints)
            : 0;

        return {
          isCorrect,
          isPartiallyCorrect,
          pointsEarned,
          feedback: question.explanation,
        };
      }

      default:
        return {
          isCorrect: false,
          isPartiallyCorrect: false,
          pointsEarned: 0,
        };
    }
  }

  private generateSummary(
    quiz: Quiz,
    answers: QuestionAnswer[],
    percentage: number,
    passed: boolean,
  ): AttemptSummary {
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const partiallyCorrectAnswers = answers.filter(
      (a) => a.isPartiallyCorrect && !a.isCorrect,
    ).length;
    const incorrectAnswers = answers.filter(
      (a) => !a.isCorrect && !a.isPartiallyCorrect,
    ).length;
    const skippedQuestions = quiz.totalQuestions - answers.length;

    // Desglose por tipo de pregunta
    const questionTypes = [...new Set(quiz.questions.map((q) => q.type))];
    const byQuestionType = questionTypes.map((type) => {
      const questionsOfType = quiz.questions.filter((q) => q.type === type);
      const answersOfType = answers.filter(
        (a) => questionsOfType.some((q) => q.id === a.questionId),
      );
      return {
        type,
        total: questionsOfType.length,
        correct: answersOfType.filter((a) => a.isCorrect).length,
      };
    });

    // Desglose por dificultad
    const difficulties = [DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD];
    const byDifficulty = difficulties.map((level) => {
      const questionsOfLevel = quiz.questions.filter((q) => q.difficulty === level);
      const answersOfLevel = answers.filter(
        (a) => questionsOfLevel.some((q) => q.id === a.questionId),
      );
      return {
        level,
        total: questionsOfLevel.length,
        correct: answersOfLevel.filter((a) => a.isCorrect).length,
      };
    }).filter((d) => d.total > 0);

    return {
      totalQuestions: quiz.totalQuestions,
      answeredQuestions: answers.length,
      correctAnswers,
      partiallyCorrectAnswers,
      incorrectAnswers,
      skippedQuestions,
      totalPoints: quiz.totalPoints,
      earnedPoints: answers.reduce((sum, a) => sum + a.pointsEarned, 0),
      percentage,
      passed,
      passingScore: quiz.settings.passingScore,
      byQuestionType,
      byDifficulty,
    };
  }

  // ==================== VERIFICACIÓN DE QUIZZES PARA PROGRESO ====================

  /**
   * Verifica si el usuario ha aprobado un quiz de cierto tipo para una lección
   */
  async hasUserPassedLessonQuiz(
    userId: string,
    lessonId: string,
    quizType: QuizType,
  ): Promise<{
    hasPassed: boolean;
    quiz: Quiz | null;
    bestAttempt: QuizAttempt | null;
    message?: string;
  }> {
    // Buscar quiz de ese tipo para la lección
    const quizzes = await this.findByLesson(lessonId, quizType);

    if (quizzes.length === 0) {
      return {
        hasPassed: true, // No hay quiz, se considera aprobado
        quiz: null,
        bestAttempt: null,
        message: 'No existe quiz de este tipo para la lección',
      };
    }

    const quiz = quizzes[0]; // Tomamos el primero (debería ser único por tipo)

    // Buscar mejor intento del usuario
    const bestAttempt = await this.attemptModel
      .findOne({
        userId: new Types.ObjectId(userId),
        quizId: quiz._id,
        status: AttemptStatus.COMPLETED,
        passed: true,
      })
      .sort({ percentage: -1 })
      .exec();

    return {
      hasPassed: !!bestAttempt,
      quiz,
      bestAttempt,
      message: bestAttempt
        ? `Quiz aprobado con ${bestAttempt.percentage}%`
        : 'Quiz no aprobado aún',
    };
  }

  /**
   * Obtiene el estado del PRE_QUIZ para una lección
   * Retorna info sobre si puede ver contenido, si debe hacer quiz primero, etc.
   */
  async getPreQuizStatus(
    userId: string,
    lessonId: string,
  ): Promise<{
    hasPreQuiz: boolean;
    quizId?: string;
    canViewContent: boolean;
    mustTakeQuiz: boolean;
    canBypass: boolean;
    hasPassed: boolean;
    bestScore?: number;
    message: string;
  }> {
    const quizzes = await this.findByLesson(lessonId, QuizType.PRE_QUIZ);

    if (quizzes.length === 0) {
      return {
        hasPreQuiz: false,
        canViewContent: true,
        mustTakeQuiz: false,
        canBypass: false,
        hasPassed: false,
        message: 'No hay PRE_QUIZ para esta lección',
      };
    }

    const quiz = quizzes[0];
    const bestAttempt = await this.getUserBestAttempt(userId, quiz._id.toString());

    const hasPassed = bestAttempt?.passed ?? false;
    const showContentOnFail = quiz.settings.preQuizBehavior?.showContentOnFail ?? true;
    const bypassOnSuccess = quiz.settings.preQuizBehavior?.bypassOnSuccess ?? false;

    // Determinar si puede ver contenido
    // - Si aprobó y bypassOnSuccess=true, puede saltar el contenido
    // - Si no aprobó pero showContentOnFail=true, puede ver contenido
    // - Si no ha intentado, debe hacer el quiz primero
    const hasAttempted = !!bestAttempt;

    return {
      hasPreQuiz: true,
      quizId: quiz._id.toString(),
      canViewContent: hasAttempted ? (hasPassed || showContentOnFail) : false,
      mustTakeQuiz: !hasAttempted,
      canBypass: hasPassed && bypassOnSuccess,
      hasPassed,
      bestScore: bestAttempt?.percentage,
      message: !hasAttempted
        ? 'Debes completar el quiz de entrada primero'
        : hasPassed
          ? (bypassOnSuccess
              ? '¡Excelente! Ya dominas este tema, puedes saltarlo'
              : '¡Bien! Puedes continuar con el contenido')
          : (showContentOnFail
              ? 'Ahora aprenderás sobre este tema'
              : 'Debes aprobar el quiz para continuar'),
    };
  }

  /**
   * Obtiene el estado del POST_QUIZ para una lección
   * Retorna info sobre si la lección puede completarse, si desbloquea siguiente, etc.
   */
  async getPostQuizStatus(
    userId: string,
    lessonId: string,
  ): Promise<{
    hasPostQuiz: boolean;
    quizId?: string;
    canComplete: boolean;
    requiresPass: boolean;
    unlockNextOnPass: boolean;
    hasPassed: boolean;
    bestScore?: number;
    attemptsCount: number;
    maxAttempts: number;
    message: string;
  }> {
    const quizzes = await this.findByLesson(lessonId, QuizType.POST_QUIZ);

    if (quizzes.length === 0) {
      return {
        hasPostQuiz: false,
        canComplete: true,
        requiresPass: false,
        unlockNextOnPass: false,
        hasPassed: false,
        attemptsCount: 0,
        maxAttempts: 0,
        message: 'No hay POST_QUIZ para esta lección',
      };
    }

    const quiz = quizzes[0];
    const attempts = await this.attemptModel
      .find({
        userId: new Types.ObjectId(userId),
        quizId: quiz._id,
        status: AttemptStatus.COMPLETED,
      })
      .exec();

    const bestAttempt = attempts.reduce(
      (best, current) => (!best || current.percentage > best.percentage ? current : best),
      null as QuizAttempt | null,
    );

    const hasPassed = bestAttempt?.passed ?? false;
    const requirePassToComplete = quiz.settings.postQuizBehavior?.requirePassToComplete ?? true;
    const unlockNextOnPass = quiz.settings.postQuizBehavior?.unlockNextOnPass ?? true;

    return {
      hasPostQuiz: true,
      quizId: quiz._id.toString(),
      canComplete: !requirePassToComplete || hasPassed,
      requiresPass: requirePassToComplete,
      unlockNextOnPass,
      hasPassed,
      bestScore: bestAttempt?.percentage,
      attemptsCount: attempts.length,
      maxAttempts: quiz.settings.maxAttempts,
      message: hasPassed
        ? '¡Lección completada exitosamente!'
        : requirePassToComplete
          ? quiz.settings.postQuizBehavior?.retryMessageOnFail || 'Debes aprobar el quiz para completar la lección'
          : 'Puedes completar la lección sin aprobar el quiz',
    };
  }

  /**
   * Verifica si el usuario ha aprobado el POST_QUIZ de la lección anterior
   * Útil para determinar si puede acceder a la siguiente lección
   */
  async hasPassedPreviousLessonPostQuiz(
    userId: string,
    previousLessonId: string,
  ): Promise<{
    canProceed: boolean;
    reason?: string;
  }> {
    const postQuizStatus = await this.getPostQuizStatus(userId, previousLessonId);

    // Si no hay POST_QUIZ, puede proceder
    if (!postQuizStatus.hasPostQuiz) {
      return { canProceed: true };
    }

    // Si no requiere aprobar, puede proceder
    if (!postQuizStatus.requiresPass) {
      return { canProceed: true };
    }

    // Si aprobó, puede proceder solo si unlockNextOnPass está activo
    if (postQuizStatus.hasPassed && postQuizStatus.unlockNextOnPass) {
      return { canProceed: true };
    }

    // Si aprobó pero unlockNextOnPass está desactivado, aún puede proceder
    // (esto significa que el quiz no controla el desbloqueo)
    if (postQuizStatus.hasPassed) {
      return { canProceed: true };
    }

    return {
      canProceed: false,
      reason: `Debes aprobar el quiz de la lección anterior (${postQuizStatus.bestScore ?? 0}% actual, necesitas ${postQuizStatus.requiresPass ? 'aprobar' : 'completar'})`,
    };
  }

  private async updateQuizStatistics(quizId: string): Promise<void> {
    const attempts = await this.attemptModel
      .find({
        quizId: new Types.ObjectId(quizId),
        status: AttemptStatus.COMPLETED,
      })
      .exec();

    if (attempts.length === 0) return;

    const totalScore = attempts.reduce((sum, a) => sum + a.percentage, 0);
    const passedCount = attempts.filter((a) => a.passed).length;

    await this.quizModel.findByIdAndUpdate(quizId, {
      totalAttempts: attempts.length,
      averageScore: Math.round(totalScore / attempts.length),
      passRate: Math.round((passedCount / attempts.length) * 100),
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
