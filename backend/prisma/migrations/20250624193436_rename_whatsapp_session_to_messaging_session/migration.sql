/*
  Warnings:

  - You are about to drop the column `whatsappSessionId` on the `contact_flow_states` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappSessionId` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappSessionId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappSessionId` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the `whatsapp_sessions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[companyId,messagingSessionId,contactId,isActive]` on the table `contact_flow_states` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `messagingSessionId` to the `contact_flow_states` table without a default value. This is not possible if the table is not empty.
  - Added the required column `messagingSessionId` to the `contacts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `messagingSessionId` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `messagingSessionId` to the `tickets` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[contact_flow_states] DROP CONSTRAINT [contact_flow_states_whatsappSessionId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[contacts] DROP CONSTRAINT [contacts_whatsappSessionId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[messages] DROP CONSTRAINT [messages_whatsappSessionId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[tickets] DROP CONSTRAINT [tickets_whatsappSessionId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[whatsapp_sessions] DROP CONSTRAINT [whatsapp_sessions_companyId_fkey];

-- DropIndex
ALTER TABLE [dbo].[contact_flow_states] DROP CONSTRAINT [contact_flow_states_companyId_whatsappSessionId_contactId_isActive_key];

-- AlterTable
ALTER TABLE [dbo].[contact_flow_states] DROP COLUMN [whatsappSessionId];
ALTER TABLE [dbo].[contact_flow_states] ADD [messagingSessionId] NVARCHAR(1000) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[contacts] DROP COLUMN [whatsappSessionId];
ALTER TABLE [dbo].[contacts] ADD [messagingSessionId] NVARCHAR(1000) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[messages] DROP COLUMN [whatsappSessionId];
ALTER TABLE [dbo].[messages] ADD [messagingSessionId] NVARCHAR(1000) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[tickets] DROP CONSTRAINT [tickets_source_df];
ALTER TABLE [dbo].[tickets] DROP COLUMN [whatsappSessionId];
ALTER TABLE [dbo].[tickets] ADD CONSTRAINT [tickets_source_df] DEFAULT 'MESSAGING' FOR [source];
ALTER TABLE [dbo].[tickets] ADD [messagingSessionId] NVARCHAR(1000) NOT NULL;

-- DropTable
DROP TABLE [dbo].[whatsapp_sessions];

-- CreateTable
CREATE TABLE [dbo].[messaging_sessions] (
    [id] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [platform] NVARCHAR(1000) NOT NULL CONSTRAINT [messaging_sessions_platform_df] DEFAULT 'WHATSAPP',
    [phoneNumber] NVARCHAR(1000),
    [username] NVARCHAR(1000),
    [platformId] NVARCHAR(1000),
    [qrCode] NVARCHAR(1000),
    [accessToken] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [messaging_sessions_status_df] DEFAULT 'DISCONNECTED',
    [isActive] BIT NOT NULL CONSTRAINT [messaging_sessions_isActive_df] DEFAULT 1,
    [lastSeen] DATETIME2,
    [config] NTEXT,
    [webhookUrl] NVARCHAR(1000),
    [metadata] NTEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [messaging_sessions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [messaging_sessions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [messaging_sessions_companyId_platform_phoneNumber_key] UNIQUE NONCLUSTERED ([companyId],[platform],[phoneNumber]),
    CONSTRAINT [messaging_sessions_companyId_platform_username_key] UNIQUE NONCLUSTERED ([companyId],[platform],[username])
);

-- CreateIndex
ALTER TABLE [dbo].[contact_flow_states] ADD CONSTRAINT [contact_flow_states_companyId_messagingSessionId_contactId_isActive_key] UNIQUE NONCLUSTERED ([companyId], [messagingSessionId], [contactId], [isActive]);

-- AddForeignKey
ALTER TABLE [dbo].[tickets] ADD CONSTRAINT [tickets_messagingSessionId_fkey] FOREIGN KEY ([messagingSessionId]) REFERENCES [dbo].[messaging_sessions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[messaging_sessions] ADD CONSTRAINT [messaging_sessions_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[contact_flow_states] ADD CONSTRAINT [contact_flow_states_messagingSessionId_fkey] FOREIGN KEY ([messagingSessionId]) REFERENCES [dbo].[messaging_sessions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[contacts] ADD CONSTRAINT [contacts_messagingSessionId_fkey] FOREIGN KEY ([messagingSessionId]) REFERENCES [dbo].[messaging_sessions]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[messages] ADD CONSTRAINT [messages_messagingSessionId_fkey] FOREIGN KEY ([messagingSessionId]) REFERENCES [dbo].[messaging_sessions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
