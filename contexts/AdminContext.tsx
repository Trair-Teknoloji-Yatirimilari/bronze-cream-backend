"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface Admin {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminContextType {
  admins: Admin[];
  setAdmins: (admins: Admin[]) => void;
  addAdmin: (admin: Admin) => void;
  removeAdmin: (id: string) => void;
  refreshAdmins: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admins, setAdmins] = useState<Admin[]>([]);

  const addAdmin = (admin: Admin) => {
    setAdmins(prev => [...prev, admin]);
  };

  const removeAdmin = (id: string) => {
    setAdmins(prev => prev.filter(admin => admin.id !== id));
  };

  const refreshAdmins = async () => {
    try {
      const response = await fetch("/api/dashboard/admins", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.ok) {
        setAdmins(data.admins);
      }
    } catch (err) {
      console.error("Admin listesi yenilenirken hata:", err);
    }
  };

  const value = {
    admins,
    setAdmins,
    addAdmin,
    removeAdmin,
    refreshAdmins,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdminContext must be used within an AdminProvider");
  }
  return context;
} 