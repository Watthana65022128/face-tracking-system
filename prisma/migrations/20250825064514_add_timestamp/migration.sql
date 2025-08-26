-- AlterTable
ALTER TABLE "tracking_logs" ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "tracking_logs_timestamp_idx" ON "tracking_logs"("timestamp");
