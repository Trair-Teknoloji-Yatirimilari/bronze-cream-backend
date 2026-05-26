import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import CryptoJS from "crypto-js";

// Rate limiting için basit in-memory store
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Rate limit kontrolü
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }
  
  // 15 dakika içinde 5'ten fazla deneme varsa engelle
  if (now - attempts.lastAttempt < 15 * 60 * 1000 && attempts.count >= 5) {
    return false;
  }
  
  // 15 dakika geçtiyse counter'ı sıfırla
  if (now - attempts.lastAttempt >= 15 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Deneme sayısını artır
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // IP adresini al
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    
    // Rate limit kontrolü
    if (!checkRateLimit(ip)) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: "Çok fazla başarısız deneme. 15 dakika sonra tekrar deneyin.", success: false },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email ve şifre gereklidir", success: false },
        { status: 400 }
      );
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Geçerli bir email adresi giriniz", success: false },
        { status: 400 }
      );
    }

    const user = await prisma.admins.findUnique({
      where: { email },
    });

    const cryptedPassword = CryptoJS.SHA256(password).toString();

    if (!user || user.password !== cryptedPassword) {
      return NextResponse.json(
        { error: "Geçersiz email veya şifre", success: false },
        { status: 401 }
      );
    }

    // Başarılı giriş durumunda rate limit'i temizle
    loginAttempts.delete(ip);

    // ✅ Token üret
    const token = await generateToken({
      id: user.id,
      email: user.email,
    });

    // ✅ Token'ı cookie olarak kaydet
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60,
      path: "/",
      sameSite: "lax",
    });

    const response = NextResponse.json(
      { error: null, success: true, message: "Giriş başarılı" },
      { status: 200 }
    );
    
    // Response header'ına da cookie ekle
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60,
      path: "/",
      sameSite: "lax",
    });
    
    return response;

  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { 
        error: "Sunucu ile alakalı bir sorun oluştu lütfen daha sonra tekrar deneyiniz",
        success: false 
      },
      { status: 500 }
    );
  }
} 