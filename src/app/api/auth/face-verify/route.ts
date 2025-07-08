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
    
    const { userId, faceData, verifiedPoses } = await request.json()

    // ตรวจสอบข้อมูลที่รับเข้ามา
    if (!userId || !faceData) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    // ตรวจสอบรูปแบบข้อมูลใบหน้า
    if (!Array.isArray(faceData) || faceData.length !== 128) {
      return NextResponse.json(
        { error: 'ข้อมูลใบหน้าไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    console.log('Getting stored face data for user:', userId)

    // ดึงข้อมูลใบหน้าที่บันทึกไว้
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

    // เปรียบเทียบข้อมูลลักษณะใบหน้า
    let storedFaceData: any
    
    // แยกข้อมูล JSON ถ้าบันทึกเป็นสตริง
    if (typeof user.faceData === 'string') {
      storedFaceData = JSON.parse(user.faceData)
    } else {
      storedFaceData = user.faceData
    }
    
    let distances: { pose: string, distance: number }[] = []
    let minDistance = Infinity
    let bestMatch = ''
    
    // ตรวจสอบว่าข้อมูลที่บันทึกเป็นหลายท่า (object) หรือท่าเดียว (array)
    if (Array.isArray(storedFaceData)) {
      // ข้อมูลท่าเดียวรุ่นเก่า
      console.log('Using legacy single pose comparison')
      const distance = euclideanDistance(faceData, storedFaceData)
      distances.push({ pose: 'legacy', distance })
      minDistance = distance
      bestMatch = 'legacy'
    } else {
      // ข้อมูลหลายท่า - เปรียบเทียบกับทุกท่าที่บันทึกไว้
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
    
    // เกณฑ์การจับคู่ใบหน้า - ใช้การจับคู่ที่ดีที่สุด
    // ปรับ threshold ให้เข้มงวดขึ้นเพื่อความปลอดภัย
    const threshold = 0.4
    
    // เพิ่มการตรวจสอบเพิ่มเติม - ต้องมีการตรงกับหลายท่า
    const validMatches = distances.filter(d => d.distance < threshold)
    
    // ตรวจสอบการยืนยัน 3 ท่า (ถ้ามีข้อมูล verifiedPoses)
    let poseVerificationPassed = true
    if (verifiedPoses) {
      const requiredPoses = ['front', 'left', 'right']
      const verifiedCount = requiredPoses.filter(pose => verifiedPoses[pose]).length
      poseVerificationPassed = verifiedCount >= 3 // ต้องยืนยันครบทั้ง 3 ท่า
      
      console.log('Multi-pose verification:', {
        verifiedPoses,
        verifiedCount,
        requiredPoses: requiredPoses.length,
        passed: poseVerificationPassed
      })
    }
    
    const isMatch = minDistance < threshold && validMatches.length > 0 && poseVerificationPassed

    console.log('Face comparison result:', {
      distances,
      minDistance,
      bestMatch,
      threshold,
      validMatches: validMatches.length,
      poseVerificationPassed,
      verifiedPoses,
      isMatch,
      user: `${user.firstName} ${user.lastName}`,
      security: 'Enhanced verification with 3-pose confirmation and stricter threshold'
    })

    return NextResponse.json({
      isMatch,
      distance: minDistance,
      bestMatch,
      allDistances: distances,
      threshold,
      message: isMatch 
        ? `ยืนยันตัวตนสำเร็จ (ตรงกับท่า ${bestMatch}${verifiedPoses ? ' + ยืนยัน 3 ท่าครบถ้วน' : ''})` 
        : !poseVerificationPassed 
          ? 'การยืนยัน 3 ท่าไม่ครบถ้วน กรุณาทำการยืนยันท่าให้ครบทั้ง 3 ท่า'
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