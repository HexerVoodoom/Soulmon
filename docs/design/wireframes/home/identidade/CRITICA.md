# CRÍTICA — canvas "Home" (identidade, Fase 2, segundo canvas) · `design-critic`

> Revisão BLOQUEANTE · 16/09/2026 · alvo: os 28 `.dc.html` + `MainClaro` + `canvas.json` + `README.md`
> desta pasta, servidos em `localhost:8765`.
> Método: (1) diff estrutural artboard a artboard contra `../<mesmo nome>.dc.html` — sequência de
> `role`/`aria-label`, os 24 marcadores de foco (`.fo`), a copy visível; (2) `getComputedStyle` +
> `getBoundingClientRect` nos 29 artboards (texto < 12px, Silkscreen fora do `.screen`, alvo < 44,
> vazamento da largura, PNG fora do vidro, posição da dobra); (3) hex recalculados do `src/index.css`
> (bloco ONDA 1) com a fórmula WCAG 2.x, inclusive compostos (opacidade, placa, `primary-soft`);
> (4) assets abertos com Pillow (dimensão e contagem de cores); (5) cruzado com o canvas Sistema
> aprovado (`../../sistema/identidade/`, DECISÕES §18), `HANDOFF-IDENTIDADE.md` §4–§7, `01-VISAO.md` §7,
> `VisorBar.tsx`, `animArt.ts`, `tokens.md` §5 (subset de ícones).
> Não editei nenhum artboard.

## 0. Resumo

| Classe | Qtd | O que pesa |
|---|---|---|
| **fatal** | 2 | a tarefa assombrada a **3,26:1 / 2,31:1** (opacidade .55 na linha inteira) · a **dobra reaberta**: o único `primary` de HOME-02 e o título de "Daily rituals" em HOME-01 ficam **debaixo do dock** a 390×844 — o wireframe os tinha visíveis |
| **fixável** | 12 | `HomeHudEstados` desenha a `VisorBar` **sem a placa** (D-H3 contradita pelo artboard que a documenta) · balão cobre a cabeça do sprite · "Evolve" como slab vetor sobre o vidro · números de D-H2 não batem com o CSS · `.ph` em content-box (61px) · `role=status` perdido no skeleton · `HomeErro` contradiz D-H9 · FX de carinho tapa o rosto · chip `haunted` a 20px · `canvas.json` com mojibake · cinco grãos no mesmo vidro · moldura da barra fatiada de um PNG antialiased |
| **ruído** | 8 | anotações dentro do telefone (herdadas do wireframe), copy de exemplo, `NO SIGNAL` fora do vidro (o Sistema já aceitou `.seal`), TrilhaEvolucao inteiro como registro |

**Veredito: VOLTA.** Os dois fatais são a régua de aceite do HANDOFF §5 (AA nos dois temas) e a
fidelidade ao wireframe no ponto que a Fase 1 mais mediu (a dobra, E1+E2). Nenhum dos dois pede
estrutura nova: são opacidade e ~50px de orçamento vertical. Entra na rodada 2 com F1, F2 e X1–X4.

**O que está certo e não precisa de rodada** (para o lead não gastar tempo): estrutura **idêntica**
nos 28 pares — mesma sequência de `role`, mesmos `aria-label`, os mesmos números de foco (23 no
Main, 19 no PrimeiroDia, 17 no PodeEvoluir…), a mesma copy EN; **0 nós < 12px** dentro do `.phone`
nos 29 artboards; **0 alvo < 44** entre `button/checkbox/textbox/menuitem`; **0 elemento vazando** a
largura; Silkscreen só a 14, caixa alta, e só em `.screen` (+ o `.seal` de HOME-44, ver R3); nenhum
ícone em box (deck, dock, nav, painel — tudo pelado, alvo 48/44); sublinhado ciano 3px com halo na
nav, Rubik 12/500 no rótulo, ícone 32; nenhum `danger` fora de menção textual (aviso de HP em âmbar
+ `volunteer_activism`; HP 0.5 sem dígito; toast do Glitchtama em `info` âmbar; recusas na fala do
pet); as 4 fontes self-host carregam; `canvas.json` = `scrollHeight` dos 29 `.ab`; os 16 pares (texto e
não-texto) que a Home usa passam nos dois temas (§1); o pé do sprite a 152px num vidro de 200 = 76%,
contra `GROUND_Y` 74% — dentro do bbox da arte; o Sistema é o mesmo (tokens copiados, `.btn`
primary/outline/ghost/quiet, chip 44, campo filled `surface-2` + `muted`, nav 68, folha com os
literais do `ModalSheet`).

---

## 1. AA por token — recálculo (pares que a Home usa)

| Par | Onde | Escuro | Claro | |
|---|---|---|---|---|
| `ink` / `bg` | wordmark, nome, deck | 16,15 | 14,96 | ✓ |
| `muted` / `bg` | "Companion", `.sticky`, célula inerte, "+N notice" | 8,83 | 5,35 | ✓ |
| `primary-ink` / `bg` | `add`, nav ativa, "Shortcuts" | 13,21 | 5,55 | ✓ |
| `ink` / `surface` | balão, painel, popover | 13,59 | 16,23 | ✓ |
| `muted` / `surface` | metadado da linha, ícones da lista | 7,43 | 5,80 | ✓ |
| `ink` / `surface-2` | campo, toast | 11,52 | 14,23 | ✓ |
| `muted` / `surface-2` | placeholder `>_`, chip de etiqueta | 6,30 | 5,09 | ✓ |
| `gold-ink` / `surface-2` | chip "haunted · +relief" (sem opacidade) | 7,49 | 5,15 | ✓ |
| `gold-ink` / `surface` | ícone do aviso de HP | 8,84 | 5,87 | ✓ |
| `on-primary` / `primary-fill` | "New Activity", "Evolve", "Use", checkbox | 12,38 | 6,02 | ✓ |
| `primary-ink` / `primary-soft` (composto sobre surface) | célula selecionada, selo do foco | 7,69 | 5,21 | ✓ |
| `credit-ink` / `surface` | "Credits" no popover | 7,56 | 7,10 | ✓ |
| `viewport-ink` / placa `rgba(7,20,19,.78)` sobre o pior pixel do `bg-room` (#FFF) | HP/EN Silkscreen 14 | **8,46** | 8,46 | ✓ (D-H3 funciona) |
| `bar-fill-6` (≈#00CFE5) / placa, pior caso | segmento (não-texto) | 4,97 | 4,97 | ✓ (≥3) |
| `viewport-ring` / `bg` (não-texto) | o anel | 5,92 | 3,66 | ✓ (≥3) |
| `gold-fill` / `bg` (não-texto) | ponto de "novo" | 7,84 | 4,42 | ✓ |

**O que NÃO passa:**

| Par | Escuro | Claro | Onde |
|---|---|---|---|
| `muted` a **opacidade .55** / `surface` (texto 14/500 e 12) | **3,26** | **2,31** | `PetAssombrado` linha "Call the dentist" (`.li.dim`) |
| `gold-ink` a .55 / `surface-2` a .55 | **3,33** | **2,20** | o chip "haunted · +relief" dentro da mesma linha |
| borda do checkbox (`muted` 2px) a .55 / `surface` (não-texto) | 3,26 | **2,31** | o checkbox da linha assombrada |

---

## 2. Achados

### FATAL

**F1 · A tarefa assombrada é ilegível — e é a linha que o produto mais quer que a pessoa leia.**
`PetAssombrado.dc.html`, `<li class="li dim">` — a linha INTEIRA a `opacity:.55` (medido:
`getComputedStyle(li).opacity = 0.55`), título em `muted`, chip `gold-ink`, lápis e checkbox. Composto
sobre `surface`: **3,26:1 escuro / 2,31:1 claro** para texto de 14 e 12px; o checkbox cai a 2,31 no
claro (1.4.11 pede ≥ 3). Régua: HANDOFF §5 "AA nos dois temas". E é a peça mais Soulmon do motor
(`CLAUDE.md` 👻: "a pilha de culpa vira loop de jogo com recompensa") — esmaecida até sumir, ela
deixa de ser convite e vira a tarefa que a pessoa não consegue ler. Padrão de mercado: Things 3 /
Todoist não reduzem alpha de item vencido — trocam a **tinta** (secundária) e marcam com **cor de
acento**; alpha global fica para `disabled`. **Conserto sem token novo (= a proposta P5 do README,
corrigida):** `opacity: 1`; título e ícone em `--sm2-muted` (7,43 / 5,80); metadado em `muted`; chip
em `gold-ink` sobre `surface-2` (7,49 / 5,15) a 24px (ver X9); checkbox e lápis intactos. O
"esmaece" é a tinta, não o alpha — e o sinal forte continua sendo o pet olhando (WP3.2).

**F2 · A dobra que a Fase 1 fechou reabriu.** Medido a 390×844 (dock a 714, nav a 774):

| Artboard | Wireframe aprovado | Identidade | Diferença |
|---|---|---|---|
| `Main` (HOME-01) | painel a **648**; título 661–680 visível; 1ª linha 694–750 (28px visíveis antes do dock 722) | painel a **686**; título 705–729 → **metade sob o dock (714)**; nenhuma linha visível | +38px no bloco fixo, dock 52→60 |
| `HomeVazio` (HOME-02) | "New Activity" (o ÚNICO `primary`) 658–702, **inteiro visível** | 711–759 → **inteiro sob o dock** | +53px |

O wireframe registrou o fechamento da dobra como decisão medida ("era 739px, dock a 722" — Play
virou 5ª célula justamente para isso, E1+E2), e o README deste canvas usa a mesma dobra como MOTIVO
de D-H1. A identidade gastou o ganho: anel (+8), nome em Fredoka 20 (+10 sobre Rubik 14), deck 56
em vez de 67 (−11), `.avisos` 104 vs slot 96 (+8), nota 42 vs 34 (+8), `.ph` 61 vs 44 (+17), dock
60 vs 52 (+8). Régua: HANDOFF §5 "fidelidade ao wireframe aprovado" — a pergunta da tela ("what do I
do now?") tem de aparecer sem rolar (MOB §15.1 Finch, a razão da Fase 1). **Conserto (orçamento
≥ 45px em HOME-02, ≥ 34px em HOME-01, sem tocar estrutura):** (a) `.panel .ph` em
`box-sizing:border-box` → −17; (b) dock de volta a 52 (campo 44 + 4/4; o `ChatBox` real é
`position:fixed` e cada px dele come a lista) → −8; (c) a nota "position of Balance my week" é
anotação de spec, vai para o rodapé cinza como as demais → −50 no Main; (d) no vazio, `.pf` 12→8 e
o `eco` 48 com `gap` 8 → −12. Com (a)+(b)+(d) o `primary` de HOME-02 sobe para ~674–718: visível.
Registrar as medidas no rodapé (o wireframe registrou as dele).

### FIXÁVEL (ordem de alavancagem)

**X1 · `HomeHudEstados` desenha a `VisorBar` sem a placa de D-H3.** Os 5 vidros do artboard são
`<span class="screen">` sem `.stage`, e a placa é `.stage .meters` — medido:
`backgroundColor: rgba(0,0,0,0)` nos 5. É exatamente o caso que D-H3 existe para resolver
(Silkscreen 14 sobre `bg-room` "não passava de 3:1"), e é o artboard que **documenta** a HUD em
cinco escalas. Quem for implementar lê este e não o Main. **Conserto:** `.screen.stage` nos 5 (ou a
placa em `.screen .meters`); e escrever a placa como derivada do token —
`color-mix(in srgb, var(--sm2-viewport-bg) 78%, transparent)` — em vez do literal `rgba(7,20,19,.78)`.

**X2 · O balão cobre a cabeça da criatura.** `Main`, `PetCheio`, `PetDeckEstados` (retorno),
`PlayEstados`: `.bubble` a `top:8`, altura 37 (uma linha) → 8–45 no vidro; sprite a `top:24` →
**21px de sobreposição** sobre a crista; com duas linhas (PetCheio) são ~40px. M-vinc §4 e o
wireframe põem o balão *acima* do pet ("estado por pose/balão com cauda"), não sobre ele. Padrão:
Tamagotchi/Finch — a fala nasce da boca e sobe; nunca tapa os olhos. **Conserto:** ou o sprite desce
(`top:40`, mantendo o pé em GROUND_Y com o berço a 114) ou o balão ancora no topo e a criatura
fica 16px abaixo dele; medir a variante de duas linhas.

**X3 · "Evolve" como slab vetor sobre o vidro** — `PetPodeEvoluir`: `.btn.pri.sm` 44px de ciano
sólido na esquina do palco. É a única violação de D-H5 que o vidro não precisa: a estrutura (03
§4.2) manda o botão DENTRO do palco — não manda que ele fale a língua do aparelho. O padrão do
gênero é o LCD falar em LCD: Tamagotchi/Vital Bracelet desenham os comandos on-screen na mesma
grade do bicho. **Conserto (estrutura igual, foco 3 igual):** "EVOLVE" em Silkscreen 14 caixa alta
(≥14, uma palavra — permitido pelo `04` §4) dentro de uma moldura pixel de `hudArt` (o mesmo
`bar-frame` a 2× já serve de placa), 44px de alvo, `viewport-ink` sobre a placa (8,46). O balão
continua vetor (é frase inteira, Silkscreen não pode) — ver o veredito D-H5.

**X4 · D-H2: os números do README não são os do CSS.** README: "caps de 8px a 1×, passo 7, largura
= 8 + 7·max + 8" → HP 3 = 37 (74 CSS), EN 4 = 44 (88 CSS). Desenhado: `.vbar` a **64** e **78** CSS,
fills a `left:12/26` (cap esquerdo 6 a 1×, cap direito 5). Duas contas para a mesma peça é o
footgun 9 em forma de spec. E a moldura é fatiada de `bar-frame-96x8.png` por `::before` (right 16)
+ `::after` (16px da borda direita) — o PNG tem **495 cores** em 96×8 (sombreado, não grade), então
o cap direito carrega gradiente que não casa com o meio. **Conserto:** fixar UMA fórmula (proposta:
cap 6 + 7·max + cap 6 a 1×, que é o que está desenhado) no README, no rodapé e no CSS; e pedir à
`squad-arte` um `bar-cap-l-6x8` / `bar-mid-1x8` / `bar-cap-r-6x8` (ou 9-slice) em grade limpa —
`hudArt.ts` já é o lugar.

**X5 · `.panel .ph` a 61px** — `Main`, `HomeRolado`, `HomeVazio`, `HomePrimeiroDia`, `PetAssombrado`,
`HomeSemMetricas`: `min-height:44` + `padding:8px 12px` sem `box-sizing:border-box` = 61px medidos
(o conteúdo, 24px, fica a 18px do topo). O SIS-03 fixa cabeçalho de painel em 44. Entra no F2.

**X6 · `HomeCarregando` perdeu `role="status" aria-live="polite" aria-label="Loading"`** — o
wireframe tinha (diff de roles: `status` sumiu; `aria-label` 2→1). É o único anúncio do skeleton
para leitor de tela; "LOADING" em Rubik caixa alta fora do vidro está certo (achado 8), mas sem o
`status` ninguém ouve. **Conserto:** devolver os três atributos ao contêiner do skeleton.

**X7 · `HomeErro` contradiz D-H9.** "Reload" é `outline` numa tela cuja **única** ação é ele; D-H9
diz "`primary` só onde é a única ação". SIS-06 desenha erro com duas saídas (âmbar); a Home tem
uma. **Conserto:** `primary` (ou declarar por que não).

**X8 · O FX de carinho tapa o rosto.** `PetCarinho`: `anim-heart-burst` quadro 3 a 2× (128 CSS) com
`top:-4`, centrado no sprite — o coração cobre olhos e boca (medido: fx 169..297 × −4..124 sobre pet
110..238 × 24..152). D-H4 (2×) fica; o problema é a âncora. O `sm-rub` do código sobe o coração
**acima** da cabeça. **Conserto:** ancorar o FX no topo da cabeça (`top` ≈ pet.top − 64) — vale a
mesma regra para `sparkle-pop` (PetPodeEvoluir) e `sleep-z`.

**X9 · Chip "haunted · +relief" a `min-height:20px`** — `PetAssombrado`: o SIS-03 fixa o chip de
etiqueta em 24. **Conserto:** tirar o inline.

**X10 · `canvas.json` com mojibake.** Os títulos dos 4 primeiros artboards têm "Â·" (`HOME-01 Â·
dia normal`); do 5º em diante "·" — o arquivo foi gravado com duas codificações. **Conserto:**
regravar em UTF-8 do gerador (`gen_home.py`), não à mão.

**X11 · Cinco grãos no mesmo vidro** — medido com Pillow: `bg-room` 1200×648 / 22.491 cores em
`cover` (~0,29×), `nest-cradle-wide` 660×312 / 43.527 cores a 220×104 (**⅓×** com `pixelated`),
sprite 256² / 3.377 cores a 0,5×, `furn-*` 112×80 a 0,5× (9 cores — esses são grade), FX e HUD a
2× (grade). D-H4 declara a transição para sprite e FX; **berço e cenário não estão declarados** e
são os dois que mais reamostram (⅓× nearest = 2 de cada 3 pixels jogados fora, borda serrilhada). O
`nest-cradle-wide.png` e o `bg-room.png` são ilustração, não pixel art. **Conserto:** registrar os
dois como transição na mesma linha do P2 e pedir à `squad-arte` as versões em grade (berço 110×52
a 1×; cenário 176×100); enquanto isso, `image-rendering:auto` neles (ilustração se reduz com
filtro, não com nearest) — o `pixelated` fica só no que É grade.

**X12 · O rodapé do `Main` afirma "vidro 350×200" e "anel a 358"**; medido: `.screen` **348**×200,
`.ring` **356** (o `.content` tem 16 de gutter → 358 é impossível; 356 = 390 − 32 − 2 de borda do
telefone). Uma linha.

### RUÍDO (registrar, não bloquear)

**R1** · Anotações dentro do telefone (`.note` "position of Balance my week", o `[novo]`/`sample`
`.tagd`, as tarjas `HOME-NN` do `PetPodeEvoluir`/`PetAssombrado`/`PetCarinho`) — herdadas do
wireframe, mesma prática. Só o `.note` do Main custa dobra (F2c).
**R2** · "Habit · 2 of 8 today" — copy de exemplo sem regra (o Sistema trocou a dele por "5 of the
last 7 days", R2 de lá); fiel ao wireframe, então fica — mas o `staff-frontend` não deve copiar.
**R3** · "NO SIGNAL" em Silkscreen 14 **fora** do vidro (`HomeOffline`, `.seal`). É a `OfflineSeal`
do SIS-06, que o Sistema aprovou como "voz do aparelho". Coerente com o canvas anterior; registrar
que é a segunda exceção à tese (com o balão), para o `04` §1 dizer as duas.
**R4** · `TrilhaEvolucao` — um artboard inteiro "só para registro" dentro de um telefone; o Sistema
(R5) mandou especímenes "do que sai" para o rodapé cinza. Aqui é a estrutura do wireframe (o
wireframe também tem), então fica.
**R5** · Miniatura do pet no priming a 32 CSS (0,125× do 256²) e mascote 512² a 72 (0,14×) —
achado 13 já registra; D-H7 (vidro 96²/40²) está certo.
**R6** · `.bubble` com `border:1px solid line` sobre o vidro — 1,3:1, invisível; não faz mal, mas
é um literal a menos se sair (o balão é overlay de HUD, não card).
**R7** · A folha `Feed` lista comida comum e a pastinha (`ItensPastinha`/`ItensUsar`) também —
achado 14 do README (decisão 13.6 do dono ainda não chegou ao wireframe). Fiel; registrado.
**R8** · `HomeCarregando` com "Games" ativo na nav — é o wireframe (carregando uma página), não
erro.

---

## 3. Veredito por decisão de identidade (D-H1…D-H9)

| # | Veredito | Fundamento |
|---|---|---|
| **D-H1** corpo = página | **Confirmo** — com a condição F2 | SIS-01 diz literalmente "tudo nesta página é o aparelho"; `ring/bg` 5,92 / 3,66 (≥3 nos dois temas), o anel sozinho lê como visor sobre `bg`. Mas o argumento da dobra que a sustenta ("com bisel 16 + borda 3 o painel nascia a ~740") está desfeito pelo próprio canvas: o painel nasce a 686 e o título já fica sob o dock. D-H1 vale por SIS-01, não pela dobra — e a dobra tem de fechar de qualquer jeito (F2). |
| **D-H2** moldura recortada ao `max`, passo 7 | **Confirmo** | Moldura fixa de 96 com HP 3/3 é "medidor vazio acusando" (linha vermelha, guarda). Tamagotchi mostra `max` corações, nunca um trilho maior que o máximo. Condição: X4 — uma fórmula só, e os caps em grade limpa. |
| **D-H3** placa escura atrás dos medidores | **Confirmo** | Pior caso medido 8,46:1 (Silkscreen 14 sobre pixel branco do `bg-room`), segmento 4,97 (≥3). É HUD diegético (o Tamagotchi tem a faixa preta do LCD), não card. Condição: X1 — `HomeHudEstados` tem de tê-la; escrever como `color-mix` do token. |
| **D-H4** FX a 2×, sprite a 128 | **Confirmo como transição** | Mesma grade lógica de 64 × 2 do `Viewport`; o grão diferente é o P2 (a) que o dono já decidiu. Condições: X8 (âncora do FX fora do rosto) e X11 (declarar berço e cenário na mesma transição). |
| **D-H5** balão e "Evolve" em vetor sobre o vidro | **Balão: confirmo com condição. "Evolve": derrubo.** | Balão: é frase inteira em Rubik 14 — Silkscreen não pode (`04` §4 "nunca frase inteira"), e a estrutura o põe no palco; fica como a exceção declarada, desde que não cubra o sprite (X2) e seja overlay (R6). "Evolve": é UMA palavra, cabe em Silkscreen 14, e o gênero desenha comandos on-screen na língua do LCD — não há motivo para o vidro abrir exceção para um botão (X3). Estrutura e foco não mudam; o lead não precisa entrar. |
| **D-H6** item em pixel dentro de célula vetor | **Confirmo** | Já decidido no Sistema: SIS-07 "a arte dentro do slot é pixel — o slot é um mini-visor sem anel (o PNG só vive na tela, não na moldura)". `.gcell` = o slot do SIS-07 a 96 (célula do wireframe). Nada a reabrir; o mini-vidro por célula seria regressão de ruído. |
| **D-H7** mascote e miniatura sempre em vidro | **Confirmo** | 96² e 40² medidos; é a tese aplicada à ilustração. |
| **D-H8** glifos: `pets`/`person`/`filter_list`/`volunteer_activism`/`expand_*` | **Confirmo 3, derrubo 2** | `filter_list` (Tidy), `volunteer_activism` (aviso de HP, âmbar) e `expand_more/less` (+N) estão certos. `pets` para **Play** lê como "o bicho" num deck que já é sobre o bicho (Feed/Bath/Sleep) — a pata é o ícone do PET, não do brincar; `person` para **Library** lê como "meu perfil" num popover que também tem Settings — a Biblioteca é a tela dos outros jogadores (03 §4.22). Ver P6. |
| **D-H9** `primary` só onde é a única ação | **Confirmo** | SIS-02. Aplicar também em `HomeErro` (X7). |

---

## 4. `[pendente do dono]` — recomendação fundamentada

**P4 · Moldura pintada como fundo de página (`home-scene-1547.png`).** Recomendo **não usar**, como o
canvas propõe. 1376×3058 é pixel FORA do vidro em toda a página — é a antítese literal da tese que o
dono decidiu (`PLANO-DESIGN.md` §0 item 1) e reintroduz o que o achado 2 manda tirar. Se o dono
quiser a moldura pintada, é direção de arte nova e reabre o `04` §1, não este canvas.

**P5 · Cor dedicada da tarefa assombrada.** Recomendo **não criar token** — e **não usar
opacidade** (F1). `muted` (7,43 / 5,80) na tinta do título e do ícone, `gold-ink` no chip, alpha 1.
Um matiz próprio (roxo, cinza-azulado) seria o quarto acento numa paleta que tem três de propósito
(ciano luz, cobre aparelho, âmbar convite) e exigiria par claro/escuro + AA + guarda — para uma
linha que a pessoa vê em silêncio. O sinal forte já existe e é melhor: o pet olha (WP3.2).

**P6 · Glifo de Brincar e de Biblioteca.** Recomendo **acrescentar dois nomes ao subset** em vez de
glifo próprio no `NavGlyphs`: **`toys`** para Play (o cata-vento é o ícone de "brincar" do Material
e do gênero — Tamagotchi usa bola/jogo; `pets` fica reservado para a criatura, que hoje não tem
ícone) e **`groups`** para Library (tela dos outros jogadores; `person` continua para Conta/perfil).
Custo conhecido e documentado: refazer o `.woff2` com `icon_names` (`tokens.md` §5, +2 nomes),
somar 1 no `CACHE_VERSION`, e o `iconInventory.contract.test.ts` cobra os dois lugares. Glifo
próprio custaria desenho + a 5ª fonte de ícone e fugiria do `Icon` único.

**P7 · Segmento do medidor.** Recomendo **manter o cubo `bar-fill-6`**. A leitura já tem rótulo
(HP/EN) e dígito; um coração/raio de 6×6 a 2× (12 CSS) não é legível como forma — Tamagotchi
desenha corações com 7–9px a 1× em LCD de 32px de altura, ou seja, maiores que o segmento, e sem
dígito. Trocar a forma só faria sentido se os rótulos HP/EN saíssem para liberar orçamento de
ícone (PD §5) — decisão do lead, não deste canvas. Se um dia sair, é arte da `squad-arte` em grade
(8×7 a 1×), nunca redução.

---

## 5. Encaminhamentos

- **`soulmon-visual-designer`** (rodada 2): F1, F2 (a–d), X1–X12.
- **`soulmon-design-lead`**: D-H5 (balão fica como exceção declarada; "Evolve" volta para a língua
  do vidro sem mudar estrutura — não precisa de decisão de estrutura); P4–P7 acima; registrar a
  segunda exceção à tese (`.seal`, R3) no `04` §1.
- **`soulmon-guarda-linha-vermelha`**: F1 (a linha assombrada não pode "sumir" — esmaecer até 3:1 é
  a cobrança pelo avesso: a tarefa que a pessoa não consegue ler é a que ela vai adiar); D-H2
  (moldura ao `max` — o contrário, trilho fixo, é medidor vazio acusando); aviso de HP em âmbar
  (`HomeAvisosExpandido`) e HP 0.5 sem dígito (`HomeHudEstados`) — passam pelas seis perguntas.
- **`squad-arte`**: X4 (caps da barra em grade), X11 (berço e cenário em grade), achado 5 do README
  (`sleep-z` claro), achado 6 (sombra de contato 64×16).
- **`staff-frontend`** (depois do "entra"): os 17 achados do README + X1 (placa como `color-mix`),
  X6 (`role=status`), P6 (subset +2).

## 6. Veredito

**VOLTA.** Condições para "entra" na rodada 2: F1, F2 e X1–X4 resolvidos e medidos (posição do
painel e do `primary` a 390×844 escrita no rodapé, como o wireframe fez); X5–X12 podem entrar como
lista se o designer preferir, mas X5 e X6 são de uma linha cada.

Maior alavanca única: **F2** — é o único achado que toca a razão de existir do wireframe (as duas
metades na primeira tela), e se resolve com ~50px sem mudar um nó.
