/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ChangeCompanyDto,
  FirstLoginPasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }

  @Post('change-company')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changeCompany(
    @CurrentUser() user: any,
    @Body() changeCompanyDto: ChangeCompanyDto,
  ) {
    return await this.authService.changeCompany(user.userId, changeCompanyDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(token);
    return { message: 'Logout realizado com sucesso' };
  }

  @Post('change-first-login-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changeFirstLoginPassword(
    @CurrentUser() user: any,
    @Body() firstLoginPasswordDto: FirstLoginPasswordDto,
  ) {
    return await this.authService.changeFirstLoginPassword(
      user.userId,
      firstLoginPasswordDto,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return {
      userId: user.userId,
      email: user.email,
      companyId: user.companyId,
      roleName: user.roleName,
      permissions: user.permissions,
      user: {
        id: user.user.id,
        email: user.user.email,
        name: user.user.name,
        avatar: user.user.avatar,
      },
      company: user.company
        ? {
            id: user.company.id,
            name: user.company.name,
            slug: user.company.slug,
          }
        : null,
    };
  }
}
