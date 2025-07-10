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
        detectorRef.current = new MediaPipeDetector()
        const initialized = await detectorRef.current.initialize()
        
        if (!initialized) {
          throw new Error('MediaPipe initialization failed')
        }
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
    if (!detectorRef.current || !videoRef.current || !isActive) return

    try {
      const timestamp = performance.now()
      const trackingData = await detectorRef.current.detectFromVideo(videoRef.current, timestamp)
      
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
          }

          return newStats
        })

        // วาดผลลัพธ์บน canvas
        drawDetectionOverlay(trackingData)
      }
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการตรวจจับ:', error)
    }
  }, [isActive])

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

    // กำหนดสีตามสถานะ (เฉพาะ face orientation)
    let borderColor = '#10B981' // เขียว (ปกติ)
    
    if (data.orientation.isLookingAway) {
      borderColor = '#EF4444' // แดง (หันหน้าออกจากจอ)
    }

    // วาดกรอบรอบใบหน้า
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 4
    const frameSize = Math.min(canvas.width, canvas.height) * 0.6
    const x = (canvas.width - frameSize) / 2
    const y = (canvas.height - frameSize) / 2
    
    ctx.strokeRect(x, y, frameSize, frameSize)

    // แสดงข้อมูลสถานะ (เฉพาะ face orientation)
    ctx.fillStyle = borderColor
    ctx.font = '16px Arial'
    
    const statusTexts = [
      `Face: ${data.isDetected ? 'ตรวจพบ' : 'ไม่พบ'}`,
      `Orientation: ${data.orientation.isLookingAway ? 'หันออกจากจอ' : 'มองตรง'}`,
      `Yaw: ${data.orientation.yaw.toFixed(1)}°`,
      `Pitch: ${data.orientation.pitch.toFixed(1)}°`
    ]

    statusTexts.forEach((text, index) => {
      ctx.fillText(text, 20, canvas.height - 100 + (index * 25))
    })
  }, [])

  // เริ่มการติดตาม
  const startTracking = useCallback(async () => {
    const initialized = await initializeCamera()
    if (!initialized) return

    setIsActive(true)
    startTimeRef.current = performance.now()
    
    // เริ่ม detection loop
    intervalRef.current = setInterval(performDetection, 100) // ทุก 100ms
    
    console.log('🎯 เริ่มการติดตาม')
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
    if (!isActive) {
      startTracking()
    }
  }, [isActive, startTracking]) // Run once on mount

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