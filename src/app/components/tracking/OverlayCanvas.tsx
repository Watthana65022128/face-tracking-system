'use client'
import { forwardRef, useEffect } from 'react'

interface OverlayCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
}

export const OverlayCanvas = forwardRef<HTMLCanvasElement, OverlayCanvasProps>(
  ({ videoRef }, ref) => {
    // อัปเดตขนาด canvas เมื่อ video โหลดเสร็จ
    useEffect(() => {
      const video = videoRef.current
      const canvas = ref as React.RefObject<HTMLCanvasElement>
      
      if (video && canvas.current) {
        const updateCanvasSize = () => {
          // ใช้ขนาดจริงของ video element
          const videoRect = video.getBoundingClientRect()
          canvas.current!.width = video.offsetWidth || videoRect.width
          canvas.current!.height = video.offsetHeight || videoRect.height
        }
        
        video.addEventListener('loadedmetadata', updateCanvasSize)
        video.addEventListener('resize', updateCanvasSize)
        return () => {
          video.removeEventListener('loadedmetadata', updateCanvasSize)
          video.removeEventListener('resize', updateCanvasSize)
        }
      }
    }, [videoRef, ref])

    return (
      <canvas
        ref={ref}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />
    )
  }
)

OverlayCanvas.displayName = 'OverlayCanvas'