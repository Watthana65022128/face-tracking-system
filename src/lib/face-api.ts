import * as faceapi from "face-api.js";

let isModelLoaded = false;
let isLoading = false;

// Model URLs from CDN
const MODEL_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

export async function loadFaceApiModels() {
  if (isModelLoaded) {
    console.log("Models already loaded");
    return;
  }

  if (isLoading) {
    console.log("Models are being loaded...");
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
    console.log("Loading face-api models...");

    // โหลดโมเดลที่จำเป็น
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    isModelLoaded = true;
    isLoading = false;
    console.log("Face-api models loaded successfully");
    
  } catch (error) {
    isLoading = false;
    console.error("Error loading face-api models:", error);
    throw new Error("ไม่สามารถโหลดโมเดล AI ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
  }
}

export async function detectFaceAndGetDescriptor(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<number[]> {
  try {
    // ตรวจสอบว่าโมเดลโหลดแล้วหรือยัง
    if (!isModelLoaded) {
      await loadFaceApiModels();
    }

    console.log("Detecting face...");

    // ตั้งค่าการตรวจจับใบหน้า
    const detectionOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416, // ขนาดที่ใหญ่ขึ้นเพื่อความแม่นยำ
      scoreThreshold: 0.5 // threshold สำหรับการตรวจจับ
    });

    // ตรวจจับใบหน้าพร้อม landmarks และ descriptor
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

    console.log("Face detected successfully, score:", detection.detection.score);

    // ส่งคืน face descriptor
    return Array.from(detection.descriptor);

  } catch (error: any) {
    console.error("Face detection error:", error);
    
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
    console.log("Face comparison distance:", distance);
    
    return distance;
  } catch (error) {
    console.error("Face comparison error:", error);
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