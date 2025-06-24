/**
 * Interfaces de retorno tipadas para evitar usar 'any'
 * Essas interfaces representam os dados que esperamos do Prisma
 * até que o client seja gerado corretamente
 */

export interface BusinessHoursData {
  id: string;
  companyId: string;
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HolidayData {
  id: string;
  companyId: string;
  name: string;
  date: Date;
  type: string;
  startTime?: string;
  endTime?: string;
  isRecurring: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketData {
  id: string;
  companyId: string;
  messagingSessionId: string;
  contactId: string;
  assignedAgentId?: string | null;
  title?: string | null;
  description?: string | null;
  status: string;
  priority: string;
  category?: string | null;
  source: string;
  firstResponseAt?: Date | null;
  resolvedAt?: Date | null;
  closedAt?: Date | null;
  tags?: string | null;
  metadata?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relacionamentos opcionais
  messagingSession?: any;
  contact?: any;
  assignedAgent?: any;
}

export interface ContactData {
  id: string;
  companyId: string;
  messagingSessionId: string;
  phoneNumber: string;
  name?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  isBlocked: boolean;
  tags?: string;
  customFields?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlowData {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  nodes: string;
  edges: string;
  triggers: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyData {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan: string;
  isActive: boolean;
  maxUsers: number;
  maxSessions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isActive: boolean;
  isFirstLogin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageResponse {
  message: string;
}

export interface TicketStatsData {
  total: number;
  open: number;
  inProgress: number;
  waitingCustomer: number;
  resolved: number;
  closed: number;
}
