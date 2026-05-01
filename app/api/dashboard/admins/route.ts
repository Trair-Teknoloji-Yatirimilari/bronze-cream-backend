import { NextRequest, NextResponse } from "next/server";
import CryptoJS from "crypto-js";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";

export async function POST(request: NextRequest) {
    const { email, password } = await request.json();
    if (!email || !password) {
        return NextResponse.json({ ok: false, message: "Email ve şifre gereklidir" }, { status: 400 });
    }

    const authToken = request.headers.get("Authorization")
    if (!authToken) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }
    const decodedToken = await decrypt(authToken?.split(" ")[1])
    if (decodedToken.error) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }

    const user = await prisma.admins.findUnique({
        where: {
            id: decodedToken?.id as string
        }
    })
    if (!user) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }
    try {
        const cryptedPassword = CryptoJS.SHA256(password).toString();
        const admin = await prisma.admins.create({
            data: {
                email,
                password: cryptedPassword
            }
        })
        return NextResponse.json({ ok: true, message: "Admin başarıyla oluşturuldu", admin }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ ok: false, message: "Admin oluşturulurken bir hata oluştu", error: error }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const authToken = request.headers.get("Authorization")
    if (!authToken) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }
    const decodedToken = await decrypt(authToken?.split(" ")[1])
    if (decodedToken.error) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }
    try {
        const admins = await prisma.admins.findMany({
            select: {
                id: true,
                email: true,
                password: false,
                createdAt: true,
                updatedAt: true
            }
        });
        return NextResponse.json({ ok: true, message: "Adminler başarıyla getirildi", admins }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ ok: false, message: "Adminler getirilirken bir hata oluştu", error: error }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { id } = await request.json();
    if (!id) {
        return NextResponse.json({ ok: false, message: "Admin ID gereklidir" }, { status: 400 });
    }
    const authToken = request.headers.get("Authorization")
    if (!authToken) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }
    const decodedToken = await decrypt(authToken?.split(" ")[1])
    if (decodedToken.error) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }

    const user = await prisma.admins.findUnique({
        where: {
            id: decodedToken?.id as string
        }
    })
    if (!user) {
        return NextResponse.json({ ok: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }
    try {
        const admin = await prisma.admins.delete({
            where: { id }
        })
        return NextResponse.json({ ok: true, message: "Admin başarıyla silindi", admin }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ ok: false, message: "Admin silinirken bir hata oluştu", error: error }, { status: 500 });
    }
}
