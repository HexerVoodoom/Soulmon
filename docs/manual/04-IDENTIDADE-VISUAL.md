# Identidade visual e sonora do Soulmon

> **Dono:** doc-redator-identidade · **Data:** 21/09/2026 · **Estado:** verificado em 21/09/2026 por doc-verificador (delta `9f4e5a7a..f9faf7a7`, QA geral — só as passagens que o diff tocou, conferidas por grep; anterior: delta `dc72579e..9875477b`, conferido em `5ac3d351`: rodada 2 da SQUAD-ARTE, SQUAD-SOM retomada, superfície de suporte do chat) · §9 verificado em 21/09/2026 por doc-verificador (delta `5ac3d351..8d318529`: S16, trilha em duas camadas, escolha do dono nos 3 eventos longos, chaves na `SettingsPage`)
> **Verificação:** `npx vitest run src/styles/ src/index.css.contract.test.ts src/utils/sprites.dungeonRoster.test.ts src/utils/loudness.contract.test.ts src/utils/cortes.contract.test.ts src/utils/sonsAssets.contract.test.ts src/components/ui/Viewport.contract.test.tsx src/components/ui/foundation.render.test.tsx src/brand/brandFlame.parity.test.ts src/assets/assets.contract.test.ts` — os 11 arquivos de 09/09/2026 (216 testes, verde) mais os dois que nasceram com a marca vetorizada e a leva de arte de 15/09/2026, mais `sonsAssets.contract.test.ts` (21/09/2026, S16).
> **Não cobre:** o fluxo entre telas e o que cada superfície mostra (doc `03-FLUXO-DE-TELAS.md`); as regras de jogo por trás dos números que a UI pinta (doc `02-REGRAS-DE-NEGOCIO.md`); a assinatura de cada componente (`06-REFERENCIA/components.md`); o pipeline de build/deploy dos assets (doc `08-INTEGRACOES-E-DEPLOY.md`). Este doc descreve o som — **não** decide nada sobre ele: quem decide é o `REGISTRO-DE-DECISOES.md` (§6.1, S1..S16 — não existe S14).
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

**O que o código confirma**, medido em 09/09/2026 e remedido em 20/09/2026 onde a
linha diz:

| Peça da tese | Onde está no código | Estado |
|---|---|---|
| A fronteira existe como componente | `src/components/ui/Viewport.tsx` → `Viewport` | **no ar** |
| O interior é escuro nos DOIS temas | `--sm2-viewport-bg` = `#0E2422` (claro) / `#071413` (escuro) | **no ar**, com régua |
| Anel de cobre de 4px | `.sm2-viewport` em `src/index.css` — `padding: 4px` + `inset 0 0 0 2px` de `--sm2-viewport-ring-deep` | **no ar** |
| Bisel externo de 20px | ⚰️ **não existe mais como peça**: `.sm2-device` (16px de corpo) saiu em 16/09/2026 (canvas Home, D-H1 — a PÁGINA é o corpo do aparelho; sobram só anel + vidro). O que resta é o anel de 4px de `.sm2-viewport` | **saiu** (o nome `.sm2-device` fica reservado, ver §4.2) |
| Tela interna de 12px de raio | `.sm2-viewport-screen` usa `--sm2-radius-md` = `12px` | **no ar** |
| Escala INTEIRA do sprite | `ViewportProps.scale` aceita literalmente `2 \| 3` (tipo), e a largura é derivada (`width * scale`) | **no ar**, travado pelo tipo |
| `image-rendering: pixelated` | `.sm2-viewport-screen` e seus `img`/`canvas` | **no ar** |
| Um único reflexo + vinheta de 12% | `.sm2-viewport-glass`, `pointer-events: none` | **no ar** |
| Sem scanline permanente | não há overlay de listras em `.sm2-viewport-screen`; a varredura de `--sm2-dur-scan` passa uma vez e sai do DOM | **no ar** |

**O que o código NÃO confirma** (medido em 09/09/2026, comandos abaixo):

- **A fronteira ficou quase exclusiva na Fase 2.** Em 09/09/2026 o `Viewport`
  era consumido por **4** componentes de produção e o **kit pixel antigo**
  (`.sm-px-*`, arte 9-slice em PNG, Silkscreen) aparecia em **28** arquivos
  `.tsx` de produção com **82** classes distintas. Remedido em 20/09/2026, depois
  dos 14 canvases da Fase 2 (`docs/design/DECISOES-WIREFRAME.md` §18–§25):
  `grep -rl "<Viewport" src --include=*.tsx | grep -v test | wc -l` → **12**;
  `grep -rl "sm-px-" src --include=*.tsx | grep -v test | wc -l` → **14**, com
  **13** classes distintas (`grep -rho "sm-px-[a-z0-9-]*" src --include=*.tsx |
  sort -u | wc -l`). O que era pixel fora do visor virou vetor sobre `--sm2-*`
  (`PixelKit` em vetor, `a482dfd5`, 16/09/2026 — a API `Pixel*` ficou; o
  9-slice PNG, o chanfro de cobre e a Silkscreen fora do vidro saíram). O que
  ainda cita `.sm-px-*` é resíduo, não tese.
- ⚰️ **A `.sm-bottom-nav-label` NÃO desenha mais Silkscreen.** Até 16/09/2026
  ela usava Silkscreen em `--sm2-text-xs` = `12px`, fora do visor e abaixo do
  piso de 14px. Desde o canvas Home (`NavEstados`, SIS achado 3) a regra é
  `font-family: var(--sm2-font-text)` (Rubik) 12/500, caixa mista,
  `text-transform: none` — Silkscreen só dentro do vidro e em selos.
  Réguas: `src/styles/navRotulo.contract.test.ts` e
  `src/components/BottomNav.render.test.tsx` medem a fonte.

O **teste de aceitação da identidade** do plano ("recorte de 200×200px sem logo:
dá para dizer que é o Soulmon?") **não tem régua executável** — é critério
humano, e continua sendo.

---

## 2. Os 41 tokens `--sm-*` (eram 55)

Medição: `grep -o -- '--sm-[a-z0-9-]*:' src/index.css | sort -u | wc -l` →
**41** em 20/09/2026, remedido igual em 21/09/2026 (era **55** em 09/09/2026).
`wc -l src/index.css` → **7516** em 21/09/2026 (7481 em 20/09; era 7678). As 35
linhas novas são duas classes, `.sm2-chat-support` e `.sm2-chat-support-link`
(`6ad2e629` e `f3654076`, 21/09/2026): a superfície de suporte do chat, par visual da
cláusula SAFETY de `functions/api/chat.js`. **Discrição é requisito clínico,
não escolha de estilo** — corpo `12px` (⚰️ nasceu com `11px`, abaixo do piso
absoluto do §4.3; subiu no QA geral de 21/09/2026, `f9faf7a7` — o guard da escala
só olha `--sm2-text-*`, não literais), `color: var(--sm-muted)`, `max-width:
62ch`, sem ícone, sem caixa e sem cor de alerta (nada de `--sm2-danger-*`); o
link é `color: inherit` + sublinhado sempre (decisão do dono, 21/09/2026: em
texto `muted` pequeno, cor sozinha não sinaliza link). Nenhum token novo; o
contraste é o do `--sm-muted` do tema (§3.1). O fluxo em que ela aparece é do
doc `03-FLUXO-DE-TELAS.md`. ⚰️ Os **14** que saíram são todos do kit pixel antigo,
removidos em `f318984f` (16/09/2026, "remove as regras `.sm-px-*` que o kit
vetor deixou sem consumidor"): `--sm-px-bw`, `--sm-px-chip-bg`,
`--sm-px-copper-ink`, `--sm-px-cyan-ink`, `--sm-px-off-bg`, `--sm-px-off-edge`,
`--sm-px-off-ink`, `--sm-px-sel-bg`, `--sm-px-sel-edge`, `--sm-px-sel-ink`,
`--sm-px-slice`, `--sm-px-src`, `--sm-px-track`, `--sm-px-track-line`
(`comm -23` entre os inventários de `2580b73a` e `dc72579e`). Nenhum `--sm-*`
novo nasceu — o que nasce, nasce `--sm2-*` (§2.8).

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
nos dois papéis; `#0f766e` mede **5,47:1** nos dois. O `public/manifest.json` declarou
`"theme_color": "#0d9488"` até 15/09/2026 ⚰️ — desde `005a2941` é `#0f766e`
(ver §10.1).

### 2.2 Kit pixel — primitivos

Declarados num `:root` sem par de tema, de propósito: a peça do kit é escura
por natureza (cobre sobre teal profundo), e no tema claro ela vira um objeto
escuro sobre página clara.

| token | claro | escuro | para quê | um uso |
|---|---|---|---|---|
| `--sm-px-ink` | `#eaf5f2` | — | tinta DENTRO de peça escura | **nenhum** desde 16/09/2026 (`.sm-px-btn` saiu ⚰️) — ver §2.7 |
| `--sm-px-cyan` | `#5df0e0` | — | neon do kit (destaque/aceso) — **decorativo** | `.sm-bottom-nav-btn-on::after` (sublinhado) e o `outline` de foco de `.sm-bottom-nav-btn` |
| `--sm-px-copper` | `#c68642` | — | cobre do kit (moldura/borda fina) — **decorativo** | `.sm-bottom-nav` (`border-top`), `.sm-px-field` (`border`) |
| `--sm-px-track` · `--sm-px-track-line` | ⚰️ | — | eram o trilho e a linha da barra segmentada `.sm-px-bar` | **saíram em 16/09/2026** — a barra é `VisorBar` (pixel, dentro do vidro) ou medidor do kit vetor |
| `--sm-px-panel-bg` | `var(--sm-surface)` | `#10312f` | fundo do painel do kit | **nenhum** desde 16/09/2026 (`.sm-px-panel` saiu ⚰️) — ver §2.7 |
| `--sm-px-panel-ink` | `var(--sm-ink)` | `var(--sm-ink)` | tinta do painel do kit | **nenhum** desde 16/09/2026 — ver §2.7 |
| `--sm-px-chip-bg` | ⚰️ | — | era o fundo do chip do kit `.sm-px-chip` | **saiu em 16/09/2026** — chip é `.sm2-kit-*` |
| `--sm-px-red` | `#ff5d5d` | — | vermelho de sinal do kit | **nenhum** desde 16/09/2026 (`.sm-px-chat-btn-rec` saiu ⚰️) — ver §2.7 |

Das **21** classes `.sm-px-*` que restam no CSS em 20/09/2026
(`grep -o '\.sm-px-[a-z0-9-]*' src/index.css | sort -u | wc -l`; eram 100),
as vivas são as da nav antiga, do campo de formulário (`.sm-px-field`), do
`.sm-px-fab`, do `.sm-px-card`, da árvore (`.sm-px-tree-*`, `.sm-px-node-*`),
do chat (`.sm-px-chat-*`) e do arcade — todas candidatas à mesma saída.

**A regra de uso que não pode se perder** (escrita no CSS, no bloco dos pares
`*-ink`): decorativo — fundo, véu, brilho, moldura de peça escura — usa
`--sm-px-cyan` / `--sm-px-copper`; **texto ou borda que carrega significado** usa
o par `*-ink` de §2.6. Motivo medido: sobre a superfície do tema CLARO o ciano
mede **1,40:1** e o cobre **3,05:1**, contra os 4,5:1 exigidos de texto normal.

### 2.3 Kit pixel — seleção ⚰️ (saiu em 16/09/2026)

Os seis tokens desta seção **não existem mais** (`grep -c -- '--sm-px-sel-bg:'
src/index.css` → 0 em 20/09/2026): `--sm-px-sel-bg`, `--sm-px-sel-ink`,
`--sm-px-sel-edge`, `--sm-px-off-bg`, `--sm-px-off-ink`, `--sm-px-off-edge`
saíram com as abas/chips do kit pixel (`f318984f`). A REGRA que eles
carregavam continua, agora no kit vetor (`.sm2-kit-*`, §2.8): **o
PREENCHIMENTO carrega a seleção; o não-selecionado nunca é preenchido**, com
`--sm2-primary-fill` + `--sm2-on-primary` no lado selecionado. Era, até
16/09/2026: `--sm-px-sel-bg` `#0d3b39` claro / `#5df0e0` escuro,
`--sm-px-sel-ink` `#f2fbf9` / `#04211f`, e o não-selecionado `transparent` com
borda em cobre a 45%.

### 2.4 Kit pixel — geometria da arte 9-slice e do chanfro

Destes seis, **três morreram em 16/09/2026** ⚰️ com o 9-slice em PNG
(`a482dfd5`: "PixelKit em vetor sobre `--sm2-*`, mesma API; zero PNG de
botão"): `--sm-px-src`, `--sm-px-slice` e `--sm-px-bw` — eram a arte
9-slice setada inline pelo componente, a fatia no PNG (82/66/43) e a
espessura renderizada (11/12px). Os três do chanfro continuam, como
**parâmetros de forma**:

| token | valor base | para quê | um uso |
|---|---|---|---|
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
| `--sm-ok-ink` | `#177a00` (5,16:1) | `#22A900` (5,69:1) | o verde "feito"/"hoje" | **nenhum** — ver §2.7 |
| `--sm-haunt-ink` | `#6242ad` (6,79:1) | `#b39bff` (7,63:1) | o roxo do assombro, **nunca vermelho** | **nenhum** desde 16/09/2026 — a tarefa assombrada passou a `--sm2-haunted` (§2.8, `c1c1b743`); o `TaskMeta.tsx` não o cita mais |
| `--sm-haunt-veil` | `color-mix(in srgb, #6242ad 8%, var(--sm-surface))` | `color-mix(in srgb, #b39bff 12%, var(--sm-surface))` | véu da tarefa assombrada | **nenhum** desde 16/09/2026 — o véu por opacidade foi a F1 da crítica do canvas Home (2,31:1 no claro); a tinta nova é SÓLIDA |
| `--sm-attr-virus-ink` | `#1a7d00` (5,28:1) | `#5fdc3a` (6,95:1) | Poder como TEXTO | `src/types/attributes.ts` → `ATTR_INK` |
| `--sm-attr-data-ink` | `#00699a` (6,02:1) | `#5ac8f5` (6,49:1) | Harmonia como TEXTO | idem |
| `--sm-attr-vaccine-ink` | `#8a5a00` (5,93:1) | `#f0b64d` (6,78:1) | Benevolência como TEXTO | idem |
| `--sm-help-accent` | `#0f766e` | `#5df0e0` | acento do glossário | **nenhum** — ver §2.7 |
| `--sm-help-item-bg` | `#f3f9f8` | `rgba(255,255,255,0.03)` | fundo do item do glossário | **nenhum** desde 16/09/2026 (`.sm-px-help-item` saiu ⚰️) — ver §2.7 |

Os três `--sm-attr-*-ink` existem porque `ATTR_COLOR` (`src/types/attributes.ts`)
é a fonte única da IDENTIDADE do atributo — cor do ícone, do preenchimento e da
linha do grafo, onde o mínimo é 3:1 e ela passa. **Como TEXTO** ela reprovava
nos dois temas (`#22A900` sobre branco = 3,11:1; `#009ED8` = 3,05:1; `#E69600` =
2,41:1). Os pares acima são a MESMA matiz com a luminosidade ajustada: não é cor
nova na paleta.

### 2.7 Layout, tipografia e os 14 tokens sem consumidor (eram seis)

| token | valor | para quê | um uso |
|---|---|---|---|
| `--sm-scroll-pt` | `12px` | folga de topo do scroller | `.sm-pet-sticky` (`top: calc(var(--sm-scroll-pt) * -1)`) |
| `--sm-petstage-h` | `215px`; `175px` sob `@media (max-height: 800px)` | altura do palco do pet | `src/components/ui/Viewport.tsx` |
| `--sm-font-pixel` | `'Silkscreen', ui-monospace, 'Courier New', monospace` | ponto único da fonte de aparelho | `.sm-px-font`, `.sm-px-section-title` (a `.sm-bottom-nav-label` saiu daqui em 16/09/2026 — é Rubik, §4.2) |

⚠️ **Catorze tokens são declarados e não têm um único `var()` que os consuma**
em `src/` nem em `desktop/`, medido em 20/09/2026 com
`grep -rn "var(--sm-<nome>)" src desktop | grep -v .test. | wc -l` → `0`
(eram seis em 09/09/2026). Os seis de sempre: `--sm-gold-soft` ·
`--sm-danger-soft` · `--sm-energy` · `--sm-energy-track` · `--sm-ok-ink` ·
`--sm-help-accent` (os dois últimos criados numa rodada de contraste com valor
medido anotado no CSS e nunca ligados; os quatro primeiros do bloco base
original). Os **oito** que ficaram órfãos na Fase 2, porque o consumidor saiu e
o token não: `--sm-danger` · `--sm-haunt-ink` · `--sm-haunt-veil` ·
`--sm-help-item-bg` · `--sm-px-ink` · `--sm-px-panel-bg` · `--sm-px-panel-ink` ·
`--sm-px-red`. Não são erro de renderização (token sem consumidor não pinta
nada), mas são superfície de decisão morta. **Régua: nenhuma** — o
`src/styles/tokens.contrast.test.ts` cobre paridade e contraste dos `--sm2-*`,
não órfão dos `--sm-*`.

### 2.8 O conjunto `--sm2-*` — para onde os tokens estão indo

Medição: `grep -o -- '--sm2-[a-z0-9-]*:' src/index.css | sort -u | wc -l` →
**59** em 20/09/2026, dos quais **58** são tokens (era **50** em 09/09/2026): a
59ª linha é `--sm2-btn:`, que não é token — é a custom property que o kit vetor
usa como SELETOR de variante (`button[style*="--sm2-btn:primary"]`), e o `grep`
a pega numa menção em comentário. Os **8** novos, todos de 16/09/2026 (canvas
Sistema e canvas Home): `--sm2-haunted` (P5) e a escala de espaço
`--sm2-space-half/1..6` (P1) — ver abaixo. Contrato completo e tabela de
contraste: [`src/styles/tokens.md`](../../src/styles/tokens.md).

**Por que dois conjuntos.** Os `--sm-*` estão espalhados por milhares de linhas
do `index.css` (kit pixel, palco, masmorra, moldura chanfrada). Trocar o VALOR
deles repinta toda tela existente de uma vez, sem revisão — regressão garantida.
O conjunto novo nasceu ao lado; as ondas migram tela por tela, e só no fim os
`--sm-*` morrem. Estado em 09/09/2026: **64** classes `.sm2-*` contra **100**
classes `.sm-px-*` no CSS; em 20/09/2026, depois da Fase 2: **231** `.sm2-*`
contra **21** `.sm-px-*` (em 21/09/2026: **233** × 21 — as duas do suporte do
chat, §2)
(`grep -o '\.sm2-[a-z0-9-]*' src/index.css | sort -u | wc -l` e o mesmo para
`.sm-px-`), e **78** arquivos `.tsx` de produção citam `sm2-` (eram 61). A
migração tela por tela ACONTECEU (14 canvases, `docs/design/DECISOES-WIREFRAME.md`
§18–§25); o que sobrou de `--sm-*` é a base do tema (§2.1) e resíduo do kit.

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

**O escopo `.sm2-visor`** (desde `fd9ec04d`, 20/09/2026) é a consequência
disso para o que vive DENTRO do vidro: a classe redeclara `--sm2-ink`,
`--sm2-muted`, `--sm2-primary-ink`, `--sm2-primary-deep`, `--sm2-surface`,
`--sm2-surface-2` e `--sm2-line` com os hex do tema ESCURO, porque os do tema
claro foram calibrados para superfície clara (`#0B6F68` sobre `#0E2422` dá
2,70:1). É o ÚNICO escopo que fixa hex do escuro; `index.html #splash`, o
`Viewport`, `MiniGlass` e `RitualGlass` levam a classe. Copiar esses valores
num componente é o footgun 9 — e foi exatamente o que a splash fazia até
20/09/2026 (§10.2).

**`--sm2-haunted` — o quarto acento (P5 do canvas Home, 16/09/2026).** A tinta
PRÓPRIA da tarefa assombrada: `#85A0B8` no escuro, `#4E6A83` no claro, azul
acinzentado "fantasma", aprovada pelo dono contra a recomendação do crítico
(que preferia `muted`). **Sólida, nunca por opacidade** — `opacity: .55` na
linha dava 2,31:1 no claro (F1 da crítica). O escuro nasceu `#6E8AA3`
(4,21:1 sobre `surface`) e foi clareado em `736d53e2` para o hex que o crítico
mediu (5,58:1). Vale para título e ícone da linha (`.sm2-ritual-haunted
.sm2-ritual-name`); o chip "haunted · +relief" é `gold-ink` sobre `surface-2`.
Régua: `src/styles/tokens.contrast.test.ts`, pares `haunted / surface`,
`haunted / bg`, `haunted / surface-2` (5,66 · 5,21 · 4,96 no escuro; 5,58 ·
6,63 · 4,73 no claro). Substitui `--sm-haunt-ink`/`--sm-haunt-veil` (§2.6), que
ficaram declarados e sem consumidor.

**`--sm2-space-half/1..6` — o grid de 4 (P1 do canvas Sistema, 16/09/2026,
`f041285f`).** Seis degraus e um meio-passo, invariantes de tema (bloco
`:root`, junto de raio e duração): `half` `2px` (**só** ícone ↔ rótulo na mesma
linha) · `1` `4px` · `2` `8px` · `3` `12px` · `4` `16px` · `5` `24px` · `6`
`32px`. O meio-passo existe para que o `gap: 2` entre ícone e rótulo seja token
e não literal; qualquer outro 2, 6, 10 ou 14 é literal fora do grid (X8 da
crítica). Régua: `src/styles/tokens.contrast.test.ts` (escala declarada uma vez,
não redeclarada no escuro). É o token de espaço que o `PLANO-DESIGN.md` §1
pedia como `--sm-space-1..6` e que não existia até 16/09/2026 (§11.2).

---

## 3. O mecanismo de tema

**Dono:** `src/contexts/ThemeContext.tsx` → `ThemeProvider` / `useTheme`.

- `ThemeMode` = `'light' | 'dark' | 'system'`, persistido em
  `STORAGE_KEYS.THEME` por `writeLocal(..., { silent: true })` — preferência
  cosmética não gasta o aviso único do usuário.
- O provider escreve `document.documentElement.dataset.theme` com o tema
  RESOLVIDO. O `data-theme` inicial já vem de um **script inline no
  `index.html`**, que roda antes do primeiro paint (evita FOUC); o provider só
  assume o controle depois que o React monta. ⚰️ Esse script leu
  `localStorage['digiapp-theme']` de 07/09 (quando a chave virou
  `STORAGE_KEYS.THEME` = `soulmon-theme`) até `f9faf7a7` (QA geral de
  21/09/2026) — o anti-flash ignorava a preferência salva. Mexer nele exige
  refazer o `sha256-` correspondente em `public/_headers`
  (`src/security/csp.test.ts` reprova).
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
| Contraste AA | idem | par (ink, surface), (muted, surface), (primary, bg), (gold, surface), (btn-text, primary), os três de `haunted` (desde 16/09/2026) e os do toast abaixo do mínimo, **nos dois temas**, pela fórmula da WCAG 2.x escrita à mão no teste |
| Grid de espaço | idem | `--sm2-space-1..6` fora de 4/8/12/16/24/32, `--sm2-space-half` ≠ 2px, ou qualquer um redeclarado no bloco escuro (desde 16/09/2026) |
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
| **Material Symbols Rounded** (100–700, variável) | ícone — `--sm2-font-icon` | `@font-face` self-host, `font-display: block` | `public/fonts/material-symbols-rounded.woff2` (**155.440 B** em 20/09/2026; era 150.016 B — rebaixado em 16/09/2026 com `toys` e `groups`, §5.2) |
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

- **Entra em**: **só dentro do visor e em selos** (classe `.sm2-device-voice`),
  **mínimo 14px, CAIXA ALTA** — a splash (§10.2), a placa HP/EN do visor
  (`.sm2-visor-tag`/`.sm2-visor-num`, Silkscreen 14), marca. Até 16/09/2026
  também entrava em botão do kit, título de painel e rótulo da nav ⚰️ — o kit
  vetor (`a482dfd5`) e o canvas Home tiraram a Silkscreen de FORA do vidro.
- **Não entra em**: nome de tarefa, falas do pet, guia, glossário, relatório
  diário, qualquer texto de leitura corrida.
- `.sm-px-font` e `.sm2-device-voice` declaram `-webkit-font-smoothing: none` —
  a Silkscreen tem desenho de 1px e alisar mata a nitidez do bitmap.
- ⚠️ A classe `.sm2-device-voice` **foi renomeada** de `.sm2-device`: existiam
  duas regras com o mesmo nome (esta, de tipografia, e a do CORPO do aparelho).
  Como os conjuntos de propriedades eram disjuntos elas não se sobrescreviam,
  elas **somavam** nos dois sentidos — quem pedia a fonte ganhava padding, raio,
  fundo e três sombras junto, e o corpo do aparelho fazia a subárvore inteira
  HERDAR Silkscreen em caixa alta. ⚰️ **`.sm2-device` (o corpo) saiu em
  16/09/2026** (canvas Home, D-H1: a página é o corpo; só anel + vidro sobram) —
  o nome continua reservado, e `grep -c "^\.sm2-device {" src/index.css` → 0.

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
subsetada por `icon_names` e tem **155.440 B** (`ls -la public/fonts/`,
20/09/2026; era 150.016 B em 09/09/2026). A lista de nomes tem **102** entradas
em `src/styles/tokens.md` (medido com `node` sobre o bloco em crase que começa
em `accessibility_new` e termina em `wifi_off`; eram 100 — o cabeçalho do
`tokens.md` dizia "102" com 100 nomes, e foi recontado em 16/09/2026). Os dois
que entraram, em `d45c8223` (P6 do canvas Home, decisão do dono em 16/09/2026):
`toys` (Brincar, 5ª célula do deck) e `groups` (Biblioteca, no menu da nav) — o
crítico derrubou `pets` (é a criatura) e `person` (é perfil). O arquivo foi
rebaixado pelo comando do `tokens.md` e o `CACHE_VERSION` subiu.

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

Medido em 20/09/2026 com
`grep -rho "size={[0-9]*}" src --include=*.tsx | sort | uniq -c | sort -rn`:
**64×** `size={20}`, **61×** `size={24}`, **9×** `size={32}`, e fora dos quatro
degraus: **13×** `48` (o 5º degrau `state` proposto em `tokens.md` §6.1a, pendente
do dono), **12×** `64`, e **1×** cada de `80`, `40`, `36`, `18`, `12` — todos
têm de estar na allowlist do guard, que é verificada nos DOIS sentidos: entrada
morta (call-site já migrado) reprova igual. (Em 09/09/2026 eram 76/22/13 nos
degraus e 12×48, 5×44, 3×18, 1×64, 1×12 fora; o `24` mais que dobrou porque o
deck da Home e as ações de linha migraram para `action`.)

**Divergência com o `CLAUDE.md` — FECHADA em 16/09/2026.** A seção "UI: regras
visuais do dono" dizia "nav inferior 36px, ações do pet 42px, chat 30px" (nenhum
dos três existia no código, medido em 09/09/2026). Em `3fdfeee1` (P3 do canvas
Sistema) o `CLAUDE.md` passou a dizer **32 / 24 / 32**, citando `tokens.md`
§6.1 e `iconScale.contract.test.ts` como régua e registrando que "dizia
36/42/30 até 16/09/2026 e o código vence". As duas fontes concordam desde então.

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

O rótulo da nav é persistente, **Rubik 12/500 em caixa mista** desde
16/09/2026 (era Silkscreen ⚰️ — ver §1 e §4.2), `letter-spacing: 0`,
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

Contagem medida em 21/09/2026 com `find src/assets/soulmon/<pasta> -name '*.png' | wc -l`
(a coluna "20/09" é a medição anterior, depois da rodada 1 da SQUAD-ARTE,
15–16/09/2026; o que mudou em 21/09 é a **rodada 2** — `118131f4`, 255
derivados, `docs/ASSETS-A-GERAR.md` §13 R2-1…R2-4 — que **não gerou pose
nova**: tudo é REDUÇÃO do que já existia, via `scripts-arte/derivar-rodada2.mjs` (fora do repo, em `D:\Soulmon\scripts-arte\`),
então a D5 de §8.2 continua valendo):

| pasta | PNGs | 20/09 |
|---|---|---|
| `src/assets/soulmon/icons/` (recursivo, inclui `categories/` e `games/`) | **57** | 57 |
| `src/assets/soulmon/elementos/` | **137** | 137 |
| `src/assets/soulmon/fx-ataque/` | **1078** (+154 `fx-<el>-aura-96.png`, R2-3: auras 96² derivadas das 128², consumidas por `auraForElement(el, 96)` de `src/utils/attackFxArt.ts` na Ficha; `ATTACK_FX_COUNT` continua 924 porque o glob separa as 96² em `AURA_96_COUNT`) | 924 |
| `src/assets/soulmon/lines/` (recursivo) | **137** (+72 em `lines/icons/`, R2-2: ícones-ficha 64² e 32² das 9 linhas × 4 tiers, `src/utils/lineIcons.ts` → Dino, Torneio e mini-visor do ranking; os 36 sprites + 29 de `lines/full/` não mudaram) | 65 |
| `src/assets/soulmon/sigilos/` (nova, D6 — os 45 sigilos do class-system na Ficha) | **45** | 45 |
| `src/assets/soulmon/fx/` | **35** (+1 `anim-sleep-z-light.png`, R2-4: a folha clara do Z para cenário escuro — quem escolhe é `isDarkBackground`, §7.2) | 34 |
| `src/assets/soulmon/dreams/` | **30** | 30 |
| `src/assets/soulmon/adventures/` | **24** | 24 |
| `src/assets/soulmon/bg/` | **15** | 15 |
| `src/assets/soulmon/items/` | **13** | 13 |
| `src/assets/soulmon/emblems/` (os 8 emblemas + `habit-7/21/66`, `663b9de5`) | **9** | 9 |
| `src/assets/soulmon/dino/` (conjunto do Dino, `dd214688`) | **6** | 6 |
| `src/assets/soulmon/hud/` (barra/moldura pixel do visor, D3) | **5** | 5 |
| `src/assets/soulmon/progress/` | **4** | 4 |
| `src/assets/soulmon/placeholder/` (`dormant`/`forming`/`glitch`, §8.6) | **3** | 3 |
| `src/assets/soulmon/windows/` | **1** | 1 |
| `src/assets/soulmon/buttons/` · `evolution/` · `ui/` | ⚰️ **saíram em 16/09/2026** (o kit vetor dispensou os 13 PNGs de botão; a árvore de evolução é SVG por token — H1, decisão do dono) | — |
| raiz de `src/assets/soulmon/` | **17** (+`nest-cradle-wide.png` em 15/09/2026, o berço largo, §7.1) | 17 |
| **total** (`find src/assets/soulmon -name '*.png' \| wc -l`) | **1616** | 1389 |

Fora de `src/assets/soulmon/`, e da mesma rodada 2: **`src/assets/backgrounds/thumbs/`**
(R2-1, **28** PNGs em 21/09/2026 — `ls src/assets/backgrounds/thumbs | wc -l`),
uma miniatura 96×52 por cenário, derivada da ilustração 1200×648, lida por glob
eager no `ShopModal` para a vitrine de cenários. E `src/assets/backgrounds/bg-gameboy.png`
foi **regerado** (R2-6, `b52fa074`, 21/09/2026 — uma das duas gerações novas da rodada, com os
glifos R2-5 do overlay do desktop, `02d483af`, doc `05-ARQUITETURA.md` §4; não derivação).

Régua nova para tudo isso: `src/assets/assets.contract.test.ts` (15/09/2026) —
nenhum asset de 0 byte, todo asset decodificável, nenhum xadrez de
transparência "assado" nos pixels, nenhuma nuvem de ruído em sprite de
criatura, e **uma grade de pixel só** (escala de render inteira — é o guard que
achou o berço esmagado, §7.1).

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

`grep -c '@keyframes' src/index.css` → **35** em 20/09/2026, das quais **34**
são declarações (`grep -o '@keyframes [a-zA-Z0-9_-]*' | sort -u`): a 35ª é uma
menção dentro de comentário. (Eram 33/32 em 09/09/2026.) As 34, por família:

- **Do sistema `sm-*`/`sm2-*`**: `sm-ambient-float`, `sm-intro-logo-in`,
  `sm-intro-wordmark-in`, `sm-milestone-pop`, `sm-pet-haunted-look`,
  `sm-reveal-cocoon-pulse`, `sm-sheet` (nova — a folha de baixo do canvas
  Atividades), `sm-visor-scan-once`, `sm-visor-swap-in`, `sm2-pet-blink`,
  `sm2-pet-greet`, `sm2-rub-call`, `sm2-viewport-breathe`, `sm2-kit-spin`
  (nova — o kit vetor), `sm2-ora-cocoon` e `sm2-ora-spin` (novas — o casulo do
  oráculo, canvas Onboarding), `sm2-splash-flick` e `sm2-splash-seg` (novas — a
  chama e a barra da splash, §10.2).
- **Do pet e do cuidado**: `pet-munch`, `pet-rub`, `pet-shower-shake`,
  `rub-heart`, `shower-drop`, `float-up`.
- **Da masmorra e do CRT**: `dungeon-idle`, `vhs-distort`, `crt-off`,
  `noise-anim`, `boot-up`.
- **Da evolução**: `evo-bg-drift`, `evo-btn-pulse`.
- **Genéricos**: `enter`, `pulse`, `spin`.

⚰️ **Quatro saíram na Fase 2**: `dungeon-vhs` (o overlay VHS da masmorra — a
cena virou o `cover` de um visor, `games/GameKit.tsx`, canvas Jogos §25, e
"movimento contínuo sem propósito era o que `prefers-reduced-motion` nunca
alcançava", como o cabeçalho de `dungeonScenes.ts` registra), `sm-px-node-pulse`
(kit pixel), `evo-fade-in` e `evo-pop` (a árvore de evolução em SVG por token).

`rub-heart` é o exemplo do vocabulário do gesto: os corações EXPLODEM do centro
do pet (pop rápido, depois radiam para fora como fogos), com a direção vindo de
`--tx`/`--ty` setados pelo componente.

### 6.3 `steps()` — dentro do visor, e só

Movimento DENTRO do visor é `steps()`, sempre: pixel deslizando em subpixel é o
que faz pixel art parecer borrada. Medido em 20/09/2026: `grep -n 'steps('
src/index.css` → **8** ocorrências, das quais **2** são declaração real —
`.sm2-rub-heal::after` usa `sm2-rub-call 1.6s steps(1, end) infinite`,
`steps(1)` de propósito, porque a mira TROCA de estado, não desliza; e
`.sm2-ora-pulse` usa `sm2-ora-cocoon 1.6s steps(2, end) infinite` (o casulo do
oráculo pulsa por POSIÇÃO, D-Q4); as outras 6 são comentário. (Eram 5/1 em
09/09/2026.) Fora do CSS, o
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
  margin-inline: -16px;
  padding: 0 16px;
}
```

O gutter é **16** desde 16/09/2026 (canvas Home, P1; era 24): o `<main>` da Home
é `px-4` e a faixa cancela o mesmo valor — os dois números TÊM de ser o mesmo,
senão sobra fresta em que a lista rola visível ao lado do pet. O padding
vertical é zero por medição: 6px em cima custavam uma unidade de ação inteira
acima da dobra em 412×915. A faixa é **opaca** — `--sm2-bg` sólido + a textura
P4 (10%) do canvas Home no `::before`, porque a página É o corpo do aparelho
(D-H1) — a textura continua com `background-attachment: fixed`, para casar com a
camada `.sm2-home-bg` que rola por baixo; ⚰️ o que saiu em 16/09/2026 foi a
repetição do cenário equipado e a grade de circuito (pixel fora do visor).
O scroll acontece só na lista de atividades abaixo. **Régua: nenhuma** (é
geometria de CSS, não há teste de layout em jsdom).

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
fronteira de troca — `DEFAULT_NEST` = `'nest-cradle-wide'` desde 15/09/2026.

**A caixa do berço é 220 × 104 px desde 15/09/2026** (`BASE_SLOTS.nest`:
`w: 220, h: 104, yPx: 3`; era 148 × 83 com `yPx: 17` ⚰️). O berço largo
(`nest-cradle-wide.png`, `dd214688`) é desenhado a **3× exato**; a caixa antiga o
esmagava anisotropicamente — foi o guard de escala de
`src/assets/assets.contract.test.ts` que acusou. O `yPx` foi reencontrado para
manter os pés do sprite no MESMO y de antes (17 + ⅔·83 = 3 + ⅔·104), como o
comentário do módulo registra.

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

- `setting` — medido em 20/09/2026: **22** `outdoor`, **6** `indoor`, **0**
  `void` (`grep -o "setting: '[a-z]*'" src/utils/backgrounds.ts | sort | uniq -c`;
  eram 20/5/3 em 09/09/2026). ⚰️ **Não há mais cenário `void`**: `bg-matrix`,
  `bg-ocean` (→ `outdoor`) e `bg-gameboy` (→ `indoor`) ganharam arte nova com
  chão em 74% em 15/09/2026 e passaram a oferecer `GROUND_SLOTS`. O tipo
  `'void'` continua em `StageSetting` — sem consumidor;
- `slots` — quais espaços ele oferece. Só chão (`GROUND_SLOTS`, sem `wall`)
  para cena de céu aberto sem superfície vertical: um estandarte pendurado no
  nada pareceria bug, não decoração. `FULL_SLOTS` é o conjunto completo;
- `horizonY` — a altura (%) em que o chão começa, **≤ `GROUND_Y`**, senão o pet
  e a decoração ficam apoiados no céu. É **declarado**, e não deduzido do CSS, de
  propósito: o CSS de um cenário é uma pilha de gradientes onde "74%" tanto pode
  ser a linha do piso quanto a coordenada horizontal de uma estrela — foi
  exatamente assim que a primeira versão do teste passou sem verificar nada.
  Presente em **28** dos 28 cenários em 20/09/2026 (`grep -c "horizonY:"
  src/utils/backgrounds.ts`; eram 25 — os 3 ausentes eram os `void`);
- `baseColor` — cor de base atrás da arte, para cenário PINTADO. O visor
  desenha a arte com `auto 100%` para não deformar o pixel nem perder a linha
  do chão; numa caixa mais larga que a proporção da arte sobra área, e é esta
  cor que preenche. Era opcional; em 20/09/2026 **os 28 declaram**
  (`grep -c "baseColor:"` → 28). Desde 21/09/2026 ela tem um segundo
  consumidor: **`isDarkBackground(id)`** (mesmo arquivo, R2-4) devolve `true`
  quando a luminância relativa da `baseColor` é `< 0,5` — e também sem cenário
  ou sem `baseColor`, porque aí o que se vê é o `--sm2-viewport-bg`, escuro nos
  dois temas. O `CompanionHUD` usa a resposta para escolher a folha do Z de
  dormir: `ANIM_ART.sleepZLight` (`fx/anim-sleep-z-light.png`) sobre cenário
  escuro, `ANIM_ART.sleepZ` (teal) sobre claro. **Régua: nenhuma** além do
  guard geral de assets (§5.6).

`PET_BACKGROUNDS` tem **28** entradas: 22 comuns/comprados + os 6 `bg-mission-*`
liberados por missão. ⚰️ **Nenhum é mais gradiente CSS**: em 15/09/2026
(`559222ed`, leva `cenarios-20260915` da SQUAD-ARTE — C3 em
`docs/ASSETS-A-GERAR.md` §11) os **19** cenários que eram pilhas de
`linear-gradient`/`radial-gradient` (ou arte 800² antiga) viraram **arte
pintada 1200×648** para o pet-box — os 13 comuns de `bg-room` a `bg-synthwave`,
os 6 `bg-mission-*`, mais as 2 arenas do Torneio; os 8 já pintados do kit v1.2
ficaram. O `css` de cada um é só `url(<import>)` + `baseColor`. A "versão dia"
dos cenários foi descartada pelo dono (D4).

Item equipado que não combina com o cenário **não é desenhado, mas a loja
explica em vez de sumir em silêncio**. Estado no save: `equippedDecor` (um item
por espaço), migrado do antigo `equippedFurniture` no load.

### 7.3 Cenários da masmorra

**Dono: `src/utils/dungeonScenes.ts`.** Cada run sorteia 5 cenas sem repetição
(`buildRunScenes`) de um pool de três origens, medido em 09/09/2026:

| conjunto | n | o que é |
|---|---|---|
| `DUNGEON_SCENES` | **5** | os clássicos em CSS puro (Tamagotchi/VHS/Sol Neon/CRT/Glitch). ⚰️ O overlay `dungeon-vhs` que o `DungeonGame` punha por cima **saiu** (canvas Jogos, `DECISOES-WIREFRAME.md` §25): a cena é o `cover` de um visor (`games/GameKit.tsx`) |
| `SPIRIT_BG_SCENES` | **13** | arte PINTADA: as 5 grutas originais (regeradas **em pé** em 15/09/2026, C1 de `ASSETS-A-GERAR.md` §11 — eram 960×540 deitadas ⚰️), 6 da segunda leva (retrato 9:16, porque o campo de batalha é uma caixa ALTA), o "Corredor em Ruínas" (nasceu como fundo do Dino e migrou) e as **2 arenas do Torneio** |
| `SHOP_BG_ACCENTS` | **16** | os cenários da loja, reaproveitados como cena de andar (`SHOP_BG_SCENES` filtra os que existem em `PET_BACKGROUNDS`) |

Comandos usados: `sed -n '<faixa>' src/utils/dungeonScenes.ts | grep -c "^  {"`
para os dois primeiros e `grep -c "':"` para o terceiro.

As duas arenas do Torneio entram AQUI, e não como fundo da página do Torneio:
aquela moldura saiu de propósito. Como CENA de um andar, a arena é conteúdo do
visor — que é exatamente a fronteira que a tese traça.

`sceneForFloor` (usada fora do sorteio) indexa `DUNGEON_SCENES` pelo andar,
clampado.

**Três cenas FIXAS, fora do sorteio** (novas na Fase 2, exportadas de
`dungeonScenes.ts` como índices de `SPIRIT_BG_SCENES`): `NIGHTMARE_SCENE` (a
Forja das Almas, `dungeon-7` — o pesadelo é uma luta só, de manhã, e o vidro do
diálogo é o mesmo todas as noites; canvas Jogos, `PesadeloIntro`/`PesadeloFim`),
`ARENA_SCENE` (o Abismo Violeta, `dungeon-4`, canvas Arena) e `DINO_SCENE` (o
corredor em ruínas atrás do parallax do Dino).

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
3. **Save legado** — `legacySpriteForStage` escolhe uma das nossas **9** linhas
   (eram 6 até 15/09/2026) por **hash do id** (`hashId`, base 31):
   determinístico, então o mesmo save renderiza sempre a mesma criatura em vez
   de embaralhar a cada load.

⚠️ **Divergência de símbolo:** `CLAUDE.md` (seção de arte) e
`src/types/progression.ts` chamam essa função de `fallbackSpriteForStage`. O
símbolo no código é **`legacySpriteForStage`** —
`grep -rn "fallbackSpriteForStage" src/` devolve 4 ocorrências, **todas em
comentário ou em teste**, nenhuma em declaração.

### 8.2 As 9 linhas próprias (eram 6 até 15/09/2026)

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
| `igni` | Igni | idem — desde 15/09/2026 (`c11dc49d`) |
| `nautilu` | Nautilu | idem — desde 15/09/2026 |
| `astrase` | Astrase | idem — desde 15/09/2026 |

As três últimas são **as linhas do oráculo com seed fixo** (runs 1–3 de
18/08/2026, `branches/`), recortadas em 15/09/2026 e postas na **pré-seleção do
jogador free** — decisão D1 do dono na rodada 1 da SQUAD-ARTE
(`docs/INVENTARIO-ASSETS.md`, P2: "free escolhe de uma pré-seleção; pago recebe
o rookie gerado e as formas seguintes são geradas conforme avança"; `branches/`
"entra na pré-seleção"). Os 12 PNGs vivem em `src/assets/soulmon/lines/`
(§5.6). Consequência mecânica, documentada no `CLAUDE.md` › ⚔️ Masmorra: o
roster da masmorra e o bestiário passam de 6 para 9 linhas (24 → **36** artes).

**Um sprite por criatura, e é decisão (D5, 15/09/2026):** não existe idle
animado nem spritesheet de criatura — "um sprite por pet; expressão por
deformação (bounce/squash, como no andar e no carinho)". A `entrega5/` (idle)
foi descartada; as 7 animações da `entrega4/` são **FX ao redor do pet**
(migalhas, coração, respingo, Z…), em `src/assets/soulmon/fx/`, não quadros do
sprite. É por isso que a tabela acima tem exatamente 4 artes por linha e o
`steps(2, end)` do `CompanionHUD` (§6.3) anima dois quadros de DEFORMAÇÃO,
não dois desenhos.

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

Desde 21/09/2026 (`66e32d43`, rodada 2) o mesmo arquivo exporta
**`resolveLineForStage(stage, demoCharacterId)`** e o tipo **`LineTier`**
(`'rookie' | 'champion' | 'ultimate' | 'mega'`): é a resolução de
`getSpriteForStage` **sem o sprite** — devolve `{ line, tier }` para demo e para
id legado (mesmo hash), e `null` para estágio da árvore do jogador
(`champion-virus` etc.), porque aí a arte é a do próprio Soulmon, não de linha.
Único consumidor: `src/utils/lineIcons.ts` (`lineIcon(lineId, tier, 32 | 64)`),
que serve os ícones-ficha de `lines/icons/` (§5.6) e devolve `undefined` quando
a arte não existe — o consumidor cai no sprite 256² reduzido, que é o que era
antes.

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
`DUNGEON_LINE_SPRITES` tenha exatamente **9** linhas × 4 artes (`it('tem
exatamente 9 linhas, cada uma com as 4 artes')`; exigia 6 até 15/09/2026),
reprova o sufixo `-mon` e reprova a volta da string duplicada de nome.

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

### 8.6 O placeholder da forma ainda não gerada (v4, 16/09/2026)

**Dono: `src/utils/placeholderArt.ts` → `PLACEHOLDER_ART`** (`61748685`, leva
`sprites-20260915` v4, 256² alfa). Enquanto a forma do jogador pago não existe,
o visor mostra **o cristal do meio da cena da Home** — os três cristais presos
por garras de cobre sobre a base de pedra — com um ser adormecido dentro e
vinhas e brotos na base, em três estados: `dormant` (cristal apagado, silhueta
escura: o rookie ainda vai nascer), `forming` (cristal aceso, o ser brilhando: a
forma está sendo gerada) e `glitch` (cristal rachado em blocos: a geração
falhou e pode ser pedida de novo). Consumidor: `EvolutionPath` (D1) —
`GERANDO` → `forming` (`dormant` no rookie), `RESERVA_FINAL` → `glitch`; só para
quem não é personagem pronto. A arte âmbar/cristal é o que faz o "ainda não"
parecer parte do aparelho, não erro. Arquivos em `src/assets/soulmon/placeholder/`
(§5.6). Referência e pedido do dono em 15–16/09/2026, `docs/ASSETS-A-GERAR.md`
§11 (C2).

---

## 9. Identidade sonora

> Este documento **descreve**. Quem decide é
> [`docs/REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §6.1 (**S1..S16**, sem S14),
> e o guia operacional é [`docs/SOM.md`](../SOM.md). Não altere som a partir
> daqui.

### 9.1 Os 8 sons

**`src/utils/sounds.ts`** — os oito símbolos, todos com síntese procedural. ⚰️ "Zero
byte de asset" valeu até 21/09/2026: desde a S16 (`ee79fd44`) e a escolha do dono
("o gerado nos 3", `73be1a2f`), os **três eventos longos** preferem um asset de IA e caem
no procedural quando o arquivo não está decodificado (§9.1.1); os cinco curtos são só
síntese. A categoria é a que `CATEGORIA_DO_SOM` (`loudness.ts`) lhes atribui:

| símbolo | categoria | alvo (LUFS-M) | fonte desde 21/09/2026 |
|---|---|---|---|
| `playEvolve` | `marco` | −16,0 | **asset** `public/sounds/evolve.webm`, fallback procedural (⚠️ saiu em `c703c8bc` e **voltou** em `73be1a2f` — ver §9.5, S10) |
| `playPresence` | `presenca` | −16,0 | procedural (o gerador reprovou, `PERGUNTAS-DO-DONO.md` #10) |
| `playDegenerate` | `degeneracao` | −16,0 | **asset** `public/sounds/degenerate.webm`, fallback procedural |
| `playVisorTune` | `sintonia` | −19,0 | procedural |
| `playFeed` | `cuidado` | −19,0 | procedural (reprovado, #10) |
| `playShower` | `cuidado` | −19,0 | procedural (reprovado, #10) |
| `playSleep` | `cuidado` | −19,0 | procedural (reprovado, #10) |
| `playTaskComplete` | `conclusao` | −22,0 | **asset** `public/sounds/task-complete.webm`, fallback procedural |

Mais `isMuted` / `setMuted` (o gate de mudo, lendo `STORAGE_KEYS.SOUND_MUTED`).

⚠️ **O `AudioContext`-por-chamada não existe mais** ⚰️ — morreu na Fase 2 do run
`som-01`. A função interna `play` é, desde então, o gate de mudo **e, desde 21/09/2026,
o aviso de gesto à trilha** (`aoGestoSonoro` de `utils/trilha.ts`, §9.2.1) — nessa ordem,
e o gate vem ANTES de qualquer construção de nó: com `SOUND_MUTED`, `tocarNa` nunca é
chamada e **nenhum nó é criado**, nem o barramento. Contexto construído para "não
tocar" já é plumbing vazando. A função privada `playComAsset` (só `playEvolve`,
`playDegenerate` e `playTaskComplete` passam por ela) chama `prepararAssets` dentro do
`play` — ou seja, depois do mudo e do gesto — e toca `assetPronto` a ganho 1 se já
decodificou, senão o procedural **desta vez**: nunca espera, nunca fica mudo.

#### 9.1.1 Os assets de IA — S16 (21/09/2026)

Decisão do dono em 21/09/2026 (`REGISTRO-DE-DECISOES.md` §6.1, **S16**: "só pra gente
ter pronto; depois melhoramos"): o candidato único de cada evento em que o gerador
passou na régua entrou no app, com o procedural como fallback, e os cinco sons curtos
ficaram procedurais porque o gerador reprovou neles. **Manifesto e carga preguiçosa:
`src/utils/sonsAssets.ts`** (`ASSETS_DE_SOM` para os 3 SFX, `CAMADAS_DA_TRILHA` para a
trilha). O que está em `public/sounds/` em `73be1a2f` (`ls -l public/sounds/`,
21/09/2026):

| arquivo | evento | bytes (`bytes` do manifesto) | `duracaoS` |
|---|---|---|---|
| `evolve.webm` | `playEvolve` | 7 641 | 1,2 |
| `degenerate.webm` | `playDegenerate` | 4 498 | 0,7 |
| `task-complete.webm` | `playTaskComplete` | 1 570 | 0,2 |
| `trilha-base.webm` | trilha, camada `base` | 122 447 | 28,8 |
| `trilha-ritmo.webm` | trilha, camada `ritmo` | 122 092 | 28,8 |

Total **258 248 bytes** (soma dos cinco; a régua confere contra o teto S6 de 300 KB).
Codec: **WebM/Opus mono, codificado pelo MediaRecorder do Chrome** — não há
codec nesta máquina — e decodificado por `decodeAudioData` no mesmo motor (48 kbps nos
SFX, segundo o cabeçalho de `sonsAssets.ts`; as duas camadas da trilha a 32 kbps, segundo
o bloco S16 do `STATUS.md` — 122 447 bytes / 29,8 s ≈ 33 kbps confere); o
MediaRecorder grava um pré-rolo de silêncio na cabeça e `recortarSilencio` acha o
onset (limiar −60 dBFS) ao decodificar, para o som começar no gesto. Origem
`higgsfield/seed_audio` (SFX) e `higgsfield/sonilo_music` (trilha); o prompt fica
**fora** do bundle (`promptRef` aponta para `squad-alpha-runs/som-01/prototyper/pacote-prompts.md`).
Procedência por hash SHA-256 nas duas direções — manifesto ↔ arquivo ↔ seção
"Áudio" de `docs/Attributions.md`. **Régua: `src/utils/sonsAssets.contract.test.ts`**
(S9 nas duas direções; S6: soma ≤ 300 KB, nada em `PRECACHE_URLS` do `public/sw.js`,
nenhum `import` de `.webm` em `src/`; as camadas fecham o loop no mesmo ponto;
footgun 9: nenhum número de LUFS/dBTP no manifesto). ⚠️ `dist/` é commitado: todo
byte de áudio é permanente no histórico — trocar é commit novo, nunca reescrita.

### 9.2 O barramento — `src/utils/audioBus.ts`

Um contexto compartilhado, sub-mix por categoria, master com limitador no teto
S3, e os dois duckings:

```
fonte → bus da categoria → bus SFX → duckGeral → master → limitador → saída
                ↑ Arcade passa antes pelo duckArcade (D-2)
camadas da trilha → bus Trilha → duckGeral ↑   (desde 21/09/2026: `utils/trilha.ts`, §9.2.1)
Marco → master  (NÃO passa pelo duckGeral: ele é quem duca — D-1)
```

Constantes: `D1_ATAQUE_S` `0.12` · `D1_LIBERACAO_S` `0.8` · `D2_ATAQUE_S` `0.12`
· `D2_LIBERACAO_S` `0.4` · `D2_PROFUNDIDADE_DB` `-9.0` · `RAMPA_MINIMA_S`
`0.005`. Funções de fronteira: `tocarNa` (despacho), `liberarMarco` e, desde
21/09/2026, `garantirBarramento` — o barramento construído se preciso, para quem toca
**fora** de `tocarNa` (hoje só `utils/trilha.ts`, que tem gesto próprio e vai ao
`busTrilha`); mesmo contrato: `null` = sem motor, falhar em silêncio.

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

#### 9.2.1 A trilha — `src/utils/trilha.ts` (21/09/2026)

**Duas camadas em fase, um estado só.** `CAMADAS_DA_TRILHA` (`sonsAssets.ts`) tem
`base` e `ritmo`, ambas a 100 BPM, cada uma mestrada no alvo sozinha; `comecar()` carrega
as duas por `carregarAsset`, cria **um** ganho de trim e liga ao `busTrilha`, e dá
`start(t0)` no **mesmo instante** para todas — é o início comum que as mantém em fase
compasso a compasso. Loop: `loopStart` 0, `loopEnd` = `duracaoS` = **28,8 s** (12
compassos × 2,4 s), dentro do arquivo, que carrega 1 s de cauda porque o codec perde a
ponta. Só as camadas que chegaram tocam, e o trim é o do NÚMERO que toca:
`TRIM_TRILHA_POR_CAMADAS_DB` (§9.3), aplicado igual às duas. `camadasTocando()` devolve
0, 1 ou 2. ⚠️ Isto satisfaz a condição (1) da S13 no repositório e **não descongela**
a máquina E0–E6: o módulo não decide estado nenhum — liga, desliga, pausa.

Ciclo: `ligarTrilha`/`desligarTrilha` (gesto — o switch "Trilha/Music" da
`SettingsPage`, grupo "Som", desde `980bc84c`, e o mesmo par no `SettingsModal`, que
segue sem gatilho vivo; persistem a chave própria `SOUND_TRACK_ENABLED`, separada do mudo),
`pausarTrilha`/`retomarTrilha` (E0 — ganchos do `App.tsx` para dormir e para o mudo
global), `aoGestoSonoro` (chamado pelo `play()` de `sounds.ts`: no PRIMEIRO gesto da
sessão, se a preferência persistida estiver ligada, a trilha começa — o gesto é o
consentimento, sem autoplay no carregamento) e, ao voltar de `document.hidden`, retoma
**só se foi ligada por gesto nesta sessão**. O mudo global cala a trilha; o inverso não
vale. **Régua:** nenhuma de `trilha.ts` em si — o loop no mesmo ponto é travado por
`sonsAssets.contract.test.ts`, o gesto pela tela (liga/desliga a chave própria) por
`src/components/settingsSom.render.test.tsx` (`980bc84c`); liga/pausa/retoma/desliga foi
verificado no motor real em 21/09/2026 (`REGISTRO-DE-DECISOES.md` §6.1, S16).

### 9.3 A política — `src/utils/loudness.ts`, dono único

**Alvo de loudness NUNCA se escreve à mão em outro arquivo.** A política tem
dono único e há guard que reprova a cópia.

`TETO_DBTP` = **−1,0** (true peak, oversampling ≥4×) · `TETO_LUFS_INTEGRADO` =
**−16,0** · `TOLERANCIA_LU` = **1,0** · `DEGRAU_DB` = **3,0** (DERIVADO — razão
de 2× em escala sone; por isso não existe meio-degrau) · `ALVO_TRILHA_LUFS_S` =
**−28,0** · `OFFSET_MAX_DB` = **20** · `GANHO_DE_CATEGORIA_DB` = **0,0** ·
`TRIM_TRILHA_POR_CAMADAS_DB` = **{ 1: 0, 2: −2,024 }** (21/09/2026, `8a930657`): o trim
da trilha por NÚMERO de camadas tocando, em dB — **medido, não calculado** (o
`trimEstadoDb` do arnês, `gate-loudness.mjs` A-5). Cada camada sai do mestre no alvo
sozinha; a soma de duas sobe, e é este trim que devolve a soma ao `ALVO_TRILHA_LUFS_S`
(medido sobre `base` + `ritmo` em `E:/Soulmon-assets/som-01/mix-camadas.mjs`: soma
−28,00 LUFS-S, −15,86 dBTP, −31,46 LUFS integrado). Camada nova = medir de novo, nunca
derivar de 1/√n.

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
  `SOUND_MUTED`**. Recarregar crédito no gerador **não** descongela. Desde
  21/09/2026 (S16, `8a930657`) existem **duas camadas reais** (`base` + `ritmo`) tocando
  juntas num estado só (§9.2.1) — condição (1) da S13 satisfeita; a (2), o dono ligar a
  trilha por gesto numa sessão real, não é verificável por código, e E0–E6 **segue
  congelada**.
- **S10** — o som PROCEDURAL segue a solução vigente, e **não mudou de
  significado** em 21/09/2026 — mudou de dono em três eventos, não de método. ⚰️
  "A conta do gerador está em 0,45 crédito e o piloto A/B não rodou" era o
  estado até 20/09/2026: em 21/09/2026 o bloqueio caiu (crédito recarregado;
  termos, política de loja e S11/S12 respondidos pelo dono —
  `REGISTRO-DE-DECISOES.md` §6.1, nota de 21/09 sob a emenda da S10) e os
  **12 prompts** foram gerados e pós-processados em `E:/Soulmon-assets/som-01/`.
  ⚰️ "Fora do repo: nenhum byte de áudio entrou" valeu só até a **S16** do mesmo
  dia (`ee79fd44`): cinco arquivos estão em `public/sounds/` (§9.1.1) e
  `docs/Attributions.md` **tem** a seção "Áudio" com hash por arquivo (S9). O
  **A/B cego dos 3 pares** (`ab/escuta.html`) **não foi respondido pelo
  protocolo** (`ab-piloto.md` §8.3/§8.4 — 3 perguntas × 2 condições): no fim de
  21/09/2026 o dono primeiro disse "Coloca o A" — aplicado literalmente sobre o
  mapa cego (semente 20260921), `evolve.webm` saiu em `c703c8bc` — e, perguntado
  se era isso, respondeu **"Não — quero o gerado nos 3"**: `evolve.webm` voltou
  em `73be1a2f`. **É escolha do dono, não resultado do A/B.** O que está no app é
  o híbrido — IA nos 3 eventos longos e na trilha (2 camadas), procedural nos 5
  curtos — e "o procedural venceu" e "a IA venceu" **seguem as duas proibidas**:
  ninguém mediu. Detalhe em `docs/SOM.md` §5.

Do gate de loudness (`docs/SOM.md` §7), os três itens que estavam abertos com o
engenheiro de áudio **fecharam em 21/09/2026**, no arnês local (não
versionado): o **flake** (1 falha em 11) tinha causa — porta do CDP escolhida
antes de o Chrome subir — e hoje o diagnóstico persiste a cada saída anormal
(11 execuções, 11 verdes depois do conserto); **O-5** — os sons cortados
(`playPoopClean`/`playMenuOpen`) saíram da amostra medida e viraram
contraexemplo; **O-7** — o AC-1 varre todos os renders e `FORA_DO_AC1` virou
mapa nome → motivo. O que fica: o baseline é captura da Fase 0, e recapturar os
8 sons vigentes pelo `audioBus` continua **pendente** — o arnês é ferramenta de
calibração, não portão de commit.

O runbook completo vive em `squad-alpha-runs/som-01/maintainer/`, que **não vai
para o git** — por isso `docs/SOM.md` existe: é a parte que precisa sobreviver.

---

## 10. PWA, marca e splash

### 10.0 `index.html` — `description` e Open Graph (desde `f9faf7a7`, 21/09/2026)

O `<head>` declara `meta name="description"`, `og:type/site_name/title/description/image/locale`
(+ `og:locale:alternate` `en_US`) e `twitter:card` — antes disso `grep og: index.html` dava 0 e
o link chegava "pelado" em qualquer chat (QA geral, relatório `12-growth-distribuicao.md`). A
`og:image` é **absoluta** (crawler não resolve caminho relativo) e aponta para o ícone 512 no
worker; por isso ela é a quarta fonte que `src/deploy/appUrl.contract.test.ts` obriga a
concordar com `capacitor.config.json`, `desktop/renderer/src/config.ts` e
`desktop/electron/main.js`. Trocar por um key visual 1200×630 quando a squad-arte gerar.

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
| `theme_color` | `#0f766e` (desde `005a2941`, 15/09/2026; era `#0d9488` ⚰️) |
| `background_color` | `#071413` (= `--sm2-viewport-bg` escuro; era `#f3f9f8` ⚰️) |
| `categories` | `productivity`, `lifestyle`, `games` |
| `lang` / `dir` | `pt-BR` / `ltr` |

Duas observações medidas em 09/09/2026 — uma fechou, uma fica:

1. ⚰️ **Fechada em 15/09/2026.** `theme_color: "#0d9488"` era o valor que
   `--sm-primary` tinha abandonado por reprovar em contraste (3,74:1). Desde
   `005a2941` o manifesto diz `#0f766e` (o `--sm-primary` claro que mede 5,47:1)
   e `background_color` é `#071413` (o vidro do visor, escuro nos dois temas).
   O `index.html` acompanha: `<meta name="theme-color">` = `#0f766e` no esquema
   claro e `#071413` no escuro (era `#0d9488` / `#0c1c1a`, este último token
   nenhum).
2. **`lang: "pt-BR"`** enquanto a regra de idioma do projeto é "inglês é a base,
   PT-BR é localização" (`CLAUDE.md`). Continua.

**A marca é o kit `E:/logo/` (chama + cristal), decisão D8 do dono em
15/09/2026** (`docs/INVENTARIO-ASSETS.md`, P2), **vetorizada** porque os PNGs do
kit tinham ~250–480 px, insuficiente para ícone de 1024². O dado canônico é
**`src/brand/flame.ts`** — `FLAME_W` = 19, `FLAME_H` = 30, `FLAME_GROUPS` (um
`<rect>` por pixel, agrupados por `fill`, cores da MARCA e não de token: a
marca é a mesma nos dois temas) — desenhado por `src/brand/BrandFlame.tsx` (o
portão do onboarding, dentro de um slot-visor, D-O4/X3) e, como SVG literal,
no `#splash` do `index.html` (§10.2). **Régua:
`src/brand/brandFlame.parity.test.ts`** trava as duas cópias uma contra a outra,
grupo por grupo e pixel por pixel (footgun 9: a segunda cópia diverge em
silêncio).

Ícones em `public/` (`ls -la`, 20/09/2026): `favicon.svg` (**27.238 B** — a
chama sobre `#071413`, `shape-rendering: crispEdges`, um `<rect>` por pixel; era
um SVG de 250 B ⚰️), `favicon-192x192.png` (**2.180 B**; era 31.292 B) e
`favicon-512x512.png` (**9.140 B**; era 175.448 B) — os três de `005a2941`, junto
com o `ic_launcher`, o `drawable/splash.png` e o `ic_notification.xml` do
Android. O `index.html` declara **dois** deles (`favicon.svg` e o de 192px) e
usa o de 192px também como `apple-touch-icon`; o de 512px só existe no
manifesto. `<title>` = `Soulmon`. Os ícones do **push** deixaram de ser o
favicon em 20/09/2026 (canvas Fora do app, D-F14/D-F15): `public/push-large-192.png`
(mini-visor redondo com a chama a 1×, porque o Android 12+ recorta o
`largeIcon` em círculo) e `public/badge-96.png` (alfa-only: a barra de status
descarta a cor, e o favicon quadrado virava um bloco preto) — os dois
derivados de `flame.ts`, referenciados em `public/sw.js` (`PUSH_ICON`,
`PUSH_BADGE`).

### 10.2 O splash — o aparelho ligando

O `#splash` vive **inline no `index.html`** como MARKUP (nada de bundle no
caminho crítico) e é uma peça de identidade completa: **é o VISOR do aparelho
ligando, em tela cheia** (canvas Onboarding-funil ONB-01,
`docs/design/DECISOES-WIREFRAME.md` §23; `fd9ec04d`, 20/09/2026). O `<div
id="splash">` leva as classes **`.sm2-visor .sm2-splash`** e termina com um
`.sm2-viewport-glass` (o reflexo, sem raio porque é a tela inteira).

⚰️ **O `<style>` inline com ~60 linhas de tokens do tema escuro copiados à mão
saiu em 20/09/2026.** Até então o `#splash` redeclarava `--sm2-viewport-bg:
#071413`, `--sm2-surface: #0F2A29`, `--sm2-primary-ink: #5FF3E0` etc. dentro do
próprio escopo, "porque roda antes do bundle" — era o footgun 9 na primeira
tela do app. No build o CSS entra pelo `<link>` bloqueante do `<head>`, então a
splash lê os tokens de `src/index.css`: a paleta do vidro vem do escopo
`.sm2-visor` (§2.8), o mesmo do `Viewport`, e a composição vive nas classes
`.sm2-splash-*` (`grep -n "^\.sm2-splash" src/index.css`). A intro
(ONB-03/04) é a continuação do boot no MESMO `.sm2-splash` (D-O3/X4), com o
vídeo em `cover` dentro.

Composição, de cima para baixo: a **chama do kit a 4× inteiro** (`svg.sp-flame
.sm2-splash-flame`, `viewBox 0 0 19 30`, `width 76 × height 120`, **343**
`<rect>` — `grep -o '<rect' index.html | wc -l`, 20/09/2026; eram 109 numa chama
de 12×16 ⚰️ — a arte é a de `src/brand/flame.ts`, §10.1, e
`brandFlame.parity.test.ts` confere grupo por grupo), **sem `drop-shadow` e sem
`transform` fracionário** (o pulso é COR, não escala — D-O2, keyframe
`sm2-splash-flick`); o wordmark `Soulmon` em `h1.sm2-splash-title` (Silkscreen
`--sm2-text-2xl`, caixa alta por CSS, `--sm2-primary-ink`); a linha `LOADING
DATA...` (`.sm2-splash-pix`, `--sm2-text-sm` = 14px — o PISO da Silkscreen);
a **barra de 8 segmentos** (`.sm2-splash-bar`, 220×16, `surface-2` + `line`,
`radius-sm`) cujo segmento apagado é **TINTA** (`primary-ink` a 15% sobre
`surface-2`), nunca `opacity`, e a onda anima a COR (`sm2-splash-seg`); o selo
`SOUL_LINK ESTABLISHED` (`.sm2-splash-link`); e os **três cristais**
(`.sm2-splash-crystals`), a mesma cena da Home que o placeholder reproduz
(§8.6).

Três decisões medidas que sobreviveram à reescrita:

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

O que morreu com o `<style>`: os `fill` do sprite antigo entravam por token
(`#5df0e0` → `--sm2-primary-ink`) "sem tocar nos 109 `rect`" ⚰️ — a chama nova
tem as cores da MARCA como atributo, de propósito, e elas NÃO seguem tema.

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
| 1 | Fronteira diegética "O Visor" | **no ar** desde a Fase 2 (era **parcial** em 09/09/2026) | `Viewport` em 12 componentes de produção; o kit pixel `.sm-px-*` caiu de 28 para **14** `.tsx` (13 classes) e o que sobrou é resíduo da nav/árvore/chat, não 9-slice — o `PixelKit` é vetor sobre `--sm2-*` desde 16/09/2026 (§1) |
| 2 | Bisel 20px · tela 12px · anel 4px · visor escuro nos dois temas · `pixelated` com escala INTEIRA · grid de 4px | **no ar**, com o bisel redesenhado | `.sm2-viewport` (`padding: 4px`), `.sm2-viewport-screen` (`--sm2-radius-md` 12px, `image-rendering: pixelated`), `ViewportProps.scale: 2 \| 3`, `--sm2-viewport-bg` nos dois temas. ⚰️ O bisel de 16px (`.sm2-device`) saiu em 16/09/2026 — a página é o corpo (D-H1). **O grid de 4 existe desde 16/09/2026**: `--sm2-space-half/1..6` (§2.8) |
| 3 | Paleta ciano-turquesa como única luz forte; cobre; petróleo. Tinta ≠ fill | **no ar, com outros nomes** | `--sm2-primary-*` (ciano), `--sm2-gold-*`/`--sm2-viewport-ring` (cobre), `--sm2-bg`/`--sm2-viewport-bg` (petróleo). Régua de tinta×fill em `src/styles/tokens.contrast.test.ts` |
| 4 | Silkscreen = voz do dispositivo, ≥14px, caixa alta, nunca frase inteira. Fredoka = títulos. Rubik = texto e dado com `tabular-nums` | **no ar** (a exceção fechou em 16/09/2026) | `.sm2-device-voice`, `--sm2-font-display`, `--sm2-font-text`, `.sm2-num`. ⚰️ A `.sm-bottom-nav-label` em Silkscreen 12px, fora do visor e abaixo do piso, é Rubik 12/500 desde o canvas Home (§4.2) |
| 5 | Material Symbols Rounded variável; `FILL` 0→1 como sistema de estado; `opsz` casado; `wght` 500 | **no ar** | `src/components/ui/Icon.tsx` — as quatro props e os quatro eixos, com clamp de `opsz` em 20–48 |
| 6 | Dentro do visor `steps()`; fora, 120/200/320ms; `prefers-reduced-motion` obrigatório | **no ar**, com uma quarta duração | `--sm2-dur-tap/enter/page` + `--sm2-ease`; `--sm2-dur-scan` 400ms acrescentada com justificativa; 2 declarações de `steps()` no CSS (§6.3) e mais três no call-site; 8 blocos de movimento reduzido; o overlay VHS contínuo da masmorra saiu ⚰️ (§7.3) |
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
| `--sm-space-1..6` (grid de 4) | **sim, com outro nome, desde 16/09/2026** | `--sm2-space-half/1..6` (2/4/8/12/16/24/32px, `f041285f`, P1 do canvas Sistema — §2.8). Até então o espaçamento era literal |
| `--sm-r-sm/md/lg/visor` | **não** | `--sm2-radius-sm/md/lg` (4/12/20px), sem degrau próprio de visor |
| `--sm-bisel` / `--sm-tela` / `--sm-anel` | **não** | valores literais em `.sm2-viewport`; o bisel (`.sm2-device`) saiu em 16/09/2026 ⚰️ — a página é o corpo |
| `--sm-toque-min` 44px | **não** | `.sm-btn { min-height: 44px }` e os `min-height: 44px` do kit vetor — literais (`.sm-px-switch` saiu com o kit pixel em 16/09/2026 ⚰️; `.sm-tap-44` saiu em 20/09/2026: o contador de adiamentos passou a ser um botão de 44 de verdade, D-A4) |
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
| `src/components/ui/` (44 arquivos shadcn) morre inteiro | **quase** — restam **9** entradas em 20/09/2026, das quais 6 são peças NOVAS do kit (`Icon`, `MiniGlass` — o mini-visor do canvas Pet, `NavGlyphs`, `OfflineSeal`, `ScreenSkeleton`, `Viewport`) + 2 testes; o único sobrevivente shadcn é `sonner.tsx`, que o próprio plano isentava até a Onda 4 | `ls src/components/ui/ \| wc -l` |
| `lucide-react` sai | **parcial** — **7** arquivos `.tsx` ainda importam em 20/09/2026 (eram 8; `GameTutorialFlow` migrou) | `grep -rl "lucide-react" src --include=*.tsx`: `AISettingsModal`, `SettingsModal`, `TournamentPage`, `SettingsPage`, `ChatBox`, `SoulmonOnboarding`, `LibraryPage` |

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

Lista fechada, para o `STATUS.md`. Medidas em 09/09/2026, revistas em
20/09/2026 (delta `2580b73a..dc72579e`) e em 21/09/2026 (delta
`dc72579e..9875477b`, que só acrescentou a #14): as marcadas ⚰️ fecharam.

| # | Onde | Divergência |
|---|---|---|
| 1 | `CLAUDE.md` › UI × `src/styles/tokens.md` §6.1 | ⚰️ **fechada em 16/09/2026** (`3fdfeee1`, P3 do canvas Sistema): o `CLAUDE.md` dizia "nav 36px / ações 42px / chat 30px" e hoje diz 32 / 24 / 32, citando `tokens.md` §6.1 e `iconScale.contract.test.ts` |
| 2 | `CLAUDE.md` › arte e `src/types/progression.ts` × `src/utils/sprites.ts` | o símbolo é `legacySpriteForStage`; `fallbackSpriteForStage` só existe em comentário e em teste |
| 3 | `docs/INVENTARIO-TELAS.md` §1.1 (19/08/2026) × repositório | 60 PNGs de ícone → **57**; 158 PNGs em `src/assets/soulmon/` → **1198** |
| 4 | `src/index.css` × `src/` inteiro | **catorze** tokens `--sm-*` declarados **sem nenhum consumidor** em 20/09/2026 (eram seis): os seis de sempre (`--sm-gold-soft`, `--sm-danger-soft`, `--sm-energy`, `--sm-energy-track`, `--sm-ok-ink`, `--sm-help-accent`) mais oito que a Fase 2 deixou órfãos — `--sm-danger`, `--sm-haunt-ink`, `--sm-haunt-veil`, `--sm-help-item-bg`, `--sm-px-ink`, `--sm-px-panel-bg`, `--sm-px-panel-ink`, `--sm-px-red` (§2.7) |
| 5 | `public/manifest.json` × `src/index.css` | ⚰️ a metade do `theme_color` **fechou em 15/09/2026** (`#0f766e`, `background_color` `#071413`, `005a2941`). Fica só `lang: "pt-BR"` contra a regra "inglês é a base" |
| 6 | `docs/PLANO-DESIGN.md` §0 item 1 × código | ⚰️ **fechada na Fase 2**: o kit pixel caiu de 28 para 14 `.tsx` e o que sobrou não é 9-slice/Silkscreen; o `PixelKit` é vetor sobre `--sm2-*` (`a482dfd5`). Os 14 residuais estão listados como candidatos à saída em §2.2 |
| 7 | `docs/PLANO-DESIGN.md` §0 item 4 × `src/index.css` | ⚰️ **fechada em 16/09/2026**: a `.sm-bottom-nav-label` é Rubik 12/500 (canvas Home, `NavEstados`), não Silkscreen |
| 8 | `docs/PLANO-DESIGN.md` Onda 0 × código | `ArenaGame.tsx` e `OraclePage.tsx` continuam no bundle; `lucide-react` em **7** arquivos (eram 8) |
| 9 | `brand/design-system.md` × produto | o arquivo é da **Consultech360**, não do Soulmon |
| 10 | `src/contexts/ThemeContext.tsx` × expectativa do nome | o modo `'system'` **não** segue o SO: `resolveSystemPreference()` devolve `'dark'` sempre. Intencional e justificado no código; **régua: nenhuma** |
| 11 | `docs/PALCO-E-DECORACAO.md` × `src/utils/petStage.ts` | `GROUND_Y` = 74 é a conta do sprite de 80px; o sprite é `PET_BOX` = 152 e a origem real é `PET_TOP_OFFSET` = −38. O código e o doc já registram o desvio; a conta do palco **não foi refeita** — e o berço mudou para 220×104 em 15/09/2026 (§7.1), o que aquele doc também não descreve |
| 12 | `src/utils/backgrounds.ts` × `StageSetting` | o tipo ainda aceita `'void'`, mas nenhum cenário o declara desde 15/09/2026 (§7.2) — tipo com valor sem consumidor; **régua: nenhuma** |
| 13 | `src/styles/tokens.md` × `src/index.css` | o `grep` de tokens `--sm2-*` devolve 59 e são 58: `--sm2-btn` é seletor de variante do kit vetor, não token declarado (§2.8) |
| 14 | `CLAUDE.md`, `docs/SOM.md` e este doc (§9) × `docs/REGISTRO-DE-DECISOES.md` §6.1 | os três diziam "**S1..S13**", mas o registro tem **S15** desde 09/09/2026 (`6bbdd9f8`, termos do gerador) e **S16** desde 21/09/2026 (`ee79fd44`); **não existe S14**. Achado em 21/09/2026 ao sincronizar §9.5; ⚰️ este doc passou a dizer S1..S16 em 21/09/2026 (sincronização sobre `73be1a2f`); ⚰️ `CLAUDE.md` › Áudio corrigido em `15164e4c` (21/09/2026, autorizado pelo dono): S1..S16, cinco arquivos, `sonsAssets.ts`/`trilha.ts` — **régua: nenhuma** |
| 15 | ⚰️ `docs/SOM.md` §5 e `REGISTRO-DE-DECISOES.md` §6.1 (linha da S16) × `public/sounds/` | diziam "188 KB" / "188 031 bytes" e "camada-base" (estado de `ee79fd44`: uma camada); em `73be1a2f` são **5** arquivos, duas camadas de trilha, **258 248 bytes** (`ls -l public/sounds/`, 21/09/2026). **Fechada em `8d318529`** (mesmo dia): a S16 foi emendada ("emenda no mesmo dia … 258 248 bytes em 5 arquivos") e `docs/SOM.md` não cita mais 188 (`grep -n 188 docs/SOM.md` → vazio). O total é conferido contra o teto S6 por `sonsAssets.contract.test.ts` |
