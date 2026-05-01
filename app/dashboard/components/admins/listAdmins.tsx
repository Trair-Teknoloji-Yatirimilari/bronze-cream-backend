"use client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useAdminContext } from "@/contexts/AdminContext";

interface AdminsListComponentProps {
  token: string;
  admins: {
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

export default function AdminsListComponent({
  token,
  admins: initialAdmins, // Server'dan gelen initial data
}: AdminsListComponentProps) {
  const { admins, removeAdmin } = useAdminContext();
  
  // Context'te admin yoksa initial data'yı kullan
  const displayAdmins = admins.length > 0 ? admins : initialAdmins;

  const AdminItem = ({
    item,
  }: {
    item: { id: string; email: string; createdAt: string; updatedAt: string };
  }) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
      setLoading(true);
      
      console.log("handleDelete başladı (client-side fetch):", item.id);
      
      try {
        const response = await fetch("/api/dashboard/admins", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id: item.id }),
        });
        
        console.log("Delete fetch response status:", response.status);
        
        const data = await response.json();
        console.log("Delete fetch response data:", data);
        
        if (data.ok) {
          toast.success(data.message);
          // Context'ten admin'i kaldır
          removeAdmin(item.id);
        } else {
          toast.error(data.message || "Admin silinirken bir hata oluştu");
        }
      } catch (error) {
        console.error("handleDelete error:", error);
        toast.error("Bir hata oluştu");
      }
      
      setLoading(false);
    };
    
    return (
      <div className="flex gap-3 items-center justify-between w-full border-b border-gray-200 py-2">
        <p className="w-full">{item.email}</p>
        <p className=" text-sm italic text-gray-500 ">
          {new Date(item.createdAt).toLocaleDateString()}
        </p>
        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sil"}
        </Button>
      </div>
    );
  };

  return (
    <>
      <div className="w-full h-full  rounded overflow-auto flex flex-col gap-3 p-4 max-h-[calc(50vh-10rem)]">
        {displayAdmins?.map((admin) => (
          <AdminItem key={admin.id} item={admin} />
        ))}
      </div>
    </>
  );
}
