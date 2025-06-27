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

// ============================================================================
// 🚫 IGNORED CONTACTS TYPES
// ============================================================================

export interface IgnoredContact {
  id: string;
  phoneNumber: string;
  reason?: string;
  isGlobal: boolean;
  sessionId?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIgnoredContactRequest {
  phoneNumber: string;
  reason?: string;
  isGlobal?: boolean;
  sessionId?: string;
}

export interface UpdateIgnoredContactRequest {
  phoneNumber?: string;
  reason?: string;
  isGlobal?: boolean;
  sessionId?: string;
}

export interface IgnoredContactFilters {
  search?: string;
  isGlobal?: boolean;
  sessionId?: string;
  limit?: number;
  offset?: number;
}

export interface IgnoredContactsListResponse {
  ignoredContacts: IgnoredContact[];
  total: number;
  hasMore: boolean;
}

export interface IgnoredContactsStats {
  total: number;
  global: number;
  perSession: number;
  recentlyAdded: number;
}
