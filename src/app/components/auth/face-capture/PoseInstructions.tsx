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
  capturedPoses: Record<string, any>;
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
  isAllPosesComplete,
  currentDetectedPose,
  poseConfidence,
  isBlinking
}: PoseInstructionsProps) {
  return (
    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <h3 className="font-medium text-purple-800 mb-2 flex items-center">
        <span className="text-2xl mr-2">{currentPose.icon}</span>
        ท่าที่ {currentPoseIndex + 1}: {currentPose.title}
      </h3>
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
      
      {/* General Instructions */}
      <div className="text-sm text-purple-600 space-y-1">
        <p>• วางใบหน้าให้อยู่ในกรอบวงรี</p>
        <p>• ทำตามคำแนะนำ - ระบบจะถ่ายภาพอัตโนมัติ</p>
        <p>• เมื่อท่าถูกต้อง จะถ่ายภาพโดยอัตโนมัติ</p>
        <p>• โปรดถอดแว่นตา หน้ากาก และอุปกรณ์ปกปิดทุกชนิด</p>
        
        {/* Real-time feedback */}
        {!isAllPosesComplete && (
          <div className="mt-3 p-2 bg-purple-100 rounded border-l-4 border-purple-400">
            <p className="font-medium">สถานะปัจจุบัน:</p>
            <p className="text-xs">
              ตรวจพบ: {currentDetectedPose === 'unknown' ? 'ไม่พบใบหน้า' : currentDetectedPose} |
              ความมั่นใจ: {Math.round(poseConfidence * 100)}%
              {currentPose.type === 'blink' && ` | กระพริบ: ${isBlinking ? 'ใช่' : 'ไม่'}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}