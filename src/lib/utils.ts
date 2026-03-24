import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('pt-BR', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

export function formatDateShort(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('pt-BR')
}

export function timeAgo(timestamp: number): string {
  const diff = Date.now() / 1000 - timestamp
  if (diff < 60)    return `${Math.floor(diff)}s atrás`
  if (diff < 3600)  return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return `${Math.floor(diff / 86400)}d atrás`
}

export function timeRemaining(expiresAt: number): string {
  const diff = expiresAt - Date.now() / 1000
  if (diff <= 0) return 'Expirado'
  if (diff < 60)    return `${Math.floor(diff)}s`
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`
  return `${Math.floor(diff / 3600)}h`
}
