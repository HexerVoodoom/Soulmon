# CRÍTICA — canvas "Evolução" (identidade, Fase 2, sétimo canvas) · `design-critic`

> Revisão BLOQUEANTE · 20/09/2026 · alvo: os 15 `.dc.html` + `MainClaro` + `canvas.json` + `README.md`
> desta pasta, servidos em `localhost:8773`.
> Método: (1) diff estrutural artboard a artboard contra `../<mesmo nome>.dc.html` — sequência de `role`, de
> `aria-label`, dos marcadores de foco (`.fo`) e o conjunto de palavras (`cmp.py`, 15 pares); (2) `getComputedStyle`
> + `getBoundingClientRect` em todos os nós do `.phone` nos 16 artboards (texto < 12px, Silkscreen fora do `.screen`,
> alvo < 44 entre `button/input/a/summary` e `role=button/checkbox/radio/textbox/switch/tab/link/menuitem/combobox`,
> vazamento de 390, `<img>`/`background-image`/`border-image`/`mask-image` fora do vidro, `opacity < 1`, `opacity()`
> em `filter`, `text-shadow`, `scrollHeight` do `.ab` contra o `canvas.json`) — script PRÓPRIO (`crit_evo.mjs`,
> Chromium via `playwright-core`, 420×900, DPR 1), não o do designer; (3) no browser pane, o DOM dos nós da árvore
> (os três `<circle>` de cada `.node`: `stroke`, `stroke-width`, `dasharray`, `fill` computados), as tags, os chips
> dos galhos e as caixas do sprite/FX dentro de cada vidro; (4) hex recalculados do `src/index.css` (bloco ONDA 1)
> com a fórmula WCAG 2.x, inclusive `primary-soft` composto e o `color-mix` da silhueta; (5) os 15 glifos cruzados
> com o inventário de 102; (6) **a caixa de alfa de cada arte** (Pillow, alfa > 8) e a fração dos pixels que o
> vidro CIRCULAR corta a 64 / 72 / 80 — é ela que diz se o nó mostra a forma inteira; (7) o sheet
> `anim-sparkle-pop` quadro a quadro e o `gain-evolution-burst` a 4× para ver o que o canvas compõe sobre o sprite;
> (8) cruzado com DECISÕES §10 (X1–X5 / V1–V5 / S1–S5) e §18–§22, `HANDOFF-IDENTIDADE.md` §4–§7, as cinco
> `CRITICA.md` anteriores, `CLAUDE.md` › Cadeado / Renascimento / Desbloqueio / Evolução manual, e o código
> (`EvolutionPath.tsx` `auraForElement`, `attackFxArt.ts`, `sprites.ts`, `assets/soulmon/lines|fx|placeholder`).
> Não editei nenhum artboard.

## 0. Resumo

| Classe | Qtd | O que pesa |
|---|---|---|
| **fatal** | 0 | — |
| **fixável** | 9 | **a forma evoluída não se lê no clímax** (burst 96² a 2× = 192 atrás de um sprite de 128 na MESMA paleta de fogo/cobre — raios e chamas viram uma massa só; a criatura que a cerimônia existe para revelar é a coisa mais difícil de ler na tela) · **a faísca a 2× (quadro 3 = 124 px) é desenhada POR CIMA da criatura** no `EvoPronto` e na `Cerimonia` (caixa 56–184 × 8–136 sobre o sprite 32–160 × 32–160 — uma cruz escura sobre a cabeça e o dorso; o README diz "no canto do vidro", o DOM diz que não) · **o vidro circular 64 corta os sprites do nó** (as quatro `igni-*` ocupam x 0–255 do PNG: 1,5 % · 1,8 % · 2,2 % · **4,1 %** dos pixels fora do círculo; os placeholders 3,1 % — corte reto visível na mega e na ultimate; vidro 72 zera) · **o anel ALCANÇADO (6px) grita mais que o ATUAL (3px + halo)** — a forma passada domina o card da forma presente · **o anel BLOQUEADO em `line` não renderiza** (1,32 sobre o card, **1,12 sobre o próprio disco** — o traço cavalga a borda do disco) e é o estado majoritário da escada · **aura de fogo atrás do Pyraka demo** (o demo não tem oráculo → `auraForElement(undefined)` = sem aura; e o elemento está errado para a criatura) · **"3 task(s) per day" sobreviveu** ao S4 (no wireframe também) · **"Confirm degeneration" com primário cheio** para uma perda irreversível (§20: folha de decisão sem primário) · README com um par de contraste que não bate (`viewport-bg`/`surface-2`) e a faísca descrita "no canto" |
| **ruído** | 8 | aura a 2× cortada 32 px de cada lado + franja cinza (já pedida à `squad-arte` em 96², Pet D-P3/R1) · chip "Benevolence" a 1 px do limite (em 360 de largura não cabe) · `aria-label` do visor no `EvoPronto` diz "tap to lock" quando o toque evolui (V2, herdado) · nó FORECAST com `aria-label` "locked" e o zênite "Pyraka" com sprite `igni-mega` (amostra) · `.btn.qui.quiet-danger` sobra no CSS copiado · a nota da intercalação fora da faixa `.after` e o visor de tela cheia sem anel · a tag `sample` quebra linha dentro do `combobox` · a placa "ON HOLD" com fundo `color-mix(… transparent)` (alpha, precedente Home X3) |

**Veredito: ENTRA COM CONSERTOS.** Nenhum fatal, nada estrutural, nada reaberto. **X1–X4 são obrigatórios antes do
checkpoint do dono** — são exatamente o que ele vai ver no recorte 200×200 (o nó e a cerimônia), e cada um custa
uma linha (escala do burst, posição/quadro da faísca, diâmetro do vidro do nó, espessura/cor de um anel). **X5 é
decisão do lead** (recomendação abaixo, §3). X6–X9 são de uma linha ou de texto. Rodada 2 para colar as medições
novas (corte do nó, composição da cerimônia) no README — só X5 e X8 precisam passar pelo lead.

**O que está certo e não precisa de rodada:** estrutura **idêntica nos 15 pares** — mesma sequência de `role`,
mesmos `aria-label` (a única adição são GERANDO / RESERVA_FINAL / ERRO no strip `[novo — código 15/09]` do
`EvoSpriteEstados`, declarada no artboard e no README), mesmos marcadores de foco (1 · 1 · 11 · 11 · 13 · 6 · 10 ·
10 · 3 · 10 · 2 · 10 · 2 · 5 · 4), mesma copy (as únicas diferenças são ligatures de ícone, "PET" → sprite, "ON HOLD"
de X3, e o strip novo); **0 nós < 12px** nos 16 (o wireframe tinha 10/8 px); **0 alvo < 44** (sub-abas 113,3×44; chips
dos galhos 114,7×44; nós ocultos 88×88; visor 200×200; cadeado 240×44; "Degenerate" ≥ 44; × 44); **0 vazamento** de 390;
**0 Silkscreen fora do `.screen`** (a única do canvas é "ON HOLD" 14 dentro do vidro); **0 `opacity < 1`, 0 `opacity()`
em `filter`, 0 `text-shadow`** em nó nenhum; **0 PNG/`background-image`/`border-image`/`mask-image` fora do
vidro** (sprites, aura, faísca, burst, quadro do vídeo, placeholders, a moldura da placa e a silhueta por
`mask-image` estão todos dentro de um `.screen`; o anel do nó é `<svg>` inline; o único `background-image` fora é o
`linear-gradient` do anel de cobre, precedente da Home); **15 glifos, 15 no inventário**; ícone nunca em box;
`canvas.json` = `scrollHeight` dos 16 `.ab` (2183 · 1586 · 2026 · 1870 · 1752 · 1539 · 2185 · 2637 · 1664 · 1511 ·
1951 · 1585 · 1753 · 1797 · 1603 · 1666); **os 17 pares de contraste do README conferem ao centésimo** nos dois temas
(exceto a linha do `viewport-bg`/`surface-2`, X9) — silhueta computa `#667271` (3,76) / `#6A7C79` (3,69);
`MainClaro` com o vidro escuro `#0E2422`, cobre `#B0722F` (3,66), ciano `#0B6F68`; **escala inteira em toda arte**
(sprite 0,5× no visor, 0,25× no nó; aura 2×; faísca 2×; burst 2×; placeholders 0,25×; moldura ½×; o quadro do
vídeo `cover` declarado como ilustração); dobra a 844 como o README mede (visor 121–357, barra 369–409, cadeado
421–465, "Where they are heading" inteiro até 612; os três nós da árvore inteiros antes da nav; a folha do
renascimento inteira em 844 nas duas variantes; a cerimônia com o primário em 731–779); as regras do `CLAUDE.md`
respeitadas — evolução MANUAL sem botão "Evolve" (o visor é o gesto), cadeado no idioma da SELEÇÃO
(`aria-pressed` intacto, `lock`/`lock_open` pelados), `perfectDays` só acumulam (barra cheia no travado), recusa
MOTIVADA (`not-paid` = o card-convite âmbar; `not-ultra` **não monta nada**; `already-used` = a linha de registro
com `egg` FILL 1, nunca oferta), ovo = tela na copy ("returns them to an egg", sem estágio novo), **nenhum
`--sm2-danger-*` em conteúdo** (degenerar, renascer e o `role=alert` em `outline`/âmbar — o app não cobra);
`role="dialog" aria-modal="true"` nos cinco diálogos (spoiler, degeneração, `EvolveTaskModal`, cerimônia, folha);
os três cards de estado da geração como `role=status`; "Be reborn" inerte por SUPERFÍCIE + `aria-disabled`,
nunca opacidade; "ON HOLD" duas palavras em caixa alta, `aria-hidden`, o `aria-label` do visor já diz "locked";
"NEW · Visor tuned" com `aria-live="polite"`; os três atributos sem `%`; o galho previsto em `primary-ink` 500
dentro da frase; a data e a saída relacional na cerimônia (X1/X2 de §10) presentes nas duas variantes.

---

## 1. Medições

### 1.1 Escala do pixel dentro dos vidros × caixa de alfa × o que o vidro corta

| Peça | Arte | Nativo | Caixa de alfa | CSS | Escala | Corte |
|---|---|---|---|---|---|---|
| Forma atual (visor 192²) | `lines/igni-champion.png` | 256² | x 0–255 · y 20–235 | 128 a (32,32) | 0,5× ✓ | 0 (o quadrado 192 contém 128) |
| Aura (visor 192²) | `fx-ataque/fx-fogo-aura.png` | 128² | x 0–127 · y 21–106 | 256 a (−32,−32) | 2× ✓ | **32 px de cada lado** (R1, já pedida em 96²) |
| Faísca (`EvoPronto`, `Cerimonia`) | `fx/anim-sparkle-pop.png` quadro 3 | 64² (sheet 256×64) | **x 1–62 · y 1–62** (o quadro cheio) | 128 | 2× ✓ | 0 — mas **cobre o sprite** (X2) |
| Burst (`Cerimonia`, `CerimoniaReduzida`) | `fx/gain-evolution-burst.png` | 96² | x 2–93 · y 0–95 | 192 | 2× ✓ | 0 — mas **engole o sprite de 128** (X1) |
| Forma evoluída (cerimônia) | `lines/igni-ultimate.png` | 256² | x 0–255 · y 20–234 | 128 | 0,5× ✓ | 0 |
| Antes (`CerimoniaReduzida`) | `lines/igni-champion.png` | 256² | x 0–255 | 64 | 0,25× ✓ | 0 |
| Nó ATUAL / revelado / zênite / alcançado | `igni-champion` · `igni-ultimate` · `igni-mega` · `igni-rookie` | 256² | **x 0–255** em todas | 64 em vidro **circular 64** | 0,25× ✓ | **1,8 % · 2,2 % · 4,1 % · 1,5 %** dos pixels fora do círculo (X3) |
| Silhueta (nó oculto) | `mask-image` das mesmas artes | 256² | idem | 64 em circular 64 | 0,25× ✓ | idem (a mega 4,1 % — corte reto no flanco esquerdo, visível) |
| Placeholders v3 (nó) | `placeholder/dormant|forming|glitch` | 256² | x 54–201 · **y 0–255** | 64 em circular 64 | 0,25× ✓ | **3,1 % · 3,2 % · 3,1 %** (topo e base) |
| Moldura da placa "ON HOLD" | `hud/frame-pipe-vine-96.png` | 96² | — | `border-image` 24 / 12px | ½× ✓ | — |
| Quadro do vídeo | `video/evolution-bg-thumb.webp` | 720×1280 | — | `cover` em 388×578 | ≈0,54× | ilustração, declarado (Home X11) |

**O que o vidro circular corta se crescer** (sprite fixo a 64, 0,25×): vidro 72 → 0,0 / 0,5 / 0,4 / 0,6 % (igni
rookie/champion/ultimate/mega) e 0,0 % nos placeholders; vidro 80 → 0 em tudo. O disco do SVG tem r 39 e o anel
de 3px deixa 75 px livres por dentro; **72 cabe** (o ALCANÇADO a 6px deixa exatamente 72 — ver X4, que o afina).

### 1.2 O nó em SVG — o que o DOM computa (`EvoArvore`, escuro)

| Estado | `ring1` | `ring2` (halo) | Disco | Sobre o card (`surface`) | Sobre o disco (`surface-2`) |
|---|---|---|---|---|---|
| ATUAL | `#5FF3E0` 3px | `#5FF3E0` 1px r 43 | `#163735` | 9,43 (não-texto ✓) | 9,43 ✓ |
| PREVISTO | `#29C9B8` 3px, `6 5` | — | idem | 7,33 ✓ | 6,21 ✓ |
| BLOQUEADO | **`#1E3F3C` 3px** | — | idem | **1,32** | **1,12** |
| ALCANÇADO | `#5FF3E0` **6px** | — | idem | 9,43 ✓ | 9,43 ✓ |

O disco `surface-2` sobre o card mede **1,18** (escuro) — na prática o disco não existe visualmente; o que se vê é
o vidro circular (`viewport-bg`, 1,46 contra o disco) e o anel. Por isso o nó BLOQUEADO é, no escuro, **uma
silhueta cinza flutuando sobre o card**, sem anel e sem disco (§3).

### 1.3 Composição do `EvoPronto` e da `Cerimonia` (caixas relativas ao vidro)

| Artboard | Vidro | Sprite | Burst | Faísca | Sobreposição faísca ∩ sprite |
|---|---|---|---|---|---|
| `EvoPronto` | 192² | 32–160 × 32–160 | — | **56–184 × 8–136** (quadro 3 a 2×) | **104 × 104 px** — a cruz escura (`#03221C`, o contorno do quadro) sobre cabeça e dorso |
| `Cerimonia` | 388×578 | 130–258 × 225–353 | 98–290 × 193–385 | **202–330 × 161–289** | 56 × 64 px — o quarto superior direito da forma evoluída |
| `CerimoniaReduzida` | 388×602 | antes 66–130 × 269–333 · depois 194–322 × 237–365 | 162–354 × 205–397 | — | — (o burst sozinho já engole: ver X1) |

O sheet `anim-sparkle-pop` tem quatro quadros: 0 e 1 = estrela de 15 px, **2 = a cruz cheia de 62 px** (o pico,
o que o canvas escolheu), 3 = a dispersão de 28 px. No código a animação passa pelo pico em um quadro; no
artboard estático, o pico é o único quadro que existe — e é o que o dono vê.

### 1.4 Fidelidade (`cmp.py`, 15 pares + DOM)

Sequência de `role` idêntica nos 15; `aria-label` idênticos nos 15 (+3 no strip `[novo]`); `.fo` idênticos nos 15;
palavras: só as trocas declaradas (ícones, "PET" → sprite, "ON HOLD", o strip D1). O `aria-label` "Pixel, current
form" no demo (achado 12 do README) confere — herdado, registro. O "task(s)" da primeira frase do
`EvolveTaskModal` está **nos dois** (X7).

---

## 2. Fixáveis (X)

| # | Onde | O que | Regra / precedente | Conserto (uma linha) |
|---|---|---|---|---|
| **X1** | `Cerimonia`, `CerimoniaReduzida` | O burst `gain-evolution-burst` a 2× (192) atrás do sprite de 128: os raios de cobre saem só 32 px além da criatura, e a `igni-ultimate` é uma bola de chamas laranja com espinhos — raios e espinhos, cobre e fogo, viram **uma massa só**. O centro ciano do burst (feito para um ITEM de ~32 px) fica inteiro escondido atrás do sprite. A forma evoluída — a única coisa que a cerimônia existe para mostrar — é ilegível no clímax. | HANDOFF §1 (o Visor mostra a criatura); Rituais X1 (escala inteira na cerimônia); figura/fundo (Gestalt) | **Burst a 3× = 288** (inteiro; cabe nos 388): os raios passam 80 px além do sprite e o centro ciano volta a aparecer nas frestas. Alternativa: sem burst — o vídeo já É o cenário cerimonial, faísca no canto (X2). Medir de novo. |
| **X2** | `EvoPronto`, `Cerimonia` | A faísca no quadro 3 (a cruz cheia, 62 px) a 2× = 124 px, posicionada **sobre** o sprite (§1.3): uma cruz de contorno escuro sobre a cabeça e o dorso da criatura. O README diz "no canto do vidro"; a CSS diz `left:56px;top:8px`. | README D-E1/EVO-04 (a faísca "no canto"); a tese (o FX acompanha, não tapa) | **Quadro 3 → quadro 4 (a dispersão, 28 px → 56 a 2×) no canto superior direito** (`left:128px;top:8px`, livre do sprite), ou o quadro 3 a **1×** (62) no mesmo canto. Na `Cerimonia`, idem (`margin:-160px 0 0 64px`). |
| **X3** | `EvoArvore`, `EvoEstados`, `EvoSpriteEstados` | O vidro circular de 64 corta os sprites de 64 (§1.1): as `igni-*` ocupam a largura INTEIRA do PNG (x 0–255) — a mega perde 4,1 % (flanco esquerdo reto), a ultimate 2,2 %; os placeholders 3,1 % (topo e base). É a forma "já vivida" ou "prevista" mostrada incompleta, e a silhueta da mega com um corte reto que denuncia a máscara. | Pet D-P9 (forma anterior a 64 **inteira**); escala inteira | **Vidro circular 72** (`.nscr` 72² a (8,8)), sprite continua 64 (0,25×): corte 0–0,6 %. Cabe dentro do anel de 3px (75 livres). |
| **X4** | `EvoEstados` (Pixel Awakened), `EvoArvore` (regra) | O ALCANÇADO com anel **6px** cheio em `primary-fill` pesa o dobro do ATUAL (3px + halo 1px): no card da forma anterior, o nó do passado grita mais que o do presente, dois cards acima. A leitura (ii) do designer (anel, não disco cheio — o disco taparia o sprite) está certa; a espessura inverteu a hierarquia. | PRINCÍPIOS §6 (a tela responde "quem eu sou agora"); H1 (a) (anel POR estado, não por peso) | **ALCANÇADO = `primary-deep` 3px sólido** (7,33 / 6,21) — distingue-se do PREVISTO pelo tracejado e do ATUAL pelo halo (que fica exclusivo do ATUAL). Com 3px, o vidro 72 de X3 ganha 3 px de folga por lado. |
| **X5** | `EvoArvore`, `EvoEstados`, `EvoSpriteEstados` (ERRO) | O anel BLOQUEADO em `line`: 1,32 sobre o card e **1,12 sobre o próprio disco** (o traço de 3px cavalga a borda do disco a r 39). No escuro não renderiza — o nó vira silhueta solta (§1.2). É o estado **majoritário** da escada (rookie→mega: 3 de 5 nós bloqueados no começo). E o nó é um CONTROLE (`role=button`, "Reveal (spoiler)"), não decoração. | WCAG 1.4.11 (fronteira de componente quando é o que o identifica); H1 (a) escolhida pelo dono sobre `bg`, aplicada aqui sobre `surface` | **Decisão do lead** — recomendação em §3: **`muted` 3px** (7,43 / 5,80; sobre o disco 6,30 / 5,09). |
| **X6** | `ConviteDemo`, `ConvitePago` | Aura `fx-fogo-aura` atrás do Pyraka (`kaelen-rookie`, criatura roxo-azul): o demo **não tem oráculo**, e `EvolutionPath.tsx` → `auraForElement(dominantElement)` devolve `undefined` → "Ausente = sem aura" (comentário do próprio componente). O artboard desenha um estado que o código não produz, com o elemento errado para a criatura — e é o artboard do convite, o primeiro que um jogador demo vê. | Fidelidade ao código (D11); `attackFxArt.ts` D9 | Tirar a `img.aura` dos dois artboards demo; nota "demo: sem aura (sem oráculo)" no rodapé. |
| **X7** | `EvolveTaskModal` (e `../EvolveTaskModal.dc.html`) | "In this new stage, complete **3 task(s)** per day…" — o "(s)" que S4 tirou sobreviveu na primeira frase (a segunda, "2 tasks registered", está certa). Está no wireframe também: replicado por fidelidade, mas contra a decisão aprovada (§10 X5/S4). | DECISÕES §10 S4 | "complete 3 tasks per day" nos dois arquivos; registrar no wireframe como correção de copy, não reabertura. |
| **X8** | `EvoEstados` — "Confirm degeneration" | O `Confirm` em `primary-fill` (o botão mais luminoso do sistema) para uma perda irreversível de estágio. O renascimento pode ter primário porque é TROCA declarada e escolhida; degenerar é só perda, pedida duas vezes justamente para não ser fácil. Um primário cheio é a linguagem de "faça isto". | DECISÕES §20 (Atividades: **folhas de decisão sem primário, `outline`**); Material/HIG (confirmação destrutiva sem ênfase) | `Confirm` em `.btn.out` (Cancel já é `outline`) — nenhum primário no diálogo; o mesmo no "Final warning" da nota. "Yes, reveal" (spoiler) pode ficar primário: não perde nada. |
| **X9** | `README.md` | (a) a linha "`viewport-bg` / `surface-2` (decorativo) 1,24 / 5,71" não bate com os hex: `#071413`/`#163735` = **1,46** e `#0E2422`/`#E9F2EF` = **14,2** (1,24 é `viewport-bg`/`surface` do Pet R3); falta o par `line`/`surface-2` (1,12) que o anel BLOQUEADO cavalga; (b) a faísca "no canto do vidro" (X2); (c) o disco `surface-2`/`surface` (1,18) merece a mesma linha "decorativo" que a borda do vidro. | Aceite §5 (por token, recalculado) | Corrigir as três linhas depois de X2–X5 medidos. |

## 3. O anel BLOQUEADO — recomendação

**Trocar para `muted` 3px** (uma linha: `.node.bloqueada .ring1{stroke:var(--sm2-muted)}`), não manter (a) em `line`.

Por quê, em ordem de peso:

1. **Não é decorativo — é a fronteira de um botão.** O nó oculto tem `role="button"` e `aria-label` "Reveal
   (spoiler)". A tag LOCKED diz o estado, mas não diz "isto é tocável"; a silhueta a 3,76 é o único indicador da
   área de toque, e ela é uma mancha sem contorno. O slot sem anel do Dex (Pet R3) era aceitável porque **não era
   controle**.
2. **É o estado majoritário, e o dono escolheu "anel por estado".** Numa escada de 5 nós, 3 começam bloqueados.
   Com `line`, a opção (a) que o dono aprovou — SVG por token, anel por estado — não renderiza justamente onde mais
   aparece: no escuro, `line` sobre `surface` (1,32) e sobre o disco (1,12) some, e o disco `surface-2` sobre o
   card (1,18) some junto. O que sobra na tela não é (a); é uma silhueta solta. A imagem de referência do H1
   mostra (a) sobre `bg`, onde o disco tinha contraste; o canvas o pôs sobre um card.
3. **O vocabulário fecha sem colisão:** ATUAL = `primary-ink` 3px + halo · PREVISTO = `primary-deep` 3px tracejado ·
   BLOQUEADO = `muted` 3px sólido · ALCANÇADO (X4) = `primary-deep` 3px sólido. Quatro estados, quatro assinaturas
   (halo / tracejado / cinza / ciano-escuro), todas ≥ 3:1 nos dois temas (muted/surface 7,43 / 5,80; muted/surface-2
   6,30 / 5,09). O cinza é o mais quieto dos quatro — o "apagado" que (a) queria, só que visível.
4. **Custo zero de regra e de token.** `muted` já é a fronteira dos `outline`, do `.meter` e dos segmentos vazios
   (SIS-07); o anel bloqueado passa a falar a língua do "vazio ainda por preencher" que a página já usa nos
   atributos.

Se o lead preferir manter `line`, então registrar no README **três** coisas, não uma: que o nó BLOQUEADO é controle
sem fronteira visível (WCAG 1.4.11 falhado por escolha, com a silhueta a 3,76 como único indicador), que o disco
também não renderiza (1,18), e que a régua `tokens.contrast.test.ts` não cobre pares não-texto — o registro vira
dívida do `staff-frontend` e não some.

## 4. Ruído (registro, sem rodada)

| # | Onde | O quê | Destino |
|---|---|---|---|
| R1 | `Main`, `MainClaro`, `EvoTravado`, `EvoPronto`, `EvoOffline`, convites | A aura a 2× perde 32 px de cada lado (caixa x 0–127) e traz uma franja de pixels cinza/brancos que aparece no vidro escuro (visível à esquerda do anel de fogo). Declarada (D-E1/D-P3); a `squad-arte` já deve a aura em 96². | `squad-arte` (já pedido no Pet) |
| R2 | `EvoArvore` — chips dos galhos | "Benevolence": texto 90 px + padding 12 em 114,7 de chip cabe a 390 — a 360 de largura (Android comum) o chip cai a ~105 e o texto encosta. `white-space:nowrap` sem `min-width` vai estourar. | `staff-frontend` (permitir 2 linhas ou `text-overflow`) |
| R3 | `EvoPronto` | O `aria-label` do visor diz "Evolution unlocked, tap to lock" quando, com a barra cheia, o toque EVOLUI (gesto duplo, V2). O leitor de tela toca para travar e dispara a cerimônia. Herdado do wireframe/código. | `STATUS` (V2, dívida de IA já registrada — acrescentar o rótulo) |
| R4 | `EvoArvore`, `EvoEstados` | O nó FORECAST com `aria-label` "Hidden evolution — locked. Reveal (spoiler)" enquanto a tag diz FORECAST; o zênite "Pyraka Zenith" com `igni-mega` (Pyraka é a linha `kaelen`). Amostras herdadas. | wireframe (registro) |
| R5 | todos | `.btn.qui.quiet-danger{color:var(--sm2-danger-ink)}` sobra no bloco de CSS copiado do Sistema; nenhum nó a usa (D-E8 verdadeira em conteúdo). | poda no gerador |
| R6 | `Cerimonia`, `CerimoniaReduzida` | A nota da intercalação/D7 fica ENTRE o vidro e o filete de cobre, fora da faixa `.after` (aparelho → nota → filete → aparelho); e o visor de tela cheia não tem anel — só o filete inferior o separa de "vídeo sobre a tela inteira" (o código de hoje). Leitura defensável de D-E6; o lead confirma. | lead (D-E6) |
| R7 | `RenascimentoModal`, `RenascimentoConfirmando` | A tag `sample` quebra linha dentro do `combobox` "Warden" (anotação, não UI). | — |
| R8 | `EvoTravado` | A placa "ON HOLD" tem fundo `color-mix(viewport-bg 78%, transparent)` — é alpha, dentro do vidro, a mesma peça do "EVOLVE" da Home (X3 aceito). Sobre a chama laranja o composto ainda dá ≈11:1 para o Silkscreen. | precedente |

## 5. Veredito por decisão de identidade

| # | Veredito | Nota |
|---|---|---|
| D-E1 | **confirmada** | sprite 0,5× centrado, aura 2× (R1 — corte declarado, arte já pedida) |
| D-E2 | **confirmada** | `.meter` SIS-07 12px, `role=progressbar` 4/7, a frase abaixo |
| D-E3 | **confirmada com X3 · X4 · X5** | SVG por token ✓, vidro circular ✓, silhueta `mask-image` ✓; o vidro de 64 corta (X3), o ALCANÇADO pesa demais (X4), o BLOQUEADO some (X5 — §3) |
| D-E4 | **confirmada** | cadeado no idioma da seleção, `aria-pressed`, `lock`/`lock_open` pelados |
| D-E5 | **confirmada** | "ON HOLD" Silkscreen 14 no vidro, `aria-hidden`, moldura ½× (R8 precedente) |
| D-E6 | **confirmada com X1 · X2** | a tese (vídeo dentro, texto e botão no aparelho) está certa; a composição no vidro não deixa ler a forma (X1) e a faísca tapa (X2); R6 para o lead |
| D-E7 | **confirmada com X6** | o card-convite âmbar ✓; a aura do demo não existe no código |
| D-E8 | **confirmada com X8** | nada de vermelho ✓; o primário no "Confirm degeneration" contradiz §20 |
| D-E9 | **confirmada com X3** | placeholders a 0,25× no nó ✓; 3,1 % cortados no vidro 64 |
| D-E10 | **confirmada** | tags Rubik 12/600, CURRENT `primary-soft`, ZENITH `gold-ink` |
| D-E11 | **confirmada** | galho na frase, `.segb` 10 segmentos, sem `%` (R2 só no chip) |
| D-E12 | **confirmada** | só as anotações do wireframe + o strip D1 |

## 6. Veredito final

**ENTRA COM CONSERTOS — não passa ao dono como está.** Nenhum fatal; a estrutura, a acessibilidade medível, o
contraste por token e as regras de jogo estão certos nos 16 artboards. O que trava o checkpoint é o que o dono
veria no recorte 200×200: **a cerimônia onde a forma nova não se lê (X1), a faísca sobre a cara da criatura (X2),
o nó que corta a forma (X3) e a hierarquia invertida entre passado e presente (X4)** — quatro linhas de CSS. **X5
é a única decisão do lead** (recomendação: `muted` 3px, §3); X8 é uma classe; X6, X7 e X9 são texto e amostra.
Rodada 2 obrigatória para medir de novo o corte no vidro 72 e a composição do burst a 3×, e colar no README.

**O conserto de maior alavancagem:** X1 — o burst a 3× (ou fora). É o único ponto do canvas em que a tese do Visor
está certa e a imagem, errada: o clímax do jogo mostra tudo menos a criatura.
