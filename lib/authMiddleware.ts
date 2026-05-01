import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./auth";
import prisma from "./prisma";

export function withAuth(
  handler: (request: NextRequest, adminId?: string) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Authorization header kontrolü
      const authToken = request.headers.get("Authorization");
      if (!authToken || !authToken.startsWith("Bearer ")) {
        return NextResponse.json(
          { error: "Bu işlem için yetkiniz yok" },
          { status: 401 }
        );
      }

      // Token'ı decode et
      const token = authToken.split(" ")[1];
      const decodedToken = await decrypt(token);
      
      if (decodedToken.error || !decodedToken.id) {
        return NextResponse.json(
          { error: "Geçersiz token" },
          { status: 401 }
        );
      }

      // Admin var mı kontrol et
      const admin = await prisma.admins.findUnique({
        where: { id: decodedToken.id as string },
      });

      if (!admin) {
        return NextResponse.json(
          { error: "Yetkisiz erişim" },
          { status: 403 }
        );
      }

      // Handler'ı çağır
      return await handler(request, admin.id);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { error: "Sunucu hatası" },
        { status: 500 }
      );
    }
  };
}

interface ValidationRule {
  required?: boolean;
  type?: "email" | "string" | "number";
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export async function validateInput(
  data: Record<string, unknown>, 
  rules: Record<string, ValidationRule>
): Promise<string[] | null> {
  const errors: string[] = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    if (rule.required && (!value || (typeof value === "string" && value.trim() === ""))) {
      errors.push(`${field} gereklidir`);
      continue;
    }

    if (value && rule.type === "email" && typeof value === "string") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`Geçerli bir ${field} adresi giriniz`);
      }
    }

    if (value && rule.minLength && typeof value === "string" && value.length < rule.minLength) {
      errors.push(`${field} en az ${rule.minLength} karakter olmalıdır`);
    }

    if (value && rule.maxLength && typeof value === "string" && value.length > rule.maxLength) {
      errors.push(`${field} en fazla ${rule.maxLength} karakter olmalıdır`);
    }

    if (value && rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
      errors.push(`${field} formatı geçersiz`);
    }
  }

  return errors.length > 0 ? errors : null;
}

// Rate limiting için basit in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const current = rateLimitStore.get(identifier);
  
  if (!current || current.resetTime < windowStart) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
} 