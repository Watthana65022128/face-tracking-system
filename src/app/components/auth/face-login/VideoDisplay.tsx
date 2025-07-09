import { forwardRef } from 'react'
import { isPoseReadyForLogin } from '@/lib/face-api'
import { PoseType } from '../FaceLogin'

interface VideoDisplayProps {
  isStreaming: boolean
  isModelLoading: boolean
  currentDetectedPose: 'front' | 'left' | 'right' | 'unknown'
  currentPose: { type: PoseType; title: string; instruction: string; icon: string } | undefined
  poseConfidence: number
}

export const VideoDisplay = forwardRef<HTMLVideoElement, VideoDisplayProps>(
  ({ isStreaming, isModelLoading, currentDetectedPose, currentPose, poseConfidence }, ref) => {
    return (
      <div className="relative mb-6">
        <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video">
          <video
            ref={ref}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
          
          {isStreaming && !isModelLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`border-4 rounded-full w-48 h-60 transition-colors duration-300 ${
                currentPose && isPoseReadyForLogin(currentDetectedPose, currentPose.type, poseConfidence)
                  ? 'border-green-400 animate-pulse'
                  : 'border-purple-400'
              }`} />
            </div>
          )}

          <div className="absolute top-4 left-4">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm ${
              isStreaming ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{isStreaming ? 'กล้องเปิดอยู่' : 'กล้องปิด'}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

VideoDisplay.displayName = 'VideoDisplay'