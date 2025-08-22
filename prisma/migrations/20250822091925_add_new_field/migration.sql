/*
  Warnings:

  - The values [EYE_MOVEMENT,MOUTH_MOVEMENT,DISTANCE_VIOLATION] on the enum `DetectionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DetectionType_new" AS ENUM ('FACE_ORIENTATION', 'FACE_DETECTION_LOSS');
ALTER TABLE "tracking_logs" ALTER COLUMN "detectionType" TYPE "DetectionType_new" USING ("detectionType"::text::"DetectionType_new");
ALTER TYPE "DetectionType" RENAME TO "DetectionType_old";
ALTER TYPE "DetectionType_new" RENAME TO "DetectionType";
DROP TYPE "DetectionType_old";
COMMIT;
