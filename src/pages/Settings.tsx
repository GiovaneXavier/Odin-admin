import { useState, useRef } from 'react'
import { Eye, EyeOff, Save, CheckCircle, AlertTriangle, Info, Shield, Download, Upload, Server } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { employeeStorage, systemStorage, qrStorage, settingsStorage } from '@/services/storage'
import type { OdinSettings } from '@/types'

export function SettingsPage() {
  const [settings,    setSettings]    = useState<OdinSettings>(() => settingsStorage.get())
  const [showQr,      setShowQr]      = useState(false)
  const [showToken,   setShowToken]   = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importOk,    setImportOk]    = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  function handleSave() {
    settingsStorage.save(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleExport() {
    const data = {
      exportedAt: new Date().toISOString(),
      employees:  employeeStorage.getAll(),
      systems:    systemStorage.getAll(),
      qrRecords:  qrStorage.getAll(),
      settings:   settingsStorage.get(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `odin-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.employees)  localStorage.setItem('odin_employees',  JSON.stringify(data.employees))
        if (data.systems)    localStorage.setItem('odin_systems',    JSON.stringify(data.systems))
        if (data.qrRecords)  localStorage.setItem('odin_qr_records', JSON.stringify(data.qrRecords))
        if (data.settings) {
          localStorage.setItem('odin_settings', JSON.stringify(data.settings))
          setSettings(data.settings)
        }
        setImportOk(true)
        setTimeout(() => setImportOk(false), 3000)
      } catch {
        setImportError('Arquivo inválido. Certifique-se de usar um backup gerado por este sistema.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const isConfigured = !!settings.qrHmacKey

  return (
    <div className="max-w-2xl space-y-6">
      {/* Status */}
      <Card className={isConfigured
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : 'border-amber-500/30 bg-amber-500/5'
      }>
        <div className="flex items-center gap-3">
          {isConfigured ? (
            <CheckCircle size={20} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={20} className="text-amber-400 shrink-0" />
          )}
          <div>
            <p className={`text-sm font-semibold ${isConfigured ? 'text-emerald-300' : 'text-amber-300'}`}>
              {isConfigured ? 'Sistema configurado' : 'Configuração necessária'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {isConfigured
                ? 'A chave HMAC está configurada. Os QR codes serão gerados corretamente.'
                : 'Configure a chave HMAC para habilitar a geração de QR codes.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Chaves HMAC */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <Shield size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200">Chaves HMAC</h3>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          As chaves devem ser idênticas às configuradas no app Huginn e no backend Heimdall.
          Nunca compartilhe ou exponha estas chaves.
        </p>

        <div className="space-y-4">
          {/* qrHmacKey */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              QR HMAC Key <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showQr ? 'text' : 'password'}
                value={settings.qrHmacKey}
                onChange={e => setSettings(s => ({ ...s, qrHmacKey: e.target.value }))}
                placeholder="Chave secreta para assinar QRs de cadastro"
                className="w-full pr-10 pl-3 py-2.5 rounded-lg bg-[#1a1d2e] border border-[#2d3255] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1428A0] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowQr(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showQr ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-xs text-slate-600 flex items-center gap-1">
              <Info size={11} />
              Usada pelo <code className="text-slate-500">QRValidator.kt</code> — mesma chave do{' '}
              <code className="text-slate-500">@Named("qrHmacKey")</code> no AppModule
            </p>
          </div>

          {/* tokenHmacKey */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Token HMAC Key <span className="text-slate-600">(opcional)</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={settings.tokenHmacKey}
                onChange={e => setSettings(s => ({ ...s, tokenHmacKey: e.target.value }))}
                placeholder="Chave para tokens de autenticação QR dinâmicos"
                className="w-full pr-10 pl-3 py-2.5 rounded-lg bg-[#1a1d2e] border border-[#2d3255] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1428A0] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-xs text-slate-600 flex items-center gap-1">
              <Info size={11} />
              Usada pelo <code className="text-slate-500">QrTokenGenerator.kt</code> — tokens dinâmicos do app
            </p>
          </div>
        </div>
      </Card>

      {/* Configurações gerais */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Preferências</h3>
        <div className="space-y-4">
          <Input
            label="Validade padrão dos QRs (minutos)"
            type="number"
            min="1"
            max="1440"
            value={settings.defaultQrValidityMinutes}
            onChange={e => setSettings(s => ({ ...s, defaultQrValidityMinutes: Number(e.target.value) }))}
          />
          <p className="text-xs text-slate-600">
            Este valor é pré-preenchido no gerador de QR. Recomendado: 10 minutos.
          </p>
        </div>
      </Card>

      {/* Backend / Storage mode */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <Server size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200">Integração com Backend</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Por padrão os dados ficam no localStorage do navegador. Quando um backend REST estiver
          disponível, selecione "Remoto" e configure a URL base da API.
        </p>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Modo de armazenamento
            </label>
            <div className="flex gap-2">
              {(['local', 'remote'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSettings(s => ({ ...s, storageMode: mode }))}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    settings.storageMode === mode
                      ? 'bg-[#1428A0] border-[#1428A0] text-white'
                      : 'bg-transparent border-[#2d3255] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode === 'local' ? 'Local (localStorage)' : 'Remoto (API REST)'}
                </button>
              ))}
            </div>
          </div>
          {settings.storageMode === 'remote' && (
            <Input
              label="URL base da API"
              type="url"
              value={settings.apiBaseUrl}
              onChange={e => setSettings(s => ({ ...s, apiBaseUrl: e.target.value }))}
              placeholder="https://api.sua-empresa.com/odin"
            />
          )}
        </div>
      </Card>

      {/* Backup / Restore */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <Download size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200">Backup e Restauração</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Exporte todos os dados (funcionários, sistemas, histórico de QRs e configurações) para
          um arquivo JSON. Use para migrar entre máquinas ou para recuperação em caso de limpeza
          do browser.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={14} /> Exportar backup
          </Button>
          <Button variant="secondary" onClick={() => importRef.current?.click()}>
            <Upload size={14} /> Importar backup
          </Button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
        {importOk && (
          <p className="mt-3 text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle size={12} /> Dados restaurados com sucesso.
          </p>
        )}
        {importError && (
          <p className="mt-3 text-xs text-red-400 flex items-center gap-1">
            <AlertTriangle size={12} /> {importError}
          </p>
        )}
      </Card>

      {/* Aviso de segurança */}
      <Card className="border-red-500/20 bg-red-500/5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs text-red-300 space-y-1">
            <p className="font-semibold">Atenção de Segurança</p>
            <p className="text-red-400/80">
              As chaves HMAC são armazenadas no <code>localStorage</code> deste navegador.
              Use este sistema apenas em máquinas confiáveis e seguras.
              Nunca compartilhe acesso a esta página com pessoas não autorizadas.
            </p>
          </div>
        </div>
      </Card>

      <Button
        size="lg"
        onClick={handleSave}
        className={saved ? 'bg-emerald-600 hover:bg-emerald-600' : ''}
      >
        {saved ? (
          <><CheckCircle size={16} /> Salvo!</>
        ) : (
          <><Save size={16} /> Salvar Configurações</>
        )}
      </Button>
    </div>
  )
}
