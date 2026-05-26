"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState, useRef } from "react";
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface FormErrors {
  email?: string;
  password?: string;
}

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const formRef = useRef<HTMLFormElement>(null);

  // Email validasyonu
  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email adresi gereklidir";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Geçerli bir email adresi giriniz";
    return undefined;
  };

  // Şifre validasyonu
  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Şifre gereklidir";
    if (password.length < 3) return "Şifre en az 3 karakter olmalıdır";
    return undefined;
  };

  // Input değeri değiştiğinde validasyon
  const handleInputChange = (field: "email" | "password", value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (touched[field]) {
      const error = field === "email" ? validateEmail(value) : validatePassword(value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Input focus kaybettiğinde validasyon
  const handleBlur = (field: "email" | "password") => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = formData[field];
    const error = field === "email" ? validateEmail(value) : validatePassword(value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Tüm alanları touched olarak işaretle
    setTouched({ email: true, password: true });
    
    // Validasyon kontrolleri
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    const newErrors: FormErrors = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    
    // Eğer hata varsa submit etme
    if (Object.keys(newErrors).length > 0) {
      toast.error("Lütfen formu doğru şekilde doldurunuz");
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Form submit edildi:", { email: formData.email, password: "***" });
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const result = await response.json();
      
      console.log("API result:", result);
      
      if (result && result.error) {
        console.log("Hata bulundu:", result.error);
        toast.error(result.error, {
          description: "Giriş bilgilerinizi kontrol edip tekrar deneyiniz.",
          duration: 5000,
        });
        
        // Form alanlarını temizle
        setFormData({ email: "", password: "" });
        setTouched({ email: false, password: false });
        setErrors({});
      } else if (result && result.success) {
        console.log("Başarılı giriş, yönlendiriliyor");
        toast.success("Giriş başarılı!", {
          description: "Dashboard'a yönlendiriliyorsunuz...",
          duration: 2000,
        });
        
        // Cookie kontrolü
        setTimeout(() => {
          console.log("All cookies:", document.cookie);
          const hasToken = document.cookie.includes('token=');
          console.log("Token cookie exists:", hasToken);
          
          if (!hasToken) {
            console.warn("Token cookie not found! Redirecting anyway...");
          }
          
          window.location.href = "/dashboard";
        }, 1000);
      } else {
        console.log("Beklenmeyen durum - result:", result);
        toast.error("Beklenmeyen bir durum oluştu", {
          description: "Lütfen tekrar deneyiniz.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Beklenmeyen bir hata oluştu", {
        description: "Lütfen daha sonra tekrar deneyiniz.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-0 shadow-2xl ">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            ref={formRef}
            className="p-8 space-y-6"
            onSubmit={handleSubmit}
          >
            <div className="space-y-2 text-center">
              <img
                src="/btb-logo.png"
                alt="Born To Bronze"
                className="h-12 mx-auto mb-4 object-contain"
              />
              <h1 className="text-3xl font-bold tracking-tight">
                Tekrar Hoşgeldin
              </h1>
              <p className="text-muted-foreground">
                Born To Bronze yönetim paneline giriş yapın
              </p>
            </div>

            <div className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Adresi
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    disabled={isLoading}
                    className={cn(
                      "transition-all duration-200",
                      errors.email && touched.email
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "focus:border-blue-500 focus:ring-blue-500/20",
                      formData.email && !errors.email && touched.email
                        ? "border-green-500 focus:border-green-500"
                        : ""
                    )}
                  />
                  {touched.email && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {errors.email ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : formData.email ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : null}
                    </div>
                  )}
                </div>
                {errors.email && touched.email && (
                  <p className="text-xs text-red-600 animate-in slide-in-from-top-1 duration-200">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Şifre
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    disabled={isLoading}
                    className={cn(
                      "pr-20 transition-all duration-200",
                      errors.password && touched.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "focus:border-blue-500 focus:ring-blue-500/20",
                      formData.password && !errors.password && touched.password
                        ? "border-green-500 focus:border-green-500"
                        : ""
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                    {touched.password && (
                      <div>
                        {errors.password ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : formData.password ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : null}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {errors.password && touched.password && (
                  <p className="text-xs text-red-600 animate-in slide-in-from-top-1 duration-200">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02]" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Giriş yapılıyor...</span>
                </div>
              ) : (
                "Giriş Yap"
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Güvenli giriş için tüm bilgileriniz şifrelenmektedir.
              </p>
            </div>
          </form>

          <div className=" relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-yellow-50 to-white" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-neutral-800 space-y-4 p-8">
                <img
                  src="/btb-logo.png"
                  alt="Born To Bronze"
                  className="h-20 mx-auto object-contain"
                />
                <p className="text-lg opacity-80">
                  Yönetim Paneli — Eda Taşpınar
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
