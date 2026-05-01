import CryptoJS from "crypto-js";

export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (!password) {
    return { isValid: false, message: "Şifre gereklidir" };
  }
  
  if (password.length < 3) {
    return { isValid: false, message: "Şifre en az 3 karakter olmalıdır" };
  }
  
  return { isValid: true };
}

export function hashPassword(password: string): string {
  // Salt ekleyerek güvenliği artır
  const salt = process.env.PASSWORD_SALT || "bronzify_default_salt_2024";
  const saltedPassword = password + salt;
  return CryptoJS.SHA256(saltedPassword).toString();
}

export function verifyPassword(inputPassword: string, hashedPassword: string): boolean {
  const hashedInput = hashPassword(inputPassword);
  return hashedInput === hashedPassword;
} 