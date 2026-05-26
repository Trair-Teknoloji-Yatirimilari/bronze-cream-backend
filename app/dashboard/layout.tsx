import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminProvider } from "@/contexts/AdminContext";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  console.log("Dashboard: Token check -", token ? "Found" : "Not found");
  if (!token) {
    console.log("Dashboard: No token, redirecting to login");
    redirect("/");
  }
  const decodedToken = await decrypt(token.value);
  if (decodedToken.error) {
    redirect("/");
  }

  const headerList = await headers();
  const pathname = headerList.get("x-current-path");
  console.log(pathname, "pathname");

  const breadcrumbTitle = pathname?.split("/").pop();
  let breadcrumbTitleText = "";
  switch (breadcrumbTitle) {
    case "dashboard":
      breadcrumbTitleText = "Dashboard";
      break;
    case "users":
      breadcrumbTitleText = "Kullanıcılar";
      break;
    case "logs":
      breadcrumbTitleText = "Kullanım Raporları";
      break;
    default:
  }

  return (
    <SidebarProvider>
      <AdminProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Born To Bronze</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{breadcrumbTitleText}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </AdminProvider>
    </SidebarProvider>
  );
}
