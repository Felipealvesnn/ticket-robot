// ============================================================================
// 📱 SESSIONS TYPES
// ============================================================================

export interface Session {
  id: string;
  name: string;
  phoneNumber: string;
  status: "connected" | "disconnected" | "connecting";
  qrCode?: string;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  name: string;
  phoneNumber: string;
}

export interface UpdateSessionRequest {
  name?: string;
  phoneNumber?: string;
}

export interface SessionResponse {
  id: string;
  name: string;
  phoneNumber: string;
  status: "connected" | "disconnected" | "connecting";
  qrCode?: string;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

export interface QrCodeResponse {
  qrCode: string;
}

export interface SessionStatusResponse {
  status: "connected" | "disconnected" | "connecting";
  lastActivity: string;
}
