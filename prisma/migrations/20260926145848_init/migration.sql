-- CreateTable
CREATE TABLE "StockHistory" (
    "id" SERIAL NOT NULL,
    "data" TEXT[],
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockHistory_pkey" PRIMARY KEY ("id")
);
