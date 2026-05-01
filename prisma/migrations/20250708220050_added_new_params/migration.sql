-- AlterTable
ALTER TABLE "UploadLogs" ADD COLUMN     "productData" JSONB,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "productName" TEXT;

-- AlterTable
ALTER TABLE "UploadedImg" ADD COLUMN     "productData" JSONB,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "productName" TEXT;
