# Auditoria de Segurança — Sistema Odin + Huginn + Heimdall

**Data:** 2026-04-03
**Escopo:** Odin Admin (web), Huginn Mobile (NFC + QR), Heimdall NFC (leitor)
**Auditor:** Claude Code (análise estática de código)

---

## Pontos Fortes — O que está bem implementado

| # | Descrição | Arquivo de Referência |
|---|-----------|----------------------|
| ✅ | HMAC com comparação em tempo constante (`MessageDigest.isEqual`) — previne timing attack | `HmacValidator.kt` |
| ✅ | `EncryptedSharedPreferences` AES-256-GCM para dados sensíveis no device | `CardStorage.kt`, `SecurePreferences.kt` |
| ✅ | Validação estrita de Base64url — rejeita Base64 padrão | `HmacValidator.kt` |
| ✅ | Janela temporal ±30s — previne tokens muito antigos ou do futuro | `ValidateNewTokenUseCase.kt` |
| ✅ | Anti-replay com nonce (backend + 50 últimos no device) | `CardStorage.kt` |
| ✅ | Cleartext HTTP desabilitado em todas as camadas | `network_security_config.xml` |
| ✅ | Backup do app desabilitado (`allowBackup=false`) | `AndroidManifest.xml` |
| ✅ | Pipeline de validação em 4 estágios com early exit | `ValidateNewTokenUseCase.kt` |

---

## Vulnerabilidades — Detalhamento e Correções

---

### 🔴 [C1] Chaves HMAC em `localStorage` sem criptografia

**Severidade:** Crítico
**Componente:** Odin Admin
**Arquivo:** `src/services/storage.ts`

**Descrição:**
As chaves `qrHmacKey` e `tokenHmacKey` são persistidas em texto puro no `localStorage` do browser:

```json
// localStorage["odin_settings"]
{
  "qrHmacKey": "SRBR_HUGINN_ODIN_SECRET_2024",
  "tokenHmacKey": "SRBR_HEIMDALL_TOKEN_SECRET_2024"
}
```

Essas chaves são a raiz de confiança do sistema inteiro. Com elas, qualquer pessoa pode gerar QR codes válidos e tokens NFC aceitos pelo Heimdall.

**Vetores de exploração:**
- Extensão de browser maliciosa com acesso ao `localStorage`
- Ataque XSS em qualquer página do domínio
- Acesso físico ao computador com DevTools aberto
- Malware com acesso ao perfil do browser

**O que fazer:**

**Opção 1 — Mínimo imediato (sem backend):**
Não persistir a chave entre sessões. Pedir a cada vez que o painel for aberto.

```typescript
// storage.ts — remover qrHmacKey e tokenHmacKey do localStorage
// Settings.tsx — adicionar campo "chave da sessão" que não é salvo
// A chave fica apenas em memória (variável de estado React) enquanto o painel está aberto
```

**Opção 2 — Ideal (com backend):**
A chave nunca toca o frontend. O backend assina o QR e retorna apenas o payload final.

**Pergunta aberta:** A chave atual em `local.properties` é a mesma usada em produção ou apenas para desenvolvimento?

---Esse sistema é somente para teste, em produção vamos acomplar o sistema ao nosso campo de segurança com login e acesso ao nosso banco, levante todas as sistuações que devemos, ajustar

### 🔴 [C2] Painel Odin Admin sem autenticação

**Severidade:** Crítico
**Componente:** Odin Admin
**Arquivo:** Nenhum — feature ausente

**Descrição:**
O painel não possui nenhum mecanismo de login. Qualquer pessoa que acesse a URL pode:
- Criar e editar funcionários
- Gerar QR codes de cadastro válidos
- Visualizar histórico de credenciais emitidas
- Revogar credenciais existentes
- Exportar backup com as chaves HMAC

**O que fazer:**

**Passo 1 — Imediato (sem código):**
Colocar o painel atrás de autenticação HTTP Basic no servidor (nginx ou caddy):

```nginx
# nginx.conf
location / {
    auth_basic "Odin Admin";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://localhost:5173;
}
```

**Passo 2 — Curto prazo (com código):**
Adicionar tela de login com PIN/senha no próprio React. Usar `sessionStorage` para a sessão (não `localStorage`).

**Passo 3 — Ideal:**
Autenticação com usuário/senha + MFA (TOTP). Registrar audit log de quem gerou cada QR.

**Pergunta aberta:** O Odin Admin está exposto apenas em rede local ou via internet? Isso define a urgência e o nível de proteção necessário.

---o mesmo para pegunta anterior

### 🟠 [A1] Chaves padrão hardcoded nos builds Android

**Severidade:** Alto
**Componente:** Huginn Mobile, Heimdall NFC
**Arquivos:**
- `Hugginn_mobile/app/build.gradle` linhas 22-25
- `heimdall_NFC/app/build.gradle.kts` linhas 24-27

**Descrição:**
Os projetos Android definem valores padrão para as chaves HMAC caso o `local.properties` não esteja configurado:

```kotlin
// Hugginn_mobile/app/build.gradle
buildConfigField("String", "QR_HMAC_KEY",
    "\"${localProperties["HUGINN_QR_HMAC_KEY"] ?: "SRBR_HUGINN_ODIN_SECRET_2024"}\"")

buildConfigField("String", "TOKEN_HMAC_KEY",
    "\"${localProperties["HUGINN_TOKEN_HMAC_KEY"] ?: "SRBR_HEIMDALL_TOKEN_SECRET_2024"}\"")
```

Se alguém fizer um build sem o `local.properties` (ex: CI/CD mal configurado, novo dev no time), o APK vai para produção com as chaves padrão — que estão visíveis no código-fonte.

**Adicionalmente:** chaves compiladas em `BuildConfig` são extraíveis via decompilação do APK com `jadx` ou `apktool` em minutos, mesmo com ProGuard ativo.

**O que fazer:**

**Passo 1 — Quebrar o build se não configurado:**

```kotlin
// build.gradle.kts
val qrKey = localProperties.getProperty("HUGINN_QR_HMAC_KEY")
    ?: error("❌ HUGINN_QR_HMAC_KEY não definido em local.properties. Build abortado.")

val tokenKey = localProperties.getProperty("HUGINN_TOKEN_HMAC_KEY")
    ?: error("❌ HUGINN_TOKEN_HMAC_KEY não definido em local.properties. Build abortado.")

buildConfigField("String", "QR_HMAC_KEY", "\"$qrKey\"")
buildConfigField("String", "TOKEN_HMAC_KEY", "\"$tokenKey\"")
```

**Passo 2 — Documentar no README:**
Criar `local.properties.example` com as chaves placeholder e adicionar ao `.gitignore` (verificar se `local.properties` já está ignorado).

**Passo 3 — Longo prazo:**
Avaliar buscar a chave do backend após autenticação do usuário, em vez de compilar no APK. Isso elimina a exposição por decompilação.

---isso é quando a pessoa le o qr code? nao entendi

### 🟠 [A2] PIN de manutenção padrão "123456" no Heimdall

**Severidade:** Alto
**Componente:** Heimdall NFC
**Arquivo:** `heimdall_NFC/app/build.gradle.kts` linha 32

**Descrição:**
O PIN de manutenção do leitor tem um valor padrão hardcoded:

```kotlin
buildConfigField("String", "DEFAULT_MAINTENANCE_PIN_HASH",
    "\"8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92\"")
// 8d969eef... = SHA-256("123456")
```

Se o setup inicial for pulado ou o device for resetado, o PIN de manutenção é `123456`. Com acesso físico ao leitor, um atacante pode entrar no modo de manutenção, alterar configurações (systemId, chave HMAC, URL do backend) e comprometer o ponto de acesso.

**O que fazer:**

**Passo 1 — Forçar setup no primeiro boot:**

```kotlin
// No ViewModel de setup inicial
if (!configPreferences.isMaintenancePinConfigured()) {
    // Não permitir sair da tela de setup
    // Exigir PIN com mínimo 6 dígitos, não pode ser sequência óbvia
    navigateToFirstTimeSetup()
}
```

**Passo 2 — Validar qualidade do PIN:**
Rejeitar PINs óbvios: `123456`, `000000`, `111111`, sequências repetidas.

**Passo 3 — Remover o default do build:**
Assim como em [A1], o build deve falhar se o hash do PIN não for fornecido via `local.properties` para builds de release.

---onde isso ocorre

### 🟠 [A3] HTTP Logging com body completo em builds DEBUG

**Severidade:** Alto (em ambiente de homologação)
**Componente:** Heimdall NFC
**Arquivo:** `heimdall_NFC/app/src/main/kotlin/br/com/corp/heimdall/di/NetworkModule.kt` linhas 40-45

**Descrição:**
O interceptor de log do OkHttp está configurado com nível `BODY` em builds debug:

```kotlin
if (BuildConfig.DEBUG) {
    val logging = HttpLoggingInterceptor()
    logging.level = HttpLoggingInterceptor.Level.BODY  // loga payload completo
    client.addInterceptor(logging)
}
```

Isso significa que tokens NFC completos (incluindo o campo `hmac`) aparecem no logcat. Se um device de homologação estiver com ADB conectado ou com um app de leitura de logs, tokens válidos ficam expostos e podem ser reutilizados dentro da janela de 30s.

**O que fazer:**

```kotlin
// Trocar BODY por HEADERS — informação suficiente para debug sem expor tokens
logging.level = HttpLoggingInterceptor.Level.HEADERS

// Ou, se precisar do body, criar interceptor customizado que mascara campos sensíveis:
logging.redactHeader("Authorization")
// e criar um interceptor próprio que substitui o valor de "hmac" por "***"
```

---pode implementar

### 🟡 [M1] Certificate Pinning não implementado no Heimdall

**Severidade:** Médio
**Componente:** Heimdall NFC
**Arquivo:** `heimdall_NFC/app/src/main/res/xml/network_security_config.xml`

**Descrição:**
O arquivo de configuração de rede tem um template de certificate pinning comentado:

```xml
<!-- Implementar antes de produção:
<domain-config>
    <domain includeSubdomains="true">heimdall.corp.internal</domain>
    <pin-set>
        <pin digest="SHA-256">...</pin>
    </pin-set>
</domain-config>
-->
```

Sem pinning, um atacante com acesso à rede interna pode fazer MITM instalando um certificado de uma CA corporativa no device ou comprometendo a CA.

**O que fazer:**

**Passo 1 — Obter o hash do certificado atual do backend:**
```bash
openssl s_client -connect heimdall.corp.internal:443 | openssl x509 -pubkey -noout | \
openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64
```

**Passo 2 — Ativar o pinning no XML:**
```xml
<domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">heimdall.corp.internal</domain>
    <pin-set expiration="2027-01-01">
        <pin digest="SHA-256">HASH_DO_CERTIFICADO_PRIMARIO=</pin>
        <pin digest="SHA-256">HASH_DO_CERTIFICADO_BACKUP=</pin>
    </pin-set>
</domain-config>
```

**Importante:** Sempre configurar dois pins (primário + backup) e uma data de expiração para evitar lockout permanente se o certificado for renovado.

---pode implementar


### 🟡 [M2] Entropia insuficiente no nonce do token NFC

**Severidade:** Médio
**Componente:** Huginn Mobile
**Arquivo:** `Hugginn_mobile/app/src/main/kotlin/com/srbr/huginn/core/security/NfcTokenGenerator.kt`

**Descrição:**
O nonce do token NFC usa apenas 24 bits úteis:

```kotlin
val nonce = SecureRandom().nextLong() and 0xFFFFFFL  // máscara de 24 bits = ~16 milhões de valores
```

Com a janela de ±30s e validação de nonce no backend, a colisão é improvável em uso normal. Porém, em um ambiente com muitos acessos simultâneos (ex: torniquetes em horário de pico), dois dispositivos diferentes podem gerar o mesmo nonce no mesmo segundo — um deles seria rejeitado pelo backend como replay.

**O que fazer:**

```kotlin
// Aumentar para 48 bits (~281 trilhões de valores)
val nonce = SecureRandom().nextLong() and 0xFFFFFFFFFFFFL

// Ou usar 64 bits completos (sem máscara)
val nonce = SecureRandom().nextLong()
```

Verificar o formato esperado pelo backend antes de alterar — o campo `nonce` no `ValidateRequestDto` pode ter limite de tamanho.

---não é necessario, nosso uso será de no máximo 10 leitura a cada 30s

### 🟡 [M3] Salt de device ID hardcoded e público

**Severidade:** Médio (baixo impacto isolado, médio em combinação)
**Componente:** Huginn Mobile
**Arquivo:** `Hugginn_mobile/app/src/main/kotlin/com/srbr/huginn/core/security/DeviceIdentity.kt` linha 14

**Descrição:**
O device ID é derivado via `SHA-256(salt + ANDROID_ID)` com salt fixo e público:

```kotlin
private const val SALT = "SRBR_HUGINN_2024"
val deviceId = sha256("$SALT${Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)}")
```

Com o salt público, é possível pré-computar device IDs a partir de listas de ANDROID_IDs conhecidos.

**O que fazer:**

```kotlin
// Gerar salt aleatório no primeiro boot e armazenar no Keystore
fun getOrCreateDeviceSalt(context: Context): String {
    val prefs = EncryptedSharedPreferences.create(context, "device_identity", ...)
    return prefs.getString("salt", null) ?: run {
        val newSalt = generateSecureRandom(32) // 32 bytes hex
        prefs.edit().putString("salt", newSalt).apply()
        newSalt
    }
}
```

---e como fariamos para identificar quem é?

### 🟡 [M4] Versão do Hilt inconsistente entre projetos Android

**Severidade:** Baixo/Médio
**Componente:** Huginn Mobile QR Code
**Arquivo:** `Hugginn_mobile_qr_code/app/build.gradle`

**Descrição:**
- `Hugginn_mobile` usa Hilt **2.52**
- `Hugginn_mobile_qr_code` usa Hilt **2.51.1**

Em projetos que compartilham lógica ou são compilados juntos, versões diferentes do Hilt podem gerar comportamentos distintos no processamento de anotações.

**O que fazer:**

Alinhar ambos para a mesma versão. Preferencialmente via `libs.versions.toml` (Version Catalog) compartilhado:

```toml
# gradle/libs.versions.toml
[versions]
hilt = "2.52"
```

---alinhe ambos

### 🔵 [D1] Revogação de cartão sem alcance remoto

**Severidade:** Design / Baixo imediato, Alto a longo prazo
**Componente:** Todo o sistema
**Arquivo:** `odin-admin/src/pages/QRHistory.tsx`, `odin-admin/src/services/storage.ts`

**Descrição:**
O fluxo atual de revogação funciona assim:

```
Odin Admin → marca QR como "revogado" no localStorage
```

Porém, uma vez que o funcionário escaneou o QR e o cartão foi registrado no `EncryptedSharedPreferences` do device, a revogação no Odin Admin **não tem efeito**. O funcionário continua podendo usar o app para gerar tokens NFC válidos.

**Cenário de risco:**
Funcionário demitido com app instalado → Odin Admin revoga o QR original → app continua funcionando → Heimdall valida normalmente → acesso concedido.

**O que fazer:**

**Passo 1 — Backend (necessário):**
O backend precisa manter uma lista de `employeeId` bloqueados (ou de `deviceId` revogados). Na validação do token, retornar `403` se o funcionário estiver na lista.

```
Resposta do backend ao Heimdall:
- 200 approved: true → acesso liberado
- 403 denialReason: EMPLOYEE_REVOKED → acesso negado, mostrar motivo
- 403 denialReason: DEVICE_REVOKED → acesso negado
```

**Passo 2 — Huginn Mobile:**
Implementar polling periódico ou push notification para invalidar cartões remotamente.

**Passo 3 — Odin Admin:**
A revogação de QR no painel deve chamar a API do backend para bloquear o `employeeId`, não apenas marcar no `localStorage`.

---me diga como implementar isso

### 🔵 [D2] Sem rate limiting local na validação do Heimdall

**Severidade:** Baixo
**Componente:** Heimdall NFC
**Arquivo:** `ValidateNewTokenUseCase.kt`

**Descrição:**
O pipeline de validação local não tem throttle. Um atacante com acesso físico ao leitor poderia tentar múltiplos tokens em sequência (ex: via loop de escrita NFC automatizada).

**O que fazer:**
Implementar cooldown local após N tentativas falhas consecutivas:

```kotlin
// Bloquear por 30s após 5 falhas consecutivas
if (consecutiveFailures >= 5) {
    delay(30_000)
    consecutiveFailures = 0
}
```

O backend também deve implementar rate limiting por `deviceId` do leitor.

---adicione

## Mapa de Superfície de Ataque

```
┌─────────────────────────────────────────────────────────┐
│                     ODIN ADMIN                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [C2] Sem autenticação — acesso irrestrito        │   │
│  │ [C1] Chave HMAC em localStorage (texto puro)    │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ QR assinado (JSON + HMAC)
┌───────────────────────▼─────────────────────────────────┐
│                   HUGINN MOBILE                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [A1] Chave HMAC compilada no APK (extraível)    │   │
│  │ [M2] Nonce de 24 bits (colisão possível)        │   │
│  │ [M3] Salt de device ID público                  │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ Token NFC
┌───────────────────────▼─────────────────────────────────┐
│                     HEIMDALL                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [A2] PIN padrão "123456"                        │   │
│  │ [A3] Tokens em plain text no logcat (DEBUG)     │   │
│  │ [M1] Certificate Pinning não implementado       │   │
│  │ [D2] Sem rate limiting local                    │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/HTTPS
┌───────────────────────▼─────────────────────────────────┐
│                     BACKEND                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [D1] Sem revogação remota de cartões            │   │
│  │ [D2] Rate limiting (responsabilidade do backend)│   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Prioridade de Correção

| # | ID | Descrição | Esforço | Componente |
|---|----|-----------|---------|------------|
| 1 | C2 | Adicionar autenticação no Odin Admin | Baixo (nginx Basic Auth) | Odin Admin |
| 2 | A1 | Quebrar build se chave não configurada | Baixo | Huginn + Heimdall |
| 3 | A2 | Forçar setup de PIN no primeiro boot | Médio | Heimdall |
| 4 | C1 | Não persistir chave HMAC no browser | Médio | Odin Admin |
| 5 | A3 | Reduzir nível de log (BODY → HEADERS) | Baixo | Heimdall |
| 6 | M1 | Implementar certificate pinning | Médio | Heimdall |
| 7 | M2 | Aumentar entropia do nonce para 48+ bits | Baixo | Huginn Mobile |
| 8 | M4 | Alinhar versão do Hilt entre projetos | Baixo | Huginn QR |
| 9 | D1 | Implementar revogação remota via backend | Alto | Todo o sistema |
| 10 | M3 | Salt de device ID por device (Keystore) | Médio | Huginn Mobile |
| 11 | D2 | Rate limiting local no Heimdall | Médio | Heimdall |
