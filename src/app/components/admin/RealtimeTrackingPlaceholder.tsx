'use client'

import { Card } from '@/app/components/ui/Card'

export function RealtimeTrackingPlaceholder() {
  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-purple-100 rounded-full">
          <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900">Real-time Tracking</h3>
        <p className="text-gray-600 max-w-md">
          ฟีเจอร์การติดตามแบบเรียลไทม์จะพร้อมใช้งานในเร็วๆ นี้
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 text-sm">
            🚧 อยู่ระหว่างการพัฒนา - Coming Soon
          </p>
        </div>
      </div>
    </Card>
  )
}