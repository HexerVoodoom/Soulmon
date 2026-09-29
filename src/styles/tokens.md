# Fundação do design system — tokens `--sm2-*`

Onda 1. Este documento é o contrato que as ondas seguintes consomem.
Tudo aqui vive em `src/index.css` (no fim do arquivo) e é verificado por
`src/styles/tokens.contrast.test.ts` e
`src/components/ui/foundation.render.test.tsx`.

> **Por que `--sm2-*` e não sobrescrever os `--sm-*`.**
> Os `--sm-*` atuais estão espalhados por ~6300 linhas do `index.css` — kit
> pixel, palco do pet, masmorra, moldura chanfrada. Trocar o VALOR deles
> repinta toda tela existente de uma vez, sem que nenhuma onda tenha revisado
> nada: é regressão garantida, e o pedido era não regredir nada que já
> funciona. O conjunto novo nasce ao lado. As ondas seguintes migram tela por
> tela (`--sm-x` → `--sm2-x`); quando a última migrar, os `--sm-*` morrem.

---

## 1. A regra que mata o bug de contraste: TINTA × FILL

Todo acento tem **dois** tokens, e eles **nunca** têm o mesmo valor:

| sufixo | papel | onde entra |
|---|---|---|
| `*-ink` | **tinta** — cor de texto/glifo | `color:` sobre `bg`, `surface`, `surface-2` |
| `*-fill` | **preenchimento** | `background-color:` de botão, barra, chip, badge |
| `--sm2-on-<acento>` | tinta **sobre** o fill | `color:` de qualquer texto por cima de um `*-fill` |

Três frases, e são as únicas que interessam:

- **Nunca** `color: var(--sm2-gold-fill)`. Fill não é tinta.
- **Nunca** `background: var(--sm2-gold-ink)`. Tinta não é fill.
- Texto em cima de um fill usa `--sm2-on-*`, jamais o `*-ink` do mesmo acento.

O bug recorrente do projeto (texto quase ilegível, "mas no screenshot parecia
ok") acontece quando UMA cor tenta servir aos dois papéis. Em tema escuro o
acento tem que ser CLARO para ser tinta legível, e um acento claro usado como
fill exige texto ESCURO em cima. As duas exigências são opostas; por isso são
dois tokens. `danger` hoje coincide em valor entre `ink` e `fill` em cada
tema, mas os dois tokens existem assim mesmo — é o que permite separá-los
depois sem caçar call-site.

## 2. Paleta

O tema **escuro é o canônico** (o Soulmon é noturno). O claro é a
localização, não a origem.

### Escuro — `[data-theme="dark"]`

| token | valor |
|---|---|
| `--sm2-bg` | `#08191A` |
| `--sm2-surface` | `#0F2A29` |
| `--sm2-surface-2` | `#163735` |
| `--sm2-line` | `#1E3F3C` |
| `--sm2-ink` | `#E9F5F2` |
| `--sm2-muted` | `#9DBCB4` |
| `--sm2-primary-ink` / `--sm2-primary-fill` | `#5FF3E0` |
| `--sm2-primary-deep` | `#29C9B8` |
| `--sm2-primary-soft` | `rgba(95,243,224,.14)` |
| `--sm2-on-primary` | `#04211F` |
| `--sm2-gold-ink` | `#EBBE84` |
| `--sm2-gold-fill` | `#D9A05B` |
| `--sm2-on-gold` | `#04211F` |
| `--sm2-danger-ink` / `--sm2-danger-fill` | `#FF8B8B` |
| `--sm2-on-danger` | `#04211F` |
| `--sm2-viewport-bg` | `#071413` |
| `--sm2-viewport-ink` | `#E9F5F2` |
| `--sm2-viewport-ring` / `-ring-deep` | `#C68642` / `#241507` |
| `--sm2-haunted` | `#85A0B8` |
| `--sm2-icon-grad` | `-25` |

### Claro — `:root, [data-theme="light"]`

| token | valor |
|---|---|
| `--sm2-bg` | `#F1F7F5` |
| `--sm2-surface` | `#FFFFFF` |
| `--sm2-surface-2` | `#E9F2EF` |
| `--sm2-line` | `#DCE9E6` |
| `--sm2-ink` | `#0E2422` |
| `--sm2-muted` | `#4E6B66` |
| `--sm2-primary-ink` / `--sm2-primary-fill` | `#0B6F68` |
| `--sm2-primary-deep` | `#08544F` |
| `--sm2-primary-soft` | `#D6F5EF` |
| `--sm2-on-primary` | `#FFFFFF` |
| `--sm2-gold-ink` | `#8A5A2B` |
| `--sm2-gold-fill` | `#A2641F` |
| `--sm2-on-gold` | `#FFFFFF` |
| `--sm2-danger-ink` / `--sm2-danger-fill` | `#B3261E` |
| `--sm2-on-danger` | `#FFFFFF` |
| `--sm2-viewport-bg` | `#0E2422` (**escuro no tema claro também**) |
| `--sm2-viewport-ink` | `#E9F5F2` |
| `--sm2-viewport-ring` / `-ring-deep` | `#B0722F` / `#5E3612` |
| `--sm2-haunted` | `#4E6A83` |
| `--sm2-icon-grad` | `0` |

Dois desvios da proposta original, e os dois foram MEDIDOS, não opinados:

- **Ouro claro:** `#C9873F` como fill dava **2,99:1** contra `#FFFFFF` — abaixo
  do 3:1 de componente não-textual (WCAG 1.4.11), e branco por cima dele dava
  2,99:1, muito abaixo de AA. Escurecido para `#A2641F`: 4,80:1 contra a
  superfície e 4,80:1 para o branco em cima. O `--sm2-gold-ink` continua
  `#8A5A2B` (texto), então o par tinta×fill segue com valores distintos.
- **`--sm2-btn-text` virou `--sm2-on-primary` / `--sm2-on-gold` /
  `--sm2-on-danger`.** Um único "texto de botão" só funciona enquanto existe
  um só fill; no minuto em que o botão de perigo aparece, ele volta a ser a
  cor errada em cima de alguma coisa.

**`--sm2-haunted` (P5, canvas Home, 16/09/2026):** a tinta PRÓPRIA da
tarefa assombrada — azul-acinzentado "fantasma", o quarto acento, aprovado
pelo dono contra a recomendação do crítico (que preferia `muted`). Sólida,
nunca por opacidade (F1 da crítica: `opacity:.55` na linha dava 2,31:1 no
claro). A proposta do lead era escuro `#6E8AA3` / claro `#4E6A83`; o escuro
media **4,21:1** sobre `surface` (`#0F2A29`) e foi clareado para `#85A0B8`
(5,58:1), o hex que o crítico mediu. Vale para título e ícone da linha; o chip "haunted · +relief" é
`gold-ink` sobre `surface-2`. Guard no `tokens.contrast.test.ts`.

### FOOTGUN 10 — paridade obrigatória

**Todo token de cor existe nos DOIS blocos.** Token declarado só em `:root`
fica preso no valor claro quando `[data-theme="dark"]` está ativo — foi assim
que a página do Pet renderizou texto quase preto sobre card verde-escuro. Há
teste mecânico exigindo a paridade das chaves, nas duas direções.

## 3. Contraste medido (WCAG 2.x, calculado no teste)

| par | claro | escuro | mínimo |
|---|---|---|---|
| ink / surface | 16,23:1 | 13,59:1 | 4,5:1 |
| muted / surface | 5,80:1 | 7,43:1 | 4,5:1 |
| primary-ink / bg | 5,55:1 | 13,21:1 | 4,5:1 |
| gold-ink / surface | 5,87:1 | 8,84:1 | 4,5:1 |
| on-primary / primary-fill | 6,02:1 | 12,38:1 | 4,5:1 |
| ink / bg | 14,96:1 | 16,15:1 | 4,5:1 |
| muted / bg | 5,35:1 | 8,83:1 | 4,5:1 |
| muted / surface-2 | 5,09:1 | 6,30:1 | 4,5:1 |
| gold-ink / bg | 5,41:1 | 10,51:1 | 4,5:1 |
| danger-ink / surface | 6,54:1 | 6,73:1 | 4,5:1 |
| on-gold / gold-fill | 4,80:1 | 7,35:1 | 4,5:1 |
| on-danger / danger-fill | 6,54:1 | 7,50:1 | 4,5:1 |
| on-primary / primary-deep | 8,78:1 | 8,16:1 | 4,5:1 |
| viewport-ink / viewport-bg | 14,53:1 | 16,82:1 | 4,5:1 |
| haunted / surface | 5,66:1 | 5,58:1 | 4,5:1 |
| haunted / bg | 5,21:1 | 6,63:1 | 4,5:1 |
| haunted / surface-2 | 4,96:1 | 4,73:1 | 4,5:1 |
| gold-fill / surface (UI) | 4,80:1 | 6,60:1 | 3:1 |
| gold-fill / bg (UI) | 4,42:1 | 7,84:1 | 3:1 |
| primary-fill / bg (UI) | 5,55:1 | 13,21:1 | 3:1 |

O menor número da tabela é **4,42:1** — todo par de TEXTO passa AA com folga e
todo fill passa o 3:1 de componente. Cor translúcida (`--sm2-primary-soft`) é
composta sobre o fundo antes de medir; medir alfa direto dá número inventado.

**Não confie em screenshot para conferir isto.** Entre 3:1 e 5:1 o olho mente
(footgun 10). Se mexer numa cor, o teste é o portão.

## 4. Tipografia

| papel | fonte | token |
|---|---|---|
| títulos | **Fredoka** (variável 300–700) | `--sm2-font-display` |
| texto e dado | **Rubik** (400–500) | `--sm2-font-text` |
| voz do aparelho | **Silkscreen** | `--sm2-font-pixel` |
| ícones | **Material Symbols Rounded** (variável) | `--sm2-font-icon` |
| dígito de moeda (Bits) | pilha **mono** nomeada por sistema | `--sm2-font-mono` |
| dígito de moeda (Emblemas) | serifa | `--sm2-font-serif` |

> **`--sm2-font-mono` não pode começar em `ui-monospace`.** Medido no Windows:
> `ui-monospace` resolve para a mono do sistema e, a 12px, lê quase igual à
> Rubik de relance — ou seja, a "fonte de calculadora" dos Bits, que é regra de
> produto (`CLAUDE.md`: as três moedas nunca se confundem), dependia de
> plataforma. A pilha nomeia face concreta ANTES de qualquer genérico
> (`'Cascadia Mono', Consolas, Menlo, 'Roboto Mono', 'DejaVu Sans Mono',
> 'Courier New', ui-monospace, monospace`) e as três primeiras trazem o sinal
> que identifica dígito de máquina na hora: zero cortado no Windows/macOS/iOS,
> zero pontilhado no Android. **E a família não trabalha sozinha**:
> `bitsStyle` acrescenta `slashed-zero` como segundo eixo e troca o
> `letter-spacing` de `1px` fixo para `0.08em`, que acompanha o tamanho (o
> saldo aparece a 12px na Loja e a 20px em Atividades).

Escala **fechada**, e o piso é **absoluto**:

`--sm2-text-xs` 12 · `-sm` 14 · `-md` 16 · `-lg` 20 · `-xl` 24 · `-2xl` 32

Não existe texto abaixo de 12px no app — nem legenda, nem rodapé de card, nem
"detalhe". Entrelinhas: `--sm2-leading-body` 1.45 (corpo) e
`--sm2-leading-title` 1.2 (títulos).

Helpers prontos: `.sm2-title`, `.sm2-text`, `.sm2-muted`, `.sm2-num`,
`.sm2-device-voice`.

> **Cuidado com o nome.** `.sm2-device-voice` é a TIPOGRAFIA (a voz do
> aparelho); `.sm2-device` ERA o CORPO do aparelho (padding, bisel, fundo,
> sombras) — saiu em 16/09/2026 (canvas Home, D-H1: a página é o corpo; só
> anel + vidro sobram), mas o nome continua reservado. As duas já se chamaram igual, e como as propriedades eram
> disjuntas elas somavam em vez de sobrescrever: pedir a fonte trazia a
> carcaça junto, e a carcaça fazia a subárvore herdar bitmap em caixa alta.

**Números que mudam usam `.sm2-num`** (`font-variant-numeric: tabular-nums`):
HP, energia, Bits, Emblemas, contadores, cronômetro. Sem tabular-nums o valor
"dança" na horizontal a cada tick e a barra inteira parece tremer.

### Quando usar Silkscreen (mudou de papel, não saiu)

Silkscreen deixa de ser a fonte de display do app e passa a ser a **voz do
aparelho** — a coisa que o dispositivo diz, não a coisa que o produto diz.

Use **só** em dois lugares:

1. **dentro do `Viewport`** (HUD do visor, contador, mensagem de sistema);
2. em **selos** (rótulo de conquista, marca de dia perfeito, faixa de torneio).

Regras: **mínimo 14px** e **caixa alta** (`.sm2-device-voice` já aplica as duas).
Abaixo de 14px o bitmap fecha os contornos e os acentos viram borrão.

**Acentos:** verificado no cmap do arquivo real
(`node_modules/@fontsource/silkscreen/files/silkscreen-latin-400-normal.woff`):
`Ã Õ Ç Ê Á À Â É Í Ó Ô Ú Ü` e as minúsculas correspondentes **existem** na
fonte, todas dentro do subset `latin` (U+00C0–U+00FF) que o app já carrega via
`@fontsource/silkscreen/latin-400.css`. **Não é preciso fallback** e não é
preciso carregar `latin-ext`. Se um dia um texto de aparelho precisar de algo
fora do Latim-1, a regra é trocar o TEXTO — não é uma fonte para prosa.

## 5. Fontes: self-host, e o motivo é o service worker

**Decisão: self-host, sem exceção.** `public/sw.js` faz
`if (url.origin !== self.location.origin) return;` — ele ignora toda
requisição cross-origin. Fonte servida por `fonts.gstatic.com` **nunca entra
no cache** e some quando o app abre offline, que é metade do uso de um PWA de
bichinho (abre, cuida, fecha). Servida de `/fonts/*.woff2` ela cai na regra
cache-first de same-origin que já existe, sem tocar no `sw.js`.

Arquivos em `public/fonts/`, `@font-face` no fim de `src/index.css`,
`preload` no `index.html`. **Nenhuma dependência nova no `package.json`** —
os `.woff2` são assets, não pacotes.

| arquivo | tamanho | subset |
|---|---|---|
| `fredoka-latin.woff2` | 29 KB | latin |
| `fredoka-latin-ext.woff2` | 4,5 KB | latin-ext |
| `rubik-latin.woff2` | 35 KB | latin |
| `rubik-latin-ext.woff2` | 19 KB | latin-ext |
| `material-symbols-rounded.woff2` | **152 KB** | 102 ícones |

### Silkscreen: onde ela mora, e o que foi MEDIDO

A Silkscreen é a **única** que não está em `public/fonts/`: ela vem do pacote
`@fontsource/silkscreen` (SIL OFL 1.1), importado em `src/main.tsx`
(`latin-400.css` + `latin-700.css`). O `@font-face` é o do pacote — o Vite
resolve o `url(./files/…woff2)` para um asset com hash servido pela **mesma
origem**, então ela cai na regra cache-first do `sw.js` igual às outras. A
decisão de §5 (self-host) está cumprida; o que muda é o caminho.

Uma avaliação relatou "Silkscreen NUNCA carrega
(`document.fonts.check('16px Silkscreen') === false`)". Medido com CDP no app
rodando, o diagnóstico é outro e tem três partes:

1. **O `@font-face` existe e a família bate.** `document.fonts` lista
   `Silkscreen 400` e `Silkscreen 700`.
2. **O arquivo é servido.** `await document.fonts.load('16px Silkscreen')`
   devolve 1 face e o `check` passa a `true` logo depois. Não é peso morto no
   bundle nem 404.
3. **`check() === false` na Home é o comportamento CORRETO do navegador.**
   Fonte só é baixada quando um nó realmente a exige; nenhum elemento da Home
   pede `--sm2-font-pixel`, então nada é buscado. A conclusão "nunca carrega"
   confundiu carregamento preguiçoso com fonte quebrada.

O que o relato acerta é a **ausência na Home**, e ela é por desenho: a regra
desta seção manda usar Silkscreen só no visor e em selo, e o `Viewport` da Home
não desenha HUD de texto. Os três consumidores reais hoje são
`ui/OfflineSeal.tsx` (selo, ≥14px, caixa alta — aparece **na Home**, offline),
`ui/ScreenSkeleton.tsx` (palavra do sistema) e o selo de faixa da
`TournamentPage`.

> **Pendência de outro dono:** pôr a voz do aparelho dentro do visor da Home
> (contador/HUD do `Viewport`) é edição de `src/components/ui/Viewport.tsx` e
> do `CompanionHUD` — nenhum dos dois é deste dono. Enquanto isso não acontecer,
> a Silkscreen segue correta e carregável, mas visível só em estados
> (offline, esqueleto) e no Torneio.

**Não preloadar.** Pelo mesmo motivo da Material Symbols: ela não está na
primeira tela: preload seria bytes no caminho crítico e um aviso de
"preloaded but not used" no console.

`font-display: swap` no texto (o conteúdo aparece na hora com a fonte do
sistema, sem bloquear o LCP) e **`block` no ícone** — com `swap`, a ligature
da Material Symbols mostraria a PALAVRA "settings" por uns 100 ms antes do
glifo chegar.

### Regerar / acrescentar ícones

A fonte completa da Material Symbols Rounded tem **5,3 MB**; a subsetada por
`icon_names` tem 145 KB. Ícone que não estiver no inventário **não renderiza**
(o `<span>` fica vazio, sem erro). Para acrescentar, junte o nome novo,
**ordene alfabeticamente** (a API recusa lista fora de ordem com
`400: Invalid selector`) e rebaixe o arquivo:

```bash
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
NAMES="<lista ordenada, separada por vírgula>"
curl -s -A "$UA" "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-25..200&icon_names=$NAMES&display=block" -o /tmp/msr.css
curl -s -A "$UA" -o public/fonts/material-symbols-rounded.woff2 "$(grep -o 'https://fonts.gstatic.com[^)]*' /tmp/msr.css | head -1)"
```

Ao trocar o arquivo, **suba o `CACHE_VERSION` de `public/sw.js`** — senão
quem já tem o app instalado fica com a fonte velha e o ícone novo não aparece.

**Inventário atual (102 — a linha dizia 102 com 100 nomes; contados de novo em 16/09/2026):**

`accessibility_new, add, archive, arrow_back, arrow_forward, auto_awesome,
bedtime, bolt, calendar_month, casino, chat_bubble, check, check_circle,
chevron_left, chevron_right, cleaning_services, close, cloud_done,
cloud_off, content_copy, dark_mode, delete, diamond, do_not_disturb_on,
download, drag_indicator, eco, edit, egg, emoji_events, event_repeat,
expand_less, expand_more, favorite, filter_list, flag, groups, help, home,
info, inventory_2, leaderboard, light_mode, link, local_fire_department,
lock, lock_open, logout, menu, mic, military_tech, mood, more_horiz,
nightlight, paid, palette, pan_tool, park, pause, pending, person, pets,
play_arrow, psychology, radio_button_unchecked, refresh, replay,
restaurant, schedule, search, send, sentiment_satisfied, settings, share,
shopping_bag, shower, sort, spa, star, stop_circle, storefront, swords,
sync, task_alt, timer, today, touch_app, toys, translate, trending_up,
tune, undo, upload, visibility, visibility_off, volume_off, volume_up,
volunteer_activism, warning, water_drop, wb_sunny, wifi_off`

> `toys` (Brincar, 5ª célula do deck) e `groups` (Biblioteca, no menu da nav)
> entraram pelo canvas Home (P6, decisão do dono em 16/09/2026; o crítico
> derrubou `pets` — é a criatura — e `person` — é perfil). Arquivo rebaixado
> pelo comando acima; `CACHE_VERSION` v122.
>
> `mic`, `send` e `stop_circle` entraram na onda do ChatBox (a barra de chat é
> `position: fixed`, aparece em toda a Home e era a última superfície com PNG
> raster + `lucide-react`). O arquivo foi rebaixado pelo comando acima e o
> `CACHE_VERSION` do `public/sw.js` subiu junto (v79).

## 6. `Icon` — API

`src/components/ui/Icon.tsx`

```tsx
import { Icon } from './components/ui/Icon';

<Icon name="favorite" size={28} fill={ativo ? 1 : 0} tone="primary"
      label={language === 'pt-BR' ? 'Carinho' : 'Affection'} />
```

| prop | tipo | padrão | nota |
|---|---|---|---|
| `name` | `string` | — | ligature; **tem que estar no inventário** |
| `size` | `number` | `24` | px renderizados; `opsz` é casado e clampado em 20–48 |
| `fill` | `number` | `0` | eixo FILL 0–1; **é o sistema de estado**, e interpola |
| `weight` | `number` | `500` | eixo wght 100–700 |
| `grade` | `number` | do tema | GRAD; omita para herdar `-25` no escuro / `0` no claro |
| `tone` | `'ink' \| 'muted' \| 'primary' \| 'gold' \| 'danger' \| 'inherit'` | `'inherit'` | todos são tokens de **tinta** |
| `label` | `string` | — | ausente = decorativo (`aria-hidden`); presente = `role="img"` |
| `className`, `style` | — | — | |

Três regras que **não** afrouxam:

1. **Ícone NUNCA dentro de box.** O componente não desenha moldura, fundo,
   borda, chanfro nem padding — em nenhuma prop, nunca (regra do dono,
   `CLAUDE.md`). Alvo de toque de 44px é responsabilidade do **botão** que
   envolve o ícone. Há teste travando tanto o CSS quanto o componente.
2. **`FILL 0→1` é o estado.** Inativo → ativo é o MESMO glifo se preenchendo,
   nunca dois ícones diferentes trocando de lugar. Valor fracionário é
   válido e útil (arraste, progresso). A interpolação já vem com transição de
   `--sm2-dur-tap`.
3. **`opsz` casado ao tamanho renderizado.** É o que impede o traço de afinar
   em 20px e engrossar em 40px. Fora de 20–48 o componente clampa: valor
   inválido em `font-variation-settings` invalida a declaração INTEIRA em
   alguns WebViews, e aí o ícone perde junto o FILL e o wght.

`weight` 500 (e não 400) é o que faz o traço casar com a espessura do pixel do
sprite; 400 devolve "biblioteca de ícones padrão".

### 6.1 A ESCALA DE ÍCONE (fechada, como a de texto)

Este documento fixava a escala de TEXTO e **nunca declarou a de ÍCONE**. A
ausência não ficou neutra: a Loja chegou a desenhar **14, 16, 18, 22 e 32px na
mesma tela** — cinco tamanhos, nenhuma regra, porque `size` é um número livre e
todo call-site escolheu o dele. A Home, por acidente de disciplina, já usava só
quatro. Esses quatro viram a escala.

| degrau | px | papel — e SÓ ele |
|---|---|---|
| `inline` | **20** | ícone que anda ao lado de TEXTO na mesma linha: dica, chip, preço, saldo, rótulo de campo. Casa com a altura de x da Rubik 14/16. |
| `action` | **24** | ícone que É a ação ou o estado de uma LINHA de lista / botão de barra: fechar, cadeado, "equipado", linha de menu — e, desde 27/08/2026, também o deck de ações do aparelho (ver `deck` abaixo). |
| `nav` | **32** | destino da barra inferior e botão da barra de chat. |
| `deck` | **24** | o deck de ações do aparelho (Home) — comida, carinho, banho. **Era 42, dedicado.** O dono achou o deck grande demais tomando espaço do pet/rituais em 27/08/2026; encolheu para dividir o degrau `action` em vez de abrir um quinto — o deck virou, na prática, mais uma fileira de botões de barra, não mais o elemento de maior peso visual da Home. |

Três valores distintos hoje (20 → 24 → 32) — quatro PAPÉIS continuam
nomeados porque o CONTEXTO de cada um é outro (linha de lista vs. corpo do
aparelho), mesmo com `action` e `deck` no mesmo px desde 27/08/2026. Não
existe degrau intermediário: 22 ao lado de 24 na mesma tela não é hierarquia,
é ruído — ninguém consegue dizer qual dos dois significa mais.

**Como escolher, em uma pergunta:** _o ícone está ao lado de uma palavra na
mesma linha?_ Sim → **20**. Não, ele ocupa a coluna de ação/estado da linha,
OU é o deck da Home? → **24**. É a barra do aparelho (nav/chat) → **32**.

**Não há token CSS para isto**, de propósito: `Icon`/`NavGlyph` recebem `size`
como NÚMERO (o `opsz` é casado a ele em JS, §6 regra 3), então um
`var(--sm2-icon-*)` não chegaria ao `font-variation-settings`. O contrato é
esta tabela + a revisão. Tamanho novo fora dos quatro degraus só entra aqui
com o papel escrito ao lado — se o papel já existe, use o degrau que existe.

**A tabela acima é EXECUTÁVEL**: `src/styles/iconScale.contract.test.ts` lê os
degraus daqui (não os digita) e varre o `src/` inteiro por
`<Icon size={n}>` / `<NavGlyph size={n}>`. Tamanho fora dos degraus reprova.
Degrau novo escrito nesta tabela passa a valer no mesmo commit; dívida
consciente vai para a allowlist do guard, **com o motivo escrito**.

> **Dívidas migradas (onda de escala de ícone).** Eram 38 de 100 call-sites
> fora da escala. `ChatBox` (26/30) foi para **32**; 18/16 inline foram para
> **20**; 28/26 de coluna de linha foram para **24**; 22 foi para **20** ou
> **24** conforme o papel. Sobraram 10, todos do MESMO papel — ver §6.1a.

### 6.1a Um 5º degrau, proposto (`state` = 48) — PENDENTE DE DONO

Migrar os 38 call-sites fora de escala pelo PAPEL (e não pelo número mais
próximo) revelou uma coisa que a tabela não previa: **28 caíram limpos nos
quatro degraus e os 10 restantes são todos a mesma coisa**, escrita por autores
diferentes em seis arquivos — um glifo sozinho, centralizado, acima de um
parágrafo, que **É a tela naquele momento**: estado vazio ("sua árvore ainda não
foi revelada"), estado de erro ("não deu para falar com o servidor"), estado de
conclusão ("pilha arrumada!"), herói do relatório diário e da intro da masmorra.
Estavam espalhados em 40 e 48; foram **unificados em 48**.

| degrau proposto | px | papel |
|---|---|---|
| `state` | **48** | o glifo que É a tela: estado vazio, estado de erro, estado de conclusão, herói de modal. Nunca em linha, nunca em lista, **no máximo UM por tela**. |

Por que não coube nos quatro que existem: **24 (`action`/`deck`) é a coluna de
ação da linha e o deck de ações do aparelho na Home** e a §6.1 diz "o papel — e
SÓ ele"; um estado vazio desenhado do tamanho do botão de dar comida é colisão
de significado, não hierarquia — e desde que o `deck` encolheu de 42 para 24
(27/08/2026), desenhar o herói de tela vazia ali seria também rebaixá-lo pela
metade.
**32 (`nav`) é a barra do aparelho**, e rebaixar para lá encolhe em 33% a única
coisa desenhada numa tela vazia. **48** já era o valor de 3 dos 10, e o do
relatório diário vive numa caixa de 48×48 declarada no JSX — o precedente da
§6.2 ("arte mora numa CAIXA, e a caixa manda no glifo") aponta para cá. Fica em
48 e não em 56 porque 56 é a caixa `art-md` da §6.2: um ícone de sistema do
tamanho da caixa de arte confunde as duas escalas.

Enquanto a linha não entra na tabela de §6.1, os 10 vivem na allowlist do guard
(`iconScale.contract.test.ts`, ENTRADA 1) e o guard **cobra a retirada da
entrada** no dia em que 48 virar degrau oficial.

### 6.2 EMOJI E ARTE NÃO SÃO TEXTO — nem ícone

O emoji dos consumíveis da Loja (👊 🎶 🤲 💗) é **conteúdo** — é o item que
está na pastinha, não um símbolo de sistema — então não vira Material Symbols.
Mas ele também não pode ser dimensionado pela escala de TEXTO: o motor de
layout trata emoji como glifo, e um `font-size: var(--sm2-text-2xl)` põe 32px
de TEXTO numa tela onde a escala tipográfica termina em 16px de corpo. Foi
assim que o audit mediu "texto de 32px" onde não há texto nenhum.

A regra: **arte mora numa CAIXA, e a caixa manda no glifo.**

| token de arte | px | uso |
|---|---|---|
| caixa `art-md` | **56** | miniatura do card de item (prévia de cenário, pixel de decoração, emoji do consumível) |
| glifo dentro dela | **28** | = metade da caixa; derivado dela, **nunca** de `--sm2-text-*` |

O glifo é `50%` da caixa e nada mais o governa: `line-height: 1`,
`font-size` em px literal com a caixa citada ao lado, e o nó é
`aria-hidden` (o nome do item já está na linha, em texto de verdade). Se a
caixa mudar de tamanho, o glifo muda junto — que é exatamente o que "arte" quer
dizer e "texto" não.

**Nunca** `fontSize: 'var(--sm2-text-*)'` num nó cujo conteúdo é emoji, sprite
ou qualquer desenho. A escala de texto serve ao que se LÊ.

## 7. `Viewport` — API

`src/components/ui/Viewport.tsx`

```tsx
import { Viewport } from './components/ui/Viewport';

<Viewport width={64} height={64} scale={3}
          label={language === 'pt-BR' ? 'Seu Soulmon' : 'Your Soulmon'}>
  <img src={sprite} alt="" />
</Viewport>
```

| prop | tipo | padrão | nota |
|---|---|---|---|
| `width` | `number` | — | largura **lógica** do canvas de pixel (antes da escala) |
| `height` | `number` | — | altura lógica |
| `scale` | `2 \| 3` | `3` | **só inteiro**; valor fracionário é arredondado |
| `breathing` | `boolean` | `true` | `prefers-reduced-motion` vence |
| `label` | `string` | — | ausente = decorativo (`aria-hidden`) |
| `className`, `style` | — | — | aplicam no **bisel** |
| `screenStyle` | `CSSProperties` | — | aplica na **tela** interna |
| `screenClassName` | `string` | — | classe da tela (ciclo diurno `.sm2-sky-*`) |
| `frame` | `boolean` | `false` | moldura 9-slice pixel (`hudArt.frame`) como overlay `absolute; inset: 0` **dentro** da tela, sob o reflexo, a 1× (24px de cano). Opcional em Masmorra/Torneio; **nunca na Home** (canvas Sistema SIS-05, X2) |
| `children` | `ReactNode` | — | renderiza dentro da tela, sob a moldura e o reflexo |

A mini-HUD pixel (`pixel/VisorBar.tsx`) desenha a **1×** e recebe o mesmo
`scale` do Viewport que a contém: barra e sprite na mesma grade de pixel. A
**moldura é recortada ao `max`** (canvas Home, D-H2/X4, 16/09/2026): largura
= cap 6 + 7·max + cap 6 (HP 3 = 33×8; a 2× = 66×16), segmento 6 em `left =
6 + 7·i`, meio = 3 — fórmula única, em `visorBarWidth()`. Os caps são fatiados
do `bar-frame-96x8` até a `squad-arte` entregar `bar-cap-l/mid/r` em grade.
Na Home ela senta sobre a **placa** `.sm2-visor-plate` (`color-mix(in srgb,
var(--sm2-viewport-bg) 78%, transparent)`, D-H3) com rótulo `HP`/`EN` e dígito
em Silkscreen 14 — dígito só com valor ≥ 1 (E5). É a ÚNICA leitura de
HP/energia da Home: a barra DOM do `HomeHud` saiu (§19). Quem monta a HUD
dentro do visor a põe como filha direta da tela, não da janela do palco (que
vaza pelo topo).

### 7.1 O kit vetor — `components/pixel/PixelKit.tsx`

Os primitivos FORA do visor (botão, painel, abas, chip, etiqueta, checkbox,
interruptor, medidores, casa de item, chip de estatística) são **vetor sobre
`--sm2-*`** desde 16/09/2026 (canvas Sistema, `docs/design/wireframes/sistema/
identidade/`, `DECISOES-WIREFRAME.md` §18) — a API `Pixel*` ficou a mesma; o
que saiu foi o 9-slice PNG, o chanfro de cobre e a Silkscreen fora do vidro.
Classes `.sm2-kit-*` no fim do `index.css`. Regras que o kit segue e que valem
para quem o estender: cor só por token; raio 4/12/20 (+ pílula como forma);
espaço `--sm2-space-*`; texto ≥ 12px; alvo ≥ 44; ícone é `Icon` pelado
(`iconName`); medidor **nunca vermelho** (`tone="red"` desenha em cobre);
foco = anel 2px `primary-ink` com fresta ≥ 2px. Testes:
`PixelKit.render.test.tsx`, `PixelStates.render.test.tsx`.

É a **fronteira** entre o pixel (dentro) e o vetor (fora). Anatomia fixa:
bisel externo 20px · tela interna 12px · anel de cobre de 4px (2px de linha +
2px de sombra interna) · interior `--sm2-viewport-bg`, **escuro nos dois
temas** · **um único** reflexo `linear-gradient(160deg, rgba(255,255,255,.10),
transparent 40%)` · vinheta interna de 12% · **sem scanline** por padrão.

> **"Por padrão" quer dizer: sem overlay PERMANENTE de listras** — sobre um
> sprite de 32px ele come metade do desenho, e isso continua proibido. O que
> existe é `.sm-visor-scan`: uma varredura de `--sm2-dur-scan` (400ms) que passa
> UMA vez no momento em que o sprite troca (a "sintonia") e sai do DOM. É
> transição, irmã do fade de `--sm2-dur-tap`, e não estado do visor. Com
> `prefers-reduced-motion` ela não toca — corte em JS, não `0.01ms`.

- **Escala inteira, sempre.** Escala fracionária é a causa nº 1 de pixel art
  borrada, e `image-rendering: pixelated` não salva meio pixel — só troca o
  borrão por linhas de espessura desigual. Por isso o tamanho da tela é
  DERIVADO (`width * scale`) e nunca recebido em CSS relativo.
- **Um reflexo só.** Dois brilhos param de ler como vidro e passam a ler como
  adesivo.
- **Visor claro não existe.** Um interior claro deixa de ler como aparelho e
  vira cartão — é o ponto inteiro da peça. Há teste medindo a luminância.
- O reflexo e a vinheta são `pointer-events: none`: não podem roubar o gesto
  de esfregar o pet que vive lá dentro.

A respiração é cortada em JS além do `@media` do CSS: o bloco global de
`prefers-reduced-motion` do projeto usa `animation-duration: 0.01ms` em `*`,
o que num loop `infinite` ainda dispara milhares de recálculos por segundo.

## 7a. Espaço — grid de 4 (P1, aprovado em 16/09/2026)

| token | valor | uso |
|---|---|---|
| `--sm2-space-half` | `2px` | **só** ícone ↔ rótulo na mesma linha (nav, chip) |
| `--sm2-space-1` | `4px` | gap entre blocos de barra, entre segmentos |
| `--sm2-space-2` | `8px` | gap padrão dentro de uma linha / entre ícone e texto |
| `--sm2-space-3` | `12px` | padding de card, gap entre linhas de lista |
| `--sm2-space-4` | `16px` | padding de página, gap entre seções |
| `--sm2-space-5` | `24px` | respiro entre grupos |
| `--sm2-space-6` | `32px` | respiro de topo de página / de folha |

Seis degraus e um meio-passo, invariantes de tema (bloco `:root`, junto de
raio e duração). O meio-passo é declarado para que o `gap: 2` que o canvas
Sistema (`docs/design/wireframes/sistema/identidade/`) usa entre ícone e
rótulo seja token e não literal — qualquer outro 2, 6, 10 ou 14 é literal
fora do grid (X8 da crítica). Trava: `styles/tokens.contrast.test.ts`.

## 8. Movimento

| token | valor | uso |
|---|---|---|
| `--sm2-dur-tap` | `120ms` | feedback de toque |
| `--sm2-dur-enter` | `200ms` | entrada de card / sheet |
| `--sm2-dur-page` | `320ms` | troca de página |
| `--sm2-ease` | `cubic-bezier(.2, 0, 0, 1)` | **a** curva |

Três durações e uma curva. Mais que isso vira ruído e ninguém consegue dizer
qual usar. O `@media (prefers-reduced-motion: reduce)` no fim do `index.css`
cobre tudo o que esta onda criou.

## 9. Barra de chat — `.sm2-chatbar` / `.sm2-chat-input` / `.sm2-chat-btn`

O `ChatBox` é `position: fixed` e aparece em **100% da Home**, então as três
classes `sm-px-*` dele eram a última linguagem de fliperama na tela mais vista
do app. Migradas para `--sm2-*` (fim do `index.css`). Some junto o hack de
redefinir `--sm-px-cyan` no elemento raiz do componente: o ciano do kit tinha
UM valor nos dois temas e dava ~1,4:1 no claro.

Duas decisões que não afrouxam:

- **A borda do campo é `--sm2-muted`, não `--sm2-line`.** O miolo do campo é
  `--sm2-bg` dentro de uma barra `--sm2-surface`, e esses dois dão **1,08:1**
  no tema claro: sem borda o campo não existe. Sendo a borda o que IDENTIFICA
  o controle, ela cai no 3:1 da WCAG 1.4.11 — `--sm2-line` dá 1,25 e reprova;
  `--sm2-muted` dá **5,80 (claro) / 7,43 (escuro)**.
- **A fonte do campo é `--sm2-font-mono`, nunca a Silkscreen.** É onde se
  digita frase livre em português com acento, e 16px é PISO (abaixo disso o
  Safari do iOS dá auto-zoom ao focar e a Home sai do lugar).

## 10. Checklist para a próxima onda

- [ ] Usou `*-ink` para texto e `*-fill` para fundo? Texto sobre fill usa `--sm2-on-*`?
- [ ] Todo token novo foi declarado nos DOIS temas?
- [ ] Nenhum texto abaixo de 12px; número que muda com `.sm2-num`?
- [ ] Silkscreen só no visor e em selo, ≥14px, caixa alta?
- [ ] Ícone sem moldura, sem fundo, sem borda?
- [ ] Ícone novo em um dos quatro PAPÉIS da §6.1 (`inline` 20 / `action` 24 /
      `deck` 24 / `nav` 32 — três valores, quatro papéis; 42 saiu em
      27/08/2026)?
- [ ] Emoji/arte fora da escala de texto, dentro de caixa própria, §6.2?
- [ ] Escala do `Viewport` inteira?
- [ ] Classe utilitária nova? Ela **existe** no `index.css`? (footgun 1 — o
      Tailwind aqui é pré-compilado; classe ausente não aplica nada e não avisa)
- [ ] `npx tsc --noEmit` e `npx vitest run` limpos.
