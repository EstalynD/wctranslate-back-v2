import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Schemas
import { Studio, StudioDocument, StudioStatus } from './schemas/studio.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

// DTOs
import {
  CreateStudioDto,
  UpdateStudioDto,
  StudioQueryDto,
} from './dto/studio.dto';

@Injectable()
export class StudiosService {
  constructor(
    @InjectModel(Studio.name) private studioModel: Model<StudioDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // ==================== CRUD ====================

  /**
   * Crear un nuevo estudio
   */
  async create(createStudioDto: CreateStudioDto): Promise<StudioDocument> {
    // Verificar si ya existe un estudio con el mismo nombre
    const existing = await this.studioModel.findOne({
      name: { $regex: new RegExp(`^${createStudioDto.name}$`, 'i') },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un estudio con el nombre "${createStudioDto.name}"`,
      );
    }

    const studio = new this.studioModel(createStudioDto);
    return studio.save();
  }

  /**
   * Obtener todos los estudios con filtros
   */
  async findAll(query: StudioQueryDto): Promise<StudioDocument[]> {
    const filter: any = {};

    // Filtro por estado
    if (query.status) {
      filter.status = query.status;
    }

    // Búsqueda por nombre o propietario
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { ownerName: { $regex: query.search, $options: 'i' } },
      ];
    }

    // Ordenamiento
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = {};

    if (sortField === 'totalModels') {
      sort['stats.totalModels'] = sortOrder;
    } else {
      sort[sortField] = sortOrder;
    }

    return this.studioModel.find(filter).sort(sort).exec();
  }

  /**
   * Obtener un estudio por ID
   */
  async findById(id: string): Promise<StudioDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de estudio inválido');
    }

    const studio = await this.studioModel.findById(id).exec();

    if (!studio) {
      throw new NotFoundException(`Estudio con ID ${id} no encontrado`);
    }

    return studio;
  }

  /**
   * Obtener un estudio por slug
   */
  async findBySlug(slug: string): Promise<StudioDocument> {
    const studio = await this.studioModel.findOne({ slug }).exec();

    if (!studio) {
      throw new NotFoundException(`Estudio "${slug}" no encontrado`);
    }

    return studio;
  }

  /**
   * Actualizar un estudio
   */
  async update(
    id: string,
    updateStudioDto: UpdateStudioDto,
  ): Promise<StudioDocument> {
    const studio = await this.findById(id);

    // Si se cambia el nombre, verificar que no exista otro con ese nombre
    if (updateStudioDto.name && updateStudioDto.name !== studio.name) {
      const existing = await this.studioModel.findOne({
        name: { $regex: new RegExp(`^${updateStudioDto.name}$`, 'i') },
        _id: { $ne: id },
      });

      if (existing) {
        throw new ConflictException(
          `Ya existe un estudio con el nombre "${updateStudioDto.name}"`,
        );
      }
    }

    Object.assign(studio, updateStudioDto);
    return studio.save();
  }

  /**
   * Eliminar un estudio
   */
  async delete(id: string): Promise<void> {
    const studio = await this.findById(id);

    // Verificar si tiene modelos asociados
    const modelsCount = await this.userModel.countDocuments({
      'modelConfig.studioId': new Types.ObjectId(id),
    });

    if (modelsCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar el estudio porque tiene ${modelsCount} modelo(s) asociado(s). Desasócielos primero.`,
      );
    }

    await this.studioModel.findByIdAndDelete(id);
  }

  // ==================== GESTIÓN DE MODELOS ====================

  /**
   * Asociar un modelo/usuario a un estudio
   */
  async associateModel(userId: string, studioId: string): Promise<void> {
    // Verificar que el estudio existe
    const studio = await this.findById(studioId);

    // Verificar que el usuario existe
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Verificar si ya está asociado a otro estudio
    if (
      user.modelConfig?.studioId &&
      user.modelConfig.studioId.toString() !== studioId
    ) {
      // Decrementar contador del estudio anterior
      await this.decrementModelCount(user.modelConfig.studioId.toString());
    }

    // Actualizar el usuario
    await this.userModel.findByIdAndUpdate(userId, {
      'modelConfig.studioId': new Types.ObjectId(studioId),
    });

    // Incrementar contador del nuevo estudio
    await this.incrementModelCount(studioId);
  }

  /**
   * Desasociar un modelo/usuario de su estudio
   */
  async dissociateModel(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    if (user.modelConfig?.studioId) {
      const studioId = user.modelConfig.studioId.toString();

      // Actualizar el usuario
      await this.userModel.findByIdAndUpdate(userId, {
        'modelConfig.studioId': null,
      });

      // Decrementar contador del estudio
      await this.decrementModelCount(studioId);
    }
  }

  /**
   * Obtener todos los modelos de un estudio
   */
  async getStudioModels(studioId: string): Promise<UserDocument[]> {
    await this.findById(studioId); // Verificar que existe

    return this.userModel
      .find({
        'modelConfig.studioId': new Types.ObjectId(studioId),
      })
      .select('-password')
      .exec();
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Actualizar estadísticas del estudio
   */
  async updateStudioStats(studioId: string): Promise<void> {
    const users = await this.userModel.find({
      'modelConfig.studioId': new Types.ObjectId(studioId),
    });

    const stats = {
      totalModels: users.length,
      activeModels: users.filter((u) => u.status === 'active').length,
      totalTokensEarned: users.reduce(
        (sum, u) => sum + (u.gamification?.currentXp || 0),
        0,
      ),
      totalLessonsCompleted: 0, // Se actualizará con el sistema de progreso
    };

    await this.studioModel.findByIdAndUpdate(studioId, { stats });
  }

  /**
   * Actualizar estadísticas de todos los estudios
   */
  async updateAllStudiosStats(): Promise<void> {
    const studios = await this.studioModel.find().select('_id');

    for (const studio of studios) {
      await this.updateStudioStats(studio._id.toString());
    }
  }

  /**
   * Obtener ranking de estudios por modelos
   */
  async getStudiosRanking(limit: number = 10): Promise<StudioDocument[]> {
    return this.studioModel
      .find({ status: StudioStatus.ACTIVE })
      .sort({ 'stats.totalModels': -1 })
      .limit(limit)
      .exec();
  }

  // ==================== HELPERS ====================

  private async incrementModelCount(studioId: string): Promise<void> {
    await this.studioModel.findByIdAndUpdate(studioId, {
      $inc: { 'stats.totalModels': 1, 'stats.activeModels': 1 },
    });
  }

  private async decrementModelCount(studioId: string): Promise<void> {
    await this.studioModel.findByIdAndUpdate(studioId, {
      $inc: { 'stats.totalModels': -1, 'stats.activeModels': -1 },
    });
  }
}
