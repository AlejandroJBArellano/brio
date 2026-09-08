import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

/**
 * Derives a consistent 32-byte key from available environment secrets.
 */
function getCipherKey(): Buffer {
  const secret =
    process.env.BRIO_CIPHER_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.BRIO_AGENT_TOKEN ||
    "brio_secure_cryptographic_master_key_2026";

  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plain text string into a formatted cipher payload:
 * `iv:authTag:cipherText` (hex encoded).
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return "";

  const key = getCipherKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for AES-GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a formatted cipher payload `iv:authTag:cipherText`.
 */
export function decryptSecret(cipherPayload: string): string {
  if (!cipherPayload) return "";

  const parts = cipherPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid cipher payload format. Expected 'iv:authTag:cipherText'");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getCipherKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
