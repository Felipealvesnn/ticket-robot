BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ignored_contacts] (
    [id] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [messagingSessionId] NVARCHAR(1000),
    [phoneNumber] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [reason] NVARCHAR(1000),
    [type] NVARCHAR(1000) NOT NULL CONSTRAINT [ignored_contacts_type_df] DEFAULT 'MANUAL',
    [isActive] BIT NOT NULL CONSTRAINT [ignored_contacts_isActive_df] DEFAULT 1,
    [ignoreBotOnly] BIT NOT NULL CONSTRAINT [ignored_contacts_ignoreBotOnly_df] DEFAULT 1,
    [createdBy] NVARCHAR(1000),
    [notes] NTEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ignored_contacts_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ignored_contacts_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ignored_contacts_companyId_messagingSessionId_phoneNumber_key] UNIQUE NONCLUSTERED ([companyId],[messagingSessionId],[phoneNumber]),
    CONSTRAINT [ignored_contacts_companyId_phoneNumber_key] UNIQUE NONCLUSTERED ([companyId],[phoneNumber])
);

-- AddForeignKey
ALTER TABLE [dbo].[ignored_contacts] ADD CONSTRAINT [ignored_contacts_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ignored_contacts] ADD CONSTRAINT [ignored_contacts_messagingSessionId_fkey] FOREIGN KEY ([messagingSessionId]) REFERENCES [dbo].[messaging_sessions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
