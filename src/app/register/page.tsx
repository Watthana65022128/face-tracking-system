'use client'
import { useState } from 'react'
import { AuthForm } from '@/app/components/auth/AuthForm'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)

  const handleRegister = async (data: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        // Success - redirect to face registration
        window.location.href = '/login'
      } else {
        alert(result.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
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