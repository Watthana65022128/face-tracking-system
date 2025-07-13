'use client'
import { Button } from '@/app/components/ui/Button'

interface ControlPanelProps {
  isActive: boolean
  onStop: () => void
}

export function ControlPanel({ isActive, onStop }: ControlPanelProps) {
  if (!isActive) return null

  return (
    <div className="flex justify-center mt-6">
      <Button
        onClick={onStop}
        variant="secondary"
        className="px-8 py-3"
      >
        ⏹️ หยุดติดตาม
      </Button>
    </div>
  )
}