export class IgnoredContact {
  id: string;
  companyId: string;
  messagingSessionId?: string;
  phoneNumber: string;
  name?: string;
  reason?: string;
  type: string;
  isActive: boolean;
  ignoreBotOnly: boolean;
  createdBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
