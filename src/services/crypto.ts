/**
 * Implementação do HMAC-SHA256 compatível com o QRValidator.kt do app Huginn.
 *
 * String canônica (igual ao buildCanonical do Kotlin):
 *   version|mode|issued_at|expires_at|nonce|employee.id|employee.name|card.system
 *
 * Assinatura: Base64Url sem padding (NO_WRAP | URL_SAFE do Android = URL-safe base64)
 */

/** Importa a chave HMAC-SHA256 para uso com Web Crypto API */
async function importKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

/** Assina `data` com HMAC-SHA256 e retorna Base64Url sem padding */
export async function hmacSha256Base64Url(secret: string, data: string): Promise<string> {
  const key = await importKey(secret)
  const enc = new TextEncoder()
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return arrayBufferToBase64Url(sig)
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Monta a string canônica idêntica ao buildCanonical() do QRValidator.kt:
 *   version|mode|issued_at|expires_at|nonce|employee.id|employee.name|card.system
 */
export function buildCanonical(
  version: number,
  mode: string,
  issuedAt: number,
  expiresAt: number,
  nonce: string,
  employeeId: string,
  employeeName: string,
  cardSystem: string
): string {
  return [version, mode, issuedAt, expiresAt, nonce, employeeId, employeeName, cardSystem].join('|')
}

/** Gera um nonce aleatório de 8 chars hex */
export function generateNonce(): string {
  const arr = new Uint8Array(4)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Gera um ID único simples */
export function generateId(): string {
  const arr = new Uint8Array(8)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}
