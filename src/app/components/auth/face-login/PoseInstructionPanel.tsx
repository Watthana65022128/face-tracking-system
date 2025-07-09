import { PoseType } from '../FaceLogin'

interface PoseInstructionPanelProps {
  isPoseVerified: boolean
  currentPose: { type: PoseType; title: string; instruction: string; icon: string } | undefined
  poseTimeRemaining: number
  isTimeoutWarning: boolean
  poseProgress: number
}

export function PoseInstructionPanel({
  isPoseVerified,
  currentPose,
  poseTimeRemaining,
  isTimeoutWarning,
  poseProgress
}: PoseInstructionPanelProps) {
  const formatTime = (seconds: number) => {
    return `${seconds}s`
  }

  if (isPoseVerified || !currentPose) {
    return null
  }

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{currentPose.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{currentPose.title}</h3>
            <p className="text-sm text-gray-600">{currentPose.instruction}</p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
          isTimeoutWarning 
            ? 'bg-red-100 text-red-800 animate-pulse' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          ⏱️ {formatTime(poseTimeRemaining)}
        </div>
      </div>
      
      {isTimeoutWarning && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          ⚠️ เวลาใกล้หมด! กรุณาทำท่าให้ถูกต้อง
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${poseProgress}%` }}
        />
      </div>
    </div>
  )
}