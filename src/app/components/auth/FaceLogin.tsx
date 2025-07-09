'use client'
import { useRef, useEffect, useState } from 'react'
import { Card } from '@/app/components/ui/Card'
import { loadFaceApiModels, detectFacePose, isPoseReadyForLogin, detectFaceAndGetDescriptor } from '@/lib/face-api'
import { VideoDisplay } from './face-login/VideoDisplay'
import { PoseInstructionPanel } from './face-login/PoseInstructionPanel'
import { StatusDisplay } from './face-login/StatusDisplay'
import { LoadingIndicator } from './face-login/LoadingIndicator'

interface FaceLoginProps {
  isOpen: boolean
  userId: string
  onSuccess: () => void
  onCancel: () => void
}

export type PoseType = 'front' | 'left' | 'right'

interface PoseData {
  type: PoseType
  title: string
  instruction: string
  icon: string
}

const POSE_TIMEOUT_SECONDS = 10
const POSE_STABLE_COUNT_THRESHOLD = 10
const DETECTION_INTERVAL = 100

const AVAILABLE_POSES: PoseData[] = [
  { type: 'front', title: 'หน้าตรง', instruction: 'มองตรงเข้ากล้อง', icon: '🧑' },
  { type: 'left', title: 'หันซ้าย', instruction: 'หันหน้าไปทางซ้าย 30 องศา', icon: '👈' },
  { type: 'right', title: 'หันขวา', instruction: 'หันหน้าไปทางขวา 30 องศา', icon: '👉' }
]

export function FaceLogin({ isOpen, userId, onSuccess, onCancel }: FaceLoginProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const poseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // สถานะพื้นฐาน
  const [isStreaming, setIsStreaming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isModelLoading, setIsModelLoading] = useState(true)
  
  // สถานะการยืนยันท่าเดียว
  const [selectedPose, setSelectedPose] = useState<PoseType | null>(null)
  const [isVerifyingPose, setIsVerifyingPose] = useState(false)
  const [poseProgress, setPoseProgress] = useState(0)
  const [isPoseVerified, setIsPoseVerified] = useState(false)
  
  // สถานะการตรวจจับแบบเรียลไทม์
  const [currentDetectedPose, setCurrentDetectedPose] = useState<'front' | 'left' | 'right' | 'unknown'>('unknown')
  const [poseConfidence, setPoseConfidence] = useState(0)
  const [poseStableCount, setPoseStableCount] = useState(0)
  const [isBlinking, setIsBlinking] = useState(false)
  const [autoVerifying, setAutoVerifying] = useState(false)
  
  // สถานะหมดเวลา
  const [poseTimeRemaining, setPoseTimeRemaining] = useState(POSE_TIMEOUT_SECONDS)
  const [isTimeoutWarning, setIsTimeoutWarning] = useState(false)
  
  const availablePoses: PoseData[] = [
    { type: 'front', title: 'หน้าตรง', instruction: 'มองตรงเข้ากล้อง', icon: '🧑' },
    { type: 'left', title: 'หันซ้าย', instruction: 'หันหน้าไปทางซ้าย 30 องศา', icon: '👈' },
    { type: 'right', title: 'หันขวา', instruction: 'หันหน้าไปทางขวา 30 องศา', icon: '👉' }
  ]
  
  const currentPose = availablePoses.find(p => p.type === selectedPose)

  useEffect(() => {
    if (isOpen) {
      // สุ่มเลือกท่าเมื่อเปิด modal
      const randomIndex = Math.floor(Math.random() * availablePoses.length)
      setSelectedPose(availablePoses[randomIndex].type)
      initializeFaceApi()
    } else {
      stopCamera()
      // รีเซ็ตสถานะเมื่อปิด modal
      setSelectedPose(null)
      setIsPoseVerified(false)
      setPoseProgress(0)
    }
    
    return () => {
      stopCamera()
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
      if (poseTimeoutRef.current) {
        clearTimeout(poseTimeoutRef.current)
      }
    }
  }, [isOpen])

  // เริ่มการตรวจจับท่าอย่างต่อเนื่องเมื่อสตรีมมิ่ง
  useEffect(() => {
    if (isStreaming && !isModelLoading && !isPoseVerified && selectedPose) {
      startContinuousDetection()
    } else {
      stopContinuousDetection()
    }
    
    return () => stopContinuousDetection()
  }, [isStreaming, isModelLoading, isPoseVerified, selectedPose])
  
  // ยืนยันอัตโนมัติเมื่อท่าคงที่
  useEffect(() => {
    if (!autoVerifying && !isVerifyingPose && !isPoseVerified && selectedPose) {
      const isReady = isPoseReadyForLogin(currentDetectedPose, selectedPose, poseConfidence)
      
      if (isReady) {
        setPoseStableCount((prev: number) => prev + 1)
        
        // หากท่าคงที่เป็นเวลา 10 ครั้งติดต่อกัน (~1 วินาที) ยืนยันอัตโนมัติ
        if (poseStableCount >= 10) {
          handleAutoVerify()
        }
      } else {
        setPoseStableCount(0)
      }
    }
  }, [currentDetectedPose, poseConfidence, poseStableCount, autoVerifying, isVerifyingPose, isPoseVerified, selectedPose])
  
  // ตั้งเวลาสำหรับท่าเดียว (10 วินาที)
  useEffect(() => {
    if (!isPoseVerified && !isVerifyingPose && isStreaming && !isModelLoading && selectedPose) {
      startPoseTimeout()
    }
    
    return () => {
      if (poseTimeoutRef.current) {
        clearTimeout(poseTimeoutRef.current)
      }
    }
  }, [isPoseVerified, isVerifyingPose, isStreaming, isModelLoading, selectedPose])
  
  // อัพเดตเวลาที่เหลือทุกวินาที
  useEffect(() => {
    if (poseTimeRemaining > 0 && !isPoseVerified && !isVerifyingPose && isStreaming && !isModelLoading && selectedPose) {
      const interval = setInterval(() => {
        setPoseTimeRemaining((prev: number) => {
          if (prev <= 1 && prev > 0) {
            setIsTimeoutWarning(true)
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [poseTimeRemaining, isPoseVerified, isVerifyingPose, isStreaming, isModelLoading, selectedPose])
  
  // ตรวจสอบหมดเวลา
  useEffect(() => {
    if (poseTimeRemaining <= 0 && !isPoseVerified && !isVerifyingPose) {
      handlePoseTimeout()
    }
  }, [poseTimeRemaining, isPoseVerified, isVerifyingPose])

  const initializeFaceApi = async () => {
    try {
      setIsModelLoading(true)
      await loadFaceApiModels()
      await startCamera()
    } catch (err) {
      setError('ไม่สามารถโหลดโมเดล AI ได้')
      console.error('ข้อผิดพลาดในการเริ่มต้น Face API:', err)
    } finally {
      setIsModelLoading(false)
    }
  }

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
    } catch (err: any) {
      console.error('ข้อผิดพลาดกล้อง:', err)
      
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
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      setIsStreaming(false)
    }
  }

  const startContinuousDetection = () => {
    if (detectionIntervalRef.current) return
    
    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current && !isVerifyingPose && !autoVerifying) {
        try {
          const detection = await detectFacePose(videoRef.current)
          
          if (detection.detected) {
            setCurrentDetectedPose(detection.pose)
            setPoseConfidence(detection.confidence)
            setIsBlinking(detection.isBlinking || false)
          } else {
            setCurrentDetectedPose('unknown')
            setPoseConfidence(0)
            setIsBlinking(false)
            setPoseStableCount(0)
          }
        } catch (error) {
          console.error('ข้อผิดพลาดในการตรวจจับอย่างต่อเนื่อง:', error)
        }
      }
    }, 100)
  }
  
  const stopContinuousDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
  }

  const playSuccessSound = () => {
    try {
      // สร้างเสียงเชิงบวกด้วย Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // เสียงสำหรับการยืนยันท่าสำเร็จ (ใช้โทนเดียว)
      const frequency = 659.25 // E5 - เสียงสำหรับความสำเร็จ
      
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.log('ระบบเสียงไม่ได้รับการสนับสนุนหรือถูกบล็อก')
    }
  }

  const playCompletionSound = () => {
    try {
      // ท่วงทำนอง C5, E5, G5, C6
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      const melody = [523.25, 659.25, 783.99, 1046.50]
      
      melody.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
        oscillator.type = 'sine'
        
        const startTime = audioContext.currentTime + (index * 0.2)
        gainNode.gain.setValueAtTime(0.2, startTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4)
        
        oscillator.start(startTime)
        oscillator.stop(startTime + 0.4)
      })
    } catch (error) {
      console.log('ระบบเสียงไม่ได้รับการสนับสนุนหรือถูกบล็อก')
    }
  }
  
  const startPoseTimeout = () => {
    // ล้างตัวจับเวลาเก่า
    if (poseTimeoutRef.current) {
      clearTimeout(poseTimeoutRef.current)
    }
    
    // รีเซ็ตเวลาเป็น 10 วินาที
    setPoseTimeRemaining(POSE_TIMEOUT_SECONDS)
    setIsTimeoutWarning(false)
    
    // ตั้งตัวจับเวลา 10 วินาที
    poseTimeoutRef.current = setTimeout(() => {
      handlePoseTimeout()
    }, 10000) // 10 วินาที = 10,000 มิลลิวินาที
  }
  
  const handlePoseTimeout = () => {
    setError(`หมดเวลาสำหรับท่า${currentPose?.title} กรุณาเริ่มต้นใหม่`)
    // สุ่มเลือกท่าใหม่
    handleRestart()
  }
  

  const handleAutoVerify = async () => {
    if (!videoRef.current || isVerifyingPose || autoVerifying || !selectedPose) return

    try {
      setError('')
      setIsVerifyingPose(true)
      setAutoVerifying(true)
      setPoseStableCount(0)
      
      // หยุดตัวจับเวลาเมื่อยืนยันสำเร็จ
      if (poseTimeoutRef.current) {
        clearTimeout(poseTimeoutRef.current)
      }

      setPoseProgress(100)
      
      // เล่นเสียงเมื่อยืนยันสำเร็จ
      playSuccessSound()
      
      setTimeout(() => {
        setIsPoseVerified(true)
        // เล่นเสียงเมื่อเสร็จสิ้น
        playCompletionSound()
        // ยืนยันตัวตนกับเซิร์ฟเวอร์
        handleFinalVerification()
        setIsVerifyingPose(false)
        setAutoVerifying(false)
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'ไม่สามารถยืนยันท่าได้ กรุณาลองใหม่')
      console.error('ข้อผิดพลาดในการยืนยันท่า:', err)
      setIsVerifyingPose(false)
      setAutoVerifying(false)
    }
  }

  const handleFinalVerification = async () => {
    if (!videoRef.current || !selectedPose) return

    setLoading(true)
    setError('')

    try {
      // ตรวจจับใบหน้าครั้งสุดท้าย
      const faceDescriptor = await detectFaceAndGetDescriptor(videoRef.current)
      
      // ส่งไปยืนยันกับเซิร์ฟเวอร์
      const response = await fetch('/api/auth/face-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          faceData: faceDescriptor,
          verifiedPoses: { [selectedPose]: true }, // ส่งท่าเดียวที่ยืนยันแล้ว
          singlePoseVerification: true // บอก API ว่าเป็นการยืนยันท่าเดียว
        })
      })

      const result = await response.json()

      if (response.ok && result.isMatch) {
        onSuccess()
      } else {
        setError(result.message || 'ใบหน้าไม่ตรงกับข้อมูลที่ลงทะเบียน')
        // รีเซ็ตการยืนยัน
        handleRestart()
      }

    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบ')
      handleRestart()
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = () => {
    // สุ่มเลือกท่าใหม่
    const randomIndex = Math.floor(Math.random() * availablePoses.length)
    setSelectedPose(availablePoses[randomIndex].type)
    
    setPoseProgress(0)
    setIsPoseVerified(false)
    setIsVerifyingPose(false)
    setAutoVerifying(false)
    setPoseStableCount(0)
    setCurrentDetectedPose('unknown')
    setPoseConfidence(0)
    
    // รีเซ็ตตัวจับเวลา
    if (poseTimeoutRef.current) {
      clearTimeout(poseTimeoutRef.current)
    }
    setPoseTimeRemaining(POSE_TIMEOUT_SECONDS)
    setIsTimeoutWarning(false)
    
    // เริ่มตัวจับเวลาใหม่
    if (isStreaming && !isModelLoading) {
      startPoseTimeout()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <Card className="p-8 w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">ยืนยันตัวตนด้วยใบหน้า</h2>
          <p className="text-lg text-gray-600 font-semibold mt-2">
            {isPoseVerified ? 'ยืนยันสำเร็จ' : currentPose ? `${currentPose.title}` : 'กำลังเตรียมท่า...'}
          </p>
        </div>

        <LoadingIndicator isModelLoading={isModelLoading} />

        <VideoDisplay 
          ref={videoRef}
          isStreaming={isStreaming}
          isModelLoading={isModelLoading}
          currentDetectedPose={currentDetectedPose}
          currentPose={currentPose}
          poseConfidence={poseConfidence}
        />

        <PoseInstructionPanel 
          isPoseVerified={isPoseVerified}
          currentPose={currentPose}
          poseTimeRemaining={poseTimeRemaining}
          isTimeoutWarning={isTimeoutWarning}
          poseProgress={poseProgress}
        />

        <div className="space-y-3">
          <StatusDisplay 
            isPoseVerified={isPoseVerified}
            selectedPose={selectedPose}
            loading={loading}
          />
        </div>
      </Card>
    </div>
  )
}