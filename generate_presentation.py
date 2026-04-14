"""
Gerador da apresentação Samsung-style do Ecossistema Odin
"""
from docx import Document
from docx.shared import Pt, RGBColor, Inches, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

# ─── Paleta Samsung-inspired ────────────────────────────────────────────────
NAVY       = RGBColor(0x00, 0x21, 0x4D)   # azul marinho profundo
BLUE       = RGBColor(0x03, 0x6A, 0xC7)   # azul Samsung
LIGHT_BLUE = RGBColor(0xE8, 0xF3, 0xFF)   # fundo suave
CYAN       = RGBColor(0x00, 0xB8, 0xD4)   # destaque ciano
WHITE      = RGBColor(0xFF, 0xFF, 0xFF)
DARK_GRAY  = RGBColor(0x1A, 0x1A, 0x2E)
MID_GRAY   = RGBColor(0x44, 0x44, 0x55)
SILVER     = RGBColor(0xF0, 0xF4, 0xF8)
GREEN      = RGBColor(0x00, 0xC2, 0x7A)
ORANGE     = RGBColor(0xFF, 0x6B, 0x00)

doc = Document()

# ─── Configuração de página (A4 landscape) ──────────────────────────────────
section = doc.sections[0]
section.page_width  = Inches(11.69)
section.page_height = Inches(8.27)
section.left_margin   = Inches(0.6)
section.right_margin  = Inches(0.6)
section.top_margin    = Inches(0.5)
section.bottom_margin = Inches(0.5)

# ─── Helpers ────────────────────────────────────────────────────────────────
def set_cell_bg(cell, hex_color: str):
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd  = OxmlElement('w:shd')
    shd.set(qn('w:val'),   'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'),  hex_color)
    tcPr.append(shd)

def set_cell_border(cell, top=None, bottom=None, left=None, right=None):
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for side, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        if val:
            el = OxmlElement(f'w:{side}')
            el.set(qn('w:val'),   val.get('val', 'single'))
            el.set(qn('w:sz'),    val.get('sz', '4'))
            el.set(qn('w:space'), '0')
            el.set(qn('w:color'), val.get('color', 'auto'))
            tcBorders.append(el)
    tcPr.append(tcBorders)

def para(text, size=11, bold=False, color=None, align=WD_ALIGN_PARAGRAPH.LEFT,
         space_before=0, space_after=6, italic=False):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after  = Pt(space_after)
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    if color:
        run.font.color.rgb = color
    return p

def add_page_break():
    doc.add_page_break()

def section_bar(title: str, subtitle: str = ""):
    """Barra de seção com gradiente azul Samsung"""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_bg(cell, '00214D')
    cell.width = Inches(10.49)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after  = Pt(8)
    r1 = p.add_run(title)
    r1.font.size  = Pt(22)
    r1.font.bold  = True
    r1.font.color.rgb = WHITE
    if subtitle:
        p.add_run("  ")
        r2 = p.add_run(subtitle)
        r2.font.size  = Pt(13)
        r2.font.bold  = False
        r2.font.color.rgb = RGBColor(0xAA, 0xCC, 0xFF)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def kv_table(rows_data, col_widths=(2.0, 8.49)):
    """Tabela key-value com zebra stripe"""
    tbl = doc.add_table(rows=len(rows_data), cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, (k, v) in enumerate(rows_data):
        bg = 'F0F4F8' if i % 2 == 0 else 'FFFFFF'
        c0 = tbl.cell(i, 0)
        c1 = tbl.cell(i, 1)
        set_cell_bg(c0, '002D62')
        set_cell_bg(c1, bg)
        c0.width = Inches(col_widths[0])
        c1.width = Inches(col_widths[1])
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(4)
        p0.paragraph_format.space_after  = Pt(4)
        r0 = p0.add_run(k)
        r0.font.size  = Pt(10)
        r0.font.bold  = True
        r0.font.color.rgb = WHITE
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(4)
        p1.paragraph_format.space_after  = Pt(4)
        r1 = p1.add_run(v)
        r1.font.size  = Pt(10)
        r1.font.color.rgb = DARK_GRAY
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def flow_box(items, colors=None):
    """Caixas de fluxo horizontais"""
    n = len(items)
    tbl = doc.add_table(rows=1, cols=n * 2 - 1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_w = Inches(1.5)
    arrow_w = Inches(0.3)
    bg_list = colors or ['036AC7'] * n
    for i, item in enumerate(items):
        ci = i * 2
        cell = tbl.cell(0, ci)
        set_cell_bg(cell, bg_list[i % len(bg_list)])
        cell.width = col_w
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after  = Pt(6)
        r = p.add_run(item)
        r.font.size  = Pt(9)
        r.font.bold  = True
        r.font.color.rgb = WHITE
        if i < n - 1:
            arr = tbl.cell(0, ci + 1)
            set_cell_bg(arr, 'FFFFFF')
            arr.width = arrow_w
            ap = arr.paragraphs[0]
            ap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            ap.paragraph_format.space_before = Pt(6)
            ap.paragraph_format.space_after  = Pt(6)
            ar = ap.add_run('→')
            ar.font.size  = Pt(14)
            ar.font.bold  = True
            ar.font.color.rgb = BLUE
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def tech_badge_row(badges):
    """Linha de badges técnicos"""
    tbl = doc.add_table(rows=1, cols=len(badges))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    bgs = ['036AC7', '002D62', '00214D', '036AC7', '002D62', '00214D']
    for i, badge in enumerate(badges):
        cell = tbl.cell(0, i)
        set_cell_bg(cell, bgs[i % len(bgs)])
        cell.width = Inches(10.49 / len(badges))
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(5)
        p.paragraph_format.space_after  = Pt(5)
        r = p.add_run(badge)
        r.font.size  = Pt(9)
        r.font.bold  = True
        r.font.color.rgb = WHITE
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def highlight_box(text, bg='E8F3FF', border_color='036AC7'):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_bg(cell, bg)
    set_cell_border(cell,
        top={'color': border_color, 'sz': '6'},
        bottom={'color': border_color, 'sz': '6'},
        left={'color': border_color, 'sz': '12'},
        right={'color': border_color, 'sz': '6'})
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after  = Pt(6)
    r = p.add_run(text)
    r.font.size = Pt(10)
    r.font.color.rgb = DARK_GRAY
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 1 — CAPA
# ════════════════════════════════════════════════════════════════════════════
tbl = doc.add_table(rows=1, cols=1)
cell = tbl.cell(0, 0)
set_cell_bg(cell, '00214D')
cell.width = Inches(10.49)
p = cell.paragraphs[0]
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(30)
p.paragraph_format.space_after  = Pt(6)

r1 = p.add_run("ECOSSISTEMA ODIN")
r1.font.size  = Pt(42)
r1.font.bold  = True
r1.font.color.rgb = WHITE
r1.font.name = 'Segoe UI'

p2 = cell.add_paragraph()
p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
r2 = p2.add_run("Sistema Corporativo de Controle de Acesso Digital")
r2.font.size  = Pt(18)
r2.font.color.rgb = RGBColor(0xAA, 0xCC, 0xFF)

p3 = cell.add_paragraph()
p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
r3 = p3.add_run("─" * 60)
r3.font.color.rgb = RGBColor(0x03, 0x6A, 0xC7)

p4 = cell.add_paragraph()
p4.alignment = WD_ALIGN_PARAGRAPH.CENTER
p4.paragraph_format.space_after = Pt(10)
r4 = p4.add_run("Odin Admin  ·  Huginn Mobile  ·  Heimdall NFC  ·  Heimdall Backend")
r4.font.size  = Pt(13)
r4.font.color.rgb = RGBColor(0x66, 0xAA, 0xFF)

p5 = cell.add_paragraph()
p5.alignment = WD_ALIGN_PARAGRAPH.CENTER
p5.paragraph_format.space_after = Pt(30)
r5 = p5.add_run("Versão 1.0  ·  Abril 2026")
r5.font.size  = Pt(11)
r5.font.color.rgb = RGBColor(0x88, 0x99, 0xAA)

add_page_break()

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 2 — VISÃO GERAL DO ECOSSISTEMA
# ════════════════════════════════════════════════════════════════════════════
section_bar("VISÃO GERAL", "O que é o Ecossistema Odin?")

para("O Ecossistema Odin é uma plataforma corporativa completa de controle de acesso baseada em credenciais digitais "
     "com criptografia HMAC-SHA256. Composto por 5 aplicações independentes que trabalham em conjunto, "
     "implementa um fluxo ponta a ponta de emissão, armazenamento e validação de tokens de acesso.",
     size=11, color=DARK_GRAY, space_after=10)

flow_box(
    ["ODIN ADMIN\n(Emissão)", "HUGINN\nMOBILE NFC", "HUGINN\nMOBILE QR", "HEIMDALL\nNFC/QR", "HEIMDALL\nBACKEND"],
    colors=['00214D', '036AC7', '036AC7', '002D62', '00214D']
)

kv_table([
    ("Missão",       "Emitir, armazenar e validar credenciais digitais corporativas com segurança criptográfica"),
    ("Criptografia", "HMAC-SHA256 com Web Crypto API / Android Crypto — chave compartilhada entre os 5 componentes"),
    ("Protocolos",   "QR Code (registro) → NFC/HCE ou QR Dinâmico (acesso) → REST API (validação backend)"),
    ("Escala",       "Projetado para empresas com múltiplos sistemas de acesso, áreas e pontos de controle"),
    ("Status",       "MVP completo — todos os 5 componentes funcionais e integrados"),
])

add_page_break()

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 3 — FLUXO COMPLETO
# ════════════════════════════════════════════════════════════════════════════
section_bar("FLUXO COMPLETO DO SISTEMA", "Do cadastro à liberação de acesso")

# Grid 3 colunas com as 3 fases
tbl = doc.add_table(rows=1, cols=3)
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER

phases = [
    ("01  EMISSÃO", "00214D", [
        "Admin acessa Odin Admin (web)",
        "Seleciona funcionário + sistema de acesso",
        "Define validade da credencial (minutos)",
        "Sistema gera payload JSON com HMAC-SHA256",
        "QR Code de registro é exibido na tela",
        "Funcionário escaneia com Huginn Mobile",
    ]),
    ("02  ARMAZENAMENTO", "036AC7", [
        "Huginn Mobile recebe o QR de registro",
        "Valida assinatura HMAC do payload",
        "Verifica expiração e nonce único",
        "Salva credencial cifrada no dispositivo",
        "Exibe card digital com dados do acesso",
        "Pronto para uso via NFC ou QR Dinâmico",
    ]),
    ("03  VALIDAÇÃO", "002D62", [
        "Funcionário aproxima celular do tablet",
        "Huginn emite token dinâmico (NFC/HCE ou QR)",
        "Heimdall NFC lê o token em tempo real",
        "Heimdall envia ao Backend para validação",
        "Backend verifica HMAC, nonce e whitelist",
        "Resultado: VERDE (acesso) ou VERMELHO (negado)",
    ]),
]

for i, (title, bg, items) in enumerate(phases):
    cell = tbl.cell(0, i)
    set_cell_bg(cell, bg)
    cell.width = Inches(3.49)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after  = Pt(4)
    r = p.add_run(title)
    r.font.size  = Pt(14)
    r.font.bold  = True
    r.font.color.rgb = WHITE

    for item in items:
        pi = cell.add_paragraph()
        pi.paragraph_format.space_before = Pt(2)
        pi.paragraph_format.space_after  = Pt(2)
        ri = pi.add_run(f"  ▸  {item}")
        ri.font.size  = Pt(9)
        ri.font.color.rgb = RGBColor(0xDD, 0xEE, 0xFF)

    cell.add_paragraph().paragraph_format.space_after = Pt(8)

doc.add_paragraph().paragraph_format.space_after = Pt(6)

highlight_box(
    "🔐  CHAVE HMAC COMPARTILHADA  —  A mesma chave HUGINN_QR_HMAC_KEY deve estar configurada "
    "no Odin Admin, Huginn Mobile e Heimdall Backend. Qualquer divergência de chave invalida todas as credenciais.",
    bg='FFF3CD', border_color='FF6B00'
)

add_page_break()

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 4 — ODIN ADMIN
# ════════════════════════════════════════════════════════════════════════════
section_bar("ODIN ADMIN", "Painel Web de Emissão de Credenciais")

tbl = doc.add_table(rows=1, cols=2)
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER

# Coluna esquerda — descrição
cl = tbl.cell(0, 0)
set_cell_bg(cl, 'F0F4F8')
cl.width = Inches(5.0)
pl = cl.paragraphs[0]
pl.paragraph_format.space_before = Pt(8)
r = pl.add_run("Propósito")
r.font.size = Pt(12); r.font.bold = True; r.font.color.rgb = NAVY

items_left = [
    ("Cadastro de Funcionários", "CRUD completo com ID, nome, área e cargo"),
    ("Cadastro de Sistemas",     "Cada ponto de acesso com cor e identificador únicos"),
    ("Geração de QR de Registro","Payload JSON + HMAC assinado, com validade configurável"),
    ("Histórico de QRs",         "Lista todos os QRs gerados com status ativo/expirado"),
    ("Revogação Individual",     "Invalidar QRs específicos sem afetar outros"),
    ("Backup / Export",          "Exportar dados do localStorage para arquivo JSON"),
    ("Configurações HMAC",       "Gerenciar a chave secreta de assinatura"),
]
for title, desc in items_left:
    p2 = cl.add_paragraph()
    p2.paragraph_format.space_before = Pt(4)
    r2 = p2.add_run(f"● {title}: ")
    r2.font.size = Pt(10); r2.font.bold = True; r2.font.color.rgb = BLUE
    r3 = p2.add_run(desc)
    r3.font.size = Pt(10); r3.font.color.rgb = DARK_GRAY
cl.add_paragraph().paragraph_format.space_after = Pt(8)

# Coluna direita — stack técnico
cr = tbl.cell(0, 1)
set_cell_bg(cr, '00214D')
cr.width = Inches(5.49)
pr = cr.paragraphs[0]
pr.alignment = WD_ALIGN_PARAGRAPH.CENTER
pr.paragraph_format.space_before = Pt(8)
rr = pr.add_run("STACK TÉCNICO")
rr.font.size = Pt(12); rr.font.bold = True; rr.font.color.rgb = WHITE

stack_items = [
    ("Frontend",    "React 18.3 + TypeScript + Vite 5.4"),
    ("UI",          "Tailwind CSS + shadcn/ui (Badge, Button, Modal…)"),
    ("Roteamento",  "React Router v6 com catch-all"),
    ("Persistência","localStorage exclusivamente — zero backend"),
    ("Criptografia","Web Crypto API (subtle.sign) — HMAC nativo"),
    ("QR Code",     "qrcode.react — geração no browser"),
    ("Testes",      "Vitest + React Testing Library (P2)"),
    ("Build",       "tsc + vite build → assets estáticos"),
]
for k, v in stack_items:
    ps = cr.add_paragraph()
    ps.alignment = WD_ALIGN_PARAGRAPH.LEFT
    ps.paragraph_format.space_before = Pt(3)
    rs1 = ps.add_run(f"  {k}: ")
    rs1.font.size = Pt(10); rs1.font.bold = True; rs1.font.color.rgb = RGBColor(0x66, 0xCC, 0xFF)
    rs2 = ps.add_run(v)
    rs2.font.size = Pt(10); rs2.font.color.rgb = RGBColor(0xDD, 0xEE, 0xFF)
cr.add_paragraph().paragraph_format.space_after = Pt(8)

doc.add_paragraph().paragraph_format.space_after = Pt(6)

highlight_box(
    'Formato do QR de Registro:  {"version":1, "mode":"REG", "issued_at":…, "expires_at":…, '
    '"nonce":"<uuid>", "employee":{…}, "card":{…}, "signature":"<hmac-base64url>"}  '
    '—  Assinatura HMAC-SHA256 Base64url sem padding (compatível com Android Base64.NO_PADDING)',
    bg='E8F3FF', border_color='036AC7'
)

add_page_break()

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 5 — HUGINN MOBILE
# ════════════════════════════════════════════════════════════════════════════
section_bar("HUGINN MOBILE", "App Android — Armazenamento de Credenciais")

tbl = doc.add_table(rows=1, cols=2)
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER

variants = [
    ("HUGINN MOBILE NFC", "036AC7", [
        ("Tecnologia de acesso", "NFC / Host Card Emulation (HCE)"),
        ("Como funciona",       "Emula cartão NFC via HuginnHCEService"),
        ("Token emitido",       "HMAC dinâmico a cada leitura (timestamp + nonce)"),
        ("Armazenamento",       "EncryptedSharedPreferences (Android Keystore)"),
        ("Biometria",           "Desbloqueio obrigatório via BiometricPrompt"),
        ("Uso",                 "Funcionário aproxima o celular do tablet Heimdall"),
        ("Gerador de token",    "NfcTokenGenerator.kt — HMAC com Math.random (MVP)"),
        ("Tela principal",      "Card digital com nome, área e sistema de acesso"),
    ]),
    ("HUGINN MOBILE QR", "002D62", [
        ("Tecnologia de acesso", "QR Code Dinâmico (câmera do Heimdall)"),
        ("Como funciona",       "Gera QR animado com token efêmero a cada segundo"),
        ("Token emitido",       "HMAC dinâmico via QrTokenGenerator.kt"),
        ("Armazenamento",       "EncryptedSharedPreferences (Android Keystore)"),
        ("Biometria",           "Desbloqueio obrigatório via BiometricPrompt"),
        ("Uso",                 "Funcionário exibe a tela QR para a câmera do Heimdall"),
        ("Gerador de token",    "QrTokenGenerator.kt — kotlin.random.Random"),
        ("Componente visual",   "QrCodeComposable.kt — ZXing + Jetpack Compose"),
    ]),
]

for i, (title, bg, items) in enumerate(variants):
    cell = tbl.cell(0, i)
    set_cell_bg(cell, bg)
    cell.width = Inches(5.24)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    r = p.add_run(title)
    r.font.size = Pt(13); r.font.bold = True; r.font.color.rgb = WHITE

    for k, v in items:
        pi = cell.add_paragraph()
        pi.paragraph_format.space_before = Pt(3)
        ri1 = pi.add_run(f"  {k}: ")
        ri1.font.size = Pt(10); ri1.font.bold = True; ri1.font.color.rgb = RGBColor(0x99, 0xDD, 0xFF)
        ri2 = pi.add_run(v)
        ri2.font.size = Pt(10); ri2.font.color.rgb = RGBColor(0xDD, 0xEE, 0xFF)
    cell.add_paragraph().paragraph_format.space_after = Pt(8)

doc.add_paragraph().paragraph_format.space_after = Pt(6)

tech_badge_row(["Kotlin 2.x", "Jetpack Compose", "Android API 28+", "EncryptedSharedPreferences",
                "BiometricPrompt", "HCE / ZXing", "Hilt DI", "HMAC-SHA256"])

highlight_box(
    "Onboarding: Na primeira instalação, o funcionário escaneia o QR de registro gerado pelo Odin Admin. "
    "O app valida a assinatura HMAC, verifica a expiração e o nonce único, e persiste a credencial cifrada "
    "no Android Keystore. A biometria é exigida a cada uso para desbloquear o token de acesso.",
    bg='E8F3FF', border_color='036AC7'
)

add_page_break()

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 6 — HEIMDALL NFC
# ════════════════════════════════════════════════════════════════════════════
section_bar("HEIMDALL NFC", "App Android — Leitor de Validação em Portaria")

tbl = doc.add_table(rows=1, cols=2)
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER

cl = tbl.cell(0, 0)
set_cell_bg(cl, 'F0F4F8')
cl.width = Inches(5.0)
pl = cl.paragraphs[0]
pl.paragraph_format.space_before = Pt(8)
r = pl.add_run("Funcionalidades")
r.font.size = Pt(12); r.font.bold = True; r.font.color.rgb = NAVY

funcs = [
    ("Leitura NFC",          "Detecta e lê token HCE do Huginn Mobile automaticamente"),
    ("Leitura QR",           "Preview contínuo via câmera, decode instantâneo"),
    ("Resultado Visual",     "Tela VERDE (acesso liberado) ou VERMELHA (negado) por 3 s"),
    ("Foto do funcionário",  "Exibe foto do colaborador recebida do Backend"),
    ("Setup inicial",        "Selecionar canal (NFC/QR), systemId e PIN de manutenção"),
    ("Modo manutenção",      "5 toques no logo → PIN → logs, alterar canal, ver deviceId"),
    ("Log local",            "Últimos 30 acessos armazenados no dispositivo"),
    ("Sincronização",        "Eventos enviados ao Backend via /api/v1/audit-sync"),
    ("Testes",               "107 testes unitários passando (5 sprints de desenvolvimento)"),
]
for title, desc in funcs:
    p2 = cl.add_paragraph()
    p2.paragraph_format.space_before = Pt(3)
    r2 = p2.add_run(f"● {title}: ")
    r2.font.size = Pt(10); r2.font.bold = True; r2.font.color.rgb = BLUE
    r3 = p2.add_run(desc)
    r3.font.size = Pt(10); r3.font.color.rgb = DARK_GRAY
cl.add_paragraph().paragraph_format.space_after = Pt(8)

cr = tbl.cell(0, 1)
set_cell_bg(cr, '00214D')
cr.width = Inches(5.49)
pr = cr.paragraphs[0]
pr.alignment = WD_ALIGN_PARAGRAPH.CENTER
pr.paragraph_format.space_before = Pt(8)
rr = pr.add_run("ARQUITETURA INTERNA")
rr.font.size = Pt(12); rr.font.bold = True; rr.font.color.rgb = WHITE

arch = [
    ("Plataforma",      "Android API 28+ · Kotlin 2.0.21 · AGP 8.7.2"),
    ("UI",              "Jetpack Compose + Material 3"),
    ("Injeção de deps", "Hilt (Dagger)"),
    ("Networking",      "Retrofit + OkHttp (certificado pinning)"),
    ("NFC",             "Android NFC API — IsoDep/HCE reader"),
    ("QR",              "ZXing via CameraX preview stream"),
    ("CI/CD",           "GitHub Actions — test + build em todo push"),
    ("Segurança",       "Certificate pinning, PIN de manutenção, sem dados sensíveis em log"),
]
for k, v in arch:
    ps = cr.add_paragraph()
    ps.paragraph_format.space_before = Pt(3)
    rs1 = ps.add_run(f"  {k}: ")
    rs1.font.size = Pt(10); rs1.font.bold = True; rs1.font.color.rgb = RGBColor(0x66, 0xCC, 0xFF)
    rs2 = ps.add_run(v)
    rs2.font.size = Pt(10); rs2.font.color.rgb = RGBColor(0xDD, 0xEE, 0xFF)
cr.add_paragraph().paragraph_format.space_after = Pt(8)

doc.add_paragraph().paragraph_format.space_after = Pt(6)

highlight_box(
    "Deploy: O Heimdall NFC é instalado em tablets dedicados fixos nos pontos de entrada. "
    "Funciona 24/7 com a tela de leitura sempre ativa. Dispositivos são registrados no Backend via "
    "/api/v1/devices (whitelist), garantindo que apenas equipamentos autorizados possam validar acessos.",
    bg='E8F3FF', border_color='036AC7'
)

add_page_break()

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 7 — HEIMDALL BACKEND
# ════════════════════════════════════════════════════════════════════════════
section_bar("HEIMDALL BACKEND", "API REST — Autorização, Whitelist e Auditoria")

tbl = doc.add_table(rows=1, cols=2)
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER

# Endpoints
cl = tbl.cell(0, 0)
set_cell_bg(cl, 'F0F4F8')
cl.width = Inches(5.0)
pl = cl.paragraphs[0]
pl.paragraph_format.space_before = Pt(8)
r = pl.add_run("13 Endpoints REST  ( /api/v1/ )")
r.font.size = Pt(12); r.font.bold = True; r.font.color.rgb = NAVY

endpoints = [
    ("POST /validate",            "Validação NFC/QR — resposta com foto e nome"),
    ("POST /legacy-validate",     "Validação legada via tablet de segurança"),
    ("POST /audit-sync",          "Sync de eventos do Heimdall → backend"),
    ("GET  /audit-log",           "Listagem para painel de auditoria"),
    ("GET  /devices",             "Listar dispositivos na whitelist"),
    ("POST /devices",             "Registrar novo dispositivo Huginn"),
    ("DELETE /devices/{id}",      "Revogar dispositivo"),
    ("GET  /systems",             "Listar sistemas de acesso"),
    ("POST /systems",             "Cadastrar sistema"),
    ("PUT  /systems/{id}",        "Editar sistema"),
    ("DELETE /systems/{id}",      "Remover sistema"),
    ("POST /employees/{b}/revoke","Bloquear funcionário manualmente"),
    ("DELETE /employees/{b}/revoke","Desbloquear funcionário"),
]
for ep, desc in endpoints:
    p2 = cl.add_paragraph()
    p2.paragraph_format.space_before = Pt(2)
    r2 = p2.add_run(f"  {ep}")
    r2.font.size = Pt(9); r2.font.bold = True; r2.font.color.rgb = BLUE
    r2b = p2.add_run(f" — {desc}")
    r2b.font.size = Pt(9); r2b.font.color.rgb = DARK_GRAY
cl.add_paragraph().paragraph_format.space_after = Pt(8)

# Arquitetura DDD
cr = tbl.cell(0, 1)
set_cell_bg(cr, '00214D')
cr.width = Inches(5.49)
pr = cr.paragraphs[0]
pr.alignment = WD_ALIGN_PARAGRAPH.CENTER
pr.paragraph_format.space_before = Pt(8)
rr = pr.add_run("ARQUITETURA DDD — 4 BOUNDED CONTEXTS")
rr.font.size = Pt(11); rr.font.bold = True; rr.font.color.rgb = WHITE

contexts = [
    ("AccessControl",  "Domínio central — ValidateExitUseCase, DTOs, ports"),
    ("Identity",       "Anti-corruption layer — Employee, BadgeCode, CategoryParser"),
    ("Credential",     "HMAC validator, Device whitelist, Nonce anti-replay"),
    ("AuditLog",       "AccessEvent, sync e listagem de eventos de auditoria"),
]
for ctx, desc in contexts:
    pc = cr.add_paragraph()
    pc.paragraph_format.space_before = Pt(5)
    rc1 = pc.add_run(f"  ◆ {ctx}")
    rc1.font.size = Pt(11); rc1.font.bold = True; rc1.font.color.rgb = RGBColor(0x66, 0xCC, 0xFF)
    rc2 = pc.add_run(f"\n    {desc}")
    rc2.font.size = Pt(9); rc2.font.color.rgb = RGBColor(0xBB, 0xDD, 0xFF)

cr.add_paragraph().paragraph_format.space_before = Pt(8)
pr2 = cr.add_paragraph()
pr2.alignment = WD_ALIGN_PARAGRAPH.CENTER
rr2 = pr2.add_run("STACK")
rr2.font.size = Pt(11); rr2.font.bold = True; rr2.font.color.rgb = WHITE

stack_be = [
    ("Runtime",    "PHP 8.3 + Laravel 11"),
    ("DB Prod",    "SQL Server (schema access_control)"),
    ("DB Dev",     "SQLite (migrations idênticas)"),
    ("Padrão",     "DDD + Ports & Adapters (Hexagonal)"),
    ("Segurança",  "HMAC-SHA256, Nonce anti-replay, Bearer token"),
    ("Tabelas",    "access_devices, nonce_log, access_events, access_systems, employee_override"),
]
for k, v in stack_be:
    ps = cr.add_paragraph()
    ps.paragraph_format.space_before = Pt(2)
    rs1 = ps.add_run(f"  {k}: ")
    rs1.font.size = Pt(9); rs1.font.bold = True; rs1.font.color.rgb = RGBColor(0x66, 0xCC, 0xFF)
    rs2 = ps.add_run(v)
    rs2.font.size = Pt(9); rs2.font.color.rgb = RGBColor(0xDD, 0xEE, 0xFF)
cr.add_paragraph().paragraph_format.space_after = Pt(8)

doc.add_paragraph().paragraph_format.space_after = Pt(4)
tech_badge_row(["PHP 8.3", "Laravel 11", "SQL Server / SQLite", "DDD Hexagonal",
                "HMAC-SHA256", "Anti-Replay Nonce", "REST 13 endpoints", "Audit Log"])

add_page_break()

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 8 — SEGURANÇA
# ════════════════════════════════════════════════════════════════════════════
section_bar("SEGURANÇA DO SISTEMA", "Camadas de proteção em todos os componentes")

tbl = doc.add_table(rows=2, cols=3)
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER

security_cards = [
    ("ASSINATURA HMAC", "00214D", [
        "Algoritmo HMAC-SHA256",
        "Chave compartilhada entre Odin, Huginn e Heimdall",
        "Assinatura Base64url sem padding",
        "Cobre: version|mode|issued_at|expires_at|nonce|employee.id|name|system",
        "Qualquer adulteração invalida a assinatura",
    ]),
    ("ANTI-REPLAY", "036AC7", [
        "Cada QR carrega um UUID v4 único (nonce)",
        "Backend registra todos os nonces usados",
        "Segundo uso do mesmo nonce → negado",
        "Expiração temporal com issued_at + expires_at",
        "Tokens dinâmicos NFC/QR mudam a cada segundo",
    ]),
    ("DEVICE WHITELIST", "002D62", [
        "Apenas dispositivos Heimdall registrados aceitam acessos",
        "Huginn Mobile identificado por deviceId único",
        "Revogação imediata via /api/v1/devices/{id}",
        "Certificate pinning no app Android (Heimdall)",
        "Sem acesso a endpoints de gestão sem autenticação",
    ]),
    ("KEYSTORE ANDROID", "001A3E", [
        "Credenciais Huginn cifradas com EncryptedSharedPreferences",
        "Chaves protegidas pelo Android Keystore (TEE/StrongBox)",
        "Desbloqueio obrigatório via BiometricPrompt",
        "Sem credencial em texto claro em nenhum log",
        "Limpeza automática em caso de root detectado",
    ]),
    ("VALIDAÇÃO DE ENTRADA", "014A8F", [
        "validityMinutes: inteiro ≥ 1 (sem frações)",
        "Cor do sistema: regex /^#[0-9A-Fa-f]{6}$/",
        "QR expirado: negado automaticamente (expires_at)",
        "Funcionário revogado: employee_override table",
        "Catch-all no router: sem telas em branco",
    ]),
    ("AUDITORIA COMPLETA", "012060", [
        "Todos os eventos de acesso registrados no backend",
        "Sync periódico do Heimdall → /api/v1/audit-sync",
        "Painel de auditoria via /api/v1/audit-log",
        "Log local dos últimos 30 acessos no Heimdall",
        "Rastreabilidade completa por funcionário e sistema",
    ]),
]

for idx, (title, bg, items) in enumerate(security_cards):
    row = idx // 3
    col = idx % 3
    cell = tbl.cell(row, col)
    set_cell_bg(cell, bg)
    cell.width = Inches(3.49)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    r = p.add_run(title)
    r.font.size = Pt(11); r.font.bold = True; r.font.color.rgb = WHITE

    for item in items:
        pi = cell.add_paragraph()
        pi.paragraph_format.space_before = Pt(2)
        ri = pi.add_run(f"  ✓  {item}")
        ri.font.size = Pt(9); ri.font.color.rgb = RGBColor(0xCC, 0xEE, 0xFF)
    cell.add_paragraph().paragraph_format.space_after = Pt(6)

add_page_break()

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 9 — MAPA DE INTEGRAÇÃO / ARQUITETURA
# ════════════════════════════════════════════════════════════════════════════
section_bar("ARQUITETURA DE INTEGRAÇÃO", "Como os 5 componentes se comunicam")

para("Diagrama de comunicação entre componentes:", size=11, bold=True, color=NAVY, space_after=6)

# Diagrama textual em tabela
rows = [
    ["ADMIN (Browser)", "──── QR de Registro (JSON+HMAC) ────►", "HUGINN MOBILE (Android)"],
    ["",                "",                                        "│  Valida HMAC + Salva credential"],
    ["",                "",                                        "│  (Android Keystore)"],
    ["",                "",                                        "▼"],
    ["HEIMDALL BACKEND", "◄─── REST POST /validate ──────────", "HEIMDALL NFC (Android tablet)"],
    ["(Laravel + SQL)", "",                                        "Lê token NFC/QR, envia ao backend"],
    ["Verifica HMAC,",  "",                                        ""],
    ["nonce, whitelist","─── Resposta: ALLOW/DENY + foto ───►", "Exibe VERDE ou VERMELHO (3s)"],
    ["Registra evento", "",                                        "Sync /api/v1/audit-sync ──► Backend"],
]

diag = doc.add_table(rows=len(rows), cols=3)
diag.alignment = WD_TABLE_ALIGNMENT.CENTER
col_widths_diag = [Inches(2.8), Inches(4.5), Inches(3.0)]
bgs_d = ['E8F3FF', 'FFFFFF', 'E8F3FF']
for ri, row in enumerate(rows):
    for ci, text in enumerate(row):
        cell = diag.cell(ri, ci)
        bg = bgs_d[ci] if text else 'FFFFFF'
        set_cell_bg(cell, bg.replace('#', ''))
        cell.width = col_widths_diag[ci]
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after  = Pt(1)
        r = p.add_run(text)
        r.font.size = Pt(9)
        if ci == 1:
            r.font.color.rgb = BLUE
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif ci == 0:
            r.font.color.rgb = NAVY
            r.font.bold = bool(text and ri in [0, 4])
        else:
            r.font.color.rgb = DARK_GRAY

doc.add_paragraph().paragraph_format.space_after = Pt(8)

kv_table([
    ("Protocolo Admin→Huginn",    "QR Code visual escaneado pelo app mobile (sem rede necessária)"),
    ("Protocolo Huginn→Heimdall", "NFC/HCE (contato físico) ou QR Code dinâmico (câmera)"),
    ("Protocolo Heimdall→Backend","HTTPS REST JSON — POST /api/v1/validate com token + deviceId"),
    ("Protocolo Heimdall→Backend","POST /api/v1/audit-sync — sync assíncrono de eventos"),
    ("Chave compartilhada",       "HUGINN_QR_HMAC_KEY (registro) + TOKEN_HMAC_KEY (acesso dinâmico)"),
    ("Sem rede na emissão",       "Odin Admin funciona 100% offline — localStorage + Web Crypto"),
], col_widths=(2.5, 8.0))

add_page_break()

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 10 — ROADMAP E STATUS
# ════════════════════════════════════════════════════════════════════════════
section_bar("ROADMAP & STATUS ATUAL", "Evolução planejada do ecossistema")

tbl = doc.add_table(rows=1, cols=3)
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER

phases_road = [
    ("CONCLUÍDO  ✓", "00214D", [
        ("Odin Admin P1",    "Revogação individual de QRs + backup localStorage"),
        ("Odin Admin P2",    "Vitest + React Testing Library + paginação QRHistory"),
        ("Odin Admin P3",    "Infraestrutura de abstração de backend (em curso)"),
        ("Huginn NFC",       "App completo com HCE, Biometria, Keystore"),
        ("Huginn QR Code",   "App completo com QR dinâmico, Biometria"),
        ("Heimdall NFC",     "107 testes, 5 sprints, CI/CD GitHub Actions"),
        ("Heimdall Backend", "13 endpoints, DDD, migrações, whitelist, auditoria"),
    ]),
    ("PRÓXIMOS PASSOS", "036AC7", [
        ("Odin Admin P4",    "Integração real com Heimdall Backend via REST"),
        ("Odin Admin P5",    "Dashboard de auditoria com dados do backend"),
        ("Huginn Unificado", "Merge NFC + QR em um único app com feature flag"),
        ("Backend Auth",     "Bearer token / API key nos endpoints de gestão"),
        ("Nonce Scheduler",  "Limpeza automática de nonces expirados (Laravel)"),
        ("HTTPS Prod",       "Nginx + certificado real + certificate pinning"),
        ("Testes Backend",   "TokenValidatorTest, BadgeCodeTest, UseCaseTest"),
    ]),
    ("VISÃO FUTURA", "002D62", [
        ("Multi-tenant",     "Suporte a múltiplas empresas na mesma instância"),
        ("Push Revocation",  "Revogação em tempo real via WebSocket/FCM"),
        ("Dashboard Web",    "Painel de auditoria em tempo real no Odin Admin"),
        ("Biometria Server", "Matching de biometria no servidor para auditoria"),
        ("App de Relatórios","Relatórios de acesso por funcionário, sistema, período"),
        ("SSO Integration",  "Login corporativo via SAML/OAuth2 no Odin Admin"),
        ("Offline Heimdall", "Cache local no Heimdall para operar sem rede"),
    ]),
]

for i, (title, bg, items) in enumerate(phases_road):
    cell = tbl.cell(0, i)
    set_cell_bg(cell, bg)
    cell.width = Inches(3.49)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    r = p.add_run(title)
    r.font.size = Pt(12); r.font.bold = True; r.font.color.rgb = WHITE

    for k, v in items:
        pi = cell.add_paragraph()
        pi.paragraph_format.space_before = Pt(3)
        ri1 = pi.add_run(f"  {k}: ")
        ri1.font.size = Pt(10); ri1.font.bold = True
        ri1.font.color.rgb = RGBColor(0x99, 0xDD, 0xFF) if bg != '00214D' else RGBColor(0x66, 0xCC, 0xFF)
        ri2 = pi.add_run(v)
        ri2.font.size = Pt(10); ri2.font.color.rgb = RGBColor(0xDD, 0xEE, 0xFF)
    cell.add_paragraph().paragraph_format.space_after = Pt(8)

doc.add_paragraph().paragraph_format.space_after = Pt(6)

# ─── Rodapé final ───────────────────────────────────────────────────────────
tbl_footer = doc.add_table(rows=1, cols=1)
cell_f = tbl_footer.cell(0, 0)
set_cell_bg(cell_f, '00214D')
cell_f.width = Inches(10.49)
pf = cell_f.paragraphs[0]
pf.alignment = WD_ALIGN_PARAGRAPH.CENTER
pf.paragraph_format.space_before = Pt(8)
pf.paragraph_format.space_after  = Pt(8)
rf = pf.add_run("ECOSSISTEMA ODIN  ·  Confidencial  ·  Abril 2026  ·  GiovaneXavier")
rf.font.size = Pt(10); rf.font.color.rgb = RGBColor(0x66, 0x88, 0xAA)

# ─── Salvar ──────────────────────────────────────────────────────────────────
output = r"C:\Projetos\Projetos\odin-admin\Ecossistema_Odin_Apresentacao.docx"
doc.save(output)
print(f"Documento gerado: {output}")
