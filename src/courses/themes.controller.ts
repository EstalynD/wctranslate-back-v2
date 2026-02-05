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
} from '@nestjs/common';
import { ThemesService } from './themes.service';
import {
  CreateThemeDto,
  UpdateThemeDto,
  ReorderLessonsDto,
} from './dto/theme.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('themes')
@UseGuards(AuthGuard)
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  // ==================== PUBLIC (Authenticated) ====================

  @Get()
  async findAll(@Query('courseId') courseId?: string) {
    return this.themesService.findAll(courseId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.themesService.findOne(id);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.themesService.findBySlug(slug);
  }

  @Get(':id/with-lessons')
  async findWithLessons(@Param('id') id: string) {
    return this.themesService.findWithLessons(id);
  }

  @Get('course/:courseId')
  async getByCourse(@Param('courseId') courseId: string) {
    return this.themesService.getByCourse(courseId);
  }

  // ==================== ADMIN ONLY ====================

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createThemeDto: CreateThemeDto) {
    return this.themesService.create(createThemeDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateThemeDto: UpdateThemeDto,
  ) {
    return this.themesService.update(id, updateThemeDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.themesService.remove(id);
  }

  @Put(':id/reorder-lessons')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async reorderLessons(
    @Param('id') id: string,
    @Body() reorderDto: ReorderLessonsDto,
  ) {
    return this.themesService.reorderLessons(id, reorderDto);
  }
}
