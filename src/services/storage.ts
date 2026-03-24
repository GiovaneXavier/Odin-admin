import type { Employee, OdinSystem, QRRecord, OdinSettings } from '@/types'

const KEYS = {
  EMPLOYEES: 'odin_employees',
  SYSTEMS:   'odin_systems',
  QR_RECORDS: 'odin_qr_records',
  SETTINGS:  'odin_settings',
} as const

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function loadOne<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

// ─── Funcionários ─────────────────────────────────────────────────────────────
export const employeeStorage = {
  getAll: (): Employee[] => load<Employee>(KEYS.EMPLOYEES),

  getById: (id: string): Employee | undefined =>
    load<Employee>(KEYS.EMPLOYEES).find(e => e.id === id),

  create: (employee: Employee): void => {
    const list = load<Employee>(KEYS.EMPLOYEES)
    list.push(employee)
    save(KEYS.EMPLOYEES, list)
  },

  update: (updated: Employee): void => {
    const list = load<Employee>(KEYS.EMPLOYEES).map(e =>
      e.id === updated.id ? updated : e
    )
    save(KEYS.EMPLOYEES, list)
  },

  delete: (id: string): void => {
    save(KEYS.EMPLOYEES, load<Employee>(KEYS.EMPLOYEES).filter(e => e.id !== id))
  },
}

// ─── Sistemas ─────────────────────────────────────────────────────────────────
export const systemStorage = {
  getAll: (): OdinSystem[] => load<OdinSystem>(KEYS.SYSTEMS),

  getById: (id: string): OdinSystem | undefined =>
    load<OdinSystem>(KEYS.SYSTEMS).find(s => s.id === id),

  create: (system: OdinSystem): void => {
    const list = load<OdinSystem>(KEYS.SYSTEMS)
    list.push(system)
    save(KEYS.SYSTEMS, list)
  },

  update: (updated: OdinSystem): void => {
    const list = load<OdinSystem>(KEYS.SYSTEMS).map(s =>
      s.id === updated.id ? updated : s
    )
    save(KEYS.SYSTEMS, list)
  },

  delete: (id: string): void => {
    save(KEYS.SYSTEMS, load<OdinSystem>(KEYS.SYSTEMS).filter(s => s.id !== id))
  },
}

// ─── Registros de QR ─────────────────────────────────────────────────────────
export const qrStorage = {
  getAll: (): QRRecord[] => load<QRRecord>(KEYS.QR_RECORDS),

  create: (record: QRRecord): void => {
    const list = load<QRRecord>(KEYS.QR_RECORDS)
    list.unshift(record) // mais recente primeiro
    save(KEYS.QR_RECORDS, list)
  },

  delete: (id: string): void => {
    save(KEYS.QR_RECORDS, load<QRRecord>(KEYS.QR_RECORDS).filter(r => r.id !== id))
  },

  clear: (): void => {
    save(KEYS.QR_RECORDS, [])
  },
}

// ─── Configurações ────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: OdinSettings = {
  qrHmacKey: '',
  tokenHmacKey: '',
  defaultQrValidityMinutes: 10,
}

export const settingsStorage = {
  get: (): OdinSettings => loadOne<OdinSettings>(KEYS.SETTINGS) ?? DEFAULT_SETTINGS,

  save: (settings: OdinSettings): void => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
  },

  isConfigured: (): boolean => {
    const s = loadOne<OdinSettings>(KEYS.SETTINGS)
    return !!s?.qrHmacKey
  },
}
