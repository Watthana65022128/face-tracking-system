import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { field, value } = await request.json()

    if (!field || !value) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    // ตรวจสอบฟิลด์ที่รองรับ
    const allowedFields = ['email', 'studentId', 'phoneNumber']
    if (!allowedFields.includes(field)) {
      return NextResponse.json(
        { error: 'ฟิลด์ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // สร้าง where condition แบบ dynamic
    const whereCondition: Record<string, string> = {}
    whereCondition[field] = value

    // ตรวจสอบในฐานข้อมูล
    const existingUser = await prisma.user.findFirst({
      where: whereCondition,
      select: { id: true, [field]: true }
    })

    const isDuplicate = !!existingUser

    // สร้างข้อความแจ้งเตือนตามฟิลด์
    let message = ''
    if (isDuplicate) {
      switch (field) {
        case 'email':
          message = 'อีเมลนี้ถูกใช้งานแล้ว'
          break
        case 'studentId':
          message = 'รหัสผู้เรียนนี้ถูกใช้งานแล้ว'
          break
        case 'phoneNumber':
          message = 'เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว'
          break
        default:
          message = 'ข้อมูลนี้ถูกใช้งานแล้ว'
      }
    }

    return NextResponse.json({
      isDuplicate,
      message: isDuplicate ? message : 'ข้อมูลสามารถใช้งานได้',
      field,
      value
    })

  } catch (error: unknown) {
    console.error('Check duplicate error:', error)
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    )
  }
}