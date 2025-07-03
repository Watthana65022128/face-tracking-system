"use client";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { loadFaceApiModels, detectFaceAndGetDescriptor } from "@/lib/face-api";

interface FaceCaptureProps {
  onCapture: (faceDescriptors: { front: number[], left: number[], right: number[], blink: number[] }) => void;
  loading?: boolean;
}

type PoseType = 'front' | 'left' | 'right' | 'blink';

interface PoseData {
  type: PoseType;
  title: string;
  instruction: string;
  icon: string;
}

export function FaceCapture({ onCapture, loading = false }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [isModelLoading, setIsModelLoading] = useState(true);
  
  // Multi-pose capture states
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [capturedPoses, setCapturedPoses] = useState<{ [key in PoseType]?: number[] }>({});
  const [isCapturingPose, setIsCapturingPose] = useState(false);
  const [poseProgress, setPoseProgress] = useState(0);
  const [isAllPosesComplete, setIsAllPosesComplete] = useState(false);
  
  const poses: PoseData[] = [
    { type: 'front', title: 'หน้าตรง', instruction: 'มองตรงเข้ากล้อง', icon: '👤' },
    { type: 'left', title: 'หันซ้าย', instruction: 'หันหน้าไปทางซ้าย 30 องศา', icon: '👈' },
    { type: 'right', title: 'หันขวา', instruction: 'หันหน้าไปทางขวา 30 องศา', icon: '👉' },
    { type: 'blink', title: 'กระพริบตา', instruction: 'กระพริบตา 2-3 ครั้ง', icon: '👁️' }
  ];
  
  const currentPose = poses[currentPoseIndex];

  useEffect(() => {
    initializeFaceApi();
    return () => {
      stopCamera();
    };
  }, []);

  const initializeFaceApi = async () => {
    try {
      setIsModelLoading(true);
      await loadFaceApiModels();
      await startCamera();
    } catch (err) {
      setError("ไม่สามารถโหลดโมเดล AI ได้ กรุณาลองใหม่อีกครั้ง");
      console.error("Face API initialization error:", err);
    } finally {
      setIsModelLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // เพิ่ม event listeners
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error('Video play error:', err)
            setError('ไม่สามารถเริ่มวิดีโอได้')
          })
        }
        
        videoRef.current.onplaying = () => {
          setIsStreaming(true)
          setError('')
        }
        
        videoRef.current.onerror = (err) => {
          console.error('Video error:', err)
          setError('เกิดข้อผิดพลาดกับวิดีโอ กรุณาลองใหม่')
        }
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      
      if (err.name === 'NotAllowedError') {
        setError('กรุณาอนุญาตการใช้กล้องในเบราว์เซอร์ คลิกที่ไอคอนกล้องในแถบที่อยู่')
      } else if (err.name === 'NotFoundError') {
        setError('ไม่พบกล้องในอุปกรณ์ กรุณาตรวจสอบการเชื่อมต่อกล้อง')
      } else if (err.name === 'NotReadableError') {
        setError('กล้องถูกใช้งานโดยแอปพลิเคชันอื่น กรุณาปิดแอปอื่นที่ใช้กล้อง')
      } else if (err.name === 'AbortError') {
        setError('การเข้าถึงกล้องถูกยกเลิก กรุณาลองใหม่')
      } else {
        setError('ไม่สามารถเข้าถึงกล้องได้ กรุณาลองใหม่อีกครั้ง')
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setIsStreaming(false);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const handleCapture = async () => {
    if (!videoRef.current || isCapturingPose) return;

    try {
      setError("");
      setIsCapturingPose(true);

      // Get face descriptor using face-api.js
      const faceDescriptor = await detectFaceAndGetDescriptor(videoRef.current);

      // Store the descriptor for current pose
      const newCapturedPoses = {
        ...capturedPoses,
        [currentPose.type]: faceDescriptor
      };
      setCapturedPoses(newCapturedPoses);

      // Show progress animation
      setPoseProgress(100);
      
      // Move to next pose after delay
      setTimeout(() => {
        if (currentPoseIndex < poses.length - 1) {
          setCurrentPoseIndex(prev => prev + 1);
          setPoseProgress(0);
        } else {
          // All poses completed
          setIsAllPosesComplete(true);
          // Auto-save all captured poses
          onCapture(newCapturedPoses as { front: number[], left: number[], right: number[], blink: number[] });
        }
        setIsCapturingPose(false);
      }, 1500);

    } catch (err: any) {
      setError(err.message || "ไม่สามารถตรวจจับใบหน้าได้ กรุณาลองใหม่");
      console.error("Face capture error:", err);
      setIsCapturingPose(false);
    }
  };

  const handleRetake = () => {
    setCurrentPoseIndex(0);
    setCapturedPoses({});
    setPoseProgress(0);
    setIsAllPosesComplete(false);
    setIsCapturingPose(false);
  };
  
  const handleSkipPose = () => {
    if (currentPoseIndex < poses.length - 1) {
      setCurrentPoseIndex(prev => prev + 1);
      setPoseProgress(0);
    }
  };

  return (
    <Card className="p-8 w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">ลงทะเบียนใบหน้า</h2>
      </div>

      {isModelLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <svg
              className="animate-spin h-5 w-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-blue-600">กำลังโหลดโมเดล AI...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <Button
            onClick={initializeFaceApi}
            variant="secondary"
            className="mt-2 text-sm px-4 py-2"
          >
            ลองอีกครั้ง
          </Button>
        </div>
      )}

      <div className="relative mb-6">
        {/* Video Preview */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />

          {/* Face Detection Overlay */}
          {isStreaming && !isModelLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-purple-400 rounded-full w-48 h-54 animate-pulse" />
            </div>
          )}

          {/* Status Indicator */}
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
        </div>

        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h3 className="font-medium text-purple-800 mb-2">คำแนะนำ:</h3>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• โปรดวางใบหน้าให้อยู่ในขอบเขต</li>
          <li>• โปรดมองตรงเข้ากล้อง</li>
          <li>• โปรดหลีกเลี่ยงแสงและเงาที่มีผลกระทบการตรวจจับ</li>
          <li>• โปรดถอดแว่นตา หน้ากาก และอุปกรณ์ปกปอดทุกชนิด</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!isAllPosesComplete ? (
          <div className="space-y-3">
            <Button
              onClick={handleCapture}
              disabled={!isStreaming || loading || isModelLoading || isCapturingPose}
              className="w-full"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังบันทึก...
                </div>
              ) : isModelLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังโหลดโมเดล...
                </div>
              ) : isCapturingPose ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังบันทึกท่า...
                </div>
              ) : (
                <>
                  <span className="text-xl mr-2">{currentPose.icon}</span>
                  ถ่ายภาพท่า {currentPose.title}
                </>
              )}
            </Button>
            
            {/* Skip Button */}
            <Button
              onClick={handleSkipPose}
              variant="secondary"
              disabled={loading || isModelLoading || isCapturingPose}
              className="w-full"
            >
              ข้ามท่านี้
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800 font-medium">ลงทะเบียนสำเร็จ!</p>
              <p className="text-green-600 text-sm">
                บันทึกข้อมูลใบหน้าทั้ง {Object.keys(capturedPoses).length} ท่าเรียบร้อยแล้ว
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleRetake} variant="secondary" disabled={loading}>
                ถ่ายใหม่
              </Button>
              <Button onClick={() => (window.location.href = "/login")} disabled={loading}>
                เข้าสู่ระบบ
              </Button>
            </div>
          </div>
        )}
      </div>

    </Card>
  );
}
