'use client'
import { useState } from 'react'
import { AuthForm } from '@/app/components/auth/AuthForm'
import { FaceLogin } from '@/app/components/auth/FaceLogin'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showFaceVerification, setShowFaceVerification] = useState(false)
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }
  
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentToken, setCurrentToken] = useState<string>('')
  const [error, setError] = useState('')

  interface LoginData {
    email: string;
    password: string;
  }
  
  const handleLogin = async (data: LoginData) => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        // ขั้นตอนที่ 1: อีเมล/รหัสผ่านถูกต้อง - ตรวจสอบใบหน้าต่อไป
        setCurrentUser(result.user)
        setCurrentToken(result.token)
        setShowFaceVerification(true)
        toast.success(`ยินดีต้อนรับคุณ ${result.user.firstName} กรุณายืนยันตัวตนด้วยใบหน้า`)
      } else {
        // จัดการกรณีข้อผิดพลาดต่าง ๆ
        if (response.status === 401) {
          setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
        } else if (response.status === 404) {
          setError('ไม่พบบัญชีผู้ใช้นี้ กรุณาตรวจสอบอีเมล')
          toast.error('ไม่พบบัญชีผู้ใช้นี้ กรุณาตรวจสอบอีเมล')
        } else {
          setError(result.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
          toast.error(result.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ต'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleFaceVerificationSuccess = () => {
    // ขั้นตอนที่ 2: ตรวจสอบใบหน้าสำเร็จ - เสร็จสิ้นการเข้าสู่ระบบ
    if (currentUser) {
      localStorage.setItem('user', JSON.stringify(currentUser))
      localStorage.setItem('token', currentToken)
      
      toast.success('เข้าสู่ระบบสำเร็จ')
      
      setTimeout(() => {
        window.location.href = '/tracking'
      }, 1500)
    }
  }

  const handleFaceVerificationCancel = () => {
    setShowFaceVerification(false)
    setCurrentUser(null)
    setCurrentToken('')
    toast.error('การยืนยันตัวตนถูกยกเลิก กรุณาลองใหม่อีกครั้ง')
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AuthForm type="login" onSubmit={handleLogin} loading={loading} />
          
          {/* ข้อความแจ้งข้อผิดพลาด */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <FaceLogin
        isOpen={showFaceVerification}
        userId={currentUser?.id || ''}
        onSuccess={handleFaceVerificationSuccess}
        onCancel={handleFaceVerificationCancel}
      />
    </>
  )
}