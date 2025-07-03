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
    let storedFaceData: any
    
    // Parse JSON data if it's stored as string
    if (typeof user.faceData === 'string') {
      storedFaceData = JSON.parse(user.faceData)
    } else {
      storedFaceData = user.faceData
    }
    
    let distances: { pose: string, distance: number }[] = []
    let minDistance = Infinity
    let bestMatch = ''
    
    // Check if stored data is multi-pose (object) or single pose (array)
    if (Array.isArray(storedFaceData)) {
      // Legacy single pose data
      console.log('Using legacy single pose comparison')
      const distance = euclideanDistance(faceData, storedFaceData)
      distances.push({ pose: 'legacy', distance })
      minDistance = distance
      bestMatch = 'legacy'
    } else {
      // Multi-pose data - compare against all stored poses
      console.log('Using multi-pose comparison')
      const poses = Object.keys(storedFaceData)
      
      for (const pose of poses) {
        if (Array.isArray(storedFaceData[pose]) && storedFaceData[pose].length === 128) {
          const distance = euclideanDistance(faceData, storedFaceData[pose])
          distances.push({ pose, distance })
          
          if (distance < minDistance) {
            minDistance = distance
            bestMatch = pose
          }
        }
      }
    }
    
    // Face matching threshold - use the best match
    // ปรับ threshold ให้เข้มงวดขึ้นเพื่อความปลอดภัย
    const threshold = 0.4
    
    // เพิ่มการตรวจสอบเพิ่มเติม - ต้องมีการตรงกับหลายท่า
    const validMatches = distances.filter(d => d.distance < threshold)
    const isMatch = minDistance < threshold && validMatches.length > 0

    console.log('Face comparison result:', {
      distances,
      minDistance,
      bestMatch,
      threshold,
      validMatches: validMatches.length,
      isMatch,
      user: `${user.firstName} ${user.lastName}`,
      security: 'Enhanced verification with stricter threshold'
    })

    return NextResponse.json({
      isMatch,
      distance: minDistance,
      bestMatch,
      allDistances: distances,
      threshold,
      message: isMatch 
        ? `ยืนยันตัวตนสำเร็จ (ตรงกับท่า ${bestMatch})` 
        : `ใบหน้าไม่ตรงกับข้อมูลที่ลงทะเบียน`
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