/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  FirstLoginPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from './dto/auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  AuthTokens,
  AuthUser,
  JwtPayload,
  LoginResponse,
  PrismaCompanyUser,
  PrismaUserWithCompanies,
  RegisterResponse,
  UserCompany,
} from './interfaces/auth.interface';
import { DeviceInfo, DeviceInfoExtractor } from './utils/device-info.util';
import { parsePermissions } from './utils/permissions.util';

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

  async login(loginDto: LoginDto, req?: any): Promise<LoginResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const companies: UserCompany[] = user.companyUsers.map(
      (cu: PrismaCompanyUser) => ({
        id: cu.company.id,
        name: cu.company.name,
        slug: cu.company.slug,
        role: {
          id: cu.role.id,
          name: cu.role.name,
          permissions: parsePermissions(cu.role.permissions),
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
      isFirstLogin: user.isFirstLogin, // Manter o estado de primeiro login
      permissions: currentCompany?.role.permissions || [],
    };

    const tokens = await this.generateTokens(payload);

    // Preparar coordenadas se fornecidas
    const coordinates =
      loginDto.latitude && loginDto.longitude
        ? {
            lat: loginDto.latitude,
            lng: loginDto.longitude,
            accuracy: loginDto.accuracy,
          }
        : undefined;

    // Extrair informações do dispositivo se request estiver disponível
    const deviceInfo = req
      ? DeviceInfoExtractor.extractFromRequest(req, coordinates)
      : {};

    // Verificar se é um dispositivo conhecido
    const existingSession = await this.prisma.session.findFirst({
      where: {
        userId: user.id,
        deviceId: deviceInfo.deviceId,
      },
    });

    const isFirstLoginOnDevice = !existingSession;

    // Criar sessão no banco com informações do dispositivo
    await this.createSessionWithDeviceInfo(user.id, tokens.accessToken, {
      ...deviceInfo,
      userAgent: req?.headers['user-agent'],
      ipAddress: this.getClientIP(req) || undefined,
      isFirstLogin: isFirstLoginOnDevice,
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      isFirstLogin: user.isFirstLogin || false, // Manter o estado de primeiro login
      name: user.name,
      avatar: user.avatar || undefined,
      companies,
      currentCompany: currentCompany || undefined,
    };

    return {
      user: authUser,
      tokens,
      isFirstLogin: user.isFirstLogin, // Indica se precisa trocar senha
      deviceInfo: {
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        operatingSystem: deviceInfo.operatingSystem,
        browser: deviceInfo.browser,
        location:
          deviceInfo.city && deviceInfo.country
            ? `${deviceInfo.city}, ${deviceInfo.country}`
            : undefined,
        isFirstLoginOnDevice: isFirstLoginOnDevice,
        coordinates:
          deviceInfo.latitude && deviceInfo.longitude
            ? {
                latitude: deviceInfo.latitude,
                longitude: deviceInfo.longitude,
                accuracy: deviceInfo.accuracy,
              }
            : undefined,
      },
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
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    requestedCompanyId?: string,
  ): Promise<AuthTokens> {
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

      // Buscar dados atualizados do usuário com todas as empresas
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub, isActive: true },
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

      // Determinar qual empresa usar:
      // 1. Se requestedCompanyId for fornecido, usar ele
      // 2. Senão, usar o companyId do payload atual
      // 3. Senão, usar a primeira empresa disponível
      const targetCompanyId = requestedCompanyId || payload.companyId;

      const currentCompanyUser = targetCompanyId
        ? user.companyUsers.find((cu) => cu.companyId === targetCompanyId)
        : user.companyUsers[0];

      if (!currentCompanyUser) {
        throw new UnauthorizedException(
          'Usuário não tem acesso à empresa solicitada',
        );
      }

      const permissions = parsePermissions(currentCompanyUser.role.permissions);

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        companyId: currentCompanyUser.companyId,
        roleId: currentCompanyUser.roleId,
        permissions,
        isFirstLogin: user.isFirstLogin, // Manter o estado de primeiro login
      };

      const tokens = await this.generateTokens(newPayload);

      // Revogar o refresh token usado
      await this.prisma.refreshToken.update({
        where: { token: refreshTokenDto.refreshToken },
        data: { isRevoked: true },
      });

      // Criar nova sessão
      await this.createSession(user.id, tokens.accessToken);

      console.log(
        `🔄 Refresh token: usuário ${user.name} agora está na empresa ${currentCompanyUser.company.name}`,
      );

      return tokens;
    } catch (error) {
      console.error('Erro no refresh token:', error);
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
        ? parsePermissions(user.companyUsers[0].role.permissions)
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

  async verifyToken(userId: string): Promise<{
    userId: string;
    email: string;
    companyId: string | null;
    roleName: string | null;
    permissions: string[];
    user: AuthUser;
    currentCompany: UserCompany | null;
  }> {
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

    // Pegar a primeira empresa ativa (ou implementar lógica de empresa atual)
    const currentCompanyUser = user.companyUsers[0] || null;

    // Parse das permissões do role (JSON string para array)
    const permissions = currentCompanyUser?.role
      ? parsePermissions(currentCompanyUser.role.permissions)
      : [];

    const currentCompany: UserCompany | null = currentCompanyUser
      ? {
          id: currentCompanyUser.company.id,
          name: currentCompanyUser.company.name,
          slug: currentCompanyUser.company.slug,
          role: {
            id: currentCompanyUser.role.id,
            name: currentCompanyUser.role.name,
            permissions,
          },
        }
      : null;

    // Mapear todas as empresas do usuário
    const allCompanies: UserCompany[] = user.companyUsers.map((companyUser) => {
      const companyPermissions = parsePermissions(companyUser.role.permissions);
      return {
        id: companyUser.company.id,
        name: companyUser.company.name,
        slug: companyUser.company.slug,
        role: {
          id: companyUser.role.id,
          name: companyUser.role.name,
          permissions: companyPermissions,
        },
      };
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      isFirstLogin: user.isFirstLogin || false, // Manter o estado de primeiro login
      name: user.name,
      avatar: user.avatar || undefined,
      phone: user.phone || undefined,
      address: user.address || undefined,
      companies: allCompanies, // Retornar todas as empresas
      currentCompany: currentCompany || undefined,
    };

    return {
      userId: user.id,
      email: user.email,
      companyId: currentCompany?.id || null,
      roleName: currentCompany?.role?.name || null,
      permissions,
      user: authUser,
      currentCompany,
    };
  }

  private async generateTokens(payload: JwtPayload): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') || '24h', // 24 horas em vez de 15m
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

  private async createSessionWithDeviceInfo(
    userId: string,
    token: string,
    deviceInfo: DeviceInfo & {
      userAgent?: string;
      ipAddress?: string;
      isFirstLogin?: boolean;
    },
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutos

    await this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        operatingSystem: deviceInfo.operatingSystem,
        browser: deviceInfo.browser,
        browserVersion: deviceInfo.browserVersion,
        country: deviceInfo.country,
        region: deviceInfo.region,
        city: deviceInfo.city,
        timezone: deviceInfo.timezone,
        latitude: deviceInfo.latitude,
        longitude: deviceInfo.longitude,
        accuracy: deviceInfo.accuracy,
        isFirstLogin: deviceInfo.isFirstLogin || false,
        isTrusted: false, // Por padrão, novos dispositivos não são confiáveis
      },
    });
  }

  private getClientIP(req: any): string | null {
    if (!req) return null;

    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      null
    );
  }
}
