import { BlobServiceClient } from '@azure/storage-blob';
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

export interface MediaUploadResult {
  success: boolean;
  mediaId?: string;
  url?: string;
  error?: string;
}

export interface MediaFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  containerName: string;
  blobName: string;
  companyId: string;
  uploadedBy: string;
  createdAt: Date;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private blobServiceClient: BlobServiceClient;
  private readonly containerName = 'flow-media';

  constructor(private readonly prisma: PrismaService) {
    this.initializeBlobClient();
  }

  /**
   * 🔧 Inicializar cliente do Azure Blob Storage (Azurite)
   */
  private initializeBlobClient(): void {
    try {
      // Configuração para Azurite (desenvolvimento)
      const azuriteConnectionString =
        process.env.AZURE_STORAGE_CONNECTION_STRING ||
        'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://localhost:10000/devstoreaccount1;';

      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        azuriteConnectionString,
      );

      this.logger.log('✅ Azure Blob Service Client inicializado');

      // Criar container se não existir
      this.createContainerIfNotExists();
    } catch (error) {
      this.logger.error('❌ Erro ao inicializar Azure Blob Client:', error);
    }
  }

  /**
   * 📁 Criar container se não existir
   */
  private async createContainerIfNotExists(): Promise<void> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName,
      );

      const exists = await containerClient.exists();
      if (!exists) {
        await containerClient.createIfNotExists({
          access: 'blob', // Acesso público para leitura
        });
        this.logger.log(`📁 Container '${this.containerName}' criado`);
      }
    } catch (error) {
      this.logger.error('❌ Erro ao criar container:', error);
    }
  }

  /**
   * 📤 Upload de arquivo para Azure Blob Storage
   */
  async uploadFile(
    file: Express.Multer.File,
    companyId: string,
    uploadedBy: string,
    metadata?: Record<string, string>,
  ): Promise<MediaUploadResult> {
    try {
      // Gerar ID único e nome do blob
      const mediaId = crypto.randomUUID();
      const fileExtension = path.extname(file.originalname);
      const blobName = `${companyId}/${mediaId}${fileExtension}`;

      // Obter cliente do container
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName,
      );
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Configurar metadados
      const blobMetadata = {
        originalName: file.originalname,
        companyId,
        uploadedBy,
        mediaId,
        ...metadata,
      };

      // Upload do arquivo
      const uploadResult = await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype,
          blobCacheControl: 'public, max-age=31536000', // Cache por 1 ano
        },
        metadata: blobMetadata,
      });

      if (uploadResult.errorCode) {
        throw new Error(`Erro no upload: ${uploadResult.errorCode}`);
      }

      // URL do arquivo
      const fileUrl = blockBlobClient.url;

      // Salvar no banco de dados
      const mediaRecord = await this.prisma.media.create({
        data: {
          id: mediaId,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: fileUrl,
          containerName: this.containerName,
          blobName,
          companyId,
          uploadedBy,
        },
      });

      this.logger.log(
        `✅ Arquivo ${file.originalname} enviado com sucesso - ID: ${mediaId}`,
      );

      return {
        success: true,
        mediaId,
        url: fileUrl,
      };
    } catch (error) {
      this.logger.error('❌ Erro no upload de arquivo:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 📥 Download de arquivo por ID
   */
  async downloadFile(
    mediaId: string,
    companyId: string,
  ): Promise<{
    success: boolean;
    buffer?: Buffer;
    mimeType?: string;
    originalName?: string;
    error?: string;
  }> {
    try {
      // Buscar metadados no banco
      const mediaRecord = await this.prisma.media.findFirst({
        where: {
          id: mediaId,
          companyId,
        },
      });

      if (!mediaRecord) {
        return {
          success: false,
          error: 'Arquivo não encontrado',
        };
      }

      // Download do blob
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName,
      );
      const blockBlobClient = containerClient.getBlockBlobClient(
        mediaRecord.blobName,
      );

      const downloadResponse = await blockBlobClient.download();

      if (!downloadResponse.readableStreamBody) {
        throw new Error('Erro ao baixar arquivo do storage');
      }

      // Converter stream para buffer
      const chunks: Buffer[] = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      return {
        success: true,
        buffer,
        mimeType: mediaRecord.mimeType,
        originalName: mediaRecord.originalName,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao baixar arquivo ${mediaId}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 🗑️ Deletar arquivo
   */
  async deleteFile(
    mediaId: string,
    companyId: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Buscar registro no banco
      const mediaRecord = await this.prisma.media.findFirst({
        where: {
          id: mediaId,
          companyId,
        },
      });

      if (!mediaRecord) {
        return {
          success: false,
          error: 'Arquivo não encontrado',
        };
      }

      // Deletar do blob storage
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName,
      );
      const blockBlobClient = containerClient.getBlockBlobClient(
        mediaRecord.blobName,
      );

      await blockBlobClient.delete();

      // Deletar do banco
      await this.prisma.media.delete({
        where: { id: mediaId },
      });

      this.logger.log(`🗑️ Arquivo ${mediaId} deletado com sucesso`);

      return { success: true };
    } catch (error) {
      this.logger.error(`❌ Erro ao deletar arquivo ${mediaId}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 📋 Listar arquivos de uma empresa
   */
  async listFiles(
    companyId: string,
    options?: {
      limit?: number;
      offset?: number;
      mimeTypeFilter?: string[];
    },
  ): Promise<{
    files: MediaFile[];
    total: number;
  }> {
    try {
      const whereClause: any = { companyId };

      if (options?.mimeTypeFilter && options.mimeTypeFilter.length > 0) {
        whereClause.mimeType = {
          in: options.mimeTypeFilter,
        };
      }

      const [files, total] = await Promise.all([
        this.prisma.media.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: options?.limit || 50,
          skip: options?.offset || 0,
        }),
        this.prisma.media.count({
          where: whereClause,
        }),
      ]);

      return { files, total };
    } catch (error) {
      this.logger.error('❌ Erro ao listar arquivos:', error);
      return { files: [], total: 0 };
    }
  }

  /**
   * 📊 Estatísticas de uso de storage
   */
  async getStorageStats(companyId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    sizeByType: Record<string, { count: number; size: number }>;
  }> {
    try {
      const files = await this.prisma.media.findMany({
        where: { companyId },
        select: {
          mimeType: true,
          size: true,
        },
      });

      const totalFiles = files.length;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      const sizeByType: Record<string, { count: number; size: number }> = {};

      files.forEach((file) => {
        const type = file.mimeType.split('/')[0]; // image, video, etc.
        if (!sizeByType[type]) {
          sizeByType[type] = { count: 0, size: 0 };
        }
        sizeByType[type].count++;
        sizeByType[type].size += file.size;
      });

      return {
        totalFiles,
        totalSize,
        sizeByType,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter estatísticas:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        sizeByType: {},
      };
    }
  }

  /**
   * 🔗 Obter URL pública de um arquivo
   */
  async getPublicUrl(
    mediaId: string,
    companyId: string,
  ): Promise<string | null> {
    try {
      const mediaRecord = await this.prisma.media.findFirst({
        where: {
          id: mediaId,
          companyId,
        },
      });

      return mediaRecord?.url || null;
    } catch (error) {
      this.logger.error(`❌ Erro ao obter URL do arquivo ${mediaId}:`, error);
      return null;
    }
  }

  /**
   * 📥 Download de mídia por URL (para envio via WhatsApp)
   */
  async downloadMedia(mediaUrl: string): Promise<Buffer | null> {
    try {
      // Extrair mediaId da URL (assumindo que a URL contém o ID)
      const urlParts = mediaUrl.split('/');
      const mediaId = urlParts[urlParts.length - 1];

      // Para desenvolvimento, buscar por qualquer empresa (TODO: melhorar segurança)
      const mediaRecord = await this.prisma.media.findFirst({
        where: { id: mediaId },
      });

      if (!mediaRecord) {
        this.logger.warn(`Mídia não encontrada para URL: ${mediaUrl}`);
        return null;
      }

      // Usar método existente de download
      const downloadResult = await this.downloadFile(
        mediaId,
        mediaRecord.companyId as string,
      );

      if (downloadResult.success && downloadResult.buffer) {
        return downloadResult.buffer;
      }

      this.logger.warn(
        `Falha ao baixar mídia ${mediaId}: ${downloadResult.error}`,
      );
      return null;
    } catch (error) {
      this.logger.error(`Erro ao baixar mídia da URL ${mediaUrl}:`, error);
      return null;
    }
  }

  /**
   * 🔍 Determinar tipo de mídia baseado no MIME type e extensão
   */
  private determineMediaType(
    mimeType: string,
    fileName: string,
  ): 'image' | 'video' | 'audio' | 'document' {
    const extension = path.extname(fileName).toLowerCase();

    // Verificar por MIME type primeiro
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    if (mimeType.startsWith('video/')) {
      return 'video';
    }
    if (mimeType.startsWith('audio/')) {
      return 'audio';
    }

    // Verificar por extensão se MIME type não for específico
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];

    if (imageExtensions.includes(extension)) {
      return 'image';
    }
    if (videoExtensions.includes(extension)) {
      return 'video';
    }
    if (audioExtensions.includes(extension)) {
      return 'audio';
    }

    // Padrão para documentos
    return 'document';
  }
}
