interface FaceDetectionOverlayProps {
  isStreaming: boolean;
  isModelLoading: boolean;
  currentDetectedPose: 'front' | 'left' | 'right' | 'unknown';
  currentPoseType: 'front' | 'left' | 'right' | 'blink';
  isBlinking: boolean;
  poseStableCount: number;
  isPoseReady: boolean;
}

export function FaceDetectionOverlay({
  isStreaming,
  isModelLoading,
  currentDetectedPose,
  currentPoseType,
  isBlinking,
  poseStableCount,
  isPoseReady
}: FaceDetectionOverlayProps) {
  if (!isStreaming || isModelLoading) return null;

  const isCorrectPose = currentDetectedPose === currentPoseType || (currentPoseType === 'blink' && isBlinking);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className={`border-2 rounded-full w-48 h-54 transition-all duration-300 ${
        isCorrectPose
          ? 'border-green-400 shadow-lg shadow-green-400/50'
          : poseStableCount > 5
          ? 'border-yellow-400 animate-pulse'
          : 'border-purple-400 animate-pulse'
      }`} />
      
      {/* Pose readiness indicator */}
      {isPoseReady && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-bounce">
            พร้อมถ่าย {poseStableCount}/10
          </div>
        </div>
      )}
    </div>
  );
}