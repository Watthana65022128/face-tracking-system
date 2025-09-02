import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function updateAdmin() {
  try {
    // ค้นหา admin user ที่มีอยู่
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!existingAdmin) {
      console.log('❌ ไม่พบ admin user ในระบบ')
      console.log('💡 กรุณาใช้ scripts/create-admin.ts เพื่อสร้าง admin ใหม่')
      return
    }

    console.log('🔍 พบ admin user:', existingAdmin.email)

    // เข้ารหัสรหัสผ่านใหม่
    const newPassword = 'University@Phayao'
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    // อัปเดตข้อมูล admin
    const updatedAdmin = await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        email: 'edtechnology.up@gmail.com',
        password: hashedPassword
      }
    })

    console.log('✅ อัปเดต admin user สำเร็จ!')
    console.log('📧 อีเมลใหม่:', updatedAdmin.email)
    console.log('🔑 รหัสผ่านใหม่:', newPassword)
    console.log('👤 ID:', updatedAdmin.id)
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการอัปเดต admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateAdmin()