'use client'
import { useState, useEffect } from 'react'
import { FaceCapture } from '@/app/components/auth/FaceCapture'

export default function FaceRegisterPage() {
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [showInstructions, setShowInstructions] = useState(true)

  useEffect(() => {
    // ดึงข้อมูลผู้ใช้จาก localStorage หลังจากสมัครสมาชิก
    const tempUser = localStorage.getItem('tempUser')
    const tempUserId = localStorage.getItem('tempUserId')
    
    if (tempUser && tempUserId) {
      setUserData(JSON.parse(tempUser))
    } else {
      // ถ้าไม่มีข้อมูล เปลี่ยนกลับไปหน้าลงทะเบียน
      alert('กรุณาสมัครสมาชิกก่อน')
      window.location.href = '/register'
    }
  }, [])

  const handleFaceCapture = async (faceDescriptors: { front: number[], left: number[], right: number[], blink: number[] }) => {
    if (!userData) return
    
    setLoading(true)
    
    try {
      console.log('Saving multi-pose face data for user:', userData.id)
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
          <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                  <p className="text-sm font-medium text-gray-800">พร้อมแล้ว? กดปุ่ม "เริ่มลงทะเบียน" เพื่อดำเนินการต่อ</p>
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