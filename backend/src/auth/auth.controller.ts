import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthSwaggerEndpoint } from './auth.decorators';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  FirstLoginPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from './dto/auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  AuthenticatedRequest,
  CurrentUserPayload,
  LoginResponse,
} from './interfaces/auth.interface';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('login')
  @AuthSwaggerEndpoint.Login()
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return await this.authService.login(loginDto);
  }
  @Post('register')
  @AuthSwaggerEndpoint.Register()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('refresh')
  @AuthSwaggerEndpoint.RefreshToken()
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(
      refreshTokenDto,
      refreshTokenDto.companyId,
    );
  }

  @Post('logout')
  @AuthSwaggerEndpoint.Logout()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: AuthenticatedRequest) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(token || '');
    return { message: 'Logout realizado com sucesso' };
  }
  @Post('change-password')
  @AuthSwaggerEndpoint.ChangePassword()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    // Adicionar o email do usuário autenticado ao DTO
    const changePasswordDtoWithUser = {
      ...changePasswordDto,
      userEmail: user.email,
    };

    return await this.authService.changePassword(changePasswordDtoWithUser);
  }

  @Post('change-first-login-password')
  @AuthSwaggerEndpoint.ChangeFirstLoginPassword()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changeFirstLoginPassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() firstLoginPasswordDto: FirstLoginPasswordDto,
  ) {
    return await this.authService.changeFirstLoginPassword(
      user.userId,
      firstLoginPasswordDto,
    );
  }

  @Get('verify')
  @AuthSwaggerEndpoint.Verify()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verify(@CurrentUser() user: CurrentUserPayload) {
    return await this.authService.verifyToken(user.userId);
  }
}
