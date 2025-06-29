import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ฟังก์ชันคำนวณ Euclidean distance (server-side)
function euclideanDistance(arr1: number[], arr2: number[]): number {
  if (arr1.length !== arr2.length) {
    throw new Error('Arrays must have the same length');
  }
  
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    sum += Math.pow(arr1[i] - arr2[i], 2);
  }
  
  return Math.sqrt(sum);
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Face Verify API Called ===')
    
    const { userId, faceData } = await request.json()

    // Validate input
    if (!userId || !faceData) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    // Validate face data format
    if (!Array.isArray(faceData) || faceData.length !== 128) {
      return NextResponse.json(
        { error: 'ข้อมูลใบหน้าไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    console.log('Getting stored face data for user:', userId)

    // Get stored face data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { faceData: true, firstName: true, lastName: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 400 }
      )
    }

    if (!user.faceData) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลใบหน้าที่ลงทะเบียน กรุณาลงทะเบียนใบหน้าก่อน' },
        { status: 400 }
      )
    }

    console.log('Comparing face descriptors...')

    // Compare face descriptors
    let storedFaceData: number[]
    
    // Parse JSON data if it's stored as string
    if (typeof user.faceData === 'string') {
      storedFaceData = JSON.parse(user.faceData)
    } else {
      storedFaceData = user.faceData as number[]
    }
    
    const distance = euclideanDistance(faceData, storedFaceData)
    
    // Face matching threshold
    const threshold = 0.6
    const isMatch = distance < threshold

    console.log('Face comparison result:', {
      distance,
      threshold,
      isMatch,
      user: `${user.firstName} ${user.lastName}`
    })

    return NextResponse.json({
      isMatch,
      distance,
      threshold,
      message: isMatch 
        ? 'ยืนยันตัวตนสำเร็จ' 
        : 'ใบหน้าไม่ตรงกับข้อมูลที่ลงทะเบียน'
    })

  } catch (error: any) {
    console.error('Face verification error:', error)
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการตรวจสอบใบหน้า',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}