import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReportFiltersDto } from './dto/report-filters.dto';
import {
  ContactReport,
  MessageReport,
  OverviewStats,
  PerformanceReport,
} from './interfaces/report-types.interface';
import { ReportsSwaggerEndpoint } from './reports.decorators';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @ReportsSwaggerEndpoint.GetOverviewStats()
  @Roles('USER', 'COMPANY_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN')
  async getOverviewStats(
    @Query() filters: ReportFiltersDto,
    @Request() req: any,
  ): Promise<OverviewStats> {
    try {
      const companyId = (req.user?.companyId ||
        req.headers['x-company-id']) as string;
      return await this.reportsService.getOverviewStats(filters, companyId);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de visão geral:', error);
      throw new HttpException(
        'Erro ao buscar estatísticas de visão geral',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('messages')
  @ReportsSwaggerEndpoint.GetMessageReport()
  @Roles('USER', 'COMPANY_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN')
  async getMessageReport(
    @Query() filters: ReportFiltersDto,
    @Request() req: any,
  ): Promise<MessageReport> {
    try {
      const pageNumber = parseInt(filters.page || '1', 10);
      const limitNumber = parseInt(filters.limit || '50', 10);
      const companyId = (req.user?.companyId ||
        req.headers['x-company-id']) as string;

      return await this.reportsService.getMessageReport(
        filters,
        companyId,
        pageNumber,
        limitNumber,
      );
    } catch (error) {
      console.error('Erro ao buscar relatório de mensagens:', error);
      throw new HttpException(
        'Erro ao buscar relatório de mensagens',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('contacts')
  @ReportsSwaggerEndpoint.GetContactReport()
  @Roles('USER', 'COMPANY_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN')
  async getContactReport(
    @Query() filters: ReportFiltersDto,
    @Request() req: any,
  ): Promise<ContactReport> {
    try {
      const pageNumber = parseInt(filters.page || '1', 10);
      const limitNumber = parseInt(filters.limit || '50', 10);
      const companyId = (req.user?.companyId ||
        req.headers['x-company-id']) as string;

      return await this.reportsService.getContactReport(
        filters,
        companyId,
        pageNumber,
        limitNumber,
      );
    } catch (error) {
      console.error('Erro ao buscar relatório de mensagens:', error);

      throw new HttpException(
        'Erro ao buscar relatório de contatos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('performance')
  @ReportsSwaggerEndpoint.GetPerformanceReport()
  @Roles('USER', 'COMPANY_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN')
  async getPerformanceReport(
    @Query() filters: ReportFiltersDto,
    @Request() req: any,
  ): Promise<PerformanceReport> {
    try {
      const companyId = (req.user?.companyId ||
        req.headers['x-company-id']) as string;
      return await this.reportsService.getPerformanceReport(filters, companyId);
    } catch (error) {
      console.error('Erro ao buscar relatório de performance:', error);
      throw new HttpException(
        'Erro ao buscar relatório de performance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('overview/export/pdf')
  @ReportsSwaggerEndpoint.ExportToPDF()
  @Roles('USER', 'COMPANY_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN')
  async exportOverviewPDF(
    @Query() filters: ReportFiltersDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const companyId = (req.user?.companyId ||
        req.headers['x-company-id']) as string;
      const buffer = await this.reportsService.exportOverviewToPDF(
        filters,
        companyId,
      );

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="visao-geral-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      console.error('Erro ao exportar relatório em PDF:', error);
      throw new HttpException(
        'Erro ao exportar relatório em PDF',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('messages/export/pdf')
  @Roles('USER', 'COMPANY_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN')
  async exportMessagesPDF(
    @Query() filters: ReportFiltersDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const companyId = (req.user?.companyId ||
        req.headers['x-company-id']) as string;
      const buffer = await this.reportsService.exportMessagesToPDF(
        filters,
        companyId,
      );

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="mensagens-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      console.error('Erro ao buscar relatório de mensagens:', error);

      throw new HttpException(
        'Erro ao exportar relatório em PDF',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('contacts/export/pdf')
  @Roles('USER', 'COMPANY_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN')
  async exportContactsPDF(
    @Query() filters: ReportFiltersDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const companyId = (req.user?.companyId ||
        req.headers['x-company-id']) as string;
      const buffer = await this.reportsService.exportContactsToPDF(
        filters,
        companyId,
      );

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contatos-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      console.error('Erro ao buscar relatório de mensagens:', error);

      throw new HttpException(
        'Erro ao exportar relatório em PDF',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('performance/export/pdf')
  @Roles('USER', 'COMPANY_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN')
  async exportPerformancePDF(
    @Query() filters: ReportFiltersDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const companyId = (req.user?.companyId ||
        req.headers['x-company-id']) as string;
      const buffer = await this.reportsService.exportPerformanceToPDF(
        filters,
        companyId,
      );

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="performance-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      console.error('Erro ao buscar relatório de mensagens:', error);

      throw new HttpException(
        'Erro ao exportar relatório em PDF',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('overview/export/excel')
  @Roles('USER', 'COMPANY_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN')
  async exportOverviewExcel(
    @Query() filters: ReportFiltersDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const companyId = (req.user?.companyId ||
        req.headers['x-company-id']) as string;
      const buffer = await this.reportsService.exportOverviewToExcel(
        filters,
        companyId,
      );

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="visao-geral-${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      console.error('Erro ao buscar relatório de mensagens:', error);

      throw new HttpException(
        'Erro ao exportar relatório em Excel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('messages/export/excel')
  @Roles('USER', 'COMPANY_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN')
  async exportMessagesExcel(
    @Query() filters: ReportFiltersDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const companyId = (req.user?.companyId ||
        req.headers['x-company-id']) as string;
      const buffer = await this.reportsService.exportMessagesToExcel(
        filters,
        companyId,
      );

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="mensagens-${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      console.error('Erro ao buscar relatório de mensagens:', error);

      throw new HttpException(
        'Erro ao exportar relatório em Excel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('contacts/export/excel')
  @Roles('USER', 'COMPANY_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN')
  async exportContactsExcel(
    @Query() filters: ReportFiltersDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const companyId = (req.user?.companyId ||
        req.headers['x-company-id']) as string;
      const buffer = await this.reportsService.exportContactsToExcel(
        filters,
        companyId,
      );

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="contatos-${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      console.error('Erro ao buscar relatório de mensagens:', error);

      throw new HttpException(
        'Erro ao exportar relatório em Excel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('performance/export/excel')
  @Roles('USER', 'COMPANY_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN')
  async exportPerformanceExcel(
    @Query() filters: ReportFiltersDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const companyId = (req.user?.companyId ||
        req.headers['x-company-id']) as string;
      const buffer = await this.reportsService.exportPerformanceToExcel(
        filters,
        companyId,
      );

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="performance-${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      console.error('Erro ao buscar relatório de mensagens:', error);
      throw new HttpException(
        'Erro ao exportar relatório em Excel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
