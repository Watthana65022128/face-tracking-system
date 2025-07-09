'use client'
import { useState } from 'react'
import { validatePassword, getPasswordStrengthText, getPasswordStrengthColor } from '@/lib/utils/validation'

interface PasswordInputProps {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  showStrength?: boolean
  showToggle?: boolean // เพิ่ม prop ใหม่สำหรับควบคุมการแสดงปุ่มสลับ
  error?: string
}

export function PasswordInput({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  required = false,
  showStrength = false,
  showToggle = true, // ค่าเริ่มต้นเป็น true เพื่อไม่ให้กระทบกับการใช้งานเดิม
  error 
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const passwordStrength = showStrength ? validatePassword(value) : null

  const strengthText = passwordStrength ? getPasswordStrengthText(passwordStrength.score) : null
  const strengthColor = passwordStrength ? getPasswordStrengthColor(passwordStrength.score) : ''

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-purple-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-3 ${showToggle ? 'pr-12' : 'pr-4'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition-colors ${
            error ? 'border-red-300' : 'border-gray-300 focus:border-purple-400'
          }`}
          style={{
            WebkitAppearance: 'none'
          } as React.CSSProperties}
        />
        
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10 p-1 rounded-md hover:bg-gray-100"
          >
            {showPassword ? (
              // ไอคอนตาขีดเส้น - ซ่อนรหัสผ่าน
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              // ไอคอนตา - แสดงรหัสผ่าน  
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* ตัวบ่งชี้ความแข็งแกร่งของรหัสผ่าน */}
      {showStrength && value && passwordStrength && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">ความแข็งแกร่ง:</span>
            <span className={`text-sm font-medium ${strengthText?.color}`}>
              {strengthText?.text}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${strengthColor}`}
              style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
            />
          </div>

          {passwordStrength.feedback.length > 0 && (
            <ul className="text-xs text-gray-600 space-y-1">
              {passwordStrength.feedback.map((feedback, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                  {feedback}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}