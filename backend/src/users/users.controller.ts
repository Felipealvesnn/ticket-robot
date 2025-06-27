/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Obter perfil do usuário autenticado
   * GET /users/me
   */
  @Get('me')
  async getMyProfile(
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserProfileDto> {
    return await this.usersService.getMyProfile(user.userId);
  }

  /**
   * Atualizar perfil do usuário autenticado
   * PATCH /users/me
   */
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateMyProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    return await this.usersService.updateMyProfile(
      user.userId,
      updateProfileDto,
    );
  }
}
