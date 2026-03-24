import { useState, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, Layers } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { systemStorage } from '@/services/storage'
import { formatDateShort } from '@/lib/utils'
import type { OdinSystem } from '@/types'

const DEFAULT_COLORS = [
  '#1428A0', '#6366f1', '#8b5cf6', '#ec4899',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#64748b',
]

const EMPTY_FORM = { id: '', name: '', cardColor: '#1428A0' }

export function Systems() {
  const [systems,  setSystems]  = useState<OdinSystem[]>(() => systemStorage.getAll())
  const [search,   setSearch]   = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<OdinSystem | null>(null)
  const [form,   setForm]   = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<string | null>(null)

  const filtered = useMemo(
    () => systems.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
    ),
    [systems, search]
  )

  function reload() { setSystems(systemStorage.getAll()) }

  function openCreate() {
    setForm(EMPTY_FORM)
    setErrors({})
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(sys: OdinSystem) {
    setForm({ id: sys.id, name: sys.name, cardColor: sys.cardColor })
    setErrors({})
    setEditing(sys.id)
    setModalOpen(true)
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nome obrigatório'
    if (!editing && !form.id.trim()) e.id = 'ID obrigatório'
    if (!editing && systems.some(s => s.id === form.id.trim().toUpperCase())) {
      e.id = 'Este ID já existe'
    }
    if (!form.cardColor) e.cardColor = 'Cor obrigatória'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    if (editing) {
      const current = systemStorage.getById(editing)!
      systemStorage.update({ ...current, name: form.name.trim(), cardColor: form.cardColor })
    } else {
      systemStorage.create({
        id:        form.id.trim().toUpperCase(),
        name:      form.name.trim(),
        cardColor: form.cardColor,
        createdAt: Math.floor(Date.now() / 1000),
      })
    }
    reload()
    setModalOpen(false)
  }

  function handleDelete() {
    if (!deleteTarget) return
    systemStorage.delete(deleteTarget.id)
    reload()
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#1a1d2e] border border-[#2d3255] text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1428A0]"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Novo Sistema
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Layers size={36} className="text-slate-600" />
            <p className="text-slate-500 text-sm">
              {search ? 'Nenhum resultado encontrado' : 'Nenhum sistema cadastrado'}
            </p>
            {!search && (
              <Button size="sm" onClick={openCreate}>
                <Plus size={14} /> Criar primeiro sistema
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d3255] text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Sistema</th>
                <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">ID</th>
                <th className="text-left px-5 py-3 font-semibold">Cor do Cartão</th>
                <th className="text-left px-5 py-3 font-semibold hidden xl:table-cell">Criado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2235]">
              {filtered.map(sys => (
                <tr key={sys.id} className="hover:bg-[#1a1d2e] transition-colors">
                  <td className="px-5 py-3 font-semibold text-slate-200">{sys.name}</td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="font-mono text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                      {sys.id}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-md border border-white/10 shadow-sm"
                        style={{ backgroundColor: sys.cardColor }}
                      />
                      <span className="font-mono text-xs text-slate-500">{sys.cardColor}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 text-xs hidden xl:table-cell">
                    {formatDateShort(sys.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(sys)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#2d3255] transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(sys)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <p className="text-xs text-slate-600">
        {systems.length} sistema{systems.length !== 1 ? 's' : ''} cadastrado{systems.length !== 1 ? 's' : ''}
      </p>

      {/* Modal criar/editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Sistema' : 'Novo Sistema'}
      >
        <div className="space-y-4">
          {!editing && (
            <Input
              label="ID do Sistema"
              placeholder="ex: ACCESS_HQ"
              value={form.id}
              onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
              error={errors.id}
            />
          )}
          <Input
            label="Nome do Sistema"
            placeholder="ex: Acesso Sede Central"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            error={errors.name}
          />

          {/* Color picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cor do Cartão
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {DEFAULT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, cardColor: color }))}
                  className="w-8 h-8 rounded-lg border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: form.cardColor === color ? 'white' : 'transparent',
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.cardColor}
                onChange={e => setForm(f => ({ ...f, cardColor: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <Input
                value={form.cardColor}
                onChange={e => setForm(f => ({ ...f, cardColor: e.target.value }))}
                placeholder="#1428A0"
                className="font-mono"
              />
            </div>
            {errors.cardColor && <p className="text-xs text-red-400">{errors.cardColor}</p>}
          </div>

          {/* Preview do cartão */}
          <div className="rounded-xl overflow-hidden" style={{ background: form.cardColor }}>
            <div className="px-5 py-4">
              <p className="text-white/60 text-xs font-semibold tracking-widest uppercase">SRBR · Huginn</p>
              <p className="text-white font-bold text-lg mt-1">{form.name || 'Nome do Sistema'}</p>
              <p className="text-white/60 text-xs mt-1 font-mono">{form.id || 'SYSTEM_ID'}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? 'Salvar' : 'Criar Sistema'}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal confirmar exclusão */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Tem certeza que deseja remover o sistema <strong className="text-white">{deleteTarget?.name}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={14} /> Remover
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
