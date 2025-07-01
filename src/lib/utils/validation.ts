export interface PasswordStrength {
  score: number
  feedback: string[]
  isValid: boolean
}

export function validatePassword(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  if (password.length < 8) {
    feedback.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
  } else {
    score += 1
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('ต้องมีตัวอักษรภาษาอังกฤษพิมพ์เล็ก (a-z)')
  } else {
    score += 1
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('ต้องมีตัวอักษรภาษาอังกฤษพิมพ์ใหญ่ (A-Z)')
  } else {
    score += 1
  }

  if (!/[0-9]/.test(password)) {
    feedback.push('ต้องมีตัวเลข (0-9)')
  } else {
    score += 1
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('ต้องมีอักขระพิเศษ (!@#$%^&*)')
  } else {
    score += 1
  }

  if (password.length >= 12) {
    score += 1
  }

  return {
    score,
    feedback,
    isValid: score >= 4 && password.length >= 8
  }
}

export function getPasswordStrengthText(score: number): { text: string; color: string } {
  if (score <= 2) return { text: 'อ่อนแอ', color: 'text-red-600' }
  if (score <= 4) return { text: 'ปานกลาง', color: 'text-yellow-600' }
  if (score <= 5) return { text: 'แข็งแกร่ง', color: 'text-green-600' }
  return { text: 'แข็งแกร่งมาก', color: 'text-green-700' }
}

export function getPasswordStrengthColor(score: number): string {
  if (score <= 2) return 'bg-red-500'
  if (score <= 4) return 'bg-yellow-500'
  if (score <= 5) return 'bg-green-500'
  return 'bg-green-600'
}

export function validateName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'กรุณากรอกชื่อ' }
  }
  
  // Check if name contains only Thai and English alphabetic characters and spaces
  const nameRegex = /^[a-zA-Zก-๙\s]+$/
  if (!nameRegex.test(name)) {
    return { isValid: false, error: 'ชื่อและนามสกุลต้องเป็นตัวอักษรเท่านั้น' }
  }
  
  return { isValid: true }
}