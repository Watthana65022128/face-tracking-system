import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Face Register API Called ===')
    
    const body = await request.json()
    console.log('Request body:', body)

    const { userId, faceData } = body

    // Validate required fields
    if (!userId || !faceData) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    // Validate face data format - now expecting multiple poses
    if (typeof faceData !== 'object' || faceData === null) {
      console.log('Invalid face data format: not an object')
      return NextResponse.json(
        { error: 'ข้อมูลใบหน้าไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Check if we have the required poses
    const requiredPoses = ['front', 'left', 'right', 'blink']
    const providedPoses = Object.keys(faceData)
    
    // Allow partial poses (at least front pose is required)
    if (!faceData.front || !Array.isArray(faceData.front) || faceData.front.length !== 128) {
      console.log('Missing or invalid front pose data')
      return NextResponse.json(
        { error: 'ต้องมีข้อมูลใบหน้าท่าหน้าตรงอย่างน้อย' },
        { status: 400 }
      )
    }

    // Validate each provided pose
    for (const [pose, data] of Object.entries(faceData)) {
      if (!Array.isArray(data) || data.length !== 128) {
        return NextResponse.json(
          { error: `ข้อมูลใบหน้าท่า${pose}ไม่ถูกต้อง` },
          { status: 400 }
        )
      }
    }

    console.log('Multi-pose face data validated. Poses:', providedPoses)

    console.log('Updating user with face data...')

    // Update user with face data
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        faceData: JSON.stringify(faceData) // บันทึกเป็น JSON string
      }
    })

    console.log('Face data saved successfully for user:', user.id)

    return NextResponse.json({ 
      success: true,
      message: `บันทึกข้อมูลใบหน้า ${providedPoses.length} ท่าสำเร็จ`,
      capturedPoses: providedPoses
    })

  } catch (error: any) {
    console.error('=== Face Register API Error ===')
    console.error('Error details:', error)
    console.error('Error message:', error.message)

    // Check for specific database errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'ไม่สามารถบันทึกข้อมูลใบหน้าได้',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}