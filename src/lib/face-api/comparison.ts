import * as faceapi from "face-api.js";

/**
 * เปรียบเทียบ face descriptors และคำนวณระยะห่าง
 * @param descriptor1 - Face descriptor ชุดแรก (128 มิติ)
 * @param descriptor2 - Face descriptor ชุดที่สอง (128 มิติ)
 * @returns ระยะห่าง Euclidean distance (ยิ่งน้อยยิ่งคล้าย)
 */
export function compareFaceDescriptors(
  descriptor1: number[],
  descriptor2: number[]
): number {
  try {
    // ตรวจสอบว่า descriptor มีความยาวถูกต้อง
    if (!descriptor1 || !descriptor2) {
      throw new Error("ข้อมูล face descriptor ไม่ถูกต้อง");
    }
    
    if (descriptor1.length !== 128 || descriptor2.length !== 128) {
      throw new Error("ข้อมูล face descriptor มีขนาดไม่ถูกต้อง");
    }

    // คำนวณ Euclidean distance
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    console.log("ระยะห่างการเปรียบเทียบใบหน้า:", distance);
    
    return distance;
  } catch (error) {
    console.error("ข้อผิดพลาดในการเปรียบเทียบใบหน้า:", error);
    throw error;
  }
}

/**
 * ตรวจสอบว่าใบหน้าตรงกันหรือไม่ตามเกณฑ์ที่กำหนด
 * @param distance - ระยะห่างจากการเปรียบเทียบ
 * @param threshold - เกณฑ์การตัดสิน (default: 0.6)
 * @returns true หากใบหน้าตรงกัน
 */
export function isFaceMatch(
  distance: number,
  threshold: number = 0.6
): boolean {
  // ยิ่ง distance น้อย = ใบหน้าคล้ายกันมาก
  // threshold 0.6 เป็นค่าที่แนะนำสำหรับการยืนยันตัวตน
  return distance < threshold;
}

/**
 * เปรียบเทียบใบหน้าหลายท่าและหาค่าเฉลี่ย
 * @param storedDescriptors - Array ของ descriptors ที่เก็บไว้
 * @param currentDescriptor - Descriptor ปัจจุบัน
 * @returns ค่าเฉลี่ยของระยะห่าง
 */
export function compareMultiplePoses(
  storedDescriptors: number[][],
  currentDescriptor: number[]
): number {
  if (!storedDescriptors || storedDescriptors.length === 0) {
    throw new Error("ไม่พบข้อมูลใบหน้าที่เก็บไว้");
  }

  const distances = storedDescriptors.map(descriptor => 
    compareFaceDescriptors(descriptor, currentDescriptor)
  );

  // คำนวณค่าเฉลี่ย
  const averageDistance = distances.reduce((sum, distance) => sum + distance, 0) / distances.length;
  
  console.log("ระยะห่างแต่ละท่า:", distances);
  console.log("ค่าเฉลี่ยระยะห่าง:", averageDistance);
  
  return averageDistance;
}

/**
 * หาค่าระยะห่างที่ใกล้ที่สุดจากหลายท่า
 * @param storedDescriptors - Array ของ descriptors ที่เก็บไว้
 * @param currentDescriptor - Descriptor ปัจจุบัน
 * @returns ระยะห่างที่ใกล้ที่สุด
 */
export function findBestMatch(
  storedDescriptors: number[][],
  currentDescriptor: number[]
): number {
  if (!storedDescriptors || storedDescriptors.length === 0) {
    throw new Error("ไม่พบข้อมูลใบหน้าที่เก็บไว้");
  }

  const distances = storedDescriptors.map(descriptor => 
    compareFaceDescriptors(descriptor, currentDescriptor)
  );

  const bestDistance = Math.min(...distances);
  console.log("ระยะห่างที่ใกล้ที่สุด:", bestDistance);
  
  return bestDistance;
}

/**
 * ตรวจสอบคุณภาพของ face descriptor
 * @param descriptor - Face descriptor ที่ต้องการตรวจสอบ
 * @returns true หากมีคุณภาพดี
 */
export function isValidDescriptor(descriptor: number[]): boolean {
  if (!descriptor || !Array.isArray(descriptor)) {
    return false;
  }
  
  if (descriptor.length !== 128) {
    return false;
  }
  
  // ตรวจสอบว่าไม่มีค่า NaN หรือ Infinity
  return descriptor.every(value => 
    typeof value === 'number' && 
    !isNaN(value) && 
    isFinite(value)
  );
}

/**
 * แปลงระยะห่างเป็นเปอร์เซ็นต์ความคล้าย
 * @param distance - ระยะห่างจากการเปรียบเทียบ
 * @returns เปอร์เซ็นต์ความคล้าย (0-100)
 */
export function distanceToSimilarityPercentage(distance: number): number {
  // ใช้ sigmoid function เพื่อแปลงเป็นเปอร์เซ็นต์
  // distance 0 = 100%, distance 1 = ~27%
  const similarity = 1 / (1 + Math.exp(distance * 5 - 2.5));
  return Math.round(similarity * 100);
}

/**
 * ตรวจสอบความปลอดภัยของการเปรียบเทียบ
 * @param distance - ระยะห่างจากการเปรียบเทียบ
 * @returns ระดับความปลอดภัย
 */
export function getSecurityLevel(distance: number): 'high' | 'medium' | 'low' {
  if (distance < 0.3) return 'high';
  if (distance < 0.6) return 'medium';
  return 'low';
}