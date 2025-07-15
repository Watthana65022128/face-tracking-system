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
  const { isActive, currentData, initializeDetector, startDetection, stopDetection } = useFaceDetection()

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

  // หยุดการติดตาม
  const stopTracking = useCallback(() => {
    stopDetection()
    stopCamera(videoRef)
    onTrackingStop()
  }, [stopDetection, stopCamera, onTrackingStop])

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

        {/* Control Buttons */}
        <ControlPanel isActive={isActive} onStop={stopTracking} />
      </div>
    </Card>
  )
}