import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import { MediaService } from './media.service';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * 📤 Upload de arquivo
   */
  @Post('upload')
  @ApiOperation({ summary: 'Upload de arquivo de mídia' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        // Tipos de arquivo permitidos
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/webm',
          'audio/mpeg',
          'audio/wav',
          'audio/ogg',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException('Tipo de arquivo não permitido'),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserData,
    @Query('metadata') metadata?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    const parsedMetadata = metadata ? JSON.parse(metadata) : {};

    const result = await this.mediaService.uploadFile(
      file,
      user.companyId,
      user.userId,
      parsedMetadata,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: {
        mediaId: result.mediaId,
        url: result.url,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
    };
  }

  /**
   * 📥 Download de arquivo
   */
  @Get(':mediaId/download')
  @ApiOperation({ summary: 'Download de arquivo por ID' })
  async downloadFile(
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: CurrentUserData,
    @Res() res: Response,
  ) {
    const result = await this.mediaService.downloadFile(
      mediaId,
      user.companyId,
    );

    if (!result.success) {
      throw new NotFoundException(result.error);
    }

    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `attachment; filename="${result.originalName}"`,
      'Content-Length': result.buffer!.length.toString(),
    });

    res.send(result.buffer);
  }

  /**
   * 🖼️ Servir arquivo como imagem (para visualização)
   */
  @Get(':mediaId/view')
  @ApiOperation({ summary: 'Visualizar arquivo (imagem/video)' })
  async viewFile(
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: CurrentUserData,
    @Res() res: Response,
  ) {
    const result = await this.mediaService.downloadFile(
      mediaId,
      user.companyId,
    );

    if (!result.success) {
      throw new NotFoundException(result.error);
    }

    res.set({
      'Content-Type': result.mimeType,
      'Cache-Control': 'public, max-age=31536000', // Cache por 1 ano
    });

    res.send(result.buffer);
  }

  /**
   * 🔗 Obter URL pública do arquivo
   */
  @Get(':mediaId/url')
  @ApiOperation({ summary: 'Obter URL pública do arquivo' })
  async getFileUrl(
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const url = await this.mediaService.getPublicUrl(mediaId, user.companyId);

    if (!url) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    return {
      success: true,
      data: {
        mediaId,
        url,
      },
    };
  }

  /**
   * 📋 Listar arquivos
   */
  @Get()
  @ApiOperation({ summary: 'Listar arquivos da empresa' })
  async listFiles(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('type') type?: string,
  ) {
    const options = {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      mimeTypeFilter: type ? type.split(',') : undefined,
    };

    const result = await this.mediaService.listFiles(user.companyId, options);

    return {
      success: true,
      data: {
        files: result.files,
        total: result.total,
        limit: options.limit,
        offset: options.offset,
      },
    };
  }

  /**
   * 📊 Estatísticas de storage
   */
  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de uso de storage' })
  async getStorageStats(@CurrentUser() user: CurrentUserData) {
    const stats = await this.mediaService.getStorageStats(user.companyId);

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * 🗑️ Deletar arquivo
   */
  @Delete(':mediaId')
  @ApiOperation({ summary: 'Deletar arquivo' })
  async deleteFile(
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const result = await this.mediaService.deleteFile(mediaId, user.companyId);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      message: 'Arquivo deletado com sucesso',
    };
  }
}
