'use client'

import { useState, useEffect } from 'react'
import { subscribeToRealtimeTracking, RealtimeTrackingEvent } from '@/lib/supabase'

interface RealtimeTrackingProps {
  maxEvents?: number
}

const DIRECTION_LABELS = {
  LEFT: 'หันซ้าย',
  RIGHT: 'หันขวา', 
  UP: 'เงยหน้า',
  DOWN: 'ก้มหน้า',
  FACE_DETECTION_LOSS: 'ไม่พบใบหน้า',
  FACE_ORIENTATION: 'หันหน้า'
} as const

const DIRECTION_COLORS = {
  LEFT: 'text-blue-600 bg-blue-50',
  RIGHT: 'text-green-600 bg-green-50',
  UP: 'text-purple-600 bg-purple-50',
  DOWN: 'text-orange-600 bg-orange-50',
  FACE_DETECTION_LOSS: 'text-red-600 bg-red-50',
  FACE_ORIENTATION: 'text-gray-600 bg-gray-50'
} as const

export default function RealtimeTracking({ maxEvents = 50 }: RealtimeTrackingProps) {
  const [events, setEvents] = useState<RealtimeTrackingEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [lastEventTime, setLastEventTime] = useState<string>('')

  useEffect(() => {
    console.log('🔌 เริ่มต้น Realtime Tracking subscription...')

    const channel = subscribeToRealtimeTracking(
      (newEvent) => {
        console.log('📨 ได้รับ realtime event:', newEvent)
        
        setEvents(prevEvents => {
          const updatedEvents = [newEvent, ...prevEvents].slice(0, maxEvents)
          return updatedEvents
        })
        
        setLastEventTime(new Date().toLocaleTimeString('th-TH', { hour12: false }))
        setConnectionError(null)
      },
      (error) => {
        console.error('❌ Realtime tracking error:', error)
        setConnectionError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
        setIsConnected(false)
      }
    )

    // Set connection status
    setIsConnected(true)
    console.log('✅ Realtime Tracking subscription เสร็จสิ้น')

    // Cleanup on unmount
    return () => {
      console.log('🔌 ยกเลิก Realtime Tracking subscription')
      if (channel) {
        channel.unsubscribe()
      }
      setIsConnected(false)
    }
  }, [maxEvents])

  const handleClearEvents = () => {
    setEvents([])
    setLastEventTime('')
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('th-TH', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Real-time Tracking
          </h2>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}>
          </div>
          <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {lastEventTime && (
            <span className="text-sm text-gray-500">
              Event ล่าสุด: {lastEventTime}
            </span>
          )}
          <button
            onClick={handleClearEvents}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
          >
            ลบทั้งหมด
          </button>
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">⚠️ {connectionError}</p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">รวมทั้งหมด</div>
          <div className="text-lg font-semibold text-gray-900">{events.length}</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600">หันซ้าย</div>
          <div className="text-lg font-semibold text-blue-700">
            {events.filter(e => e.direction === 'LEFT').length}
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="text-sm text-green-600">หันขวา</div>
          <div className="text-lg font-semibold text-green-700">
            {events.filter(e => e.direction === 'RIGHT').length}
          </div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-600">เงยหน้า</div>
          <div className="text-lg font-semibold text-purple-700">
            {events.filter(e => e.direction === 'UP').length}
          </div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <div className="text-sm text-orange-600">ก้มหน้า</div>
          <div className="text-lg font-semibold text-orange-700">
            {events.filter(e => e.direction === 'DOWN').length}
          </div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="text-sm text-red-600">ไม่พบใบหน้า</div>
          <div className="text-lg font-semibold text-red-700">
            {events.filter(e => e.detectionType === 'FACE_DETECTION_LOSS').length}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
          <h3 className="text-sm font-medium text-gray-700">
            การติดตามแบบเรียลไทม์ ({events.length}/{maxEvents})
          </h3>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-2xl mb-2">👀</div>
              <p>รอการติดตาม...</p>
              <p className="text-xs mt-1">เมื่อผู้ใช้เริ่มใช้งานระบบ จะแสดงข้อมูลที่นี่</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {events.map((event, index) => (
                <div key={`${event.id}-${index}`} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        event.direction ? DIRECTION_COLORS[event.direction] : DIRECTION_COLORS[event.detectionType]
                      }`}>
                        {event.direction ? DIRECTION_LABELS[event.direction] : DIRECTION_LABELS[event.detectionType]}
                      </span>
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{event.userName}</span>
                        <span className="text-gray-500 ml-2">#{event.sessionId.slice(-6)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(event.timestamp)}
                    </div>
                  </div>
                  
                  {event.detectionData && (
                    <div className="mt-2 pl-6">
                      <div className="text-xs text-gray-500">
                        {event.detectionData.yaw && (
                          <span className="mr-4">Yaw: {Math.round(event.detectionData.yaw)}°</span>
                        )}
                        {event.detectionData.pitch && (
                          <span>Pitch: {Math.round(event.detectionData.pitch)}°</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-xs text-gray-500 text-center">
        แสดงข้อมูล {maxEvents} รายการล่าสุด • อัปเดตแบบเรียลไทม์
      </div>
    </div>
  )
}