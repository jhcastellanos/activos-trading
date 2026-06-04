import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const raw = process.env.TOKEN_ENC_KEY
  if (!raw) {
    throw new Error('TOKEN_ENC_KEY no está configurada')
  }
  // Acepta clave en base64 (32 bytes) o hex (64 chars).
  const key = raw.length === 64 ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64')
  if (key.length !== 32) {
    throw new Error('TOKEN_ENC_KEY debe decodificar a 32 bytes (AES-256)')
  }
  return key
}

export function encrypt(plain: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.')
}

export function decrypt(payload: string): string {
  const key = getKey()
  const [ivB64, tagB64, dataB64] = payload.split('.')
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Payload cifrado inválido')
  }
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}
