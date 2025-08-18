import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // ตรวจสอบว่ามี admin อยู่แล้วหรือไม่
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email)
      return
    }

    // สร้าง admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@tracking-system.com',
        password: hashedPassword,
        title: 'นาย',
        firstName: 'Admin',
        lastName: 'System',
        role: 'ADMIN',
        studentId: 'ADMIN001',
        phoneNumber: '0800000000',
        isActive: true
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email: admin@tracking-system.com')
    console.log('🔑 Password: admin123')
    console.log('👤 ID:', admin.id)
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()