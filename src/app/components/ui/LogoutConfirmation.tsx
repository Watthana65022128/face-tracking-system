// คอมโพเนนต์ยืนยันการออกจากระบบ
'use client'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'

interface LogoutConfirmationProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}



export function LogoutConfirmation({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  loading = false 
}: LogoutConfirmationProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="p-6 w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">ยืนยันการออกจากระบบ</h3>
          <p className="text-gray-600">คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?</p>
        </div>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm text-yellow-800 font-medium">หมายเหตุ</p>
                <p className="text-sm text-yellow-700 mt-1">
                  การติดตามงานที่กำลังดำเนินการอยู่จะถูกหยุด และคุณจะต้องเข้าสู่ระบบใหม่อีกครั้ง
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={onCancel}
              variant="secondary"
              disabled={loading}
              className="w-full"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-300"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังออกจากระบบ...
                </div>
              ) : (
                'ออกจากระบบ'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}