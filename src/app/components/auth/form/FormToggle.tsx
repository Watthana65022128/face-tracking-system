interface FormToggleProps {
  type: "login" | "register"
}

export function FormToggle({ type }: FormToggleProps) {
  return (
    <div className="mt-6 text-center">
      <p className="text-gray-600">
        {type === "login" ? "ยังไม่มีบัญชี?" : "มีบัญชีแล้ว?"}
        <a
          href={type === "login" ? "/register" : "/login"}
          className="ml-2 text-purple-600 hover:text-purple-700 font-medium"
        >
          {type === "login" ? "ลงทะเบียน" : "เข้าสู่ระบบ"}
        </a>
      </p>
    </div>
  )
}