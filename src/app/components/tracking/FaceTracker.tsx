'use client'
import { useRef, useEffect, useCallback } from 'react'
import { FaceTrackingData } from '@/lib/mediapipe-detector'
import { Card } from '@/app/components/ui/Card'
import { VideoPlayer } from './VideoPlayer'
import { OverlayCanvas } from './OverlayCanvas'
import { DetectionStats } from './DetectionStats'
import { ControlPanel } from './ControlPanel'
import { useCamera } from '@/hooks/useCamera'
import { useFaceDetection } from '@/hooks/useFaceDetection'
import { drawSciFiFaceMesh, drawStatusInfo } from '@/lib/face-mesh-utils'

interface FaceTrackerProps {
  onTrackingStop: () => void
  sessionName?: string
}

export function FaceTracker({ onTrackingStop, sessionName = 'การสอบ' }: FaceTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ใช้ custom hooks
  const { initializeCamera, stopCamera } = useCamera()
  const { 
    isActive, 
    currentData, 
    isRecording, 
    orientationStats, 
    initializeDetector, 
    startDetection, 
    stopDetection,
    startRecording,
    stopRecording,
    getCurrentStats,
    getOrientationHistory
  } = useFaceDetection()

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

    // แสดงเตือนหลายใบหน้า (ความปลอดภัยในการสอบ)
    if (data.multipleFaces && data.multipleFaces.isSecurityRisk) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.9)'
      ctx.font = 'bold 20px Arial'
      ctx.fillText('🚨 เตือน: พบหลายใบหน้าในการสอบ!', 50, 30)
      ctx.fillStyle = 'rgba(255, 255, 0, 0.8)'
      ctx.font = '16px Arial'
      ctx.fillText(`จำนวนใบหน้า: ${data.multipleFaces.count}`, 50, 55)
    }

    // วาด Sci-Fi Face Mesh ด้วย landmarks ทั้ง 468 จุด
    if (data.landmarks && data.landmarks.length > 0) {
      drawSciFiFaceMesh(ctx, data.landmarks, video, canvas.width, canvas.height, data.orientation.isLookingAway)
    }

    // แสดงข้อมูลสถานะ
    drawStatusInfo(ctx, data, canvas.width, canvas.height)
  }, [])

  // เริ่มการติดตาม
  const startTracking = useCallback(async () => {
    try {
      const cameraInitialized = await initializeCamera(videoRef)
      if (!cameraInitialized) {
        alert('ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการอนุญาต')
        return
      }

      await initializeDetector()
      
      startDetection(videoRef, drawDetectionOverlay)
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการเริ่มต้น:', error)
      alert('MediaPipe ไม่สามารถโหลดได้\nกรุณาตรวจสอบ internet connection\nหรือลอง refresh หน้าเว็บ')
    }
  }, [initializeCamera, initializeDetector, startDetection, drawDetectionOverlay])

  // เริ่มบันทึกข้อมูล orientation
  const handleStartRecording = useCallback(() => {
    if (!isActive) {
      alert('กรุณาเริ่มการติดตามใบหน้าก่อน')
      return
    }
    
    const started = startRecording()
    if (started) {
      console.log('🎬 เริ่มบันทึก orientation data แล้ว')
    }
  }, [isActive, startRecording])
  
  // หยุดบันทึกและแสดงผลลัพธ์
  const handleStopRecording = useCallback(async () => {
    const events = stopRecording()
    const stats = getCurrentStats()
    
    console.log('📊 สถิติการหันหน้า:', stats)
    console.log('📝 รายละเอียด events:', events)
    
    // TODO: ส่งข้อมูลไป API เพื่อบันทึกลง database
    // สามารถเรียกใช้ /api/tracking/orientation ได้
    
    alert(`หยุดบันทึกแล้ว!\n\nสรุปผลลัพธ์:\n• หันซ้าย: ${stats?.leftTurns.count || 0} ครั้ง (${stats?.leftTurns.totalDuration || 0} วิ)\n• หันขวา: ${stats?.rightTurns.count || 0} ครั้ง (${stats?.rightTurns.totalDuration || 0} วิ)\n• ก้มหน้า: ${stats?.lookingDown.count || 0} ครั้ง (${stats?.lookingDown.totalDuration || 0} วิ)\n• เงยหน้า: ${stats?.lookingUp.count || 0} ครั้ง (${stats?.lookingUp.totalDuration || 0} วิ)\n• รวม events: ${stats?.totalEvents || 0} ครั้ง`)
  }, [stopRecording, getCurrentStats])

  // หยุดการติดตาม
  const stopTracking = useCallback(() => {
    // หยุดบันทึกก่อน (ถ้ากำลังบันทึกอยู่)
    if (isRecording) {
      handleStopRecording()
    }
    
    stopDetection()
    stopCamera(videoRef)
    onTrackingStop()
  }, [stopDetection, stopCamera, onTrackingStop, isRecording, handleStopRecording])

  // Cleanup เมื่อ component unmount
  useEffect(() => {
    return () => {
      stopCamera(videoRef)
    }
  }, [stopCamera])

  // Auto-start tracking when component mounts
  useEffect(() => {
    if (!isActive) {
      startTracking()
    }
  }, [startTracking, isActive])

  return (
    <Card className="w-full h-full">
      <div className="p-6">
        {/* Video and Canvas Container */}
        <div className="relative mb-6">
          <VideoPlayer ref={videoRef} />
          <OverlayCanvas ref={canvasRef} videoRef={videoRef} />
        </div>

        {/* Current Detection Status */}
        <DetectionStats data={currentData} isActive={isActive} />

        {/* Orientation Recording Controls */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">📊 การบันทึกข้อมูลการหันหน้า</h3>
          
          <div className="flex gap-3 mb-3">
            <button
              onClick={handleStartRecording}
              disabled={!isActive || isRecording}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !isActive || isRecording
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              🎬 เริ่มบันทึกข้อมูล
            </button>
            
            <button
              onClick={handleStopRecording}
              disabled={!isRecording}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !isRecording
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              🛑 หยุดบันทึก
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className={`text-sm font-medium ${isRecording ? 'text-red-600' : 'text-gray-500'}`}>
              {isRecording ? 'กำลังบันทึกข้อมูล...' : 'ไม่ได้บันทึกข้อมูล'}
            </span>
          </div>
        </div>

        {/* Live Orientation Statistics */}
        {orientationStats && isRecording && (
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-3">📈 สถิติการหันหน้า (แบบเรียลไทม์)</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-2xl font-bold text-blue-600">{orientationStats.leftTurns.count}</div>
                <div className="text-sm text-gray-600">หันซ้าย</div>
                <div className="text-xs text-gray-500">{orientationStats.leftTurns.totalDuration}วิ</div>
              </div>
              
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-2xl font-bold text-green-600">{orientationStats.rightTurns.count}</div>
                <div className="text-sm text-gray-600">หันขวา</div>
                <div className="text-xs text-gray-500">{orientationStats.rightTurns.totalDuration}วิ</div>
              </div>
              
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-2xl font-bold text-red-600">{orientationStats.lookingDown.count}</div>
                <div className="text-sm text-gray-600">ก้มหน้า</div>
                <div className="text-xs text-gray-500">{orientationStats.lookingDown.totalDuration}วิ</div>
              </div>
              
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-2xl font-bold text-yellow-600">{orientationStats.lookingUp.count}</div>
                <div className="text-sm text-gray-600">เงยหน้า</div>
                <div className="text-xs text-gray-500">{orientationStats.lookingUp.totalDuration}วิ</div>
              </div>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>📊 รวม {orientationStats.totalEvents} events</span>
              <span>🕐 เริ่มบันทึก: {orientationStats.sessionStartTime}</span>
              {orientationStats.lastEventTime && (
                <span>🕐 Event ล่าสุด: {orientationStats.lastEventTime}</span>
              )}
            </div>
          </div>
        )}
        {/* Control Buttons */}
        <ControlPanel isActive={isActive} onStop={stopTracking} />
      </div>
    </Card>
  )
}