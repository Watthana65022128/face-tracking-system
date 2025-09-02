'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLogoutConfirmation } from '@/app/components/ui/AdminLogoutConfirmation'
import { AdminSidebar } from '@/app/components/admin/AdminSidebar'
import { DashboardStats } from '@/app/components/admin/DashboardStats'
import { UsersTable } from '@/app/components/admin/UsersTable'
import { SessionsList } from '@/app/components/admin/SessionsList'
import { SessionDetail } from '@/app/components/admin/SessionDetail'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  studentId: string | null
  phoneNumber: string | null
  role: string
  isActive: boolean
  createdAt: string
}

interface TrackingSession {
  id: string
  sessionName: string | null
  startTime: string
  endTime: string | null
  totalDuration: number | null
  user: {
    firstName: string
    lastName: string
    email: string
    studentId?: string | null
  }
}

interface AdminSessionDetail {
  session: TrackingSession
  logs: Array<{
    id: string
    detectionType: string
    confidence?: number
    timestamp: string
    detectionData?: Record<string, unknown>
  }>
  stats: {
    totalLogs: number
    faceOrientationCount: number
    faceDetectionLossCount: number
    directionCounts: {
      UP: number
      DOWN: number
      LEFT: number
      RIGHT: number
      FORWARD: number
    }
    directionDurations: {
      UP: number
      DOWN: number
      LEFT: number
      RIGHT: number
      FORWARD: number
    }
    totalBehaviorDuration: number
    averageConfidence: number
  }
}

interface DashboardStats {
  totalUsers: number
  totalAdmins: number
  totalSessions: number
  activeSessions: number
  chartData?: BehaviorData[]
}

interface BehaviorData {
  behavior: string
  count: number
  totalTime: number
  color: string
  lightColor: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [sessions, setSessions] = useState<TrackingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<string>('overview')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [sessionDetail, setSessionDetail] = useState<AdminSessionDetail | null>(null)
  const [sessionDetailLoading, setSessionDetailLoading] = useState(false)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    // ตรวจสอบการเข้าสู่ระบบและสิทธิ์
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // ตรวจสอบ role จาก localStorage หรือ JWT
    try {
      const userString = localStorage.getItem('user')
      if (userString) {
        const user = JSON.parse(userString)
        if (user.role !== 'ADMIN') {
          router.push('/tracking')
          return
        }
      }
    } catch {
      router.push('/login')
      return
    }

    fetchDashboardData()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // ดึงข้อมูลสถิติ
      const [statsRes, usersRes, sessionsRes] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/sessions', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        console.log('Stats data received:', statsData)
        console.log('Chart data from API:', statsData.chartData)
        setStats(statsData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json()
        setSessions(sessionsData)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true)
  }

  const handleLogoutConfirm = () => {
    setLogoutLoading(true)
    
    // จำลองการ logout loading
    setTimeout(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setLogoutLoading(false)
      setShowLogoutConfirmation(false)
      router.push('/login')
    }, 1000)
  }

  const handleLogoutCancel = () => {
    setShowLogoutConfirmation(false)
  }

  const fetchSessionDetail = async (sessionId: string) => {
    try {
      setSessionDetailLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/admin/sessions/${sessionId}/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSessionDetail(data)
      }
    } catch (error) {
      console.error('Error fetching session detail:', error)
    } finally {
      setSessionDetailLoading(false)
    }
  }

  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    fetchSessionDetail(sessionId)
  }

  const handleBackToSessions = () => {
    setSelectedSessionId(null)
    setSessionDetail(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex">
      {/* Sidebar Navigation */}
      <AdminSidebar 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogoutClick={handleLogoutClick}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-purple-100 py-1">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getCurrentPageTitle(currentPage)}
                </h1>
                <p className="text-sm text-purple-600 mt-1">
                  {getCurrentPageDescription(currentPage)}
                </p>
              </div>
              {/* Mobile space for hamburger button */}
              <div className="lg:hidden w-10"></div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">

        {/* Overview Page */}
        {currentPage === 'overview' && stats && (
          <DashboardStats
            totalUsers={stats.totalUsers}
            totalAdmins={stats.totalAdmins}
            totalSessions={stats.totalSessions}
            activeSessions={stats.activeSessions}
            chartData={stats.chartData}
          />
        )}

        {/* Users Page */}
        {currentPage === 'users' && (
          <UsersTable users={users} />
        )}

        {/* Sessions Page - List View */}
        {currentPage === 'sessions' && !selectedSessionId && (
          <SessionsList 
            sessions={sessions}
            onSessionClick={handleSessionClick}
          />
        )}

        {/* Session Detail Page */}
        {currentPage === 'sessions' && selectedSessionId && sessionDetail && (
          <SessionDetail
            sessionDetail={sessionDetail}
            loading={sessionDetailLoading}
            onBackClick={handleBackToSessions}
          />
        )}
        </div>
      </div>

      {/* Admin Logout Confirmation Modal */}
      <AdminLogoutConfirmation
        isOpen={showLogoutConfirmation}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        loading={logoutLoading}
      />
    </div>
  )
}

// Helper functions for page titles and descriptions
function getCurrentPageTitle(page: string): string {
  const titles: Record<string, string> = {
    'overview': 'Dashboard Overview',
    'users': 'User Management',
    'sessions': 'Tracking Sessions',
  }
  return titles[page] || 'Admin Dashboard'
}

function getCurrentPageDescription(page: string): string {
  const descriptions: Record<string, string> = {
    'overview': 'ภาพรวมสถิติและข้อมูลระบบ',
    'users': 'จัดการผู้ใช้งานและสิทธิ์เข้าถึง',
    'sessions': 'ติดตามเซสชันและสถิติการใช้งาน',
  }
  return descriptions[page] || 'ระบบจัดการสำหรับผู้ดูแลระบบ'
}