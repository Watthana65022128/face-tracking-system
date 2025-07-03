import { Button } from "@/app/components/ui/Button";

interface CaptureStatusProps {
  isAllPosesComplete: boolean;
  loading: boolean;
  isCapturingPose: boolean;
  isModelLoading: boolean;
  isPoseReady: boolean;
  currentPoseIcon: string;
  currentPoseTitle: string;
  poseStableCount: number;
  capturedPosesCount: number;
  onSkip: () => void;
  onRetake: () => void;
  onGoToLogin: () => void;
}

export function CaptureStatus({
  isAllPosesComplete,
  loading,
  isCapturingPose,
  isModelLoading,
  isPoseReady,
  currentPoseIcon,
  currentPoseTitle,
  poseStableCount,
  capturedPosesCount,
  onSkip,
  onRetake,
  onGoToLogin
}: CaptureStatusProps) {
  if (isAllPosesComplete) {
    return (
      <div className="space-y-3">
        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-800 font-medium">ลงทะเบียนสำเร็จ!</p>
          <p className="text-green-600 text-sm">
            บันทึกข้อมูลใบหน้าทั้ง {capturedPosesCount} ท่าเรียบร้อยแล้ว
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={onRetake} variant="secondary" disabled={loading}>
            ถ่ายใหม่
          </Button>
          <Button onClick={onGoToLogin} disabled={loading}>
            เข้าสู่ระบบ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Auto-capture status */}
      <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
        {loading || isCapturingPose ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-600">กำลังบันทึกท่า...</span>
          </div>
        ) : isModelLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-600">กำลังโหลดระบบ AI...</span>
          </div>
        ) : isPoseReady ? (
          <div className="flex items-center justify-center">
            <span className="text-2xl mr-2">{currentPoseIcon}</span>
            <span className="text-green-600 font-medium">กำลังถ่ายภาพอัตโนมัติ... ({poseStableCount}/10)</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className="text-2xl mr-2">{currentPoseIcon}</span>
            <span className="text-gray-600">รอท่า {currentPoseTitle}...</span>
          </div>
        )}
      </div>
      
      {/* Skip Button - only show when waiting */}
      {!isCapturingPose && !loading && (
        <Button
          onClick={onSkip}
          variant="secondary"
          disabled={isModelLoading}
          className="w-full"
        >
          ข้ามท่านี้
        </Button>
      )}
    </div>
  );
}