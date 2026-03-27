import { useState, useMemo, useEffect } from 'react'
import { History, Search, Trash2, Eye, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { QRCodeSVG } from 'qrcode.react'
import { qrStorage } from '@/services/storage'
import { getQRStatus } from '@/services/qrService'
import { formatDate, timeRemaining } from '@/lib/utils'
import type { QRRecord } from '@/types'

export function QRHistory() {
  const [records,     setRecords]     = useState<QRRecord[]>(() => qrStorage.getAll())
  const [search,      setSearch]      = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all')
  const [viewTarget,  setViewTarget]  = useState<QRRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<QRRecord | null>(null)
  const [clearConfirm, setClearConfirm] = useState(false)

  function reload() { setRecords(qrStorage.getAll()) }

  // Atualiza contadores a cada 30s para refletir QRs que expiraram
  useEffect(() => {
    const id = setInterval(reload, 30_000)
    return () => clearInterval(id)
  }, [])

  const filtered = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    return records.filter(r => {
      const matchSearch =
        r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        r.systemName.toLowerCase().includes(search.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(search.toLowerCase())

      const status = r.expiresAt > now ? 'active' : 'expired'
      const matchStatus = filterStatus === 'all' || filterStatus === status

      return matchSearch && matchStatus
    })
  }, [records, search, filterStatus])

  const counts = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    return {
      all:     records.length,
      active:  records.filter(r => r.expiresAt > now).length,
      expired: records.filter(r => r.expiresAt <= now).length,
    }
  }, [records])

  function handleDelete() {
    if (!deleteTarget) return
    qrStorage.delete(deleteTarget.id)
    reload()
    setDeleteTarget(null)
  }

  function handleClearAll() {
    qrStorage.clear()
    reload()
    setClearConfirm(false)
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por funcionário ou sistema..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#1a1d2e] border border-[#2d3255] text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1428A0]"
          />
        </div>

        {/* Filtros de status */}
        <div className="flex gap-1 bg-[#1a1d2e] border border-[#2d3255] rounded-lg p-1">
          {(['all', 'active', 'expired'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filterStatus === s
                  ? 'bg-[#1428A0] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s === 'all' ? `Todos (${counts.all})` :
               s === 'active' ? `Ativos (${counts.active})` :
               `Expirados (${counts.expired})`}
            </button>
          ))}
        </div>

        {records.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setClearConfirm(true)} className="ml-auto">
            <Trash2 size={13} /> Limpar histórico
          </Button>
        )}
      </div>

      {/* Tabela */}
      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <History size={36} className="text-slate-600" />
            <p className="text-slate-500 text-sm">
              {records.length === 0 ? 'Nenhum QR gerado ainda' : 'Nenhum resultado encontrado'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d3255] text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Funcionário</th>
                <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Sistema</th>
                <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Gerado em</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2235]">
              {filtered.map(record => {
                const status = getQRStatus(record)
                return (
                  <tr key={record.id} className="hover:bg-[#1a1d2e] transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-200">{record.employeeName}</p>
                      <p className="text-xs text-slate-500 font-mono">{record.employeeId}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-400 hidden md:table-cell">
                      {record.systemName}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs hidden lg:table-cell">
                      {formatDate(record.issuedAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant={status === 'active' ? 'success' : 'default'}>
                          {status === 'active' ? (
                            <><CheckCircle size={10} /> Ativo</>
                          ) : (
                            <><Clock size={10} /> Expirado</>
                          )}
                        </Badge>
                        {status === 'active' && (
                          <span className="text-xs text-slate-600">
                            expira em {timeRemaining(record.expiresAt)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewTarget(record)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#2d3255] transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(record)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      <p className="text-xs text-slate-600">
        {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
        {filterStatus !== 'all' ? ` (filtrado de ${records.length})` : ''}
      </p>

      {/* Modal visualizar QR */}
      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="QR de Cadastro"
        size="sm"
      >
        {viewTarget && (
          <div className="flex flex-col items-center gap-4">
            {getQRStatus(viewTarget) === 'active' ? (
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeSVG value={viewTarget.payload} size={220} level="M" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6">
                <Clock size={36} className="text-slate-600" />
                <p className="text-sm text-slate-400">Este QR já expirou</p>
              </div>
            )}
            <div className="w-full space-y-2 text-xs">
              <div className="flex justify-between py-2 px-3 rounded-lg bg-[#1a1d2e] border border-[#2d3255]">
                <span className="text-slate-500">Funcionário</span>
                <span className="text-slate-200 font-semibold">{viewTarget.employeeName}</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-lg bg-[#1a1d2e] border border-[#2d3255]">
                <span className="text-slate-500">Sistema</span>
                <span className="text-slate-200">{viewTarget.systemName}</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-lg bg-[#1a1d2e] border border-[#2d3255]">
                <span className="text-slate-500">Gerado em</span>
                <span className="text-slate-400">{formatDate(viewTarget.issuedAt)}</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-lg bg-[#1a1d2e] border border-[#2d3255]">
                <span className="text-slate-500">Expirou em</span>
                <span className="text-slate-400">{formatDate(viewTarget.expiresAt)}</span>
              </div>
            </div>
            <Badge variant={getQRStatus(viewTarget) === 'active' ? 'success' : 'default'}>
              {getQRStatus(viewTarget) === 'active' ? (
                <><CheckCircle size={10} /> Ativo — expira em {timeRemaining(viewTarget.expiresAt)}</>
              ) : (
                <><Clock size={10} /> Expirado</>
              )}
            </Badge>
          </div>
        )}
      </Modal>

      {/* Modal confirmar exclusão */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover Registro"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Remover registro do QR de <strong className="text-white">{deleteTarget?.employeeName}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={14} /> Remover
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal limpar tudo */}
      <Modal
        open={clearConfirm}
        onClose={() => setClearConfirm(false)}
        title="Limpar Histórico"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Tem certeza que deseja remover <strong className="text-white">todos os {records.length} registros</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setClearConfirm(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleClearAll}>
              <Trash2 size={14} /> Limpar Tudo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
