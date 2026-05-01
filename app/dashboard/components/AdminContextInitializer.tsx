"use client";

import { useEffect } from "react";
import { useAdminContext } from "@/contexts/AdminContext";

interface Admin {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminContextInitializerProps {
  initialAdmins: Admin[];
}

export function AdminContextInitializer({ initialAdmins }: AdminContextInitializerProps) {
  const { setAdmins } = useAdminContext();

  useEffect(() => {
    setAdmins(initialAdmins);
  }, [initialAdmins, setAdmins]);

  return null; // Bu component sadece context'i initialize eder, UI render etmez
} 