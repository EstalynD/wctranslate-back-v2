import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileFilter, fileSizeLimit } from '../common/filters/file.filter';
import { UsersService } from './users.service';
import {
  AdminCreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UpdateProfileDto,
  UpdateGamificationDto,
  UpdateSubscriptionAccessDto,
  AssignPlatformDto,
  AddAmountDto,
  QueryUsersDto,
} from './dto';
import { UserRole } from './schemas/user.schema';
import type { UserDocument } from './schemas/user.schema';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CoursesService } from '../courses/courses.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly coursesService: CoursesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ==================== ME: PERFIL PROPIO ====================
  // Rutas /me DEBEN ir antes de /:id para evitar que NestJS interprete "me" como un ID

  /**
   * GET /users/me - Obtener perfil del usuario autenticado
   */
  @Get('me')
  async getProfile(@CurrentUser() user: UserDocument) {
    return user;
  }

  /**
   * GET /users/me/gamification - Obtener gamificación propia
   */
  @Get('me/gamification')
  async getMyGamification(@CurrentUser() user: UserDocument) {
    return user.gamification;
  }

  /**
   * GET /users/me/subscription - Obtener suscripción propia
   */
  @Get('me/subscription')
  async getMySubscriptionAccess(@CurrentUser() user: UserDocument) {
    return user.subscriptionAccess;
  }

  /**
   * GET /users/me/courses - Obtener cursos accesibles según plataforma y plan
   *
   * REGLA: Si la modelo tiene streaming_platform → primero su módulo específico, luego generales.
   *        Si no tiene plataforma → solo cursos generales.
   *        Admin/Studio → retorna vacío.
   */
  @Get('me/courses')
  async getMyCourses(@CurrentUser() user: UserDocument) {
    return this.coursesService.getCoursesForUser(user);
  }

  /**
   * PUT /users/me - Actualizar datos propios (sin cambiar rol/status)
   */
  @Put('me')
  async updateMe(
    @CurrentUser() user: UserDocument,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Los usuarios no pueden cambiar su propio rol o estado
    delete updateUserDto.role;
    delete updateUserDto.status;
    return this.usersService.update(user._id.toString(), updateUserDto);
  }

  /**
   * PUT /users/me/profile - Actualizar perfil propio
   */
  @Put('me/profile')
  async updateMyProfile(
    @CurrentUser() user: UserDocument,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user._id.toString(), updateProfileDto);
  }

  /**
   * PUT /users/me/avatar - Subir/actualizar foto de perfil
   */
  @Put('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      fileFilter: imageFileFilter,
      limits: { fileSize: fileSizeLimit },
    }),
  )
  async updateMyAvatar(
    @CurrentUser() user: UserDocument,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Subir imagen a Cloudinary
    const uploadResult = await this.cloudinaryService.uploadFile(file, {
      folder: 'wctraining/avatars',
      publicId: `user-${user._id.toString()}`,
      overwrite: true,
      transformation: {
        width: 400,
        height: 400,
        crop: 'thumb',
        gravity: 'face',
        quality: 'auto',
        format: 'webp',
      },
    });

    // Actualizar avatarUrl en el perfil del usuario
    const updatedUser = await this.usersService.updateProfile(
      user._id.toString(),
      { avatarUrl: uploadResult.secureUrl },
    );

    return {
      message: 'Foto de perfil actualizada exitosamente',
      avatarUrl: uploadResult.secureUrl,
      user: updatedUser,
    };
  }

  /**
   * PUT /users/me/password - Cambiar contraseña propia
   */
  @Put('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: UserDocument,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(
      user._id.toString(),
      changePasswordDto,
    );
  }

  // ==================== ADMIN: CRUD COMPLETO ====================

  /**
   * POST /users - Admin crea un usuario (modelo/admin/studio) con plataforma opcional
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: AdminCreateUserDto) {
    const user = await this.usersService.adminCreate(dto);

    return {
      message: 'Usuario creado exitosamente',
      user,
    };
  }

  /**
   * GET /users - Admin lista usuarios con filtros y paginación
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  /**
   * GET /users/:id - Admin obtiene un usuario por ID
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * PUT /users/:id - Admin actualiza un usuario
   */
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * PUT /users/:id/profile - Admin actualiza perfil de un usuario
   */
  @Put(':id/profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUserProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(id, updateProfileDto);
  }

  /**
   * DELETE /users/:id - Admin elimina un usuario (soft delete)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.usersService.softDelete(id);
  }

  // ==================== ADMIN: PLATAFORMA ====================

  /**
   * PUT /users/:id/platform - Admin asigna/cambia plataforma de streaming
   */
  @Put(':id/platform')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async assignPlatform(
    @Param('id') id: string,
    @Body() dto: AssignPlatformDto,
  ) {
    const user = await this.usersService.assignPlatform(id, dto);

    return {
      message: 'Plataforma asignada exitosamente',
      user,
    };
  }

  // ==================== ADMIN: SUSCRIPCIÓN ====================

  /**
   * PUT /users/:id/subscription - Admin gestiona acceso de suscripción
   */
  @Put(':id/subscription')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionAccessDto,
  ) {
    return this.usersService.updateSubscriptionAccess(id, dto);
  }

  // ==================== ADMIN: GAMIFICACIÓN ====================

  /**
   * PUT /users/:id/gamification - Admin actualiza gamificación
   */
  @Put(':id/gamification')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateGamification(
    @Param('id') id: string,
    @Body() updateGamificationDto: UpdateGamificationDto,
  ) {
    return this.usersService.updateGamification(id, updateGamificationDto);
  }

  /**
   * POST /users/:id/gamification/xp - Admin agrega XP
   */
  @Post(':id/gamification/xp')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async addXp(@Param('id') id: string, @Body() dto: AddAmountDto) {
    return this.usersService.addXp(id, dto.amount);
  }

  /**
   * POST /users/:id/gamification/stars - Admin agrega estrellas
   */
  @Post(':id/gamification/stars')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async addStars(@Param('id') id: string, @Body() dto: AddAmountDto) {
    return this.usersService.addStars(id, dto.amount);
  }
}
