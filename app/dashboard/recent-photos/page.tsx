import prisma from "@/lib/prisma";
import RecentPhotosTableClient from "./RecentPhotosTableClient";
import type { Products, UploadedImg, User } from "@/lib/generated/prisma";
import { RecentPhotos } from "./columns";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cookies } from "next/headers";

const PAGE_SIZE = 20; // Son fotoğraflar için daha fazla gösterelim

function mapToRecentPhotos(item: UploadedImg & { user: User | null, product: Products | null }): RecentPhotos {
  // Device bilgisini doğru şekilde belirle
  let deviceInfo = "Diğer";
  const user = item.user;
  
  // Önce gerçek device bilgilerini kontrol et
  if (user?.deviceBrand || user?.systemName) {
    // En az bir device bilgisi varsa onu kullan
    if (user.deviceBrand && user.systemName) {
      deviceInfo = `${user.deviceBrand} (${user.systemName})`;
    } else if (user.deviceBrand) {
      deviceInfo = user.deviceBrand;
    } else if (user.systemName) {
      deviceInfo = user.systemName;
    }
  } else if (user?.userAgent) {
    // Fallback: userAgent'dan çıkarsama yap
    const userAgent = user.userAgent.toLowerCase();
    if (userAgent.includes("android") || userAgent.includes("okhttp")) {
      deviceInfo = "Android";
    } else if (userAgent.includes("iphone") || userAgent.includes("ios") || userAgent.includes("cfnetwork")) {
      deviceInfo = "iOS";
    }
  }

  return {
      id: item.id,
      img: item.url.startsWith("http") ? item.url : `https://bronze-api.trair.com.tr${item.url.startsWith("/") ? item.url : `/filtered/${item.url}`}`,
      device: deviceInfo,
      productName: item.product?.name || null,
      productId: item.productId || null,
      isPublic: item.isPublic,
      createdAt: item.createdAt.toISOString(),
      uploadTime: item.createdAt.toISOString(),
      isActive: !item.isDeleted && !item.isHidden,
      // Device bilgileri - doğru field mapping
      deviceBrand: user?.deviceBrand || null,
      deviceModel: user?.deviceId || null,
      systemInfo: user?.systemName && user?.systemVersion 
        ? `${user.systemName} ${user.systemVersion}` 
        : null,
      isEmulator: user?.isEmulator || null,
      isTablet: user?.isTablet || null,
      userId: user?.id || null,
      userIP: user?.userIP || null,
  };
}

export default async function RecentPhotosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  // Tüm yüklenen fotoğrafları getir (zaman kısıtlaması yok)
  const recentPhotos = await prisma.uploadedImg.findMany({
    where: {
      isDeleted: false,
    },
    include: { 
      user: true,
      product: true
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    skip: 0,
  });

  // Toplam fotoğraf sayısı
  const totalCount = await prisma.uploadedImg.count({
    where: {
      isDeleted: false,
    },
  });

  const data = recentPhotos.map(mapToRecentPhotos);

  return (
    <div className="min-h-screen  w-full h-full">
      <div className="container mx-auto px-4 py-6 ">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-900 font-medium">
                  Yüklenen Fotoğraflar
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Main Content */}
        <RecentPhotosTableClient
          initialData={data}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          token={token ?? ""}
        />
      </div>
    </div>
  );
} 