import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Real-time tracking types based on existing tracking_logs schema
export interface RealtimeTrackingEvent {
  id: string
  sessionId: string
  userId: string
  userName: string
  detectionType: 'FACE_ORIENTATION' | 'FACE_DETECTION_LOSS'
  direction?: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN'
  timestamp: string
  confidence?: number
  detectionData?: any
}

// Real-time tracking functions using existing tracking_logs table
export const sendRealtimeEvent = async (event: {
  sessionId: string
  userId: string
  userName: string
  detectionType: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'FACE_DETECTION_LOSS'
  confidence?: number
  metadata?: any
}) => {
  try {
    // แปลง detectionType ให้ตรงกับ schema
    const mappedDetectionType = event.detectionType === 'FACE_DETECTION_LOSS' 
      ? 'FACE_DETECTION_LOSS' 
      : 'FACE_ORIENTATION'

    const detectionData = {
      direction: event.detectionType === 'FACE_DETECTION_LOSS' ? undefined : event.detectionType,
      userName: event.userName,
      userId: event.userId,
      timestamp: new Date().toISOString(),
      realtime: true,
      ...event.metadata
    }

    const { data, error } = await supabase
      .from('tracking_logs')
      .insert([{
        sessionId: event.sessionId,
        detectionType: mappedDetectionType,
        detectionData: detectionData,
        confidence: event.confidence || null
      }])
      .select()

    if (error) {
      console.error('Error sending realtime event:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in sendRealtimeEvent:', error)
    return { success: false, error }
  }
}

// Subscribe to realtime tracking events from tracking_logs
export const subscribeToRealtimeTracking = (
  callback: (event: RealtimeTrackingEvent) => void,
  onError?: (error: any) => void
) => {
  const channel = supabase
    .channel('realtime-tracking-logs')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'tracking_logs',
        filter: 'detectionData->>realtime.eq.true'
      },
      (payload) => {
        const log = payload.new as any
        const transformedEvent: RealtimeTrackingEvent = {
          id: log.id,
          sessionId: log.sessionId,
          userId: log.detectionData?.userId || '',
          userName: log.detectionData?.userName || '',
          detectionType: log.detectionType,
          direction: log.detectionData?.direction,
          timestamp: log.timestamp,
          confidence: log.confidence,
          detectionData: log.detectionData
        }
        callback(transformedEvent)
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to realtime tracking logs')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error subscribing to realtime tracking logs')
        onError?.('Channel subscription error')
      }
    })

  return channel
}

