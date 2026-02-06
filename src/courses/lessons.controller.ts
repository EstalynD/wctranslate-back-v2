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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LessonsService } from './lessons.service';
import { CreateLessonDto, UpdateLessonDto, ContentBlockDto, LessonResourceDto } from './dto/lesson.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('lessons')
@UseGuards(AuthGuard)
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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

  // ==================== HTML UPLOAD (Cloudinary) ====================

  /**
   * Sube un archivo HTML a Cloudinary y devuelve la URL.
   * Se usa para bloques IFRAME con contenido HTML propio.
   */
  @Post('upload-html')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadHtml(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo HTML');
    }

    // Validar que sea HTML
    const allowedMimes = ['text/html', 'application/xhtml+xml'];
    if (!allowedMimes.includes(file.mimetype) && !file.originalname.endsWith('.html')) {
      throw new BadRequestException('Solo se permiten archivos HTML');
    }

    // Validar tamaño máximo (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo excede el tamaño máximo de 10MB');
    }

    const result = await this.cloudinaryService.uploadFromBuffer(file.buffer, {
      folder: folder || 'wctraining/training-content',
      resourceType: 'raw',
      publicId: file.originalname.replace(/\.html$/i, ''),
      overwrite: false,
    });

    return {
      url: result.secureUrl,
      publicId: result.publicId,
      bytes: result.bytes,
      originalName: file.originalname,
    };
  }

  /**
   * Reemplaza un HTML en Cloudinary: sube el nuevo y elimina el anterior.
   */
  @Put('upload-html')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async updateHtml(
    @UploadedFile() file: Express.Multer.File,
    @Body('oldUrl') oldUrl?: string,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo HTML');
    }

    const allowedMimes = ['text/html', 'application/xhtml+xml'];
    if (!allowedMimes.includes(file.mimetype) && !file.originalname.endsWith('.html')) {
      throw new BadRequestException('Solo se permiten archivos HTML');
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo excede el tamaño máximo de 10MB');
    }

    // Eliminar el anterior si se proporcionó
    if (oldUrl) {
      try {
        const publicId = this.extractPublicIdFromUrl(oldUrl);
        if (publicId) {
          await this.cloudinaryService.delete(publicId, 'raw');
        }
      } catch {
        // No bloquear el upload si falla la eliminación del anterior
      }
    }

    // Subir el nuevo
    const result = await this.cloudinaryService.uploadFromBuffer(file.buffer, {
      folder: folder || 'wctraining/training-content',
      resourceType: 'raw',
      publicId: file.originalname.replace(/\.html$/i, ''),
      overwrite: true,
    });

    return {
      url: result.secureUrl,
      publicId: result.publicId,
      bytes: result.bytes,
      originalName: file.originalname,
    };
  }

  /**
   * Elimina un HTML de Cloudinary por URL.
   */
  @Post('delete-html')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteHtml(@Body('url') url: string) {
    if (!url) {
      throw new BadRequestException('Se requiere la URL del HTML a eliminar');
    }

    const publicId = this.extractPublicIdFromUrl(url);
    if (!publicId) {
      throw new BadRequestException('No se pudo extraer el publicId de la URL');
    }

    const result = await this.cloudinaryService.delete(publicId, 'raw');
    return { deleted: result.result === 'ok', publicId };
  }

  /**
   * Extrae el publicId de una URL de Cloudinary.
   * Para recursos raw, la extensión ES parte del publicId.
   * Ej: https://res.cloudinary.com/dkzrxuhsc/raw/upload/v1234/wctraining/training-content/file.html
   *   → wctraining/training-content/file.html
   */
  private extractPublicIdFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/raw\/upload\/(?:v\d+\/)?(.+)/);
      if (!match) return null;
      // Para raw resources NO se remueve la extensión
      return match[1];
    } catch {
      return null;
    }
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
