/**
 * Utility functions สำหรับจัดการวันที่และเวลาในระบบ
 * รองรับเวลาไทย (UTC+7) และการแปลงข้อมูลเวลา
 */

/**
 * สร้าง Date object ด้วยเวลาไทยปัจจุบัน
 * @returns Date object ปัจจุบัน
 */
export function getThailandTime(): Date {
  return new Date(); // JavaScript Date จัดการ timezone ผ่าน system setting
}

/**
 * แปลง Date object เป็นรูปแบบเวลาไทย
 * @param date - Date object ที่ต้องการแปลง
 * @returns Date object เดิม (ไม่ต้องแปลง เพราะ Date จัดการ timezone เอง)
 */
export function toThailandTime(date: Date): Date {
  return date; // คืนค่าเดิม เพราะ Date object จัดการ timezone แล้ว
}

/**
 * คำนวณระยะเวลาเป็นวินาทีระหว่างสองเวลา
 * @param startTime - เวลาเริ่มต้น
 * @param endTime - เวลาสิ้นสุด (ถ้าไม่ระบุจะใช้เวลาไทยปัจจุบัน)
 * @returns ระยะเวลาเป็นวินาที
 */
export function calculateDurationInSeconds(startTime: Date, endTime?: Date): number {
  const end = endTime || getThailandTime();
  return Math.round((end.getTime() - startTime.getTime()) / 1000);
}

/**
 * แปลงจำนวนวินาทีเป็น string รูปแบบ HH:mm:ss
 * @param seconds - จำนวนวินาที
 * @returns string รูปแบบ HH:mm:ss
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);  
  const remainingSeconds = seconds % 60;
  
  return [hours, minutes, remainingSeconds]
    .map(val => val.toString().padStart(2, '0'))
    .join(':');
}

/**
 * แปลง Date เป็น string รูปแบบ YYYY-MM-DD HH:mm:ss (เวลาไทย)
 * @param date - Date object ที่ต้องการแปลง
 * @returns string รูปแบบ YYYY-MM-DD HH:mm:ss
 */
export function formatThaiDateTime(date: Date): string {
  return date.toLocaleString('sv-SE', { // สวีเดนใช้ format ISO ที่เราต้องการ
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(' ', ' '); // YYYY-MM-DD HH:mm:ss
}

/**
 * แปลง Date เป็น string รูปแบบ HH:mm:ss (เวลาไทย)
 * @param date - Date object ที่ต้องการแปลง
 * @returns string รูปแบบ HH:mm:ss
 */
export function formatThaiTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { // อังกฤษใช้ HH:mm:ss format
    timeZone: 'Asia/Bangkok',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * ตรวจสอบว่าวันที่อยู่ในวันเดียวกันหรือไม่ (เวลาไทย)
 * @param date1 - วันที่แรก
 * @param date2 - วันที่สอง
 * @returns true ถ้าอยู่ในวันเดียวกัน
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  const format1 = date1.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }); // YYYY-MM-DD
  const format2 = date2.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }); // YYYY-MM-DD
  
  return format1 === format2;
}