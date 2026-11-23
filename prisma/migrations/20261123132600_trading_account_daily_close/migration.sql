-- CreateTable
CREATE TABLE "TradingAccountDailyClose" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountSlot" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "closingBalance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingAccountDailyClose_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TradingAccountDailyClose_userId_accountSlot_date_idx" ON "TradingAccountDailyClose"("userId", "accountSlot", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TradingAccountDailyClose_userId_accountSlot_date_key" ON "TradingAccountDailyClose"("userId", "accountSlot", "date");

-- AddForeignKey
ALTER TABLE "TradingAccountDailyClose" ADD CONSTRAINT "TradingAccountDailyClose_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;