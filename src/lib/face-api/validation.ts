/**
 * ฟังก์ชันตรวจสอบความพร้อมของท่าสำหรับการลงทะเบียน
 * รองรับ 4 ท่า: front, left, right, blink
 * @param currentPose - ท่าปัจจุบันที่ตรวจจับได้
 * @param targetPose - ท่าเป้าหมายที่ต้องการ
 * @param confidence - ความมั่นใจในการตรวจจับ (0-1)
 * @param isBlinking - สถานะการกระพริบตา (สำหรับ blink pose)
 * @returns true หากท่าพร้อมสำหรับการบันทึก
 */
export function isPoseReady(
  currentPose: 'front' | 'left' | 'right' | 'unknown',
  targetPose: 'front' | 'left' | 'right' | 'blink',
  confidence: number,
  isBlinking?: boolean
): boolean {
  // ความมั่นใจต้องมากกว่า 70%
  if (confidence < 0.7) return false;
  
  // สำหรับท่ากระพริบตา
  if (targetPose === 'blink') {
    return isBlinking === true;
  }
  
  // สำหรับท่าใบหน้าทั่วไป
  return currentPose === targetPose;
}

/**
 * ฟังก์ชันตรวจสอบความพร้อมของท่าสำหรับการยืนยันตัวตน
 * ใช้เฉพาะ 3 ท่า: front, left, right (ไม่รวม blink)
 * @param currentPose - ท่าปัจจุบันที่ตรวจจับได้
 * @param targetPose - ท่าเป้าหมายที่ต้องการ
 * @param confidence - ความมั่นใจในการตรวจจับ (0-1)
 * @returns true หากท่าพร้อมสำหรับการยืนยัน
 */
export function isPoseReadyForLogin(
  currentPose: 'front' | 'left' | 'right' | 'unknown',
  targetPose: 'front' | 'left' | 'right',
  confidence: number
): boolean {
  // ความมั่นใจต้องมากกว่า 70%
  if (confidence < 0.7) return false;
  
  return currentPose === targetPose;
}

/**
 * เลือกท่าแบบสุ่มสำหรับการยืนยันตัวตน
 * @returns ท่าที่ถูกเลือกแบบสุ่ม
 */
export function getRandomPoseForLogin(): 'front' | 'left' | 'right' {
  const poses: ('front' | 'left' | 'right')[] = ['front', 'left', 'right'];
  const randomIndex = Math.floor(Math.random() * poses.length);
  return poses[randomIndex];
}

/**
 * แปลงชื่อท่าเป็นภาษาไทย
 * @param pose - ท่าที่ต้องการแปล
 * @returns ชื่อท่าเป็นภาษาไทย
 */
export function getPoseDisplayName(pose: 'front' | 'left' | 'right' | 'blink' | 'unknown'): string {
  const poseNames = {
    'front': 'หน้าตรง',
    'left': 'หันซ้าย',
    'right': 'หันขวา',
    'blink': 'กระพริบตา',
    'unknown': 'ไม่ทราบ'
  };
  
  return poseNames[pose] || 'ไม่ทราบ';
}

/**
 * ตรวจสอบความถูกต้องของ confidence score
 * @param confidence - คะแนนความมั่นใจ
 * @returns true หากคะแนนอยู่ในช่วงที่ยอมรับได้
 */
export function isValidConfidence(confidence: number): boolean {
  return confidence >= 0 && confidence <= 1;
}

/**
 * คำนวณเปอร์เซ็นต์ของ confidence score
 * @param confidence - คะแนนความมั่นใจ (0-1)
 * @returns เปอร์เซ็นต์ (0-100)
 */
export function getConfidencePercentage(confidence: number): number {
  return Math.round(confidence * 100);
}