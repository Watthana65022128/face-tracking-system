import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Interface สำหรับ request body
interface OrientationEvent {
  startTime: string;
  endTime?: string;
  direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';
  duration?: number;
  maxYaw?: number;
  maxPitch?: number;
  isActive: boolean;
}

interface OrientationLogRequest {
  sessionId: string;
  events: OrientationEvent[];
  sessionStats: {
    totalEvents: number;
    leftTurns: { count: number; totalDuration: number };
    rightTurns: { count: number; totalDuration: number };
    lookingUp: { count: number; totalDuration: number };
    lookingDown: { count: number; totalDuration: number };
    centerTime: number;
    sessionStartTime: string;
    lastEventTime?: string;
  };
  faceDetectionLoss?: {
    lossCount: number;
    totalLossTime: number;
  };
  faceDetectionLossEvents?: Array<{
    startTime: string;
    endTime?: string;
    duration?: number;
    isActive: boolean;
  }>;
}

// บันทึกข้อมูล orientation tracking
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
    } catch (error) {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    const body: OrientationLogRequest = await request.json()
    const { sessionId, events, sessionStats, faceDetectionLoss, faceDetectionLossEvents } = body

    // ตรวจสอบว่า session มีอยู่และเป็นของ user คนนี้
    const session = await prisma.trackingSession.findFirst({
      where: {
        id: sessionId,
        userId: userId
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'ไม่พบ session หรือไม่มีสิทธิ์เข้าถึง' }, { status: 404 })
    }

    // บันทึกแต่ละ orientation event เป็น TrackingLog
    const savedLogs = await Promise.all(
      events.map(async (event) => {
        return await prisma.trackingLog.create({
          data: {
            sessionId: sessionId,
            detectionType: 'FACE_ORIENTATION',
            detectionData: {
              direction: event.direction,
              startTime: event.startTime,
              endTime: event.endTime,
              duration: event.duration,
              maxYaw: event.maxYaw,
              maxPitch: event.maxPitch
            },
            confidence: 0.95 // MediaPipe มี confidence สูง
          }
        })
      })
    )

    // บันทึก Face Detection Loss Events เป็น TrackingLog แยกรายการ (ถ้ามี)
    let faceDetectionLossLogs = []
    if (faceDetectionLossEvents && faceDetectionLossEvents.length > 0) {
      for (const event of faceDetectionLossEvents) {
        if (!event.isActive && event.endTime && event.duration) {
          const faceDetectionLossLog = await prisma.trackingLog.create({
            data: {
              sessionId: sessionId,
              detectionType: 'FACE_DETECTION_LOSS',
              detectionData: {
                startTime: event.startTime,
                endTime: event.endTime,
                duration: event.duration
              },
              confidence: 1.0 // การไม่พบใบหน้าเป็นข้อมูลที่แน่นอน
            }
          })
          faceDetectionLossLogs.push(faceDetectionLossLog)
        }
      }
      console.log(`🚨 บันทึก Face Detection Loss: ${faceDetectionLossLogs.length} events, รวม ${faceDetectionLoss?.totalLossTime || 0} วินาที`)
    }

    // อัปเดตหรือสร้าง SessionStatistics
    const existingStats = await prisma.sessionStatistics.findUnique({
      where: { sessionId: sessionId }
    })

    // === FACE TRACKING SUMMARY (No Duplicated Data) ===
    const statsData = {
      // Face orientation counts only - ข้อมูลสรุปจำนวนครั้ง
      faceOrientationsByDirection: {
        LEFT: sessionStats.leftTurns.count,
        RIGHT: sessionStats.rightTurns.count,
        UP: sessionStats.lookingUp.count,
        DOWN: sessionStats.lookingDown.count
      },
      
      // Time summary - ข้อมูลสรุปเวลา
      timeOffScreen: sessionStats.leftTurns.totalDuration + 
                     sessionStats.rightTurns.totalDuration + 
                     sessionStats.lookingUp.totalDuration + 
                     sessionStats.lookingDown.totalDuration,
      
      // Face detection loss summary
      faceDetectionLoss: faceDetectionLoss?.lossCount || 0,
      totalLossTime: faceDetectionLoss?.totalLossTime || 0
      
      // === REMOVED DUPLICATED DATA ===
      // avgFaceOrientation - ลบออก เพราะ compute ได้จาก TrackingLog
      // totalEvents - ลบออก เพราะ COUNT ได้จาก TrackingLog  
      // centerTime - ลบออก เพราะไม่เก็บใน TrackingLog อยู่แล้ว
      // sessionStartTime - ลบออก เพราะมีใน TrackingSession.startTime แล้ว
    }

    let sessionStatistics
    if (existingStats) {
      // อัปเดตสถิติที่มีอยู่
      sessionStatistics = await prisma.sessionStatistics.update({
        where: { sessionId: sessionId },
        data: statsData
      })
    } else {
      // สร้างสถิติใหม่
      sessionStatistics = await prisma.sessionStatistics.create({
        data: {
          sessionId: sessionId,
          ...statsData
        }
      })
    }

    console.log(`✅ บันทึก ${savedLogs.length} orientation events สำหรับ session ${sessionId}`)
    if (faceDetectionLossLogs.length > 0) {
      console.log(`🚨 บันทึก ${faceDetectionLossLogs.length} Face Detection Loss Events สำหรับ session ${sessionId}`)
    }
    
    return NextResponse.json({
      success: true,
      message: `บันทึก ${savedLogs.length} orientation events${faceDetectionLossLogs.length > 0 ? ` + ${faceDetectionLossLogs.length} Face Detection Loss events` : ''} สำเร็จ`,
      data: {
        logsCreated: savedLogs.length + faceDetectionLossLogs.length,
        orientationLogsCreated: savedLogs.length,
        faceDetectionLossLogCreated: faceDetectionLossLogs.length,
        sessionStatistics: sessionStatistics,
        summary: {
          totalEvents: sessionStats.totalEvents,
          totalDurationOffScreen: sessionStats.leftTurns.totalDuration + 
                                   sessionStats.rightTurns.totalDuration + 
                                   sessionStats.lookingUp.totalDuration + 
                                   sessionStats.lookingDown.totalDuration,
          faceDetectionLoss: {
            count: faceDetectionLoss?.lossCount || 0,
            totalTime: faceDetectionLoss?.totalLossTime || 0
          },
          breakdown: {
            left: `${sessionStats.leftTurns.count} ครั้ง (${sessionStats.leftTurns.totalDuration}วิ)`,
            right: `${sessionStats.rightTurns.count} ครั้ง (${sessionStats.rightTurns.totalDuration}วิ)`,
            up: `${sessionStats.lookingUp.count} ครั้ง (${sessionStats.lookingUp.totalDuration}วิ)`,
            down: `${sessionStats.lookingDown.count} ครั้ง (${sessionStats.lookingDown.totalDuration}วิ)`
          }
        }
      }
    })
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการบันทึก orientation data:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' },
      { status: 500 }
    )
  }
}

// ดึงข้อมูล orientation logs ของ session
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
    } catch (error) {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    // ดึง sessionId จาก query parameters
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'ไม่พบ sessionId' }, { status: 400 })
    }

    // ตรวจสอบว่า session เป็นของ user คนนี้
    const session = await prisma.trackingSession.findFirst({
      where: {
        id: sessionId,
        userId: userId
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'ไม่พบ session หรือไม่มีสิทธิ์เข้าถึง' }, { status: 404 })
    }

    // ดึงข้อมูล orientation logs
    const orientationLogs = await prisma.trackingLog.findMany({
      where: {
        sessionId: sessionId,
        detectionType: 'FACE_ORIENTATION'
      },
      orderBy: {
        id: 'asc'
      }
    })

    // ดึงสถิติของ session
    const statistics = await prisma.sessionStatistics.findUnique({
      where: { sessionId: sessionId }
    })

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          sessionName: session.sessionName,
          startTime: session.startTime,
          endTime: session.endTime,
          totalDuration: session.totalDuration
        },
        orientationLogs: orientationLogs,
        statistics: statistics,
        summary: {
          totalLogs: orientationLogs.length,
          timeRange: {
            start: session.startTime,
            end: session.endTime
          }
        }
      }
    })
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูล orientation logs:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}