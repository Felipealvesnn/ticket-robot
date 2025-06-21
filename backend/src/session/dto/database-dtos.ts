export interface DatabaseSession {
  id: string;
  companyId: string;
  name: string;
  phoneNumber: string | null;
  qrCode: string | null;
  status: string;
  isActive: boolean;
  lastSeen: Date | null;
  config: string | null;
  createdAt: Date;
  updatedAt: Date;
}
