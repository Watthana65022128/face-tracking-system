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
  landmarks?: NormalizedLandmark[];
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
      
      // ลองวิธีโหลดแบบต่างๆ หากวิธีแรกไม่สำเร็จ
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      console.log('✅ FilesetResolver โหลดสำเร็จ');

      // ลองโหลด model แบบง่ายก่อน (ไม่ใช้ GPU)
      this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "CPU"
        },
        outputFaceBlendshapes: false, // ปิดก่อนเพื่อลดภาระ
        outputFacialTransformationMatrixes: false, // ปิดก่อนเพื่อลดภาระ
        runningMode: "VIDEO",
        numFaces: 1
      });

      this.isInitialized = true;
      console.log('✅ MediaPipe FaceLandmarker พร้อมใช้งาน');
      return true;
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการโหลด MediaPipe:', error);
      console.error('รายละเอียดข้อผิดพลาด:', error instanceof Error ? error.message : String(error));
      
      // ลองวิธีสำรองหากไม่สำเร็จ
      return await this.initializeFallback();
    }
  }

  private async initializeFallback(): Promise<boolean> {
    try {
      console.log('🔄 ลองโหลด MediaPipe แบบสำรอง...');
      
      // ลองใช้ CDN ต่างออกไป
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          delegate: "CPU"
        },
        runningMode: "VIDEO",
        numFaces: 1
      });

      this.isInitialized = true;
      console.log('✅ MediaPipe FaceLandmarker โหลดสำเร็จแบบสำรอง');
      return true;
    } catch (fallbackError) {
      console.error('❌ การโหลดแบบสำรองก็ไม่สำเร็จ:', fallbackError);
      return false;
    }
  }

  async detectFromVideo(video: HTMLVideoElement, timestamp: number): Promise<FaceTrackingData | null> {
    if (!this.isInitialized || !this.faceLandmarker) {
      console.warn('⚠️ MediaPipe ยังไม่พร้อมใช้งาน');
      return null;
    }

    try {
      // ตรวจสอบ video readiness
      if (!video || video.readyState < 2) {
        console.warn('⚠️ Video ยังไม่พร้อม readyState:', video?.readyState);
        return null;
      }

      console.log('🔍 เรียก detectForVideo...', { timestamp, videoWidth: video.videoWidth, videoHeight: video.videoHeight });
      const results = this.faceLandmarker.detectForVideo(video, timestamp);
      console.log('📊 MediaPipe results:', { 
        hasLandmarks: !!results.faceLandmarks, 
        landmarkCount: results.faceLandmarks?.length || 0,
        firstFaceLandmarks: results.faceLandmarks?.[0]?.length || 0
      });
      
      if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
        console.log('❌ ไม่พบใบหน้าใน MediaPipe results');
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
      console.log('✅ พบใบหน้า! landmarks:', landmarks.length, 'จุด');
      const trackingData = this.analyzeLandmarks(landmarks, timestamp);
      console.log('📈 tracking data:', trackingData);
      
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
      timestamp,
      landmarks // ส่ง landmarks ทั้ง 468 จุดไปให้ component
    };
  }

  private calculateFaceOrientation(landmarks: NormalizedLandmark[]) {
    // ใช้จุดสำคัญตาม MediaPipe FaceMesh 468 landmarks
    const noseTip = landmarks[1];        // จมูกปลาย
    const leftEyeInner = landmarks[133]; // มุมในตาซ้าย
    const rightEyeInner = landmarks[362]; // มุมในตาขวา
    const leftEyeOuter = landmarks[33];   // มุมนอกตาซ้าย  
    const rightEyeOuter = landmarks[263]; // มุมนอกตาขวา
    const chin = landmarks[18];           // คาง
    const forehead = landmarks[10];       // หน้าผาก

    // คำนวณ yaw (หันซ้าย-ขวา) ด้วยอัตราส่วนความยาวตา
    const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
    const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);
    
    // เมื่อหันซ้าย: ตาขวาจะดูเล็กลง, เมื่อหันขวา: ตาซ้ายจะดูเล็กลง
    const eyeRatio = leftEyeWidth / rightEyeWidth;
    let yaw = (eyeRatio - 1) * 100; // คูณ 100 เพื่อให้เป็นองศา
    yaw = Math.max(-60, Math.min(60, yaw)); // จำกัด range
    
    // คำนวณ pitch (หันบน-ล่าง) ด้วยอัตราส่วนจมูก-คาง
    const noseToForeheadDistance = Math.abs(noseTip.y - forehead.y);
    const noseToChinDistance = Math.abs(chin.y - noseTip.y);
    
    const verticalRatio = noseToForeheadDistance / noseToChinDistance;
    let pitch = (verticalRatio - 0.6) * 200; // ปรับ scale
    pitch = Math.max(-45, Math.min(45, pitch)); // จำกัด range
    
    // คำนวณ roll (เอียงซ้าย-ขวา) ด้วยความเอียงของตา
    const eyeCenterY = (leftEyeInner.y + rightEyeInner.y) / 2;
    const leftEyeY = (leftEyeInner.y + leftEyeOuter.y) / 2;
    const rightEyeY = (rightEyeInner.y + rightEyeOuter.y) / 2;
    
    const roll = Math.atan2(rightEyeY - leftEyeY, rightEyeInner.x - leftEyeInner.x) * 180 / Math.PI;

    // กำหนด threshold สำหรับการ "หันออกจากจอ" 
    const YAW_THRESHOLD = 20;      // องศา
    const PITCH_THRESHOLD = 15;    // องศา
    
    // ตรวจสอบการหันออกจากจอ
    const isLookingAway = Math.abs(yaw) > YAW_THRESHOLD || Math.abs(pitch) > PITCH_THRESHOLD;

    // Debug logging ทุกครั้ง
    console.log(`🎯 Face Orientation - Yaw: ${yaw.toFixed(1)}°, Pitch: ${pitch.toFixed(1)}°, Roll: ${roll.toFixed(1)}°, Away: ${isLookingAway}`);
    console.log(`👀 Eye Ratio: ${eyeRatio.toFixed(3)}, Vertical Ratio: ${verticalRatio.toFixed(3)}`);

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
      
      this.faceLandmarker = null;
    }
    this.isInitialized = false;
    this.lastDetection = null;
    this.detectionHistory = [];
    console.log('🧹 MediaPipe detector ถูกล้างแล้ว');
  }
}