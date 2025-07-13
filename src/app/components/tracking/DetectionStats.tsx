'use client'
import { FaceTrackingData } from '@/lib/mediapipe-detector'

interface DetectionStatsProps {
  data: FaceTrackingData | null
  isActive: boolean
}

export function DetectionStats({ data, isActive }: DetectionStatsProps) {
  // ฟังก์ชันกำหนดทิศทางการหัน
  const getOrientationIndicator = (yaw: number, pitch: number) => {
    const absYaw = Math.abs(yaw)
    const absPitch = Math.abs(pitch)
    
    if (absYaw > absPitch) {
      if (yaw > 25) {
        return { direction: 'หันขวา →', color: 'bg-orange-100 text-orange-800' }
      } else if (yaw < -25) {
        return { direction: '← หันซ้าย', color: 'bg-orange-100 text-orange-800' }
      }
    } else {
      if (pitch > 12) {
        return { direction: 'ก้มหน้า ↓', color: 'bg-purple-100 text-purple-800' }
      } else if (pitch < -12) {
        return { direction: '↑ เงยหน้า', color: 'bg-purple-100 text-purple-800' }
      }
    }
    
    return { direction: 'มองตรง ●', color: 'bg-green-100 text-green-800' }
  }

  if (!isActive || !data) return null

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-2">สถานะปัจจุบัน:</h3>
      
      {/* Face Detection & Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
        <div className={`p-2 rounded ${data.isDetected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          Face Detection: {data.isDetected ? 'ตรวจพบใบหน้า' : 'ไม่พบใบหน้า'}
        </div>
        <div className={`p-2 rounded ${!data.isDetected ? 'bg-gray-100 text-gray-800' : data.orientation.isLookingAway ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          Orientation: {!data.isDetected ? 'ไม่พบใบหน้า' : data.orientation.isLookingAway ? 'หันหน้าออก' : 'อยู่ในเฟรมตรวจจับ'}
        </div>
      </div>

      {/* Orientation Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
        <div className="p-2 rounded bg-blue-100 text-blue-800">
          Yaw: {!data.isDetected ? 'ไม่พบใบหน้า' : `${data.orientation.yaw.toFixed(1)}°`}
        </div>
        <div className="p-2 rounded bg-blue-100 text-blue-800">
          Pitch: {!data.isDetected ? 'ไม่พบใบหน้า' : `${data.orientation.pitch.toFixed(1)}°`}
        </div>
        <div className="p-2 rounded bg-gray-100 text-gray-800">
          Landmarks: {data.landmarks?.length || 0} จุด
        </div>
        <div className={`p-2 rounded ${!data.isDetected ? 'bg-gray-100 text-gray-800' : getOrientationIndicator(data.orientation.yaw, data.orientation.pitch).color}`}>
          ทิศทาง: {!data.isDetected ? 'ไม่พบใบหน้า' : getOrientationIndicator(data.orientation.yaw, data.orientation.pitch).direction}
        </div>
      </div>
    </div>
  )
}