# CLAUDE.md — Odin Admin

Este arquivo orienta o Claude Code ao trabalhar neste repositório.

## Comandos

```bash
# Desenvolvimento
npm run dev      # Vite dev server (hot reload)

# Build
npm run build    # tsc + vite build
npm run preview  # Servir o build de produção localmente

# Sem framework de testes configurado atualmente
```

## Arquitetura

**Stack**: React 18 + TypeScript + Vite + Tailwind CSS + React Router v6
**Persistência**: `localStorage` exclusivamente — sem backend, sem chamadas de rede
**Propósito**: Painel administrativo do sistema Huginn. Gera QR codes de registro para funcionários e gerencia o ciclo de vida das credenciais.

### Estrutura de arquivos

```
src/
  App.tsx                   → Router; inclui catch-all para rotas inválidas
  main.tsx                  → Entry point React

  pages/
    Dashboard.tsx           → Métricas gerais (funcionários, sistemas, QRs ativos)
    Employees.tsx           → CRUD de funcionários + aviso ao deletar com QRs ativos
    Systems.tsx             → CRUD de sistemas (com validação de cor hex #RRGGBB)
    QRGenerator.tsx         → Geração de QRs de registro para um funcionário/sistema
    QRHistory.tsx           → Histórico de QRs com refresh automático a cada 30 s
    Settings.tsx            → Configurações da chave HMAC e parâmetros do sistema

  components/
    layout/Header.tsx       → Relógio em tempo real (atualiza a cada 30 s)
    layout/Sidebar.tsx      → Navegação lateral
    ui/                     → Badge, Button, Card, Input, Modal, Select

  services/
    crypto.ts               → HMAC-SHA256 via Web Crypto API (assíncrono, subtle.sign)
    storage.ts              → Wrapper de localStorage com tipagem (employees, systems, qrs)
    qrService.ts            → Geração de QRs de registro; valida validityMinutes (inteiro ≥ 1)

  types/index.ts            → Employee, System, QRRecord e demais tipos compartilhados
  lib/utils.ts              → cn() (clsx + tailwind-merge)
```

## Formato do QR de Registro

O payload é um JSON assinado com HMAC-SHA256 (Base64url sem padding):

```json
{
  "version": 1,
  "mode": "REG",
  "issued_at": 1700000000,
  "expires_at": 1700003600,
  "nonce": "<uuid-v4>",
  "employee": { "id": "SRBR-0042", "name": "Ana Lima", "area": "Pesquisa", "role": null },
  "card": { "system": "SRBR_EXIT", "system_name": "Saída SRBR", "card_color": "#1428A0" },
  "signature": "<hmac-base64url-43-chars>"
}
```

- `signature` é o HMAC-SHA256 da string canônica: `version|mode|issued_at|expires_at|nonce|employee.id|employee.name|card.system`
- Chave HMAC configurada em Settings; deve coincidir com `HUGINN_QR_HMAC_KEY` dos apps móveis
- A assinatura usa Base64url **sem padding** (`=` removidos) — mesma convenção dos apps Kotlin

## Decisões Técnicas Importantes

| Decisão | Motivo |
|---|---|
| `localStorage` sem backend | MVP isolado; não requer infraestrutura de servidor |
| Web Crypto API (`subtle.sign`) | HMAC nativo no browser; sem dependências de crypto externas |
| Base64url sem padding | Alinhamento com apps Android (`Base64.NO_PADDING`) |
| `validityMinutes` validado como inteiro ≥ 1 | Impede QRs com validade fracionária ou negativa |
| Cor do sistema validada com `/^#[0-9A-Fa-f]{6}$/` | Evita valores inválidos que quebram o tema do card |
| Aviso ao deletar funcionário com QRs ativos | Evita credenciais órfãs no campo |
| Catch-all `<Route path="*">` no App.tsx | Evita tela em branco em URLs inválidas |
| `setInterval(30_000)` no QRHistory | Status de QRs (ativo/expirado) muda com o tempo; auto-refresh evita dados obsoletos |

## Relação com os Apps Móveis

O Odin Admin é o **ponto de emissão** das credenciais. O fluxo completo do sistema é:

```
Odin Admin (este repo)
  └─ gera QR de registro (payload JSON + HMAC)
       └─ Huginn Mobile (NFC ou QR) escaneia e valida
            └─ salva credencial, usa biometria para desbloquear
                 └─ Heimdall (leitor NFC/QR) valida token dinâmico
```

A chave `HUGINN_QR_HMAC_KEY` deve ser a mesma nos três componentes.

## Ausência de Testes Automatizados

Não há framework de testes configurado. Para adicionar:
- Vitest + React Testing Library para componentes/páginas
- Testes de `crypto.ts` são prioritários (verificar que o HMAC produz Base64url sem padding)
