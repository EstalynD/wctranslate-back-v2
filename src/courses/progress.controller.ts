import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import {
  MarkLessonCompleteDto,
  SubmitExerciseDto,
  SubmitQuizDto,
} from './dto/progress.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('progress')
@UseGuards(AuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  // ==================== USER PROGRESS ====================

  @Get('my')
  async getMyProgress(@CurrentUser() user: any) {
    return this.progressService.findByUser(user._id.toString());
  }

  @Get('my/course/:courseId')
  async getMyCourseProgress(
    @CurrentUser() user: any,
    @Param('courseId') courseId: string,
  ) {
    return this.progressService.getCourseProgress(user._id.toString(), courseId);
  }

  @Get('my/lesson/:lessonId')
  async getMyLessonProgress(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.getLessonProgress(user._id.toString(), lessonId);
  }

  @Get('my/stats')
  async getMyStats(@CurrentUser() user: any) {
    return this.progressService.getUserStats(user._id.toString());
  }

  @Get('my/recent-activity')
  async getMyRecentActivity(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    return this.progressService.getRecentActivity(
      user._id.toString(),
      limit ? parseInt(limit) : 10,
    );
  }

  // ==================== DAILY STATUS ====================

  @Get('my/daily-status')
  async getMyDailyStatus(@CurrentUser() user: any) {
    return this.progressService.getDailyStatus(user._id.toString());
  }

  // ==================== STARTING POINT ====================

  @Get('my/starting-point')
  async getMyStartingPoint(
    @CurrentUser() user: any,
    @Query('courseId') courseId?: string,
  ) {
    return this.progressService.getStartingPoint(user._id.toString(), courseId);
  }

  // ==================== ENROLLMENT ====================

  @Post('enroll/:courseId')
  async enrollInCourse(
    @CurrentUser() user: any,
    @Param('courseId') courseId: string,
  ) {
    return this.progressService.enrollInCourse(user._id.toString(), courseId);
  }

  // ==================== ACCESS CHECKS ====================

  @Get('lesson/:lessonId/access')
  async checkLessonAccess(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.canAccessLesson(user._id.toString(), lessonId);
  }

  @Get('lesson/:lessonId/full-status')
  async getLessonFullStatus(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.getFullLessonStatus(user._id.toString(), lessonId);
  }

  @Get('lesson/:lessonId/content-status')
  async getLessonContentStatus(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.canViewLessonContent(user._id.toString(), lessonId);
  }

  @Get('theme/:themeId/access')
  async checkThemeAccess(
    @CurrentUser() user: any,
    @Param('themeId') themeId: string,
    @Query('courseId') courseId: string,
  ) {
    return this.progressService.canAccessTheme(user._id.toString(), themeId, courseId);
  }

  // ==================== LESSON COMPLETION ====================

  @Post('lesson/:lessonId/complete')
  async markLessonComplete(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
    @Body() dto: MarkLessonCompleteDto,
  ) {
    return this.progressService.markLessonComplete(user._id.toString(), {
      ...dto,
      lessonId,
    });
  }

  @Put('lesson/:lessonId/time')
  async updateTimeSpent(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
    @Body() body: { seconds: number },
  ) {
    return this.progressService.updateTimeSpent(
      user._id.toString(),
      lessonId,
      body.seconds,
    );
  }

  // ==================== SUBMISSIONS ====================

  @Post('lesson/:lessonId/exercise')
  async submitExercise(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
    @Body() dto: SubmitExerciseDto,
  ) {
    const exerciseDto = { ...dto, lessonId };
    return this.progressService.submitExercise(user._id.toString(), exerciseDto);
  }

  @Post('lesson/:lessonId/quiz')
  async submitQuiz(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
    @Body() dto: SubmitQuizDto,
  ) {
    const quizDto = { ...dto, lessonId };
    return this.progressService.submitQuiz(user._id.toString(), quizDto);
  }

  @Get('lesson/:lessonId/submissions')
  async getMySubmissions(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.getSubmissions(user._id.toString(), lessonId);
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/user/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserProgressAdmin(@Param('userId') userId: string) {
    return this.progressService.findByUser(userId);
  }

  @Get('admin/course/:courseId/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getCourseStats(@Param('courseId') courseId: string) {
    return this.progressService.getCourseStats(courseId);
  }

  @Get('admin/course/:courseId/enrollments')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getCourseEnrollments(
    @Param('courseId') courseId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.progressService.getCourseEnrollments(
      courseId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('admin/leaderboard')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getGlobalLeaderboard(@Query('limit') limit?: string) {
    return this.progressService.getLeaderboard(limit ? parseInt(limit) : 10);
  }

  // ==================== GAMIFICATION ====================

  @Get('my/streak')
  async getMyStreak(@CurrentUser() user: any) {
    return this.progressService.getStreak(user._id.toString());
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    return this.progressService.getLeaderboard(limit ? parseInt(limit) : 10);
  }
}
