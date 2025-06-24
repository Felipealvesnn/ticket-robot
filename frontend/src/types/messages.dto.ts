// ============================================================================
// 💬 MESSAGES TYPES
// ============================================================================

export interface Message {
  id: string;
  sessionId: string;
  to: string;
  from?: string;
  message: string;
  type: "text" | "image" | "audio" | "video" | "document";
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  sessionId: string;
  to: string;
  message: string;
  type?: "text" | "image" | "audio" | "video" | "document";
}

export interface SendMessageResponse {
  id: string;
  sessionId: string;
  to: string;
  message: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  createdAt: string;
}

export interface MessageFilters {
  sessionId?: string;
  status?: "sent" | "delivered" | "read" | "failed";
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface MessagesListResponse {
  messages: Message[];
  total: number;
  hasMore: boolean;
}
