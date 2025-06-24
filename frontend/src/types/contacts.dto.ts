// ============================================================================
// 👥 CONTACTS TYPES
// ============================================================================

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  avatar?: string;
  tags: string[];
  customFields?: Record<string, any>;
  notes?: string;
  lastInteraction: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  name: string;
  phoneNumber: string;
  email?: string;
  avatar?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  notes?: string;
}

export interface UpdateContactRequest {
  name?: string;
  phoneNumber?: string;
  email?: string;
  avatar?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  notes?: string;
  isBlocked?: boolean;
}

export interface ContactResponse {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  avatar?: string;
  tags: string[];
  customFields?: Record<string, any>;
  notes?: string;
  lastInteraction: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactFilters {
  search?: string;
  tags?: string[];
  isBlocked?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface ContactsListResponse {
  contacts: Contact[];
  total: number;
  hasMore: boolean;
}
