'use client'
import { useRef, useEffect, useState } from 'react'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { loadFaceApiModels, detectFacePose, isPoseReadyForLogin, detectFaceAndGetDescriptor } from '@/lib/face-api'

interface FaceLoginProps {
  isOpen: boolean
  userId: string
  onSuccess: () => void
  onCancel: () => void
}

type PoseType = 'front' | 'left' | 'right';

interface PoseData {
  type: PoseType;
  title: string;
  instruction: string;
  icon: string;
}

export function FaceLogin({ isOpen, userId, onSuccess, onCancel }: FaceLoginProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const poseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // สถานะพื้นฐาน
  const [isStreaming, setIsStreaming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isModelLoading, setIsModelLoading] = useState(true)
  
  // สถานะการยืนยัน 4 ท่า
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0)
  const [verifiedPoses, setVerifiedPoses] = useState<{ [key in PoseType]?: boolean }>({})
  const [isVerifyingPose, setIsVerifyingPose] = useState(false)
  const [poseProgress, setPoseProgress] = useState(0)
  const [isAllPosesVerified, setIsAllPosesVerified] = useState(false)
  
  // สถานะการตรวจจับแบบเรียลไทม์
  const [currentDetectedPose, setCurrentDetectedPose] = useState<'front' | 'left' | 'right' | 'unknown'>('unknown')
  const [poseConfidence, setPoseConfidence] = useState(0)
  const [poseStableCount, setPoseStableCount] = useState(0)
  const [isBlinking, setIsBlinking] = useState(false)
  const [autoVerifying, setAutoVerifying] = useState(false)
  
  // สถานะหมดเวลา (10 วินาที)
  const [poseTimeRemaining, setPoseTimeRemaining] = useState(10)
  const [isTimeoutWarning, setIsTimeoutWarning] = useState(false)
  
  const poses: PoseData[] = [
    { type: 'front', title: 'หน้าตรง', instruction: 'มองตรงเข้ากล้อง', icon: '🧑' },
    { type: 'left', title: 'หันซ้าย', instruction: 'หันหน้าไปทางซ้าย 30 องศา', icon: '👈' },
    { type: 'right', title: 'หันขวา', instruction: 'หันหน้าไปทางขวา 30 องศา', icon: '👉' }
  ]
  
  const currentPose = poses[currentPoseIndex]

  useEffect(() => {
    if (isOpen) {
      initializeFaceApi()
    } else {
      stopCamera()
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
    if (isStreaming && !isModelLoading && !isAllPosesVerified) {
      startContinuousDetection()
    } else {
      stopContinuousDetection()
    }
    
    return () => stopContinuousDetection()
  }, [isStreaming, isModelLoading, isAllPosesVerified])
  
  // ยืนยันอัตโนมัติเมื่อท่าคงที่
  useEffect(() => {
    if (!autoVerifying && !isVerifyingPose && !isAllPosesVerified) {
      const targetPose = currentPose.type
      const isReady = isPoseReadyForLogin(currentDetectedPose, targetPose, poseConfidence)
      
      if (isReady) {
        setPoseStableCount(prev => prev + 1)
        
        // หากท่าคงที่เป็นเวลา 10 ครั้งติดต่อกัน (~1 วินาที) ยืนยันอัตโนมัติ
        if (poseStableCount >= 10) {
          handleAutoVerify()
        }
      } else {
        setPoseStableCount(0)
      }
    }
  }, [currentDetectedPose, poseConfidence, isBlinking, poseStableCount, autoVerifying, isVerifyingPose, isAllPosesVerified])
  
  // ตั้งเวลาสำหรับแต่ละท่า (10 วินาที)
  useEffect(() => {
    if (!isAllPosesVerified && !isVerifyingPose && isStreaming && !isModelLoading) {
      startPoseTimeout()
    }
    
    return () => {
      if (poseTimeoutRef.current) {
        clearTimeout(poseTimeoutRef.current)
      }
    }
  }, [currentPoseIndex, isAllPosesVerified, isVerifyingPose, isStreaming, isModelLoading])
  
  // อัพเดตเวลาที่เหลือทุกวินาที
  useEffect(() => {
    if (poseTimeRemaining > 0 && !isAllPosesVerified && !isVerifyingPose && isStreaming && !isModelLoading) {
      const interval = setInterval(() => {
        setPoseTimeRemaining(prev => {
          if (prev <= 1 && prev > 0) {
            setIsTimeoutWarning(true)
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [poseTimeRemaining, isAllPosesVerified, isVerifyingPose, isStreaming, isModelLoading])
  
  // ตรวจสอบหมดเวลา
  useEffect(() => {
    if (poseTimeRemaining <= 0 && !isAllPosesVerified && !isVerifyingPose) {
      handlePoseTimeout()
    }
  }, [poseTimeRemaining, isAllPosesVerified, isVerifyingPose])

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
      
      // โนตดนตรี C5, D5, E5, F5
      const frequencies = [523.25, 587.33, 659.25, 698.46]
      const frequency = frequencies[currentPoseIndex] || 523.25
      
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
    setPoseTimeRemaining(10)
    setIsTimeoutWarning(false)
    
    // ตั้งตัวจับเวลา 10 วินาที
    poseTimeoutRef.current = setTimeout(() => {
      handlePoseTimeout()
    }, 10000) // 10 วินาที = 10,000 มิลลิวินาที
  }
  
  const handlePoseTimeout = () => {
    setError(`หมดเวลาสำหรับท่า${currentPose.title} กรุณาเริ่มต้นใหม่`)
    // รีเซ็ตกลับไปท่าแรก
    handleRestart()
  }
  
  const formatTime = (seconds: number) => {
    return `${seconds}s`
  }

  const handleAutoVerify = async () => {
    if (!videoRef.current || isVerifyingPose || autoVerifying) return

    try {
      setError('')
      setIsVerifyingPose(true)
      setAutoVerifying(true)
      setPoseStableCount(0)
      
      // หยุดตัวจับเวลาเมื่อยืนยันสำเร็จ
      if (poseTimeoutRef.current) {
        clearTimeout(poseTimeoutRef.current)
      }

      // ยืนยันท่าปัจจุบัน
      const newVerifiedPoses = {
        ...verifiedPoses,
        [currentPose.type]: true
      }
      setVerifiedPoses(newVerifiedPoses)

      setPoseProgress(100)
      
      // เล่นเสียงเมื่อยืนยันสำเร็จ
      playSuccessSound()
      
      setTimeout(() => {
        if (currentPoseIndex < poses.length - 1) {
          setCurrentPoseIndex(prev => prev + 1)
          setPoseProgress(0)
          // เริ่มตัวจับเวลาใหม่สำหรับท่าถัดไป
          startPoseTimeout()
        } else {
          setIsAllPosesVerified(true)
          // เล่นเสียงเมื่อเสร็จสิ้นทั้งหมด
          playCompletionSound()
          // ยืนยันตัวตนกับเซิร์ฟเวอร์
          handleFinalVerification(newVerifiedPoses)
        }
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

  const handleFinalVerification = async (verifiedPoses: any) => {
    if (!videoRef.current) return

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
          verifiedPoses // ส่งข้อมูลท่าที่ยืนยันแล้ว
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
    setCurrentPoseIndex(0)
    setVerifiedPoses({})
    setPoseProgress(0)
    setIsAllPosesVerified(false)
    setIsVerifyingPose(false)
    setAutoVerifying(false)
    setPoseStableCount(0)
    setCurrentDetectedPose('unknown')
    setPoseConfidence(0)
    
    // รีเซ็ตตัวจับเวลา
    if (poseTimeoutRef.current) {
      clearTimeout(poseTimeoutRef.current)
    }
    setPoseTimeRemaining(10)
    setIsTimeoutWarning(false)
    
    // เริ่มตัวจับเวลาใหม่
    if (isStreaming && !isModelLoading) {
      startPoseTimeout()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0  flex items-center justify-center z-50 p-4">
      <Card className="p-8 w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">ยืนยันตัวตนด้วยใบหน้า</h2>
          <p className="text-lg text-gray-600 font-semibold mt-2">
            {isAllPosesVerified ? 'ยืนยันสำเร็จ' : `${currentPose.title} (${currentPoseIndex + 1}/${poses.length})`}
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

        <div className="relative mb-6">
          <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            
            {isStreaming && !isModelLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`border-4 rounded-full w-48 h-60 transition-colors duration-300 ${
                  isPoseReadyForLogin(currentDetectedPose, currentPose.type, poseConfidence)
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

        {/* คำแนะนำท่าปัจจุบัน */}
        {!isAllPosesVerified && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{currentPose.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-800">{currentPose.title}</h3>
                  <p className="text-sm text-gray-600">{currentPose.instruction}</p>
                </div>
              </div>
              
              {/* แสดงเวลาที่เหลือ */}
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                isTimeoutWarning 
                  ? 'bg-red-100 text-red-800 animate-pulse' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                ⏱️ {formatTime(poseTimeRemaining)}
              </div>
            </div>
            
            {/* คำเตือนเมื่อเวลาใกล้หมด */}
            {isTimeoutWarning && (
              <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                ⚠️ เวลาใกล้หมด! กรุณาทำท่าให้ถูกต้อง
              </div>
            )}
            
            {/* แถบความคืบหน้า */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${poseProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* แสดงท่าที่ยืนยันแล้ว */}
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-2">
            {poses.map((pose, index) => (
              <div key={pose.type} className={`p-3 rounded-lg text-center transition-all ${
                verifiedPoses[pose.type] 
                  ? 'bg-green-100 border-2 border-green-300' 
                  : index === currentPoseIndex 
                    ? 'bg-purple-100 border-2 border-purple-300'
                    : 'bg-gray-100 border-2 border-gray-200'
              }`}>
                <div className="text-xl mb-1">{pose.icon}</div>
                <div className="text-xs font-semibold">{pose.title}</div>
                {verifiedPoses[pose.type] && (
                  <div className="text-green-600 text-lg">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {isAllPosesVerified ? (
            <div className="text-center">
              <div className="text-green-600 text-4xl mb-2">✓</div>
              <p className="text-green-600 font-semibold">
                {loading ? 'กำลังยืนยันตัวตน...' : 'ยืนยันท่าครบทั้ง 3 ท่าแล้ว'}
              </p>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-gray-600">
                ระบบจะยืนยันอัตโนมัติเมื่อท่าถูกต้อง
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}