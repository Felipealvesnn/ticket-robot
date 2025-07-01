// Configuração base da API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

import { ChatFlow } from "../store/flows";

export interface CreateFlowDto {
  name: string;
  description?: string;
  nodes?: string; // JSON string
  edges?: string; // JSON string
  triggers?: string; // JSON string
  isActive?: boolean;
}

export interface UpdateFlowDto extends Partial<CreateFlowDto> {}

export interface FlowResponse {
  id: string;
  name: string;
  description?: string;
  nodes?: string;
  edges?: string;
  triggers?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaUploadResponse {
  success: boolean;
  data: {
    mediaId: string;
    url: string;
    originalName: string;
    size: number;
    mimeType: string;
    mediaType: "image" | "video" | "audio" | "document";
  };
}

// Helper para fazer requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Pegar token do localStorage se existir
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers: any = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

class FlowApiService {
  /**
   * 📤 Upload de mídia para usar nos flows
   */
  async uploadMedia(file: File, metadata?: any): Promise<MediaUploadResponse> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    const formData = new FormData();
    formData.append("file", file);

    if (metadata) {
      formData.append("metadata", JSON.stringify(metadata));
    }

    const headers: any = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/media/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Upload failed: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * 🔗 Obter URL pública da mídia
   */
  async getMediaUrl(mediaId: string): Promise<string> {
    const response = await apiRequest<{ data: { url: string } }>(
      `/media/${mediaId}/url`
    );
    return response.data.url;
  }

  /**
   * 📋 Listar todos os flows
   */
  async getAllFlows(): Promise<FlowResponse[]> {
    return await apiRequest<FlowResponse[]>("/flow");
  }

  /**
   * 🔍 Buscar flow por ID
   */
  async getFlowById(id: string): Promise<FlowResponse> {
    return await apiRequest<FlowResponse>(`/flow/${id}`);
  }

  /**
   * ➕ Criar novo flow
   */
  async createFlow(flow: CreateFlowDto): Promise<FlowResponse> {
    return await apiRequest<FlowResponse>("/flow", {
      method: "POST",
      body: JSON.stringify(flow),
    });
  }

  /**
   * ✏️ Atualizar flow existente
   */
  async updateFlow(id: string, flow: UpdateFlowDto): Promise<FlowResponse> {
    return await apiRequest<FlowResponse>(`/flow/${id}`, {
      method: "PATCH",
      body: JSON.stringify(flow),
    });
  }

  /**
   * 🗑️ Deletar flow
   */
  async deleteFlow(id: string): Promise<{ message: string }> {
    return await apiRequest(`/flow/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * 🔄 Alternar status ativo do flow
   */
  async toggleFlowActive(id: string): Promise<FlowResponse> {
    return await apiRequest<FlowResponse>(`/flow/${id}/toggle-active`, {
      method: "PATCH",
    });
  }

  /**
   * ✅ Buscar flows ativos
   */
  async getActiveFlows(): Promise<FlowResponse[]> {
    return await apiRequest<FlowResponse[]>("/flow/active/list");
  }

  /**
   * 💾 Salvar flow completo (converte ChatFlow para API format)
   */
  async saveFlow(chatFlow: ChatFlow): Promise<FlowResponse> {
    // Processar nodes que podem ter mídia
    const processedNodes = await this.processNodesWithMedia(chatFlow.nodes);

    const flowData = {
      name: chatFlow.name,
      description: chatFlow.description,
      nodes: JSON.stringify(processedNodes),
      edges: JSON.stringify(chatFlow.edges),
      triggers: JSON.stringify(chatFlow.triggers),
      isActive: chatFlow.isActive,
    };

    // Se tem ID, é atualização, senão é criação
    if (chatFlow.id && chatFlow.id !== "0") {
      return await this.updateFlow(chatFlow.id, flowData);
    } else {
      return await this.createFlow(flowData);
    }
  }

  /**
   * 🖼️ Processar nodes que contêm mídia
   */
  private async processNodesWithMedia(nodes: any[]): Promise<any[]> {
    const processedNodes = [];

    for (const node of nodes) {
      const processedNode = { ...node };

      // Verificar se o node tem mídia para upload
      if (
        (node.data?.type === "image" || node.data?.type === "file") &&
        node.data?.file
      ) {
        // Só fazer upload se for um arquivo novo (File object) e não uma URL existente
        if (node.data.file instanceof File) {
          try {
            console.log(
              `🔄 Iniciando upload para node ${node.id}: ${node.data.file.name}`
            );

            // Upload do arquivo
            const uploadResult = await this.uploadMedia(node.data.file, {
              nodeId: node.id,
              flowContext: true,
            });

            // Substituir o arquivo pela URL
            processedNode.data = {
              ...processedNode.data,
              mediaUrl: uploadResult.data.url,
              mediaId: uploadResult.data.mediaId,
              originalName: uploadResult.data.originalName,
              mimeType: uploadResult.data.mimeType,
              mediaType: uploadResult.data.mediaType,
              // Remover o arquivo original e flags temporárias
              file: undefined,
              isFileAttached: false,
              uploadError: false,
              errorMessage: undefined,
            };

            console.log(
              `✅ Upload concluído para node ${node.id}:`,
              uploadResult.data.url
            );
          } catch (error) {
            console.error(`❌ Erro no upload do node ${node.id}:`, error);
            // Manter o node mas marcar erro
            processedNode.data = {
              ...processedNode.data,
              uploadError: true,
              errorMessage:
                error instanceof Error
                  ? error.message
                  : "Falha no upload do arquivo",
              // Manter o arquivo para nova tentativa
              isFileAttached: true,
            };
          }
        } else if (typeof node.data.file === "string") {
          // Se file é uma string (URL), apenas manter como está
          processedNode.data = {
            ...processedNode.data,
            mediaUrl: node.data.file,
            file: undefined,
            isFileAttached: false,
          };
        }
      } else if (node.data?.mediaUrl && !node.data?.file) {
        // Node já tem URL mas não tem arquivo - manter como está
        processedNode.data = {
          ...processedNode.data,
          isFileAttached: false,
          uploadError: false,
          errorMessage: undefined,
        };
      }

      processedNodes.push(processedNode);
    }

    return processedNodes;
  }

  /**
   * 🔄 Converter FlowResponse para ChatFlow
   */
  parseFlowResponse(flowResponse: FlowResponse): ChatFlow {
    return {
      id: flowResponse.id,
      name: flowResponse.name,
      description: flowResponse.description || "",
      nodes: flowResponse.nodes ? JSON.parse(flowResponse.nodes) : [],
      edges: flowResponse.edges ? JSON.parse(flowResponse.edges) : [],
      triggers: flowResponse.triggers ? JSON.parse(flowResponse.triggers) : [],
      isActive: flowResponse.isActive,
      createdAt: flowResponse.createdAt,
      updatedAt: flowResponse.updatedAt,
    };
  }

  /**
   * 📥 Carregar todos os flows da API
   */
  async loadFlowsFromApi(): Promise<ChatFlow[]> {
    try {
      const flowResponses = await this.getAllFlows();
      return flowResponses.map((flow) => this.parseFlowResponse(flow));
    } catch (error) {
      console.error("Erro ao carregar flows da API:", error);
      throw error;
    }
  }
}

export const flowApiService = new FlowApiService();
