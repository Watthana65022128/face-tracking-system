"use client";
import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { PasswordInput } from "@/app/components/ui/PasswordInput";
import { Card } from "@/app/components/ui/Card";
import { Select } from "@/app/components/ui/Select";
import { validatePassword, validateName, validateEmail, validateStudentId, validateTitle, validatePhoneNumber } from "@/lib/utils/validation";

interface AuthFormProps {
  type: "login" | "register";
  onSubmit: (data: any) => void;
  loading?: boolean;
}

export function AuthForm({ type, onSubmit, loading = false }: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    title: "",
    firstName: "",
    lastName: "",
    studentId: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [duplicateErrors, setDuplicateErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    // Validate email for both login and register
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error || "อีเมลไม่ถูกต้อง";
    }

    // Validate for registration
    if (type === "register") {
      // Validate title
      const titleValidation = validateTitle(formData.title);
      if (!titleValidation.isValid) {
        newErrors.title = titleValidation.error || "กรุณาเลือกคำนำหน้าชื่อ";
      }

      // Validate first name
      const firstNameValidation = validateName(formData.firstName);
      if (!firstNameValidation.isValid) {
        newErrors.firstName = firstNameValidation.error || "ชื่อไม่ถูกต้อง";
      }

      // Validate last name
      const lastNameValidation = validateName(formData.lastName);
      if (!lastNameValidation.isValid) {
        newErrors.lastName = lastNameValidation.error || "นามสกุลไม่ถูกต้อง";
      }

      // Validate student ID
      const studentIdValidation = validateStudentId(formData.studentId);
      if (!studentIdValidation.isValid) {
        newErrors.studentId = studentIdValidation.error || "รหัสผู้เรียนไม่ถูกต้อง";
      }

      // Validate phone number
      const phoneValidation = validatePhoneNumber(formData.phoneNumber);
      if (!phoneValidation.isValid) {
        newErrors.phoneNumber = phoneValidation.error || "เบอร์โทรศัพท์ไม่ถูกต้อง";
      }

      // Validate password
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = "รหัสผ่านไม่ปลอดภัยเพียงพอ";
      }

      // Validate password confirmation
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
      }
    }

    // Check for duplicate errors (only for register)
    const allErrors = type === "register" ? { ...newErrors, ...duplicateErrors } : newErrors;
    
    // If there are any errors, show them and stop submission
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    // Use normalized email for submission if validation passed
    const submitData = { ...formData };
    if (emailValidation.normalizedEmail) {
      submitData.email = emailValidation.normalizedEmail;
    }

    onSubmit(submitData);
  };

  // ฟังก์ชันตรวจสอบข้อมูลซ้ำ
  const checkDuplicate = async (field: string, value: string) => {
    if (!value.trim()) return;
    
    setChecking(prev => ({ ...prev, [field]: true }));
    
    try {
      const response = await fetch('/api/auth/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value: value.trim() })
      });
      
      const result = await response.json();
      
      if (result.isDuplicate) {
        setDuplicateErrors(prev => ({ ...prev, [field]: result.message }));
      } else {
        setDuplicateErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Duplicate check error:', error);
    } finally {
      setChecking(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
      
      // Clear errors when user types
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
      if (duplicateErrors[field]) {
        setDuplicateErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };

  // ฟังก์ชันสำหรับการ blur (เมื่อผู้ใช้คลิกออกจากฟิลด์)
  const handleBlur = (field: string) => () => {
    const value = formData[field as keyof typeof formData];
    
    // ตรวจสอบเฉพาะฟิลด์ที่ต้องการ และเฉพาะในกรณีที่เป็น register เท่านั้น
    if (type === "register" && ['email', 'studentId', 'phoneNumber'].includes(field) && value) {
      // ตรวจสอบการ validate พื้นฐานก่อน
      let isValidFormat = true;
      
      if (field === 'email') {
        const emailValidation = validateEmail(value);
        isValidFormat = emailValidation.isValid;
      } else if (field === 'studentId') {
        const studentIdValidation = validateStudentId(value);
        isValidFormat = studentIdValidation.isValid;
      } else if (field === 'phoneNumber') {
        const phoneValidation = validatePhoneNumber(value);
        isValidFormat = phoneValidation.isValid;
      }
      
      // ถ้า format ถูกต้องแล้วค่อยตรวจสอบซ้ำ
      if (isValidFormat) {
        checkDuplicate(field, value);
      }
    }
  };

  return (
    <Card className="p-8 w-full max-w-md mx-auto">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {type === "register" && (
          <>
            <Select
              label="คำนำหน้าชื่อ"
              value={formData.title}
              onChange={handleChange("title")}
              placeholder="กรุณาเลือก"
              required
              error={errors.title}
              options={[
                { value: "นาย", label: "นาย" },
                { value: "นาง", label: "นาง" },
                { value: "นางสาว", label: "นางสาว" },
                { value: "เด็กชาย", label: "เด็กชาย" },
                { value: "เด็กหญิง", label: "เด็กหญิง" },
                { value: "ดร.", label: "ดร." },
                { value: "ศ.ดร.", label: "ศ.ดร." },
                { value: "รศ.ดร.", label: "รศ.ดร." },
                { value: "ผศ.ดร.", label: "ผศ.ดร." },
                { value: "ศ.", label: "ศ." },
                { value: "รศ.", label: "รศ." },
                { value: "ผศ.", label: "ผศ." },
                { value: "พระ", label: "พระ" },
                { value: "แม่ชี", label: "แม่ชี" },
                { value: "สามเณร", label: "สามเณร" },
                { value: "สามเณรี", label: "สามเณรี" }
              ]}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="ชื่อ"
                value={formData.firstName}
                onChange={handleChange("firstName")}
                required
                error={errors.firstName}
              />
              <Input
                label="นามสกุล"
                value={formData.lastName}
                onChange={handleChange("lastName")}
                required
                error={errors.lastName}
              />
            </div>
            <Input
              label="รหัสผู้เรียน"
              value={formData.studentId}
              onChange={handleChange("studentId")}
              onBlur={handleBlur("studentId")}
              placeholder="650xxxx"
              error={errors.studentId || duplicateErrors.studentId}
            />
            <Input
              label="เบอร์โทรศัพท์"
              value={formData.phoneNumber}
              onChange={handleChange("phoneNumber")}
              onBlur={handleBlur("phoneNumber")}
              error={errors.phoneNumber || duplicateErrors.phoneNumber}
            />
          </>
        )}

        <Input
          label="อีเมล"
          type="email"
          value={formData.email}
          onChange={handleChange("email")}
          onBlur={handleBlur("email")}
          required
          error={errors.email || (type === "register" ? duplicateErrors.email : "")}
        />

        <PasswordInput
          label="รหัสผ่าน"
          value={formData.password}
          onChange={handleChange("password")}
          placeholder="••••••••"
          required
          showStrength={type === "register"}
          showToggle={true}
          error={errors.password}
        />

        {type === "register" && (
          <PasswordInput
            label="ยืนยันรหัสผ่าน"
            value={formData.confirmPassword}
            onChange={handleChange("confirmPassword")}
            placeholder="••••••••"
            required
            showStrength={false}
            showToggle={false} // ไม่แสดงปุ่ม toggle สำหรับช่องยืนยันรหัสผ่าน
            error={errors.confirmPassword}
          />
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              กำลังดำเนินการ...
            </div>
          ) : type === "login" ? (
            "เข้าสู่ระบบ"
          ) : (
            "ลงทะเบียน"
          )}
        </Button>
      </form>

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
    </Card>
  );
}
