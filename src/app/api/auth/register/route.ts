// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { validateName, validateEmail, validateStudentId, validatePassword, validateTitle, validatePhoneNumber } from '@/lib/utils/validation'

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/register', request.url))
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Register API Called ===')
    
    // Parse request body
    const body = await request.json()
    console.log('Request body:', body)
    
    const { email, password, title, firstName, lastName, studentId, phoneNumber } = body

    // Validate required fields
    if (!email || !password || !title || !firstName || !lastName) {
      console.log('Missing required fields')
      return NextResponse.json(
        { 
          error: 'ข้อมูลไม่ครบถ้วน',
          details: 'กรุณากรอกอีเมล รหัสผ่าน คำนำหน้าชื่อ ชื่อ และนามสกุล'
        },
        { status: 400 }
      )
    }

    // Validate title
    const titleValidation = validateTitle(title)
    if (!titleValidation.isValid) {
      return NextResponse.json(
        { error: titleValidation.error },
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

    // Validate student ID if provided
    if (studentId) {
      const studentIdValidation = validateStudentId(studentId)
      if (!studentIdValidation.isValid) {
        return NextResponse.json(
          { error: studentIdValidation.error },
          { status: 400 }
        )
      }
    }

    // Validate phone number if provided
    if (phoneNumber) {
      const phoneValidation = validatePhoneNumber(phoneNumber)
      if (!phoneValidation.isValid) {
        return NextResponse.json(
          { error: phoneValidation.error },
          { status: 400 }
        )
      }
    }

    // Validate email format and get normalized email
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      )
    }
    
    const normalizedEmail = emailValidation.normalizedEmail!

    // Validate password strength using the comprehensive validation function
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'รหัสผ่านไม่ปลอดภัยเพียงพอ', details: passwordValidation.feedback },
        { status: 400 }
      )
    }

    console.log('Checking for existing user...')
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
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
        email: normalizedEmail,
        password: hashedPassword,
        title: title.toLowerCase(),
        firstName,
        lastName,
        studentId: studentId || null,
        phoneNumber: phoneNumber || null,
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
        title: user.title,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
        phoneNumber: user.phoneNumber
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