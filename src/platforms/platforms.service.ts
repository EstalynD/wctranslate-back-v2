import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Schemas
import {
  Platform,
  PlatformDocument,
  PlatformStatus,
  generatePlatformSlug,
} from './schemas/platform.schema';

// DTOs
import {
  CreatePlatformDto,
  UpdatePlatformDto,
  QueryPlatformDto,
} from './dto/platform.dto';

// Cloudinary
import { CloudinaryService } from '../cloudinary';

@Injectable()
export class PlatformsService {
  constructor(
    @InjectModel(Platform.name) private platformModel: Model<PlatformDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ==================== CRUD ====================

  /**
   * Crear una nueva plataforma
   */
  async create(
    createPlatformDto: CreatePlatformDto,
    faviconFile?: Express.Multer.File,
    logoFile?: Express.Multer.File,
  ): Promise<PlatformDocument> {
    // Verificar si ya existe una plataforma con el mismo nombre
    const existing = await this.platformModel.findOne({
      name: { $regex: new RegExp(`^${createPlatformDto.name}$`, 'i') },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe una plataforma con el nombre "${createPlatformDto.name}"`,
      );
    }

    // Subir favicon si se proporciona
    let faviconUrl = createPlatformDto.favicon;
    if (faviconFile) {
      const uploaded = await this.cloudinaryService.uploadFile(faviconFile, {
        folder: 'wctraining/platforms/favicons',
        transformation: { width: 64, height: 64, crop: 'fill' },
      });
      faviconUrl = uploaded.secureUrl;
    }

    // Subir logo si se proporciona
    let logoUrl = createPlatformDto.logoUrl;
    if (logoFile) {
      const uploaded = await this.cloudinaryService.uploadFile(logoFile, {
        folder: 'wctraining/platforms/logos',
        transformation: { width: 200, height: 200, crop: 'fit' },
      });
      logoUrl = uploaded.secureUrl;
    }

    const platform = new this.platformModel({
      ...createPlatformDto,
      slug: generatePlatformSlug(createPlatformDto.name),
      favicon: faviconUrl,
      logoUrl: logoUrl,
    });

    return platform.save();
  }

  /**
   * Obtener todas las plataformas con filtros y paginación
   */
  async findAll(query: QueryPlatformDto): Promise<{
    platforms: PlatformDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { status, type, search, page = 1, limit = 10, sortBy, sortOrder } = query;

    const filter: Record<string, any> = {};

    // Filtro por estado
    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    // Búsqueda por nombre o descripción
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Ordenamiento
    const sortField = sortBy || 'displayOrder';
    const order = sortOrder === 'desc' ? -1 : 1;
    const sort: Record<string, 1 | -1> = { [sortField]: order };

    const skip = (page - 1) * limit;

    const [platforms, total] = await Promise.all([
      this.platformModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.platformModel.countDocuments(filter),
    ]);

    return {
      platforms,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener una plataforma por ID
   */
  async findOne(id: string): Promise<PlatformDocument> {
    const platform = await this.platformModel.findById(id).exec();

    if (!platform) {
      throw new NotFoundException(`Plataforma con ID "${id}" no encontrada`);
    }

    return platform;
  }

  /**
   * Obtener una plataforma por slug
   */
  async findBySlug(slug: string): Promise<PlatformDocument> {
    const platform = await this.platformModel.findOne({ slug }).exec();

    if (!platform) {
      throw new NotFoundException(
        `Plataforma con slug "${slug}" no encontrada`,
      );
    }

    return platform;
  }

  /**
   * Actualizar una plataforma
   */
  async update(
    id: string,
    updatePlatformDto: UpdatePlatformDto,
    faviconFile?: Express.Multer.File,
    logoFile?: Express.Multer.File,
  ): Promise<PlatformDocument> {
    const platform = await this.findOne(id);

    // Verificar nombre duplicado si se está actualizando
    if (updatePlatformDto.name && updatePlatformDto.name !== platform.name) {
      const existing = await this.platformModel.findOne({
        name: { $regex: new RegExp(`^${updatePlatformDto.name}$`, 'i') },
        _id: { $ne: id },
      });

      if (existing) {
        throw new ConflictException(
          `Ya existe una plataforma con el nombre "${updatePlatformDto.name}"`,
        );
      }
    }

    // Subir nuevo favicon si se proporciona
    if (faviconFile) {
      // Eliminar favicon anterior si existe en Cloudinary
      if (platform.favicon && platform.favicon.includes('cloudinary')) {
        try {
          const publicId = this.extractPublicIdFromUrl(platform.favicon);
          if (publicId) await this.cloudinaryService.delete(publicId);
        } catch (error) {
          console.warn('Error eliminando favicon anterior:', error);
        }
      }

      const uploaded = await this.cloudinaryService.uploadFile(faviconFile, {
        folder: 'wctraining/platforms/favicons',
        transformation: { width: 64, height: 64, crop: 'fill' },
      });
      updatePlatformDto.favicon = uploaded.secureUrl;
    }

    // Subir nuevo logo si se proporciona
    if (logoFile) {
      // Eliminar logo anterior si existe en Cloudinary
      if (platform.logoUrl && platform.logoUrl.includes('cloudinary')) {
        try {
          const publicId = this.extractPublicIdFromUrl(platform.logoUrl);
          if (publicId) await this.cloudinaryService.delete(publicId);
        } catch (error) {
          console.warn('Error eliminando logo anterior:', error);
        }
      }

      const uploaded = await this.cloudinaryService.uploadFile(logoFile, {
        folder: 'wctraining/platforms/logos',
        transformation: { width: 200, height: 200, crop: 'fit' },
      });
      updatePlatformDto.logoUrl = uploaded.secureUrl;
    }

    Object.assign(platform, updatePlatformDto);
    return platform.save();
  }

  /**
   * Eliminar una plataforma
   */
  async remove(id: string): Promise<void> {
    const platform = await this.findOne(id);

    // Eliminar archivos de Cloudinary
    if (platform.favicon && platform.favicon.includes('cloudinary')) {
      try {
        const publicId = this.extractPublicIdFromUrl(platform.favicon);
        if (publicId) await this.cloudinaryService.delete(publicId);
      } catch (error) {
        console.warn('Error eliminando favicon:', error);
      }
    }

    if (platform.logoUrl && platform.logoUrl.includes('cloudinary')) {
      try {
        const publicId = this.extractPublicIdFromUrl(platform.logoUrl);
        if (publicId) await this.cloudinaryService.delete(publicId);
      } catch (error) {
        console.warn('Error eliminando logo:', error);
      }
    }

    await this.platformModel.findByIdAndDelete(id).exec();
  }

  /**
   * Obtener solo plataformas activas (para uso público)
   */
  async findActive(): Promise<PlatformDocument[]> {
    return this.platformModel
      .find({ status: PlatformStatus.ACTIVE })
      .sort({ displayOrder: 1, name: 1 })
      .exec();
  }

  /**
   * Actualizar orden de visualización
   */
  async updateOrder(
    updates: { id: string; displayOrder: number }[],
  ): Promise<void> {
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { displayOrder: update.displayOrder } },
      },
    }));

    await this.platformModel.bulkWrite(bulkOps);
  }

  /**
   * Cambiar estado de una plataforma
   */
  async toggleStatus(id: string): Promise<PlatformDocument> {
    const platform = await this.findOne(id);

    platform.status =
      platform.status === PlatformStatus.ACTIVE
        ? PlatformStatus.INACTIVE
        : PlatformStatus.ACTIVE;

    return platform.save();
  }

  /**
   * Extrae el public_id de una URL de Cloudinary
   * Ej: https://res.cloudinary.com/.../v123/wctraining/platforms/favicons/abc.jpg
   * -> wctraining/platforms/favicons/abc
   */
  private extractPublicIdFromUrl(url: string): string | null {
    try {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}
