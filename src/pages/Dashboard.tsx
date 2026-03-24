import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Layers, QrCode, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { employeeStorage, systemStorage, qrStorage } from '@/services/storage'
import { getQRStatus } from '@/services/qrService'
import { timeAgo } from '@/lib/utils'

export function Dashboard() {
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const employees  = employeeStorage.getAll()
    const systems    = systemStorage.getAll()
    const qrRecords  = qrStorage.getAll()
    const now        = Math.floor(Date.now() / 1000)
    const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000)

    const activeQRs   = qrRecords.filter(r => r.expiresAt > now).length
    const todayQRs    = qrRecords.filter(r => r.issuedAt >= todayStart).length
    const recentQRs   = qrRecords.slice(0, 5)

    return { employees, systems, qrRecords, activeQRs, todayQRs, recentQRs }
  }, [])

  const statCards = [
    {
      label: 'Funcionários',
      value: stats.employees.length,
      icon:  Users,
      color: 'text-blue-400',
      bg:    'bg-blue-500/10',
      action: () => navigate('/employees'),
    },
    {
      label: 'Sistemas',
      value: stats.systems.length,
      icon:  Layers,
      color: 'text-purple-400',
      bg:    'bg-purple-500/10',
      action: () => navigate('/systems'),
    },
    {
      label: 'QRs Gerados Hoje',
      value: stats.todayQRs,
      icon:  QrCode,
      color: 'text-emerald-400',
      bg:    'bg-emerald-500/10',
      action: () => navigate('/qr-history'),
    },
    {
      label: 'QRs Ativos Agora',
      value: stats.activeQRs,
      icon:  CheckCircle,
      color: 'text-amber-400',
      bg:    'bg-amber-500/10',
      action: () => navigate('/qr-history'),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, action }) => (
          <button
            key={label}
            onClick={action}
            className="rounded-xl bg-[#13162b] border border-[#2d3255] p-5 text-left hover:border-[#3d4575] transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${bg}`}>
                <Icon size={20} className={color} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Atividade recente */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              QRs Recentes
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/qr-history')}>
              Ver todos
            </Button>
          </div>

          {stats.recentQRs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <QrCode size={32} className="text-slate-600" />
              <p className="text-sm text-slate-500">Nenhum QR gerado ainda</p>
              <Button size="sm" onClick={() => navigate('/qr-generator')}>
                Gerar primeiro QR
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentQRs.map(record => {
                const status = getQRStatus(record)
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[#1a1d2e] border border-[#2d3255]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1428A0]/20 shrink-0">
                        <QrCode size={15} className="text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{record.employeeName}</p>
                        <p className="text-xs text-slate-500 truncate">{record.systemName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <Badge variant={status === 'active' ? 'success' : 'default'}>
                        {status === 'active' ? (
                          <><CheckCircle size={10} /> Ativo</>
                        ) : (
                          <><Clock size={10} /> Expirado</>
                        )}
                      </Badge>
                      <span className="text-xs text-slate-600 hidden sm:block">
                        {timeAgo(record.issuedAt)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Ações rápidas */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Ações Rápidas
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/qr-generator')}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#1428A0]/10 border border-[#1428A0]/30 hover:bg-[#1428A0]/20 transition-all text-left group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#1428A0]/20 group-hover:bg-[#1428A0]/40 transition-colors">
                <QrCode size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Gerar QR de Cadastro</p>
                <p className="text-xs text-slate-400">Registrar funcionário no app Huginn</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/employees')}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#1a1d2e] border border-[#2d3255] hover:border-[#3d4575] transition-all text-left group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#2d3255] group-hover:bg-[#3d4575] transition-colors">
                <Users size={20} className="text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Gerenciar Funcionários</p>
                <p className="text-xs text-slate-400">Cadastrar, editar ou remover funcionários</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/systems')}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#1a1d2e] border border-[#2d3255] hover:border-[#3d4575] transition-all text-left group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#2d3255] group-hover:bg-[#3d4575] transition-colors">
                <Layers size={20} className="text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Gerenciar Sistemas</p>
                <p className="text-xs text-slate-400">Configurar sistemas e cores dos cartões</p>
              </div>
            </button>

            {stats.employees.length === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300">
                  Cadastre funcionários e sistemas antes de gerar QRs
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Funcionários recentes */}
      {stats.employees.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Funcionários Cadastrados
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/employees')}>
              Ver todos
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {stats.employees.slice(0, 6).map(emp => (
              <div
                key={emp.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1d2e] border border-[#2d3255]"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1428A0]/20 text-blue-400 font-bold text-sm shrink-0">
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{emp.name}</p>
                  <p className="text-xs text-slate-500 truncate">{emp.area}{emp.role ? ` · ${emp.role}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
