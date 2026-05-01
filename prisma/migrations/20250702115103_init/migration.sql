-- DropForeignKey
ALTER TABLE "UploadLogs" DROP CONSTRAINT "UploadLogs_uploadedImgId_fkey";

-- AlterTable
ALTER TABLE "UploadLogs" ALTER COLUMN "uploadedImgId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UploadLogs" ADD CONSTRAINT "UploadLogs_uploadedImgId_fkey" FOREIGN KEY ("uploadedImgId") REFERENCES "UploadedImg"("id") ON DELETE SET NULL ON UPDATE CASCADE;
