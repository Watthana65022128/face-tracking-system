// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { validateName, validateEmail } from '@/lib/utils/validation'

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/register', request.url))
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Register API Called ===')
    
    // Parse request body
    const body = await request.json()
    console.log('Request body:', body)
    
    const { email, password, firstName, lastName, studentId } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      console.log('Missing required fields')
      return NextResponse.json(
        { 
          error: 'ข้อมูลไม่ครบถ้วน',
          details: 'กรุณากรอกอีเมล รหัสผ่าน ชื่อ และนามสกุล'
        },
        { status: 400 }
      )
    }

    // Validate first name
    const firstNameValidation = validateName(firstName)
    if (!firstNameValidation.isValid) {
      return NextResponse.json(
        { error: firstNameValidation.error },
        { status: 400 }
      )
    }

    // Validate last name
    const lastNameValidation = validateName(lastName)
    if (!lastNameValidation.isValid) {
      return NextResponse.json(
        { error: lastNameValidation.error },
        { status: 400 }
      )
    }

    // Validate email format
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' },
        { status: 400 }
      )
    }

    console.log('Checking for existing user...')
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      console.log('User already exists:', email)
      return NextResponse.json(
        { error: 'อีเมลนี้มีการใช้งานแล้ว' },
        { status: 400 }
      )
    }

    console.log('Hashing password...')
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log('Creating user in database...')
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        studentId: studentId || null,
        faceData: null // เพิ่มทีหลัง
      }
    })

    console.log('User created successfully:', user.id)

    // Return success response (ไม่ส่ง password กลับ)
    return NextResponse.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('=== Register API Error ===')
    console.error('Error details:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)

    // Check for specific database errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'อีเมลนี้มีการใช้งานแล้ว' },
        { status: 400 }
      )
    }

    if (error.message.includes('connect')) {
      return NextResponse.json(
        { 
          error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้',
          details: 'กรุณาตรวจสอบการตั้งค่าฐานข้อมูล'
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
        details: process.env.NODE_ENV === 'development' ? error.message : 'กรุณาลองใหม่อีกครั้ง'
      },
      { status: 500 }
    )
  }
}