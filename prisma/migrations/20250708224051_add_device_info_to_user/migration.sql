/*
  Warnings:

  - A unique constraint covering the columns `[uniqueId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "appVersion" TEXT,
ADD COLUMN     "buildNumber" TEXT,
ADD COLUMN     "bundleId" TEXT,
ADD COLUMN     "deviceBrand" TEXT,
ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "deviceName" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "isEmulator" BOOLEAN,
ADD COLUMN     "isTablet" BOOLEAN,
ADD COLUMN     "systemName" TEXT,
ADD COLUMN     "systemVersion" TEXT,
ADD COLUMN     "uniqueId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_uniqueId_key" ON "User"("uniqueId");
