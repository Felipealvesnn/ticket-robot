// ============================================================================
// 🔧 COMMON TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
  timestamp: string;
}

export interface PaginationRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FileUploadRequest {
  file: File;
  category?: string;
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  category?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SearchRequest {
  query: string;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface SearchResponse<T = any> {
  results: T[];
  total: number;
  query: string;
  executionTime: number;
}
