'use client'
import { useState } from 'react'
import { Button } from '@/app/components/ui/Button'
import { Input } from '@/app/components/ui/Input'
import { PasswordInput } from '@/app/components/ui/PasswordInput'
import { Card } from '@/app/components/ui/Card'
import { validatePassword } from '@/lib/utils/validation'

interface AuthFormProps {
  type: 'login' | 'register'
  onSubmit: (data: any) => void
  loading?: boolean
}

export function AuthForm({ type, onSubmit, loading = false }: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    studentId: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password for registration
    if (type === 'register') {
      // Validate first name - only letters allowed
      if (!/^[a-zA-Zก-ฮ]+$/.test(formData.firstName)) {
        setErrors({ firstName: 'ชื่อและนามสกุลต้องประกอบด้วยตัวอักษรเท่านั้น' })
        return
      }

      // Validate last name - only letters allowed
      if (!/^[a-zA-Zก-ฮ]+$/.test(formData.lastName)) {
        setErrors({ lastName: 'ชื่อและนามสกุลต้องประกอบด้วยตัวอักษรเท่านั้น' })
        return
      }

      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) {
        setErrors({ password: 'รหัสผ่านไม่ปลอดภัยเพียงพอ' })
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setErrors({ confirmPassword: 'รหัสผ่านไม่ตรงกัน' })
        return
      }
    }

    onSubmit(formData)
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Card className="p-8 w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          {type === 'login' ? 'เข้าสู่ระบบ' : 'ลงทะเบียน'}
        </h2>
        <p className="text-gray-600 mt-2">
          {type === 'login' ? 'ยินดีต้อนรับ' : 'สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งาน'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {type === 'register' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="ชื่อ"
                value={formData.firstName}
                onChange={handleChange('firstName')}
                placeholder="ชื่อ"
                required
                error={errors.firstName}
              />
              <Input
                label="นามสกุล"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                placeholder="นามสกุล"
                required
                error={errors.lastName}
              />
            </div>
            <Input
              label="รหัสผู้เรียน"
              value={formData.studentId}
              onChange={handleChange('studentId')}
              placeholder="650xxxx"
              error={errors.studentId}
            />
          </>
        )}

        <Input
          label="อีเมล"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          required
          error={errors.email}
        />

        <PasswordInput
          label="รหัสผ่าน"
          value={formData.password}
          onChange={handleChange('password')}
          placeholder="••••••••"
          required
          showStrength={type === 'register'}
          showToggle={true}
          error={errors.password}
        />

        {type === 'register' && (
          <PasswordInput
            label="ยืนยันรหัสผ่าน"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            placeholder="••••••••"
            required
            showStrength={false}
            showToggle={false} // ไม่แสดงปุ่ม toggle สำหรับช่องยืนยันรหัสผ่าน
            error={errors.confirmPassword}
          />
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังดำเนินการ...
            </div>
          ) : (
            type === 'login' ? 'เข้าสู่ระบบ' : 'ลงทะเบียน'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          {type === 'login' ? 'ยังไม่มีบัญชี?' : 'มีบัญชีแล้ว?'}
          <a 
            href={type === 'login' ? '/register' : '/login'} 
            className="ml-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            {type === 'login' ? 'ลงทะเบียน' : 'เข้าสู่ระบบ'}
          </a>
        </p>
      </div>
    </Card>
  )
}