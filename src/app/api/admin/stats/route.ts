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

    // ดึงข้อมูลพฤติกรรมสำหรับกราฟ
    const behaviorStats = await prisma.trackingLog.findMany({
      where: {
        detectionType: 'FACE_ORIENTATION'
      },
      select: {
        detectionData: true
      }
    })

    console.log('Behavior stats found:', behaviorStats.length)
    console.log('First 3 behavior records:', behaviorStats.slice(0, 3))
    
    // นับ direction ต่าง ๆ ทั้งหมด
    const directionCount: Record<string, number> = {}
    behaviorStats.forEach(log => {
      if (log.detectionData && typeof log.detectionData === 'object') {
        const data = log.detectionData as Record<string, unknown>
        const direction = data.direction as string
        directionCount[direction] = (directionCount[direction] || 0) + 1
      }
    })
    console.log('Direction counts in data:', directionCount)

    // วิเคราะห์ข้อมูลพฤติกรรม
    const behaviorCounts = {
      leftTurn: { count: 0, totalTime: 0 },
      rightTurn: { count: 0, totalTime: 0 },
      lookDown: { count: 0, totalTime: 0 },
      lookUp: { count: 0, totalTime: 0 },
      faceLoss: { count: 0, totalTime: 0 }
    }

    // นับข้อมูลการสูญเสียใบหน้า
    const faceLossStats = await prisma.trackingLog.findMany({
      where: {
        detectionType: 'FACE_DETECTION_LOSS'
      },
      select: {
        detectionData: true
      }
    })

    console.log('Face loss stats found:', faceLossStats.length)
    console.log('First 3 face loss records:', faceLossStats.slice(0, 3))

    // วิเคราะห์ข้อมูลการสูญเสียใบหน้า
    faceLossStats.forEach(log => {
      if (log.detectionData && typeof log.detectionData === 'object') {
        const data = log.detectionData as Record<string, unknown>
        behaviorCounts.faceLoss.count += 1
        if (data.duration && typeof data.duration === 'string') {
          behaviorCounts.faceLoss.totalTime += parseFloat(data.duration) || 0
        } else if (data.duration && typeof data.duration === 'number') {
          behaviorCounts.faceLoss.totalTime += data.duration || 0
        }
      }
    })

    // วิเคราะห์ข้อมูลการหันหน้า
    behaviorStats.forEach(log => {
      if (log.detectionData && typeof log.detectionData === 'object') {
        const data = log.detectionData as Record<string, unknown>
        const direction = data.direction as string

        console.log('Processing direction:', direction, 'with duration:', data.duration)
        
        switch (direction) {
          case 'LEFT':
          case 'หันซ้าย':
            behaviorCounts.leftTurn.count += 1
            if (data.duration && typeof data.duration === 'string') {
              behaviorCounts.leftTurn.totalTime += parseFloat(data.duration) || 0
            } else if (data.duration && typeof data.duration === 'number') {
              behaviorCounts.leftTurn.totalTime += data.duration || 0
            }
            console.log('LEFT processed, new count:', behaviorCounts.leftTurn.count)
            break
          case 'RIGHT':
          case 'หันขวา':
            behaviorCounts.rightTurn.count += 1
            if (data.duration && typeof data.duration === 'string') {
              behaviorCounts.rightTurn.totalTime += parseFloat(data.duration) || 0
            } else if (data.duration && typeof data.duration === 'number') {
              behaviorCounts.rightTurn.totalTime += data.duration || 0
            }
            console.log('RIGHT processed, new count:', behaviorCounts.rightTurn.count)
            break
          case 'DOWN':
          case 'ก้มหน้า':
            behaviorCounts.lookDown.count += 1
            if (data.duration && typeof data.duration === 'string') {
              behaviorCounts.lookDown.totalTime += parseFloat(data.duration) || 0
            } else if (data.duration && typeof data.duration === 'number') {
              behaviorCounts.lookDown.totalTime += data.duration || 0
            }
            console.log('DOWN processed, new count:', behaviorCounts.lookDown.count)
            break
          case 'UP':
          case 'เงยหน้า':
            behaviorCounts.lookUp.count += 1
            if (data.duration && typeof data.duration === 'string') {
              behaviorCounts.lookUp.totalTime += parseFloat(data.duration) || 0
            } else if (data.duration && typeof data.duration === 'number') {
              behaviorCounts.lookUp.totalTime += data.duration || 0
            }
            console.log('UP processed, new count:', behaviorCounts.lookUp.count)
            break
        }
      }
    })

    // เตรียมข้อมูลกราฟ
    const chartData = [
      {
        behavior: 'หันซ้าย',
        count: behaviorCounts.leftTurn.count,
        totalTime: Math.round(behaviorCounts.leftTurn.totalTime * 10) / 10,
        color: '#3b82f6',
        lightColor: '#93c5fd'
      },
      {
        behavior: 'หันขวา',
        count: behaviorCounts.rightTurn.count,
        totalTime: Math.round(behaviorCounts.rightTurn.totalTime * 10) / 10,
        color: '#22c55e',
        lightColor: '#86efac'
      },
      {
        behavior: 'ก้มหน้า',
        count: behaviorCounts.lookDown.count,
        totalTime: Math.round(behaviorCounts.lookDown.totalTime * 10) / 10,
        color: '#f97316',
        lightColor: '#fed7aa'
      },
      {
        behavior: 'เงยหน้า',
        count: behaviorCounts.lookUp.count,
        totalTime: Math.round(behaviorCounts.lookUp.totalTime * 10) / 10,
        color: '#a855f7',
        lightColor: '#d8b4fe'
      },
      {
        behavior: 'สูญเสียใบหน้า',
        count: behaviorCounts.faceLoss.count,
        totalTime: Math.round(behaviorCounts.faceLoss.totalTime * 10) / 10,
        color: '#ef4444',
        lightColor: '#fca5a5'
      }
    ]

    console.log('Final chart data:', chartData)
    console.log('Behavior counts processed:', behaviorCounts)

    return NextResponse.json({
      totalUsers,
      totalAdmins,
      totalSessions,
      activeSessions,
      chartData
    })

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}