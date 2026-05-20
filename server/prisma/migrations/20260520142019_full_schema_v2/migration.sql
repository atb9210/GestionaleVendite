/*
  Warnings:

  - You are about to drop the column `category` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `channel` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `channel` on the `Order` table. All the data in the column will be lost.
  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `type` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `supplier` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Purchase` table. All the data in the column will be lost.
  - The `status` column on the `Purchase` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `updatedAt` on the `Subscription` table. All the data in the column will be lost.
  - The `status` column on the `Subscription` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `catKey` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `channelId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeKey` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierId` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'REFUNDED', 'ACTIVE');

-- CreateEnum
CREATE TYPE "SubStatus" AS ENUM ('ACTIVE', 'EXPIRING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('INTRANSIT', 'RECEIVED', 'TOPAY');

-- CreateEnum
CREATE TYPE "ConvStatus" AS ENUM ('NEW_LEAD', 'CONTACTED', 'LINK_SENT', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "MsgDirection" AS ENUM ('IN', 'OUT');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "address" TEXT,
ADD COLUMN     "cap" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'Italia',
ADD COLUMN     "phone" JSONB,
ALTER COLUMN "ltv" SET DEFAULT 0,
ALTER COLUMN "ltv" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "firstChannel" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "category",
DROP COLUMN "channel",
DROP COLUMN "updatedAt",
ADD COLUMN     "catKey" TEXT NOT NULL,
ADD COLUMN     "channelId" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "channel",
ADD COLUMN     "channelId" TEXT NOT NULL,
ADD COLUMN     "contrassegno" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingCap" TEXT,
ADD COLUMN     "shippingCivico" TEXT,
ADD COLUMN     "shippingCountry" TEXT,
ADD COLUMN     "shippingTracking" TEXT,
ADD COLUMN     "subscriptionId" TEXT,
ALTER COLUMN "total" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "cogs" SET DATA TYPE DOUBLE PRECISION,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "type",
DROP COLUMN "updatedAt",
ADD COLUMN     "typeKey" TEXT NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "cost" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "supplier",
DROP COLUMN "updatedAt",
ADD COLUMN     "supplierId" TEXT NOT NULL,
ADD COLUMN     "tracking" TEXT,
ALTER COLUMN "total" SET DATA TYPE DOUBLE PRECISION,
DROP COLUMN "status",
ADD COLUMN     "status" "PurchaseStatus" NOT NULL DEFAULT 'INTRANSIT';

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "updatedAt",
ALTER COLUMN "mrr" SET DATA TYPE DOUBLE PRECISION,
DROP COLUMN "status",
ADD COLUMN     "status" "SubStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductType" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "ProductType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "customerId" TEXT,
    "status" "ConvStatus" NOT NULL DEFAULT 'NEW_LEAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" "MsgDirection" NOT NULL,
    "text" TEXT NOT NULL,
    "auto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MsgTemplate" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "MsgTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductType_key_key" ON "ProductType"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_key_key" ON "ExpenseCategory"("key");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_firstChannel_fkey" FOREIGN KEY ("firstChannel") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_typeKey_fkey" FOREIGN KEY ("typeKey") REFERENCES "ProductType"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_catKey_fkey" FOREIGN KEY ("catKey") REFERENCES "ExpenseCategory"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
