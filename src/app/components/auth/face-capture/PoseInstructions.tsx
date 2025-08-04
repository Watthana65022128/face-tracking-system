interface PoseData {
  type: 'front' | 'left' | 'right' | 'blink';
  title: string;
  instruction: string;
  icon: string;
}

interface PoseInstructionsProps {
  currentPose: PoseData;
  currentPoseIndex: number;
  poses: PoseData[];
  capturedPoses: Record<string, number[]>;
  isAllPosesComplete: boolean;
  currentDetectedPose: 'front' | 'left' | 'right' | 'unknown';
  poseConfidence: number;
  isBlinking: boolean;
}

export function PoseInstructions({
  currentPose,
  currentPoseIndex,
  poses,
  capturedPoses,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isAllPosesComplete,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentDetectedPose,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  poseConfidence,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isBlinking
}: PoseInstructionsProps) {
  return (
    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <p className="text-purple-700 text-lg font-medium mb-3">{currentPose.instruction}</p>
      
      {/* Pose Progress */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-purple-600">ความคืบหน้า:</span>
        <span className="text-sm font-medium text-purple-800">{Object.keys(capturedPoses).length}/{poses.length}</span>
      </div>
      
      <div className="flex space-x-1 mb-3">
        {poses.map((pose, index) => (
          <div
            key={pose.type}
            className={`flex-1 h-2 rounded-full transition-all duration-300 ${
              capturedPoses[pose.type] 
                ? 'bg-green-500' 
                : index === currentPoseIndex 
                ? 'bg-purple-400' 
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}