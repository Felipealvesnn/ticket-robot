BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ticket_agents] (
    [id] NVARCHAR(1000) NOT NULL,
    [ticketId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [ticket_agents_role_df] DEFAULT 'AGENT',
    [joinedAt] DATETIME2 NOT NULL CONSTRAINT [ticket_agents_joinedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [leftAt] DATETIME2,
    [isActive] BIT NOT NULL CONSTRAINT [ticket_agents_isActive_df] DEFAULT 1,
    CONSTRAINT [ticket_agents_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ticket_agents_ticketId_userId_key] UNIQUE NONCLUSTERED ([ticketId],[userId])
);

-- AddForeignKey
ALTER TABLE [dbo].[ticket_agents] ADD CONSTRAINT [ticket_agents_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[tickets]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ticket_agents] ADD CONSTRAINT [ticket_agents_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
