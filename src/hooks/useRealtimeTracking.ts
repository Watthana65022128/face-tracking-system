import { useEffect, useCallback, useRef } from 'react'
import { sendRealtimeEvent } from '@/lib/supabase'

interface RealtimeTrackingConfig {
  sessionId: string
  userId: string
  userName: string
  isEnabled: boolean
}

export const useRealtimeTracking = (config: RealtimeTrackingConfig) => {
  const { sessionId, userId, userName, isEnabled } = config
  const lastDirectionRef = useRef<string>('')
  const sendingRef = useRef<boolean>(false)

  // ส่งข้อมูล real-time tracking
  const sendTrackingEvent = useCallback(async (
    detectionType: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'FACE_DETECTION_LOSS',
    confidence?: number,
    metadata?: any
  ) => {
    if (!isEnabled || sendingRef.current) {
      return
    }

    // ป้องกันการส่งซ้ำของ direction เดิม
    if (detectionType !== 'FACE_DETECTION_LOSS' && detectionType === lastDirectionRef.current) {
      return
    }

    try {
      sendingRef.current = true
      
      console.log(`📡 Sending realtime event: ${detectionType}`, {
        sessionId,
        userId,
        userName,
        detectionType,
        confidence,
        metadata
      })

      const result = await sendRealtimeEvent({
        sessionId,
        userId,
        userName,
        detectionType,
        confidence,
        metadata
      })

      if (result.success) {
        lastDirectionRef.current = detectionType === 'FACE_DETECTION_LOSS' ? '' : detectionType
        console.log(`✅ Real-time event sent successfully: ${detectionType}`)
      } else {
        console.error(`❌ Failed to send real-time event: ${detectionType}`, result.error)
      }
    } catch (error) {
      console.error('Error in sendTrackingEvent:', error)
    } finally {
      sendingRef.current = false
    }
  }, [sessionId, userId, userName, isEnabled])

  // ส่งข้อมูล face orientation
  const sendOrientationEvent = useCallback((
    direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'CENTER',
    yaw: number,
    pitch: number,
    confidence?: number
  ) => {
    // ไม่ส่ง CENTER events
    if (direction === 'CENTER') {
      // Reset last direction เมื่อกลับมา center
      if (lastDirectionRef.current !== '') {
        lastDirectionRef.current = ''
      }
      return
    }

    sendTrackingEvent(direction, confidence, {
      yaw,
      pitch,
      direction,
      timestamp: new Date().toISOString()
    })
  }, [sendTrackingEvent])

  // ส่งข้อมูล face detection loss
  const sendFaceDetectionLoss = useCallback((confidence?: number) => {
    sendTrackingEvent('FACE_DETECTION_LOSS', confidence, {
      lostAt: new Date().toISOString()
    })
  }, [sendTrackingEvent])

  // Reset tracking state เมื่อ config เปลี่ยน
  useEffect(() => {
    lastDirectionRef.current = ''
    sendingRef.current = false
  }, [sessionId, userId, isEnabled])

  return {
    sendOrientationEvent,
    sendFaceDetectionLoss,
    isEnabled
  }
}