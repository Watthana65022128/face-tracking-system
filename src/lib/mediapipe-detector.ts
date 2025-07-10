// MediaPipe face detection and tracking utilities
import { FaceLandmarker, FilesetResolver, NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface FaceTrackingData {
  isDetected: boolean;
  orientation: {
    yaw: number;
    pitch: number;
    roll: number;
    isLookingAway: boolean;
  };
  confidence: number;
  timestamp: number;
}

export class MediaPipeDetector {
  private faceLandmarker: FaceLandmarker | null = null;
  private isInitialized: boolean = false;
  private lastDetection: FaceTrackingData | null = null;
  private detectionHistory: FaceTrackingData[] = [];
  private readonly maxHistorySize = 10;

  async initialize(): Promise<boolean> {
    try {
      console.log('🎯 เริ่มต้นโหลด MediaPipe FaceLandmarker...');
      
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm"
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });

      this.isInitialized = true;
      console.log('✅ MediaPipe FaceLandmarker พร้อมใช้งาน');
      return true;
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการโหลด MediaPipe:', error);
      return false;
    }
  }

  async detectFromVideo(video: HTMLVideoElement, timestamp: number): Promise<FaceTrackingData | null> {
    if (!this.isInitialized || !this.faceLandmarker) {
      console.warn('⚠️ MediaPipe ยังไม่พร้อมใช้งาน');
      return null;
    }

    try {
      const results = this.faceLandmarker.detectForVideo(video, timestamp);
      
      if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
        const noFaceData: FaceTrackingData = {
          isDetected: false,
          orientation: { yaw: 0, pitch: 0, roll: 0, isLookingAway: false },
          confidence: 0,
          timestamp
        };
        
        this.updateHistory(noFaceData);
        return noFaceData;
      }

      const landmarks = results.faceLandmarks[0];
      const trackingData = this.analyzeLandmarks(landmarks, timestamp);
      
      this.updateHistory(trackingData);
      this.lastDetection = trackingData;
      
      return trackingData;
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการตรวจจับใบหน้า:', error);
      return null;
    }
  }

  private analyzeLandmarks(landmarks: NormalizedLandmark[], timestamp: number): FaceTrackingData {
    // คำนวณการหันหน้า (Face Orientation) - Phase 1 เฉพาะ orientation
    const orientation = this.calculateFaceOrientation(landmarks);
    
    return {
      isDetected: true,
      orientation,
      confidence: 0.95, // MediaPipe มักให้ค่า confidence สูง
      timestamp
    };
  }

  private calculateFaceOrientation(landmarks: NormalizedLandmark[]) {
    // ใช้จุดสำคัญตาม MediaPipe FaceMesh landmarks
    const noseTip = landmarks[1];           // จมูก (nose tip)
    const chin = landmarks[18];             // คาง (chin)  
    const leftCheek = landmarks[116];       // แก้มซ้าย (left cheek)
    const rightCheek = landmarks[345];      // แก้มขวา (right cheek)
    const forehead = landmarks[10];         // หน้าผาก (forehead)

    // คำนวณ yaw (การหันซ้าย-ขวา) ใช้ความแตกต่างของแก้มซ้าย-ขวา
    // เมื่อหันซ้าย: แก้มขวาจะอยู่ไกลจากกล้อง (x มากกว่า)
    // เมื่อหันขวา: แก้มซ้ายจะอยู่ไกลจากกล้อง (x น้อยกว่า)
    const cheekDistance = rightCheek.x - leftCheek.x;
    const yaw = Math.atan2(cheekDistance, 0.1) * 180 / Math.PI;
    
    // คำนวณ pitch (การหันบน-ล่าง) ใช้ความสัมพันธ์ระหว่างจมูกกับคาง
    // เมื่อหันขึ้น: จมูกจะอยู่สูงกว่าปกติ
    // เมื่อหันลง: จมูกจะอยู่ต่ำกว่าปกติ
    const noseToChinkDistance = noseTip.y - chin.y;
    const pitch = Math.atan2(noseToChinkDistance + 0.1, 0.1) * 180 / Math.PI - 45; // ปรับ offset
    
    // คำนวณ roll (การเอียงศีรษะซ้าย-ขวา)
    const eyeSlope = Math.atan2(rightCheek.y - leftCheek.y, rightCheek.x - leftCheek.x);
    const roll = eyeSlope * 180 / Math.PI;

    // กำหนด threshold สำหรับการ "หันออกจากจอ" (เข้มงวดกว่าเดิม)
    const YAW_THRESHOLD = 25;      // องศา (ลดจาก 30)
    const PITCH_THRESHOLD = 20;    // องศา (ลดจาก 25)
    
    // ตรวจสอบการหันออกจากจอ
    const isLookingAway = Math.abs(yaw) > YAW_THRESHOLD || Math.abs(pitch) > PITCH_THRESHOLD;

    // Debug logging (จะลบออกในภายหลัง)
    if (Math.abs(yaw) > 15 || Math.abs(pitch) > 15) {
      console.log(`🎯 Face Orientation - Yaw: ${yaw.toFixed(1)}°, Pitch: ${pitch.toFixed(1)}°, Roll: ${roll.toFixed(1)}°, Away: ${isLookingAway}`);
    }

    return { yaw, pitch, roll, isLookingAway };
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private updateHistory(data: FaceTrackingData): void {
    this.detectionHistory.push(data);
    
    // จำกัดขนาด history
    if (this.detectionHistory.length > this.maxHistorySize) {
      this.detectionHistory.shift();
    }
  }

  getLastDetection(): FaceTrackingData | null {
    return this.lastDetection;
  }

  getDetectionHistory(): FaceTrackingData[] {
    return [...this.detectionHistory];
  }

  destroy(): void {
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }
    this.isInitialized = false;
    this.lastDetection = null;
    this.detectionHistory = [];
    console.log('🧹 MediaPipe detector ถูกล้างแล้ว');
  }
}