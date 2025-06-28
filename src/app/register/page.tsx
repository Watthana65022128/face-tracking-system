// app/register/page.tsx
'use client'
import { useState } from 'react'
import { AuthForm } from '@/app/components/auth/AuthForm'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)

  const handleRegister = async (data: any) => {
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
          studentId: data.studentId
        })
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response data:', result)

      if (response.ok) {
        // สำเร็จ - บันทึกข้อมูล user และไปหน้าลงทะเบียนใบหน้า
        if (result.user) {
          localStorage.setItem('tempUserId', result.user.id)
          localStorage.setItem('tempUser', JSON.stringify(result.user))
        }
        
        alert('สมัครสมาชิกสำเร็จ! กรุณาลงทะเบียนใบหน้าเพื่อเพิ่มความปลอดภัย')
        
        // Redirect ไปหน้าลงทะเบียนใบหน้า
        window.location.href = '/face-register'
        
      } else {
        // มี error
        alert(result.error || 'เกิดข้อผิดพลาด')
      }
      
    } catch (error) {
      console.error('Registration error:', error)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
      <AuthForm type="register" onSubmit={handleRegister} loading={loading} />
    </div>
  )
}