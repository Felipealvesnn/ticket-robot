/*
  Warnings:

  - You are about to drop the column `assignedAgentId` on the `tickets` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[tickets] DROP CONSTRAINT [tickets_assignedAgentId_fkey];

-- AlterTable
ALTER TABLE [dbo].[tickets] DROP COLUMN [assignedAgentId];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
