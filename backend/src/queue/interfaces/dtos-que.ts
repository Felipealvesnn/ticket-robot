import { Session } from '../../session/entities/session.entity';
import {
  ClientInfo,
  WhatsAppMessage,
} from '../../session/interfaces/whatsapp-message.interface';

export interface MessageQueueData {
  sessionId: string;
  companyId: string;
  clientId: string;
  eventType:
    | 'qr-code'
    | 'qr-code-image'
    | 'session-status'
    | 'session-created'
    | 'session-removed'
    | 'new-message'
    | 'session-error'
    | 'transfer-to-agent'
    | 'new-ticket' // 🔥 NOVO: Evento para novos tickets
    | 'ticket-update'; // 🔥 NOVO: Evento para atualizações de tickets
  data: {
    qrCode?: string;
    qrCodeBase64?: string;
    status?: string;
    clientInfo?: ClientInfo;
    message?: WhatsAppMessage;
    error?: string;
    session?: Session;
    ticketId?: string; // 🔥 NOVO: ID do ticket associado
    contactId?: string; // 🔥 NOVO: ID do contato
    ticket?: any; // 🔥 NOVO: Dados completos do ticket
    action?: string; // 🔥 NOVO: Ação realizada (created, updated, etc.)
  };
  timestamp: Date;
  retryCount?: number;
  priority?: number;
}
