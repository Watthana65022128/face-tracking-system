'use client'
import { forwardRef, useEffect } from 'react'

interface VideoPlayerProps {
  onVideoReady?: () => void
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ onVideoReady }, ref) => {
    useEffect(() => {
      const video = ref as React.RefObject<HTMLVideoElement>
      if (video.current) {
        const handleLoadedMetadata = () => {
          onVideoReady?.()
        }
        
        video.current.addEventListener('loadedmetadata', handleLoadedMetadata)
        return () => {
          video.current?.removeEventListener('loadedmetadata', handleLoadedMetadata)
        }
      }
    }, [ref, onVideoReady])

    return (
      <video
        ref={ref}
        className="w-full h-auto rounded-lg bg-black"
        autoPlay
        muted
        playsInline
      />
    )
  }
)

VideoPlayer.displayName = 'VideoPlayer'