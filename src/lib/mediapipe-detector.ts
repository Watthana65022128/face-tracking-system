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
  mouth: {
    isOpen: boolean;
    openingRatio: number;
    isMoving: boolean;
  };
  eyes: {
    gazeDirection: 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';
    isLookingAtScreen: boolean;
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
          mouth: { isOpen: false, openingRatio: 0, isMoving: false },
          eyes: { gazeDirection: 'CENTER', isLookingAtScreen: true },
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
    // คำนวณการหันหน้า (Face Orientation)
    const orientation = this.calculateFaceOrientation(landmarks);
    
    // คำนวณการเคลื่อนไหวของปาก (Mouth Movement)
    const mouth = this.calculateMouthMovement(landmarks);
    
    // คำนวณทิศทางการมอง (Eye Gaze)
    const eyes = this.calculateEyeGaze(landmarks);
    
    return {
      isDetected: true,
      orientation,
      mouth,
      eyes,
      confidence: 0.95, // MediaPipe มักให้ค่า confidence สูง
      timestamp
    };
  }

  private calculateFaceOrientation(landmarks: NormalizedLandmark[]) {
    // ใช้จุดสำคัญเพื่อคำนวณการหันหน้า
    const noseTip = landmarks[1];           // จมูก
    const chin = landmarks[18];             // คาง
    const leftCheek = landmarks[116];       // แก้มซ้าย
    const rightCheek = landmarks[345];      // แก้มขวา
    const forehead = landmarks[10];         // หน้าผาก

    // คำนวณ yaw (การหันซ้าย-ขวา)
    const yaw = Math.atan2(rightCheek.x - leftCheek.x, rightCheek.z - leftCheek.z) * 180 / Math.PI;
    
    // คำนวณ pitch (การหันบน-ล่าง)  
    const pitch = Math.atan2(forehead.y - chin.y, forehead.z - chin.z) * 180 / Math.PI;
    
    // คำนวณ roll (การเอียงซ้าย-ขวา)
    const roll = Math.atan2(leftCheek.y - rightCheek.y, leftCheek.x - rightCheek.x) * 180 / Math.PI;

    // กำหนด threshold สำหรับการ "หันออกจากจอ"
    const YAW_THRESHOLD = 30;      // องศา
    const PITCH_THRESHOLD = 25;    // องศา
    
    const isLookingAway = Math.abs(yaw) > YAW_THRESHOLD || Math.abs(pitch) > PITCH_THRESHOLD;

    return { yaw, pitch, roll, isLookingAway };
  }

  private calculateMouthMovement(landmarks: NormalizedLandmark[]) {
    // จุดสำคัญของปาก
    const upperLip = landmarks[13];         // ริมฝีปากบน
    const lowerLip = landmarks[14];         // ริมฝีปากล่าง
    const leftCorner = landmarks[61];       // มุมปากซ้าย
    const rightCorner = landmarks[291];     // มุมปากขวา

    // คำนวณระยะห่างปาก (mouth opening)
    const mouthHeight = Math.abs(upperLip.y - lowerLip.y);
    const mouthWidth = Math.abs(leftCorner.x - rightCorner.x);
    
    // อัตราส่วนการเปิดปาก
    const openingRatio = mouthHeight / mouthWidth;
    
    // threshold สำหรับการเปิดปาก
    const MOUTH_OPEN_THRESHOLD = 0.04;
    const isOpen = openingRatio > MOUTH_OPEN_THRESHOLD;
    
    // ตรวจจับการเคลื่อนไหวของปาก (เปรียบเทียบกับประวัติ)
    let isMoving = false;
    if (this.detectionHistory.length > 3) {
      const recentRatios = this.detectionHistory.slice(-3).map(d => d.mouth.openingRatio);
      const ratioVariance = this.calculateVariance(recentRatios);
      isMoving = ratioVariance > 0.001; // threshold สำหรับการเคลื่อนไหว
    }

    return { isOpen, openingRatio, isMoving };
  }

  private calculateEyeGaze(landmarks: NormalizedLandmark[]) {
    // จุดสำคัญของตา
    const leftEyeCenter = landmarks[33];    // ตาซ้าย
    const rightEyeCenter = landmarks[362];  // ตาขวา
    const noseTip = landmarks[1];           // จมูก (reference point)

    // คำนวณจุดกึ่งกลางระหว่างดวงตา
    const eyeCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const eyeCenterY = (leftEyeCenter.y + rightEyeCenter.y) / 2;

    // คำนวณทิศทางการมองเทียบกับจมูก
    const gazeOffsetX = eyeCenterX - noseTip.x;
    const gazeOffsetY = eyeCenterY - noseTip.y;

    // กำหนด threshold สำหรับทิศทางการมอง
    const GAZE_THRESHOLD_X = 0.02;
    const GAZE_THRESHOLD_Y = 0.015;

    let gazeDirection: 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' = 'CENTER';
    
    if (Math.abs(gazeOffsetX) > GAZE_THRESHOLD_X) {
      gazeDirection = gazeOffsetX > 0 ? 'RIGHT' : 'LEFT';
    } else if (Math.abs(gazeOffsetY) > GAZE_THRESHOLD_Y) {
      gazeDirection = gazeOffsetY > 0 ? 'DOWN' : 'UP';
    }

    // ตรวจสอบว่ากำลังมองที่จอหรือไม่
    const isLookingAtScreen = gazeDirection === 'CENTER';

    return { gazeDirection, isLookingAtScreen };
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