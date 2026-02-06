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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CoursesService } from './courses.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  QueryCoursesDto,
  ReorderThemesDto,
} from './dto/course.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('courses')
@UseGuards(AuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // ==================== PUBLIC (Authenticated) ====================

  @Get()
  async findAll(@Query() query: QueryCoursesDto) {
    return this.coursesService.findAll(query);
  }

  @Get('my')
  async findMyCourses(@CurrentUser() user: UserDocument) {
    return this.coursesService.getMyCoursesForUser(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.coursesService.findBySlug(slug);
  }

  @Get(':id/with-themes')
  async findWithThemes(@Param('id') id: string) {
    return this.coursesService.findWithThemes(id);
  }

  // ==================== ADMIN ONLY ====================

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('thumbnail'))
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.coursesService.create(createCourseDto, file);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('thumbnail'))
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.coursesService.update(id, updateCourseDto, file);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  @Put(':id/reorder-themes')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async reorderThemes(
    @Param('id') id: string,
    @Body() reorderDto: ReorderThemesDto,
  ) {
    return this.coursesService.reorderThemes(id, reorderDto);
  }

  @Post(':id/update-stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateStats(@Param('id') id: string) {
    await this.coursesService.updateCourseStats(id);
    return { success: true };
  }
}
