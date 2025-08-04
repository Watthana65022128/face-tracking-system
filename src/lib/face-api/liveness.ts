import * as faceapi from "face-api.js";

/**
 * ฟังก์ชันพื้นฐานสำหรับตรวจสอบการเคลื่อนไหวของใบหน้า
 * สำหรับการพัฒนาในอนาคต
 */

/**
 * ตรวจสอบการเคลื่อนไหวของใบหน้าเพื่อป้องกันการใช้รูปภาพนิ่ง
 * @param previousLandmarks - จุดสำคัญบนใบหน้าจากเฟรมก่อนหน้า
 * @param currentLandmarks - จุดสำคัญบนใบหน้าจากเฟรมปัจจุบัน
 * @returns true หากมีการเคลื่อนไหวเพียงพอ
 */
export function detectMovement(
  previousLandmarks: faceapi.FaceLandmarks68 | null,
  currentLandmarks: faceapi.FaceLandmarks68
): boolean {
  if (!previousLandmarks) {
    return false; // ไม่มีข้อมูลเปรียบเทียบ
  }

  const prevPositions = previousLandmarks.positions;
  const currPositions = currentLandmarks.positions;

  // คำนวณความเคลื่อนไหวเฉลี่ยของจุดสำคัญ
  let totalMovement = 0;
  const numPoints = Math.min(prevPositions.length, currPositions.length);

  for (let i = 0; i < numPoints; i++) {
    const dx = currPositions[i].x - prevPositions[i].x;
    const dy = currPositions[i].y - prevPositions[i].y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    totalMovement += distance;
  }

  const averageMovement = totalMovement / numPoints;
  const movementThreshold = 0.5; // ค่าขั้นต่ำสำหรับการเคลื่อนไหว

  console.log('การตรวจสอบการเคลื่อนไหว:', {
    averageMovement: averageMovement.toFixed(3),
    threshold: movementThreshold,
    hasMovement: averageMovement > movementThreshold
  });

  return averageMovement > movementThreshold;
}

/**
 * ตรวจสอบการเปลี่ยนแปลงของขนาดใบหน้า (การเคลื่อนที่เข้าออกจากกล้อง)
 * @param previousBoundingBox - กรอบใบหน้าจากเฟรมก่อนหน้า
 * @param currentBoundingBox - กรอบใบหน้าจากเฟรมปัจจุบัน
 * @returns true หากมีการเปลี่ยนแปลงขนาดเพียงพอ
 */
export function detectDepthMovement(
  previousBoundingBox: faceapi.Box | null,
  currentBoundingBox: faceapi.Box
): boolean {
  if (!previousBoundingBox) {
    return false;
  }

  const prevArea = previousBoundingBox.width * previousBoundingBox.height;
  const currArea = currentBoundingBox.width * currentBoundingBox.height;
  
  const sizeChange = Math.abs(currArea - prevArea) / prevArea;
  const sizeThreshold = 0.05; // 5% การเปลี่ยนแปลงขนาด

  console.log('การตรวจสอบการเคลื่อนไหวเชิงลึก:', {
    previousArea: prevArea.toFixed(2),
    currentArea: currArea.toFixed(2),
    sizeChange: (sizeChange * 100).toFixed(2) + '%',
    threshold: (sizeThreshold * 100) + '%',
    hasDepthMovement: sizeChange > sizeThreshold
  });

  return sizeChange > sizeThreshold;
}

/**
 * ตรวจสอบความแปรปรวนของ confidence score
 * @param confidenceHistory - ประวัติ confidence scores
 * @param currentConfidence - confidence score ปัจจุบัน
 * @returns true หากมีความแปรปรวนเพียงพอ
 */
export function detectConfidenceVariation(
  confidenceHistory: number[],
  currentConfidence: number
): boolean {
  if (confidenceHistory.length < 3) {
    return false;
  }

  const recentHistory = [...confidenceHistory, currentConfidence];
  const mean = recentHistory.reduce((sum, val) => sum + val, 0) / recentHistory.length;
  const variance = recentHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentHistory.length;
  const standardDeviation = Math.sqrt(variance);

  const variationThreshold = 0.02; // 2% ความแปรปรวน

  console.log('การตรวจสอบความแปรปรวนของ confidence:', {
    mean: mean.toFixed(3),
    standardDeviation: standardDeviation.toFixed(3),
    threshold: variationThreshold,
    hasVariation: standardDeviation > variationThreshold
  });

  return standardDeviation > variationThreshold;
}

/**
 * เก็บประวัติการตรวจจับเพื่อการวิเคราะห์ liveness
 */
export interface LivenessHistory {
  landmarks: faceapi.FaceLandmarks68[];
  boundingBoxes: faceapi.Box[];
  confidenceScores: number[];
  timestamps: number[];
}

/**
 * สร้างประวัติการตรวจจับใหม่
 * @returns ประวัติการตรวจจับเปล่า
 */
export function createLivenessHistory(): LivenessHistory {
  return {
    landmarks: [],
    boundingBoxes: [],
    confidenceScores: [],
    timestamps: []
  };
}

/**
 * เพิ่มข้อมูลลงในประวัติการตรวจจับ
 * @param history - ประวัติการตรวจจับ
 * @param landmarks - จุดสำคัญบนใบหน้า
 * @param boundingBox - กรอบใบหน้า
 * @param confidence - confidence score
 * @param maxHistoryLength - ความยาวสูงสุดของประวัติ (default: 10)
 */
export function addToLivenessHistory(
  history: LivenessHistory,
  landmarks: faceapi.FaceLandmarks68,
  boundingBox: faceapi.Box,
  confidence: number,
  maxHistoryLength: number = 10
): void {
  history.landmarks.push(landmarks);
  history.boundingBoxes.push(boundingBox);
  history.confidenceScores.push(confidence);
  history.timestamps.push(Date.now());

  // จำกัดขนาดประวัติ
  if (history.landmarks.length > maxHistoryLength) {
    history.landmarks.shift();
    history.boundingBoxes.shift();
    history.confidenceScores.shift();
    history.timestamps.shift();
  }
}

/**
 * รีเซ็ตประวัติการตรวจจับ
 * @param history - ประวัติการตรวจจับ
 */
export function resetLivenessHistory(history: LivenessHistory): void {
  history.landmarks.length = 0;
  history.boundingBoxes.length = 0;
  history.confidenceScores.length = 0;
  history.timestamps.length = 0;
}