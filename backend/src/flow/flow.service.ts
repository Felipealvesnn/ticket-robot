import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFlowDto, UpdateFlowDto } from './dto/flow.dto';

@Injectable()
export class FlowService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, createFlowDto: CreateFlowDto) {
    return await this.prisma.chatFlow.create({
      data: {
        companyId,
        name: createFlowDto.name,
        description: createFlowDto.description,
        nodes: createFlowDto.nodes,
        edges: createFlowDto.edges,
        triggers: createFlowDto.triggers,
        isActive: createFlowDto.isActive || false,
      },
    });
  }

  async findAll(companyId: string) {
    return await this.prisma.chatFlow.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const flow = await this.prisma.chatFlow.findUnique({
      where: { id },
    });

    if (!flow) {
      throw new NotFoundException('Fluxo não encontrado');
    }

    if (flow.companyId !== companyId) {
      throw new ForbiddenException('Acesso negado a este fluxo');
    }

    return flow;
  }

  async update(id: string, companyId: string, updateFlowDto: UpdateFlowDto) {
    // Verificar se o fluxo existe e pertence à empresa
    await this.findOne(id, companyId);

    return await this.prisma.chatFlow.update({
      where: { id },
      data: {
        name: updateFlowDto.name,
        description: updateFlowDto.description,
        nodes: updateFlowDto.nodes,
        edges: updateFlowDto.edges,
        triggers: updateFlowDto.triggers,
        isActive: updateFlowDto.isActive,
      },
    });
  }

  async remove(id: string, companyId: string) {
    // Verificar se o fluxo existe e pertence à empresa
    await this.findOne(id, companyId);

    await this.prisma.chatFlow.delete({
      where: { id },
    });

    return { message: 'Fluxo removido com sucesso' };
  }

  async toggleActive(id: string, companyId: string) {
    const flow = await this.findOne(id, companyId);

    return await this.prisma.chatFlow.update({
      where: { id },
      data: { isActive: !flow.isActive },
    });
  }

  async getActiveFlows(companyId: string) {
    return await this.prisma.chatFlow.findMany({
      where: {
        companyId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        triggers: true,
        nodes: true,
        edges: true,
      },
    });
  }
}
