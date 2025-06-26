// ============================================================================
// 📱 SESSIONS TYPES
// ============================================================================

export interface Session {
  id: string;
  name: string;
  platform: string;
  phoneNumber?: string;
  username?: string;
  qrCode?: string;
  status: string; // "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "ERROR"
  isActive: boolean;
  lastSeen?: string | null;
  createdAt: string;
  updatedAt: string;
  // Campos adicionais retornados pelo findAllByCompany
  isConnected: boolean;
  hasQrCode: boolean;
  currentStatus: string;
  // Campos para compatibilidade com UI
  lastActivity: string;
  messagesCount?: number;
}

export interface CreateSessionRequest {
  name: string;
}

export interface UpdateSessionRequest {
  name?: string;
  phoneNumber?: string;
}

export interface SessionResponse {
  id: string;
  name: string;
  platform: string;
  phoneNumber?: string;
  username?: string;
  qrCode?: string;
  status: string;
  isActive: boolean;
  lastSeen?: string | null;
  createdAt: string;
  updatedAt: string;
  isConnected: boolean;
  hasQrCode: boolean;
  currentStatus: string;
}

export interface QrCodeResponse {
  qrCode: string;
}

export interface SessionStatusResponse {
  status: "connected" | "disconnected" | "connecting";
  lastActivity: string;
}
