import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import { ContactSwaggerEndpoint } from './contact.decorators';
import { ContactService } from './contact.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';

@ApiTags('Contatos')
@Controller('contact')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @ContactSwaggerEndpoint.Create()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createContactDto: CreateContactDto,
  ) {
    return await this.contactService.create(user.companyId, createContactDto);
  }

  @ContactSwaggerEndpoint.FindAll()
  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('messagingSessionId') messagingSessionId?: string,
    @Query('isBlocked') isBlocked?: boolean,
  ) {
    const contacts = await this.contactService.findAll(
      user.companyId,
      messagingSessionId,
      isBlocked,
    );

    return {
      contacts,
      total: contacts.length,
      hasMore: false,
    };
  }

  @ContactSwaggerEndpoint.GetRecentContacts()
  @Get('recent')
  async getRecentContacts(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: number,
  ) {
    return await this.contactService.getRecentContacts(user.companyId, limit);
  }

  @ContactSwaggerEndpoint.SearchContacts()
  @Get('search')
  async searchContacts(
    @CurrentUser() user: CurrentUserData,
    @Query('q') query: string,
  ) {
    return await this.contactService.searchContacts(user.companyId, query);
  }

  @ContactSwaggerEndpoint.FindOne()
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return await this.contactService.findOne(id, user.companyId);
  }

  @ContactSwaggerEndpoint.GetByPhoneNumber()
  @Get('phone/:phoneNumber')
  async getByPhoneNumber(
    @Param('phoneNumber') phoneNumber: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return await this.contactService.getByPhoneNumber(
      user.companyId,
      phoneNumber,
    );
  }

  @ContactSwaggerEndpoint.Update()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return await this.contactService.update(
      id,
      user.companyId,
      updateContactDto,
    );
  }

  @ContactSwaggerEndpoint.Block()
  @Patch(':id/block')
  async block(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return await this.contactService.block(id, user.companyId);
  }

  @ContactSwaggerEndpoint.Unblock()
  @Patch(':id/unblock')
  async unblock(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return await this.contactService.unblock(id, user.companyId);
  }
}
