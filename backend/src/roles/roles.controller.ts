import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import { RolesSwaggerEndpoint } from './roles.decorators';
import { RolesService } from './roles.service';

@ApiTags('🎭 Roles')
@Controller('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @RolesSwaggerEndpoint.GetAll()
  @Get()
  async getRoles(@CurrentUser() user: CurrentUserData) {
    return await this.rolesService.getAvailableRoles(user);
  }
}
