// Face mesh drawing utilities for MediaPipe FaceLandmarker
import { FaceTrackingData } from './mediapipe-detector'

// Face landmark indices for different contours
export const FACE_CONTOURS = {
  // จุดโครงหน้า (Face Oval)
  faceOval: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10],
  
  // ตาซ้าย
  leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33],
  
  // ตาขวา
  rightEye: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362],
  
  // ขอบปากนอก
  outerLips: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 61],
  
  // ขอบปากใน
  innerLips: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 78],
  
  // ดั่งจมูก
  noseBridge: [6, 168, 8, 9, 10, 151],
  
  // ปีกจมูก
  noseWings: [98, 97, 2, 326, 327, 294, 278, 344, 358, 279, 420, 399, 437, 355, 371, 329, 348, 36, 131, 134, 102, 48, 115, 131]
}

// จุดสำคัญของใบหน้า
export const KEY_LANDMARKS = [
  // โครงหน้า
  10, 151, 9, 8, 168, 6, 148, 176, 149, 150, 136, 172,
  // ตาซ้าย
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
  // ตาขวา
  362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398,
  // จมูก
  19, 20, 98, 97, 2, 326, 327, 294, 278, 344, 1, 5,
  // ปาก
  61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318
]

export interface DrawingCoordinates {
  scaleX: number
  scaleY: number
  offsetX: number
  offsetY: number
}

export interface DrawingColors {
  primary: string
  secondary: string
  glow: string
}

// คำนวณ scaling และ offset สำหรับ aspect ratio
export function calculateCoordinates(
  video: HTMLVideoElement | null,
  canvasWidth: number,
  canvasHeight: number
): DrawingCoordinates {
  let scaleX = canvasWidth
  let scaleY = canvasHeight
  let offsetX = 0
  let offsetY = 0
  
  if (video && video.videoWidth && video.videoHeight) {
    const videoAspect = video.videoWidth / video.videoHeight
    const canvasAspect = canvasWidth / canvasHeight
    
    if (videoAspect > canvasAspect) {
      // Video กว้างกว่า canvas - มี letterbox บนล่าง
      scaleX = canvasWidth
      scaleY = canvasWidth / videoAspect
      offsetY = (canvasHeight - scaleY) / 2
    } else {
      // Video สูงกว่า canvas - มี letterbox ซ้ายขวา
      scaleX = canvasHeight * videoAspect
      scaleY = canvasHeight
      offsetX = (canvasWidth - scaleX) / 2
    }
  }
  
  return { scaleX, scaleY, offsetX, offsetY }
}

// สร้างสีตามสถานะการมอง
export function getDrawingColors(isLookingAway: boolean): DrawingColors {
  return {
    primary: isLookingAway ? '#FF4444' : '#00FF88',
    secondary: isLookingAway ? '#FF8888' : '#44FFAA',
    glow: isLookingAway ? 'rgba(255, 68, 68, 0.3)' : 'rgba(0, 255, 136, 0.3)'
  }
}

// วาดเส้นเชื่อมจุด
export function drawConnectedLines(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  indices: number[],
  coordinates: DrawingCoordinates,
  color: string,
  lineWidth: number
) {
  if (indices.length < 2) return

  try {
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.shadowColor = color
    ctx.shadowBlur = 3
    ctx.globalCompositeOperation = 'screen'

    ctx.beginPath()
    
    if (!landmarks[indices[0]]) {
      ctx.restore()
      return
    }
    
    let startX = landmarks[indices[0]].x * coordinates.scaleX + coordinates.offsetX
    let startY = landmarks[indices[0]].y * coordinates.scaleY + coordinates.offsetY
    ctx.moveTo(startX, startY)

    for (let i = 1; i < indices.length; i++) {
      if (!landmarks[indices[i]]) continue
      
      const x = landmarks[indices[i]].x * coordinates.scaleX + coordinates.offsetX
      const y = landmarks[indices[i]].y * coordinates.scaleY + coordinates.offsetY
      ctx.lineTo(x, y)
    }

    ctx.stroke()
    ctx.restore()
  } catch (error) {
    ctx.restore()
  }
}

// วาดจุด landmarks
export function drawLandmarkPoints(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  coordinates: DrawingCoordinates,
  color: string,
  pointSize: number = 1.5
) {
  landmarks.forEach((landmark, index) => {
    if (!landmark || typeof landmark.x !== 'number' || typeof landmark.y !== 'number') {
      return
    }

    const x = landmark.x * coordinates.scaleX + coordinates.offsetX
    const y = landmark.y * coordinates.scaleY + coordinates.offsetY
    
    // วาดทุก 3 จุดเพื่อประสิทธิภาพ
    if (index % 3 === 0) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, pointSize, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
      ctx.restore()
    }
  })
}

// วาดโครงหน้า
export function drawFaceContours(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  coordinates: DrawingCoordinates,
  color: string
) {
  drawConnectedLines(ctx, landmarks, FACE_CONTOURS.faceOval, coordinates, color, 1)
}

// วาดตา
export function drawEyeContours(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  coordinates: DrawingCoordinates,
  color: string
) {
  drawConnectedLines(ctx, landmarks, FACE_CONTOURS.leftEye, coordinates, color, 1.5)
  drawConnectedLines(ctx, landmarks, FACE_CONTOURS.rightEye, coordinates, color, 1.5)
}

// วาดปาก
export function drawMouthContours(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  coordinates: DrawingCoordinates,
  color: string
) {
  drawConnectedLines(ctx, landmarks, FACE_CONTOURS.outerLips, coordinates, color, 1.5)
  drawConnectedLines(ctx, landmarks, FACE_CONTOURS.innerLips, coordinates, color, 1)
}

// วาดจมูก
export function drawNoseContours(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  coordinates: DrawingCoordinates,
  color: string
) {
  drawConnectedLines(ctx, landmarks, FACE_CONTOURS.noseBridge, coordinates, color, 1.5)
  drawConnectedLines(ctx, landmarks, FACE_CONTOURS.noseWings, coordinates, color, 1)
}

// วาดสถานะข้อมูล
export function drawStatusInfo(
  ctx: CanvasRenderingContext2D,
  data: FaceTrackingData,
  canvasWidth: number,
  canvasHeight: number
) {
  const statusColor = data.orientation.isLookingAway ? '#FF4444' : '#00FF88'
  ctx.fillStyle = statusColor
  ctx.font = '16px "Courier New", monospace'
  ctx.shadowColor = statusColor
  ctx.shadowBlur = 10
  
  const statusTexts = [
    `FACE_DETECTION: ${data.isDetected ? 'ACTIVE' : 'INACTIVE'}`,
    `ORIENTATION: ${data.orientation.isLookingAway ? 'LOOKING_AWAY' : 'FOCUSED'}`,
    `YAW: ${data.orientation.yaw.toFixed(1)}°`,
    `PITCH: ${data.orientation.pitch.toFixed(1)}°`,
    `DISTANCE: ${data.distance?.estimatedCm || 0}cm`,
    `LANDMARKS: ${data.landmarks?.length || 0} POINTS`
  ]

  statusTexts.forEach((text, index) => {
    ctx.fillText(text, 20, canvasHeight - 140 + (index * 22))
  })
  
  // แสดงแถบเตือนระยะห่างเกิน 80cm
  if (data.distance?.isTooFar) {
    ctx.fillStyle = '#FF0000'
    ctx.font = 'bold 20px Arial'
    ctx.fillText('⚠️ ระยะห่างเกินจากจอมากเกินไป!', 20, 40)
    ctx.fillStyle = '#FFAA00'
    ctx.font = '16px Arial'
    ctx.fillText(`เข้าใกล้จอให้ใกล้กว่า 80cm (ปัจจุบัน: ${data.distance.estimatedCm}cm)`, 20, 65)
  }
  
  ctx.shadowBlur = 0
}

// วาด Sci-Fi Face Mesh แบบสมบูรณ์
export function drawSciFiFaceMesh(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  video: HTMLVideoElement | null,
  canvasWidth: number,
  canvasHeight: number,
  isLookingAway: boolean
) {
  try {
    const coordinates = calculateCoordinates(video, canvasWidth, canvasHeight)
    const colors = getDrawingColors(isLookingAway)
    
    // วาดจุด landmarks
    drawLandmarkPoints(ctx, landmarks, coordinates, colors.primary)
    
    // วาดเส้นโครงต่างๆ
    drawFaceContours(ctx, landmarks, coordinates, colors.primary)
    drawEyeContours(ctx, landmarks, coordinates, colors.primary)
    drawMouthContours(ctx, landmarks, coordinates, colors.primary)
    drawNoseContours(ctx, landmarks, coordinates, colors.primary)
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการวาด Face Mesh:', error)
  }
}