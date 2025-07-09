"use client";
import { useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { validatePassword, validateName, validateEmail, validateStudentId, validateTitle, validatePhoneNumber } from "@/lib/utils/validation";
import { LoginForm } from "./form/LoginForm";
import { RegisterForm } from "./form/RegisterForm";
import { FormHeader } from "./form/FormHeader";
import { SubmitButton } from "./form/SubmitButton";
import { FormToggle } from "./form/FormToggle";

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

    // ตรวจสอบความถูกต้องอีเมลสำหรับทั้งการเข้าสู่ระบบและการลงทะเบียน
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error || "อีเมลไม่ถูกต้อง";
    }

    // ตรวจสอบความถูกต้องสำหรับการลงทะเบียน
    if (type === "register") {
      // ตรวจสอบความถูกต้องคำนำหน้าชื่อ
      const titleValidation = validateTitle(formData.title);
      if (!titleValidation.isValid) {
        newErrors.title = titleValidation.error || "กรุณาเลือกคำนำหน้าชื่อ";
      }

      // ตรวจสอบความถูกต้องชื่อ
      const firstNameValidation = validateName(formData.firstName);
      if (!firstNameValidation.isValid) {
        newErrors.firstName = firstNameValidation.error || "ชื่อไม่ถูกต้อง";
      }

      // ตรวจสอบความถูกต้องนามสกุล
      const lastNameValidation = validateName(formData.lastName);
      if (!lastNameValidation.isValid) {
        newErrors.lastName = lastNameValidation.error || "นามสกุลไม่ถูกต้อง";
      }

      // ตรวจสอบความถูกต้องรหัสผู้เรียน
      const studentIdValidation = validateStudentId(formData.studentId);
      if (!studentIdValidation.isValid) {
        newErrors.studentId = studentIdValidation.error || "รหัสผู้เรียนไม่ถูกต้อง";
      }

      // ตรวจสอบความถูกต้องเบอร์โทรศัพท์
      const phoneValidation = validatePhoneNumber(formData.phoneNumber);
      if (!phoneValidation.isValid) {
        newErrors.phoneNumber = phoneValidation.error || "เบอร์โทรศัพท์ไม่ถูกต้อง";
      }

      // ตรวจสอบความถูกต้องรหัสผ่าน
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = "รหัสผ่านไม่ปลอดภัยเพียงพอ";
      }

      // ตรวจสอบความถูกต้องการยืนยันรหัสผ่าน
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
      }
    }

    // ตรวจสอบข้อผิดพลาดข้อมูลซ้ำ (เฉพาะการลงทะเบียนเท่านั้น)
    const allErrors = type === "register" ? { ...newErrors, ...duplicateErrors } : newErrors;
    
    // หากมีข้อผิดพลาด ให้แสดงและหยุดการส่งข้อมูล
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    // ใช้อีเมลที่ปรับแล้วสำหรับการส่งข้อมูล
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
      
      // ล้างข้อผิดพลาดเมื่อผู้ใช้พิมพ์
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
      // ตรวจสอบการตรวจสอบความถูกต้องพื้นฐานก่อน
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
      
      // ถ้ารูปแบบถูกต้องแล้วค่อยตรวจสอบซ้ำ
      if (isValidFormat) {
        checkDuplicate(field, value);
      }
    }
  };

  return (
    <Card className="p-8 w-full max-w-md mx-auto">
      <FormHeader type={type} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {type === "register" ? (
          <RegisterForm
            formData={formData}
            errors={errors}
            duplicateErrors={duplicateErrors}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        ) : (
          <LoginForm
            email={formData.email}
            password={formData.password}
            errors={errors}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        )}

        <SubmitButton type={type} loading={loading} />
      </form>

      <FormToggle type={type} />
    </Card>
  );
}
