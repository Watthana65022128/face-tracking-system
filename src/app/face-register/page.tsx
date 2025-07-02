'use client'
import { useState, useEffect } from 'react'
import { FaceCapture } from '@/app/components/auth/FaceCapture'

export default function FaceRegisterPage() {
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    // ดึงข้อมูล user จาก localStorage หลังจากสมัครสมาชิก
    const tempUser = localStorage.getItem('tempUser')
    const tempUserId = localStorage.getItem('tempUserId')
    
    if (tempUser && tempUserId) {
      setUserData(JSON.parse(tempUser))
    } else {
      // ถ้าไม่มีข้อมูล redirect กลับไปหน้า register
      alert('กรุณาสมัครสมาชิกก่อน')
      window.location.href = '/register'
    }
  }, [])

  const handleFaceCapture = async (faceDescriptor: number[]) => {
    if (!userData) return
    
    setLoading(true)
    
    try {
      console.log('Saving face data for user:', userData.id)
      
      const response = await fetch('/api/auth/face-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userData.id,
          faceData: faceDescriptor
        })
      })

      const result = await response.json()

      if (response.ok) {
        // สำเร็จ - ลบข้อมูลชั่วคราวและไปหน้า login
        localStorage.removeItem('tempUserId')
        localStorage.removeItem('tempUser')
        
        window.location.href = '/login'
        
      } else {
        alert(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลใบหน้า')
      }
      
    } catch (error) {
      console.error('Face registration error:', error)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setLoading(false)
    }
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ยินดีต้อนรับ {userData.firstName}!
          </h1>
          <p className="text-gray-600">
            กรุณาลงทะเบียนใบหน้าเพื่อเพิ่มความปลอดภัยในการเข้าสู่ระบบ
          </p>
        </div>

        {/* Face Capture Component */}
        <FaceCapture onCapture={handleFaceCapture} loading={loading} />
      </div>
    </div>
  )
}