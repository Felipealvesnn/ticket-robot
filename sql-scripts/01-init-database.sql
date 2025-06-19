-- Criar banco de dados TicketRobotDB
IF NOT EXISTS (
    SELECT name
    FROM sys.databases
    WHERE
        name = 'TicketRobotDB'
) BEGIN
CREATE DATABASE TicketRobotDB;

END

-- Usar o banco de dados criado
USE TicketRobotDB;
GO

-- Criar tabela de sessões WhatsApp
IF NOT EXISTS (
    SELECT *
    FROM sysobjects
    WHERE
        name = 'whatsapp_sessions'
        AND xtype = 'U'
) BEGIN
CREATE TABLE whatsapp_sessions (
    id NVARCHAR (255) PRIMARY KEY,
    name NVARCHAR (255) NOT NULL UNIQUE,
    status NVARCHAR (50) DEFAULT 'disconnected',
    qr_code NTEXT NULL,
    client_info NTEXT NULL,
    created_at DATETIME2 DEFAULT GETDATE (),
    updated_at DATETIME2 DEFAULT GETDATE (),
    last_active_at DATETIME2 NULL
);

END

-- Criar tabela de mensagens (para logs/histórico)
IF NOT EXISTS (
    SELECT *
    FROM sysobjects
    WHERE
        name = 'messages'
        AND xtype = 'U'
) BEGIN
CREATE TABLE messages (
    id BIGINT IDENTITY (1, 1) PRIMARY KEY,
    session_id NVARCHAR (255) NOT NULL,
    message_id NVARCHAR (255),
    from_number NVARCHAR (50),
    to_number NVARCHAR (50),
    message_type NVARCHAR (20) DEFAULT 'text',
    content NTEXT,
    timestamp DATETIME2 DEFAULT GETDATE (),
    status NVARCHAR (20) DEFAULT 'sent',
    FOREIGN KEY (session_id) REFERENCES whatsapp_sessions (id) ON DELETE CASCADE
);

END

-- Criar índices para melhor performance
IF NOT EXISTS (
    SELECT *
    FROM sys.indexes
    WHERE
        name = 'IX_messages_session_id'
) BEGIN
CREATE INDEX IX_messages_session_id ON messages (session_id);

END

IF NOT EXISTS (
    SELECT *
    FROM sys.indexes
    WHERE
        name = 'IX_messages_timestamp'
) BEGIN
CREATE INDEX IX_messages_timestamp ON messages (timestamp);

END

IF NOT EXISTS (
    SELECT *
    FROM sys.indexes
    WHERE
        name = 'IX_sessions_status'
) BEGIN
CREATE INDEX IX_sessions_status ON whatsapp_sessions (status);

END

-- Inserir dados de exemplo (opcional)
-- INSERT INTO whatsapp_sessions (id, name, status)
-- VALUES ('exemplo-1', 'Sessão de Exemplo', 'disconnected');

PRINT 'Database TicketRobotDB initialized successfully!';
GO