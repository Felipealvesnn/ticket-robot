/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  FirstLoginPasswordDto,
} from './dto/auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  JwtPayload,
  AuthTokens,
  AuthUser,
  LoginResponse,
  UserCompany,
  RegisterResponse,
  PrismaCompanyUser,
  PrismaUserWithCompanies,
} from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<PrismaUserWithCompanies> {
    const user = await this.prisma.user.findUnique({
      where: { email, isActive: true },
      include: {
        companyUsers: {
          where: { isActive: true },
          include: {
            company: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const companies: UserCompany[] = user.companyUsers.map(
      (cu: PrismaCompanyUser) => ({
        id: cu.company.id,
        name: cu.company.name,
        slug: cu.company.slug,
        role: {
          id: cu.role.id,
          name: cu.role.name,
          permissions: JSON.parse(cu.role.permissions || '[]'),
        },
      }),
    );

    // Se o usuário tem empresas, seleciona a primeira como padrão
    const currentCompany = companies.length > 0 ? companies[0] : null;

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      companyId: currentCompany?.id,
      roleId: currentCompany?.role.id,
      permissions: currentCompany?.role.permissions || [],
    };

    const tokens = await this.generateTokens(payload);

    // Criar sessão no banco
    await this.createSession(user.id, tokens.accessToken);
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || undefined,
      companies,
      currentCompany: currentCompany || undefined,
    };

    return {
      user: authUser,
      tokens,
      isFirstLogin: user.isFirstLogin, // Indica se precisa trocar senha
    };
  }
  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    // Verificar se usuário já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Usuário já existe com este email');
    }

    // Usar senha padrão "123" para primeiro login
    const defaultPassword = '123';
    const hashedPassword = await bcrypt.hash(
      defaultPassword,
      parseInt(this.configService.get('BCRYPT_ROUNDS') || '12'),
    );

    // Criar usuário com isFirstLogin: true
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        isFirstLogin: true, // Força mudança de senha no primeiro login
      },
      select: {
        id: true,
        email: true,
        name: true,
        isFirstLogin: true,
        createdAt: true,
      },
    });

    return {
      user,
      message: 'Usuário criado com sucesso. Senha inicial: 123',
    };
  }
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Verificar se refresh token existe no banco e não está revogado
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshTokenDto.refreshToken },
      });

      if (
        !storedToken ||
        storedToken.isRevoked ||
        storedToken.expiresAt < new Date()
      ) {
        throw new UnauthorizedException('Refresh token inválido ou expirado');
      }

      // Buscar dados atualizados do usuário
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub, isActive: true },
        include: {
          companyUsers: {
            where: { isActive: true, companyId: payload.companyId },
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      const currentCompanyUser = user.companyUsers[0];
      const permissions = currentCompanyUser
        ? JSON.parse(currentCompanyUser.role.permissions || '[]')
        : [];

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        companyId: payload.companyId,
        roleId: currentCompanyUser?.roleId,
        permissions,
      };

      const tokens = await this.generateTokens(newPayload);

      // Revogar o refresh token usado
      await this.prisma.refreshToken.update({
        where: { token: refreshTokenDto.refreshToken },
        data: { isRevoked: true },
      });

      // Criar nova sessão
      await this.createSession(user.id, tokens.accessToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async logout(token: string): Promise<void> {
    // Revogar sessão
    await this.prisma.session.deleteMany({
      where: { token },
    });

    // Revogar todos os refresh tokens do usuário (opcional)
    try {
      const payload = this.jwtService.decode(token);
      if (payload?.sub) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: payload.sub, isRevoked: false },
          data: { isRevoked: true },
        });
      }
    } catch {
      // Ignorar erro de token inválido no logout
    }
  }

  async changePassword(
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // Buscar usuário
    const user = await this.prisma.user.findUnique({
      where: { email: changePasswordDto.userEmail, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    // Verificar se nova senha é diferente da atual
    const isSamePassword = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new ConflictException(
        'A nova senha deve ser diferente da senha atual',
      );
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      parseInt(this.configService.get('BCRYPT_ROUNDS') || '12'),
    );

    // Atualizar senha e marcar que não é mais primeiro login (se era)
    await this.prisma.user.update({
      where: { email: changePasswordDto.userEmail },
      data: {
        password: hashedNewPassword,
        isFirstLogin: false, // Sempre marca como false após trocar senha
        updatedAt: new Date(),
      },
    });

    // Revogar todas as sessões e refresh tokens existentes para forçar novo login
    await Promise.all([
      this.prisma.session.deleteMany({
        where: { user },
      }),
      this.prisma.refreshToken.updateMany({
        where: { user, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);

    return { message: 'Senha alterada com sucesso. Faça login novamente.' };
  }

  async changeFirstLoginPassword(
    userId: string,
    firstLoginPasswordDto: FirstLoginPasswordDto,
  ): Promise<{
    message: string;
    user: { id: string; email: string; name: string; isFirstLogin: boolean };
    tokens: AuthTokens;
  }> {
    // Buscar usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      include: {
        companyUsers: {
          where: { isActive: true },
          include: {
            company: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Verificar se é primeiro login
    if (!user.isFirstLogin) {
      throw new BadRequestException('Usuário não está em primeiro login');
    }

    // Verificar senha atual (deve ser "123")
    const isCurrentPasswordValid = await bcrypt.compare(
      firstLoginPasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(
      firstLoginPasswordDto.newPassword,
      parseInt(this.configService.get('BCRYPT_ROUNDS') || '12'),
    );

    // Atualizar senha e marcar que não é mais primeiro login
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        isFirstLogin: false,
        updatedAt: new Date(),
      },
    });

    // Revogar refresh tokens existentes
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    }); // Gerar novos tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyUsers[0]?.companyId || undefined,
      roleId: user.companyUsers[0]?.roleId || undefined,
      permissions: user.companyUsers[0]?.role.permissions
        ? JSON.parse(user.companyUsers[0].role.permissions)
        : [],
    };

    const tokens = await this.generateTokens(payload);

    // Salvar novo refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await this.prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Criar nova sessão
    await this.createSession(user.id, tokens.accessToken);

    return {
      message: 'Senha alterada com sucesso',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isFirstLogin: updatedUser.isFirstLogin,
      },
      tokens,
    };
  }

  private async generateTokens(payload: JwtPayload): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') || '15m',
      }),
      this.jwtService.signAsync(
        { sub: payload.sub, email: payload.email },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        },
      ),
    ]);

    // Salvar refresh token no banco
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: payload.sub,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private async createSession(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutos

    await this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }
}
