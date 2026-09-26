/*
  Warnings:

  - You are about to drop the column `data` on the `StockHistory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stockticker]` on the table `StockHistory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pricetarget` to the `StockHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `StockHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stockticker` to the `StockHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StockHistory" DROP COLUMN "data",
ADD COLUMN     "pricetarget" INTEGER NOT NULL,
ADD COLUMN     "reason" TEXT NOT NULL,
ADD COLUMN     "stockticker" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "StockHistory_stockticker_key" ON "StockHistory"("stockticker");
