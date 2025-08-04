interface StatusIndicatorsProps {
  isStreaming: boolean;
  capturedPoses: Record<string, number[]>;
  currentPoseType: string;
  currentDetectedPose: 'front' | 'left' | 'right' | 'unknown';
  isBlinking: boolean;
}

export function StatusIndicators({
  isStreaming,
  capturedPoses,
  currentPoseType,
  currentDetectedPose,
  isBlinking
}: StatusIndicatorsProps) {
  return (
    <>
      {/* Camera Status */}
      <div className="absolute top-4 left-4">
        <div
          className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm ${
            isStreaming
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isStreaming ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span>{isStreaming ? "กล้องเปิดอยู่" : "กล้องปิด"}</span>
        </div>
      </div>

      {/* Real-time Status Indicators */}
      <div className="absolute top-4 right-4 space-y-2">
        {/* Pose completion indicator */}
        {capturedPoses[currentPoseType] && (
          <div className="flex items-center space-x-2 px-3 py-2 rounded-full text-sm bg-green-100 text-green-800">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>เสร็จสิ้น</span>
          </div>
        )}
        
        {/* Current pose detection indicator */}
        {!capturedPoses[currentPoseType] && currentDetectedPose !== 'unknown' && (
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm ${
            currentDetectedPose === currentPoseType || (currentPoseType === 'blink' && isBlinking)
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}> 
            <div className={`w-2 h-2 rounded-full ${
              currentDetectedPose === currentPoseType || (currentPoseType === 'blink' && isBlinking)
                ? 'bg-green-500'
                : 'bg-yellow-500'
            }`} />
            <span>{currentDetectedPose === currentPoseType || (currentPoseType === 'blink' && isBlinking) ? 'ถูกต้อง' : 'ไม่ถูกต้อง'}</span>
          </div>
        )}
      </div>
    </>
  );
}