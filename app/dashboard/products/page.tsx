import prisma from "@/lib/prisma";
import ProductForm from "../components/products/ProductForm";
import ProductTable from "../components/products/ProductTable";
import { cookies } from "next/headers";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  link: string;
  isActive: boolean;
  isTrending: boolean;
  isSoldOut: boolean;
  isPopular: boolean;
  hasFilterEvent: boolean;
  filterColor?: string;
  intensity: number;
  filterType: string;
  createdAt: string;
  updatedAt: string;
  photoCount?: number;
}

export default async function ProductsPage() {
  const productsRaw = await prisma.products.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  // Her ürün için fotoğraf sayısını çek
  const productsWithPhotoCount = await Promise.all(
    productsRaw.map(async (p) => {
      const photoCount = await prisma.uploadedImg.count({
        where: { productId: p.id, isDeleted: false },
      });
      return {
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        filterColor: p.filterColor ?? undefined,
        photoCount,
      };
    })
  );
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  return (
    <div className="flex flex-col gap-6 w-full mx-auto">
      <ProductForm token={token} />
      <ProductTable initialData={productsWithPhotoCount as Product[]} token={token} />
    </div>
  );
}
