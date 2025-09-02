-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "DetectionType" AS ENUM ('EYE_MOVEMENT', 'MOUTH_MOVEMENT', 'FACE_ORIENTATION', 'FACE_DETECTION_LOSS', 'DISTANCE_VIOLATION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "studentId" TEXT,
    "phoneNumber" TEXT,
    "faceData" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionName" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "totalDuration" INTEGER,

    CONSTRAINT "tracking_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_logs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "detectionType" "DetectionType" NOT NULL,
    "detectionData" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,

    CONSTRAINT "tracking_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_statistics" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "faceOrientationsByDirection" JSONB NOT NULL,
    "timeOffScreen" INTEGER NOT NULL DEFAULT 0,
    "faceDetectionLoss" INTEGER NOT NULL DEFAULT 0,
    "totalLossTime" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "session_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_studentId_key" ON "users"("studentId");

-- CreateIndex
CREATE INDEX "tracking_logs_sessionId_idx" ON "tracking_logs"("sessionId");

-- CreateIndex
CREATE INDEX "tracking_logs_detectionType_idx" ON "tracking_logs"("detectionType");

-- CreateIndex
CREATE UNIQUE INDEX "session_statistics_sessionId_key" ON "session_statistics"("sessionId");

-- AddForeignKey
ALTER TABLE "tracking_sessions" ADD CONSTRAINT "tracking_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_logs" ADD CONSTRAINT "tracking_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "tracking_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_statistics" ADD CONSTRAINT "session_statistics_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "tracking_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

