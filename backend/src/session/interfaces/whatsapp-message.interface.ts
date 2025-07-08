/* eslint-disable prettier/prettier */
export interface WhatsAppMessage {
  id: {
    _serialized: string;
  };
  body: string;
  from: string;
  to: string;
  timestamp: number;
  type: string;
  isGroupMsg?: boolean; // Tornar opcional
  author?: string;
  hasMedia: boolean;
  isMe?: boolean; // 🔥 NOVO: Campo explícito para identificar mensagens próprias
}

export interface ClientInfo {
  number: string;
  name: string;
  platform: string;
}

export interface SessionEventData {
  sessionId: string;
  timestamp: string;
}

export interface QRCodeEventData extends SessionEventData {
  qrCode: string;
}

export interface QRCodeImageEventData extends SessionEventData {
  qrCodeBase64: string;
}

export interface SessionStatusEventData extends SessionEventData {
  status: string;
  clientInfo?: ClientInfo;
}

export interface NewMessageEventData extends SessionEventData {
  message: {
    id: string;
    body: string;
    from: string;
    to: string;
    timestamp: number;
    type: string;
    isGroupMsg: boolean;
    author?: string;
    isMedia: boolean;
  };
}
