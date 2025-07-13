'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { MediaPipeDetector, FaceTrackingData } from '@/lib/mediapipe-detector'

export function useFaceDetection() {
  const [isActive, setIsActive] = useState(false)
  const [currentData, setCurrentData] = useState<FaceTrackingData | null>(null)
  
  const detectorRef = useRef<MediaPipeDetector | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const initializeDetector = useCallback(async () => {
    if (!detectorRef.current) {
      detectorRef.current = new MediaPipeDetector()
      
      const initialized = await detectorRef.current.initialize()
      
      if (!initialized) {
        throw new Error('MediaPipe initialization failed')
      }
    }
    
    return true
  }, [])

  const performDetection = useCallback(async (videoRef: React.RefObject<HTMLVideoElement | null>) => {
    if (!detectorRef.current || !videoRef.current) return

    try {
      const timestamp = performance.now()
      const trackingData = await detectorRef.current.detectFromVideo(videoRef.current, timestamp)
      
      if (trackingData) {
        setCurrentData(trackingData)
        return trackingData
      }
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการตรวจจับ:', error)
    }
    
    return null
  }, [])

  const startDetection = useCallback((videoRef: React.RefObject<HTMLVideoElement | null>, onDetection?: (data: FaceTrackingData) => void) => {
    setIsActive(true)
    
    intervalRef.current = setInterval(async () => {
      const data = await performDetection(videoRef)
      if (data && onDetection) {
        onDetection(data)
      }
    }, 100) // ทุก 100ms
  }, [performDetection])

  const stopDetection = useCallback(() => {
    setIsActive(false)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (detectorRef.current) {
      detectorRef.current.destroy()
      detectorRef.current = null
    }
  }, [])

  // Cleanup เมื่อ component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (detectorRef.current) {
        detectorRef.current.destroy()
      }
    }
  }, [])

  return {
    isActive,
    currentData,
    initializeDetector,
    startDetection,
    stopDetection,
    performDetection
  }
}