import crypto from "node:crypto";
import bcrypt from "bcrypt";

export function generateToken(): string {
  return crypto.randomUUID();
}

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export async function compareToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}
