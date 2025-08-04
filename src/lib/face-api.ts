// Main face-api.ts file - รวมการนำเข้าจากโมดูลต่างๆ
// ไฟล์นี้ทำหน้าที่เป็น entry point หลักสำหรับระบบ face recognition

// นำเข้าฟังก์ชันทั้งหมดจากโมดูลที่แยกออกมา
export {
  // การตรวจจับใบหน้า
  loadFaceApiModels,
  detectFaceAndGetDescriptor,
  detectFacePose,
  isModelsLoaded,
  resetModelState,
  
  // การตรวจสอบและยืนยันท่า
  isPoseReady,
  isPoseReadyForLogin,
  getRandomPoseForLogin,
  getPoseDisplayName,
  isValidConfidence,
  getConfidencePercentage,
  
  // การเปรียบเทียบใบหน้า
  compareFaceDescriptors,
  isFaceMatch,
  compareMultiplePoses,
  findBestMatch,
  isValidDescriptor,
  distanceToSimilarityPercentage,
  getSecurityLevel,
  
  // การตรวจสอบความเป็นจริง (liveness detection)
  detectMovement,
  detectDepthMovement,
  detectConfidenceVariation,
  createLivenessHistory,
  addToLivenessHistory,
  resetLivenessHistory,
  
  // Types และค่าคงที่
  type PoseType,
  type LoginPoseType,
  type SecurityLevel,
  type LivenessHistory,
  FACE_API_CONFIG,
  
  // ฟังก์ชันช่วยเหลือ
  handleFaceApiError,
  logFaceApiDebug,
  checkWebcamSupport,
  checkWebGLSupport
} from './face-api/index';

// Export เพิ่มเติมสำหรับ backward compatibility
export * from './face-api/index';

/*
 * คำอธิบายการใช้งาน:
 * 
 * 1. การตรวจจับใบหน้า (Face Detection):
 *    - loadFaceApiModels(): โหลดโมเดล AI
 *    - detectFaceAndGetDescriptor(): ตรวจจับใบหน้าและสร้าง descriptor
 *    - detectFacePose(): ตรวจจับท่าและการกระพริบตา
 * 
 * 2. การตรวจสอบท่า (Pose Validation):
 *    - isPoseReady(): ตรวจสอบท่าสำหรับการลงทะเบียน (4 ท่า)
 *    - isPoseReadyForLogin(): ตรวจสอบท่าสำหรับการยืนยันตัวตน (3 ท่า)
 *    - getRandomPoseForLogin(): เลือกท่าสุ่มสำหรับการยืนยัน
 * 
 * 3. การเปรียบเทียบใบหน้า (Face Comparison):
 *    - compareFaceDescriptors(): เปรียบเทียบ face descriptors
 *    - isFaceMatch(): ตรวจสอบว่าใบหน้าตรงกันหรือไม่
 *    - compareMultiplePoses(): เปรียบเทียบหลายท่าและหาค่าเฉลี่ย
 * 
 * 4. การตรวจสอบความเป็นจริง (Liveness Detection):
 *    - detectMovement(): ตรวจสอบการเคลื่อนไหวของใบหน้า
 *    - detectDepthMovement(): ตรวจสอบการเคลื่อนที่เข้าออกจากกล้อง
 *    - detectConfidenceVariation(): ตรวจสอบความแปรปรวนของ confidence
 * 
 * 5. ค่าคงที่และการตั้งค่า:
 *    - FACE_API_CONFIG: ค่าคงที่สำหรับการตั้งค่าต่างๆ
 *    - เกณฑ์ความมั่นใจ, threshold สำหรับการตรวจจับ
 * 
 * 6. ฟังก์ชันช่วยเหลือ:
 *    - handleFaceApiError(): จัดการข้อผิดพลาด
 *    - logFaceApiDebug(): การ debug ในโหมดพัฒนา
 *    - checkWebcamSupport(): ตรวจสอบการรองรับกล้อง
 *    - checkWebGLSupport(): ตรวจสอบการรองรับ WebGL
 * 
 * การใช้งาน:
 * ```typescript
 * import { 
 *   loadFaceApiModels,
 *   detectFacePose,
 *   isPoseReady,
 *   compareFaceDescriptors,
 *   isFaceMatch
 * } from '@/lib/face-api';
 * 
 * // โหลดโมเดล
 * await loadFaceApiModels();
 * 
 * // ตรวจจับท่า
 * const poseResult = await detectFacePose(videoElement);
 * 
 * // ตรวจสอบความพร้อมของท่า
 * const ready = isPoseReady(poseResult.pose, 'front', poseResult.confidence);
 * 
 * // เปรียบเทียบใบหน้า
 * const distance = compareFaceDescriptors(descriptor1, descriptor2);
 * const isMatch = isFaceMatch(distance, 0.6);
 * ```
 */