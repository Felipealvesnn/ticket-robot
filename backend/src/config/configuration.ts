import { AllConfigType } from './config.interface';

export default (): AllConfigType => ({
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '1433', 10),
    username: process.env.DATABASE_USERNAME || 'sa',
    password: process.env.DATABASE_PASSWORD || 'TicketRobot@2025',
    database: process.env.DATABASE_NAME || 'TicketRobotDB',
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'debug',
  },
  whatsapp: {
    sessionsPath: process.env.WHATSAPP_SESSIONS_PATH || './whatsapp-sessions',
  },
});
