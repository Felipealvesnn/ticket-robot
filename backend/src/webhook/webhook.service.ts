/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { FlowVariables } from '../flow/dto/flow-interfaces.dto';

export interface WebhookRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface WebhookResponse {
  success: boolean;
  status?: number;
  data?: any;
  error?: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  /**
   * 🔗 Executar webhook HTTP
   */
  async executeWebhook(
    url: string,
    method: string,
    options: {
      useAuthentication?: boolean;
      authType?: string;
      authToken?: string;
      apiKeyHeader?: string;
      apiKeyValue?: string;
      basicUsername?: string;
      basicPassword?: string;
      includeFlowVariables?: boolean;
      includeMetadata?: boolean;
      customPayload?: string;
      flowVariables?: FlowVariables;
      metadata?: {
        companyId: string;
        contactId: string;
        messagingSessionId: string;
        ticketId?: string;
      };
    } = {},
  ): Promise<WebhookResponse> {
    try {
      // Construir headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'TicketRobot-Webhook/1.0',
      };

      // Adicionar autenticação
      if (options.useAuthentication) {
        switch (options.authType) {
          case 'bearer':
            if (options.authToken) {
              headers['Authorization'] = `Bearer ${options.authToken}`;
            }
            break;
          case 'api-key':
            if (options.apiKeyHeader && options.apiKeyValue) {
              headers[options.apiKeyHeader] = options.apiKeyValue;
            }
            break;
          case 'basic':
            if (options.basicUsername && options.basicPassword) {
              const credentials = Buffer.from(
                `${options.basicUsername}:${options.basicPassword}`,
              ).toString('base64');
              headers['Authorization'] = `Basic ${credentials}`;
            }
            break;
        }
      }

      // Construir payload
      let payload: any = {};

      // Incluir variáveis do fluxo
      if (options.includeFlowVariables && options.flowVariables) {
        payload.variables = options.flowVariables;
      }

      // Incluir metadados
      if (options.includeMetadata && options.metadata) {
        payload.metadata = {
          company_id: options.metadata.companyId,
          contact_id: options.metadata.contactId,
          session_id: options.metadata.messagingSessionId,
          ticket_id: options.metadata.ticketId,
          timestamp: new Date().toISOString(),
        };
      }

      // Processar payload personalizado
      if (options.customPayload) {
        try {
          let customData = JSON.parse(options.customPayload);

          // Substituir variáveis no payload personalizado
          if (options.flowVariables) {
            customData = this.replaceVariablesInPayload(
              customData,
              options.flowVariables,
            );
          }

          // Merge com payload existente
          payload = { ...payload, ...customData };
        } catch (error) {
          this.logger.warn('Erro ao processar payload personalizado:', error);
        }
      }

      // Fazer a requisição HTTP
      const requestOptions: RequestInit = {
        method: method.toUpperCase(),
        headers,
      };

      // Adicionar body para métodos que suportam
      if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        requestOptions.body = JSON.stringify(payload);
      }

      this.logger.log(`Executando webhook: ${method.toUpperCase()} ${url}`);

      const response = await fetch(url, requestOptions);

      let responseData: any;
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }

      const result: WebhookResponse = {
        success: response.ok,
        status: response.status,
        data: responseData,
      };

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        this.logger.warn(`Webhook falhou: ${result.error}`, responseData);
      } else {
        this.logger.log(`Webhook executado com sucesso: ${response.status}`);
      }

      return result;
    } catch (error) {
      this.logger.error('Erro ao executar webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * 🔄 Substituir variáveis no payload
   */
  private replaceVariablesInPayload(
    payload: any,
    variables: FlowVariables,
  ): any {
    if (typeof payload === 'string') {
      // Substituir {{variavel}} por valor
      return payload.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return variables[varName] ? String(variables[varName]) : match;
      });
    }

    if (Array.isArray(payload)) {
      return payload.map((item) =>
        this.replaceVariablesInPayload(item, variables),
      );
    }

    if (typeof payload === 'object' && payload !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(payload)) {
        result[key] = this.replaceVariablesInPayload(value, variables);
      }
      return result;
    }

    return payload;
  }
}
