'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import { AdminLogoutConfirmation } from '@/app/components/ui/AdminLogoutConfirmation'
import { AdminSidebar } from '@/app/components/admin/AdminSidebar'
import { formatThaiDateTime } from '@/lib/utils/datetime'

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

interface TrackingLog {
  id: string
  sessionId: string
  detectionType: string
  detectionData: any
  confidence: number | null
  timestamp?: string
}

interface SessionDetail {
  session: TrackingSession
  logs: TrackingLog[]
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
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [sessions, setSessions] = useState<TrackingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<string>('overview')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null)
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

  const formatDate = (dateInput: string | Date) => {
    try {
      let date: Date
      
      if (typeof dateInput === 'string') {
        date = new Date(dateInput)
      } else if (dateInput instanceof Date) {
        date = dateInput
      } else {
        console.warn('Invalid date input:', dateInput)
        return String(dateInput)
      }
      
      // ตรวจสอบว่าวันที่ valid หรือไม่
      if (isNaN(date.getTime())) {
        console.warn('Invalid date after parsing:', dateInput)
        return String(dateInput)
      }
      
      // ใช้ฟังก์ชันจาก datetime.ts ที่แก้ไขแล้ว
      const formatted = formatThaiDateTime(date).replace(' ', ', ')
      
      console.log('Date formatting:', {
        input: dateInput,
        parsed: date.toISOString(),
        formatted: formatted
      })
      
      return formatted
    } catch (error) {
      console.error('Date formatting error:', error, 'Input:', dateInput)
      return String(dateInput)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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

  const getDetectionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'FACE_ORIENTATION': 'การเปลี่ยนทิศทางใบหน้า',
      'FACE_DETECTION_LOSS': 'การสูญเสียการตรวจจับใบหน้า'
    }
    return labels[type] || type
  }

  const getDetectionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'FACE_ORIENTATION': 'bg-blue-100 text-blue-800',
      'FACE_DETECTION_LOSS': 'bg-red-100 text-red-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getDirectionLabel = (direction: string) => {
    const labels: Record<string, string> = {
      'UP': 'เงยหน้า',
      'DOWN': 'ก้มหน้า', 
      'LEFT': 'หันซ้าย',
      'RIGHT': 'หันขวา',
      'FORWARD': 'มองหน้าตรง'
    }
    return labels[direction] || direction
  }

  const getDirectionColor = (direction: string) => {
    const colors: Record<string, string> = {
      'UP': 'bg-purple-100 text-purple-800',
      'DOWN': 'bg-yellow-100 text-yellow-800',
      'LEFT': 'bg-orange-100 text-orange-800', 
      'RIGHT': 'bg-pink-100 text-pink-800',
      'FORWARD': 'bg-green-100 text-green-800'
    }
    return colors[direction] || 'bg-gray-100 text-gray-800'
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">ผู้ใช้ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">ผู้ดูแลระบบ</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAdmins}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">เซสชันทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Users Page */}
        {currentPage === 'users' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">รายการผู้ใช้งาน</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อีเมล</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสนักศึกษา</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สิทธิ์</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เบอร์โทร</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่สมัคร</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.studentId || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phoneNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Sessions Page - List View */}
        {currentPage === 'sessions' && !selectedSessionId && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">รายการเซสชัน</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อเซสชัน</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้ใช้</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เริ่มต้น</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สิ้นสุด</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ระยะเวลา</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การกระทำ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {session.sessionName || 'ไม่ระบุชื่อ'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.user.firstName} {session.user.lastName}
                        <br />
                        <span className="text-xs text-gray-400">{session.user.email}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(session.startTime)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.endTime ? formatDate(session.endTime) : 'กำลังดำเนินการ'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDuration(session.totalDuration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          session.endTime ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {session.endTime ? 'เสร็จสิ้น' : 'กำลังดำเนินการ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          onClick={() => handleSessionClick(session.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                        >
                          ดู Logs
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Session Detail Page */}
        {currentPage === 'sessions' && selectedSessionId && (
          <div className="space-y-6">
            {sessionDetailLoading ? (
              <Card className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
              </Card>
            ) : sessionDetail ? (
              <>
                {/* Header with Back Button */}
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleBackToSessions}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>กลับไปรายการเซสชัน</span>
                  </Button>
                </div>

                {/* Session Info Card */}
                <Card className="p-3.5 ">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลเซสชัน</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">ผู้ใช้</p>
                      <p className="font-medium">
                        {sessionDetail.session.user.firstName} {sessionDetail.session.user.lastName}
                      </p>
          
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">เริ่มต้น</p>
                      <p className="font-medium">{formatDate(sessionDetail.session.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">สิ้นสุด</p>
                      <p className="font-medium">
                        {sessionDetail.session.endTime ? formatDate(sessionDetail.session.endTime) : 'กำลังดำเนินการ'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ระยะเวลา</p>
                      <p className="font-medium">{formatDuration(sessionDetail.session.totalDuration)}</p>
                    </div>
                  </div>
                </Card>

                {/* Statistics Card */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">สถิติการตรวจจับ(ครั้ง)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{sessionDetail.stats.totalLogs}</p>
                      <p className="text-sm text-gray-600">รวมทั้งหมด</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{sessionDetail.stats.faceOrientationCount}</p>
                      <p className="text-sm text-gray-600">การเปลี่ยนทิศทาง</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{sessionDetail.stats.faceDetectionLossCount}</p>
                      <p className="text-sm text-gray-600">สูญเสียการตรวจจับ</p>
                    </div>
                  </div>
                  
                  {/* Direction Statistics */}
                  <h4 className="text-md font-semibold text-gray-900 mb-3">สถิติพฤติกรรม</h4>
                  <div className="flex flex-wrap gap-3">
                    <div className="text-center p-3 bg-purple-50 rounded-lg flex-1 min-w-[120px]">
                      <p className="text-xl font-bold text-purple-600">{sessionDetail.stats.directionCounts.UP}</p>
                      <p className="text-xs text-gray-600">เงยหน้า</p>
                      <p className="text-xs text-purple-600 font-semibold">{sessionDetail.stats.directionDurations.UP}s</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg flex-1 min-w-[120px]">
                      <p className="text-xl font-bold text-yellow-600">{sessionDetail.stats.directionCounts.DOWN}</p>
                      <p className="text-xs text-gray-600">ก้มหน้า</p>
                      <p className="text-xs text-yellow-600 font-semibold">{sessionDetail.stats.directionDurations.DOWN}s</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg flex-1 min-w-[120px]">
                      <p className="text-xl font-bold text-orange-600">{sessionDetail.stats.directionCounts.LEFT}</p>
                      <p className="text-xs text-gray-600">หันซ้าย</p>
                      <p className="text-xs text-orange-600 font-semibold">{sessionDetail.stats.directionDurations.LEFT}s</p>
                    </div>
                    <div className="text-center p-3 bg-pink-50 rounded-lg flex-1 min-w-[120px]">
                      <p className="text-xl font-bold text-pink-600">{sessionDetail.stats.directionCounts.RIGHT}</p>
                      <p className="text-xs text-gray-600">หันขวา</p>
                      <p className="text-xs text-pink-600 font-semibold">{sessionDetail.stats.directionDurations.RIGHT}s</p>
                    </div>
                    
                    {/* Total Behavior Duration - ในแถวเดียวกัน */}
                    <div className="text-center p-3 bg-indigo-50 rounded-lg flex-1 min-w-[120px]">
                      <p className="text-xl font-bold text-indigo-600">{sessionDetail.stats.totalBehaviorDuration}s</p>
                      <p className="text-xs text-gray-600">รวมเวลาทั้งหมด</p>
                    </div>
                  </div>
                </Card>

                {/* Logs Table */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">รายการ Detection Logs</h3>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เวลา</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภทการตรวจจับ</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ความมั่นใจ</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ทิศทาง/ข้อมูลเพิ่มเติม</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sessionDetail.logs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.detectionData?.startTime || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                getDetectionTypeColor(log.detectionType)
                              }`}>
                                {getDetectionTypeLabel(log.detectionType)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.confidence ? `${(log.confidence * 100).toFixed(1)}%` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {log.detectionData && typeof log.detectionData === 'object' ? (
                                <div className="space-y-1">
                                  {log.detectionData.direction && (
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      getDirectionColor(log.detectionData.direction)
                                    }`}>
                                      {getDirectionLabel(log.detectionData.direction)}
                                    </span>
                                  )}
                                  <div className="text-xs text-gray-400 mt-1">
                                    {log.detectionData.startTime && log.detectionData.endTime && (
                                      <div>เวลา: {log.detectionData.startTime} - {log.detectionData.endTime}</div>
                                    )}
                                    {log.detectionData.duration && (
                                      <div>ระยะเวลา: {log.detectionData.duration}s</div>
                                    )}
                                    {log.detectionData.maxYaw && (
                                      <div>Yaw: {log.detectionData.maxYaw.toFixed(1)}°</div>
                                    )}
                                    {log.detectionData.maxPitch && (
                                      <div>Pitch: {log.detectionData.maxPitch.toFixed(1)}°</div>
                                    )}
                                  </div>
                                </div>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-600">ไม่สามารถโหลดข้อมูลได้</p>
              </Card>
            )}
          </div>
        )}

        {/* Real-time Tracking Page */}
        {currentPage === 'realtime' && (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-purple-100 rounded-full">
                <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Real-time Tracking</h3>
              <p className="text-gray-600 max-w-md">
                ฟีเจอร์การติดตามแบบเรียลไทม์จะพร้อมใช้งานในเร็วๆ นี้
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  🚧 อยู่ระหว่างการพัฒนา - Coming Soon
                </p>
              </div>
            </div>
          </Card>
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
    'realtime': 'Real-time Tracking'
  }
  return titles[page] || 'Admin Dashboard'
}

function getCurrentPageDescription(page: string): string {
  const descriptions: Record<string, string> = {
    'overview': 'ภาพรวมสถิติและข้อมูลระบบ',
    'users': 'จัดการผู้ใช้งานและสิทธิ์เข้าถึง',
    'sessions': 'ติดตามเซสชันและสถิติการใช้งาน',
    'realtime': 'การติดตามแบบเรียลไทม์'
  }
  return descriptions[page] || 'ระบบจัดการสำหรับผู้ดูแลระบบ'
}