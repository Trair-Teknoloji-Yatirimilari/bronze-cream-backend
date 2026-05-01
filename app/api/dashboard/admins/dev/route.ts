import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server"
import CryptoJS from "crypto-js";

export async function POST(request: NextRequest) {
    console.log("API: Admin oluşturma isteği alındı");
    const { email, password } = await request.json()
    const cryptedPassword = CryptoJS.SHA256(password).toString();
    const admin = await prisma.admins.create({
        data: {
            email,
            password: cryptedPassword
        }
    })
    return NextResponse.json({ ok: true, message: "Admin başarıyla oluşturuldu", admin }, { status: 200 });

}