# Identidade visual e sonora do Soulmon

> **Dono:** doc-redator-identidade · **Data:** 09/09/2026 · **Estado:** verificado em 10/09/2026 por doc-verificador (a devolução TINTA × FILL foi fechada pelo orquestrador com a leitura do teste)
> **Verificação:** `npx vitest run src/styles/ src/index.css.contract.test.ts src/utils/sprites.dungeonRoster.test.ts src/utils/loudness.contract.test.ts src/utils/cortes.contract.test.ts src/components/ui/Viewport.contract.test.tsx src/components/ui/foundation.render.test.tsx` — 11 arquivos, 216 testes, verde em 09/09/2026.
> **Não cobre:** o fluxo entre telas e o que cada superfície mostra (doc `03-FLUXO-DE-TELAS.md`); as regras de jogo por trás dos números que a UI pinta (doc `02-REGRAS-DE-NEGOCIO.md`); a assinatura de cada componente (`06-REFERENCIA/components.md`); o pipeline de build/deploy dos assets (doc `08-INTEGRACOES-E-DEPLOY.md`). Este doc descreve o som — **não** decide nada sobre ele: quem decide é o `REGISTRO-DE-DECISOES.md` (§6.1, S1..S13).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

---

## 1. A tese: "O Visor"

**A fronteira é diegética.** O app não é "um app com pixel art"; é um **aparelho
v-pet** desenhado em vetor limpo, com uma **tela** de pixel art dentro dele.
Pixel art existe **dentro** do visor — sprite, cenário, decoração, partícula,
FX. Tudo **fora** do visor é o aparelho: SVG limpo, Material Symbols Rounded,
tipografia legível. **As duas linguagens nunca se misturam na mesma
superfície.**

**Fonte da decisão:** [`docs/PLANO-DESIGN.md`](../PLANO-DESIGN.md) §0 item 1,
datado de 19/08/2026, que declara a direção de arte "O Visor" como fechada e não
reabrível dentro daquele plano.

**O que o código confirma**, medido em 09/09/2026:

| Peça da tese | Onde está no código | Estado |
|---|---|---|
| A fronteira existe como componente | `src/components/ui/Viewport.tsx` → `Viewport` | **no ar** |
| O interior é escuro nos DOIS temas | `--sm2-viewport-bg` = `#0E2422` (claro) / `#071413` (escuro) | **no ar**, com régua |
| Anel de cobre de 4px | `.sm2-viewport` em `src/index.css` — `padding: 4px` + `inset 0 0 0 2px` de `--sm2-viewport-ring-deep` | **no ar** |
| Bisel externo de 20px | 16px de corpo em `.sm2-device` + os 4px do anel | **no ar**, dividido em duas peças |
| Tela interna de 12px de raio | `.sm2-viewport-screen` usa `--sm2-radius-md` = `12px` | **no ar** |
| Escala INTEIRA do sprite | `ViewportProps.scale` aceita literalmente `2 \| 3` (tipo), e a largura é derivada (`width * scale`) | **no ar**, travado pelo tipo |
| `image-rendering: pixelated` | `.sm2-viewport-screen` e seus `img`/`canvas` | **no ar** |
| Um único reflexo + vinheta de 12% | `.sm2-viewport-glass`, `pointer-events: none` | **no ar** |
| Sem scanline permanente | não há overlay de listras em `.sm2-viewport-screen`; a varredura de `--sm2-dur-scan` passa uma vez e sai do DOM | **no ar** |

**O que o código NÃO confirma** (medido em 09/09/2026, comandos abaixo):

- **A fronteira ainda não é exclusiva.** O `Viewport` é consumido por **4**
  componentes de produção (`src/components/PetPage.tsx`,
  `src/components/CompanionHUD.tsx`, `src/components/EvolutionPath.tsx`,
  `src/components/PlayerDetailModal.tsx`) mais o `ScreenSkeleton`
  (`grep -rl "ui/Viewport" src --include=*.tsx`). Ao mesmo tempo, o **kit pixel
  antigo** (`.sm-px-*`, arte 9-slice em PNG, Silkscreen) aparece em **28**
  arquivos `.tsx` de produção com **82** classes distintas
  (`grep -rl "sm-px-" src --include=*.tsx | grep -v test | wc -l` e
  `grep -rho "sm-px-[a-z0-9-]*" src --include=*.tsx | sort -u | wc -l`). Ou
  seja: em 09/09/2026 há pixel FORA do visor, o que é exatamente o que a tese
  proíbe.
- **A `.sm-bottom-nav-label` desenha Silkscreen em `--sm2-text-xs` = `12px`**,
  fora do visor e abaixo do piso de 14px que a própria tipografia declara
  (ver §4). Régua: nenhuma para o piso — a `src/styles/navRotulo.contract.test.ts`
  mede a LARGURA do rótulo, não o tamanho da fonte.

O **teste de aceitação da identidade** do plano ("recorte de 200×200px sem logo:
dá para dizer que é o Soulmon?") **não tem régua executável** — é critério
humano, e continua sendo.

---

## 2. Os 55 tokens `--sm-*`

Medição: `grep -o -- '--sm-[a-z0-9-]*:' src/index.css | sort -u | wc -l` →
**55**, em 09/09/2026. `wc -l src/index.css` → **7678**.

Convenção da tabela: quando a coluna "escuro" traz `—`, o token é declarado uma
única vez e vale igual nos dois temas (é **invariante de tema**, não é um token
preso — a distinção importa por causa do footgun 10, ver §3).

### 2.1 Base do tema (bloco `:root, [data-theme="light"]` / `[data-theme="dark"]`)

| token | claro | escuro | para quê | um uso |
|---|---|---|---|---|
| `--sm-bg` | `#f3f9f8` | `#0e2323` | superfície geral da página | `body` no preflight (`background-color`) |
| `--sm-surface` | `#ffffff` | `#173a37` | card, painel, barra | `.sm-surface`, `.sm-nav` |
| `--sm-ink` | `#142e2a` | `#eaf5f2` | texto principal | `body` no preflight (`color`) |
| `--sm-muted` | `#54736c` | `#8fb0a8` | rótulo, subtítulo, título de seção | `.sm-bottom-nav-label` |
| `--sm-line` | `#e0ece9` | `#1f3733` | borda suave, trilho | `.sm-px-help-item` (`border`) |
| `--sm-primary` | `#0f766e` | `#2dd4bf` | teal da marca, ação primária | `.sm-btn` via `--sm-btn-fill` |
| `--sm-primary-deep` | `#0b6b64` | `#14b8a6` | sombra 3D do botão primário | `.sm-btn` via `--sm-btn-deep` |
| `--sm-primary-soft` | `#ccfbf1` | `rgba(45,212,191,0.16)` | fundo de estado ativo | `.sm-nav-btn.active` |
| `--sm-gold` | `#b6733f` | `#d99a5b` | acento cobre | `.sm-btn` via `--sm-btn-border` |
| `--sm-gold-soft` | `#f5e6da` | `rgba(217,154,91,0.18)` | fundo cobre suave | **nenhum** — ver §2.7 |
| `--sm-danger` | `#dc2626` | `#f87171` | alerta | `.sm-px-*` de falha |
| `--sm-danger-soft` | `#fde2e2` | `rgba(248,113,113,0.16)` | fundo de alerta | **nenhum** — ver §2.7 |
| `--sm-energy` | `#16a34a` | `#4ade80` | verde da barra de energia | **nenhum** — ver §2.7 |
| `--sm-energy-track` | `#e3ece9` | `#1f332e` | trilho da barra de energia | **nenhum** — ver §2.7 |
| `--sm-radius` | `16px` | — | raio do sistema antigo | `.sm-card` (`border-radius`) |
| `--sm-bottomnav-h` | `80px` | — | altura da barra inferior | `.sm-bottom-nav` (`height`) e `.sm-chat-fixed` (`bottom`) |
| `--sm-chatdock-h` | `82px` | — | altura medida do dock de chat | `src/App.tsx`, padding do scroller |
| `--sm-btn-text` | `#ffffff` | `var(--sm-bg)` | tinta do `.sm-btn` | `.sm-btn` (`color`) |

O valor de `--sm-primary` no tema claro é `#0f766e` **e não** `#0d9488` de
propósito: o comentário do CSS registra que `#0d9488` media **3,74:1** com o
branco do `.sm-btn` por cima e 3,74:1 como texto sobre superfície — reprovava
nos dois papéis; `#0f766e` mede **5,47:1** nos dois. ⚠️ **O
`public/manifest.json` ainda declara `"theme_color": "#0d9488"`** (ver §9).

### 2.2 Kit pixel — primitivos

Declarados num `:root` sem par de tema, de propósito: a peça do kit é escura
por natureza (cobre sobre teal profundo), e no tema claro ela vira um objeto
escuro sobre página clara.

| token | claro | escuro | para quê | um uso |
|---|---|---|---|---|
| `--sm-px-ink` | `#eaf5f2` | — | tinta DENTRO de peça escura | `.sm-px-btn` (`color`) |
| `--sm-px-cyan` | `#5df0e0` | — | neon do kit (destaque/aceso) — **decorativo** | `.sm-bottom-nav-btn-on::after` (sublinhado) |
| `--sm-px-copper` | `#c68642` | — | cobre do kit (moldura/borda fina) — **decorativo** | `.sm-px-card` (`border`) |
| `--sm-px-track` | `#16283d` | — | trilho escuro da barra segmentada | `.sm-px-bar` (`background`) |
| `--sm-px-track-line` | `#0a1422` | — | linha do trilho | `.sm-px-bar` (`border`) |
| `--sm-px-panel-bg` | `var(--sm-surface)` | `#10312f` | fundo do painel do kit | `.sm-px-panel` |
| `--sm-px-panel-ink` | `var(--sm-ink)` | `var(--sm-ink)` | tinta do painel do kit | `.sm-px-panel` |
| `--sm-px-chip-bg` | `#10373a` | — | fundo do chip do kit | `.sm-px-chip` |
| `--sm-px-red` | `#ff5d5d` | — | vermelho de sinal do kit | `.sm-px-chat-btn-rec` (`border-color`) |

**A regra de uso que não pode se perder** (escrita no CSS, no bloco dos pares
`*-ink`): decorativo — fundo, véu, brilho, moldura de peça escura — usa
`--sm-px-cyan` / `--sm-px-copper`; **texto ou borda que carrega significado** usa
o par `*-ink` de §2.6. Motivo medido: sobre a superfície do tema CLARO o ciano
mede **1,40:1** e o cobre **3,05:1**, contra os 4,5:1 exigidos de texto normal.

### 2.3 Kit pixel — seleção

A regra é uma só e é invariante de tema: **o PREENCHIMENTO carrega a seleção; o
não-selecionado nunca é preenchido.** A COR do fill muda por tema só para o
contraste do rótulo passar dos dois lados.

| token | claro | escuro | para quê | um uso |
|---|---|---|---|---|
| `--sm-px-sel-bg` | `#0d3b39` | `#5df0e0` | fill da peça SELECIONADA | `.sm-px-tab-on` (`background`), `.sm-px-chip-on` |
| `--sm-px-sel-ink` | `#f2fbf9` | `#04211f` | tinta sobre o fill de seleção | `.sm-px-tab-on` (`color`) |
| `--sm-px-sel-edge` | `var(--sm-px-copper)` | — | borda da peça selecionada | `.sm-px-tab-on` via `--sm-cham-line` |
| `--sm-px-off-bg` | `transparent` | — | peça NÃO selecionada: sem fill | `.sm-px-tab` (`background`) |
| `--sm-px-off-ink` | `var(--sm-ink)` | — | tinta da peça não selecionada | `.sm-px-tab` (`color`) |
| `--sm-px-off-edge` | `color-mix(in srgb, var(--sm-px-copper) 45%, transparent)` | — | borda da peça não selecionada | `.sm-px-tab` e `.sm-px-chip-btn` (`border`) |

### 2.4 Kit pixel — geometria da arte 9-slice e do chanfro

Estes seis não são cor: são **parâmetros de forma**, setados por classe de
tamanho ou inline pelo componente.

| token | valor base | para quê | um uso |
|---|---|---|---|
| `--sm-px-src` | `url(...)` do import do Vite, **setada inline no componente** | a arte 9-slice do botão — assim o hash do asset continua sendo do bundler | `src/components/pixel/PixelKit.tsx`; variantes `--sm-px-src-hover` / `-active` / `-off` trocam a arte por estado |
| `--sm-px-slice` | `82` (`.sm-px-btn-sm`) · `66` (`-md`) · `43` (`-lg`) | fatia no PNG de ORIGEM, em px medidos na arte | `.sm-px-btn` → `border-image-slice` |
| `--sm-px-bw` | `11px` (`sm`) · `12px` (`md`/`lg`) | espessura RENDERIZADA da moldura | `.sm-px-btn` → `border-width` |
| `--sm-cham-c` | `5px` (`4/6/7/8/9px` por peça) | tamanho do corte de canto do chanfro | `.sm-px-fab` sobe para `9px` |
| `--sm-cham-bw` | `2px` (`3px` no FAB) | espessura da linha do chanfro | `.sm-px-fab` |
| `--sm-cham-line` | `var(--sm-px-copper)` | cor da linha do chanfro | `.sm-px-tree-plate` troca para `var(--sm-line)` |

O chanfro é o substituto declarado da sombra Material: `.sm-px-card` tem
`border-radius: 0`, `box-shadow: none` e um `clip-path` de polígono de 8 pontos
— a profundidade vem do chanfro e da borda de cobre, não de sombra.

### 2.5 Botão — as três variáveis que são a variante inteira

`--sm-btn-fill` e `--sm-btn-deep` são a **única** diferença entre `.sm-btn` e
`.sm-btn-secondary`: o secundário é literalmente o mesmo botão, mesmo tamanho e
mesma forma, só sem cor.

| token | `.sm-btn` | `.sm-btn-secondary` | `.sm-btn-gold` |
|---|---|---|---|
| `--sm-btn-fill` | `var(--sm-primary)` | `var(--sm-muted)` | `var(--sm-gold)` |
| `--sm-btn-deep` | `var(--sm-primary-deep)` | `color-mix(in srgb, var(--sm-muted) 70%, black)` | `#96602c` |
| `--sm-btn-border` | `var(--sm-gold)` | herda | `color-mix(in srgb, var(--sm-gold) 60%, black)` |

`.sm-btn` tem `min-height: 44px` (WCAG 2.5.5), e `.sm-btn:disabled` **não usa
opacidade**: o estado é DESENHADO (`background-color: var(--sm-line)` + tinta
puxada em direção a `--sm-ink`), porque somar `filter: brightness(.75)` com
`disabled:opacity-60` do JSX levava "Entrar / Sincronizar" a **1,81:1** no claro
e **2,51:1** no escuro, e "restaurar" a **1,29:1**.

### 2.6 Pares de tinta medidos (`*-ink`) e véus

Todos os valores abaixo estão anotados no CSS com a razão de contraste WCAG
contra `--sm-bg` e `--sm-surface` do PRÓPRIO tema.

| token | claro | escuro | para quê | um uso |
|---|---|---|---|---|
| `--sm-px-cyan-ink` | `#0f766e` (5,14:1 sobre `bg`) | `#5df0e0` (12,66:1) | ciano como TEXTO/BORDA | `src/components/MorningDream.tsx` |
| `--sm-px-copper-ink` | `#8a5a2b` (5,38:1) | `#c68642` (5,81:1) | cobre como TEXTO/BORDA | `src/components/MorningDream.tsx` |
| `--sm-ok-ink` | `#177a00` (5,16:1) | `#22A900` (5,69:1) | o verde "feito"/"hoje" | **nenhum** — ver §2.7 |
| `--sm-haunt-ink` | `#6242ad` (6,79:1) | `#b39bff` (7,63:1) | o roxo do assombro, **nunca vermelho** | `src/components/TaskMeta.tsx` |
| `--sm-haunt-veil` | `color-mix(in srgb, #6242ad 8%, var(--sm-surface))` | `color-mix(in srgb, #b39bff 12%, var(--sm-surface))` | véu da tarefa assombrada | `src/components/TaskMeta.tsx` |
| `--sm-attr-virus-ink` | `#1a7d00` (5,28:1) | `#5fdc3a` (6,95:1) | Poder como TEXTO | `src/types/attributes.ts` → `ATTR_INK` |
| `--sm-attr-data-ink` | `#00699a` (6,02:1) | `#5ac8f5` (6,49:1) | Harmonia como TEXTO | idem |
| `--sm-attr-vaccine-ink` | `#8a5a00` (5,93:1) | `#f0b64d` (6,78:1) | Benevolência como TEXTO | idem |
| `--sm-help-accent` | `#0f766e` | `#5df0e0` | acento do glossário | **nenhum** — ver §2.7 |
| `--sm-help-item-bg` | `#f3f9f8` | `rgba(255,255,255,0.03)` | fundo do item do glossário | `.sm-px-help-item` |

Os três `--sm-attr-*-ink` existem porque `ATTR_COLOR` (`src/types/attributes.ts`)
é a fonte única da IDENTIDADE do atributo — cor do ícone, do preenchimento e da
linha do grafo, onde o mínimo é 3:1 e ela passa. **Como TEXTO** ela reprovava
nos dois temas (`#22A900` sobre branco = 3,11:1; `#009ED8` = 3,05:1; `#E69600` =
2,41:1). Os pares acima são a MESMA matiz com a luminosidade ajustada: não é cor
nova na paleta.

### 2.7 Layout, tipografia e os seis tokens sem consumidor

| token | valor | para quê | um uso |
|---|---|---|---|
| `--sm-scroll-pt` | `12px` | folga de topo do scroller | `.sm-pet-sticky` (`top: calc(var(--sm-scroll-pt) * -1)`) |
| `--sm-petstage-h` | `215px`; `175px` sob `@media (max-height: 800px)` | altura do palco do pet | `src/components/ui/Viewport.tsx` |
| `--sm-font-pixel` | `'Silkscreen', ui-monospace, 'Courier New', monospace` | ponto único da fonte de aparelho | `.sm-px-font`, `.sm-bottom-nav-label` |

⚠️ **Seis tokens são declarados e não têm um único `var()` que os consuma** em
`src/` nem em `desktop/`, medido em 09/09/2026 com
`grep -rn "var(--sm-<nome>" src desktop | wc -l` → `0`:
`--sm-gold-soft` · `--sm-danger-soft` · `--sm-energy` · `--sm-energy-track` ·
`--sm-ok-ink` · `--sm-help-accent`. Os dois últimos foram criados numa rodada de
contraste **com valor medido anotado no CSS** e nunca chegaram a um call-site;
os quatro primeiros são do bloco base original. Não são erro de renderização
(token sem consumidor não pinta nada), mas são superfície de decisão morta.
**Régua: nenhuma** — o `src/styles/tokens.contrast.test.ts` cobre paridade e
contraste dos `--sm2-*`, não órfão dos `--sm-*`.

### 2.8 O conjunto `--sm2-*` — para onde os tokens estão indo

Medição: `grep -o -- '--sm2-[a-z0-9-]*:' src/index.css | sort -u | wc -l` →
**50**, em 09/09/2026. Contrato completo e tabela de contraste:
[`src/styles/tokens.md`](../../src/styles/tokens.md).

**Por que dois conjuntos.** Os `--sm-*` estão espalhados por milhares de linhas
do `index.css` (kit pixel, palco, masmorra, moldura chanfrada). Trocar o VALOR
deles repinta toda tela existente de uma vez, sem revisão — regressão garantida.
O conjunto novo nasceu ao lado; as ondas migram tela por tela, e só no fim os
`--sm-*` morrem. Estado em 09/09/2026: **64** classes `.sm2-*` contra **100**
classes `.sm-px-*` no CSS
(`grep -o '\.sm2-[a-z0-9-]*' src/index.css | sort -u | wc -l` e o mesmo para
`.sm-px-`), e **61** arquivos `.tsx` de produção já citam `sm2-`.

**A regra estrutural do conjunto novo é TINTA × FILL**: todo acento declara o
PAR `*-ink` + `*-fill` mais `--sm2-on-<acento>` — `*-ink` é cor de texto/glifo,
`*-fill` é preenchimento, e texto POR CIMA de um fill usa `--sm2-on-<acento>`.
Os dois tokens **podem** coincidir em valor: `--sm2-primary-ink` = `--sm2-primary-fill`
(`#5FF3E0` no escuro, `#0B6F68` no claro) e o par `danger` também (`#FF8B8B` / `#B3261E`);
o que a régua proíbe é a coincidência no acento `gold`, o único em que tinta e fill
têm papéis de contraste distintos (`ACENTOS = ['gold', 'danger']` no teste, e a
desigualdade só é exigida sob `acento === 'gold'` — o comentário do teste diz
"`'danger'` pode coincidir num tema"). Verificado em 10/09/2026.
Régua: `src/styles/tokens.contrast.test.ts`, bloco *"tinta e fill nunca são a
mesma cor"*. Verificado em 09/09/2026:
`grep -nE "^\s*color: var\(--sm2-[a-z]+-fill\)" src/index.css | wc -l` → **0**.

Paleta canônica do escuro (o tema canônico — "o Soulmon é noturno"):
`--sm2-bg` `#08191A` · `--sm2-surface` `#0F2A29` · `--sm2-surface-2` `#163735` ·
`--sm2-line` `#1E3F3C` · `--sm2-ink` `#E9F5F2` · `--sm2-muted` `#9DBCB4` ·
`--sm2-primary-ink`/`--sm2-primary-fill` `#5FF3E0` · `--sm2-primary-deep`
`#29C9B8` · `--sm2-on-primary` `#04211F` · `--sm2-gold-ink` `#EBBE84` ·
`--sm2-gold-fill` `#D9A05B` · `--sm2-on-gold` `#04211F` · `--sm2-danger-ink` e
`--sm2-danger-fill` `#FF8B8B` · `--sm2-on-danger` `#04211F` ·
`--sm2-credit-ink` `#C9A7FF`.

E no claro: `--sm2-bg` `#F1F7F5` · `--sm2-surface` `#FFFFFF` ·
`--sm2-surface-2` `#E9F2EF` · `--sm2-line` `#DCE9E6` · `--sm2-ink` `#0E2422` ·
`--sm2-muted` `#4E6B66` · `--sm2-primary-ink`/`-fill` `#0B6F68` ·
`--sm2-primary-deep` `#08544F` · `--sm2-on-primary` `#FFFFFF` ·
`--sm2-gold-ink` `#8A5A2B` · `--sm2-gold-fill` `#A2641F` · `--sm2-on-gold`
`#FFFFFF` · `--sm2-danger-ink`/`-fill` `#B3261E` · `--sm2-on-danger` `#FFFFFF` ·
`--sm2-credit-ink` `#6D28D9`.

**Os cinco tokens do visor são a exceção declarada à paridade de tema**:
`--sm2-viewport-bg` (`#0E2422` claro / `#071413` escuro) é escuro nos DOIS,
`--sm2-viewport-ink` (`#E9F5F2`) e `--sm2-viewport-danger` (`#FF8B8B`) têm o
MESMO valor nos dois, e `--sm2-viewport-ring` (`#B0722F` / `#C68642`) e
`--sm2-viewport-ring-deep` (`#5E3612` / `#241507`) só variam o material do
cobre. Régua: `src/styles/tokens.contrast.test.ts`, bloco *"o visor é escuro nos
DOIS temas"*.

---

## 3. O mecanismo de tema

**Dono:** `src/contexts/ThemeContext.tsx` → `ThemeProvider` / `useTheme`.

- `ThemeMode` = `'light' | 'dark' | 'system'`, persistido em
  `STORAGE_KEYS.THEME` por `writeLocal(..., { silent: true })` — preferência
  cosmética não gasta o aviso único do usuário.
- O provider escreve `document.documentElement.dataset.theme` com o tema
  RESOLVIDO. O `data-theme` inicial já vem de um **script inline no
  `index.html`**, que roda antes do primeiro paint (evita FOUC); o provider só
  assume o controle depois que o React monta.
- ⚠️ **`resolveSystemPreference()` devolve `'dark'` incondicionalmente.** O modo
  `'system'` NÃO segue o sistema operacional. A justificativa está escrita na
  função: o visual do jogo (moldura cobre, teal escuro) só existe pensado para o
  tema escuro, e seguir o SO faria metade dos aparelhos abrir no tema claro que
  ninguém desenhou. O `matchMedia('(prefers-color-scheme: dark)')` continua
  registrado, mas o handler chama a mesma função — ou seja, a troca de tema do
  SO em tempo real resolve para `'dark'` de novo. **Régua: nenhuma.**

### 3.1 Footgun 10 — os dois sistemas de tema no mesmo CSS

`src/index.css` carrega **dois** vocabulários de tema ao mesmo tempo:

1. O do app: `[data-theme="light"|"dark"]` no `<html>`, definindo `--sm-*` e
   `--sm2-*` nos dois blocos.
2. O **scaffold shadcn importado do Figma**: `--background` / `--foreground` /
   `--card` / `--popover` etc., que só trocam de valor sob a classe `.dark` —
   **nunca aplicada por este app** (`grep -c "^\.dark" src/index.css` → 1
   declaração, e nenhum `classList.add('dark')` em `src/`).

O dano: texto sem `color` próprio herdava `body { color: var(--foreground) }`,
preso no valor claro `oklch(.145 0 0)` (quase preto) mesmo com
`[data-theme="dark"]` ativo — nome da criatura, descrição por forma e nome da
skill na página do Pet saíam quase pretos sobre card verde-escuro.

**O conserto que está no ar:** a regra do `body` no preflight usa
`background-color: var(--sm-bg)` e `color: var(--sm-ink)`, e a regra do `body`
no fim do arquivo declara **só** `font-family: var(--sm2-font-text)` e
`line-height: var(--sm2-leading-body)`. `--background`/`--foreground` continuam
intactos para quem os usa explicitamente via `.bg-background`/`.text-foreground`
em `src/components/ui/`. **Não reintroduza `var(--foreground)` /
`var(--background)` em texto novo.**

### 3.2 As réguas

| Régua | Arquivo | O que reprova |
|---|---|---|
| Paridade de tema | `src/styles/tokens.contrast.test.ts` | token de cor `--sm2-*` declarado só no claro (ficaria preso sob `[data-theme="dark"]`) ou só no escuro |
| Contraste AA | idem | par (ink, surface), (muted, surface), (primary, bg), (gold, surface), (btn-text, primary) e os do toast abaixo do mínimo, **nos dois temas**, pela fórmula da WCAG 2.x escrita à mão no teste |
| Tinta × fill | idem | acento `primary`/`gold`/`danger` sem o trio `ink`+`fill`+`on-` declarado; `gold-ink` = `gold-fill` em qualquer tema (só `gold` exige valores distintos) |
| Ícone sem box | idem | `.sm2-icon` desenhando moldura/fundo/borda/padding |
| Fonte self-host | idem | `@font-face` apontando para CDN |
| Piso tipográfico | idem | escala com degrau abaixo de 12px |
| Movimento | idem | durações fora de 120/200/320 numa curva só; a varredura de 400ms como literal solto |
| Visor escuro nos dois temas | idem | `--sm2-viewport-bg` claro no tema claro |
| Classe fantasma | `src/index.css.contract.test.ts` | classe utilitária usada no JSX que não existe no CSS pré-compilado (footgun 1) |

O contraste é medido **numericamente**, não visualmente, e o motivo está escrito
no cabeçalho do teste: na faixa de 3:1 a 5:1 o olho mente e o pixel não. O CSS é
lido do DISCO e não por `?raw` — o vitest desliga o processamento de CSS e
`import './index.css?raw'` chegaria como string vazia, fazendo o teste passar
sempre pelo motivo errado.

---

## 4. Tipografia

### 4.1 As quatro famílias e de onde cada uma vem

Medido em 09/09/2026 (`grep -n "@font-face" src/index.css` → 7 linhas, das
quais **6** são blocos de verdade: a sétima é o comentário-lápide que registra
que o `@font-face` da Silkscreen saiu daqui ⚰️; `ls public/fonts/`):

| Família | Papel | Como chega | Arquivo |
|---|---|---|---|
| **Fredoka** (300–700) | títulos — `--sm2-font-display` | `@font-face` self-host, `font-display: swap`, subsets `latin` + `latin-ext` | `public/fonts/fredoka-latin.woff2` (29.732 B) e `fredoka-latin-ext.woff2` (4.576 B) |
| **Rubik** (400–500) | texto e dado — `--sm2-font-text` | idem | `public/fonts/rubik-latin.woff2` (35.348 B) e `rubik-latin-ext.woff2` (19.400 B) |
| **Material Symbols Rounded** (100–700, variável) | ícone — `--sm2-font-icon` | `@font-face` self-host, `font-display: block` | `public/fonts/material-symbols-rounded.woff2` (150.016 B) |
| **Silkscreen** (400/700) | **voz do aparelho** — `--sm-font-pixel` / `--sm2-font-pixel` | ⚠️ **NÃO** está em `public/fonts/` nem tem `@font-face` no `index.css`: vem do pacote npm `@fontsource/silkscreen`, importado em `src/main.tsx` (`latin-400.css` e `latin-700.css`) | emitido pelo Vite em `dist/assets/` |

Mais dois `@font-face` residuais: `MS Sans Serif` (mapeado por `local()` para
Small Fonts/Fixedsys/System, resíduo de um skin antigo) e as segundas faces de
Fredoka/Rubik para `latin-ext`.

**Por que self-host, e é regra, não preferência:** `public/sw.js` faz
`if (url.origin !== self.location.origin) return;` — ele IGNORA qualquer
requisição cross-origin. Fonte servida por `fonts.gstatic.com` nunca entra no
cache e some quando o app abre offline, que é o modo de uso normal de um PWA de
bichinho. `font-display: swap` no texto; `block` no ícone, porque uma ligature
de Material Symbols com `swap` mostraria a PALAVRA "settings" por ~100 ms antes
do glifo chegar.

**Duas famílias de moeda**, que não são fontes novas (zero byte a mais no
bundle) e existem como token para que `src/utils/currencies.ts` pare de escrever
`'Courier New'` e `Georgia` em estilo INLINE — inline vence o token por
especificidade, e foi assim que `span.sm2-num` renderizou em Courier na Loja:

- `--sm2-font-mono` = `'Cascadia Mono', Consolas, Menlo, 'Roboto Mono', 'DejaVu Sans Mono', 'Courier New', ui-monospace, monospace` — a fonte de CALCULADORA dos **Bits**. A pilha nomeia uma face concreta por sistema ANTES de qualquer genérico porque `ui-monospace` no Windows resolve para a mono do sistema e a 12px lê quase igual à Rubik; as três escolhidas têm zero cortado (Cascadia/Consolas/Menlo) ou pontilhado (Roboto Mono).
- `--sm2-font-serif` = `'Georgia', 'Times New Roman', serif` — a serifa de medalha dos **Emblemas**.

### 4.2 O papel da Silkscreen — e onde ela NÃO entra

Silkscreen é bitmap de caixa alta: ótima em rótulo, número, botão e título;
péssima em parágrafo — e em português é pior, porque os acentos empilham em cima
de uma caixa pequena e o olho perde a palavra.

- **Entra em**: botão do kit, título de painel, cápsula de HUD, marca, título de
  seção/página, números de HUD; no conjunto novo, **só dentro do visor e em
  selos** (classe `.sm2-device-voice`), **mínimo 14px, CAIXA ALTA**.
- **Não entra em**: nome de tarefa, falas do pet, guia, glossário, relatório
  diário, qualquer texto de leitura corrida.
- `.sm-px-font` e `.sm2-device-voice` declaram `-webkit-font-smoothing: none` —
  a Silkscreen tem desenho de 1px e alisar mata a nitidez do bitmap.
- ⚠️ A classe `.sm2-device-voice` **foi renomeada** de `.sm2-device`: existiam
  duas regras com o mesmo nome (esta, de tipografia, e a do CORPO do aparelho).
  Como os conjuntos de propriedades eram disjuntos elas não se sobrescreviam,
  elas **somavam** nos dois sentidos — quem pedia a fonte ganhava padding, raio,
  fundo e três sombras junto, e o corpo do aparelho fazia a subárvore inteira
  HERDAR Silkscreen em caixa alta.

### 4.3 Escala, entrelinha, raio

Escala FECHADA, piso ABSOLUTO de 12px — não existe texto menor no app, nem
legenda, nem rodapé de card:

`--sm2-text-xs` `12px` · `--sm2-text-sm` `14px` · `--sm2-text-md` `16px` ·
`--sm2-text-lg` `20px` · `--sm2-text-xl` `24px` · `--sm2-text-2xl` `32px` ·
`--sm2-leading-body` `1.45` · `--sm2-leading-title` `1.2`.

Raio em **três** degraus, e três é o número (a Home media SETE: 2, 3, 10, 12,
16, 20, 22px): `--sm2-radius-sm` `4px` (peça pequena) · `--sm2-radius-md` `12px`
(card/painel, e a tela do visor) · `--sm2-radius-lg` `20px` (casca: aparelho,
sheet). Pílula (`rounded-full`) continua sendo FORMA, não degrau de escala.

**`tabular-nums` é obrigatório em número que MUDA** (HP, energia, Bits,
contadores): a classe `.sm2-num` declara
`font-variant-numeric: tabular-nums` + `font-feature-settings: 'tnum' 1`. Sem
isso o valor "dança" na horizontal a cada tick e a barra inteira parece tremer.

---

## 5. Ícones

### 5.1 Dois motores, uma API — `Icon`

**Dono único: `src/components/ui/Icon.tsx` → `Icon`.** É o único ponto de ícone
do app, e a troca de motor é invisível para quem chama:

- se existir **glifo próprio** com aquele nome em `src/components/ui/NavGlyphs.tsx`
  (`GLYPHS`), o `Icon` desenha o SVG nosso;
- se não existir, cai na **ligature da Material Symbols Rounded**.

Medido em 09/09/2026: `GLYPHS` tem **35** chaves próprias (`home`, `activities`,
`evolution`, `shop`, `menu`, `favorite`, `bolt`, `restaurant`, `shower`,
`bedtime`, `inventory_2`, `wb_sunny`, `task_alt`, `check_circle`, `check`, `close`, `add`,
`chevron_right`, `chevron_left`, `expand_more`, `expand_less`,
`arrow_forward`, `arrow_back`, `diamond`, `lock`, `lock_open`, `sync`,
`refresh`, `replay`, `mic`, `send`, `stop_circle`, `schedule`, `eco`,
`auto_awesome`) mais **4** apelidos (`casino`, `storefront`, `shopping_bag`,
`more_horiz`). `hasGlyph` é o que o `Icon` pergunta; `GLYPH_NAMES` existe só
para inspeção.

Três decisões que não afrouxam, escritas no cabeçalho do componente:

1. **`FILL 0→1` é o sistema de estado** (inativo → ativo) e **interpola**. Não
   existe par "outline/solid" de ícones diferentes: é o mesmo glifo se
   preenchendo. Valores fracionários são válidos (arrastar, progresso).
2. **`opsz` casado ao tamanho renderizado**, clampado em 20–48 — é o que impede
   o traço de afinar em 20px e engrossar em 40px. Fora da faixa o componente
   clampa, porque valor inválido em `font-variation-settings` invalida a
   declaração INTEIRA em alguns WebViews e o ícone perderia junto o FILL e o
   `wght`.
3. **`weight` padrão 500** (e não 400): é o que faz o traço casar com a
   espessura do pixel do sprite; 400 devolve "biblioteca de ícones padrão".

`--sm2-icon-grad` fica FORA dos blocos de cor de propósito — não é cor, é
métrica: `0` no claro, `-25` no escuro, porque no escuro o glifo claro "engorda"
opticamente contra o fundo e o GRAD devolve a espessura percebida sem mudar o
avanço do glifo (ao contrário de mexer no `wght`, que reflui o layout).

### 5.2 A fonte é um SUBSET — e o modo de falha é silencioso

A Material Symbols Rounded completa tem **5,3 MB**; a que o app carrega é
subsetada por `icon_names` e tem **150.016 B** (`ls -la public/fonts/`, 09/09/2026).
A lista de nomes tem **100** entradas em `src/styles/tokens.md` (medido com
`node` sobre o bloco em crase que começa em `accessibility_new` e termina em
`wifi_off`).

⚠️ **Nome fora do inventário renderiza um `<span>` vazio** — sem erro no
console, sem exceção, sem falhar em teste de render (o texto do ícone É o nome, e
ele está lá; só não existe glifo). Aconteceu: o botão "Equilibrar minha semana"
saiu com `<Icon name="balance" />`, `balance` não estava no subset, e `tsc`,
`vitest` e o build passaram limpos.

**Régua: `src/styles/iconInventory.contract.test.ts`** — varre os `.tsx` de
`src/` atrás de `<Icon name=...>` e cobra que todo nome esteja na lista de
`icon_names` do `tokens.md`, que é a MESMA string usada para rebaixar o
`.woff2`.

### 5.3 A escala de ícone

Declarada em `src/styles/tokens.md` §6.1 e travada por
**`src/styles/iconScale.contract.test.ts`**, que LÊ a escala do `tokens.md` em
vez de digitá-la (número copiado é número que diverge):

| degrau | px | papel — e só ele |
|---|---|---|
| `inline` | **20** | ícone ao lado de TEXTO na mesma linha: dica, chip, preço, saldo, rótulo de campo |
| `action` | **24** | o ícone que É a ação ou o estado de uma LINHA de lista / botão de barra |
| `nav` | **32** | destino da barra inferior e botão da barra de chat |
| `deck` | **24** | o deck de ações do aparelho na Home (comida, carinho, banho) — **era 42, dedicado**, e encolheu em 27/08/2026 por decisão do dono |

Medido em 09/09/2026 com
`grep -rho "size={[0-9]*}" src --include=*.tsx | sort | uniq -c | sort -rn`:
**76×** `size={20}`, **22×** `size={24}`, **13×** `size={32}`, e as exceções
nomeadas na allowlist do guard (**12×** `48`, **5×** `44`, **3×** `18`, **1×**
`64`, **1×** `12`). A allowlist é verificada nos DOIS sentidos: entrada morta
(call-site já migrado) reprova igual.

⚠️ **Divergência com o `CLAUDE.md`.** A seção "UI: regras visuais do dono" diz
"nav inferior 36px, ações do pet 42px, chat 30px". Nenhum desses três números
existe no código: `grep -rho "size={36}\|size={42}\|size={30}" src --include=*.tsx`
devolve **0** ocorrências em 09/09/2026. A escala viva é a de `tokens.md` §6.1
acima. A REGRA de que o ícone aparece grande e pelado continua valendo; os
números envelheceram.

### 5.4 Ícone NUNCA dentro de box

Regra do dono, datada de 18/08/2026 no `CLAUDE.md`, e vale no app inteiro: nada
de moldura, placa, chanfro ou fundo em volta de um ícone. O `Icon` **não desenha
moldura, fundo, borda, chanfro nem padding — em nenhuma prop, nunca**; alvo de
toque de 44px é responsabilidade do BOTÃO que envolve o ícone.

**Régua:** `src/styles/tokens.contrast.test.ts`, bloco *"REGRA DO DONO:
`.sm2-icon` não desenha box nenhuma"* (lê o CSS) + o teste de render
`src/components/ui/foundation.render.test.tsx` (lê o componente).

**Seleção na nav = sublinhado ciano, e o sublinhado não é decoração.** A placa
preenchida do item ativo SAIU (era literalmente um box em volta do ícone). Mas a
regra de acessibilidade dizia que a seleção tem que ser carregada por algo que
NÃO seja só cor (daltonismo, tema invertido, alto contraste) — sem a placa
sobrava "ciano vs cinza", cor pura. `.sm-bottom-nav-btn-on::after` devolve uma
pista de FORMA: barra de `3px`, de 22% a 22%, em `--sm-px-cyan` com halo. Uma
barra não é uma caixa em volta do ícone.

O rótulo da nav é persistente, Silkscreen, `letter-spacing: 0`,
`text-overflow: ellipsis`. **Régua: `src/styles/navRotulo.contract.test.ts`**,
que mede a contagem de caracteres do rótulo mais largo contra o teto declarado
pela própria régua do CSS, **nos dois idiomas**. Ele nasceu de uma medição real
em 320×640 (09/09/2026): a célula tem 60px, a caixa do rótulo 54px e
"ATIVIDADES" precisa de 61px — e com `text-overflow: clip` a pessoa lia
"ATIVIDADE", palavra portuguesa completa no singular, sem sinal de que faltava
algo. Em inglês, no mesmo viewport, **zero** rótulos cortavam.

### 5.5 Emoji é um terceiro motor de ícone — e falha igual de silencioso

**Régua: `src/styles/emojiSuportado.contract.test.ts`.** Emoji do bloco
*Symbols and Pictographs Extended-A* (U+1FA70–U+1FAFF) começa no Emoji 12.0
(Android 10, set/2019) e vai até o 15; o Android só ganha cada leva na versão do
ANO seguinte, e fontes de sistema no Windows e no Linux ficam mais atrás.
Medido por canvas em 08/09/2026, o que o jogador vê como **caixa vazia**: 3 das
24 cenas da aventura, 5 mobílias da loja (na loja E no palco do pet), o ícone do
traço Carinhoso em Estatísticas, o botão de Carinho, o efeito de banho do
overlay de desktop, e o texto do marco de 21 dias (já resolvido por troca de
glifo: 🪴 virou 🌾). O guard **não conserta** a dívida — ele impede a lista de
crescer.

### 5.6 Os ícones em PNG (arte própria)

Contagem medida em 09/09/2026 com `find src/assets/soulmon/<pasta> -name '*.png' | wc -l`:

| pasta | PNGs |
|---|---|
| `src/assets/soulmon/icons/` (recursivo, inclui `categories/` e `games/`) | **57** |
| `src/assets/soulmon/elementos/` | **137** |
| `src/assets/soulmon/fx-ataque/` | **816** |
| `src/assets/soulmon/lines/` | **53** |
| `src/assets/soulmon/dreams/` | **30** |
| `src/assets/soulmon/adventures/` | **24** |
| `src/assets/soulmon/bg/` | **15** |
| `src/assets/soulmon/buttons/` | **13** |
| `src/assets/soulmon/items/` | **13** |
| `src/assets/soulmon/fx/` | **12** |
| `src/assets/soulmon/evolution/` · `progress/` | **4** cada |
| `src/assets/soulmon/ui/` | **3** |
| `src/assets/soulmon/windows/` | **1** |
| raiz de `src/assets/soulmon/` | **16** |
| **total** (`find src/assets/soulmon -name '*.png' \| wc -l`) | **1198** |

⚠️ **Divergência com `docs/INVENTARIO-TELAS.md` §1.1**, cujo levantamento é de
**19/08/2026**: ele afirma 47 PNGs em `icons/`, 8 em `categories/`, 5 em
`games/` (total 60) e **158** PNGs em `src/assets/soulmon/`. Hoje são 41 / 8 / 8
(total 57) e **1198**. As duas contagens estão certas nas suas datas; o
inventário não foi refeito. Este documento não o corrige — o dono daquele
arquivo é o Cartógrafo de Telas.

Ícone de categoria tem DUAS fontes e elas não são a mesma coisa:
`CATEGORY_ICON_NAME` (`src/types/category-icons.ts`) mapeia categoria → nome
Material Symbols (todo nome ali está no inventário) e é o ÚNICO desenho — na
lista, nos chips de criação/edição e no onboarding (canvas Atividades D-A7,
20/09/2026: o PNG pixel `CATEGORY_ICON_IMG` saiu do código; ficou só como
arquivo de arte); `CATEGORY_ICONS` (emoji) continua sendo o valor GRAVADO no
campo `emoji` da tarefa.

---

## 6. Movimento

### 6.1 O vocabulário

**Três durações e UMA curva** — mais que isso vira ruído:
`--sm2-dur-tap` `120ms` (feedback de toque) · `--sm2-dur-enter` `200ms` (entrada
de card/sheet) · `--sm2-dur-page` `320ms` (troca de página) · `--sm2-ease`
`cubic-bezier(.2, 0, 0, 1)`.

**A quarta duração, e a única acima de 320ms**: `--sm2-dur-scan` `400ms`, a
varredura da sintonia do Visor — não é feedback nem entrada, é uma passagem que
o olho precisa SEGUIR de um lado ao outro da tela; em 320ms a faixa vira flash.
Ela é token e não literal porque duração de movimento neste projeto é
vocabulário. **Régua:** `src/styles/tokens.contrast.test.ts`, bloco *"a varredura
da sintonia do Visor é token de 400ms, não literal solto"*. O gêmeo em JS é
`DUR_VARREDURA_MS` — o CSS anima, o número em JS só decide quando o elemento sai
do DOM.

### 6.2 Os keyframes

`grep -c '@keyframes' src/index.css` → **33** em 09/09/2026, das quais **32**
são declarações (`grep -o '@keyframes [a-zA-Z0-9_-]*'`): a 33ª é uma menção
dentro de comentário. As 32, por família:

- **Do sistema `sm-*`/`sm2-*`**: `sm-ambient-float`, `sm-intro-logo-in`,
  `sm-intro-wordmark-in`, `sm-milestone-pop`, `sm-pet-haunted-look`,
  `sm-px-node-pulse`, `sm-reveal-cocoon-pulse`, `sm-visor-scan-once`,
  `sm-visor-swap-in`, `sm2-pet-blink`, `sm2-pet-greet`, `sm2-rub-call`,
  `sm2-viewport-breathe`.
- **Do pet e do cuidado**: `pet-munch`, `pet-rub`, `pet-shower-shake`,
  `rub-heart`, `shower-drop`, `float-up`.
- **Da masmorra e do CRT**: `dungeon-idle`, `dungeon-vhs`, `vhs-distort`,
  `crt-off`, `noise-anim`, `boot-up`.
- **Da evolução**: `evo-bg-drift`, `evo-btn-pulse`, `evo-fade-in`, `evo-pop`.
- **Genéricos**: `enter`, `pulse`, `spin`.

`rub-heart` é o exemplo do vocabulário do gesto: os corações EXPLODEM do centro
do pet (pop rápido, depois radiam para fora como fogos), com a direção vindo de
`--tx`/`--ty` setados pelo componente.

### 6.3 `steps()` — dentro do visor, e só

Movimento DENTRO do visor é `steps()`, sempre: pixel deslizando em subpixel é o
que faz pixel art parecer borrada. Medido: `grep -n 'steps(' src/index.css` →
**5** ocorrências, das quais **1** é declaração real — `.sm2-rub-heal::after`
usa `sm2-rub-call 1.6s steps(1, end) infinite`, `steps(1)` de propósito, porque
a mira TROCA de estado, não desliza; as outras 4 são comentário. Fora do CSS, o
`CompanionHUD` aplica `steps(2, end)` num sprite que só tem dois quadros (e
`steps(4, end)` no cumprimento) e o `ScreenSkeleton` aplica `steps(1, end)`.

⚠️ O plano previa um token `--sm-steps` = `steps(4,end)`. Ele **não existe** —
`grep -c -- '--sm-steps:' src/index.css` → 0. O `steps()` é escrito no
call-site.

### 6.4 `prefers-reduced-motion`

`grep -c 'prefers-reduced-motion' src/index.css` → **8** blocos em 09/09/2026.
O bloco CANÔNICO zera `animation-duration`, `animation-iteration-count`,
`transition-duration` e `scroll-behavior` em `*, *::before, *::after`, e
acrescenta `!important` explícito em `.sm-haunt-particle` e `.sm-battle-idle`,
que nasceram como `style={{animation}}` inline. **Régua:**
`src/styles/tokens.contrast.test.ts` tem duas travas — *"prefers-reduced-motion
desliga a respiração do visor"* e *"o último bloco de movimento reduzido é o
CANÔNICO — sentinela de identidade"*.

A vibração NÃO passa por CSS: `navigator.vibrate` tem guard próprio em JS com
`window.matchMedia('(prefers-reduced-motion: reduce)').matches`.

**Movimento reduzido reduz o MOVIMENTO, nunca a pausa.** O caso registrado é a
cerimônia de marco de hábito, que caía para um `toast.success` igual ao de
qualquer tarefa sob movimento reduzido — entregando MENOS cerimônia justamente a
quem tem mais chance de precisar de acessibilidade.

### 6.5 `.sm-pet-sticky` — a área do pet não rola para fora da tela

Regra do dono (rodada 4). No ar como:

```
.sm-pet-sticky {
  position: sticky;
  top: calc(var(--sm-scroll-pt) * -1);
  z-index: 5;
  margin-inline: -24px;
  padding: 0 24px;
}
```

O padding vertical é zero por medição: 6px em cima custavam uma unidade de ação
inteira acima da dobra em 412×915. O fundo repetido na faixa é o MESMO da Home
com `background-attachment: fixed`, ancorado no viewport — assim a faixa casa
pixel a pixel com o cenário de baixo em vez de virar uma tarja chapada por cima
dele. O scroll acontece só na lista de atividades abaixo. **Régua: nenhuma**
(é geometria de CSS, não há teste de layout em jsdom).

---

## 7. O palco do pet, os cenários e a decoração

### 7.1 O palco

**Dono: `src/utils/petStage.ts`.** Documentação de arte:
[`docs/PALCO-E-DECORACAO.md`](../PALCO-E-DECORACAO.md).

O box do pet é uma COMPOSIÇÃO, não um canto onde jogar ícones. Três regras que
sustentam tudo, escritas no cabeçalho do módulo:

1. **Todo cenário compartilha a MESMA linha de chão**, `GROUND_Y` = **74**
   (% da altura do palco). Cenário que desenhe o chão em outra altura faz a
   decoração flutuar — por isso o CSS dos cenários foi alinhado a este valor, e
   não o contrário.
2. **Cada espaço tem TAMANHO FIXO em px.** A arte é desenhada PARA a caixa; o
   renderizador não redimensiona. Mudar um tamanho aqui significa redesenhar a
   arte.
3. **Espaço vazio é VAZIO.** Sem contorno tracejado, sem "+", sem marcação —
   quem não tem decoração vê o cenário limpo, não um formulário pela metade.

`STAGE_HEIGHT` = **250** px. Os cinco espaços (`DECOR_SLOTS`, na ordem de
`SLOT_ORDER`), com `x` em % da largura e `w`/`h` em px:

| `SlotId` | x | w × h | `anchor` | nome PT / EN |
|---|---|---|---|---|
| `rug` | 50 | 104 × 16 | `ground-flat` | Chão / Floor |
| `floor-left` | 16 | 56 × 56 | `ground` | Canto esquerdo / Left corner |
| `trophy` | 47 | 46 × 50 | `ground` | Vitrine de troféus / Trophy display |
| `floor-right` | 84 | 48 × 52 | `ground` | Canto direito / Right corner |
| `wall` | 68 (y=20) | 56 × 40 | `hang` | Parede / Wall |

A distribuição é deliberada: **nada no centro exato do chão**, porque é onde o
pet passa a maior parte do tempo, e nada colado nas bordas, que o box
arredondado corta. O `wall` fica logo abaixo do topo, e não colado nele, para
ler como preso a alguma coisa em vez de boiar no céu.

Há um sexto espaço que **não** é `SlotId`: `BaseSlotId` = `'nest'`, o berço.
Não é comprado nem equipado — é a mobília que o app põe sempre, para NORMALIZAR
um sprite imprevisível (o pet é gerado pelo usuário). Enfiá-lo em `SlotId`
quebraria de uma vez as duas regras que o `SlotId` carrega (a loja vende para
todo `SlotId`, e há teste exigindo isso), e enfiá-lo no `rug` roubaria do jogador
o tapete que ele comprou. A arte dele mora em `src/components/nestArt.ts`, a
fronteira de troca.

⚠️ **`GROUND_Y` está defasado, e o código diz isso por extenso.**
`PET_TOP_OFFSET` = **−38** px é a origem REAL do pet e do berço, e **não** sai de
`GROUND_Y`: os 74% foram medidos quando o sprite tinha 80px; em 09/09/2026
`PET_BOX` = **152** px e a renderização deixou de bater com os 74%. Deduzir a posição do
berço de um `GROUND_Y` defasado colocaria a mobília num chão que não existe
mais. **A grade de pixel do sprite também mora aqui**, e é INTEIRA por
construção: `SPRITE_SRC_PX` = 256, `SPRITE_SCALE` = 2, `PET_RENDER` =
`SPRITE_SRC_PX / SPRITE_SCALE` = 128 — todo PNG de linha do roster tem 256 ou
384 de lado, e 128 é o maior divisor útil dos dois (2:1 e 3:1, os dois
inteiros), então cada pixel de origem vira exatamente um bloco de destino e
`image-rendering: pixelated` passa a ser decisão em vez de remendo.
[`docs/PALCO-E-DECORACAO.md`](../PALCO-E-DECORACAO.md) registra o mesmo achado numa seção própria
("`GROUND_Y` está defasado") e ainda descreve a conta antiga (sprite de 80×80,
`marginTop: -20px`) na sua tabela de geometria.

### 7.2 Como cenário e decoração se combinam

`StageSetting` = `'indoor' | 'outdoor' | 'void'` · `DecorFit` = `'indoor' |
'outdoor' | 'any'`, e `decorFitsSetting` decide. `'void'` = cenário sem
decoração nenhuma.

Cada cenário (`PET_BACKGROUNDS`, `src/utils/backgrounds.ts`) declara:

- `setting` — medido em 09/09/2026: **20** `outdoor`, **5** `indoor`, **3**
  `void` (`grep -o "setting: '[a-z]*'" src/utils/backgrounds.ts | sort | uniq -c`);
- `slots` — quais espaços ele oferece. Só chão (`GROUND_SLOTS`, sem `wall`)
  para cena de céu aberto sem superfície vertical: um estandarte pendurado no
  nada pareceria bug, não decoração. `FULL_SLOTS` é o conjunto completo;
- `horizonY` — a altura (%) em que o chão começa, **≤ `GROUND_Y`**, senão o pet
  e a decoração ficam apoiados no céu. É **declarado**, e não deduzido do CSS, de
  propósito: o CSS de um cenário é uma pilha de gradientes onde "74%" tanto pode
  ser a linha do piso quanto a coordenada horizontal de uma estrela — foi
  exatamente assim que a primeira versão do teste passou sem verificar nada.
  Presente em **25** dos 28 cenários (`grep` por `horizonY:` dentro de
  `PET_BACKGROUNDS`); os 3 ausentes são exatamente os `setting: 'void'`
  (`bg-matrix`, `bg-ocean`, `bg-gameboy`);
- `baseColor` (opcional) — cor de base atrás da arte, para cenário PINTADO. O
  visor desenha a arte com `auto 100%` para não deformar o pixel nem perder a
  linha do chão; numa caixa mais larga que a proporção da arte sobra área, e é
  esta cor que preenche.

`PET_BACKGROUNDS` tem **28** entradas em 09/09/2026: 22 comuns/comprados + os 6
`bg-mission-*` liberados por missão.

Item equipado que não combina com o cenário **não é desenhado, mas a loja
explica em vez de sumir em silêncio**. Estado no save: `equippedDecor` (um item
por espaço), migrado do antigo `equippedFurniture` no load.

### 7.3 Cenários da masmorra

**Dono: `src/utils/dungeonScenes.ts`.** Cada run sorteia 5 cenas sem repetição
(`buildRunScenes`) de um pool de três origens, medido em 09/09/2026:

| conjunto | n | o que é |
|---|---|---|
| `DUNGEON_SCENES` | **5** | os clássicos em CSS puro (Tamagotchi/VHS/Sol Neon/CRT/Glitch), com overlay `dungeon-vhs` |
| `SPIRIT_BG_SCENES` | **13** | arte PINTADA: as 5 grutas originais (960×540, deitadas), 6 da segunda leva (retrato 9:16, porque o campo de batalha é uma caixa ALTA), o "Corredor em Ruínas" (nasceu como fundo do Dino e migrou) e as **2 arenas do Torneio** |
| `SHOP_BG_ACCENTS` | **16** | os cenários da loja, reaproveitados como cena de andar (`SHOP_BG_SCENES` filtra os que existem em `PET_BACKGROUNDS`) |

Comandos usados: `sed -n '<faixa>' src/utils/dungeonScenes.ts | grep -c "^  {"`
para os dois primeiros e `grep -c "':"` para o terceiro.

As duas arenas do Torneio entram AQUI, e não como fundo da página do Torneio:
aquela moldura saiu de propósito. Como CENA de um andar, a arena é conteúdo do
visor — que é exatamente a fronteira que a tese traça.

`sceneForFloor` (usada fora do sorteio) indexa `DUNGEON_SCENES` pelo andar,
clampado.

### 7.4 Decoração

**Dono da arte: `src/utils/decorArt.ts` → `DECOR_ART`.** Chave = id do item em
`src/utils/shop.ts` (`kind: 'furniture'`). Medido em 09/09/2026: **33** entradas
e **33** PNGs em `src/assets/decor/`
(`ls src/assets/decor/*.png | wc -l`) — os números batem.

Cada PNG foi desenhado EXATAMENTE para a caixa do espaço que ocupa
(`DECOR_SLOTS`); nada ali redimensiona de forma não-uniforme, só encaixa. O
briefing de arte está em `docs/BRIEF-ARTE-DECORACAO.md`.

---

## 8. A arte: de onde vem e o que nunca entra

### 8.1 De onde vem

**Toda arte vem de `src/assets/soulmon/`.** `getSpriteForStage`
(`src/utils/sprites.ts`) responde sempre com arte nossa, por três caminhos:

1. **Modo demo** — se há `demoCharacterId` e ele é uma das linhas, devolve o
   sprite daquela linha no nível pedido (`ultra` reusa `mega`).
2. **Árvore em vigor desde 07/09/2026** — `SOULMON_SPRITES` tem as **11** formas (`rookie`,
   `{champion|ultimate|mega}-{virus|data|vaccine}`, `ultra`).
3. **Save legado** — `legacySpriteForStage` escolhe uma das nossas 6 linhas por
   **hash do id** (`hashId`, base 31): determinístico, então o mesmo save
   renderiza sempre a mesma criatura em vez de embaralhar a cada load.

⚠️ **Divergência de símbolo:** `CLAUDE.md` (seção de arte) e
`src/types/progression.ts` chamam essa função de `fallbackSpriteForStage`. O
símbolo no código é **`legacySpriteForStage`** —
`grep -rn "fallbackSpriteForStage" src/` devolve 4 ocorrências, **todas em
comentário ou em teste**, nenhuma em declaração.

### 8.2 As 6 linhas próprias

**Dono do sprite: `DUNGEON_LINE_SPRITES`. Dono do NOME: `DUNGEON_LINE_NAMES`, e
só ele** (`src/utils/sprites.ts`).

| id da linha | nome exibido | artes |
|---|---|---|
| `ignar` | Ignar | rookie · champion · ultimate · mega |
| `lumel` | Lumel | idem |
| `serah` | Serah | idem |
| `kaelen` | **Pyraka** | idem |
| `orrin` | **Akashaoi** | idem |
| `thalindra` | **Nimbrata** | idem |

Os três últimos se chamavam **Pyrakamon, Akashaoimon e Nimbratamon** até
08/09/2026 ⚰️ — prefixo somado ao sufixo fixo `-mon` é o que soletra nome de
franquia alheia, e a regra do `CLAUDE.md` os proibia sem nunca ter sido aplicada
a eles. O **`id` não mudou**: é ele que resolve o sprite, vai para o save
(`demoCharacterId`) e nomeia os arquivos de arte.

Os três nomes estavam escritos à mão em TRÊS arquivos — ali, em
`PREMADE_CHARACTERS` (`src/utils/monetization.ts`) e no `petName` dos NPCs da
Biblioteca (`src/utils/libraryNpcs.ts`). Footgun 9 em forma de string: renomear
num lugar deixaria o inimigo da masmorra e o NPC chamando a MESMA criatura por
outro nome, sem nada ficar vermelho. Hoje os outros dois LEEM daqui.

`getDungeonEnemySprite(tier, excludeLine)` sorteia uma linha por tier
(`baby-i`/`baby-ii` caem no `rookie` da linha; `ultra` reusa `mega`) e **tira do
sorteio a linha que o jogador está usando** — ninguém encara um espelho de si
mesmo.

### 8.3 O que NUNCA entra

O app já embarcou **74 sprites** da Bandai (25 `*_dmc.png` + 49 `figma:asset/*`)
e vendia formas de evolução com nome de personagem registrado.
[`docs/Attributions.md`](../Attributions.md) registra a limpeza de 07/09/2026 e
o que ela achou depois do "saiu tudo": **57 ids** em `LEGACY_FORM_TIERS` no
bundle servido ⚰️ (apagada), **40 sprites** em `android/res/drawable/` (e o
`resolveSprite` caía neles para todo usuário, sempre), ~30 nomes em
`stageLabel` do `WidgetRenderer.kt`, e **242 criaturas** de franquia protegida
com a descrição oficial copiada no pool do bestiário (947 KB de JSON no bundle).

**A régua é EXECUTÁVEL e olha o BUNDLE, não o fonte:**
`src/utils/sprites.dungeonRoster.test.ts` varre `dist/assets/*.js` e
`android/res/drawable`; `pipeline.test.ts` varre o pool. O fonte não é varrido
**de propósito** — comentário some no build, e os comentários-lápide CITAM os
nomes para registrar o que não pode voltar. O guard também exige que
`DUNGEON_LINE_SPRITES` tenha exatamente **6** linhas × 4 artes, reprova o sufixo
`-mon` e reprova a volta da string duplicada de nome.

O filtro de origem do bestiário mora em `scripts/sync-oracle-data.mjs`, **na
FONTE** — senão volta no próximo `npm run sync:oracle-data`. Só ficam
procedural, fauna/flora real e mitologia.

### 8.4 O pixelizador e a geração

**`src/utils/pixelizer.ts`** — funções PURAS sobre arrays RGBA, testáveis sem
canvas; o componente de UI faz só o vai-e-vem com `<canvas>`. Converte QUALQUER
imagem em pixel art de v-pet:

- `removeLightBackground` — flood-fill a partir das bordas, tolerância padrão
  **28**: só apaga pixels quase-brancos CONECTADOS à borda, preservando áreas
  claras internas do sprite (olhos, barriga);
- `medianCutPalette` — quantização median-cut entre os pixels opacos
  (alpha ≥ 128);
- `applyPalette`, `countDistinctColors`, `pixelizeBuffer`;
- `PixelizeOptions` = `{ grid: 16|24|32|48, colors: 2–16, transparentBg }`.

**`src/utils/spriteGen.ts`** — `requestSprite` (rede), `pixelizeDataUrl`
(recorte quadrado central → redução ao grid → quantização → reamplia com pixels
duros), `generateSprite`, e a geração das N formas em sequência (evita rajada de
chamadas simultâneas; erro por forma é acumulado sem abortar as demais).

⚠️ A allowlist de **esquema** da URL de sprite é **uma função só**
(`isSafeSpriteUrl`, `src/utils/spriteLibrary.ts`), importada nos quatro pontos
que precisam dela — incluindo `pixelizeDataUrl`, que passa a URL para um `<img>`.
Dois dicionários de esquema divergiriam exatamente onde dói: um fecharia
`javascript:` e o outro não, e nada ficaria vermelho.

### 8.5 As duas variantes de prompt

**Dono: `composeSpritePrompts` (`src/utils/oracle.ts`)**, que chama
`composeSpritePrompt` duas vezes com `withReferences` `true` e `false`:

- **`imagePrompt`** — cita as referências de gênero (`GENRE_REFERENCES`) porque
  o resultado sai visivelmente melhor. **Toda criação começa por ela.**
- **`imagePromptFallback`** — o MESMO pedido sem citar ninguém. Segunda
  tentativa, usada quando o provedor recusa por política de conteúdo:
  `functions/api/generate-sprite.js` refaz sozinho, e `isRefusal` decide — erro
  que não é recusa **não** refaz, para não dobrar custo à toa.

**As duas variantes mantêm a cláusula `Do not copy any existing franchise
character`**, e há teste travando os dois lados (referências presentes na
primeira, ausentes no fallback). Citar inspiração não é licença para devolver
personagem registrado: o sprite vai para o app de um usuário real.

O restante do prompt é o mesmo nos dois: `Retro virtual-pet sprite, 16x16 pixel
art, no background, transparent background`, cores chapadas com acento, `no
shading, no outlines, no anti-aliasing`, e um pedido explícito de **não tingir a
criatura inteira numa matiz só** (escala de cinza é exceção permitida — preto e
branco lê como escolha de arte, enquanto o bicho tingido de um vermelho só
parece filtro).

---

## 9. Identidade sonora

> Este documento **descreve**. Quem decide é
> [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §6.1 (**S1..S13**),
> e o guia operacional é [`docs/SOM.md`](../SOM.md). Não altere som a partir
> daqui.

### 9.1 Os 8 sons

**`src/utils/sounds.ts`** — síntese procedural, **zero byte de asset**. Os oito
símbolos exportados, com a categoria que `CATEGORIA_DO_SOM` (`loudness.ts`) lhes
atribui:

| símbolo | categoria | alvo (LUFS-M) |
|---|---|---|
| `playEvolve` | `marco` | −16,0 |
| `playPresence` | `presenca` | −16,0 |
| `playDegenerate` | `degeneracao` | −16,0 |
| `playVisorTune` | `sintonia` | −19,0 |
| `playFeed` | `cuidado` | −19,0 |
| `playShower` | `cuidado` | −19,0 |
| `playSleep` | `cuidado` | −19,0 |
| `playTaskComplete` | `conclusao` | −22,0 |

Mais `isMuted` / `setMuted` (o gate de mudo, lendo `STORAGE_KEYS.SOUND_MUTED`).

⚠️ **O `AudioContext`-por-chamada não existe mais** ⚰️ — morreu na Fase 2 do run
`som-01`. A função interna `play` é, desde então, **só** o gate de mudo, e o gate vem
ANTES de qualquer construção de nó: com `SOUND_MUTED`, `tocarNa` nunca é chamada
e **nenhum nó é criado**, nem o barramento. Contexto construído para "não tocar"
já é plumbing vazando.

### 9.2 O barramento — `src/utils/audioBus.ts`

Um contexto compartilhado, sub-mix por categoria, master com limitador no teto
S3, e os dois duckings:

```
fonte → bus da categoria → bus SFX → duckGeral → master → limitador → saída
                ↑ Arcade passa antes pelo duckArcade (D-2)
camadas da trilha → bus Trilha → duckGeral ↑
Marco → master  (NÃO passa pelo duckGeral: ele é quem duca — D-1)
```

Constantes: `D1_ATAQUE_S` `0.12` · `D1_LIBERACAO_S` `0.8` · `D2_ATAQUE_S` `0.12`
· `D2_LIBERACAO_S` `0.4` · `D2_PROFUNDIDADE_DB` `-9.0` · `RAMPA_MINIMA_S`
`0.005`. Funções de fronteira: `tocarNa` (despacho) e `liberarMarco`.

**A R-EX vive no despacho de `tocarNa`**: `JANELA_DE_COINCIDENCIA_MS` = **120**.
Dois `play*` a ≤120 ms são o **mesmo gesto**: toca a de classe mais alta;
empate → a menos repetida; empate → a do gesto (não a da consequência); empate →
a primeira despachada. **A perdedora é DESCARTADA, nunca enfileirada** — o
limitador não resolve colisão (medido: fez **0,00 dB** sobre uma soma de
**+4,58 dB**), e enfileirar transformaria um gesto em dois sons.

⚠️ **Não confundir os dois `120`**: `D1_ATAQUE_S` = 0,12 s é o tempo em que o
Marco ABAIXA o resto (*ducking*: atenua, não exclui); `JANELA_DE_COINCIDENCIA_MS`
é *despacho*: decide quantas fontes começam. Coincidem porque vêm da mesma
origem — `--sm-dur-1` do plano de design, "feedback de toque" — não porque um é o
outro. **Régua:** `src/utils/audioBus.rex.test.ts`.

Quatro restrições que o arquivo não pode quebrar: **autoplay** (contexto criado
preguiçosamente na primeira `tocarNa`, dentro de um handler de gesto; `resume()`
explícito a cada tentativa); **D11**; **mudo total**; e **não vazar** (contexto
suspenso com a aba oculta, fechado em `pagehide`, e reconstruído sozinho se o
cache estiver `closed` — sem isso um `pagehide` seguido de volta pelo bfcache
deixaria o app mudo para sempre, sem erro nenhum).

### 9.3 A política — `src/utils/loudness.ts`, dono único

**Alvo de loudness NUNCA se escreve à mão em outro arquivo.** A política tem
dono único e há guard que reprova a cópia.

`TETO_DBTP` = **−1,0** (true peak, oversampling ≥4×) · `TETO_LUFS_INTEGRADO` =
**−16,0** · `TOLERANCIA_LU` = **1,0** · `DEGRAU_DB` = **3,0** (DERIVADO — razão
de 2× em escala sone; por isso não existe meio-degrau) · `ALVO_TRILHA_LUFS_S` =
**−28,0** · `OFFSET_MAX_DB` = **20** · `GANHO_DE_CATEGORIA_DB` = **0,0**.

`ORDEM_DA_ESCADA` existe como declaração SEPARADA de `ALVO_LUFS_M` para o teste
poder provar que a ordem foi preservada — um `Object.keys` provaria só que o
mapa é igual a si mesmo. **A ordem é por REPETIÇÃO, nunca por importância: quem
repete mais entra mais baixo.**

`OFFSET_POR_SOM_DB` é a CALIBRAÇÃO (`alvo − LUFS-M medido`), medida no motor real
(Chrome 152.0.7977.76, 09/09/2026). `OFFSET_MAX_DB` = 20 nasceu de uma medição:
a forma de 180 ms do `playVisorTune` pedia **+36 dB** para alcançar o alvo, e o
conserto não era o ganho — era o envelope e a duração. ⚰️ Aquele offset de
36,176 dB está morto; o vigente é o da forma de 400 ms com platô (0,037 dB).

### 9.4 As regras que mordem em código

| Regra | O que diz | Régua |
|---|---|---|
| **D11** | som **só por gesto** do usuário; nunca agendado, nunca com `document.hidden`. A fronteira é o **pacote inteiro**: mora no CHAMADOR tanto quanto em `sounds.ts` | `src/components/sintonia-chiado.render.test.tsx` (call-site) + `src/utils/sounds.contract.test.ts` |
| **R-CAT** | a categoria de um som vem do **EVENTO**, nunca do nível medido do arquivo. Categoria com um único membro só se o perfil de repetição dele não coincidir com nenhum outro | `src/utils/loudness.contract.test.ts` (AC-4 cobertura, AC-5 plausibilidade, escada) |
| **R-EX** | um gesto, uma fonte; perdedora descartada | `src/utils/audioBus.rex.test.ts` |
| **R-NOVA** | **toda superfície nova nasce MUDA** | `src/utils/cortes.contract.test.ts` |

⚠️ `sounds.ts` **não tem uma única checagem de `document.hidden` em código** —
só a prosa do cabeçalho. O precedente de teste que prova a D11 é o do call-site.

O preço da R-NOVA está medido: `src/components/ArenaGame.tsx` nasceu **21
minutos antes** do commit dos cortes, reintroduziu dois sons já cortados
(`playTaskComplete` em morte de inimigo e `playFeed` no especial) e **3.974
testes passaram verdes**. O defeito não foi a tela — foi a ausência de régua para
superfície nova. A régua dos 9 cortes trata os cortes como **dados** (`CORTES`),
com uma asserção só: corte novo é uma linha na tabela, não um teste novo.

### 9.5 O que está congelado

- **S11** — o carinho **não** ganha som próprio: o gesto já tem som (a Presença,
  1×/sessão por D11). O carinho é o evento mais repetido do app (`rubTick`
  dispara a cada 2000 ms de arrasto) e motivo que se repete está proibido.
  **Custo zero**: nenhuma amostra, nenhum byte, nenhuma categoria.
- **S12** — a Arena fica **muda**; se um dia tiver som será a classe `arcade`
  genérica, sem uma única amostra própria.
- **S13** — o contrato adaptativo E0–E6 da trilha está **CONGELADO** como
  proposta não verificada. Duas peças foram extraídas e valem sozinhas: **E0**
  (`document.hidden` · app sem foco · `isSleeping` · janela de descanso), que é
  D11 + S2 sobre o pacote inteiro, e a **chave da trilha separada de
  `SOUND_MUTED`**. Recarregar crédito no gerador **não** descongela.
- **S10** — o som PROCEDURAL é a solução provisória; os prompts de IA estão
  prontos e engatilhados (a conta do gerador está em 0,45 crédito e o piloto A/B
  não rodou).

O runbook completo vive em `squad-alpha-runs/som-01/maintainer/`, que **não vai
para o git** — por isso `docs/SOM.md` existe: é a parte que precisa sobreviver.

---

## 10. PWA, marca e splash

### 10.1 `public/manifest.json`

⚠️ O arquivo é **`public/manifest.json`**, não `manifest.webmanifest`
(`index.html` aponta `<link rel="manifest" href="/manifest.json">`).

| campo | valor |
|---|---|
| `short_name` | `Soulmon` |
| `name` | `Soulmon - Gamified Productivity` |
| `description` | `Complete real-life tasks to evolve and care for your digital companion in this retro pixel-art productivity app` |
| `icons` | `/favicon-192x192.png` e `/favicon-512x512.png`, ambos `purpose: "any maskable"` |
| `start_url` / `scope` | `/` |
| `display` | `standalone` |
| `orientation` | `portrait-primary` |
| `theme_color` | `#0d9488` |
| `background_color` | `#f3f9f8` |
| `categories` | `productivity`, `lifestyle`, `games` |
| `lang` / `dir` | `pt-BR` / `ltr` |

Duas observações medidas, sem proposta:

1. **`theme_color: "#0d9488"`** é o valor que `--sm-primary` **deixou de ter** —
   o CSS registra que `#0d9488` media 3,74:1 nos dois papéis e foi trocado por
   `#0f766e`. O `index.html` repete `#0d9488` no `<meta name="theme-color">` do
   esquema claro (e `#0c1c1a` no escuro, que não é nenhum token declarado). O
   manifesto não segue o tema escuro canônico.
2. **`lang: "pt-BR"`** enquanto a regra de idioma do projeto é "inglês é a base,
   PT-BR é localização" (`CLAUDE.md`).

Ícones em `public/`: `favicon.svg` (250 B), `favicon-192x192.png` (31.292 B),
`favicon-512x512.png` (175.448 B). O `index.html` declara **dois** deles
(`favicon.svg` e o de 192px) e usa o de 192px também como `apple-touch-icon`; o
de 512px só existe no manifesto. `<title>` = `Soulmon`.

### 10.2 O splash — o aparelho ligando

O `#splash` vive **inline no `index.html`** (nada de bundle no caminho crítico) e
é uma peça de identidade completa: **é o VISOR do aparelho ligando**, e por isso
usa os tokens do **tema ESCURO copiados literalmente** para dentro do seu próprio
escopo — `--sm2-viewport-bg: #071413`, `--sm2-viewport-ink: #E9F5F2`,
`--sm2-surface: #0F2A29`, `--sm2-surface-2: #163735`, `--sm2-line: #1E3F3C`,
`--sm2-muted: #9DBCB4`, `--sm2-primary-ink: #5FF3E0`, `--sm2-primary-deep:
#29C9B8`, mais `--sm2-text-sm: 14px`, `--sm2-text-2xl: 32px` e
`--sm2-radius-sm: 4px`.

Composição: uma **chama em pixel art como SVG inline** (12×16, **109** `<rect>` —
`grep -o '<rect' index.html | wc -l`, medido em 10/09/2026 —,
`shape-rendering: crispEdges`, `image-rendering: pixelated`, animação
`sp-flick`), o wordmark `SOULMON` em `--sm2-text-2xl`, a linha `LOADING DATA...`,
uma barra de 8 segmentos animados e o selo `SOUL_LINK ESTABLISHED`, mais três
cristais em `clip-path`.

Quatro decisões medidas ali dentro:

- Os `fill` do sprite estão como ATRIBUTO no SVG (pixel art é markup, não CSS).
  Atributo de apresentação perde para qualquer regra CSS, então os dois tons
  entram por token (`#5df0e0` → `--sm2-primary-ink`, `#d8fffa` →
  `--sm2-viewport-ink`) **sem tocar nos 109 `rect`**.
- `background-color` é declarado **separado** das camadas decorativas: se
  `color-mix` não for suportado, o navegador descarta só o `background-image` e a
  tela continua com o fundo do visor, em vez de cair para transparente.
- A pilha de fonte do splash é
  `'Silkscreen', 'Courier New', 'DejaVu Sans Mono', monospace` — o fallback é uma
  face de máquina de escrever CONCRETA e não `ui-monospace` (que `tokens.md` §4
  proíbe por ser indistinguível da Rubik em tamanho pequeno), porque a Silkscreen
  chega com o bundle e **não é preloadada**: baixar fonte nova no caminho crítico
  atrasaria o LCP desta própria tela.
- O selo `SOUL_LINK` **era um selo dentro de uma caixa com borda de cobre de
  2px** ⚰️. A caixa saiu: o que informa é a palavra, não a moldura — a mesma
  regra do dono que tirou a placa do ícone.

Um script inline localiza o splash sem esperar o bundle (`CARREGANDO DADOS...` /
`SOUL_LINK ESTABELECIDO` quando `navigator.language` começa com `pt`).

⚠️ `docs/INVENTARIO-TELAS.md` §0 registra um resíduo do splash no DOM em TODAS as
telas (o `innerText` termina com `SOULMON / LOADING DATA... / SOUL_LINK
ESTABLISHED`), medido com `height: 0` depois do resize — pendência de
verificação visual desde 19/08/2026, não confirmada nem refutada aqui.

---

## 11. No ar × plano

Item por item de [`docs/PLANO-DESIGN.md`](../PLANO-DESIGN.md) §0 e §1, contra o
CSS e o código medidos em 09/09/2026.

### 11.1 §0 — o que o plano assume como fechado

| # | Item do plano | Estado | Evidência |
|---|---|---|---|
| 1 | Fronteira diegética "O Visor" | **parcial** | `Viewport` existe e é usado por 4 componentes de produção; ao mesmo tempo o kit pixel `.sm-px-*` aparece em 28 `.tsx` de produção — há pixel FORA do visor |
| 2 | Bisel 20px · tela 12px · anel 4px · visor escuro nos dois temas · `pixelated` com escala INTEIRA · grid de 4px | **no ar**, exceto o grid | `.sm2-viewport` (`padding: 4px`), `.sm2-viewport-screen` (`--sm2-radius-md` 12px, `image-rendering: pixelated`), `ViewportProps.scale: 2 \| 3`, `--sm2-viewport-bg` nos dois temas. **Não existe token de espaço**: `--sm-space-1..6` → `grep` devolve 0 |
| 3 | Paleta ciano-turquesa como única luz forte; cobre; petróleo. Tinta ≠ fill | **no ar, com outros nomes** | `--sm2-primary-*` (ciano), `--sm2-gold-*`/`--sm2-viewport-ring` (cobre), `--sm2-bg`/`--sm2-viewport-bg` (petróleo). Régua de tinta×fill em `src/styles/tokens.contrast.test.ts` |
| 4 | Silkscreen = voz do dispositivo, ≥14px, caixa alta, nunca frase inteira. Fredoka = títulos. Rubik = texto e dado com `tabular-nums` | **no ar, com uma exceção** | `.sm2-device-voice`, `--sm2-font-display`, `--sm2-font-text`, `.sm2-num`. ⚠️ `.sm-bottom-nav-label` usa Silkscreen em `--sm2-text-xs` = 12px, fora do visor e abaixo do piso |
| 5 | Material Symbols Rounded variável; `FILL` 0→1 como sistema de estado; `opsz` casado; `wght` 500 | **no ar** | `src/components/ui/Icon.tsx` — as quatro props e os quatro eixos, com clamp de `opsz` em 20–48 |
| 6 | Dentro do visor `steps()`; fora, 120/200/320ms; `prefers-reduced-motion` obrigatório | **no ar**, com uma quarta duração | `--sm2-dur-tap/enter/page` + `--sm2-ease`; `--sm2-dur-scan` 400ms acrescentada com justificativa; 1 declaração de `steps()` no CSS (§6.3) e mais três no call-site; 8 blocos de movimento reduzido |
| 7 | Regras do dono: ícone nunca em box · sublinhado ciano na nav · `.sm-pet-sticky` · `index.css` único CSS · não reintroduzir `--foreground`/`--background` | **no ar** | §5.4, §6.5, §3.1 deste doc; réguas em `src/styles/tokens.contrast.test.ts` e `src/index.css.contract.test.ts` |
| 8 | Teste de aceitação: recorte de 200×200px sem logo | **sem régua** | critério humano; não há teste |

### 11.2 §1 — os tokens que o plano dizia precisar existir

Nenhum dos nomes propostos pelo plano foi criado. Medido com
`grep -c -- '<token>:' src/index.css` — **todos devolvem 0**:

| Proposto no plano §1 | Existe? | O que ficou no lugar |
|---|---|---|
| `--sm-ciano-fill` / `--sm-ciano-ink` / `--sm-ciano-on` | **não** | `--sm2-primary-fill` / `--sm2-primary-ink` / `--sm2-on-primary` |
| `--sm-cobre-fill` / `--sm-cobre-ink` / `--sm-cobre-on` | **não** | `--sm2-gold-fill` / `--sm2-gold-ink` / `--sm2-on-gold` (e `--sm2-viewport-ring` para o anel) |
| `--sm-petroleo-900` (visor, mesmo valor nos dois temas) | **não** | `--sm2-viewport-bg` — e ele **não** tem o mesmo valor nos dois temas (`#0E2422` claro / `#071413` escuro); o que é invariante é ser ESCURO nos dois |
| `--sm-petroleo-700` / `--sm-casco-100` | **não** | `--sm2-bg` nos dois temas |
| `--sm-ink-muted` | **não** | `--sm2-muted` |
| `--sm-perigo-fill` / `--sm-perigo-ink` | **não** | `--sm2-danger-fill` / `--sm2-danger-ink` (+ `--sm2-viewport-danger` para dentro do vidro) |
| `--sm-sucesso-fill` / `--sm-sucesso-ink` | **não** | `--sm-ok-ink` — declarado e **sem consumidor** (§2.7) |
| `--sm-space-1..6` (grid de 4) | **não** | nenhum token de espaço; espaçamento é literal |
| `--sm-r-sm/md/lg/visor` | **não** | `--sm2-radius-sm/md/lg` (4/12/20px), sem degrau próprio de visor |
| `--sm-bisel` / `--sm-tela` / `--sm-anel` | **não** | valores literais em `.sm2-viewport` e `.sm2-device` |
| `--sm-toque-min` 44px | **não** | `.sm-btn { min-height: 44px }`, `.sm-px-switch { height: 44px }` — literais (`.sm-tap-44` saiu em 20/09/2026: o contador de adiamentos passou a ser um botão de 44 de verdade, D-A4) |
| `--sm-dur-1/2/3` · `--sm-ease` · `--sm-steps` | **não** | `--sm2-dur-tap/enter/page` + `--sm2-ease`; `steps()` escrito no call-site |
| **Guarda sugerida**: teste varrendo `index.css` atrás de `color: var(--sm-*-fill)` | **existe, no conjunto novo** | `src/styles/tokens.contrast.test.ts` prova que todo acento tem o trio `ink`/`fill`/`on-` e que `gold-ink` ≠ `gold-fill`. E `grep -nE "^\s*color: var\(--sm2-[a-z]+-fill\)" src/index.css \| wc -l` → **0** |
| **`src/components/SmIcon.tsx`** como dono único do ícone | **não existe com esse nome** | `src/components/ui/Icon.tsx` → `Icon` faz o papel, com a mesma API (`name`/`size`/`fill`/`weight`/`tone`/`label`) e mais um motor de glifo próprio (`NavGlyphs`) que o plano não previa |
| `RowIcon.tsx` absorvido e apagado | **cumprido** | `find src -name "RowIcon*"` → nada |
| `iconRegistry.ts` (142 PNGs) descartado | **cumprido** | `find src -name "iconRegistry*"` → nada |

### 11.3 Onda 0 — a demolição, item por item

| Item da Onda 0 | Estado em 09/09/2026 | Evidência |
|---|---|---|
| Apagar `ArenaGame.tsx` | **não cumprido** — o arquivo existe | `ls src/components/ArenaGame.tsx`. Ele foi, aliás, a causa-raiz da R-NOVA (§9.4) |
| Tirar `OraclePage.tsx` do bundle (mover para `src/dev/`) | **não cumprido** — segue em `src/components/` | `find src -name "OraclePage*"` |
| `src/components/ui/` (44 arquivos shadcn) morre inteiro | **quase** — restam **8** entradas, das quais 5 são peças NOVAS do kit (`Icon`, `NavGlyphs`, `OfflineSeal`, `ScreenSkeleton`, `Viewport`) + 2 testes; o único sobrevivente shadcn é `sonner.tsx`, que o próprio plano isentava até a Onda 4 | `ls src/components/ui/ \| wc -l` |
| `lucide-react` sai | **parcial** — **8** arquivos `.tsx` ainda importam | `grep -rl "lucide-react" src --include=*.tsx`: `AISettingsModal`, `SettingsModal`, `TournamentPage`, `SettingsPage`, `ChatBox`, `SoulmonOnboarding`, `LibraryPage`, `GameTutorialFlow` |

---

## 12. Achado: `brand/design-system.md` é de OUTRO produto

⚠️ **`brand/design-system.md` NÃO é o design system do Soulmon.** É o design
system da **Consultech360**, um produto diferente: o cabeçalho diz
`# Consultech360 — Design System`, o posicionamento declarado é *"Plataforma de
Conexão 360°"*, e a paleta é Azul Corporativo + Ciano Elétrico + Cinza Grafite.
Nenhum token, cor ou fonte dele aparece em `src/index.css`.

**Não use esse arquivo como fonte de identidade do Soulmon.** A identidade viva
é: `src/index.css` (tokens e classes) + [`src/styles/tokens.md`](../../src/styles/tokens.md)
(contrato do conjunto `--sm2-*`) + [`docs/PLANO-DESIGN.md`](../PLANO-DESIGN.md)
(a direção de arte, com a ressalva do §11 acima) + as réguas em `src/styles/`.

Referências visuais de verdade, como imagem, ficam em `docs/design-reference/`
(mockup da Home, tela de loading, logo, mascote original, kit de UI) e em
`docs/ui-refs/` (Home, kit v1.2, splash, os três ícones de atributo) — `ls`
nas duas pastas, 09/09/2026.

---

## 13. Divergências registradas neste documento

Lista fechada, para o `STATUS.md`. Todas medidas em 09/09/2026.

| # | Onde | Divergência |
|---|---|---|
| 1 | `CLAUDE.md` › UI × `src/styles/tokens.md` §6.1 | escala de ícone: o `CLAUDE.md` diz "nav 36px / ações 42px / chat 30px"; o código não tem nenhum desses três (`grep -rho "size={36}\|size={42}\|size={30}" src --include=*.tsx` → 0). A escala viva é 20 / 24 / 32 |
| 2 | `CLAUDE.md` › arte e `src/types/progression.ts` × `src/utils/sprites.ts` | o símbolo é `legacySpriteForStage`; `fallbackSpriteForStage` só existe em comentário e em teste |
| 3 | `docs/INVENTARIO-TELAS.md` §1.1 (19/08/2026) × repositório | 60 PNGs de ícone → **57**; 158 PNGs em `src/assets/soulmon/` → **1198** |
| 4 | `src/index.css` × `src/` inteiro | seis tokens `--sm-*` declarados **sem nenhum consumidor**: `--sm-gold-soft`, `--sm-danger-soft`, `--sm-energy`, `--sm-energy-track`, `--sm-ok-ink`, `--sm-help-accent` |
| 5 | `public/manifest.json` × `src/index.css` | `theme_color: "#0d9488"` é o valor que `--sm-primary` abandonou por reprovar em contraste (3,74:1); e `lang: "pt-BR"` contra a regra "inglês é a base" |
| 6 | `docs/PLANO-DESIGN.md` §0 item 1 × código | a fronteira "pixel dentro, limpo fora" não é exclusiva: kit pixel em 28 `.tsx` de produção, fora do `Viewport` |
| 7 | `docs/PLANO-DESIGN.md` §0 item 4 × `src/index.css` | Silkscreen a 12px na `.sm-bottom-nav-label`, fora do visor e abaixo do piso de 14px declarado |
| 8 | `docs/PLANO-DESIGN.md` Onda 0 × código | `ArenaGame.tsx` e `OraclePage.tsx` continuam no bundle; `lucide-react` em 8 arquivos |
| 9 | `brand/design-system.md` × produto | o arquivo é da **Consultech360**, não do Soulmon |
| 10 | `src/contexts/ThemeContext.tsx` × expectativa do nome | o modo `'system'` **não** segue o SO: `resolveSystemPreference()` devolve `'dark'` sempre. Intencional e justificado no código; **régua: nenhuma** |
| 11 | `docs/PALCO-E-DECORACAO.md` × `src/utils/petStage.ts` | `GROUND_Y` = 74 é a conta do sprite de 80px; o sprite é `PET_BOX` = 152 e a origem real é `PET_TOP_OFFSET` = −38. O código e o doc já registram o desvio; a conta do palco **não foi refeita** |
