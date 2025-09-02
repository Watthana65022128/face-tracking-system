'use client'

import { Card } from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import { formatThaiDateTime } from '@/lib/utils/datetime'

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

interface SessionsListProps {
  sessions: TrackingSession[]
  onSessionClick: (sessionId: string) => void
}

export function SessionsList({ sessions, onSessionClick }: SessionsListProps) {
  const formatDate = (dateInput: string | Date) => {
    try {
      let date: Date
      
      if (typeof dateInput === 'string') {
        date = new Date(dateInput)
      } else if (dateInput instanceof Date) {
        date = dateInput
      } else {
        return String(dateInput)
      }
      
      if (isNaN(date.getTime())) {
        return String(dateInput)
      }
      
      return formatThaiDateTime(date).replace(' ', ', ')
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

  return (
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">พฤติกรรม</th>
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
                    onClick={() => onSessionClick(session.id)}
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
  )
}