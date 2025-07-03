import { forwardRef } from 'react';
import { FaceDetectionOverlay } from './FaceDetectionOverlay';
import { StatusIndicators } from './StatusIndicators';

interface VideoPreviewProps {
  isStreaming: boolean;
  isModelLoading: boolean;
  currentDetectedPose: 'front' | 'left' | 'right' | 'unknown';
  currentPoseType: 'front' | 'left' | 'right' | 'blink';
  isBlinking: boolean;
  poseStableCount: number;
  isPoseReady: boolean;
  capturedPoses: Record<string, any>;
  poseProgress: number;
}

export const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(
  function VideoPreview({
    isStreaming,
    isModelLoading,
    currentDetectedPose,
    currentPoseType,
    isBlinking,
    poseStableCount,
    isPoseReady,
    capturedPoses,
    poseProgress
  }, ref) {
    return (
      <div className="relative mb-6">
        {/* Video Preview */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
          <video
            ref={ref}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />

          <FaceDetectionOverlay
            isStreaming={isStreaming}
            isModelLoading={isModelLoading}
            currentDetectedPose={currentDetectedPose}
            currentPoseType={currentPoseType}
            isBlinking={isBlinking}
            poseStableCount={poseStableCount}
            isPoseReady={isPoseReady}
          />

          <StatusIndicators
            isStreaming={isStreaming}
            capturedPoses={capturedPoses}
            currentPoseType={currentPoseType}
            currentDetectedPose={currentDetectedPose}
            isBlinking={isBlinking}
          />
          
          {/* Pose Progress Bar */}
          {poseProgress > 0 && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-white bg-opacity-90 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${poseProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Hidden Canvas for capture */}
        <canvas className="hidden" />
      </div>
    );
  }
);