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
import { LessonsService } from './lessons.service';
import { CreateLessonDto, UpdateLessonDto, ContentBlockDto, LessonResourceDto } from './dto/lesson.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('lessons')
@UseGuards(AuthGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  // ==================== PUBLIC (Authenticated) ====================

  @Get()
  async findAll(@Query('themeId') themeId?: string) {
    return this.lessonsService.findAll(themeId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.lessonsService.findBySlug(slug);
  }

  @Get('theme/:themeId')
  async getByTheme(@Param('themeId') themeId: string) {
    return this.lessonsService.getByTheme(themeId);
  }

  @Get('theme/:themeId/published')
  async getPublishedByTheme(@Param('themeId') themeId: string) {
    return this.lessonsService.getPublishedByTheme(themeId);
  }

  // ==================== ADMIN ONLY ====================

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.create(createLessonDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(id, updateLessonDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.lessonsService.remove(id);
  }

  // ==================== CONTENT BLOCKS ====================

  @Post(':id/blocks')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async addContentBlock(
    @Param('id') id: string,
    @Body() block: ContentBlockDto,
  ) {
    return this.lessonsService.addContentBlock(id, block);
  }

  @Put(':id/blocks/:index')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateContentBlock(
    @Param('id') id: string,
    @Param('index') index: string,
    @Body() block: Partial<ContentBlockDto>,
  ) {
    return this.lessonsService.updateContentBlock(id, parseInt(index), block);
  }

  @Delete(':id/blocks/:index')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async removeContentBlock(
    @Param('id') id: string,
    @Param('index') index: string,
  ) {
    return this.lessonsService.removeContentBlock(id, parseInt(index));
  }

  @Put(':id/blocks/reorder')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async reorderContentBlocks(
    @Param('id') id: string,
    @Body() body: { newOrder: number[] },
  ) {
    return this.lessonsService.reorderContentBlocks(id, body.newOrder);
  }

  // ==================== RESOURCES ====================

  @Post(':id/resources')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async addResource(
    @Param('id') id: string,
    @Body() resource: LessonResourceDto,
  ) {
    return this.lessonsService.addResource(id, resource);
  }

  @Delete(':id/resources/:resourceId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async removeResource(
    @Param('id') id: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.lessonsService.removeResource(id, resourceId);
  }
}
