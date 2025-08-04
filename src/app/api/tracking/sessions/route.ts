import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { getThailandTime, calculateDurationInSeconds } from '@/lib/utils/datetime'

// Interface สำหรับ request body
interface CreateSessionRequest {
  sessionName: string;
}

interface EndSessionRequest {
  sessionId: string;
}

// สร้าง tracking session ใหม่
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'ไม่พบ authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let userId: string

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      userId = decoded.userId
    } catch {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    const body: CreateSessionRequest = await request.json()
    const { sessionName } = body

    if (!sessionName) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อ session' }, { status: 400 })
    }

    // สร้าง tracking session ใหม่ พร้อมเวลาไทย (UTC+7)
    const newSession = await prisma.trackingSession.create({
      data: {
        userId: userId,
        sessionName: sessionName,
        startTime: getThailandTime()
      }
    })

    console.log(`✅ สร้าง tracking session ใหม่: ${newSession.id} (${sessionName})`)
    
    return NextResponse.json({
      success: true,
      message: 'สร้าง session สำเร็จ',
      data: {
        sessionId: newSession.id,  
        sessionName: newSession.sessionName,
        startTime: newSession.startTime,
        userId: newSession.userId
      }
    })
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้าง session:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้าง session' },
      { status: 500 }
    )
  }
}

// อัปเดตหรือจบ tracking session
export async function PUT(request: NextRequest) {
  try {
    // ตรวจสอบ authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'ไม่พบ authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let userId: string

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      userId = decoded.userId
    } catch {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    const body: EndSessionRequest = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'กรุณาระบุ sessionId' }, { status: 400 })
    }

    // ตรวจสอบว่า session มีอยู่และเป็นของ user คนนี้
    const existingSession = await prisma.trackingSession.findFirst({
      where: {
        id: sessionId,
        userId: userId
      }
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'ไม่พบ session หรือไม่มีสิทธิ์เข้าถึง' }, { status: 404 })
    }

    // คำนวณระยะเวลารวมเป็นวินาที พร้อมเวลาไทย (UTC+7)  
    const endTime = getThailandTime()
    const totalDuration = calculateDurationInSeconds(existingSession.startTime, endTime)

    // อัปเดต session ให้จบ
    const updatedSession = await prisma.trackingSession.update({
      where: { id: sessionId },
      data: {
        endTime: endTime,
        totalDuration: totalDuration
      }
    })

    console.log(`✅ จบ tracking session: ${sessionId} (ระยะเวลา: ${totalDuration} วิ)`)
    
    return NextResponse.json({
      success: true,
      message: 'จบ session สำเร็จ',
      data: {
        sessionId: updatedSession.id,
        sessionName: updatedSession.sessionName,
        startTime: updatedSession.startTime,
        endTime: updatedSession.endTime,
        totalDuration: updatedSession.totalDuration,
        durationInSeconds: totalDuration
      }
    })
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการจบ session:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการจบ session' },
      { status: 500 }
    )
  }
}

// ดึงข้อมูล sessions ของ user
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'ไม่พบ authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let userId: string

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      userId = decoded.userId
    } catch {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    // ดึงข้อมูล sessions ของ user
    const sessions = await prisma.trackingSession.findMany({
      where: {
        userId: userId
      },
      include: {
        _count: {
          select: {
            trackingLogs: true
          }
        },
        statistics: true
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessions.map(session => ({
          id: session.id,
          sessionName: session.sessionName,
          startTime: session.startTime,
          endTime: session.endTime,
          totalDuration: session.totalDuration,
          durationInSeconds: session.totalDuration,
          trackingLogsCount: session._count.trackingLogs,
          hasStatistics: !!session.statistics,
          isActive: !session.endTime
        }))
      }
    })
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูล sessions:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}