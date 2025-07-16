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
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import { CompanySwaggerEndpoint } from './company.decorators';
import { CompanyService } from './company.service';
import {
  AddUserToCompanyDto,
  CreateCompanyDto,
  CreateCompanyWithUserDto,
  UpdateCompanyDto,
} from './dto/company.dto';

@ApiTags('Empresas')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @CompanySwaggerEndpoint.Create()
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    return await this.companyService.create(createCompanyDto);
  }

  @CompanySwaggerEndpoint.FindAll()
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return await this.companyService.findAll();
  }

  @CompanySwaggerEndpoint.FindOne()
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return await this.companyService.findOne(id);
  }

  @CompanySwaggerEndpoint.FindBySlug()
  @Get('slug/:slug')
  @UseGuards(JwtAuthGuard)
  async findBySlug(@Param('slug') slug: string) {
    return await this.companyService.findBySlug(slug);
  }

  @CompanySwaggerEndpoint.Update()
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return await this.companyService.update(id, updateCompanyDto);
  }

  @CompanySwaggerEndpoint.Remove()
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return await this.companyService.remove(id);
  }

  @CompanySwaggerEndpoint.AddUser()
  @Post(':id/users')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async addUser(
    @Param('id') id: string,
    @Body() addUserDto: AddUserToCompanyDto,
  ) {
    return await this.companyService.addUser(id, addUserDto);
  }

  @CompanySwaggerEndpoint.RemoveUser()
  @Delete(':id/users/:userId')
  @UseGuards(JwtAuthGuard)
  async removeUser(@Param('id') id: string, @Param('userId') userId: string) {
    return await this.companyService.removeUser(id, userId);
  }

  @CompanySwaggerEndpoint.GetMyCompanies()
  @Get('my/companies')
  @UseGuards(JwtAuthGuard)
  async getMyCompanies(@CurrentUser() user: CurrentUserData) {
    return await this.companyService.getUserCompanies(user.userId);
  }

  @CompanySwaggerEndpoint.CreateWithUser()
  @Post('with-user')
  @HttpCode(HttpStatus.CREATED)
  async createWithUser(
    @Body() createCompanyWithUserDto: CreateCompanyWithUserDto,
  ) {
    return await this.companyService.createWithUser(createCompanyWithUserDto);
  }
}
