BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[contact_flow_states] (
    [id] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [whatsappSessionId] NVARCHAR(1000) NOT NULL,
    [contactId] NVARCHAR(1000) NOT NULL,
    [chatFlowId] NVARCHAR(1000) NOT NULL,
    [currentNodeId] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [contact_flow_states_isActive_df] DEFAULT 1,
    [variables] NTEXT,
    [awaitingInput] BIT NOT NULL CONSTRAINT [contact_flow_states_awaitingInput_df] DEFAULT 0,
    [inputType] NVARCHAR(1000),
    [timeoutAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [contact_flow_states_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [contact_flow_states_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [contact_flow_states_companyId_whatsappSessionId_contactId_isActive_key] UNIQUE NONCLUSTERED ([companyId],[whatsappSessionId],[contactId],[isActive])
);

-- CreateTable
CREATE TABLE [dbo].[contact_flow_history] (
    [id] NVARCHAR(1000) NOT NULL,
    [contactFlowStateId] NVARCHAR(1000) NOT NULL,
    [nodeId] NVARCHAR(1000) NOT NULL,
    [nodeType] NVARCHAR(1000) NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [input] NTEXT,
    [output] NTEXT,
    [conditionResult] NVARCHAR(1000),
    [variables] NTEXT,
    [executionTime] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [contact_flow_history_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [contact_flow_history_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[business_hours] (
    [id] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [dayOfWeek] INT NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [business_hours_isActive_df] DEFAULT 1,
    [startTime] NVARCHAR(1000) NOT NULL,
    [endTime] NVARCHAR(1000) NOT NULL,
    [breakStart] NVARCHAR(1000),
    [breakEnd] NVARCHAR(1000),
    [timezone] NVARCHAR(1000) NOT NULL CONSTRAINT [business_hours_timezone_df] DEFAULT 'America/Sao_Paulo',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [business_hours_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [business_hours_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [business_hours_companyId_dayOfWeek_key] UNIQUE NONCLUSTERED ([companyId],[dayOfWeek])
);

-- CreateTable
CREATE TABLE [dbo].[holidays] (
    [id] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [type] NVARCHAR(1000) NOT NULL CONSTRAINT [holidays_type_df] DEFAULT 'HOLIDAY',
    [startTime] NVARCHAR(1000),
    [endTime] NVARCHAR(1000),
    [isRecurring] BIT NOT NULL CONSTRAINT [holidays_isRecurring_df] DEFAULT 0,
    [description] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [holidays_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [holidays_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[contact_flow_states] ADD CONSTRAINT [contact_flow_states_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[contact_flow_states] ADD CONSTRAINT [contact_flow_states_whatsappSessionId_fkey] FOREIGN KEY ([whatsappSessionId]) REFERENCES [dbo].[whatsapp_sessions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[contact_flow_states] ADD CONSTRAINT [contact_flow_states_contactId_fkey] FOREIGN KEY ([contactId]) REFERENCES [dbo].[contacts]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[contact_flow_states] ADD CONSTRAINT [contact_flow_states_chatFlowId_fkey] FOREIGN KEY ([chatFlowId]) REFERENCES [dbo].[chat_flows]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[contact_flow_history] ADD CONSTRAINT [contact_flow_history_contactFlowStateId_fkey] FOREIGN KEY ([contactFlowStateId]) REFERENCES [dbo].[contact_flow_states]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[business_hours] ADD CONSTRAINT [business_hours_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[holidays] ADD CONSTRAINT [holidays_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
