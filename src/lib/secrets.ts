import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

function getEncryptionKey() {
  const secret = process.env.BETTER_AUTH_SECRET?.trim()
  if (!secret || secret.length < 16) {
    throw new Error("BETTER_AUTH_SECRET must be set to encrypt BYOK secrets")
  }
  return createHash("sha256").update(secret).digest()
}

export function encryptSecret(plainText: string) {
  const iv = randomBytes(12)
  const key = getEncryptionKey()
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`
}

export function decryptSecret(payload: string) {
  const [ivB64, authTagB64, encryptedB64] = payload.split(".")
  if (!ivB64 || !authTagB64 || !encryptedB64) {
    throw new Error("Invalid encrypted secret payload")
  }

  const key = getEncryptionKey()
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"))
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, "base64")),
    decipher.final(),
  ])
  return decrypted.toString("utf8")
}
