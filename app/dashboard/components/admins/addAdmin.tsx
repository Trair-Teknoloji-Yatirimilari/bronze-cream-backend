"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { useAdminContext } from "@/contexts/AdminContext";

interface AddAdminsComponentProps {
  token: string;
}

export default function AddAdminsComponent({
  token,
}: AddAdminsComponentProps) {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { addAdmin } = useAdminContext();

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    
    console.log("handleSubmit başladı (client-side fetch)");
    
    try {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      
      console.log("Form verileri:", { email, password: "***" });
      
      const response = await fetch("/api/dashboard/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log("Fetch response status:", response.status);
      
      const data = await response.json();
      console.log("Fetch response data:", data);
      
      if (data.ok) {
        toast.success(data.message);
        // Context'e yeni admin'i ekle
        const newAdmin = {
          id: data.admin?.id || Date.now().toString(),
          email,
          createdAt: data.admin?.createdAt || new Date().toISOString(),
          updatedAt: data.admin?.updatedAt || new Date().toISOString(),
        };
        addAdmin(newAdmin);

        // Formu temizle
        if (formRef.current) {
          formRef.current.reset();
        }
      } else {
        toast.error(data.message || "Bilinmeyen bir hata oluştu");
      }
    } catch (error) {
      console.error("handleSubmit error:", error);
      toast.error("Bir hata oluştu");
    }
    
    setLoading(false);
  };

  return (
    <>
      <form
        ref={formRef}
        className="flex gap-3 items-center justify-center px-4 py-4 border-b border-gray-200"
        action={handleSubmit}
      >
        <Input
          placeholder="Admin E-posta"
          name="email"
          id="email"
          type="email"
          required
        />
        <Input
          placeholder="Admin Şifre"
          name="password"
          id="password"
          type="password"
          required
        />
        <Button disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ekle"}
        </Button>
      </form>
    </>
  );
}
