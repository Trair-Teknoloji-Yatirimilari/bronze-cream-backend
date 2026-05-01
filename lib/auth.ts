// lib/auth.ts
import { JWTPayload, jwtVerify, SignJWT } from 'jose';

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET is not set in .env');
const encoder = new TextEncoder();
const encodedKey = new TextEncoder().encode(secret)

export async function generateToken(payload: JWTPayload): Promise<string> {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(encoder.encode(secret));
}

export async function verifyToken(token: string): Promise<JWTPayload | { error: string }> {
    try {
        const { payload } = await jwtVerify(token, encoder.encode(secret));
        return payload;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Bir hata oluştu.";
        return { error: message };
    }
}

export async function decrypt(token: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(token, encodedKey, {
            algorithms: ['HS256'],
        })
        return payload
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Bir hata oluştu.";
        return { error: message };
    }
}