/**
 * Utility functions สำหรับจัดการวันที่และเวลาในระบบ
 * รองรับเวลาไทย (UTC+7) และการแปลงข้อมูลเวลา
 */

// เวลาเขต UTC offset สำหรับประเทศไทย (UTC+7)
const THAILAND_UTC_OFFSET = 7 * 60 * 60 * 1000; // 7 ชั่วโมง * 60 นาที * 60 วินาที * 1000 มิลลิวินาที

/**
 * สร้าง Date object ด้วยเวลาไทย (UTC+7)
 * @returns Date object ที่ปรับเป็นเวลาไทยแล้ว
 */
export function getThailandTime(): Date {
  return new Date(new Date().getTime() + THAILAND_UTC_OFFSET);
}

/**
 * แปลง Date object เป็นเวลาไทย
 * @param date - Date object ที่ต้องการแปลง
 * @returns Date object ที่ปรับเป็นเวลาไทยแล้ว
 */
export function toThailandTime(date: Date): Date {
  return new Date(date.getTime() + THAILAND_UTC_OFFSET);
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
  const thailandDate = toThailandTime(date);
  return thailandDate.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * แปลง Date เป็น string รูปแบบ HH:mm:ss (เวลาไทย)
 * @param date - Date object ที่ต้องการแปลง
 * @returns string รูปแบบ HH:mm:ss
 */
export function formatThaiTime(date: Date): string {
  const thailandDate = toThailandTime(date);
  return thailandDate.toISOString().slice(11, 19);
}

/**
 * ตรวจสอบว่าวันที่อยู่ในวันเดียวกันหรือไม่ (เวลาไทย)
 * @param date1 - วันที่แรก
 * @param date2 - วันที่สอง
 * @returns true ถ้าอยู่ในวันเดียวกัน
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  const thai1 = toThailandTime(date1);
  const thai2 = toThailandTime(date2);
  
  return thai1.getFullYear() === thai2.getFullYear() &&
         thai1.getMonth() === thai2.getMonth() &&
         thai1.getDate() === thai2.getDate();
}