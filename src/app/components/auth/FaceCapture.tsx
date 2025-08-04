"use client";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { loadFaceApiModels, detectFaceAndGetDescriptor, detectFacePose, isPoseReady } from "@/lib/face-api";
import { VideoPreview } from "./face-capture/VideoPreview";
import { PoseInstructions } from "./face-capture/PoseInstructions";
import { CaptureStatus } from "./face-capture/CaptureStatus";

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // สถานะพื้นฐาน
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [isModelLoading, setIsModelLoading] = useState(true);
  
  // สถานะการจับภาพหลายท่า
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [capturedPoses, setCapturedPoses] = useState<{ [key in PoseType]?: number[] }>({});
  const [isCapturingPose, setIsCapturingPose] = useState(false);
  const [poseProgress, setPoseProgress] = useState(0);
  const [isAllPosesComplete, setIsAllPosesComplete] = useState(false);
  
  // สถานะการตรวจจับแบบเรียลไทม์
  const [currentDetectedPose, setCurrentDetectedPose] = useState<'front' | 'left' | 'right' | 'unknown'>('unknown');
  const [poseConfidence, setPoseConfidence] = useState(0);
  const [poseStableCount, setPoseStableCount] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [autoCapturing, setAutoCapturing] = useState(false);
  
  const poses: PoseData[] = [
    { type: 'front', title: 'หน้าตรง', instruction: 'มองตรงเข้ากล้อง', icon: '🧑' },
    { type: 'left', title: 'หันซ้าย', instruction: 'หันหน้าไปทางซ้าย 30 องศา', icon: '👈' },
    { type: 'right', title: 'หันขวา', instruction: 'หันหน้าไปทางขวา 30 องศา', icon: '👉' },
    { type: 'blink', title: 'กระพริบตา', instruction: 'กระพริบตา 2-3 ครั้ง', icon: '👁️' }
  ];
  
  const currentPose = poses[currentPoseIndex];

  useEffect(() => {
    initializeFaceApi();
    return () => {
      stopCamera();
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);
  
  // เริ่มการตรวจจับท่าอย่างต่อเนื่องเมื่อสตรีมมิ่ง
  useEffect(() => {
    if (isStreaming && !isModelLoading && !isAllPosesComplete) {
      startContinuousDetection();
    } else {
      stopContinuousDetection();
    }
    
    return () => stopContinuousDetection();
  }, [isStreaming, isModelLoading, isAllPosesComplete]);
  
  // จับภาพอัตโนมัติเมื่อท่าคงที่
  useEffect(() => {
    if (!autoCapturing && !isCapturingPose && !isAllPosesComplete) {
      const targetPose = currentPose.type;
      const isReady = isPoseReady(currentDetectedPose, targetPose, poseConfidence, isBlinking);
      
      if (isReady) {
        setPoseStableCount(prev => prev + 1);
        
        // หากท่าคงที่เป็นเวลา 10 ครั้งติดต่อกัน (~1 วินาที) จับภาพอัตโนมัติ
        if (poseStableCount >= 10) {
          handleAutoCapture();
        }
      } else {
        setPoseStableCount(0);
      }
    }
  }, [currentDetectedPose, poseConfidence, isBlinking, poseStableCount, autoCapturing, isCapturingPose, isAllPosesComplete]);

  const initializeFaceApi = async () => {
    try {
      setIsModelLoading(true);
      await loadFaceApiModels();
      await startCamera();
    } catch (err) {
      setError("ไม่สามารถโหลดโมเดล AI ได้ กรุณาลองใหม่อีกครั้ง");
      console.error("ข้อผิดพลาดในการเริ่มต้น Face API:", err);
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
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error('ข้อผิดพลาดในการเล่นวิดีโอ:', err)
            setError('ไม่สามารถเริ่มวิดีโอได้')
          })
        }
        
        videoRef.current.onplaying = () => {
          setIsStreaming(true)
          setError('')
        }
        
        videoRef.current.onerror = (err) => {
          console.error('ข้อผิดพลาดวิดีโอ:', err)
          setError('เกิดข้อผิดพลาดกับวิดีโอ กรุณาลองใหม่')
        }
      }
    } catch (err: unknown) {
      console.error('ข้อผิดพลาดกล้อง:', err)
      
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('กรุณาอนุญาตการใช้กล้องในเบราว์เซอร์ คลิกที่ไอคอนกล้องในแถบที่อยู่')
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        setError('ไม่พบกล้องในอุปกรณ์ กรุณาตรวจสอบการเชื่อมต่อกล้อง')
      } else if (err instanceof Error && err.name === 'NotReadableError') {
        setError('กล้องถูกใช้งานโดยแอปพลิเคชันอื่น กรุณาปิดแอปอื่นที่ใช้กล้อง')
      } else if (err instanceof Error && err.name === 'AbortError') {
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

  const startContinuousDetection = () => {
    if (detectionIntervalRef.current) return;
    
    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current && !isCapturingPose && !autoCapturing) {
        try {
          const detection = await detectFacePose(videoRef.current);
          
          if (detection.detected) {
            setCurrentDetectedPose(detection.pose);
            setPoseConfidence(detection.confidence);
            setIsBlinking(detection.isBlinking || false);
          } else {
            setCurrentDetectedPose('unknown');
            setPoseConfidence(0);
            setIsBlinking(false);
            setPoseStableCount(0);
          }
        } catch {
          // Silent error handling for continuous detection
        }
      }
    }, 100);
  };
  
  const stopContinuousDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };
  
  const playSuccessSound = () => {
    try {
      // สร้างเสียงเชิงบวกด้วย Web Audio API
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || AudioContext)();
      
      // เสียงสำหรับแต่ละขั้นตอน (โทนเสียงเพิ่มขึ้น)
      const frequencies = [523.25, 587.33, 659.25, 698.46]; // โนตดนตรี C5, D5, E5, F5
      const frequency = frequencies[currentPoseIndex] || 523.25;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch {
      console.log('ระบบเสียงไม่ได้รับการสนับสนุนหรือถูกบล็อก');
    }
  };

  const playCompletionSound = () => {
    try {
      // เสียงสำหรับเสร็จสิ้นทั้งหมด (แบบมีท่วงทำนอง)
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || AudioContext)();
      
      const melody = [523.25, 659.25, 783.99, 1046.50]; // ท่วงทำนอง C5, E5, G5, C6
      
      melody.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + (index * 0.2);
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
      });
    } catch {
      console.log('ระบบเสียงไม่ได้รับการสนับสนุนหรือถูกบล็อก');
    }
  };

  const handleAutoCapture = async () => {
    if (!videoRef.current || isCapturingPose || autoCapturing) return;

    try {
      setError("");
      setIsCapturingPose(true);
      setAutoCapturing(true);
      setPoseStableCount(0);

      const faceDescriptor = await detectFaceAndGetDescriptor(videoRef.current, true);

      const newCapturedPoses = {
        ...capturedPoses,
        [currentPose.type]: faceDescriptor
      };
      setCapturedPoses(newCapturedPoses);

      setPoseProgress(100);
      
      // เล่นเสียงเมื่อจับใบหน้าสำเร็จ
      playSuccessSound();
      
      setTimeout(() => {
        if (currentPoseIndex < poses.length - 1) {
          setCurrentPoseIndex(prev => prev + 1);
          setPoseProgress(0);
        } else {
          setIsAllPosesComplete(true);
          // เล่นเสียงเมื่อเสร็จสิ้นทั้งหมด
          playCompletionSound();
          onCapture(newCapturedPoses as { front: number[], left: number[], right: number[], blink: number[] });
        }
        setIsCapturingPose(false);
        setAutoCapturing(false);
      }, 1500);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ไม่สามารถตรวจจับใบหน้าได้ กรุณาลองใหม่");
      console.error("ข้อผิดพลาดในการจับภาพใบหน้า:", err);
      setIsCapturingPose(false);
      setAutoCapturing(false);
    }
  };

  const handleRetake = () => {
    setCurrentPoseIndex(0);
    setCapturedPoses({});
    setPoseProgress(0);
    setIsAllPosesComplete(false);
    setIsCapturingPose(false);
    setAutoCapturing(false);
    setPoseStableCount(0);
    setCurrentDetectedPose('unknown');
    setPoseConfidence(0);
  };
  

  const handleGoToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <Card className="p-8 w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">ลงทะเบียนใบหน้า</h2>
        <p className="text-lg text-gray-600 font-semibold mt-2">
          {currentPose.title} ({currentPoseIndex + 1}/{poses.length})
        </p>
      </div>

      {isModelLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

      <VideoPreview
        ref={videoRef}
        isStreaming={isStreaming}
        isModelLoading={isModelLoading}
        currentDetectedPose={currentDetectedPose}
        currentPoseType={currentPose.type}
        isBlinking={isBlinking}
        poseStableCount={poseStableCount}
        isPoseReady={isPoseReady(currentDetectedPose, currentPose.type, poseConfidence, isBlinking)}
        capturedPoses={capturedPoses}
        poseProgress={poseProgress}
      />

      <PoseInstructions
        currentPose={currentPose}
        currentPoseIndex={currentPoseIndex}
        poses={poses}
        capturedPoses={capturedPoses}
        isAllPosesComplete={isAllPosesComplete}
        currentDetectedPose={currentDetectedPose}
        poseConfidence={poseConfidence}
        isBlinking={isBlinking}
      />

      <CaptureStatus
        isAllPosesComplete={isAllPosesComplete}
        loading={loading}
        isCapturingPose={isCapturingPose}
        isModelLoading={isModelLoading}
        isPoseReady={isPoseReady(currentDetectedPose, currentPose.type, poseConfidence, isBlinking)}
        currentPoseIcon={currentPose.icon}
        currentPoseTitle={currentPose.title}
        poseStableCount={poseStableCount}
        capturedPosesCount={Object.keys(capturedPoses).length}
        onRetake={handleRetake}
        onGoToLogin={handleGoToLogin}
      />
    </Card>
  );
}