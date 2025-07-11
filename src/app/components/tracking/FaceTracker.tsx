'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MediaPipeDetector, FaceTrackingData } from '@/lib/mediapipe-detector'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'

interface FaceTrackerProps {
  onTrackingStop: () => void
  sessionName?: string
}

export function FaceTracker({ onTrackingStop, sessionName = 'การสอบ' }: FaceTrackerProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentData, setCurrentData] = useState<FaceTrackingData | null>(null)
  const [stats, setStats] = useState({
    totalDetections: 0,
    faceAwayCount: 0,
    duration: 0
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectorRef = useRef<MediaPipeDetector | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // เริ่มต้นกล้องและ MediaPipe
  const initializeCamera = useCallback(async () => {
    try {
      console.log('🎥 เริ่มต้นกล้อง...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          console.log('✅ กล้องพร้อมใช้งาน')
        }
      }

      // เริ่มต้น MediaPipe detector
      if (!detectorRef.current) {
        console.log('🔧 สร้าง MediaPipe detector ใหม่...')
        detectorRef.current = new MediaPipeDetector()
        
        console.log('⏳ กำลังโหลด MediaPipe (อาจใช้เวลา 10-30 วินาที)...')
        const initialized = await detectorRef.current.initialize()
        
        if (!initialized) {
          console.error('💥 MediaPipe ไม่สามารถโหลดได้')
          alert('MediaPipe ไม่สามารถโหลดได้\nกรุณาตรวจสอบ internet connection\nหรือลอง refresh หน้าเว็บ')
          throw new Error('MediaPipe initialization failed')
        }
        
        console.log('🎉 MediaPipe โหลดสำเร็จแล้ว!')
      }

      return true
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการเริ่มต้นกล้อง:', error)
      alert('ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการอนุญาต')
      return false
    }
  }, [])

  // หยุดกล้อง
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (detectorRef.current) {
      detectorRef.current.destroy()
      detectorRef.current = null
    }

    console.log('🎥 กล้องปิดแล้ว')
  }, [])

  // การติดตามแบบ real-time
  const performDetection = useCallback(async () => {
    console.log('🔄 performDetection ถูกเรียก...', { 
      hasDetector: !!detectorRef.current, 
      hasVideo: !!videoRef.current, 
      isActive 
    });

    if (!detectorRef.current || !videoRef.current) {
      console.warn('⚠️ ข้อมูลไม่พร้อมสำหรับ detection:', {
        detector: !!detectorRef.current,
        video: !!videoRef.current, 
        active: isActive
      });
      return;
    }

    try {
      const timestamp = performance.now()
      console.log('🎯 เรียก detectFromVideo...', timestamp);
      
      const trackingData = await detectorRef.current.detectFromVideo(videoRef.current, timestamp)
      console.log('📋 ได้ tracking data:', trackingData);
      
      if (trackingData) {
        setCurrentData(trackingData)
        
        // อัปเดตสถิติ (เฉพาะ face orientation)
        setStats(prev => {
          const newStats = {
            ...prev,
            totalDetections: prev.totalDetections + 1,
            duration: Math.floor((timestamp - startTimeRef.current) / 1000)
          }

          // นับเหตุการณ์การหันหน้าออกจากจอ
          if (trackingData.orientation.isLookingAway) {
            newStats.faceAwayCount++
            console.log('🚨 ตรวจพบการหันหน้าออกจากจอ!', newStats.faceAwayCount);
          }

          console.log('📊 อัปเดตสถิติ:', newStats);
          return newStats
        })

        // วาดผลลัพธ์บน canvas
        drawDetectionOverlay(trackingData)
      } else {
        console.warn('⚠️ ไม่ได้รับ tracking data');
      }
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการตรวจจับ:', error)
    }
  }, [])

  // วาดการแสดงผลบน canvas
  const drawDetectionOverlay = useCallback((data: FaceTrackingData) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ล้าง canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!data.isDetected) {
      // แสดงข้อความเมื่อไม่พบใบหน้า
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'
      ctx.font = '24px Arial'
      ctx.fillText('ไม่พบใบหน้า', 50, 50)
      return
    }

    // วาด Sci-Fi Face Mesh ด้วย landmarks ทั้ง 468 จุด
    if (data.landmarks && data.landmarks.length > 0) {
      console.log('🎨 วาด Face Mesh จำนวน landmarks:', data.landmarks.length);
      drawSciFiFaceMesh(ctx, data.landmarks, canvas.width, canvas.height, data.orientation.isLookingAway)
    } else {
      console.warn('⚠️ ไม่มี landmarks สำหรับวาด mesh');
    }

    // แสดงข้อมูลสถานะ
    const statusColor = data.orientation.isLookingAway ? '#FF4444' : '#00FF88'
    ctx.fillStyle = statusColor
    ctx.font = '16px "Courier New", monospace'
    ctx.shadowColor = statusColor
    ctx.shadowBlur = 10
    
    const statusTexts = [
      `FACE_DETECTION: ${data.isDetected ? 'ACTIVE' : 'INACTIVE'}`,
      `ORIENTATION: ${data.orientation.isLookingAway ? 'LOOKING_AWAY' : 'FOCUSED'}`,
      `YAW: ${data.orientation.yaw.toFixed(1)}°`,
      `PITCH: ${data.orientation.pitch.toFixed(1)}°`,
      `LANDMARKS: ${data.landmarks?.length || 0} POINTS`
    ]

    statusTexts.forEach((text, index) => {
      ctx.fillText(text, 20, canvas.height - 120 + (index * 22))
    })
    
    ctx.shadowBlur = 0
  }, [])

  // วาด Sci-Fi Face Mesh แบบเส้นโครงสีเขียว
  const drawSciFiFaceMesh = useCallback((
    ctx: CanvasRenderingContext2D, 
    landmarks: any[], 
    canvasWidth: number, 
    canvasHeight: number,
    isLookingAway: boolean
  ) => {
    console.log('🎨 เริ่มวาด Face Mesh...', { landmarks: landmarks.length, width: canvasWidth, height: canvasHeight });
    
    const primaryColor = isLookingAway ? '#FF4444' : '#00FF88'
    const secondaryColor = isLookingAway ? '#FF8888' : '#44FFAA'
    const glowColor = isLookingAway ? 'rgba(255, 68, 68, 0.3)' : 'rgba(0, 255, 136, 0.3)'

    try {
      // วาดจุด landmarks ทั้ง 468 จุด
      landmarks.forEach((landmark, index) => {
        if (!landmark || typeof landmark.x !== 'number' || typeof landmark.y !== 'number') {
          console.warn('⚠️ Invalid landmark at index', index, landmark);
          return;
        }

        const x = landmark.x * canvasWidth
        const y = landmark.y * canvasHeight

        // วาดจุดเฉพาะที่สำคัญเพื่อประสิทธิภาพ
        if (index % 3 === 0) { // วาดทุก 3 จุด
          const pointSize = 1.5

          // วาดจุดหลัก
          ctx.save()
          ctx.beginPath()
          ctx.arc(x, y, pointSize, 0, 2 * Math.PI)
          ctx.fillStyle = primaryColor
          ctx.fill()
          ctx.restore()
        }
      })

      // วาดเส้นเชื่อมโครงหน้าที่สำคัญ
      drawFaceContours(ctx, landmarks, canvasWidth, canvasHeight, primaryColor)
      drawEyeContours(ctx, landmarks, canvasWidth, canvasHeight, primaryColor)
      drawMouthContours(ctx, landmarks, canvasWidth, canvasHeight, primaryColor)
      drawNoseContours(ctx, landmarks, canvasWidth, canvasHeight, primaryColor)
      
      console.log('✅ วาด Face Mesh เสร็จสิ้น');
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการวาด Face Mesh:', error);
    }
  }, [])

  // ตรวจสอบว่าเป็น landmark สำคัญหรือไม่
  const isKeyLandmark = useCallback((index: number): boolean => {
    // จุดสำคัญของใบหน้า (ตา, จมูก, ปาก, โครงหน้า)
    const keyPoints = [
      // โครงหน้า
      10, 151, 9, 8, 168, 6, 148, 176, 149, 150, 136, 172, 
      // ตาซ้าย
      33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
      // ตาขวา  
      362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398,
      // จมูก
      19, 20, 98, 97, 2, 326, 327, 294, 278, 344, 1, 5,
      // ปาก
      61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318
    ]
    return keyPoints.includes(index)
  }, [])

  // วาดเส้นโครงหน้า
  const drawFaceContours = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number,
    color: string
  ) => {
    // จุดโครงหน้า (Face Oval)
    const faceOval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10]
    
    drawConnectedLines(ctx, landmarks, faceOval, width, height, color, 1)
  }, [])

  // วาดเส้นตา
  const drawEyeContours = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number,
    color: string
  ) => {
    // ตาซ้าย
    const leftEye = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33]
    drawConnectedLines(ctx, landmarks, leftEye, width, height, color, 1.5)
    
    // ตาขวา
    const rightEye = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362]
    drawConnectedLines(ctx, landmarks, rightEye, width, height, color, 1.5)
  }, [])

  // วาดเส้นปาก
  const drawMouthContours = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number,
    color: string
  ) => {
    // ขอบปากนอก
    const outerLips = [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 61]
    drawConnectedLines(ctx, landmarks, outerLips, width, height, color, 1.5)
    
    // ขอบปากใน
    const innerLips = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 78]
    drawConnectedLines(ctx, landmarks, innerLips, width, height, color, 1)
  }, [])

  // วาดเส้นจมูก
  const drawNoseContours = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number,
    color: string
  ) => {
    // ดั่งจมูก
    const noseBridge = [6, 168, 8, 9, 10, 151]
    drawConnectedLines(ctx, landmarks, noseBridge, width, height, color, 1.5)
    
    // ปีกจมูก
    const noseWings = [98, 97, 2, 326, 327, 294, 278, 344, 358, 279, 420, 399, 437, 355, 371, 329, 348, 36, 131, 134, 102, 48, 115, 131]
    drawConnectedLines(ctx, landmarks, noseWings, width, height, color, 1)
  }, [])

  // วาดเส้นเชื่อมจุด
  const drawConnectedLines = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    indices: number[],
    width: number,
    height: number,
    color: string,
    lineWidth: number
  ) => {
    if (indices.length < 2) return

    try {
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.shadowColor = color
      ctx.shadowBlur = 3
      ctx.globalCompositeOperation = 'screen'

      ctx.beginPath()
      
      // ตรวจสอบ landmark แรก
      if (!landmarks[indices[0]]) {
        console.warn('⚠️ Missing landmark at index:', indices[0]);
        ctx.restore();
        return;
      }
      
      let startX = landmarks[indices[0]].x * width
      let startY = landmarks[indices[0]].y * height
      ctx.moveTo(startX, startY)

      for (let i = 1; i < indices.length; i++) {
        if (!landmarks[indices[i]]) {
          console.warn('⚠️ Missing landmark at index:', indices[i]);
          continue;
        }
        
        const x = landmarks[indices[i]].x * width
        const y = landmarks[indices[i]].y * height
        ctx.lineTo(x, y)
      }

      ctx.stroke()
      ctx.restore()
    } catch (error) {
      console.error('❌ Error drawing connected lines:', error);
      ctx.restore();
    }
  }, [])

  // เริ่มการติดตาม
  const startTracking = useCallback(async () => {
    console.log('🚀 เริ่มต้น startTracking...');
    
    const initialized = await initializeCamera()
    if (!initialized) {
      console.error('❌ ไม่สามารถเริ่มต้นกล้องได้');
      return;
    }

    console.log('✅ กล้องเริ่มต้นสำเร็จ');
    setIsActive(true)
    startTimeRef.current = performance.now()
    
    // เริ่ม detection loop
    console.log('⏰ ตั้ง interval สำหรับ detection...');
    intervalRef.current = setInterval(() => {
      console.log('⏱️ Interval tick - เรียก performDetection');
      performDetection();
    }, 100) // ทุก 100ms
    
    console.log('🎯 เริ่มการติดตาม - interval ID:', intervalRef.current)
    
  }, [initializeCamera, performDetection])

  // หยุดการติดตาม
  const stopTracking = useCallback(() => {
    setIsActive(false)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    stopCamera()
    onTrackingStop()
    
    console.log('⏹️ หยุดการติดตาม', stats)
  }, [stopCamera, onTrackingStop, stats])

  // Cleanup เมื่อ component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      stopCamera()
    }
  }, [stopCamera])

  // อัปเดตขนาด canvas เมื่อ video โหลดเสร็จ
  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (video && canvas) {
      const updateCanvasSize = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }
      
      video.addEventListener('loadedmetadata', updateCanvasSize)
      return () => video.removeEventListener('loadedmetadata', updateCanvasSize)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Auto-start tracking when component mounts
  useEffect(() => {
    console.log('🔄 useEffect auto-start ทำงาน...', { isActive });
    
    if (!isActive) {
      console.log('⚡ เริ่มการ tracking อัตโนมัติ...');
      startTracking()
    }
  }, []) // Run once on mount only (remove dependencies to prevent loops)

  return (
    <Card className="w-full h-full">
      <div className="p-6">
        

        {/* Video and Canvas Container */}
        <div className="relative mb-6">
          <video
            ref={videoRef}
            className="w-full h-auto rounded-lg bg-black"
            autoPlay
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          />
          
          
        </div>

        {/* Live Stats - เฉพาะ Face Orientation */}
        {isActive && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalDetections}</div>
              <div className="text-sm text-blue-500">ครั้งที่ตรวจจับ</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{stats.faceAwayCount}</div>
              <div className="text-sm text-red-500">หันหน้าออกจากจอ</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.totalDetections > 0 ? Math.round(((stats.totalDetections - stats.faceAwayCount) / stats.totalDetections) * 100) : 0}%
              </div>
              <div className="text-sm text-green-500">อัตราการมองตรง</div>
            </div>
          </div>
        )}

        {/* Current Detection Status - เฉพาะ Face Orientation */}
        {isActive && currentData && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">สถานะปัจจุบัน:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className={`p-2 rounded ${currentData.isDetected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                Face: {currentData.isDetected ? 'ตรวจพบ' : 'ไม่พบ'}
              </div>
              <div className={`p-2 rounded ${currentData.orientation.isLookingAway ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                Head: {currentData.orientation.isLookingAway ? 'หันออก' : 'มองตรง'}
              </div>
              <div className="p-2 rounded bg-blue-100 text-blue-800">
                Yaw: {currentData.orientation.yaw.toFixed(1)}°
              </div>
              <div className="p-2 rounded bg-blue-100 text-blue-800">
                Pitch: {currentData.orientation.pitch.toFixed(1)}°
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        {isActive && (
          <div className="flex justify-center mt-6">
            <Button
              onClick={stopTracking}
              variant="secondary"
              className="px-8 py-3"
            >
              ⏹️ หยุดติดตาม
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}