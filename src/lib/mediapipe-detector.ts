// MediaPipe face detection and tracking utilities
import { FaceLandmarker, FilesetResolver, NormalizedLandmark } from '@mediapipe/tasks-vision';

// ซ่อน TensorFlow Lite INFO messages
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;

console.log = (...args) => {
  const message = args.join(' ');
  if (message.includes('Created TensorFlow Lite XNNPACK delegate for CPU') || 
      message.includes('TensorFlow Lite')) {
    return; // ไม่แสดง TensorFlow Lite messages
  }
  originalConsoleLog.apply(console, args);
};

console.info = (...args) => {
  const message = args.join(' ');
  if (message.includes('Created TensorFlow Lite XNNPACK delegate for CPU') || 
      message.includes('TensorFlow Lite')) {
    return; // ไม่แสดง TensorFlow Lite INFO messages
  }
  originalConsoleInfo.apply(console, args);
};

export interface FaceTrackingData {
  isDetected: boolean;
  orientation: {
    yaw: number;
    pitch: number;
    isLookingAway: boolean;
    direction?: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'CENTER';
  };
  confidence: number;
  realTime: string; // เวลาจริงในรูปแบบ HH:mm:ss
  landmarks?: NormalizedLandmark[];
  multipleFaces?: {
    count: number;
    isSecurityRisk: boolean;
    warningMessage?: string;
  };
  distance?: {
    estimatedCm: number;
    isTooFar: boolean;
    faceWidth: number;
    faceHeight: number;
  };
}

// Interface สำหรับเก็บ Orientation Event ที่ละเอียด
export interface OrientationEvent {
  startTime: string; // เวลาจริงเริ่มต้น (HH:mm:ss)
  endTime?: string;  // เวลาจริงสิ้นสุด (HH:mm:ss)
  direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'CENTER';
  duration?: number; // ระยะเวลาเป็นวินาที
  maxYaw?: number;   // มุม yaw สูงสุดในช่วงนั้น
  maxPitch?: number; // มุม pitch สูงสุดในช่วงนั้น
  isActive: boolean; // กำลังเกิดขึ้นอยู่หรือไม่
}

export interface FaceDetectionLossEvent {
  startTime: string; // เวลาจริงเริ่มต้น (HH:mm:ss)
  endTime?: string;  // เวลาจริงสิ้นสุด (HH:mm:ss)
  duration?: number; // ระยะเวลาเป็นวินาที
  isActive: boolean; // กำลังเกิดขึ้นอยู่หรือไม่
}

// Interface สำหรับสถิติการหันหน้า
export interface OrientationStats {
  totalEvents: number;
  leftTurns: { count: number; totalDuration: number };
  rightTurns: { count: number; totalDuration: number };
  lookingUp: { count: number; totalDuration: number };
  lookingDown: { count: number; totalDuration: number };
  centerTime: number; // เวลารวมที่มองตรง
  sessionStartTime: string;
  lastEventTime?: string;
}

export class MediaPipeDetector {
  private faceLandmarker: FaceLandmarker | null = null;
  private isInitialized: boolean = false;
  private lastDetection: FaceTrackingData | null = null;
  
  // Auto-calibration system สำหรับ Pitch baseline
  private calibrationSamples: number[] = [];
  private calibrationComplete: boolean = false;
  private calibratedNeutralPosition: number = 0.58; // default value
  
  // Orientation tracking system
  private currentOrientationEvent: OrientationEvent | null = null;
  private orientationHistory: OrientationEvent[] = [];
  private sessionStartTime: string = '';
  private isRecording: boolean = false;
  
  // Face detection loss tracking
  private currentFaceDetectionLossEvent: FaceDetectionLossEvent | null = null;
  private faceDetectionLossHistory: FaceDetectionLossEvent[] = [];
  private lastFaceDetectedTime: number = Date.now();
  private consecutiveLossFrames: number = 0;
  private readonly LOSS_THRESHOLD_FRAMES = 5; // ถือว่า loss เมื่อไม่พบ 5 frames ติด
  
  // Thresholds for direction detection
  private readonly YAW_THRESHOLD = 25;
  private readonly PITCH_THRESHOLD = 12;

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

  async detectFromVideo(video: HTMLVideoElement): Promise<FaceTrackingData | null> {
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

      const results = this.faceLandmarker.detectForVideo(video, performance.now());
      
      if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
        console.log('❌ ไม่พบใบหน้าใน MediaPipe results');
        
        // บันทึก face detection loss
        this.handleFaceDetectionLoss();
        
        const noFaceData: FaceTrackingData = {
          isDetected: false,
          orientation: { yaw: 0, pitch: 0, isLookingAway: false },
          confidence: 0,
          realTime: new Date().toLocaleTimeString('th-TH', { hour12: false }),
          multipleFaces: {
            count: 0,
            isSecurityRisk: false
          }, 
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
      
      // บันทึกว่าพบใบหน้าแล้ว (reset loss tracking)
      this.handleFaceDetectionRecovered();
      
      const trackingData = this.analyzeLandmarks(landmarks);
      
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

  private analyzeLandmarks(landmarks: NormalizedLandmark[]): FaceTrackingData {
    // คำนวณการหันหน้า (Face Orientation)
    const orientation = this.calculateFaceOrientation(landmarks);
    
    // คำนวณระยะห่างใบหน้าจากจอ
    const distance = this.calculateFaceDistance(landmarks);
    
    // สร้างเวลาจริง
    const realTime = new Date().toLocaleTimeString('th-TH', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit', 
      second: '2-digit'
    });
    
    return {
      isDetected: true,
      orientation,
      confidence: 0.95, // MediaPipe มักให้ค่า confidence สูง
      realTime,
      landmarks, // ส่ง landmarks ทั้ง 468 จุดไปให้ component
      distance
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

    // กำหนดทิศทางการหันหน้า
    const direction = this.getOrientationDirection(yaw, pitch);
    
    // บันทึก orientation event หากกำลัง recording
    if (this.isRecording) {
      this.recordOrientationEvent(direction, yaw, pitch);
    }

    return { yaw, pitch, isLookingAway, direction };
  }

  private calculateFaceDistance(landmarks: NormalizedLandmark[]) {
    // ใช้จุดสำคัญสำหรับคำนวณขนาดใบหน้า
    const leftEar = landmarks[234];      // หูซ้าย
    const rightEar = landmarks[454];     // หูขวา
    const forehead = landmarks[10];      // หน้าผาก
    const chin = landmarks[152];         // คาง
    
    // คำนวณความกว้างและความสูงใบหน้า (normalized coordinates 0-1)
    const faceWidth = Math.abs(leftEar.x - rightEar.x);
    const faceHeight = Math.abs(forehead.y - chin.y);
    
    // Constants สำหรับการคำนวณระยะห่าง
    // ความกว้างใบหน้าเฉลี่ย = 14-16 cm
    // ความสูงใบหน้าเฉลี่ย = 18-20 cm
    const AVERAGE_FACE_WIDTH_CM = 15;
    const AVERAGE_FACE_HEIGHT_CM = 19;
    
    // คำนวณระยะห่างจากขนาดใบหน้าที่ตรวจพบ
    // สูตร: distance = (actual_size_cm * focal_length) / pixel_size
    // ใช้ค่าประมาณ focal length = 500-600 pixels สำหรับ webcam ทั่วไป
    const FOCAL_LENGTH_ESTIMATE = 550;
    
    // คำนวณระยะห่างจากความกว้างและความสูง แล้วเอาค่าเฉลี่ย
    const distanceFromWidth = (AVERAGE_FACE_WIDTH_CM * FOCAL_LENGTH_ESTIMATE) / (faceWidth * 1000);
    const distanceFromHeight = (AVERAGE_FACE_HEIGHT_CM * FOCAL_LENGTH_ESTIMATE) / (faceHeight * 1000);
    
    // ใช้ค่าเฉลี่ยของทั้งสองวิธี
    const estimatedCm = (distanceFromWidth + distanceFromHeight) / 2;
    
    // ตรวจสอบว่าระยะห่างเกิน 80cm หรือไม่
    const DISTANCE_THRESHOLD_CM = 80;
    const isTooFar = estimatedCm > DISTANCE_THRESHOLD_CM;
    
    // Debug logging
    console.log(`📏 Distance Calculation:`, {
      faceWidth: faceWidth.toFixed(4),
      faceHeight: faceHeight.toFixed(4),
      distanceFromWidth: distanceFromWidth.toFixed(1),
      distanceFromHeight: distanceFromHeight.toFixed(1),
      estimatedCm: estimatedCm.toFixed(1),
      isTooFar,
      threshold: DISTANCE_THRESHOLD_CM
    });
    
    return {
      estimatedCm: Math.round(estimatedCm),
      isTooFar,
      faceWidth,
      faceHeight
    };
  }

  // === Orientation Tracking Methods ===
  
  private getOrientationDirection(yaw: number, pitch: number): 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'CENTER' {
    // ตรวจสอบ yaw ก่อน (หันซ้าย-ขวา)
    if (Math.abs(yaw) > this.YAW_THRESHOLD) {
      return yaw > 0 ? 'RIGHT' : 'LEFT';
    }
    
    // ตรวจสอบ pitch (ก้มหน้า-เงยหน้า)
    if (Math.abs(pitch) > this.PITCH_THRESHOLD) {
      return pitch > 0 ? 'DOWN' : 'UP';
    }
    
    return 'CENTER';
  }
  
  private recordOrientationEvent(direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'CENTER', yaw: number, pitch: number): void {
    const currentTime = new Date().toLocaleTimeString('th-TH', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit', 
      second: '2-digit'
    });
    
    // หากทิศทางเปลี่ยน หรือไม่มี event ปัจจุบัน
    if (!this.currentOrientationEvent || this.currentOrientationEvent.direction !== direction) {
      
      // จบ event เก่า (ถ้ามี)
      if (this.currentOrientationEvent && this.currentOrientationEvent.isActive) {
        this.finishCurrentEvent(currentTime);
      }
      
      // เริ่ม event ใหม่
      this.currentOrientationEvent = {
        startTime: currentTime,
        direction,
        maxYaw: Math.abs(yaw),
        maxPitch: Math.abs(pitch),
        isActive: true
      };
      
      console.log(`🎯 เริ่มต้น ${direction} event ที่เวลา ${currentTime}`);
    } else {
      // อัปเดต max values ของ event ปัจจุบัน
      if (this.currentOrientationEvent) {
        this.currentOrientationEvent.maxYaw = Math.max(this.currentOrientationEvent.maxYaw || 0, Math.abs(yaw));
        this.currentOrientationEvent.maxPitch = Math.max(this.currentOrientationEvent.maxPitch || 0, Math.abs(pitch));
      }
    }
  }
  
  private finishCurrentEvent(endTime: string): void {
    if (!this.currentOrientationEvent || !this.currentOrientationEvent.isActive) return;
    
    // คำนวณระยะเวลา
    const startTime = this.parseTimeString(this.currentOrientationEvent.startTime);
    const endTimeMs = this.parseTimeString(endTime);
    const duration = Math.round((endTimeMs - startTime) / 1000); // แปลงเป็นวินาที
    
    // บันทึก event ที่สมบูรณ์
    const completedEvent: OrientationEvent = {
      ...this.currentOrientationEvent,
      endTime,
      duration,
      isActive: false
    };
    
    this.orientationHistory.push(completedEvent);
    
    console.log(`✅ จบ ${completedEvent.direction} event: ${completedEvent.duration} วินาที (${completedEvent.startTime} - ${completedEvent.endTime})`);
    console.log(`   Max Yaw: ${completedEvent.maxYaw?.toFixed(1)}°, Max Pitch: ${completedEvent.maxPitch?.toFixed(1)}°`);
  }
  
  private parseTimeString(timeStr: string): number {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600000 + minutes * 60000 + seconds * 1000; // milliseconds
  }
  
  // === Session Management ===
  
  startRecording(): void {
    this.isRecording = true;
    this.sessionStartTime = new Date().toLocaleTimeString('th-TH', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit', 
      second: '2-digit'
    });
    this.orientationHistory = [];
    this.currentOrientationEvent = null;
    
    // Reset face detection loss statistics เมื่อเริ่ม session ใหม่
    this.resetFaceDetectionLossStats();
    
    console.log(`🎬 เริ่มบันทึก orientation tracking ที่เวลา ${this.sessionStartTime}`);
    console.log(`🔄 Reset face detection loss statistics สำหรับ session ใหม่`);
  }
  
  stopRecording(): OrientationEvent[] {
    this.isRecording = false;
    
    // จบ event ปัจจุบัน (ถ้ามี)
    if (this.currentOrientationEvent && this.currentOrientationEvent.isActive) {
      const currentTime = new Date().toLocaleTimeString('th-TH', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit', 
        second: '2-digit'
      });
      this.finishCurrentEvent(currentTime);
    }
    
    console.log(`🛑 หยุดบันทึก orientation tracking`);
    console.log(`📊 รวม ${this.orientationHistory.length} events ที่บันทึกไว้`);
    
    return [...this.orientationHistory]; // return copy
  }
  
  getOrientationStats(): OrientationStats {
    const stats: OrientationStats = {
      totalEvents: this.orientationHistory.length,
      leftTurns: { count: 0, totalDuration: 0 },
      rightTurns: { count: 0, totalDuration: 0 },
      lookingUp: { count: 0, totalDuration: 0 },
      lookingDown: { count: 0, totalDuration: 0 },
      centerTime: 0,
      sessionStartTime: this.sessionStartTime,
      lastEventTime: this.orientationHistory[this.orientationHistory.length - 1]?.endTime
    };
    
    this.orientationHistory.forEach(event => {
      const duration = event.duration || 0;
      
      switch (event.direction) {
        case 'LEFT':
          stats.leftTurns.count++;
          stats.leftTurns.totalDuration += duration;
          break;
        case 'RIGHT':
          stats.rightTurns.count++;
          stats.rightTurns.totalDuration += duration;
          break;
        case 'UP':
          stats.lookingUp.count++;
          stats.lookingUp.totalDuration += duration;
          break;
        case 'DOWN':
          stats.lookingDown.count++;
          stats.lookingDown.totalDuration += duration;
          break;
        case 'CENTER':
          stats.centerTime += duration;
          break;
      }
    });
    
    return stats;
  }
  
  getDetailedOrientationHistory(): OrientationEvent[] {
    return [...this.orientationHistory];
  }
  
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  // === Face Detection Loss Management ===
  
  private handleFaceDetectionLoss(): void {
    this.consecutiveLossFrames++;
    
    // ถ้าเป็นครั้งแรกที่ loss (consecutive frames >= threshold)
    if (this.consecutiveLossFrames === this.LOSS_THRESHOLD_FRAMES) {
      const now = new Date();
      const startTime = now.toLocaleTimeString('th-TH', { hour12: false });
      
      this.currentFaceDetectionLossEvent = {
        startTime,
        isActive: true
      };
      
      console.log(`🚨 Face Detection Loss Event - เริ่มต้น loss event`);
      console.log(`   Consecutive loss frames: ${this.consecutiveLossFrames}`);
      console.log(`   เวลาเริ่ม loss: ${startTime}`);
    }
    
    // หากยังคง loss ต่อเนื่อง
    if (this.consecutiveLossFrames > this.LOSS_THRESHOLD_FRAMES) {
      console.log(`⏳ Face Detection Loss ยังคงดำเนินต่อ... frame ${this.consecutiveLossFrames}`);
    }
  }
  
  private handleFaceDetectionRecovered(): void {
    // หากกำลัง loss อยู่และเพิ่งพบใบหน้าอีกครั้ง
    if (this.consecutiveLossFrames >= this.LOSS_THRESHOLD_FRAMES && this.currentFaceDetectionLossEvent) {
      const now = new Date();
      const endTime = now.toLocaleTimeString('th-TH', { hour12: false });
      
      // คำนวณระยะเวลา
      const startTimeParts = this.currentFaceDetectionLossEvent.startTime.split(':');
      const endTimeParts = endTime.split(':');
      
      const startTimeMs = (parseInt(startTimeParts[0]) * 3600 + parseInt(startTimeParts[1]) * 60 + parseInt(startTimeParts[2])) * 1000;
      const endTimeMs = (parseInt(endTimeParts[0]) * 3600 + parseInt(endTimeParts[1]) * 60 + parseInt(endTimeParts[2])) * 1000;
      
      const duration = Math.max(1, Math.round((endTimeMs - startTimeMs) / 1000));
      
      // อัพเดท event และเพิ่มลง history
      this.currentFaceDetectionLossEvent.endTime = endTime;
      this.currentFaceDetectionLossEvent.duration = duration;
      this.currentFaceDetectionLossEvent.isActive = false;
      
      this.faceDetectionLossHistory.push({ ...this.currentFaceDetectionLossEvent });
      
      console.log(`✅ Face Detection Recovered! Loss Event สิ้นสุด`);
      console.log(`   ระยะเวลา loss: ${duration} วินาที`);
      console.log(`   เวลา: ${this.currentFaceDetectionLossEvent.startTime} → ${endTime}`);
      console.log(`   รวม loss events: ${this.faceDetectionLossHistory.length} ครั้ง`);
      
      // Reset current event
      this.currentFaceDetectionLossEvent = null;
    }
    
    // Reset consecutive loss frames counter
    this.consecutiveLossFrames = 0;
    this.lastFaceDetectedTime = Date.now();
  }
  
  getFaceDetectionLossStats(): { lossCount: number; totalLossTime: number } {
    const totalLossTime = this.faceDetectionLossHistory.reduce((total, event) => total + (event.duration || 0), 0);
    return {
      lossCount: this.faceDetectionLossHistory.length,
      totalLossTime
    };
  }
  
  getFaceDetectionLossEvents(): FaceDetectionLossEvent[] {
    return [...this.faceDetectionLossHistory];
  }
  
  resetFaceDetectionLossStats(): void {
    this.faceDetectionLossHistory = [];
    this.currentFaceDetectionLossEvent = null;
    this.consecutiveLossFrames = 0;
    this.lastFaceDetectedTime = Date.now();
    
    console.log('🔄 Reset face detection loss statistics');
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