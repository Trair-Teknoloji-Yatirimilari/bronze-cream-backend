import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { headers } from "next/headers";



export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const headerList = await headers();
  const pathname = headerList.get("x-current-path");
  console.log(pathname, "pathname");

  const items = [
    {
      title: "Anasayfa",
      url: "/dashboard",
      isActive: pathname === "/dashboard",
    },
    {
      title: "Yüklenen Fotoğraflar",
      url: "/dashboard/recent-photos",
      isActive: pathname === "/dashboard/recent-photos",
    },
    {
      title: "Kullanım Raporları",
      url: "/dashboard/logs",
      isActive: pathname === "/dashboard/logs",
    },
    {
      title: "Kullanıcılar",
      url: "/dashboard/users",
      isActive: pathname === "/dashboard/users",
    },
    {
      title: "Ürünler",
      url: "/dashboard/products",
      isActive: pathname === "/dashboard/products",
    },
    {
      title: "Bildirimler",
      url: "/dashboard/notifications",
      isActive: pathname === "/dashboard/notifications",
    },
  ];

  return (
    <Sidebar {...props}>
      <SidebarHeader className="flex flex-col items-center justify-center p-4">
        <Image
          src="/btb-logo.png"
          alt="Born To Bronze"
          width={150}
          height={80}
          className="object-contain"
        />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {/* We create a collapsible SidebarGroup for each parent. */}

        <SidebarGroup>
          <SidebarGroupLabel className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"></SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.isActive}>
                    <a href={item.url}>{item.title}</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
