import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || 1;
    const limit = searchParams.get("limit") || 10;
    const offset = (Number(page) - 1) * Number(limit);
    const product = searchParams.get("product") || "";
    try {
        switch (product) {
            case 'filter': {
                const products = await prisma.products.findMany({
                    where: {
                        hasFilterEvent: true
                    },
                    skip: offset,
                    take: Number(limit)
                })
                return NextResponse.json({ ok: true, products, total: products.length });
            }
            case 'all': {
                const products = await prisma.products.findMany({
                    skip: offset,
                    take: Number(limit)
                })
                return NextResponse.json({ ok: true, products, total: products.length });
            }
            default: {
                return NextResponse.json({ ok: false, message: "Geçersiz istek" }, { status: 400 });
            }
        }
    }
    catch (error: Error | unknown) {
        return NextResponse.json({ ok: false, message: (error as Error)?.message }, { status: 500 });
    }
}


export async function POST(request: NextRequest) {
    const authToken = request.headers.get("Authorization")
    if (!authToken) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }
    const decodedToken = await decrypt(authToken?.split(" ")[1])
    if (decodedToken.error) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }
    const user = await prisma.admins.findUnique({
        where: { id: decodedToken?.id as string }
    })
    if (!user) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }


    try {
        const formData = await request.formData();
        const name = (formData.get("name") || "").toString().trim();
        const description = (formData.get("description") || "").toString().trim();
        const price = Number(formData.get("price"));
        const link = (formData.get("link") || "").toString().trim();
        const isActive = formData.get("isActive") === "true";
        const isTrending = formData.get("isTrending") === "true";
        const isSoldOut = formData.get("isSoldOut") === "true";
        const isPopular = formData.get("isPopular") === "true";
        const hasFilterEvent = formData.get("hasFilterEvent") === "true";
        const filterColor = formData.get("filterColor")?.toString().trim() || null;
        const intensity = Number(formData.get("intensity")) || 1.0;
        const filterType = (formData.get("filterType") || "Color").toString().trim();
        // Dosya işlemi
        const file = formData.get("file") as File | null;
        if (!file) {
            return NextResponse.json({ ok: false, message: "Görsel yüklenmedi" }, { status: 400 });
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = Date.now() + "-" + file.name.replaceAll(" ", "_");
        const uploadDir = path.join(process.cwd(), "public/uploads");
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);
        const imageUrl = `/uploads/${filename}`;


        if (!name || !description || isNaN(price) || !imageUrl || !link) {
            return NextResponse.json({ ok: false, message: "Tüm zorunlu alanları doldurunuz" }, { status: 400 });
        }

        const product = await prisma.products.create({
            data: {
                name,
                description,
                price,
                imageUrl,
                link,
                isActive,
                isTrending,
                isSoldOut,
                isPopular,
                hasFilterEvent,
                filterColor: filterColor || null,
                intensity,
                filterType
            }
        })
        return NextResponse.json({ ok: true, message: "Ürün başarıyla oluşturuldu", product }, { status: 200 });
    } catch (e: Error | unknown) {
        console.error(e)
        return NextResponse.json({ ok: false, message: (e as Error)?.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const authToken = request.headers.get("Authorization")
    if (!authToken) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }
    const decodedToken = await decrypt(authToken?.split(" ")[1])
    if (decodedToken.error) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }
    const user = await prisma.admins.findUnique({
        where: { id: decodedToken?.id as string }
    })
    if (!user) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }

    try {
        const formData = await request.formData();
        const id = (formData.get("id") || "").toString().trim();
        const name = (formData.get("name") || "").toString().trim();
        const description = (formData.get("description") || "").toString().trim();
        const price = Number(formData.get("price"));
        const link = (formData.get("link") || "").toString().trim();
        const isActive = formData.get("isActive") === "true";
        const isTrending = formData.get("isTrending") === "true";
        const isSoldOut = formData.get("isSoldOut") === "true";
        const isPopular = formData.get("isPopular") === "true";
        const hasFilterEvent = formData.get("hasFilterEvent") === "true";
        const filterColor = formData.get("filterColor")?.toString().trim() || null;
        const intensity = Number(formData.get("intensity")) || 1.0;
        const filterType = (formData.get("filterType") || "Color").toString().trim();

        if (!id) {
            return NextResponse.json({ ok: false, message: "Ürün ID gereklidir" }, { status: 400 });
        }

        // Ürünün var olup olmadığını kontrol et
        const existingProduct = await prisma.products.findUnique({
            where: { id }
        });

        if (!existingProduct) {
            return NextResponse.json({ ok: false, message: "Ürün bulunamadı" }, { status: 404 });
        }

        if (!name || !description || isNaN(price) || !link) {
            return NextResponse.json({ ok: false, message: "Tüm zorunlu alanları doldurunuz" }, { status: 400 });
        }

        // Dosya işlemi (opsiyonel)
        const file = formData.get("file") as File | null;
        let imageUrl = existingProduct.imageUrl;

        if (file && file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = Date.now() + "-" + file.name.replaceAll(" ", "_");
            const uploadDir = path.join(process.cwd(), "public/uploads");
            await mkdir(uploadDir, { recursive: true });
            await writeFile(path.join(uploadDir, filename), buffer);
            imageUrl = `/uploads/${filename}`;
        }

        const updatedProduct = await prisma.products.update({
            where: { id },
            data: {
                name,
                description,
                price,
                imageUrl,
                link,
                isActive,
                isTrending,
                isSoldOut,
                isPopular,
                hasFilterEvent,
                filterColor: filterColor || null,
                intensity,
                filterType
            }
        });

        return NextResponse.json({ ok: true, message: "Ürün başarıyla güncellendi", product: updatedProduct }, { status: 200 });
    } catch (e: Error | unknown) {
        console.error(e)
        return NextResponse.json({ ok: false, message: (e as Error)?.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const authToken = request.headers.get("Authorization")
    if (!authToken) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }
    const decodedToken = await decrypt(authToken?.split(" ")[1])
    if (decodedToken.error) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }
    const user = await prisma.admins.findUnique({
        where: { id: decodedToken?.id as string }
    })
    if (!user) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }

    try {
        const { id } = await request.json();
        
        if (!id) {
            return NextResponse.json({ ok: false, message: "Ürün ID gereklidir" }, { status: 400 });
        }

        // Ürünün var olup olmadığını kontrol et
        const product = await prisma.products.findUnique({
            where: { id }
        });

        if (!product) {
            return NextResponse.json({ ok: false, message: "Ürün bulunamadı" }, { status: 404 });
        }

        // Ürünü sil
        await prisma.products.delete({
            where: { id }
        });

        return NextResponse.json({ ok: true, message: "Ürün başarıyla silindi" }, { status: 200 });
    } catch (e: Error | unknown) {
        console.error(e)
        return NextResponse.json({ ok: false, message: (e as Error)?.message }, { status: 500 });
    }
}
