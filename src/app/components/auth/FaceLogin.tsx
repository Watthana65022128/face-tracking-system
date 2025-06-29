// app/components/auth/FaceLogin.tsx
'use client'
import { useRef, useEffect, useState } from 'react'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { detectFaceAndGetDescriptor, loadFaceApiModels } from '@/lib/face-api'

interface FaceLoginProps {
  isOpen: boolean
  userId: string
  onSuccess: () => void
  onCancel: () => void
}

export function FaceLogin({ isOpen, userId, onSuccess, onCancel }: FaceLoginProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isModelLoading, setIsModelLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      initializeFaceApi()
    } else {
      stopCamera()
    }
    
    return () => stopCamera()
  }, [isOpen])

  const initializeFaceApi = async () => {
    try {
      setIsModelLoading(true)
      await loadFaceApiModels()
      await startCamera()
    } catch (err) {
      setError('ไม่สามารถโหลดโมเดล AI ได้')
    } finally {
      setIsModelLoading(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsStreaming(true)
        setError('')
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('กรุณาอนุญาตการใช้กล้อง')
      } else {
        setError('ไม่สามารถเข้าถึงกล้องได้')
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

  const handleVerify = async () => {
    if (!videoRef.current) return

    setLoading(true)
    setError('')

    try {
      // ตรวจจับใบหน้า
      const faceDescriptor = await detectFaceAndGetDescriptor(videoRef.current)
      
      // ส่งไปยืนยันกับเซิร์ฟเวอร์
      const response = await fetch('/api/auth/face-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          faceData: faceDescriptor
        })
      })

      const result = await response.json()

      if (response.ok && result.isMatch) {
        onSuccess()
      } else {
        setError(result.message || 'ใบหน้าไม่ตรงกับข้อมูลที่ลงทะเบียน')
      }

    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบ')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="p-8 w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">ยืนยันตัวตนด้วยใบหน้า</h2>
          <p className="text-gray-600 mt-2">กรุณาดูตรงกล้องเพื่อยืนยันตัวตน</p>
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
                <div className="border-2 border-purple-400 rounded-full w-48 h-48 animate-pulse" />
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

        <div className="space-y-3">
          <Button
            onClick={handleVerify}
            disabled={!isStreaming || loading || isModelLoading}
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังตรวจสอบ...
              </div>
            ) : (
              '🔍 ยืนยันตัวตน'
            )}
          </Button>

          <Button
            onClick={onCancel}
            variant="secondary"
            className="w-full"
          >
            ยกเลิก
          </Button>
        </div>
      </Card>
    </div>
  )
}