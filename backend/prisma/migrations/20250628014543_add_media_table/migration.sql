BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[media] (
    [id] NVARCHAR(1000) NOT NULL,
    [originalName] NVARCHAR(1000) NOT NULL,
    [mimeType] NVARCHAR(1000) NOT NULL,
    [size] INT NOT NULL,
    [url] NVARCHAR(1000) NOT NULL,
    [containerName] NVARCHAR(1000) NOT NULL,
    [blobName] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [uploadedBy] NVARCHAR(1000) NOT NULL,
    [isPublic] BIT NOT NULL CONSTRAINT [media_isPublic_df] DEFAULT 0,
    [metadata] NTEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [media_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [media_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [media_companyId_idx] ON [dbo].[media]([companyId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [media_mimeType_idx] ON [dbo].[media]([mimeType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [media_uploadedBy_idx] ON [dbo].[media]([uploadedBy]);

-- AddForeignKey
ALTER TABLE [dbo].[media] ADD CONSTRAINT [media_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
