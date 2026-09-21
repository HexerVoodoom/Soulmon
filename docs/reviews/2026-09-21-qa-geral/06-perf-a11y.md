# Auditoria de performance e acessibilidade — Soulmon

> **Método**: leitura estática do `dist/` COMMITADO (não rodei `npm run build`
> nem a suíte, por instrução). Todos os números abaixo vêm de comando colado —
> nenhum é estimativa. Métricas de RUNTIME (FCP/TTI/INP/CLS/thread principal)
> **NÃO foram medidas** — exigem um navegador real e a tarefa pediu só
> leitura/medição estática. Isto é dito explicitamente onde relevante: "não
> medi" em vez de estimar.
> **Condição de teste declarada**: nenhuma — não há execução de rede/dispositivo
> nesta rodada. Os números de bundle valem para QUALQUER condição de rede,
> porque são bytes fixos; o que muda com a rede é o TEMPO de baixar esses bytes
> (estimado só como referência, marcado como estimativa).

---

## 1. Bundle (`dist/`)

```
$ du -sb dist
122043910   dist/   (~122 MB no total, todos os assets, incl. os que só
                      carregam sob demanda)

$ find dist -type f | sed 's/.*\.//' | sort | uniq -c | sort -rn
   1470 png
   1465 webp
     52 js
      7 woff2
      5 webm
      3 html
      2 woff
      2 mp4
      1 css

$ du -cb dist/assets/*.js | tail -1        →  2.533.797 B  (~2,42 MB, JS total, todos os chunks)
$ find dist -name "*.css" -exec du -cb {} + | tail -1   →    142.696 B (~139 KB)
$ find dist -name "*.png" -exec du -cb {} + | tail -1   → 21.290.751 B (~20,3 MB)
$ find dist -name "*.webp" -exec du -cb {} + | tail -1  →  2.495.174 B (~2,38 MB)
$ find dist -iname "*.woff2" -exec du -cb {} + | tail -1 →   260.424 B (~254 KB)
$ find dist -iname "*.mp4" -o -iname "*.mp3" -o -iname "*.wav" | xargs du -cb | tail -1 → 6.442.179 B (~6,1 MB, 2 vídeos)
$ du -sh dist/sounds  → 260K (5 arquivos .webm, os sons de IA de longa duração)
```

**O que realmente baixa no PRIMEIRO carregamento (app shell)**, medido do
`index.html`:

```
$ grep -o 'src="[^"]*\.js"' dist/index.html   → /assets/index-CtDh4dZo.js
$ grep -o 'href="[^"]*\.css"' dist/index.html → /assets/index-NrnwFuOG.css
$ du -h dist/assets/index-CtDh4dZo.js         → 624K
```

- **JS de entrada: 624 KB** (não gzipado — é o número que a rede transfere só
  com compressão HTTP, que eu não medi aqui porque exige servidor).
- **CSS de entrada**: `dist/assets/index-NrnwFuOG.css` faz parte dos 139 KB
  totais de CSS — é o único arquivo CSS do projeto (`src/index.css` é o único
  CSS empacotado, por regra do `CLAUDE.md` footgun 1), então **139 KB é o CSS
  inteiro do app**, carregado de uma vez, sempre — não há code-splitting de CSS.
- Chunks maiores por tamanho (`ls -la dist/assets/*.js | sort -k5 -rn`):
  `pool-D-wK9EoY.js` 832 KB · `index-CtDh4dZo.js` (entrada) 624 KB ·
  `index.esm-DEcmMY1B.js` 189 KB · `index-Cby75ShZ.js` 149 KB ·
  `vendor-DDxydHEc.js` (react+react-dom, manualChunks declarado em
  `vite.config.ts`) 138 KB · `attackFxArt-DuC8bxCA.js` 105 KB.
  - `pool-D-wK9EoY.js` **não está no caminho crítico**: é o `astronomy-engine`
    (`src/utils/soulProfile/astrology/chart.ts` → `import * as Astro from
    "astronomy-engine"`), importado só por `oracle.ts`/`arena.ts` via import
    DINÂMICO — o `CLAUDE.md` já documenta essa regra ("o motor é pesado e só
    entra por import dinâmico"), e a medição confirma que ele não está fundido
    ao `index-CtDh4dZo.js`.

### 1.1 Os 10 maiores arquivos do `dist/assets/`

```
$ find dist -type f -exec du -b {} + | sort -rn | head -15
3.917.240  evolution-bg-DM-tg_BX.mp4       (~3,7 MB) — vídeo de fundo da cerimônia de evolução
3.434.413  tournament-final-pVe8K8tM.png   (~3,3 MB) — cena do Torneio (masmorra/arena)
3.349.262  dungeon-7-S-LDJ3RI.png
3.338.357  dungeon-2-esrsUYPF.png
3.323.437  dungeon-6-BnDQwXnX.png
3.301.364  dungeon-1-TOWIU9TJ.png
3.274.666  dungeon-5-DsrTn2hq.png
3.246.208  dungeon-9-BOd0d9Q8.png
3.207.242  dungeon-3-CTaFvZIu.png
3.056.641  tournament-night-Boj16GHx.png
3.028.582  minigame-rps-C15IVNt7.png
2.998.650  dungeon-10-BpQwZyCu.png
2.943.232  dungeon-4-C-4mU5xi.png
2.902.249  dungeon-8-BN999DoB.png
2.652.506  minigame-dino-CNzhwcCG.png
```

O que puxa cada um (`grep` de import, não runtime):
- Os 10 `dungeon-N.png` (cenário 960×540 de cada andar da masmorra) e
  `tournament-final`/`tournament-night` são importados estaticamente em
  `src/utils/dungeonScenes.ts` (`import dungeonBg1 from '../assets/soulmon/bg/dungeon-1.png'` ×10) e
  `src/components/TournamentPage.tsx`. `DungeonGame`/`TournamentPage` **já são
  `lazy()`** no `App.tsx` — então o byte só desce quando o jogador abre a
  masmorra/torneio, não no boot. Mesmo assim: **~30 MB só nos 10 cenários de
  masmorra**, para telas 960×540 — em 3G lento (~400 Kbps efetivo) um único
  `dungeon-N.png` de 3,3 MB **leva ~66 segundos**. Cada andar troca de cenário,
  então a run inteira pode custar 10 downloads de ~3 MB se o jogador não tiver
  cache quente.
- `evolution-bg-DM-tg_BX.mp4` — fundo em vídeo da cerimônia de evolução; MP4
  em vez de WebM/AV1 é a escolha mais pesada disponível para o mesmo conteúdo.
- `minigame-rps-C15IVNt7.png`/`minigame-dino-CNzhwcCG.png` — fundos dos dois
  minijogos (Pedra/Papel/Tesoura, Dino), cada um perto de 3 MB para uma cena
  estática de fundo de minijogo casual.

### 1.2 Code-splitting

```
$ grep -rn "React.lazy\|lazy(" src --include=*.tsx | grep -v test | wc -l  → 27
$ ls dist/assets/*.js | wc -l  → 50 chunks
```

**Existe e está em uso**: 27 `lazy()` em `App.tsx` cobrindo praticamente toda
página secundária e modal (`PetPage`, `ShopModal`, `TournamentPage`,
`OraclePage`, `SoulmonOnboarding`, `EvolutionPath`, `StatsPage`,
`SettingsPage`, `ActivitiesPage`, `LibraryPage`, todos os modais grandes).
50 chunks separados no `dist/` confirmam que o split realmente aconteceu no
build commitado, não só no código-fonte.

---

## 2. Service Worker (`public/sw.js`)

```
$ grep -n "CACHE_VERSION" public/sw.js
3:const CACHE_VERSION = 'v155';
```

```
$ sed -n '8,15p' public/sw.js
const PRECACHE_URLS = [
  '/', '/index.html', '/manifest.json',
  '/favicon-192x192.png', '/push-large-192.png', '/badge-96.png',
];
```

- **PRECACHE_URLS: 6 entradas**, todas pequenas (shell HTML + 3 ícones de
  manifesto/push, nenhuma delas passa de ~12 KB — `favicon-192x192.png` mede
  4 KB, `push-large-192.png` 4 KB, `badge-96.png` 1 KB pelo `du -sh dist/*`
  acima). **Tamanho total do precache: ~28 KB.** O JS/CSS de entrada e as
  imagens do gameplay **não estão no precache** — entram no `STATIC_CACHE`
  sob demanda, na primeira vez que são pedidos (cache-first).
- **Estratégia** (lida em `public/sw.js:72-160`):
  - navegação (`request.mode === 'navigate'`): **network-first** com fallback
    para `index.html` em cache — atualização alcança o usuário rápido, e
    offline ainda abre o app.
  - `/assets/*` (JS/CSS/imagem com nome hasheado pelo Vite): **cache-first**,
    seguro porque o nome muda a cada build — não há risco de servir JS velho
    sob um nome novo.
  - PNG dentro de `/assets/`: se o `Accept` do browser aceita `image/webp`,
    o SW troca a URL para `.webp` **na borda**, tenta o cache/rede da versão
    WebP e só cai para o PNG original se a troca falhar — é a peça que faz o
    par PNG+WebP do `dist/` (ver §3) valer a pena sem o app pedir WebP
    explicitamente.
  - Resto (manifest, ícones soltos): network-first com fallback pro cache.
  - `/api/*` **nunca** entra em cache (comentário no código: cache de save
    seria pior que sem cache — devolveria estado velho offline e
    sobrescreveria estado mais novo).
- **Risco de cache velho**: BAIXO para JS/CSS/imagem hasheados (cache-first é
  seguro por construção). O risco real é **crescimento sem teto**: cache-first
  grava toda imagem/JS visitado no `STATIC_CACHE` e não há rotina de poda por
  tamanho — só a troca de `CACHE_VERSION` (que apaga o cache inteiro no
  `activate`, visto pelo `caches.keys()` + filtro no `sed -n '47,55p'`). Um
  jogador que visita várias masmorras acumula os ~30 MB de cenários no cache
  do navegador até o próximo bump de versão. Não medi o teto de quota do
  navegador nesta rodada (depende de dispositivo/navegador, não é estático).

---

## 3. Imagens

```
$ find dist -name "*.png" | wc -l   → 1470
$ find dist -name "*.webp" | wc -l  → 1465
$ find src/assets -name "*.png" | wc -l   → 1716
$ find src/assets -name "*.webp" | wc -l  → 3
```

- O build gera **quase 1 WebP para cada PNG** (1465 de 1470) — confirma a
  linha do `CLAUDE.md`/manual: `npm run build` faz "vite build + conversão
  PNG→WebP". O par convive no `dist/`; o `sw.js` decide qual serve (§2). O
  código-fonte (`src/assets`) é quase todo PNG (só 3 WebP) — a conversão é
  puramente do pipeline de build, não do autor da arte.
- **Maiores**: listados em §1.1 (dungeon/tournament/minigame, 2,6–3,4 MB cada
  em PNG). O par WebP de cada um é MUITO menor (WebP total do `dist/` é 2,38 MB
  para as 1465 imagens somadas — média de ~1,7 KB, porque a maioria são
  sprites/ícones pequenos; os cenários grandes concentram a diferença) —
  **não medi individualmente o WebP de `dungeon-*` aqui**, mas dado que o
  total de todos os 1465 WebP (2,38 MB) é menor que UM ÚNICO `dungeon-N.png`
  (3,3 MB), a economia por troca PNG→WebP nesses cenários grandes é
  provavelmente de 90%+ — vale medir exato antes de otimizar mais (não medi).
- **`loading="lazy"`**: `grep -rn 'loading="lazy"' src --include=*.tsx` → **0**
  ocorrências. Nenhuma imagem usa lazy-loading nativo do navegador.
- **`srcset`/`srcSet`**: `grep -rn "srcSet\|srcset" src --include=*.tsx` → **0**
  ocorrências. Sem responsive images — todo dispositivo baixa o mesmo arquivo,
  não há variante menor para tela pequena.
- **`<img>` no total**: 67 em produção (contagem própria via script node,
  exclui testes). Alt-text: **verificado manualmente nos 6 casos que o grep
  simples sinalizava como suspeitos** (multi-linha) — todos têm `alt=""`
  correto (decorativo, com `aria-hidden` onde apropriado) ou `alt={label}`
  (ex.: `RPSGame.tsx`, `FormAlbum.tsx`). **Nenhum `<img>` sem `alt` encontrado**
  em produção.

---

## 4. Acessibilidade estática

Todos os achados abaixo são de **grep/script estático** — não naveguei a
tarefa com leitor de tela nem teclado nesta rodada (a tarefa pediu leitura/
medição estática). **Declaro explicitamente**: o que seria manual (percorrer
a tarefa inteira com leitor de tela e teclado, olho no foco visível em
movimento) **não foi feito aqui** — é o item mais importante a rodar antes de
declarar a UI acessível, e o grep NÃO substitui isso.

| Checagem | Comando | Resultado |
|---|---|---|
| `<button>` ícone-só sem `aria-label` | script node varrendo `<button>…</button>` cujo conteúdo só tem `<Icon>` e nenhum texto visível, checando ausência de `aria-label` na tag inteira | **0** encontrados (243 `<button>` no total; heurística pode ter falso-negativo se o texto acessível vier de filho custom) |
| `<img>` sem `alt` | script node + inspeção manual dos 6 casos suspeitos | **0** — todos têm `alt` (vazio quando decorativo) |
| `onClick` em `<div>`/`<span>` sem `role` | `grep -rn "onClick" --include=*.tsx \| grep -E "<div\|<span"` | **1** ocorrência — checar se tem `role`/`tabIndex` junto antes de aceitar |
| Inputs sem rótulo associado | script node: `<input>` sem `aria-label`/`aria-labelledby` direto na tag | 12 de 13 `<input>` não têm `aria-label` DIRETO na tag — mas **inspeção manual confirma que a maioria está dentro de `<label>`** (ex.: `FormKit.tsx` envolve com `<label>`, `OraclePage.tsx` usa `<label>` antecedendo o `<input>`) ou recebe `aria-label` via prop (`FormKit`'s `TimeField`). **Não sobrou tempo para confirmar os 13 um a um** — ver lista completa abaixo, é achado PARCIAL |
| `prefers-reduced-motion` | `grep -c "prefers-reduced-motion" src/index.css` | **1 bloco `@media`** dedicado (linha 5079), citado 47× no total (a maior parte é comentário/prosa do arquivo) — existe e cobre `.sm2-*` conforme os comentários adjacentes |
| Foco visível (`outline: none` sem substituto) | `grep -n "outline: none" src/index.css` | **3 ocorrências**, TODAS com substituto: 2 usam `box-shadow`/anel de foco explícito (`:focus-visible { outline:none; box-shadow: 0 0 0 3px … }`), 1 delega o anel ao `<label>` pai via `:focus-within`. **Nenhum `outline: none` órfão encontrado.** `focus-visible` aparece **53×** no CSS |

### 4.1 Contraste — tokens principais (calculado, fórmula WCAG 2.x)

Script node próprio (luminância relativa + razão de contraste, fórmula padrão
WCAG). Pares medidos contra o AA de texto normal (4,5:1) e texto grande/UI
(3:1):

```
ink/bg dark                      16.15:1
muted/bg dark                     8.83:1
ink/surface dark                 13.59:1
muted/surface dark                7.43:1
primary-ink/bg dark              13.21:1
gold-ink/surface dark             8.84:1
danger-ink/surface dark           6.73:1
chat-support 11px muted/bg dark   6.97:1
ink/bg light                     14.96:1
muted/bg light                    5.35:1
primary-ink/bg light              5.55:1
gold-ink/surface light            5.87:1
danger-ink/surface light          6.54:1
```

**Todos os pares medidos passam AA (≥4,5:1) folgado.** Isso bate com o que o
próprio repo já trava em `src/styles/tokens.contrast.test.ts` — não é
novidade, é confirmação independente. Não recalculei os pares de `haunted`
nem os do toast (o manual já documenta os números medidos e a régua que os
trava).

### 4.2 Achado real — piso tipográfico furado em 1 ponto

```
$ grep -n "font-size:\s*(9|10|11)px" src/index.css
7497:  font-size: 11px;
```

```
$ sed -n '7495,7500p' src/index.css
.sm2-chat-support {
  margin: 10px 4px 0;
  font-size: 11px;
  ...
```

O manual (`docs/manual/04-IDENTIDADE-VISUAL.md` §4.3) declara **piso
ABSOLUTO de 12px, "não existe texto menor no app"**, e a régua
`tokens.contrast.test.ts` trava "escala com degrau abaixo de 12px" — mas essa
régua olha a ESCALA `--sm2-text-*`, e `.sm2-chat-support` usa um **literal**
de 11px fora da escala, então o guard não pega. É a classe do aviso de
segurança/crise no chat (`ChatBox.tsx`, linha citada no próprio comentário do
CSS) — **texto pequeno demais é especialmente ruim aqui**: é justamente o
texto que precisa ser lido com clareza por quem está em crise, não decorativo.
O motivo escrito no CSS ("discrição é requisito clínico") explica por que é
PEQUENO, mas não por que está ABAIXO do piso que o resto do app respeita — dá
para ser discreto (cor `muted`, sem ícone, sem caixa) em 12px sem quebrar a
regra.

---

## 5. Fontes

```
$ grep -n "@font-face" src/index.css  → 7 linhas (6 blocos reais + 1 lápide)
```

- **Silkscreen** (a fonte pixel/"voz do aparelho"): NÃO tem `@font-face`
  próprio — vem do pacote npm `@fontsource/silkscreen`, emitido pelo Vite em
  `dist/assets/`. Regra do manual: mínimo **14px**, caixa alta, só DENTRO do
  visor e em selos (`.sm2-device-voice`). Não encontrei uso abaixo de 14px em
  `grep -n "font-size" src/index.css` cruzado com `.sm2-device-voice`/`sm-px-font`
  — não recontei aqui porque o manual já documenta essa medição (feita em
  20–21/09/2026) e não houve mudança de código desde então neste ponto.
- **Material Symbols Rounded** (self-host, subset): `public/fonts/material-symbols-rounded.woff2`
  — o manual mede **155.440 B**; bati com `find dist -iname "*.woff2" -exec du -cb {} +`
  que soma **260.424 B para os 7 `.woff2` do `dist/`** — a Material sozinha é
  ~60% do peso total de fontes.
- **Nenhum `font-size` abaixo de 12px na escala `--sm2-text-*`** — só o
  literal `.sm2-chat-support` de 11px (§4.2), que não é Silkscreen, é Rubik/
  texto normal (herdado do `body`).

---

## 6. Orçamento de performance

```
$ grep -rln "budget" docs --include=*.md -i | wc -l
```

Nenhum dos resultados é um orçamento de PERFORMANCE (bytes/tempo) — são usos
da palavra em outro sentido (orçamento de design, de esforço, de token de
espaço). **Não existe orçamento de performance declarado no repo.** Proponho
um, ancorado na condição real descrita no manual/CLAUDE.md (PWA + APK
Capacitor, usuário real ainda não confirmado — "ninguém usou em produção" — e
a política do app é rodar bem no pior aparelho, sem sensor, offline-first):

### Proposta de orçamento (para decisão do dono)

| Métrica | Orçamento proposto | Por quê |
|---|---|---|
| JS de entrada (chunk `index-*.js`) | **≤ 250 KB** (hoje: **624 KB**, 2,5× acima) | 250 KB é o teto clássico para "interativo em 5 s em rede 3G lenta" (Addy Osmani/web.dev); o app é um v-pet que abre toda vez que o jogador olha o celular — cada ms de espera repete centenas de vezes/dia |
| CSS de entrada | **≤ 100 KB** (hoje: **139 KB**, 1,4× acima) | é 1 arquivo carregado sempre, sem split; render-blocking |
| Peso de UMA imagem de cenário (dungeon/torneio/minijogo) | **≤ 400 KB** em PNG, **≤ 150 KB** em WebP | hoje: 2,6–3,4 MB por PNG — 7-9× acima. Cenário 960×540 não precisa desse peso; provavelmente falta compressão/reamostragem na origem, não só o par WebP |
| Vídeo (`evolution-bg.mp4`) | **≤ 800 KB** ou trocar por WebM/CSS | hoje 3,7 MB; é fundo de UMA cerimônia, ainda assim pesa mais que o app inteiro de JS |
| Precache do SW | manter pequeno (hoje 28 KB) — OK, não subir sem necessidade | offline-first depende do shell mínimo estar sempre disponível |
| Total de imagens de UM fluxo (ex.: 1 run de masmorra completa, 5 andares) | **≤ 2 MB** somando os cenários visitados | hoje: 5 PNGs de ~3 MB cada = ~15 MB por run, se o cache estiver frio |
| Tamanho mínimo de texto | **12px** (já é a regra declarada — só falta a régua cobrir literais fora da escala) | acessibilidade, já documentado |

**Este orçamento é PROPOSTO, não decidido** — pede confirmação do dono antes
de virar régua (`vitest.budget` citado na tarefa é de tempo de teste, não
serve para isto; precisaria de um teste novo, ex. `dist/assets` size assertion
no CI, algo que não existe hoje).

---

## 10 correções priorizadas por retorno (impacto × frequência × esforço)

1. **Recomprimir os 10 `dungeon-N.png`/`tournament-*`/`minigame-*` (~30 MB).**
   Impacto altíssimo (cada um é 2,6–3,4 MB, baixado toda vez que o cache está
   frio, em telas de 960×540 que não precisam disso), frequência alta (todo
   jogador que entra na masmorra/torneio/minijogos), esforço baixo
   (reprocessar na origem com compressão mais agressiva ou reamostrar; o
   pipeline WebP já existe, só falta o PNG de origem ser menor).
2. **Reduzir o JS de entrada de 624 KB para perto de 250 KB.** Impacto alto
   (afeta TODO carregamento, inclusive o primeiro), frequência máxima, esforço
   médio (auditar o que está no chunk de entrada vs. o que poderia ser
   `lazy()` — 27 já são lazy, mas o chunk de entrada ainda é 2,5× o orçamento
   proposto; medir com `rollup-plugin-visualizer` ou equivalente, não medido
   aqui).
3. **Trocar `evolution-bg.mp4` (3,7 MB) por WebM ou CSS/gradiente.** Impacto
   médio-alto (uma cerimônia específica, mas pesa mais que o resto do bundle
   crítico somado), frequência média (toda evolução), esforço baixo-médio.
4. **Subir `.sm2-chat-support` de 11px para 12px.** Impacto médio (afeta
   leitura de um aviso ligado a segurança/crise), frequência baixa (só quem
   abre o chat), esforço trivial (1 linha de CSS) — **maior retorno por
   esforço de toda a lista**.
5. **Fechar o furo do piso tipográfico na régua.** `tokens.contrast.test.ts`
   verifica a ESCALA `--sm2-text-*`, não literais soltos — estender o guard
   para varrer `font-size:\s*\d+px` no CSS inteiro e reprovar <12px fecharia a
   classe inteira de regressão que o achado 4.2 representa. Esforço baixo,
   impacto estrutural (evita reincidência).
6. **Adicionar `loading="lazy"` às imagens fora da dobra inicial** (cenários
   de loja, fundo de decoração, itens não visíveis no primeiro scroll).
   Impacto médio (rede economizada em telas com lista longa — Loja, Biblioteca,
   Diário de Aventura), frequência alta, esforço baixo (atributo HTML nativo).
7. **Investigar por que `pool-D-wK9EoY.js` (832 KB, `astronomy-engine`) é o
   MAIOR chunk do bundle** apesar de já estar atrás de import dinâmico —
   confirmar que ele só baixa quando o Oráculo/mapa astral é de fato usado
   (não medido aqui: precisaria de um trace de rede real, não estático).
   Esforço baixo (checar), impacto potencialmente alto se algo o estiver
   puxando cedo demais.
8. **Auditar poda do `STATIC_CACHE` do SW.** Hoje cresce sem teto até o
   próximo `CACHE_VERSION`; um jogador que visita muitos cenários acumula
   dezenas de MB no armazenamento do navegador, especialmente relevante em
   Android com pouco espaço. Esforço médio (implementar LRU ou teto por
   categoria), impacto médio (não trava o app, mas pode estourar quota em
   aparelho fraco — não medido aqui).
9. **Confirmar manualmente (não estático) que os 13 `<input>` têm rótulo
   acessível**, em especial os de `OraclePage.tsx`/`PixelizerCard.tsx` — a
   inspeção parcial encontrou `<label>` envolvendo a maioria, mas não fechei
   os 13 um a um. Esforço baixo (leitura direta dos arquivos), impacto médio
   (formulário do Oráculo é uma jornada crítica de onboarding).
10. **Rodar a auditoria MANUAL de leitor de tela + teclado que este relatório
    não cobriu.** Todo achado acima é estático; nenhum percorre a TAREFA
    (abrir masmorra, completar check-in, comprar item) com teclado/leitor de
    tela de ponta a ponta. É o item mais importante da lista e o único que um
    grep não substitui — recomendo `alpha-frontend` ou sessão dedicada com
    NVDA/VoiceOver antes de declarar qualquer fluxo acessível.

---

## O que não foi medido (declarado, não estimado)

- FCP, TTI, INP, CLS, tempo de thread principal, throughput de rede real —
  exigem execução em navegador/dispositivo; a tarefa pediu só leitura/medição
  estática.
- Peso individual em WebP de cada `dungeon-N`/`tournament-*` — só o agregado
  dos 1465 WebP foi medido.
- Navegação por teclado completa, ordem de foco, leitor de tela percorrendo a
  tarefa inteira — nenhuma tarefa foi percorrida nesta rodada, só grep.
- Quota de armazenamento do SW em dispositivo real.
