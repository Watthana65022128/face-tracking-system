import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendRealtimeEvent } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userId, userName, detectionType, confidence, metadata } = body

    // Validate required fields
    if (!sessionId || !userId || !userName || !detectionType) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน: sessionId, userId, userName, detectionType จำเป็น' },
        { status: 400 }
      )
    }

    // Validate detection type
    const validDetectionTypes = ['LEFT', 'RIGHT', 'UP', 'DOWN', 'FACE_DETECTION_LOSS']
    if (!validDetectionTypes.includes(detectionType)) {
      return NextResponse.json(
        { error: 'detectionType ไม่ถูกต้อง: ต้องเป็น LEFT, RIGHT, UP, DOWN, หรือ FACE_DETECTION_LOSS' },
        { status: 400 }
      )
    }

    // Verify session exists
    const session = await prisma.trackingSession.findUnique({
      where: { id: sessionId },
      include: { user: true }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'ไม่พบ session ที่ระบุ' },
        { status: 404 }
      )
    }

    // Verify user matches session
    if (session.userId !== userId) {
      return NextResponse.json(
        { error: 'ผู้ใช้ไม่ตรงกับ session' },
        { status: 403 }
      )
    }

    // Send to Supabase realtime (will also save to tracking_logs)
    const realtimeResult = await sendRealtimeEvent({
      sessionId,
      userId,
      userName,
      detectionType,
      confidence,
      metadata
    })

    if (!realtimeResult.success) {
      console.error('Failed to send realtime event:', realtimeResult.error)
      return NextResponse.json(
        { error: 'ไม่สามารถส่งข้อมูล real-time ได้' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'ส่งข้อมูล real-time สำเร็จ',
      data: realtimeResult.data
    })

  } catch (error) {
    console.error('Error in realtime tracking API:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Real-time Tracking API',
    endpoints: {
      POST: 'ส่งข้อมูล real-time tracking',
      supported_types: ['LEFT', 'RIGHT', 'UP', 'DOWN', 'FACE_DETECTION_LOSS']
    }
  })
}