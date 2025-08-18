import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ Authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'ไม่พบ token การยืนยันตัวตน' },
        { status: 401 }
      )
    }

    const token = authorization.substring(7)

    // ตรวจสอบ JWT token
    let decoded: { userId: string; role: string }
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string; role: string }
    } catch {
      return NextResponse.json(
        { error: 'Token ไม่ถูกต้องหรือหมดอายุ' },
        { status: 401 }
      )
    }

    // ตรวจสอบสิทธิ์ admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' },
        { status: 403 }
      )
    }

    // ดึงข้อมูลสถิติ
    const [totalUsers, totalAdmins, totalSessions, activeSessions] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.trackingSession.count(),
      prisma.trackingSession.count({ where: { endTime: null } })
    ])

    return NextResponse.json({
      totalUsers,
      totalAdmins,
      totalSessions,
      activeSessions
    })

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}