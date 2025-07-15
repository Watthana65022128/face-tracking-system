// MediaPipe face detection and tracking utilities
import { FaceLandmarker, FilesetResolver, NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface FaceTrackingData {
  isDetected: boolean;
  orientation: {
    yaw: number;
    pitch: number;
    isLookingAway: boolean;
  };
  confidence: number;
  timestamp: number;
  landmarks?: NormalizedLandmark[];
  multipleFaces?: {
    count: number;
    isSecurityRisk: boolean;
    warningMessage?: string;
  };
}

export class MediaPipeDetector {
  private faceLandmarker: FaceLandmarker | null = null;
  private isInitialized: boolean = false;
  private lastDetection: FaceTrackingData | null = null;
  
  // Auto-calibration system สำหรับ Pitch baseline
  private calibrationSamples: number[] = [];
  private calibrationComplete: boolean = false;
  private calibratedNeutralPosition: number = 0.58; // default value

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
        numFaces: 3 // เพิ่มเป็น 3 เพื่อตรวจสอบหลายใบหน้า
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
        numFaces: 3 // เพิ่มเป็น 3 เพื่อตรวจสอบหลายใบหน้า
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

      // ตรวจสอบ faceLandmarker อีกครั้งก่อนเรียกใช้
      if (!this.faceLandmarker || typeof this.faceLandmarker.detectForVideo !== 'function') {
        console.error('❌ faceLandmarker ไม่พร้อมใช้งาน หรือ detectForVideo method ไม่พบ');
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
          orientation: { yaw: 0, pitch: 0, isLookingAway: false },
          confidence: 0,
          timestamp,
          multipleFaces: {
            count: 0,
            isSecurityRisk: false
          }
        };
        
        this.lastDetection = noFaceData;
        return noFaceData;
      }

      // ตรวจสอบจำนวนใบหน้าที่ตรวจพบ
      const faceCount = results.faceLandmarks.length;
      let multipleFacesData = {
        count: faceCount,
        isSecurityRisk: faceCount > 1,
        warningMessage: faceCount > 1 ? 
          `⚠️ ตรวจพบ ${faceCount} ใบหน้า! อาจมีคนอื่นในการสอบ` : 
          undefined
      };

      // แจ้งเตือนในคอนโซลหากพบหลายใบหน้า
      if (faceCount > 1) {
        console.warn(`🚨 SECURITY ALERT: ตรวจพบ ${faceCount} ใบหน้า! อาจมีคนอื่นในการสอบ`);
        console.warn('📍 ตำแหน่งใบหน้าทั้งหมด:', results.faceLandmarks.map((face, idx) => ({
          face: idx + 1,
          landmarkCount: face.length,
          noseTip: face[1] // จุดปลายจมูก
        })));
      }

      const landmarks = results.faceLandmarks[0]; // ใช้ใบหน้าแรก (ใหญ่ที่สุด)
      console.log('✅ พบใบหน้า! landmarks:', landmarks.length, 'จุด');
      const trackingData = this.analyzeLandmarks(landmarks, timestamp);
      
      // เพิ่มข้อมูลหลายใบหน้า
      trackingData.multipleFaces = multipleFacesData;
      
      console.log('📈 tracking data:', trackingData);
      
      this.lastDetection = trackingData;
      return trackingData;
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการตรวจจับใบหน้า:', error);
      return null;
    }
  }


  getLastDetection(): FaceTrackingData | null {
    return this.lastDetection;
  }

  private analyzeLandmarks(landmarks: NormalizedLandmark[], timestamp: number): FaceTrackingData {
    // คำนวณการหันหน้า (Face Orientation)
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

    // Debug: แสดง coordinates ของจุดสำคัญ
    console.log('🎯 Landmark Coordinates:', {
      noseTip: { x: noseTip.x, y: noseTip.y },
      leftEyeInner: { x: leftEyeInner.x, y: leftEyeInner.y },
      rightEyeInner: { x: rightEyeInner.x, y: rightEyeInner.y },
      leftEyeOuter: { x: leftEyeOuter.x, y: leftEyeOuter.y },
      rightEyeOuter: { x: rightEyeOuter.x, y: rightEyeOuter.y },
      chin: { x: chin.x, y: chin.y },
      forehead: { x: forehead.x, y: forehead.y }
    });

    // คำนวณ yaw (หันซ้าย-ขวา) ด้วยอัตราส่วนความยาวตา - **แก้ไขทิศทาง**
    const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
    const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);
    
    // **แก้ไขทิศทาง**: เมื่อหันซ้าย ratio < 1, เมื่อหันขวา ratio > 1
    // MediaPipe พิกัด: ตาซ้าย = มุมมองจากกล้อง (ด้านขวาของหน้าจอ), ตาขวา = ด้านซ้ายของหน้าจอ
    const eyeRatio = leftEyeWidth / rightEyeWidth; // คืนกลับเป็นเดิม
    let yaw = (1 - eyeRatio) * 100; // สลับเครื่องหมาย: (1 - ratio) แทน (ratio - 1)
    yaw = Math.max(-60, Math.min(60, yaw)); // จำกัด range
    
    // คำนวณ pitch (หันบน-ล่าง) ด้วยวิธีที่แม่นยำขึ้น
    const totalFaceHeight = Math.abs(chin.y - forehead.y);
    
    // ใช้ตำแหน่งสัมพัทธ์ของจมูกในใบหน้า (0-1 scale)
    const noseRelativePosition = (noseTip.y - forehead.y) / totalFaceHeight;
    
    // **แก้ไขการคำนวณ Pitch**: ใช้ baseline ที่แม่นยำขึ้น + Auto-calibration
    // Auto-calibration: เก็บ samples แรก 30 ครั้ง (3 วินาที) เป็น baseline
    if (!this.calibrationComplete && this.calibrationSamples.length < 30) {
      this.calibrationSamples.push(noseRelativePosition);
      console.log(`📊 Calibrating... Sample ${this.calibrationSamples.length}/30: ${noseRelativePosition.toFixed(4)}`);
      
      if (this.calibrationSamples.length === 30) {
        // คำนวณค่าเฉลี่ยเป็น neutral position ของผู้ใช้คนนี้
        const sum = this.calibrationSamples.reduce((a, b) => a + b, 0);
        this.calibratedNeutralPosition = sum / this.calibrationSamples.length;
        this.calibrationComplete = true;
        console.log(`✅ Auto-calibration complete! Personal neutral position: ${this.calibratedNeutralPosition.toFixed(4)}`);
      }
    }
    
    // ใช้ calibrated baseline หรือ default value
    const neutralNosePosition = this.calibratedNeutralPosition;
    
    // คำนวณส่วนเบี่ยงเบนจาก neutral position
    const pitchDeviation = noseRelativePosition - neutralNosePosition;
    
    // แปลงเป็นองศาด้วย sensitivity ที่ลดลง
    let pitch = pitchDeviation * 80; // ลด sensitivity จาก 60 เป็น 80 (ให้ค่าน้อยลง)
    pitch = Math.max(-25, Math.min(25, pitch)); // จำกัด range ±25°

    // **ปรับ threshold ใหม่** - คืนค่าเป็น 15° เหมือนเดิม
    const YAW_THRESHOLD = 25;      // องศา (ยาว/ซ้าย-ขวา)
    const PITCH_THRESHOLD = 12;    // องศา (บน-ล่าง)
    
    // ตรวจสอบการหันออกจากจอ
    const isLookingAway = Math.abs(yaw) > YAW_THRESHOLD || Math.abs(pitch) > PITCH_THRESHOLD;

    // Debug logging ที่ละเอียดยิ่งขึ้น
    console.log(`🎯 Face Orientation Debug:`);
    console.log(`   Calibration: ${this.calibrationComplete ? 'Complete' : `In progress (${this.calibrationSamples.length}/30)`}`);
    console.log(`   Eye Widths - Left: ${leftEyeWidth.toFixed(4)}, Right: ${rightEyeWidth.toFixed(4)}`);
    console.log(`   Eye Ratio: ${eyeRatio.toFixed(4)}`);
    console.log(`   Face Height: ${totalFaceHeight.toFixed(4)}`);
    console.log(`   Nose Position: ${noseRelativePosition.toFixed(4)} (neutral=${neutralNosePosition.toFixed(4)})`);
    console.log(`   Pitch Deviation: ${pitchDeviation.toFixed(4)} -> ${pitch.toFixed(1)}° (should be ~0° when looking straight)`);
    console.log(`   Final - Yaw: ${yaw.toFixed(1)}°, Pitch: ${pitch.toFixed(1)}°, Away: ${isLookingAway}`);

    return { yaw, pitch, isLookingAway };
  }

  destroy(): void {
    if (this.faceLandmarker) {
      this.faceLandmarker = null;
    }
    this.isInitialized = false;
    this.lastDetection = null;
    
    // Reset calibration
    this.calibrationSamples = [];
    this.calibrationComplete = false;
    this.calibratedNeutralPosition = 0.58;
    
    console.log('🧹 MediaPipe detector ถูกล้างแล้ว (รวมถึง calibration data)');
  }
}