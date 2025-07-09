import { PoseType } from '../FaceLogin'

interface StatusDisplayProps {
  isPoseVerified: boolean
  selectedPose: PoseType | null
  loading: boolean
}

export function StatusDisplay({ isPoseVerified, selectedPose, loading }: StatusDisplayProps) {
  if (isPoseVerified) {
    return (
      <div className="text-center">
        <div className="text-green-600 text-4xl mb-2">✓</div>
        <p className="text-green-600 font-semibold">
          {loading ? 'กำลังยืนยันตัวตน...' : 'ยืนยันท่าสำเร็จแล้ว'}
        </p>
      </div>
    )
  }

  if (selectedPose) {
    return (
      <div className="text-center space-y-2">
        <p className="text-gray-600">
          ระบบจะยืนยันอัตโนมัติเมื่อท่าถูกต้อง
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-gray-600">
        กำลังเตรียมท่ายืนยันตัวตน...
      </p>
    </div>
  )
}