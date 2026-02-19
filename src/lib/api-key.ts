import { createHash, randomBytes } from "crypto";

const KEY_PREFIX = "nf_";
const KEY_BYTES = 24;

export function generateApiKey(): string {
  const bytes = randomBytes(KEY_BYTES);
  return KEY_PREFIX + bytes.toString("base64url");
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function verifyApiKey(plainKey: string, hashedKey: string): boolean {
  return hashApiKey(plainKey) === hashedKey;
}
