import { useState, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { employeeStorage, qrStorage } from '@/services/storage'
import { getQRStatus } from '@/services/qrService'
import { formatDateShort } from '@/lib/utils'
import type { Employee } from '@/types'

const EMPTY_FORM = { name: '', area: '', role: '', id: '' }

export function Employees() {
  const [employees, setEmployees] = useState<Employee[]>(() => employeeStorage.getAll())
  const [search,    setSearch]    = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [form, setForm]   = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<string | null>(null)

  const filtered = useMemo(
    () => employees.filter(e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.area.toLowerCase().includes(search.toLowerCase()) ||
      (e.role ?? '').toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase())
    ),
    [employees, search]
  )

  function reload() {
    setEmployees(employeeStorage.getAll())
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setErrors({})
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(emp: Employee) {
    setForm({ id: emp.id, name: emp.name, area: emp.area, role: emp.role ?? '' })
    setErrors({})
    setEditing(emp.id)
    setModalOpen(true)
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.name.trim())  e.name  = 'Nome obrigatório'
    if (!form.area.trim())  e.area  = 'Área obrigatória'
    if (!editing && !form.id.trim()) e.id = 'ID obrigatório'
    if (!editing && employees.some(emp => emp.id === form.id.trim().toUpperCase())) {
      e.id = 'Este ID já existe'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    if (editing) {
      const updated: Employee = {
        ...employeeStorage.getById(editing)!,
        name: form.name.trim(),
        area: form.area.trim(),
        role: form.role.trim() || undefined,
      }
      employeeStorage.update(updated)
    } else {
      const emp: Employee = {
        id:        form.id.trim().toUpperCase(),
        name:      form.name.trim(),
        area:      form.area.trim(),
        role:      form.role.trim() || undefined,
        createdAt: Math.floor(Date.now() / 1000),
      }
      employeeStorage.create(emp)
    }
    reload()
    setModalOpen(false)
  }

  function activeQRsForEmployee(empId: string): number {
    return qrStorage.getAll().filter(r => r.employeeId === empId && getQRStatus(r) === 'active').length
  }

  function handleDelete() {
    if (!deleteTarget) return
    employeeStorage.delete(deleteTarget.id)
    reload()
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, área ou ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#1a1d2e] border border-[#2d3255] text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1428A0]"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Novo Funcionário
        </Button>
      </div>

      {/* Tabela */}
      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users size={36} className="text-slate-600" />
            <p className="text-slate-500 text-sm">
              {search ? 'Nenhum resultado encontrado' : 'Nenhum funcionário cadastrado'}
            </p>
            {!search && (
              <Button size="sm" onClick={openCreate}>
                <Plus size={14} /> Cadastrar primeiro funcionário
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d3255] text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">ID</th>
                <th className="text-left px-5 py-3 font-semibold">Nome</th>
                <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Área</th>
                <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Cargo</th>
                <th className="text-left px-5 py-3 font-semibold hidden xl:table-cell">Cadastro</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2235]">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-[#1a1d2e] transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      {emp.id}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-200">{emp.name}</td>
                  <td className="px-5 py-3 text-slate-400 hidden md:table-cell">{emp.area}</td>
                  <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">{emp.role ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs hidden xl:table-cell">
                    {formatDateShort(emp.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(emp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#2d3255] transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(emp)}
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
        {employees.length} funcionário{employees.length !== 1 ? 's' : ''} cadastrado{employees.length !== 1 ? 's' : ''}
      </p>

      {/* Modal criar/editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Funcionário' : 'Novo Funcionário'}
      >
        <div className="space-y-4">
          {!editing && (
            <Input
              label="ID do Funcionário"
              placeholder="ex: EMP001"
              value={form.id}
              onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
              error={errors.id}
            />
          )}
          <Input
            label="Nome Completo"
            placeholder="ex: João Silva"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            error={errors.name}
          />
          <Input
            label="Área / Departamento"
            placeholder="ex: Engenharia"
            value={form.area}
            onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
            error={errors.area}
          />
          <Input
            label="Cargo (opcional)"
            placeholder="ex: Desenvolvedor Senior"
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? 'Salvar' : 'Cadastrar'}</Button>
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
        {deleteTarget && (() => {
          const activeCount = activeQRsForEmployee(deleteTarget.id)
          return (
            <div className="space-y-4">
              {activeCount > 0 && (
                <div className="flex gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  <span className="shrink-0">⚠️</span>
                  <span>
                    Este funcionário possui <strong>{activeCount} QR{activeCount !== 1 ? 's' : ''} ativo{activeCount !== 1 ? 's' : ''}</strong>.
                    Após a exclusão esses QRs não poderão mais ser usados para cadastro.
                  </span>
                </div>
              )}
              <p className="text-sm text-slate-300">
                Tem certeza que deseja remover <strong className="text-white">{deleteTarget.name}</strong>?
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                <Button variant="danger" onClick={handleDelete}>
                  <Trash2 size={14} /> Remover
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
