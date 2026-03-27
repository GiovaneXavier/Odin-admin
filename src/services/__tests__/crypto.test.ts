import { describe, it, expect } from 'vitest'
import { buildCanonical, hmacSha256Base64Url, generateNonce, generateId } from '../crypto'

describe('buildCanonical', () => {
  it('joins all fields with pipe separator', () => {
    const result = buildCanonical(1, 'REG', 1700000000, 1700003600, 'fixed-nonce', 'EMP001', 'Test User', 'SYS001')
    expect(result).toBe('1|REG|1700000000|1700003600|fixed-nonce|EMP001|Test User|SYS001')
  })

  it('preserves special characters in employee name', () => {
    const result = buildCanonical(1, 'REG', 0, 1, 'n', 'E1', 'José da Silva', 'S1')
    expect(result).toBe('1|REG|0|1|n|E1|José da Silva|S1')
  })
})

describe('hmacSha256Base64Url', () => {
  // Cross-platform vector shared with QRValidatorTest.kt
  // node -e "require('crypto').createHmac('sha256','TEST_SECRET_KEY')
  //   .update('1|REG|1700000000|1700003600|fixed-nonce|EMP001|Test User|SYS001')
  //   .digest('base64url')"
  const EXPECTED = 'eSJdyv9cvTX3kst9JbzhJJoiD_P60Svb2UhaXPgVbBE'

  it('matches cross-platform vector (JS ↔ Kotlin)', async () => {
    const canonical = buildCanonical(1, 'REG', 1700000000, 1700003600, 'fixed-nonce', 'EMP001', 'Test User', 'SYS001')
    const result = await hmacSha256Base64Url('TEST_SECRET_KEY', canonical)
    expect(result).toBe(EXPECTED)
  })

  it('produces exactly 43 Base64url characters (SHA-256 = 32 bytes, no padding)', async () => {
    const result = await hmacSha256Base64Url('secret', 'data')
    expect(result).toHaveLength(43)
  })

  it('uses URL-safe alphabet (no +, /, or = chars)', async () => {
    // Run many times to increase chance of hitting + and / in raw base64
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) => hmacSha256Base64Url('key', `data${i}`))
    )
    for (const sig of results) {
      expect(sig).not.toMatch(/[+/=]/)
    }
  })

  it('same key + data → same signature (deterministic)', async () => {
    const sig1 = await hmacSha256Base64Url('key', 'payload')
    const sig2 = await hmacSha256Base64Url('key', 'payload')
    expect(sig1).toBe(sig2)
  })

  it('different key → different signature', async () => {
    const sig1 = await hmacSha256Base64Url('key-a', 'payload')
    const sig2 = await hmacSha256Base64Url('key-b', 'payload')
    expect(sig1).not.toBe(sig2)
  })

  it('different data → different signature', async () => {
    const sig1 = await hmacSha256Base64Url('key', 'payload-1')
    const sig2 = await hmacSha256Base64Url('key', 'payload-2')
    expect(sig1).not.toBe(sig2)
  })
})

describe('generateNonce', () => {
  it('returns exactly 8 lowercase hex characters', () => {
    const nonce = generateNonce()
    expect(nonce).toHaveLength(8)
    expect(nonce).toMatch(/^[0-9a-f]{8}$/)
  })

  it('generates unique values across 200 calls', () => {
    const nonces = new Set(Array.from({ length: 200 }, () => generateNonce()))
    expect(nonces.size).toBeGreaterThan(180)
  })
})

describe('generateId', () => {
  it('returns exactly 16 lowercase hex characters', () => {
    const id = generateId()
    expect(id).toHaveLength(16)
    expect(id).toMatch(/^[0-9a-f]{16}$/)
  })

  it('generates unique values across 200 calls', () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateId()))
    expect(ids.size).toBeGreaterThan(180)
  })
})
