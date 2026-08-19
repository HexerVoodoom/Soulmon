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

Escala **fechada**, e o piso é **absoluto**:

`--sm2-text-xs` 12 · `-sm` 14 · `-md` 16 · `-lg` 20 · `-xl` 24 · `-2xl` 32

Não existe texto abaixo de 12px no app — nem legenda, nem rodapé de card, nem
"detalhe". Entrelinhas: `--sm2-leading-body` 1.45 (corpo) e
`--sm2-leading-title` 1.2 (títulos).

Helpers prontos: `.sm2-title`, `.sm2-text`, `.sm2-muted`, `.sm2-num`,
`.sm2-device-voice`.

> **Cuidado com o nome.** `.sm2-device-voice` é a TIPOGRAFIA (a voz do
> aparelho); `.sm2-device` é o CORPO do aparelho (padding, bisel, fundo,
> sombras). As duas já se chamaram igual, e como as propriedades eram
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
| `material-symbols-rounded.woff2` | **147 KB** | 102 ícones |

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

**Inventário atual (102):**

`accessibility_new, add, archive, arrow_back, arrow_forward, auto_awesome,
bedtime, bolt, calendar_month, casino, chat_bubble, check, check_circle,
chevron_left, chevron_right, cleaning_services, close, cloud_done, cloud_off,
content_copy, dark_mode, delete, diamond, do_not_disturb_on, download,
drag_indicator, eco, edit, egg, emoji_events, event_repeat, expand_less,
expand_more, favorite, filter_list, flag, help, home, info, inventory_2,
leaderboard, light_mode, link, local_fire_department, lock, lock_open, logout,
menu, mic, military_tech, mood, more_horiz, nightlight, paid, palette,
pan_tool, park, pause, pending, person, pets, play_arrow, psychology,
radio_button_unchecked, refresh, replay, restaurant, schedule, search, send,
sentiment_satisfied, settings, share, shopping_bag, shower, sort, spa, star,
stop_circle, storefront, swords, sync, task_alt, timer, today, touch_app,
translate, trending_up, tune, undo, upload, visibility, visibility_off,
volume_off, volume_up, volunteer_activism, warning, water_drop, wb_sunny,
wifi_off`

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
| `children` | `ReactNode` | — | renderiza dentro da tela, sob o reflexo |

É a **fronteira** entre o pixel (dentro) e o vetor (fora). Anatomia fixa:
bisel externo 20px · tela interna 12px · anel de cobre de 4px (2px de linha +
2px de sombra interna) · interior `--sm2-viewport-bg`, **escuro nos dois
temas** · **um único** reflexo `linear-gradient(160deg, rgba(255,255,255,.10),
transparent 40%)` · vinheta interna de 12% · **sem scanline** por padrão.

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

## 9. Checklist para a próxima onda

- [ ] Usou `*-ink` para texto e `*-fill` para fundo? Texto sobre fill usa `--sm2-on-*`?
- [ ] Todo token novo foi declarado nos DOIS temas?
- [ ] Nenhum texto abaixo de 12px; número que muda com `.sm2-num`?
- [ ] Silkscreen só no visor e em selo, ≥14px, caixa alta?
- [ ] Ícone sem moldura, sem fundo, sem borda?
- [ ] Escala do `Viewport` inteira?
- [ ] Classe utilitária nova? Ela **existe** no `index.css`? (footgun 1 — o
      Tailwind aqui é pré-compilado; classe ausente não aplica nada e não avisa)
- [ ] `npx tsc --noEmit` e `npx vitest run` limpos.
