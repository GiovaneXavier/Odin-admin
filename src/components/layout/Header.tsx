import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { settingsStorage } from '@/services/storage'

const PAGE_TITLES: Record<string, string> = {
  '/':             'Dashboard',
  '/employees':    'Funcionários',
  '/systems':      'Sistemas',
  '/qr-generator': 'Gerar QR de Cadastro',
  '/qr-history':   'Histórico de QRs',
  '/settings':     'Configurações',
}

function formatNow() {
  return new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const title = PAGE_TITLES[location.pathname] ?? 'Odin Admin'
  const isConfigured = settingsStorage.isConfigured()
  const [now, setNow] = useState(formatNow)

  useEffect(() => {
    const id = setInterval(() => setNow(formatNow()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[#1e2235] bg-[#0f1117] shrink-0">
      <h1 className="text-lg font-bold text-white">{title}</h1>

      <div className="flex items-center gap-4">
        {!isConfigured && (
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
          >
            <AlertTriangle size={13} />
            Chave HMAC não configurada
          </button>
        )}
        <span className="text-xs text-slate-500 font-mono tabular-nums">{now}</span>
      </div>
    </header>
  )
}
