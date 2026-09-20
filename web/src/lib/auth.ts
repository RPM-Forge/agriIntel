import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LEN = 64;

function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? "agri-intel-dev-secret-do-not-use-in-prod";
}

export interface PasswordHash {
  salt: string;
  hash: string;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, storedHash] = stored.split("$");
  if (!salt || !storedHash) return false;
  const hash = scryptSync(password, salt, KEY_LEN);
  const expected = Buffer.from(storedHash, "hex");
  if (hash.length !== expected.length) return false;
  return timingSafeEqual(hash, expected);
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

export function createSessionToken(userId: string): string {
  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${expiry}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiryRaw, sig] = parts;
  const expiry = Number(expiryRaw);
  if (!userId || !Number.isFinite(expiry) || expiry < Date.now()) return null;
  const payload = `${userId}.${expiryRaw}`;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return userId;
}