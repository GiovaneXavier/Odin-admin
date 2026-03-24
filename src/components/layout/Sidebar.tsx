import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Layers,
  QrCode,
  History,
  Settings,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/',            label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/employees',   label: 'Funcionários',  icon: Users },
  { to: '/systems',     label: 'Sistemas',      icon: Layers },
  { to: '/qr-generator',label: 'Gerar QR',      icon: QrCode },
  { to: '/qr-history',  label: 'Histórico QR',  icon: History },
] as const

const BOTTOM_ITEMS = [
  { to: '/settings', label: 'Configurações', icon: Settings },
] as const

export function Sidebar() {
  return (
    <aside className="flex flex-col w-60 bg-[#0c0e1a] border-r border-[#1e2235] h-full shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1e2235]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#1428A0]">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">Odin Admin</p>
          <p className="text-xs text-slate-500">SRBR · Huginn</p>
        </div>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#1428A0]/20 text-white border border-[#1428A0]/40'
                  : 'text-slate-400 hover:bg-[#1e2235] hover:text-slate-200'
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Nav inferior */}
      <div className="px-3 py-4 border-t border-[#1e2235] space-y-1">
        {BOTTOM_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#1428A0]/20 text-white border border-[#1428A0]/40'
                  : 'text-slate-400 hover:bg-[#1e2235] hover:text-slate-200'
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
