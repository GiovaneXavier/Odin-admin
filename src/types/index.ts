// ─── Funcionário ────────────────────────────────────────────────────────────
export interface Employee {
  id: string
  name: string
  area: string
  role?: string
  createdAt: number
}

// ─── Sistema ─────────────────────────────────────────────────────────────────
export interface OdinSystem {
  id: string         // systemId ex: "ACCESS_HQ"
  name: string       // systemName ex: "Acesso Sede"
  cardColor: string  // hex ex: "#1428A0"
  createdAt: number
}

// ─── QR de Cadastro (payload completo que vai no QR Code) ────────────────────
export interface QRRegistrationPayload {
  version: 1
  mode: 'REG'
  issued_at: number
  expires_at: number
  nonce: string
  employee: {
    id: string
    name: string
    area: string
    role?: string
  }
  card: {
    system: string
    system_name: string
    card_color: string
  }
  signature: string
}

// ─── Registro de QR gerado (para histórico) ──────────────────────────────────
export type QRStatus = 'active' | 'expired'

export interface QRRecord {
  id: string
  employeeId: string
  employeeName: string
  systemId: string
  systemName: string
  issuedAt: number
  expiresAt: number
  nonce: string
  payload: string  // JSON stringificado do QRRegistrationPayload
}

// ─── Configurações do sistema ─────────────────────────────────────────────────
export interface OdinSettings {
  qrHmacKey: string
  tokenHmacKey: string
  defaultQrValidityMinutes: number
}
