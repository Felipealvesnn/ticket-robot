export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  logLevel: string;
}

export interface WhatsAppConfig {
  sessionsPath: string;
}

export interface AllConfigType {
  database: DatabaseConfig;
  app: AppConfig;
  whatsapp: WhatsAppConfig;
}
