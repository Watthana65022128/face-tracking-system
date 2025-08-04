'use client'
import { useState } from 'react'
import { AuthForm } from '@/app/components/auth/AuthForm'
import { FaceCapture } from '@/app/components/auth/FaceCapture'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [showFaceCapture, setShowFaceCapture] = useState(false)
  interface UserData {
    id?: string;
    email: string;
    password: string;
    title: string;
    firstName: string;
    lastName: string;
    studentId?: string;
    phoneNumber?: string;
  }
  
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)

  const handleRegister = async (data: UserData) => {
    setLoading(true)
    
    try {
      console.log('Sending registration data:', data)
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          studentId: data.studentId,
          title: data.title,
          phoneNumber: data.phoneNumber
        })
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response data:', result)

      if (response.ok) {
        // สำเร็จ - บันทึกข้อมูลผู้ใช้และไปหน้าลงทะเบียนใบหน้า
        if (result.user) {
          setUserData(result.user)
          localStorage.setItem('tempUserId', result.user.id)
          localStorage.setItem('tempUser', JSON.stringify(result.user))
        }
        
        toast.success('สมัครสมาชิกสำเร็จ กรุณาลงทะเบียนใบหน้าเพื่อเพิ่มความปลอดภัย')
        
        // แสดงคำแนะนำและหน้าลงทะเบียนใบหน้าหลังจาก 2 วินาที
        setTimeout(() => {
          setShowInstructions(true)
          setShowFaceCapture(true)
        }, 2000)
        
      } else {
        // มีข้อผิดพลาด
        toast.error(result.error || 'เกิดข้อผิดพลาด')
      }
      
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต')
    } finally {
      setLoading(false)
    }
  }

  // ฟังก์ชันสำหรับจัดการการจับภาพใบหน้า
  const handleFaceCapture = async (faceDescriptors: { front: number[], left: number[], right: number[], blink: number[] }) => {
    if (!userData) return
    
    setLoading(true)
    
    try {
      console.log('Saving multi-pose face data for user:', userData.email)
      console.log('Captured poses:', Object.keys(faceDescriptors))
      
      const response = await fetch('/api/auth/face-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userData.id,
          faceData: faceDescriptors
        })
      })

      const result = await response.json()

      if (response.ok) {
        // สำเร็จ - ลบข้อมูลชั่วคราวและไปหน้าเข้าสู่ระบบ
        localStorage.removeItem('tempUserId')
        localStorage.removeItem('tempUser')
        
        toast.success('ลงทะเบียนใบหน้าสำเร็จ!')
        
        // เปลี่ยนไปหน้าเข้าสู่ระบบหลังจาก 2 วินาที
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
        
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลใบหน้า')
      }
      
    } catch (error) {
      console.error('Face registration error:', error)
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setLoading(false)
    }
  }

  // ถ้าแสดงหน้าลงทะเบียนใบหน้า
  if (showFaceCapture && userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* ข้อความต้อนรับ */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              ยินดีต้อนรับคุณ {userData.firstName}
            </h1>
            <p className="text-gray-600">
              กรุณาลงทะเบียนใบหน้าเพื่อเพิ่มความปลอดภัยในการเข้าสู่ระบบ
            </p>
          </div>

          {/* คอมโพเนนต์จับภาพใบหน้า - แสดงเฉพาะเมื่อปิดคำแนะนำแล้ว */}
          {!showInstructions && (
            <FaceCapture onCapture={handleFaceCapture} loading={loading} />
          )}

          {/* โมดอลคำแนะนำแบบป๊อปอัพ */}
          {showInstructions && (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">คำแนะนำก่อนลงทะเบียนใบหน้า</h2>
                  <p className="text-gray-600 text-sm">กรุณาอ่านคำแนะนำต่อไปนี้ก่อนเริ่มลงทะเบียนใบหน้า</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
                    <div>
                      <p className="font-medium text-gray-800">แสงและเงา</p>
                      <p className="text-sm text-gray-600">โปรดหลีกเลี่ยงแสงและเงาที่มีผลกระทบต่อการตรวจจับ</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
                    <div>
                      <p className="font-medium text-gray-800">เตรียมตัว</p>
                      <p className="text-sm text-gray-600">ถอดแว่นตา ถอดหมวก ถอดสิ่งปิดบังใบหน้า</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
                    <div>
                      <p className="font-medium text-gray-800">ตำแหน่ง</p>
                      <p className="text-sm text-gray-600">จัดตำแหน่งใบหน้าให้อยู่ในขอบเขตที่ปรากฏบนหน้าจอ</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</div>
                    <div>
                      <p className="font-medium text-gray-800">ทำตามคำแนะนำ</p>
                      <p className="text-sm text-gray-600">ระบบจะสั่งให้หันหน้าไปทางซ้าย-ขวา และกะพริบตา</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg mb-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-800">พร้อมแล้ว? กดปุ่ม &quot;เริ่มลงทะเบียน&quot; เพื่อดำเนินการต่อ</p>
                  </div>
                </div>

                <div className="flex space-x-3 hover:cursor-pointer"> 
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    เริ่มลงทะเบียน
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // หน้าลงทะเบียนปกติ
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
      <AuthForm type="register" onSubmit={handleRegister} loading={loading} />
    </div>
  )
}