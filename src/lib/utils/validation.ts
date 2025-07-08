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

export function validateEmail(email: string): { isValid: boolean; error?: string; normalizedEmail?: string } {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'กรุณากรอกอีเมล' }
  }

  // ปรับรูปแบบอีเมล: ตัดช่องว่างและแปลงเป็นตัวพิมพ์เล็ก
  const normalizedEmail = email.trim().toLowerCase()

  // ตรวจสอบรูปแบบพื้นฐาน
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(normalizedEmail)) {
    return { isValid: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' }
  }

  // ตรวจสอบรูปแบบที่ผิดพลาดทั่วไป
  if (normalizedEmail.includes('..') || 
      normalizedEmail.startsWith('.') || 
      normalizedEmail.endsWith('.') ||
      normalizedEmail.includes('@.') ||
      normalizedEmail.includes('.@')) {
    return { isValid: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' }
  }

  // ตรวจสอบข้อจำกัดของความยาว
  if (normalizedEmail.length > 254) {
    return { isValid: false, error: 'อีเมลยาวเกินไป' }
  }

  const [localPart, domain] = normalizedEmail.split('@')
  
  // ตรวจสอบความยาวส่วนหน้า @
  if (localPart.length > 64) {
    return { isValid: false, error: 'ส่วนหน้า @ ของอีเมลยาวเกินไป' }
  }

  // ตรวจสอบส่วนโดเมน
  if (domain.length > 253) {
    return { isValid: false, error: 'ส่วนหลัง @ ของอีเมลยาวเกินไป' }
  }

  // ตรวจสอบรูปแบบโดเมนที่ถูกต้องและความยาวขั้นต่ำของ TLD
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!domainRegex.test(domain)) {
    return { isValid: false, error: 'โดเมนของอีเมลไม่ถูกต้อง' }
  }

  // ตรวจสอบความยาวขั้นต่ำของ TLD (อย่างน้อย 2 ตัวอักษร)
  const domainParts = domain.split('.')
  const tld = domainParts[domainParts.length - 1]
  if (tld.length < 2) {
    return { isValid: false, error: 'โดเมนของอีเมลไม่ถูกต้อง' }
  }

  return { isValid: true, normalizedEmail }
}

export function validateStudentId(studentId: string): { isValid: boolean; error?: string } {
  // อนุญาตให้รหัสผู้เรียนว่างได้ (ช่องข้อมูลเสริม)
  if (!studentId || studentId.trim().length === 0) {
    return { isValid: true }
  }

  const trimmedId = studentId.trim()

  // ตรวจสอบว่าเป็นตัวเลขเท่านั้น
  const numberRegex = /^[0-9]+$/
  if (!numberRegex.test(trimmedId)) {
    return { isValid: false, error: 'รหัสผู้เรียนต้องเป็นตัวเลขเท่านั้น' }
  }

  // ตรวจสอบความยาว (โดยปกติรหัสผู้เรียนจะมี 7 หลัก)
  if (trimmedId.length < 6 || trimmedId.length > 10) {
    return { isValid: false, error: 'รหัสผู้เรียนต้องมี 6-10 หลัก' }
  }

  return { isValid: true }
}

export function validateTitle(title: string): { isValid: boolean; error?: string } {
  if (!title || title.trim().length === 0) {
    return { isValid: false, error: 'กรุณาเลือกคำนำหน้าชื่อ' }
  }

  return { isValid: true }
}

export function validatePhoneNumber(phoneNumber: string): { isValid: boolean; error?: string } {
  // อนุญาตให้เบอร์โทรศัพท์ว่างได้ (ช่องข้อมูลเสริม)
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    return { isValid: true }
  }

  const trimmedPhone = phoneNumber.trim()

  // ตรวจสอบว่าเป็นตัวเลขเท่านั้น
  const numberRegex = /^[0-9]+$/
  if (!numberRegex.test(trimmedPhone)) {
    return { isValid: false, error: 'เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น' }
  }

  // ตรวจสอบความยาว (ต้องมีเท่ากับ 10 หลัก)
  if (trimmedPhone.length !== 10) {
    return { isValid: false, error: 'เบอร์โทรศัพท์ต้องมี 10 หลักเท่านั้น' }
  }

  // ตรวจสอบว่าเริ่มต้นด้วยเลขนำหน้าโทรศัพท์ไทยที่ถูกต้อง
  const validPrefixes = ['08', '09', '06', '02']
  const prefix = trimmedPhone.substring(0, 2)
  if (!validPrefixes.includes(prefix)) {
    return { isValid: false, error: 'เบอร์โทรศัพท์ไม่ถูกต้อง' }
  }

  return { isValid: true }
}

export function validateName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'กรุณากรอกชื่อ' }
  }
  
  const trimmedName = name.trim()
  
  // ตรวจสอบว่าชื่อประกอบด้วยตัวอักษรไทยและอังกฤษและช่องว่างเท่านั้น
  const nameRegex = /^[a-zA-Zก-๙\s]+$/
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, error: 'ชื่อและนามสกุลต้องเป็นตัวอักษรเท่านั้น' }
  }
  
  // ตรวจสอบความสอดคล้องของภาษา - ไม่อนุญาตให้ผสมภาษาไทยและอังกฤษ
  const hasThaiChars = /[ก-๙]/.test(trimmedName)
  const hasEnglishChars = /[a-zA-Z]/.test(trimmedName)
  
  if (hasThaiChars && hasEnglishChars) {
    return { isValid: false, error: 'ไม่อนุญาตให้ผสมภาษาไทยและอังกฤษในชื่อเดียวกัน' }
  }
  
  return { isValid: true }
}