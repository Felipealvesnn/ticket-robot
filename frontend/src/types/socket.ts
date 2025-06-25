// Tipos de eventos do Socket.IO entre frontend e backend

export interface SocketAuthData {
  token: string;
}

// Eventos de sessão
export interface SessionJoinData {
  sessionId: string;
}

export interface SessionLeaveData {
  sessionId: string;
}

export interface SessionStatusEvent {
  sessionId: string;
  status: "connecting" | "connected" | "disconnected" | "error";
  qrCode?: string;
  error?: string;
}

// Eventos de ticket
export interface TicketJoinData {
  ticketId: string;
}

export interface TicketLeaveData {
  ticketId: string;
}

export interface TicketStatusEvent {
  ticketId: string;
  status: "open" | "pending" | "closed";
  updatedAt: string;
}

// Eventos de mensagem
export interface MessageEvent {
  id: string;
  ticketId: string;
  contactId: string;
  content: string;
  messageType: "text" | "image" | "audio" | "video" | "document";
  direction: "inbound" | "outbound";
  platform: string;
  isFromBot: boolean;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface MessageDeliveryEvent {
  messageId: string;
  ticketId: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  error?: string;
}

// Eventos de flow
export interface FlowExecutionEvent {
  ticketId: string;
  flowId: string;
  nodeId: string;
  action: "start" | "execute" | "complete" | "error";
  data?: any;
  error?: string;
}

// Eventos de conexão
export interface ConnectionStatusEvent {
  userId: string;
  status: "online" | "offline";
  timestamp: string;
}

// Eventos do servidor para o cliente
export interface ServerToClientEvents {
  // Sessões
  "session:status": (data: SessionStatusEvent) => void;
  "session:qr-code": (data: { sessionId: string; qrCode: string }) => void;
  "session:connected": (data: { sessionId: string }) => void;
  "session:disconnected": (data: {
    sessionId: string;
    reason?: string;
  }) => void;

  // Tickets
  "ticket:created": (data: {
    ticketId: string;
    contactId: string;
    sessionId: string;
  }) => void;
  "ticket:updated": (data: TicketStatusEvent) => void;
  "ticket:closed": (data: { ticketId: string; reason: string }) => void;

  // Mensagens
  "message:new": (data: MessageEvent) => void;
  "message:delivery": (data: MessageDeliveryEvent) => void;

  // Flow
  "flow:execution": (data: FlowExecutionEvent) => void;

  // Sistema
  "connection:status": (data: ConnectionStatusEvent) => void;
  error: (data: { message: string; code?: string }) => void;
}

// Eventos do cliente para o servidor
export interface ClientToServerEvents {
  // Autenticação
  authenticate: (data: SocketAuthData) => void;

  // Sessões
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  "session:start": (data: { platform: string; name: string }) => void;
  "session:stop": (sessionId: string) => void;

  // Tickets
  joinTicket: (ticketId: string) => void;
  leaveTicket: (ticketId: string) => void;
  "ticket:close": (data: { ticketId: string; reason?: string }) => void;

  // Mensagens
  "message:send": (data: {
    ticketId: string;
    content: string;
    messageType?: string;
    metadata?: Record<string, any>;
  }) => void;
  "message:read": (messageId: string) => void;

  // Flow
  "flow:trigger": (data: {
    ticketId: string;
    flowId: string;
    input?: any;
  }) => void;
}

// Tipos para store/contexto
export interface SocketState {
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;
  activeSessions: string[];
  activeTickets: string[];
}

export interface SocketContextType {
  socket: Socket | null;
  state: SocketState;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  joinTicket: (ticketId: string) => void;
  leaveTicket: (ticketId: string) => void;
  sendMessage: (
    ticketId: string,
    content: string,
    messageType?: string
  ) => void;
}

// Helpers de tipo
export type SocketEventName =
  | keyof ServerToClientEvents
  | keyof ClientToServerEvents;
export type SocketCallback<T extends SocketEventName> =
  T extends keyof ServerToClientEvents
    ? ServerToClientEvents[T]
    : T extends keyof ClientToServerEvents
    ? ClientToServerEvents[T]
    : never;

import { Socket } from "socket.io-client";
