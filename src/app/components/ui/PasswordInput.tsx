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
  error?: string
}

export function PasswordInput({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  required = false,
  showStrength = false,
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
          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition-colors ${
            error ? 'border-red-300' : 'border-gray-300 focus:border-purple-400'
          }`}
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10 p-1"
        >
        </button>
      </div>

      {/* Password Strength Indicator */}
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