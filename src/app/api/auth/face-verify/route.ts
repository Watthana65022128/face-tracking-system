import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, faceData } = await request.json()

    // Get stored face data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { faceData: true }
    })

    if (!user?.faceData) {
      return NextResponse.json(
        { error: 'No face data registered' },
        { status: 400 }
      )
    }

    // Here you would compare faceData with user.faceData using face-api.js
    // For now, return success (implement actual comparison later)
    const isMatch = true // Placeholder

    return NextResponse.json({ isMatch })
  } catch (error) {
    return NextResponse.json(
      { error: 'Face verification failed' },
      { status: 500 }
    )
  }
}