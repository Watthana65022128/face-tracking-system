import { Input } from "@/app/components/ui/Input"
import { PasswordInput } from "@/app/components/ui/PasswordInput"

interface LoginFormProps {
  email: string
  password: string
  errors: Record<string, string>
  onChange: (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (field: string) => () => void
}

export function LoginForm({ 
  email, 
  password, 
  errors, 
  onChange, 
  onBlur 
}: LoginFormProps) {
  return (
    <>
      <Input
        label="อีเมล"
        type="email"
        value={email}
        onChange={onChange("email")}
        onBlur={onBlur("email")}
        required
        error={errors.email}
      />

      <PasswordInput
        label="รหัสผ่าน"
        value={password}
        onChange={onChange("password")}
        placeholder="••••••••"
        required
        showStrength={false}
        showToggle={true}
        error={errors.password}
      />
    </>
  )
}