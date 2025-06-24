export class Session {
  id: string;
  name: string;
  status:
    | 'connecting'
    | 'connected'
    | 'disconnected'
    | 'error'
    | 'initializing'
    | 'qr_ready'
    | 'authenticated'
    | 'auth_failure';
  qrCode?: string;
  clientInfo?: {
    number: string;
    name: string;
    platform: string;
  };
  createdAt: Date;
  lastActiveAt: Date;
  sessionPath: string;
}
