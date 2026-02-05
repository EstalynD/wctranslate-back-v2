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
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UpdateProfileDto,
  UpdateGamificationDto,
} from './dto';
import { UserStatus, UserRole } from './schemas/user.schema';
import type { UserDocument } from './schemas/user.schema';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: UserStatus,
  ) {
    return this.usersService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      status,
    );
  }

  @Get('me')
  async getProfile(@CurrentUser() user: UserDocument) {
    return user;
  }

  @Get('me/gamification')
  async getMyGamification(@CurrentUser() user: UserDocument) {
    return user.gamification;
  }

  @Get('me/subscription')
  async getMySubscriptionAccess(@CurrentUser() user: UserDocument) {
    return user.subscriptionAccess;
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put('me')
  async updateProfile(
    @CurrentUser() user: UserDocument,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Los usuarios no pueden cambiar su propio rol o estado
    delete updateUserDto.role;
    delete updateUserDto.status;
    return this.usersService.update(user._id.toString(), updateUserDto);
  }

  @Put('me/profile')
  async updateMyProfile(
    @CurrentUser() user: UserDocument,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user._id.toString(), updateProfileDto);
  }

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

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Put(':id/profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUserProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(id, updateProfileDto);
  }

  @Put(':id/gamification')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateGamification(
    @Param('id') id: string,
    @Body() updateGamificationDto: UpdateGamificationDto,
  ) {
    return this.usersService.updateGamification(id, updateGamificationDto);
  }

  @Post(':id/gamification/xp')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async addXp(@Param('id') id: string, @Body('amount') amount: number) {
    return this.usersService.addXp(id, amount);
  }

  @Post(':id/gamification/stars')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async addStars(@Param('id') id: string, @Body('amount') amount: number) {
    return this.usersService.addStars(id, amount);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.usersService.softDelete(id);
  }
}
