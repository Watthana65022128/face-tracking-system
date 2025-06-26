import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, faceData } = await request.json()

    // Update user with face data
    const user = await prisma.user.update({
      where: { id: userId },
      data: { faceData }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save face data' },
      { status: 500 }
    )
  }
}