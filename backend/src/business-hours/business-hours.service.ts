/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBusinessHoursDto,
  CreateHolidayDto,
  UpdateBusinessHoursDto,
  UpdateHolidayDto,
} from './dto/business-hours.dto';

@Injectable()
export class BusinessHoursService {
  constructor(private readonly prisma: PrismaService) {}

  // ================================
  // HORÁRIOS DE FUNCIONAMENTO
  // ================================

  async createBusinessHours(
    companyId: string,
    createDto: CreateBusinessHoursDto,
  ) {
    // Verificar se já existe horário para este dia da semana
    const existing = await this.prisma.businessHours.findUnique({
      where: {
        companyId_dayOfWeek: {
          companyId,
          dayOfWeek: createDto.dayOfWeek,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Horário para ${this.getDayName(createDto.dayOfWeek)} já existe. Use o método de atualização.`,
      );
    }

    return await this.prisma.businessHours.create({
      data: {
        companyId,
        ...createDto,
      },
    });
  }

  async getBusinessHours(companyId: string) {
    const businessHours = await this.prisma.businessHours.findMany({
      where: { companyId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Se não existir nenhum horário, criar padrão de segunda a sexta 8h-17h
    if (businessHours.length === 0) {
      await this.createDefaultBusinessHours(companyId);
      return await this.prisma.businessHours.findMany({
        where: { companyId },
        orderBy: { dayOfWeek: 'asc' },
      });
    }

    return businessHours;
  }

  async updateBusinessHours(
    companyId: string,
    dayOfWeek: number,
    updateDto: UpdateBusinessHoursDto,
  ) {
    const businessHour = await this.prisma.businessHours.findUnique({
      where: {
        companyId_dayOfWeek: {
          companyId,
          dayOfWeek,
        },
      },
    });

    if (!businessHour) {
      throw new NotFoundException(
        `Horário para ${this.getDayName(dayOfWeek)} não encontrado`,
      );
    }

    return await this.prisma.businessHours.update({
      where: {
        companyId_dayOfWeek: {
          companyId,
          dayOfWeek,
        },
      },
      data: updateDto,
    });
  }

  async deleteBusinessHours(companyId: string, dayOfWeek: number) {
    const businessHour = await this.prisma.businessHours.findUnique({
      where: {
        companyId_dayOfWeek: {
          companyId,
          dayOfWeek,
        },
      },
    });

    if (!businessHour) {
      throw new NotFoundException(
        `Horário para ${this.getDayName(dayOfWeek)} não encontrado`,
      );
    }

    await this.prisma.businessHours.delete({
      where: {
        companyId_dayOfWeek: {
          companyId,
          dayOfWeek,
        },
      },
    });

    return {
      message: `Horário para ${this.getDayName(dayOfWeek)} removido com sucesso`,
    };
  }

  // ================================
  // FERIADOS E DIAS ESPECIAIS
  // ================================

  async createHoliday(companyId: string, createDto: CreateHolidayDto) {
    return await this.prisma.holiday.create({
      data: {
        companyId,
        ...createDto,
        date: new Date(createDto.date),
      },
    });
  }

  async getHolidays(companyId: string, year?: number) {
    const where: any = { companyId };

    if (year) {
      where.date = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      };
    }

    return await this.prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  async updateHoliday(
    companyId: string,
    id: string,
    updateDto: UpdateHolidayDto,
  ) {
    const holiday = await this.prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      throw new NotFoundException('Feriado não encontrado');
    }

    if (holiday.companyId !== companyId) {
      throw new ForbiddenException('Acesso negado a este feriado');
    }

    const updateData: any = { ...updateDto };
    if (updateDto.date) {
      updateData.date = new Date(updateDto.date);
    }

    return await this.prisma.holiday.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteHoliday(companyId: string, id: string) {
    const holiday = await this.prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      throw new NotFoundException('Feriado não encontrado');
    }

    if (holiday.companyId !== companyId) {
      throw new ForbiddenException('Acesso negado a este feriado');
    }

    await this.prisma.holiday.delete({
      where: { id },
    });

    return { message: 'Feriado removido com sucesso' };
  }

  // ================================
  // UTILITÁRIOS
  // ================================

  async isBusinessOpen(companyId: string, dateTime?: Date): Promise<boolean> {
    const now = dateTime || new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm

    // Verificar se é feriado
    const holiday = await this.prisma.holiday.findFirst({
      where: {
        companyId,
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      },
    });

    if (holiday) {
      if (holiday.type === 'HOLIDAY' || holiday.type === 'CLOSED') {
        return false;
      }
      if (holiday.type === 'SPECIAL_HOURS') {
        return !!(
          holiday.startTime &&
          holiday.endTime &&
          currentTime >= holiday.startTime &&
          currentTime <= holiday.endTime
        );
      }
    }

    // Verificar horário normal
    const businessHour = await this.prisma.businessHours.findUnique({
      where: {
        companyId_dayOfWeek: {
          companyId,
          dayOfWeek,
        },
      },
    });

    if (!businessHour || !businessHour.isActive) {
      return false;
    }

    // Verificar se está dentro do horário de funcionamento
    const isWithinBusinessHours =
      currentTime >= businessHour.startTime &&
      currentTime <= businessHour.endTime;

    // Verificar se não está no horário de intervalo
    const isInBreakTime =
      businessHour.breakStart &&
      businessHour.breakEnd &&
      currentTime >= businessHour.breakStart &&
      currentTime <= businessHour.breakEnd;

    return isWithinBusinessHours && !isInBreakTime;
  }

  async getNextBusinessTime(companyId: string): Promise<Date | null> {
    const now = new Date();

    // Procurar pelos próximos 7 dias
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + i);
      const dayOfWeek = checkDate.getDay();

      // Verificar se não é feriado
      const holiday = await this.prisma.holiday.findFirst({
        where: {
          companyId,
          date: {
            gte: new Date(
              checkDate.getFullYear(),
              checkDate.getMonth(),
              checkDate.getDate(),
            ),
            lt: new Date(
              checkDate.getFullYear(),
              checkDate.getMonth(),
              checkDate.getDate() + 1,
            ),
          },
        },
      });

      if (
        holiday &&
        (holiday.type === 'HOLIDAY' || holiday.type === 'CLOSED')
      ) {
        continue;
      }

      const businessHour = await this.prisma.businessHours.findUnique({
        where: {
          companyId_dayOfWeek: {
            companyId,
            dayOfWeek,
          },
        },
      });

      if (businessHour && businessHour.isActive) {
        const nextBusinessTime = new Date(checkDate);
        const [hour, minute] = businessHour.startTime.split(':');
        nextBusinessTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

        // Se for hoje e ainda não passou do horário de abertura
        if (i === 0 && nextBusinessTime > now) {
          return nextBusinessTime;
        }
        // Se for outro dia
        if (i > 0) {
          return nextBusinessTime;
        }
      }
    }

    return null; // Não encontrou horário de funcionamento nos próximos 7 dias
  }

  // ================================
  // MÉTODOS PRIVADOS
  // ================================

  private async createDefaultBusinessHours(companyId: string) {
    const defaultHours = [
      { dayOfWeek: 1, isActive: true, startTime: '08:00', endTime: '17:00' }, // Segunda
      { dayOfWeek: 2, isActive: true, startTime: '08:00', endTime: '17:00' }, // Terça
      { dayOfWeek: 3, isActive: true, startTime: '08:00', endTime: '17:00' }, // Quarta
      { dayOfWeek: 4, isActive: true, startTime: '08:00', endTime: '17:00' }, // Quinta
      { dayOfWeek: 5, isActive: true, startTime: '08:00', endTime: '17:00' }, // Sexta
      { dayOfWeek: 6, isActive: false, startTime: '08:00', endTime: '12:00' }, // Sábado
      { dayOfWeek: 0, isActive: false, startTime: '08:00', endTime: '12:00' }, // Domingo
    ];

    await this.prisma.businessHours.createMany({
      data: defaultHours.map((hour) => ({
        companyId,
        ...hour,
      })),
    });
  }

  private getDayName(dayOfWeek: number): string {
    const days = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];
    return days[dayOfWeek];
  }
}
