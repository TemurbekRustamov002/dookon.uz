/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `UserRole` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[store_id,name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_id,phone]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_id,barcode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_id,sale_number]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_id,username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `store_id` to the `Bundle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `Debt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `Promotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StorePlan" AS ENUM ('STANDARD', 'PREMIUM');

-- DropForeignKey
ALTER TABLE "Debt" DROP CONSTRAINT "Debt_sale_id_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_user_id_fkey";

-- DropIndex
DROP INDEX "Customer_phone_key";

-- DropIndex
DROP INDEX "Debt_sale_id_key";

-- DropIndex
DROP INDEX "Product_barcode_key";

-- DropIndex
DROP INDEX "Sale_sale_number_key";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Bundle" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "BundleItem" ALTER COLUMN "quantity" SET DEFAULT 1,
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "store_id" TEXT NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'dona',
ALTER COLUMN "stock_quantity" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "min_stock_alert" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SaleItem" ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
ADD COLUMN     "partner_id" TEXT,
ADD COLUMN     "role" TEXT NOT NULL,
ADD COLUMN     "store_id" TEXT,
ADD COLUMN     "username" TEXT NOT NULL;

-- DropTable
DROP TABLE "UserRole";

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "commission_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner_name" TEXT,
    "phone" TEXT NOT NULL,
    "password" TEXT,
    "plan" "StorePlan" NOT NULL DEFAULT 'STANDARD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "partner_id" TEXT,
    "subscription_ends_at" TIMESTAMP(3),
    "slug" TEXT,
    "telegram_bot_token" TEXT,
    "telegram_bot_username" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_phone_key" ON "Partner"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Store_phone_key" ON "Store"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_store_id_name_key" ON "Category"("store_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_store_id_phone_key" ON "Customer"("store_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Product_store_id_barcode_key" ON "Product"("store_id", "barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_store_id_sale_number_key" ON "Sale"("store_id", "sale_number");

-- CreateIndex
CREATE UNIQUE INDEX "User_store_id_username_key" ON "User"("store_id", "username");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
