export interface MessageQueueData {
  sessionId: string;
  companyId: string;
  clientId: string;
  eventType:
    | 'qr-code'
    | 'qr-code-image'
    | 'session-status'
    | 'new-message'
    | 'session-error';
  data: {
    qrCode?: string;
    qrCodeBase64?: string;
    status?: string;
    clientInfo?: any;
    message?: any;
    error?: string;
  };
  timestamp: Date;
  retryCount?: number;
  priority?: number;
}
