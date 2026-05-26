"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    // Cookie'yi sil
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    // Login sayfasına yönlendir
    router.push("/");
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4" />
      Çıkış Yap
    </Button>
  );
}
