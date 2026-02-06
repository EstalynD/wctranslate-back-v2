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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

// Guards
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

// Service
import { PlatformsService } from './platforms.service';

// DTOs
import {
  CreatePlatformDto,
  UpdatePlatformDto,
  QueryPlatformDto,
} from './dto/platform.dto';

// File validation
import { imageFileFilter, fileSizeLimit } from '../common/filters';

@Controller('platforms')
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  // ==================== CRUD ====================

  /**
   * POST /api/platforms - Crear una nueva plataforma
   * Solo admins
   */
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'favicon', maxCount: 1 },
        { name: 'logo', maxCount: 1 },
      ],
      {
        fileFilter: imageFileFilter,
        limits: { fileSize: fileSizeLimit },
      },
    ),
  )
  async create(
    @Body() createPlatformDto: CreatePlatformDto,
    @UploadedFiles()
    files: {
      favicon?: Express.Multer.File[];
      logo?: Express.Multer.File[];
    },
  ) {
    const platform = await this.platformsService.create(
      createPlatformDto,
      files?.favicon?.[0],
      files?.logo?.[0],
    );

    return {
      success: true,
      message: 'Plataforma creada exitosamente',
      data: platform,
    };
  }

  /**
   * GET /api/platforms - Obtener todas las plataformas
   */
  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Query() query: QueryPlatformDto) {
    const result = await this.platformsService.findAll(query);

    return {
      success: true,
      data: result.platforms,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  /**
   * GET /api/platforms/active - Obtener plataformas activas (público)
   */
  @Get('active')
  async findActive() {
    const platforms = await this.platformsService.findActive();

    return {
      success: true,
      data: platforms,
      count: platforms.length,
    };
  }

  /**
   * GET /api/platforms/:id - Obtener una plataforma por ID
   */
  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string) {
    const platform = await this.platformsService.findOne(id);

    return {
      success: true,
      data: platform,
    };
  }

  /**
   * GET /api/platforms/slug/:slug - Obtener plataforma por slug
   */
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const platform = await this.platformsService.findBySlug(slug);

    return {
      success: true,
      data: platform,
    };
  }

  /**
   * PUT /api/platforms/:id - Actualizar una plataforma
   * Solo admins
   */
  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'favicon', maxCount: 1 },
        { name: 'logo', maxCount: 1 },
      ],
      {
        fileFilter: imageFileFilter,
        limits: { fileSize: fileSizeLimit },
      },
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() updatePlatformDto: UpdatePlatformDto,
    @UploadedFiles()
    files: {
      favicon?: Express.Multer.File[];
      logo?: Express.Multer.File[];
    },
  ) {
    const platform = await this.platformsService.update(
      id,
      updatePlatformDto,
      files?.favicon?.[0],
      files?.logo?.[0],
    );

    return {
      success: true,
      message: 'Plataforma actualizada exitosamente',
      data: platform,
    };
  }

  /**
   * PATCH /api/platforms/:id/toggle-status - Cambiar estado
   * Solo admins
   */
  @Patch(':id/toggle-status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleStatus(@Param('id') id: string) {
    const platform = await this.platformsService.toggleStatus(id);

    return {
      success: true,
      message: `Plataforma ${platform.status === 'ACTIVE' ? 'activada' : 'desactivada'} exitosamente`,
      data: platform,
    };
  }

  /**
   * PATCH /api/platforms/order - Actualizar orden de visualización
   * Solo admins
   */
  @Patch('order')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateOrder(
    @Body() updates: { id: string; displayOrder: number }[],
  ) {
    await this.platformsService.updateOrder(updates);

    return {
      success: true,
      message: 'Orden actualizado exitosamente',
    };
  }

  /**
   * DELETE /api/platforms/:id - Eliminar una plataforma
   * Solo admins
   */
  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.platformsService.remove(id);

    return {
      success: true,
      message: 'Plataforma eliminada exitosamente',
    };
  }
}
