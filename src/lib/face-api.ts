import * as faceapi from "face-api.js";

let isModelLoaded = false;
let isLoading = false;

// URL ของโมเดลจาก CDN
const MODEL_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

export async function loadFaceApiModels() {
  if (isModelLoaded) {
    console.log("โมเดลถูกโหลดแล้ว");
    return;
  }

  if (isLoading) {
    console.log("กำลังโหลดโมเดล...");
    return new Promise((resolve) => {
      const checkLoaded = setInterval(() => {
        if (isModelLoaded) {
          clearInterval(checkLoaded);
          resolve(true);
        }
      }, 100);
    });
  }

  try {
    isLoading = true;
    console.log("กำลังโหลดโมเดล face-api...");

    // โหลดโมเดลที่จำเป็นสำหรับการตรวจจับท่าและการวิเคราะห์
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL), // สำหรับตรวจจับการกระพริบตา
    ]);

    isModelLoaded = true;
    isLoading = false;
    console.log("โหลดโมเดล face-api สำเร็จ");
    
  } catch (error) {
    isLoading = false;
    console.error("ข้อผิดพลาดในการโหลดโมเดล face-api:", error);
    throw new Error("ไม่สามารถโหลดโมเดล AI ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
  }
}

export async function detectFaceAndGetDescriptor(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  skipValidation: boolean = false
): Promise<number[]> {
  try {
    // ตรวจสอบว่าโมเดลโหลดแล้วหรือยัง
    if (!isModelLoaded) {
      await loadFaceApiModels();
    }

    console.log("กำลังตรวจจับใบหน้า...");

    // ตั้งค่าการตรวจจับใบหน้า
    const detectionOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416, // ขนาดที่ใหญ่ขึ้นเพื่อความแม่นยำ
      scoreThreshold: 0.5 // เกณฑ์สำหรับการตรวจจับ
    });

    // ตรวจจับใบหน้าพร้อมจุดสำคัญและลายเซ็นใบหน้า
    const detection = await faceapi
      .detectSingleFace(imageElement, detectionOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error("ไม่พบใบหน้าในภาพ กรุณาจัดตำแหน่งใบหน้าให้อยู่ในกรอบ");
    }

    // ตรวจสอบความมั่นใจในการตรวจจับ
    if (detection.detection.score < 0.5) {
      throw new Error("คุณภาพการตรวจจับใบหน้าไม่เพียงพอ กรุณาปรับแสงและตำแหน่ง");
    }

    console.log("ตรวจจับใบหน้าสำเร็จ, คะแนน:", detection.detection.score);

    // ส่งคืนลายเซ็นใบหน้า
    return Array.from(detection.descriptor);

  } catch (error: any) {
    console.error("ข้อผิดพลาดในการตรวจจับใบหน้า:", error);
    
    if (error.message.includes("ไม่พบใบหน้า") || error.message.includes("คุณภาพ")) {
      throw error; // ส่งต่อ error message ที่เป็นไทย
    }
    
    throw new Error("เกิดข้อผิดพลาดในการตรวจจับใบหน้า กรุณาลองใหม่อีกครั้ง");
  }
}

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

export function isFaceMatch(
  distance: number,
  threshold: number = 0.6
): boolean {
  // ยิ่ง distance น้อย = ใบหน้าคล้ายกันมาก
  // threshold 0.6 เป็นค่าที่แนะนำสำหรับการยืนยันตัวตน
  return distance < threshold;
}

// ฟังก์ชันสำหรับทดสอบว่าโมเดลพร้อมใช้งานหรือไม่
export function isModelsLoaded(): boolean {
  return isModelLoaded;
}

// ฟังก์ชันสำหรับรีเซ็ตสถานะโมเดล (สำหรับ development)
export function resetModelState(): void {
  isModelLoaded = false;
  isLoading = false;
}

// ฟังก์ชันตรวจสอบท่าใบหน้า
export async function detectFacePose(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<{
  detected: boolean;
  pose: 'front' | 'left' | 'right' | 'unknown';
  confidence: number;
  landmarks?: faceapi.FaceLandmarks68;
  isBlinking?: boolean;
}> {
  try {
    if (!isModelLoaded) {
      await loadFaceApiModels();
    }

    const detectionOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.3
    });

    const detection = await faceapi
      .detectSingleFace(imageElement, detectionOptions)
      .withFaceLandmarks()
      .withFaceExpressions();

    if (!detection) {
      return {
        detected: false,
        pose: 'unknown',
        confidence: 0
      };
    }

    const landmarks = detection.landmarks;
    const expressions = detection.expressions;
    
    // วิเคราะห์ท่าใบหน้าจาก landmarks
    const pose = analyzeFacePose(landmarks);
    
    // ตรวจจับการกระพริบตา
    const isBlinking = detectBlinking(landmarks);
    
    // การบันทึกข้อมูลการดีบักสำหรับการตรวจจับท่า
    console.log('การตรวจจับท่าใบหน้า:', {
      pose: pose.pose,
      yaw: pose.yaw.toFixed(2),
      confidence: detection.detection.score.toFixed(3),
      isBlinking,
      timestamp: new Date().toISOString()
    });
    
    return {
      detected: true,
      pose: pose.pose,
      confidence: detection.detection.score,
      landmarks,
      isBlinking
    };

  } catch (error) {
    console.error('ข้อผิดพลาดในการตรวจจับท่าใบหน้า:', error);
    return {
      detected: false,
      pose: 'unknown',
      confidence: 0
    };
  }
}

// วิเคราะห์ท่าใบหน้าจาก landmarks
function analyzeFacePose(landmarks: faceapi.FaceLandmarks68): {
  pose: 'front' | 'left' | 'right' | 'unknown';
  yaw: number;
} {
  const positions = landmarks.positions;
  
  // ใช้จุด landmarks ของจมูกและมุมตา
  const leftEye = positions[36]; // มุมตาซ้าย
  const rightEye = positions[45]; // มุมตาขวา
  const noseTip = positions[30]; // ปลายจมูก
  const leftMouth = positions[48]; // มุมปากซ้าย
  const rightMouth = positions[54]; // มุมปากขวา
  
  // คำนวณระยะห่างระหว่างตาและปาก
  const eyeDistance = Math.abs(leftEye.x - rightEye.x);
  const mouthDistance = Math.abs(leftMouth.x - rightMouth.x);
  
  // คำนวณมุมหมุนหน้า (yaw)
  const faceCenter = (leftEye.x + rightEye.x) / 2;
  const noseOffset = noseTip.x - faceCenter;
  const yaw = (noseOffset / eyeDistance) * 100; // แปลงเป็นเปอร์เซ็นต์
  
  let pose: 'front' | 'left' | 'right' | 'unknown' = 'unknown';
  
  if (Math.abs(yaw) < 15) {
    pose = 'front';
  } else if (yaw > 15) {
    pose = 'left'; // หันซ้าย (จมูกเอียงไปทางขวาของหน้าจอ = ผู้ใช้หันซ้าย)
  } else if (yaw < -15) {
    pose = 'right'; // หันขวา (จมูกเอียงไปทางซ้ายของหน้าจอ = ผู้ใช้หันขวา)
  }
  
  return { pose, yaw };
}

// ตรวจจับการกระพริบตา - ใช้ Eye Aspect Ratio (EAR)
function detectBlinking(landmarks: faceapi.FaceLandmarks68): boolean {
  const positions = landmarks.positions;
  
  // จุด landmarks ของตาซ้าย (36-41)
  const leftEyePoints = {
    p1: positions[36], // มุมซ้าย
    p2: positions[37], // บนซ้าย
    p3: positions[38], // บนขวา
    p4: positions[39], // มุมขวา
    p5: positions[40], // ล่างขวา
    p6: positions[41]  // ล่างซ้าย
  };
  
  // จุด landmarks ของตาขวา (42-47)
  const rightEyePoints = {
    p1: positions[42], // มุมซ้าย
    p2: positions[43], // บนซ้าย
    p3: positions[44], // บนขวา
    p4: positions[45], // มุมขวา
    p5: positions[46], // ล่างขวา
    p6: positions[47]  // ล่างซ้าย
  };
  
  // คำนวณ Eye Aspect Ratio (EAR)
  function calculateEAR(eye: any) {
    // ระยะทางแนวตั้ง
    const vertical1 = Math.sqrt(
      Math.pow(eye.p2.x - eye.p6.x, 2) + Math.pow(eye.p2.y - eye.p6.y, 2)
    );
    const vertical2 = Math.sqrt(
      Math.pow(eye.p3.x - eye.p5.x, 2) + Math.pow(eye.p3.y - eye.p5.y, 2)
    );
    
    // ระยะทางแนวนอน
    const horizontal = Math.sqrt(
      Math.pow(eye.p1.x - eye.p4.x, 2) + Math.pow(eye.p1.y - eye.p4.y, 2)
    );
    
    // EAR = (แนวตั้ง1 + แนวตั้ง2) / (2 * แนวนอน)
    return (vertical1 + vertical2) / (2 * horizontal);
  }
  
  const leftEAR = calculateEAR(leftEyePoints);
  const rightEAR = calculateEAR(rightEyePoints);
  const avgEAR = (leftEAR + rightEAR) / 2;
  
  // เกณฑ์สำหรับการกระพริบ (ค่าต่ำแสดงว่าตาปิด)
  const blinkThreshold = 0.25;
  
  console.log('การตรวจจับการกระพริบ:', {
    leftEAR: leftEAR.toFixed(3),
    rightEAR: rightEAR.toFixed(3),
    avgEAR: avgEAR.toFixed(3),
    threshold: blinkThreshold,
    isBlinking: avgEAR < blinkThreshold
  });
  
  return avgEAR < blinkThreshold;
}

// ฟังก์ชันตรวจสอบความพร้อมของท่า
export function isPoseReady(
  currentPose: 'front' | 'left' | 'right' | 'unknown',
  targetPose: 'front' | 'left' | 'right' | 'blink',
  confidence: number,
  isBlinking?: boolean
): boolean {
  // ความมั่นใจต้องมากกว่า 70%
  if (confidence < 0.7) return false;
  
  if (targetPose === 'blink') {
    return isBlinking === true;
  }
  
  return currentPose === targetPose;
}