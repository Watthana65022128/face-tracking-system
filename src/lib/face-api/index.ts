// การนำเข้าและส่งออกฟังก์ชันทั้งหมดจากโมดูลต่างๆ

// โมดูลการตรวจจับใบหน้า
export {
  loadFaceApiModels,
  detectFaceAndGetDescriptor,
  detectFacePose,
  isModelsLoaded,
  resetModelState
} from './detection';

// โมดูลการตรวจสอบและยืนยันท่า
export {
  isPoseReady,
  isPoseReadyForLogin,
  getRandomPoseForLogin,
  getPoseDisplayName,
  isValidConfidence,
  getConfidencePercentage
} from './validation';

// โมดูลการเปรียบเทียบใบหน้า
export {
  compareFaceDescriptors,
  isFaceMatch,
  compareMultiplePoses,
  findBestMatch,
  isValidDescriptor,
  distanceToSimilarityPercentage,
  getSecurityLevel
} from './comparison';

// โมดูลการตรวจสอบความเป็นจริง (liveness detection)
export {
  detectMovement,
  detectDepthMovement,
  detectConfidenceVariation,
  createLivenessHistory,
  addToLivenessHistory,
  resetLivenessHistory,
  type LivenessHistory
} from './liveness';

// Type definitions สำหรับการใช้งาน
export type PoseType = 'front' | 'left' | 'right' | 'blink' | 'unknown';
export type LoginPoseType = 'front' | 'left' | 'right';
export type SecurityLevel = 'high' | 'medium' | 'low';

// ค่าคงที่สำหรับการตั้งค่า
export const FACE_API_CONFIG = {
  // เกณฑ์ความมั่นใจสำหรับการตรวจจับใบหน้า
  DETECTION_CONFIDENCE_THRESHOLD: 0.7,
  
  // เกณฑ์สำหรับการเปรียบเทียบใบหน้า
  FACE_MATCH_THRESHOLD: 0.6,
  STRICT_MATCH_THRESHOLD: 0.4,
  
  // เกณฑ์สำหรับการตรวจจับท่า
  POSE_YAW_THRESHOLD: 15,
  BLINK_EAR_THRESHOLD: 0.25,
  
  // การตั้งค่าโมเดล
  MODEL_INPUT_SIZE: 416,
  MODEL_SCORE_THRESHOLD: 0.5,
  
  // ขนาดของประวัติการตรวจจับ
  LIVENESS_HISTORY_LENGTH: 10,
  
  // ระยะเวลาตรวจจับ
  POSE_VERIFICATION_TIMEOUT: 10000, // 10 วินาที
  POSE_STABILITY_FRAMES: 10 // 10 เฟรมสำหรับความเสถียร
} as const;

// ฟังก์ชันช่วยเหลือสำหรับการจัดการข้อผิดพลาด
export function handleFaceApiError(error: any): string {
  if (error.message.includes('ไม่พบใบหน้า')) {
    return 'ไม่พบใบหน้าในภาพ กรุณาจัดตำแหน่งใบหน้าให้อยู่ในกรอบ';
  }
  
  if (error.message.includes('คุณภาพ')) {
    return 'คุณภาพการตรวจจับใบหน้าไม่เพียงพอ กรุณาปรับแสงและตำแหน่ง';
  }
  
  if (error.message.includes('โมเดล')) {
    return 'ไม่สามารถโหลดโมเดล AI ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
  }
  
  return 'เกิดข้อผิดพลาดในการประมวลผลใบหน้า กรุณาลองใหม่อีกครั้ง';
}

// ฟังก์ชันช่วยเหลือสำหรับการ debug
export function logFaceApiDebug(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Face API Debug] ${message}`, data || '');
  }
}

// ฟังก์ชันตรวจสอบว่าเบราว์เซอร์รองรับ getUserMedia หรือไม่
export function checkWebcamSupport(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// ฟังก์ชันตรวจสอบว่าเบราว์เซอร์รองรับ WebGL หรือไม่
export function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
}