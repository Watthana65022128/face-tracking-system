'use client'
import { useState } from 'react'
import { AuthForm } from '@/app/components/auth/AuthForm'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleLogin = async (data: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        // Store token and redirect
        localStorage.setItem('token', result.token)
        localStorage.setItem('user', JSON.stringify(result.user))
        window.location.href = '/tracking'
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
      <AuthForm type="login" onSubmit={handleLogin} loading={loading} />
    </div>
  )
}