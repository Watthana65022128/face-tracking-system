'use client'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  studentId?: string
  title?: string
  phoneNumber?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (!token || !userData) {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
        return
      }

      // ตรวจสอบความถูกต้องของ token
      if (token !== 'verified') {
        clearAuth()
        toast.error('Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่')
        return
      }

      // ตรวจสอบข้อมูลผู้ใช้
      const parsedUser = JSON.parse(userData)
      if (!parsedUser.id || !parsedUser.firstName) {
        clearAuth()
        toast.error('ข้อมูลผู้ใช้ไม่ครบถ้วน กรุณาเข้าสู่ระบบใหม่')
        return
      }

      setAuthState({
        user: parsedUser,
        isLoading: false,
        isAuthenticated: true
      })

    } catch (error) {
      console.error('Auth check error:', error)
      clearAuth()
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบการเข้าสู่ระบบ')
    }
  }

  const clearAuth = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('tempUser')
    localStorage.removeItem('tempUserId')
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false
    })
  }

  const logout = () => {
    clearAuth()
    toast.success('ออกจากระบบสำเร็จ')
    window.location.href = '/login'
  }

  const requireAuth = (redirectTo: string = '/login') => {
    if (!authState.isAuthenticated && !authState.isLoading) {
      toast.error('กรุณาเข้าสู่ระบบก่อน')
      window.location.href = redirectTo
    }
  }

  return {
    ...authState,
    checkAuthStatus,
    clearAuth,
    logout,
    requireAuth
  }
}