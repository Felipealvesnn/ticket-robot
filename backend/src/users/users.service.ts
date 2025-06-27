/* eslint-disable prettier/prettier */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileDto } from './dto/user-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca o perfil completo do usuário autenticado
   */
  async getMyProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return new UserProfileDto(user);
  }

  /**
   * Atualiza o perfil do usuário autenticado
   */
  async updateMyProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    // Verifica se o usuário existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Se está alterando o email, verifica se já não existe outro usuário com esse email
    if (
      updateProfileDto.email &&
      updateProfileDto.email !== existingUser.email
    ) {
      const userWithSameEmail = await this.prisma.user.findUnique({
        where: { email: updateProfileDto.email },
      });

      if (userWithSameEmail) {
        throw new ConflictException(
          'Este email já está sendo usado por outro usuário',
        );
      }
    }

    // Atualiza apenas os campos enviados
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateProfileDto.name && { name: updateProfileDto.name }),
        ...(updateProfileDto.email && { email: updateProfileDto.email }),
        ...(updateProfileDto.avatar !== undefined && {
          avatar: updateProfileDto.avatar,
        }),
        ...(updateProfileDto.phone !== undefined && {
          phone: updateProfileDto.phone,
        }),
        ...(updateProfileDto.address !== undefined && {
          address: updateProfileDto.address,
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return new UserProfileDto(updatedUser);
  }

  /**
   * Busca informações básicas de um usuário (para uso interno)
   */
  async findById(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        isActive: true,
      },
    });
  }
}
