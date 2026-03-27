# Roadmap — Odin Admin

## P0 — Crítico (bloqueia uso em produção)

### Autenticação no painel
O painel não tem login. Qualquer pessoa com acesso à URL pode gerar QRs válidos e acessar todos os dados de funcionários. Adicionar autenticação (ao menos Basic Auth ou PIN) antes de expor em rede corporativa.

### Gestão de chaves HMAC
A chave HMAC configurada em Settings deve coincidir com `HUGINN_QR_HMAC_KEY` dos apps móveis. Definir:
- Processo formal de rotação de chave (invalida todos os QRs ativos em campo)
- Procedimento de emergência para revogação imediata

---

## P1 — Alta prioridade (segurança e robustez)

### Revogação de QR individual
O painel lista QRs mas não permite revogar um QR específico antes de ele expirar. Necessário para resposta a incidentes (funcionário com QR comprometido).

### Backup e export de dados
Tudo está em `localStorage`. Um clear de browser apaga todos os funcionários, sistemas e histórico. Implementar export JSON + import para recovery manual.

---

## P2 — Médio prazo (qualidade e experiência)

### Suite de testes (Vitest + React Testing Library)
Não existe nenhum teste automatizado. Prioridade de implementação:
1. `crypto.ts` — verificar que o HMAC produz Base64url sem padding idêntico ao Android
2. `qrService.ts` — casos de borda de validação (`validityMinutes`, campos obrigatórios)
3. Páginas críticas: `QRGenerator`, `Employees`

### Paginação no QRHistory
O histórico cresce sem limite no `localStorage`. Adicionar paginação ou limite de N registros mais recentes com opção de exportar o restante.

### Monitoramento / métricas
Adicionar contador de QRs gerados, validados e rejeitados por dia. Útil para auditoria e detecção de uso anômalo.

---

## P3 — Futuro / nice-to-have

### Integração com backend real
Substituir `localStorage` por API REST. O `qrService.ts` já encapsula toda a lógica de geração; a camada de storage (`storage.ts`) pode ser trocada sem afetar o restante.

### Múltiplos sistemas por funcionário no QRGenerator
Atualmente gera 1 QR por sistema. Para funcionários com acesso a múltiplos sistemas, permitir geração em lote.
