import { describe, it, expect, beforeEach } from 'vitest'
import { getQRStatus, generateRegistrationQR } from '../qrService'
import type { QRRecord, Employee, OdinSystem } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<QRRecord> = {}): QRRecord {
  const now = Math.floor(Date.now() / 1000)
  return {
    id:           'test-id',
    employeeId:   'EMP001',
    employeeName: 'Test User',
    systemId:     'SYS001',
    systemName:   'Test System',
    issuedAt:     now - 60,
    expiresAt:    now + 600,
    nonce:        'abc12345',
    payload:      '{}',
    ...overrides,
  }
}

const EMPLOYEE: Employee = { id: 'EMP001', name: 'Test User', area: 'TI', createdAt: 0 }
const SYSTEM: OdinSystem  = { id: 'SYS001', name: 'Test System', cardColor: '#1428A0', createdAt: 0 }

function configureStorage(qrHmacKey = 'test-secret') {
  localStorage.setItem('odin_settings',   JSON.stringify({ qrHmacKey, tokenHmacKey: '', defaultQrValidityMinutes: 10 }))
  localStorage.setItem('odin_qr_records', '[]')
}

// ─── getQRStatus ──────────────────────────────────────────────────────────────

describe('getQRStatus', () => {
  it('returns "active" when not expired and not revoked', () => {
    expect(getQRStatus(makeRecord())).toBe('active')
  })

  it('returns "expired" when expiresAt is in the past', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(getQRStatus(makeRecord({ expiresAt: now - 1 }))).toBe('expired')
  })

  it('returns "active" when expiresAt equals now', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(getQRStatus(makeRecord({ expiresAt: now }))).toBe('active')
  })

  it('returns "revoked" when revokedAt is set, even if still within expiry', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(getQRStatus(makeRecord({ revokedAt: now - 5 }))).toBe('revoked')
  })

  it('returns "revoked" even when already expired', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(getQRStatus(makeRecord({ expiresAt: now - 100, revokedAt: now - 50 }))).toBe('revoked')
  })
})

// ─── generateRegistrationQR ───────────────────────────────────────────────────

describe('generateRegistrationQR', () => {
  beforeEach(() => {
    localStorage.clear()
    configureStorage()
  })

  it('throws if qrHmacKey is empty', async () => {
    configureStorage('')
    await expect(generateRegistrationQR({ employee: EMPLOYEE, system: SYSTEM, validityMinutes: 10 }))
      .rejects.toThrow('Chave HMAC')
  })

  it('throws if validityMinutes is 0', async () => {
    await expect(generateRegistrationQR({ employee: EMPLOYEE, system: SYSTEM, validityMinutes: 0 }))
      .rejects.toThrow('Validade')
  })

  it('throws if validityMinutes is negative', async () => {
    await expect(generateRegistrationQR({ employee: EMPLOYEE, system: SYSTEM, validityMinutes: -5 }))
      .rejects.toThrow('Validade')
  })

  it('throws if validityMinutes is non-integer', async () => {
    await expect(generateRegistrationQR({ employee: EMPLOYEE, system: SYSTEM, validityMinutes: 1.5 }))
      .rejects.toThrow('Validade')
  })

  it('returns a record with correct employee and system data', async () => {
    const { record } = await generateRegistrationQR({ employee: EMPLOYEE, system: SYSTEM, validityMinutes: 10 })
    expect(record.employeeId).toBe('EMP001')
    expect(record.employeeName).toBe('Test User')
    expect(record.systemId).toBe('SYS001')
    expect(record.systemName).toBe('Test System')
  })

  it('sets expiresAt = issuedAt + validityMinutes * 60', async () => {
    const { record } = await generateRegistrationQR({ employee: EMPLOYEE, system: SYSTEM, validityMinutes: 10 })
    expect(record.expiresAt - record.issuedAt).toBe(600)
  })

  it('signature is 43-char Base64url without padding', async () => {
    const { payload } = await generateRegistrationQR({ employee: EMPLOYEE, system: SYSTEM, validityMinutes: 10 })
    expect(payload.signature).toHaveLength(43)
    expect(payload.signature).not.toMatch(/[+/=]/)
  })

  it('payloadJson is valid JSON that round-trips to payload', async () => {
    const { payload, payloadJson } = await generateRegistrationQR({ employee: EMPLOYEE, system: SYSTEM, validityMinutes: 10 })
    expect(JSON.parse(payloadJson)).toEqual(payload)
  })

  it('saves the record to qr_records storage', async () => {
    await generateRegistrationQR({ employee: EMPLOYEE, system: SYSTEM, validityMinutes: 10 })
    const stored = JSON.parse(localStorage.getItem('odin_qr_records') ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].employeeId).toBe('EMP001')
  })

  it('prepends new records (most recent first)', async () => {
    await generateRegistrationQR({ employee: EMPLOYEE, system: SYSTEM, validityMinutes: 5 })
    const employee2: Employee = { ...EMPLOYEE, id: 'EMP002', name: 'Second User' }
    await generateRegistrationQR({ employee: employee2, system: SYSTEM, validityMinutes: 5 })
    const stored = JSON.parse(localStorage.getItem('odin_qr_records') ?? '[]')
    expect(stored[0].employeeId).toBe('EMP002')
    expect(stored[1].employeeId).toBe('EMP001')
  })
})
