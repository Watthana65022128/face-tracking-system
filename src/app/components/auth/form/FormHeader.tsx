interface FormHeaderProps {
  type: "login" | "register"
}

export function FormHeader({ type }: FormHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800">
        {type === "login" ? "เข้าสู่ระบบ" : "ลงทะเบียน"}
      </h2>
      <p className="text-gray-600 mt-2">
        {type === "login"
          ? "ยินดีต้อนรับ"
          : "สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งาน"}
      </p>
    </div>
  )
}