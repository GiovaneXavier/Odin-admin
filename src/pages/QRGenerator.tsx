import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, AlertTriangle, CheckCircle, RefreshCw, Download, Copy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { employeeStorage, systemStorage, settingsStorage } from '@/services/storage'
import { generateRegistrationQR } from '@/services/qrService'
import { formatDate } from '@/lib/utils'
import type { QRRegistrationPayload } from '@/types'
import { useNavigate } from 'react-router-dom'

interface QRResult {
  payloadJson: string
  payload: QRRegistrationPayload
}

export function QRGenerator() {
  const navigate = useNavigate()
  const employees = employeeStorage.getAll()
  const systems   = systemStorage.getAll()
  const settings  = settingsStorage.get()
  const qrRef     = useRef<HTMLDivElement>(null)

  const [employeeId,   setEmployeeId]   = useState('')
  const [systemId,     setSystemId]     = useState('')
  const [validity,     setValidity]     = useState(String(settings.defaultQrValidityMinutes))
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [result,       setResult]       = useState<QRResult | null>(null)
  const [copied,       setCopied]       = useState(false)

  const selectedEmployee = employees.find(e => e.id === employeeId)
  const selectedSystem   = systems.find(s => s.id === systemId)

  const canGenerate = !!employeeId && !!systemId && !!validity && settings.qrHmacKey && !loading

  async function handleGenerate() {
    if (!selectedEmployee || !selectedSystem) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await generateRegistrationQR({
        employee: selectedEmployee,
        system:   selectedSystem,
        validityMinutes: Number(validity),
      })
      setResult({ payloadJson: res.payloadJson, payload: res.payload })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar QR')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError('')
  }

  async function handleCopy() {
    if (!result) return
    await navigator.clipboard.writeText(result.payloadJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    if (!qrRef.current) return
    const svg = qrRef.current.querySelector('svg')
    if (!svg) return
    const data = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([data], { type: 'image/svg+xml' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `huginn-qr-${selectedEmployee?.id ?? 'card'}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Sem chave configurada ────────────────────────────────────────────────────
  if (!settings.qrHmacKey) {
    return (
      <Card className="max-w-lg mx-auto text-center py-12">
        <AlertTriangle size={40} className="text-amber-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Chave HMAC não configurada</h3>
        <p className="text-sm text-slate-400 mb-6">
          Configure a <code className="text-amber-300">qrHmacKey</code> nas configurações
          antes de gerar QR codes.
        </p>
        <Button onClick={() => navigate('/settings')}>Ir para Configurações</Button>
      </Card>
    )
  }

  // ── Sem funcionários ou sistemas ──────────────────────────────────────────────
  if (employees.length === 0 || systems.length === 0) {
    return (
      <Card className="max-w-lg mx-auto text-center py-12">
        <QrCode size={40} className="text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Dados insuficientes</h3>
        <p className="text-sm text-slate-400 mb-6">
          Você precisa cadastrar ao menos um <strong>funcionário</strong> e um{' '}
          <strong>sistema</strong> antes de gerar QR codes.
        </p>
        <div className="flex gap-3 justify-center">
          {employees.length === 0 && (
            <Button variant="secondary" onClick={() => navigate('/employees')}>
              Cadastrar Funcionário
            </Button>
          )}
          {systems.length === 0 && (
            <Button variant="secondary" onClick={() => navigate('/systems')}>
              Criar Sistema
            </Button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-5xl">
      {/* Formulário */}
      <div className="space-y-5">
        <Card>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Dados do Cadastro
          </h3>
          <div className="space-y-4">
            <Select
              label="Funcionário"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
            >
              <option value="">Selecione o funcionário...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.id}) — {e.area}
                </option>
              ))}
            </Select>

            <Select
              label="Sistema"
              value={systemId}
              onChange={e => setSystemId(e.target.value)}
            >
              <option value="">Selecione o sistema...</option>
              {systems.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </Select>

            <Input
              label="Validade (minutos)"
              type="number"
              min="1"
              max="1440"
              value={validity}
              onChange={e => setValidity(e.target.value)}
            />
          </div>
        </Card>

        {/* Preview dos dados selecionados */}
        {selectedEmployee && selectedSystem && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Preview do Cartão
            </h3>
            <div
              className="rounded-xl p-5 relative overflow-hidden"
              style={{ background: selectedSystem.cardColor }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle at 70% 50%, white 0%, transparent 60%)',
                }}
              />
              <p className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-2">
                SRBR · Huginn
              </p>
              <p className="text-white font-bold text-xl">{selectedEmployee.name}</p>
              <p className="text-white/70 text-sm mt-0.5">{selectedEmployee.area}</p>
              {selectedEmployee.role && (
                <p className="text-white/50 text-xs mt-0.5">{selectedEmployee.role}</p>
              )}
              <div className="mt-4 pt-3 border-t border-white/20 flex items-end justify-between">
                <div>
                  <p className="text-white/50 text-xs">{selectedSystem.name}</p>
                  <p className="text-white/80 font-mono text-xs">{selectedEmployee.id}</p>
                </div>
                <QrCode size={24} className="text-white/40" />
              </div>
            </div>
          </Card>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertTriangle size={15} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {!result ? (
          <Button
            size="lg"
            className="w-full"
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            {loading ? (
              <><RefreshCw size={18} className="animate-spin" /> Gerando...</>
            ) : (
              <><QrCode size={18} /> Gerar QR de Cadastro</>
            )}
          </Button>
        ) : (
          <Button variant="secondary" size="lg" className="w-full" onClick={handleReset}>
            <RefreshCw size={16} /> Gerar Novo QR
          </Button>
        )}
      </div>

      {/* QR Code gerado */}
      <div>
        {result ? (
          <Card className="flex flex-col items-center gap-5">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
                QR Gerado com Sucesso
              </h3>
            </div>

            {/* QR Code visual */}
            <div ref={qrRef} className="p-4 bg-white rounded-2xl shadow-2xl">
              <QRCodeSVG
                value={result.payloadJson}
                size={240}
                level="M"
              />
            </div>

            {/* Infos */}
            <div className="w-full space-y-2 text-xs">
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-[#1a1d2e] border border-[#2d3255]">
                <span className="text-slate-500">Funcionário</span>
                <span className="text-slate-200 font-semibold">{selectedEmployee?.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-[#1a1d2e] border border-[#2d3255]">
                <span className="text-slate-500">Sistema</span>
                <span className="text-slate-200 font-semibold">{selectedSystem?.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-[#1a1d2e] border border-[#2d3255]">
                <span className="text-slate-500">Expira em</span>
                <span className="text-slate-200 font-semibold">
                  {formatDate(result.payload.expires_at)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-[#1a1d2e] border border-[#2d3255]">
                <span className="text-slate-500">Modo</span>
                <Badge variant="info">REG · v{result.payload.version}</Badge>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3 w-full">
              <Button variant="secondary" className="flex-1" onClick={handleCopy}>
                <Copy size={14} />
                {copied ? 'Copiado!' : 'Copiar JSON'}
              </Button>
              <Button variant="secondary" className="flex-1" onClick={handleDownload}>
                <Download size={14} /> Baixar SVG
              </Button>
            </div>

            <p className="text-xs text-slate-600 text-center">
              Mostre este QR para o funcionário escanear com o app Huginn
            </p>
          </Card>
        ) : (
          <Card className="flex flex-col items-center justify-center py-20 gap-4 h-full">
            <div className="relative">
              <QrCode size={52} className="text-slate-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#0f1117] flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-[#2d3255]" />
                </div>
              </div>
            </div>
            <p className="text-slate-500 text-sm text-center">
              Preencha os dados ao lado e<br />clique em "Gerar QR de Cadastro"
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
