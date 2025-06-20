BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[companies] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [domain] NVARCHAR(1000),
    [plan] NVARCHAR(1000) NOT NULL CONSTRAINT [companies_plan_df] DEFAULT 'FREE',
    [isActive] BIT NOT NULL CONSTRAINT [companies_isActive_df] DEFAULT 1,
    [maxUsers] INT NOT NULL CONSTRAINT [companies_maxUsers_df] DEFAULT 5,
    [maxSessions] INT NOT NULL CONSTRAINT [companies_maxSessions_df] DEFAULT 3,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [companies_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [companies_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [companies_slug_key] UNIQUE NONCLUSTERED ([slug]),
    CONSTRAINT [companies_domain_key] UNIQUE NONCLUSTERED ([domain])
);

-- CreateTable
CREATE TABLE [dbo].[roles] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [permissions] NTEXT NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [roles_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [roles_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [roles_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [roles_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [avatar] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [users_isActive_df] DEFAULT 1,
    [isFirstLogin] BIT NOT NULL CONSTRAINT [users_isFirstLogin_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[company_users] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [roleId] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [company_users_isActive_df] DEFAULT 1,
    [joinedAt] DATETIME2 NOT NULL CONSTRAINT [company_users_joinedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [company_users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [company_users_userId_companyId_key] UNIQUE NONCLUSTERED ([userId],[companyId])
);

-- CreateTable
CREATE TABLE [dbo].[refresh_tokens] (
    [id] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [refresh_tokens_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [isRevoked] BIT NOT NULL CONSTRAINT [refresh_tokens_isRevoked_df] DEFAULT 0,
    CONSTRAINT [refresh_tokens_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [refresh_tokens_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[sessions] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [userAgent] NVARCHAR(1000),
    [ipAddress] NVARCHAR(1000),
    [expiresAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [sessions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [lastUsed] DATETIME2 NOT NULL CONSTRAINT [sessions_lastUsed_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [sessions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [sessions_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[company_invitations] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [roleId] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [company_invitations_status_df] DEFAULT 'PENDING',
    [invitedBy] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [company_invitations_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [acceptedAt] DATETIME2,
    CONSTRAINT [company_invitations_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [company_invitations_token_key] UNIQUE NONCLUSTERED ([token]),
    CONSTRAINT [company_invitations_email_companyId_key] UNIQUE NONCLUSTERED ([email],[companyId])
);

-- CreateTable
CREATE TABLE [dbo].[tickets] (
    [id] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [whatsappSessionId] NVARCHAR(1000) NOT NULL,
    [contactId] NVARCHAR(1000) NOT NULL,
    [assignedAgentId] NVARCHAR(1000),
    [title] NVARCHAR(1000),
    [description] NTEXT,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [tickets_status_df] DEFAULT 'OPEN',
    [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [tickets_priority_df] DEFAULT 'MEDIUM',
    [category] NVARCHAR(1000),
    [source] NVARCHAR(1000) NOT NULL CONSTRAINT [tickets_source_df] DEFAULT 'WHATSAPP',
    [firstResponseAt] DATETIME2,
    [resolvedAt] DATETIME2,
    [closedAt] DATETIME2,
    [tags] NTEXT,
    [metadata] NTEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [tickets_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [tickets_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ticket_history] (
    [id] NVARCHAR(1000) NOT NULL,
    [ticketId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000),
    [action] NVARCHAR(1000) NOT NULL,
    [fromValue] NVARCHAR(1000),
    [toValue] NVARCHAR(1000),
    [comment] NTEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ticket_history_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ticket_history_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[whatsapp_sessions] (
    [id] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [phoneNumber] NVARCHAR(1000),
    [qrCode] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [whatsapp_sessions_status_df] DEFAULT 'DISCONNECTED',
    [isActive] BIT NOT NULL CONSTRAINT [whatsapp_sessions_isActive_df] DEFAULT 1,
    [lastSeen] DATETIME2,
    [config] NTEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [whatsapp_sessions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [whatsapp_sessions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[chat_flows] (
    [id] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [nodes] NTEXT NOT NULL,
    [edges] NTEXT NOT NULL,
    [triggers] NTEXT NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [chat_flows_isActive_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [chat_flows_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [chat_flows_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[contacts] (
    [id] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [whatsappSessionId] NVARCHAR(1000) NOT NULL,
    [phoneNumber] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [avatar] NVARCHAR(1000),
    [lastMessage] NVARCHAR(1000),
    [lastMessageAt] DATETIME2,
    [isBlocked] BIT NOT NULL CONSTRAINT [contacts_isBlocked_df] DEFAULT 0,
    [tags] NTEXT,
    [customFields] NTEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [contacts_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [contacts_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [contacts_companyId_phoneNumber_key] UNIQUE NONCLUSTERED ([companyId],[phoneNumber])
);

-- CreateTable
CREATE TABLE [dbo].[messages] (
    [id] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [whatsappSessionId] NVARCHAR(1000) NOT NULL,
    [contactId] NVARCHAR(1000) NOT NULL,
    [ticketId] NVARCHAR(1000),
    [content] NTEXT NOT NULL,
    [type] NVARCHAR(1000) NOT NULL CONSTRAINT [messages_type_df] DEFAULT 'TEXT',
    [direction] NVARCHAR(1000) NOT NULL,
    [mediaUrl] NVARCHAR(1000),
    [isRead] BIT NOT NULL CONSTRAINT [messages_isRead_df] DEFAULT 0,
    [isFromBot] BIT NOT NULL CONSTRAINT [messages_isFromBot_df] DEFAULT 0,
    [metadata] NTEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [messages_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [messages_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[subscriptions] (
    [id] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [plan] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [currentPeriodStart] DATETIME2 NOT NULL,
    [currentPeriodEnd] DATETIME2 NOT NULL,
    [cancelAtPeriodEnd] BIT NOT NULL CONSTRAINT [subscriptions_cancelAtPeriodEnd_df] DEFAULT 0,
    [stripeSubscriptionId] NVARCHAR(1000),
    [stripePriceId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [subscriptions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [subscriptions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [subscriptions_stripeSubscriptionId_key] UNIQUE NONCLUSTERED ([stripeSubscriptionId])
);

-- AddForeignKey
ALTER TABLE [dbo].[company_users] ADD CONSTRAINT [company_users_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[company_users] ADD CONSTRAINT [company_users_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[company_users] ADD CONSTRAINT [company_users_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[roles]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[refresh_tokens] ADD CONSTRAINT [refresh_tokens_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[sessions] ADD CONSTRAINT [sessions_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[company_invitations] ADD CONSTRAINT [company_invitations_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[company_invitations] ADD CONSTRAINT [company_invitations_invitedBy_fkey] FOREIGN KEY ([invitedBy]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[tickets] ADD CONSTRAINT [tickets_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[tickets] ADD CONSTRAINT [tickets_whatsappSessionId_fkey] FOREIGN KEY ([whatsappSessionId]) REFERENCES [dbo].[whatsapp_sessions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[tickets] ADD CONSTRAINT [tickets_contactId_fkey] FOREIGN KEY ([contactId]) REFERENCES [dbo].[contacts]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[tickets] ADD CONSTRAINT [tickets_assignedAgentId_fkey] FOREIGN KEY ([assignedAgentId]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ticket_history] ADD CONSTRAINT [ticket_history_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[tickets]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[whatsapp_sessions] ADD CONSTRAINT [whatsapp_sessions_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[chat_flows] ADD CONSTRAINT [chat_flows_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[contacts] ADD CONSTRAINT [contacts_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[contacts] ADD CONSTRAINT [contacts_whatsappSessionId_fkey] FOREIGN KEY ([whatsappSessionId]) REFERENCES [dbo].[whatsapp_sessions]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[messages] ADD CONSTRAINT [messages_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[messages] ADD CONSTRAINT [messages_whatsappSessionId_fkey] FOREIGN KEY ([whatsappSessionId]) REFERENCES [dbo].[whatsapp_sessions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[messages] ADD CONSTRAINT [messages_contactId_fkey] FOREIGN KEY ([contactId]) REFERENCES [dbo].[contacts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[messages] ADD CONSTRAINT [messages_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[tickets]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[subscriptions] ADD CONSTRAINT [subscriptions_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
