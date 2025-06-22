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
    | 'transfer-to-agent';
  data: {
    qrCode?: string;
    qrCodeBase64?: string;
    status?: string;
    clientInfo?: ClientInfo;
    message?: WhatsAppMessage;
    error?: string;
    session?: Session;
  };
  timestamp: Date;
  retryCount?: number;
  priority?: number;
}
