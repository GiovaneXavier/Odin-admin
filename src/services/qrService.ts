import type { Employee, OdinSystem, QRRecord, QRRegistrationPayload } from '@/types'
import { hmacSha256Base64Url, buildCanonical, generateNonce, generateId } from './crypto'
import { settingsStorage, qrStorage } from './storage'

export interface GenerateQRParams {
  employee: Employee
  system: OdinSystem
  validityMinutes: number
}

export interface GenerateQRResult {
  payload: QRRegistrationPayload
  payloadJson: string
  record: QRRecord
}

/** Gera o QR de cadastro assinado e salva no histórico */
export async function generateRegistrationQR(
  params: GenerateQRParams
): Promise<GenerateQRResult> {
  const settings = settingsStorage.get()
  if (!settings.qrHmacKey) throw new Error('Chave HMAC (qrHmacKey) não configurada. Acesse Configurações.')

  const { employee, system, validityMinutes } = params
  if (!Number.isInteger(validityMinutes) || validityMinutes < 1)
    throw new Error('Validade deve ser de no mínimo 1 minuto.')
  const now       = Math.floor(Date.now() / 1000)
  const expiresAt = now + validityMinutes * 60
  const nonce     = generateNonce()

  // String canônica — mesma lógica do QRValidator.kt
  const canonical = buildCanonical(
    1, 'REG', now, expiresAt, nonce,
    employee.id, employee.name, system.id
  )

  const signature = await hmacSha256Base64Url(settings.qrHmacKey, canonical)

  const payload: QRRegistrationPayload = {
    version:    1,
    mode:       'REG',
    issued_at:  now,
    expires_at: expiresAt,
    nonce,
    employee: {
      id:   employee.id,
      name: employee.name,
      area: employee.area,
      role: employee.role,
    },
    card: {
      system:      system.id,
      system_name: system.name,
      card_color:  system.cardColor,
    },
    signature,
  }

  const payloadJson = JSON.stringify(payload)

  const record: QRRecord = {
    id:          generateId(),
    employeeId:  employee.id,
    employeeName: employee.name,
    systemId:    system.id,
    systemName:  system.name,
    issuedAt:    now,
    expiresAt,
    nonce,
    payload:     payloadJson,
  }

  qrStorage.create(record)

  return { payload, payloadJson, record }
}

/** Determina se um QRRecord ainda está ativo */
export function getQRStatus(record: QRRecord): 'active' | 'expired' {
  const now = Math.floor(Date.now() / 1000)
  return now <= record.expiresAt ? 'active' : 'expired'
}
