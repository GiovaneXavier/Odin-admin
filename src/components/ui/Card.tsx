import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-xl bg-[#13162b] border border-[#2d3255] p-5', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={cn('text-sm font-semibold text-slate-400 uppercase tracking-wider', className)}>
      {children}
    </h3>
  )
}
