BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[sessions] ADD [accuracy] FLOAT(53),
[browser] NVARCHAR(1000),
[browserVersion] NVARCHAR(1000),
[city] NVARCHAR(1000),
[country] NVARCHAR(1000),
[deviceId] NVARCHAR(1000),
[deviceName] NVARCHAR(1000),
[deviceType] NVARCHAR(1000),
[isFirstLogin] BIT NOT NULL CONSTRAINT [sessions_isFirstLogin_df] DEFAULT 1,
[isTrusted] BIT NOT NULL CONSTRAINT [sessions_isTrusted_df] DEFAULT 0,
[latitude] FLOAT(53),
[longitude] FLOAT(53),
[operatingSystem] NVARCHAR(1000),
[region] NVARCHAR(1000),
[timezone] NVARCHAR(1000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
