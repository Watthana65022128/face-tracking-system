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

export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'กรุณากรอกอีเมล' }
  }

  // Remove whitespace
  const trimmedEmail = email.trim()

  // Check basic format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' }
  }

  // Check for common invalid patterns
  if (trimmedEmail.includes('..') || 
      trimmedEmail.startsWith('.') || 
      trimmedEmail.endsWith('.') ||
      trimmedEmail.includes('@.') ||
      trimmedEmail.includes('.@')) {
    return { isValid: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' }
  }

  // Check length constraints
  if (trimmedEmail.length > 254) {
    return { isValid: false, error: 'อีเมลยาวเกินไป' }
  }

  const [localPart, domain] = trimmedEmail.split('@')
  
  // Check local part length
  if (localPart.length > 64) {
    return { isValid: false, error: 'ส่วนหน้า @ ของอีเมลยาวเกินไป' }
  }

  // Check domain part
  if (domain.length > 253) {
    return { isValid: false, error: 'ส่วนหลัง @ ของอีเมลยาวเกินไป' }
  }

  // Check for valid domain format
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!domainRegex.test(domain)) {
    return { isValid: false, error: 'โดเมนของอีเมลไม่ถูกต้อง' }
  }

  return { isValid: true }
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