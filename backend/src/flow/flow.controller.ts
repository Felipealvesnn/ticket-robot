/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import { CreateFlowDto, UpdateFlowDto } from './dto/flow.dto';
import { FlowSwaggerEndpoint } from './flow.decorators';
import { FlowService } from './flow.service';

@ApiTags('Fluxos de Chat')
@Controller('flow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  @FlowSwaggerEndpoint.Create()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createFlowDto: CreateFlowDto,
  ) {
    return await this.flowService.create(user.companyId, createFlowDto);
  }

  @FlowSwaggerEndpoint.FindAll()
  @Get()
  async findAll(@CurrentUser() user: CurrentUserData) {
    return await this.flowService.findAll(user.companyId);
  }

  @FlowSwaggerEndpoint.FindOne()
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return await this.flowService.findOne(id, user.companyId);
  }

  @FlowSwaggerEndpoint.Update()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() updateFlowDto: UpdateFlowDto,
  ) {
    return await this.flowService.update(id, user.companyId, updateFlowDto);
  }

  @FlowSwaggerEndpoint.Remove()
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return await this.flowService.remove(id, user.companyId);
  }

  @FlowSwaggerEndpoint.ToggleActive()
  @Patch(':id/toggle-active')
  async toggleActive(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return await this.flowService.toggleActive(id, user.companyId);
  }

  @FlowSwaggerEndpoint.GetActiveFlows()
  @Get('active/list')
  async getActiveFlows(@CurrentUser() user: CurrentUserData) {
    return await this.flowService.getActiveFlows(user.companyId);
  }
}
