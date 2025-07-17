import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import { DashboardSwaggerEndpoint } from './dashboard.decorators';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @DashboardSwaggerEndpoint.GetStats()
  async getStats(@CurrentUser() user: CurrentUserData) {
    return await this.dashboardService.getStats(user.companyId);
  }

  @Get('recent-activities')
  @DashboardSwaggerEndpoint.GetRecentActivities()
  async getRecentActivities(@CurrentUser() user: CurrentUserData) {
    return await this.dashboardService.getRecentActivities(user.companyId);
  }

  @Get('chart-data')
  @DashboardSwaggerEndpoint.GetChartData()
  async getChartData(@CurrentUser() user: CurrentUserData) {
    return await this.dashboardService.getChartData(user.companyId);
  }

  @Get('agent-performance')
  @DashboardSwaggerEndpoint.GetAgentPerformance()
  async getAgentPerformance(@CurrentUser() user: CurrentUserData) {
    return await this.dashboardService.getAgentPerformance(user.companyId);
  }

  @Get('system-status')
  @DashboardSwaggerEndpoint.GetSystemStatus()
  getSystemStatus() {
    return this.dashboardService.getSystemStatus();
  }

  @Get('activities')
  @DashboardSwaggerEndpoint.GetActivities()
  async getActivities(@CurrentUser() user: CurrentUserData) {
    return await this.dashboardService.getRecentActivities(user.companyId);
  }

  @Get()
  @DashboardSwaggerEndpoint.GetDashboard()
  async getDashboard(@CurrentUser() user: CurrentUserData) {
    return await this.dashboardService.getDashboard(user.companyId);
  }
}
