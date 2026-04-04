# Roadmap — Sistema Odin + Huginn + Heimdall

> **Arquitetura de referência:**
> ```
> Odin Admin ──QR assinado──▶ Huginn Mobile (offline, sem acesso ao servidor)
>                                    │ token NFC/QR
>                                    ▼
>                             Heimdall (único componente com acesso ao servidor corporativo)
>                                    │ HTTP
>                                    ▼
>                             Servidor corporativo
> ```
> Huginn Mobile não faz nenhuma chamada de rede. Todo o controle de acesso em tempo real
> passa pelo Heimdall, que é o ponto de integração com a infraestrutura corporativa.

---

## P0 — Crítico (bloqueia uso em produção)

### [C2] Autenticação no Odin Admin
**Componente:** Odin Admin
O painel não tem login. Qualquer pessoa com acesso à URL pode gerar QR codes válidos,
visualizar funcionários e exportar as chaves HMAC.

**O que implementar:**
- Integrar com o campo de segurança corporativo (SSO/login existente)
- Sessão com expiração — ao fechar o browser, exige novo login
- Audit log server-side: registrar quem gerou qual QR, quando e para qual funcionário

### [C1] Remover chave HMAC do localStorage
**Componente:** Odin Admin
Hoje a `qrHmacKey` é salva em texto puro no browser. Em produção a chave nunca
deve tocar o frontend.

**O que implementar:**
- A geração do QR vira uma chamada `POST /api/v1/qr/generate` — o servidor assina o payload e retorna pronto
- Odin Admin envia os dados do funcionário/sistema/validade; o servidor faz o HMAC
- A aba de Settings da chave HMAC some da interface — gerenciada exclusivamente no servidor
- Employee e System CRUD passam a usar a API real (o `src/api/client.ts` já está preparado)

### [A1] Build Android falha se chave HMAC não estiver configurada
**Componente:** Huginn Mobile (NFC + QR), Heimdall NFC
As chaves têm valores padrão hardcoded (`SRBR_*_2024`) que entram no APK se o
`local.properties` não estiver configurado. APK com chave padrão = chave pública.

**O que implementar:**
- `build.gradle` deve usar `error()` se a propriedade não estiver definida — sem fallback
- Criar `local.properties.example` com placeholders para onboarding de novos devs
- No CI/CD: injetar chaves via variável de ambiente segura, nunca no repositório

### [A2] Heimdall: forçar setup de PIN no primeiro boot
**Componente:** Heimdall NFC
O PIN de manutenção do leitor tem default `123456`. Com acesso físico ao leitor,
qualquer pessoa entra no menu de configuração e pode alterar systemId, URL do servidor, etc.

**O que implementar:**
- Ao iniciar sem PIN configurado, bloquear na tela de setup — não permite sair
- Validar qualidade do PIN: mínimo 6 dígitos, rejeitar sequências óbvias (`123456`, `000000`, `111111`)
- Após N tentativas erradas de PIN, bloquear o menu por tempo crescente (ex: 1min, 5min, 15min)

---

## P1 — Alta prioridade (segurança e robustez)

### [M1] Certificate Pinning — substituir hashes placeholder
**Componente:** Heimdall NFC
**Status:** Estrutura implementada em `network_security_config.xml` — falta inserir os hashes reais.

**O que fazer antes de ir para produção:**
```bash
# Rodar contra o servidor real para obter o hash:
openssl s_client -connect SEU_SERVIDOR:443 2>/dev/null \
  | openssl x509 -pubkey -noout \
  | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary \
  | base64
```
Substituir `AAAA...` e `BBBB...` em `network_security_config.xml` pelos hashes do
certificado primário e do certificado de backup (para renovação sem lockout).
Atualizar também a data de expiração `expiration="2027-01-01"`.

### [D1] Revogação remota de acesso
**Componente:** Odin Admin + Servidor corporativo + Heimdall
Como o Huginn Mobile é offline, a revogação funciona pelo Heimdall na etapa de
validação remota (etapa 4 do pipeline). O Huginn não precisa saber de nada.

**Fluxo correto:**
```
Admin revoga funcionário no Odin Admin
        │
        ▼ POST /api/v1/employees/{id}/revoke
Servidor corporativo seta employee.is_active = false
        │
        (próxima leitura NFC/QR do funcionário)
        │
        ▼ Huginn gera token normalmente (não sabe que foi revogado)
        │
        ▼ Heimdall valida token → chama servidor → servidor retorna 403
        │
        ▼ Heimdall nega acesso — "Funcionário não autorizado"
```

**O que implementar:**
- **Servidor:** adicionar campo `is_active` em employees; retornar `403` com `denialReason: EMPLOYEE_NOT_FOUND` quando inativo
- **Odin Admin:** botão "Revogar acesso" na tela de Employees chama `POST /api/v1/employees/{id}/revoke`
- **Heimdall:** já mapeia `403/404 → EMPLOYEE_NOT_FOUND` — nenhuma mudança necessária nos apps

### [OLD-P1] Revogação de QR individual
O painel lista QRs mas não permite revogar antes de expirar. Necessário para resposta
a incidentes. *(Parcialmente implementado — `revokedAt` existe no modelo.)*

### [OLD-P1] Backup e export de dados
Tudo está em `localStorage`. Implementar export JSON + import para recovery manual.
*(Parcialmente implementado em Settings.)*

---

## P2 — Médio prazo (qualidade e experiência)

### [M3] Salt de device ID aleatório por device
**Componente:** Huginn Mobile (NFC + QR)
Hoje o salt do device ID é hardcoded e público no código (`SRBR_HUGINN_2024`).
Isso não quebra o sistema, mas torna o device ID previsível para quem conhece o código-fonte.

**Como funciona a identificação (não muda com o salt):**
- O device ID é fixo por device — sempre o mesmo valor para o mesmo celular
- O salt aleatório apenas torna esse ID imprevisível externamente
- O Heimdall continua identificando o device normalmente: Huginn envia `deviceId` no token,
  Heimdall repassa ao servidor, servidor consulta o mapeamento `deviceId → employeeId`

**O que implementar:**
- No primeiro boot, gerar salt de 32 bytes com `SecureRandom`
- Armazenar o salt em `EncryptedSharedPreferences` (Keystore-backed)
- `deviceId = SHA-256(salt + ANDROID_ID)`

### [OLD-P2] Suite de testes (Vitest + React Testing Library)
Prioridade de implementação:
1. `crypto.ts` — verificar que o HMAC produz Base64url sem padding idêntico ao Android
2. `qrService.ts` — casos de borda (`validityMinutes`, campos obrigatórios)
3. Páginas críticas: `QRGenerator`, `Employees`

### [OLD-P2] Monitoramento / métricas
Contador de QRs gerados, validados e rejeitados por dia. Útil para auditoria e
detecção de uso anômalo.

---

## P3 — Futuro / nice-to-have

### Integração completa com API corporativa (Odin Admin)
Substituir `localStorage` por chamadas à API real. O `src/api/client.ts` já tem
o cliente tipado pronto. A camada `storage.ts` pode ser trocada sem afetar o restante.

### Múltiplos sistemas por funcionário no QRGenerator
Atualmente gera 1 QR por sistema. Para funcionários com acesso a múltiplos sistemas,
permitir geração em lote com download de todos os QRs.

### Rotação de chave HMAC com janela de transição
Quando a chave HMAC for trocada, permitir um período onde ambas as chaves (antiga e nova)
são aceitas. Evita que todos os funcionários precisem re-registrar o cartão ao mesmo tempo.

---

## Implementado (auditoria 2026-04-03)

| Item | Descrição | Componente |
|------|-----------|-----------|
| ✅ A3 | Log HTTP trocado de `BODY` para `HEADERS`; campos sensíveis redactados | Heimdall |
| ✅ M1 | Estrutura de certificate pinning adicionada (aguarda hashes reais) | Heimdall |
| ✅ M4 | Hilt alinhado para `2.52` em ambos os projetos Huginn; artefato corrigido para `hilt-android-compiler` | Huginn QR |
| ✅ D2 | Rate limiting: 5 falhas consecutivas → bloqueio de 30s; `RATE_LIMITED` adicionado ao `DenialReason` | Heimdall |
