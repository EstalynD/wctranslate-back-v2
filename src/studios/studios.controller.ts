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
} from '@nestjs/common';

// Guards
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

// Service
import { StudiosService } from './studios.service';

// DTOs
import {
  CreateStudioDto,
  UpdateStudioDto,
  StudioQueryDto,
  AssociateModelDto,
} from './dto/studio.dto';

@Controller('studios')
@UseGuards(AuthGuard)
export class StudiosController {
  constructor(private readonly studiosService: StudiosService) {}

  // ==================== CRUD ====================

  /**
   * POST /api/studios - Crear un nuevo estudio
   * Solo admins
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createStudioDto: CreateStudioDto) {
    const studio = await this.studiosService.create(createStudioDto);
    return {
      success: true,
      message: 'Estudio creado exitosamente',
      data: studio,
    };
  }

  /**
   * GET /api/studios - Obtener todos los estudios
   */
  @Get()
  async findAll(@Query() query: StudioQueryDto) {
    const studios = await this.studiosService.findAll(query);
    return {
      success: true,
      data: studios,
      count: studios.length,
    };
  }

  /**
   * GET /api/studios/ranking - Obtener ranking de estudios
   */
  @Get('ranking')
  async getRanking(@Query('limit') limit?: number) {
    const studios = await this.studiosService.getStudiosRanking(limit || 10);
    return {
      success: true,
      data: studios,
    };
  }

  /**
   * GET /api/studios/:id - Obtener un estudio por ID
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    const studio = await this.studiosService.findById(id);
    return {
      success: true,
      data: studio,
    };
  }

  /**
   * GET /api/studios/slug/:slug - Obtener un estudio por slug
   */
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const studio = await this.studiosService.findBySlug(slug);
    return {
      success: true,
      data: studio,
    };
  }

  /**
   * PUT /api/studios/:id - Actualizar un estudio
   * Solo admins
   */
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateStudioDto: UpdateStudioDto,
  ) {
    const studio = await this.studiosService.update(id, updateStudioDto);
    return {
      success: true,
      message: 'Estudio actualizado exitosamente',
      data: studio,
    };
  }

  /**
   * DELETE /api/studios/:id - Eliminar un estudio
   * Solo admins
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    await this.studiosService.delete(id);
    return {
      success: true,
      message: 'Estudio eliminado exitosamente',
    };
  }

  // ==================== GESTIÓN DE MODELOS ====================

  /**
   * POST /api/studios/associate - Asociar un modelo a un estudio
   * Solo admins
   */
  @Post('associate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async associateModel(@Body() dto: AssociateModelDto) {
    await this.studiosService.associateModel(dto.userId, dto.studioId);
    return {
      success: true,
      message: 'Modelo asociado al estudio exitosamente',
    };
  }

  /**
   * POST /api/studios/dissociate/:userId - Desasociar un modelo de su estudio
   * Solo admins
   */
  @Post('dissociate/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async dissociateModel(@Param('userId') userId: string) {
    await this.studiosService.dissociateModel(userId);
    return {
      success: true,
      message: 'Modelo desasociado del estudio exitosamente',
    };
  }

  /**
   * GET /api/studios/:id/models - Obtener modelos de un estudio
   */
  @Get(':id/models')
  async getStudioModels(@Param('id') id: string) {
    const models = await this.studiosService.getStudioModels(id);
    return {
      success: true,
      data: models,
      count: models.length,
    };
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * POST /api/studios/:id/update-stats - Actualizar estadísticas de un estudio
   * Solo admins
   */
  @Post(':id/update-stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateStats(@Param('id') id: string) {
    await this.studiosService.updateStudioStats(id);
    return {
      success: true,
      message: 'Estadísticas actualizadas exitosamente',
    };
  }

  /**
   * POST /api/studios/update-all-stats - Actualizar estadísticas de todos los estudios
   * Solo admins
   */
  @Post('update-all-stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateAllStats() {
    await this.studiosService.updateAllStudiosStats();
    return {
      success: true,
      message: 'Estadísticas de todos los estudios actualizadas',
    };
  }
}
