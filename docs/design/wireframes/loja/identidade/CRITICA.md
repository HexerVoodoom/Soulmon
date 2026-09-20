# CRÍTICA — canvas "Loja" (identidade, Fase 2, nono canvas) · `design-critic`

> Revisão BLOQUEANTE · 20/09/2026 · alvo: os 7 `.dc.html` + `MainClaro` + `canvas.json` + `README.md` desta pasta,
> servidos em `localhost:8775`.
> Método: (1) diff estrutural artboard a artboard contra `../<mesmo nome>.dc.html` — sequência de `role`, de
> `aria-label`, dos marcadores de foco (`.fo`) e o conjunto de palavras (`cmp.py`, 7 pares); (2) `getComputedStyle` +
> `getBoundingClientRect` em todos os nós do `.phone` nos 8 artboards (texto < 12px, Silkscreen fora do `.screen`, alvo
> < 44 entre `button/input/a/summary` e `role=button/checkbox/radio/textbox/switch/tab/link/menuitem`, vazamento de 390,
> `<img>`/`background-image`/`border-image`/`mask-image` fora do vidro, `opacity < 1`, `opacity()` em `filter`,
> `text-shadow`, qualquer `danger` em classe ou `style`, `scrollHeight` do `.ab` contra o `canvas.json`) + as caixas de
> cada `<img>` DENTRO de cada `.screen`, os cards `.item`/`.lk`/`.no`, os segmentos `.segi`, os degraus `.swap .btn`,
> o `.nudge`, os `role=status`, os preços `.bits/.emb/.n`, a largura da coluna de texto de cada card — script PRÓPRIO
> (`crit_loja.mjs` + `probe_loja.mjs`, Chromium via `playwright-core`, 420×900, DPR 1), não o do designer; (3) hex
> recalculados do `src/index.css` (bloco ONDA 1) com a fórmula WCAG 2.x, inclusive `primary-soft` composto (rgba .14
> sobre `surface` → `#1A4643`), `--sm2-credit-ink` e o véu `color-mix(viewport-bg 70%)`; (4) os 11 glifos cruzados com o
> inventário de 102 (`tokens.md` §5); (5) **a caixa de alfa de cada arte** (Pillow, alfa > 8: chips, sofá, quadro,
> planta, caixote, prateleira) contra o slot 72 e o vidro 348×200, e a luminância dos mini-visores de cenário 96×52 no
> PNG renderizado; (6) **o código que o palco diz reproduzir**: `utils/backgrounds.ts` (`FULL_SLOTS`/`GROUND_SLOTS`,
> `setting`), `utils/shop.ts` (`slot`, `fits`, preços, nomes), `ShopModal.tsx` (copy das regiões `aria-live`, da dica, da
> troca, do convite), `UnlockAccountModal.tsx`; (7) cruzado com DECISÕES §12 (L1–L4 / V1–V4 / S1–S5) e §18–§24,
> `HANDOFF-IDENTIDADE.md` §4–§7, as oito `CRITICA.md` anteriores, `CLAUDE.md` › 🛒 Loja / 💠 Bits / 🎖️ Emblemas / 💎
> Créditos / "as três moedas nunca se misturam" / Palco do pet.
> Não editei nenhum artboard.

## 0. Resumo

| Classe | Qtd | O que pesa |
|---|---|---|
| **fatal** | 1 | **O palco (D-L12) prova o contrário do código.** A legenda `[novo]` diz "the stage as the code draws it now — Bedroom + Potted Plant; the equipped Wall Poster is not drawn (its card says why)". No código, `bg-room` (Bedroom) é `setting: 'indoor', slots: FULL_SLOTS` — e `FULL_SLOTS` **inclui `wall`**; `furn-picture` é `slot: 'wall', fits: 'any'`. Ou seja: **com o Quarto equipado, o código DESENHA o quadro na parede** (`petStage.ts` só omite quando o cenário não tem o slot ou o `fits` não bate — nenhum dos dois acontece aqui). O palco desenha uma parede com janela redonda e nenhum quadro, e o card ao lado diz "Doesn't show in the current scene". O único elemento que o canvas acrescenta ao telefone existe para "provar visualmente" a regra "o que não combina não é desenhado, a loja explica" — e a prova é de um estado que o `petStage.ts` nunca produz. Como spec para o `staff-frontend`, ensina a regra errada (o quadro cabe em `any`, inclusive no Quarto). |
| **fixável** | 6 | **o card de cenário EQUIPADO espreme o nome a 90 px** (356) / **64 px** (330): "Night Sky" quebra em duas linhas no `CardEstados` LOJA-05, e a 356 qualquer nome ≥ 90 px ("Digital Coliseum", "Mount Infinity") quebra — o mini-visor 96 + a tag "Equipped" 94 + os gaps comem 266 dos 356 · **a recusa pinta a LINHA do card em `gold-ink` 500**, além do filete e da região — o wireframe (L4) fixou "borda 1px + região"; a linha dourada faz o card ler como destaque/oferta por 2,6 s · **"+100 Bits." em Rubik** na região de sucesso da troca enquanto o toast, o saldo e o preço estão em mono (D-L4: "a moeda lê igual") — e "Bits" dentro dos três degraus também em Rubik · **Bits em `ink`** contra `bitsStyle` (`currencies.ts`) em `primary-ink` — a mesma pendência X5 de Jogos, ainda sem decisão do lead; a Loja tem que herdar a MESMA resposta · README com a altura dos cards errada ("88–92"; medido 75–95) e a frase do palco que a F1 derruba · `aria-label="Bits: 260"` num `<span>` sem `role` (ARIA proíbe `aria-label` em `generic`; a maioria dos leitores ignora) — herdado do wireframe, mas o código real pode fazer certo |
| **ruído** | 9 | a tag `sample` dentro do `aria-label` do Coliseu ("… · 2/5 sample", herdado) · "Wall Poster" não existe no catálogo (o `furn-picture` é "Soulmon Portrait"; herdado) · preços de amostra ≠ código (Night Sky 200 × `150`; Pixel Sofa 150 × `100`; herdados) · o `.nudge` a 280 alinhado à esquerda com 76 px vazios à direita (o wireframe tem `max-width:280px`; o `UnlockNudge` real usa 440) · o véu do travado em `color-mix(… 70%, transparent)` (alfa sobre a arte — precedente da placa Home D-H3, mesmo ruído da "ON HOLD" de Evolução) · três diâmetros de mini-visor no sistema (Dex 64 · Loja 72 · nó 80) · o berço 220×104 termina em 202 no vidro de 200 (idêntico à Home, precedente) · miniaturas de cenário a 0,08× (legíveis — luminância média 39–42 contra 48 do card, com desvio 27–32; a Bedroom é a mais escura) — o pedido à `squad-arte` deveria ser firme, não "opcional" · "Emblems" 12 `muted` colado ao "12" Georgia 20 no saldo (lê; só registro) |

**Veredito: VOLTA (rodada 2 curta).** Um fatal, e ele é exatamente o `[novo]` que o lead tem que julgar: a D-L12 não pode
ser "manter" como está — o palco afirma sobre o código algo que o código não faz. **Consertar custa uma linha** (a
amostra: equipar o Night Sky, que é `GROUND_SLOTS` — aí o quadro E o sofá realmente não aparecem, e a frase fica
verdadeira) — mas a recomendação é **tirar** (§3). **X1–X3 são obrigatórios antes do checkpoint do dono** (o card equipado
com o nome quebrado é um recorte 200×200 provável; a recusa dourada é a única cor de atenção do canvas). X4–X6 são de uma
linha ou de texto; X4 (`ink` × `primary-ink`) é decisão do lead já aberta em Jogos. Tudo o mais passa — e é muito.

**O que está certo e não precisa de rodada:** estrutura **idêntica nos 7 pares** — mesma sequência de `role`
(`radiogroup`/`radio`/`status`/`button`; o palco não tem `role`), mesmos `aria-label` (7/7 conjuntos iguais), mesmos
marcadores de foco (10 · 9 · 6 · 6 · 3 · 2 · 9 — `CardEstados` 3·2·4·6·5·7 como o wireframe), mesma copy (as diferenças são
os nomes de glifo, os "ART" que viraram arte, "260" → "260 Bits", "2/5" e "32"/"0" em `<span class=num>`, a legenda
`[novo]`, o marcador de dobra e as legendas dos strips que passaram a descrever o que o artboard desenha); **0 nós < 12 px**
nos 8; **0 alvo < 44** ("Equip" 90×44; cards 75–95 de altura; segmentos 176×44 / 163×44; degraus 330×48; convite 280×117;
nav); **0 vazamento** de 390; **0 Silkscreen** em lugar nenhum (nenhum texto dentro dos vidros); **0 `opacity < 1`, 0
`opacity()`, 0 `text-shadow`** em nó nenhum dos 8; **0 PNG / `background-image` / `border-image` / `mask-image` fora do
vidro** (os 3 chips, os 6 cenários, o sofá, o quadro, o caixote, a prateleira, a planta, o berço e a criatura estão todos
dentro de um `.screen`; o único `background-image` fora é o gradiente do anel de cobre, precedente da Home);
**`--sm2-danger-*` ausente dos 8** (classe e `style`); **11 glifos, 11 no inventário de 102** (`check_circle, lock,
military_tech, diamond, auto_awesome, chevron_right, sync` + `home, casino, storefront, menu`); ícone nunca em box (o
cadeado acompanha "locked" numa tag; o `check_circle` acompanha "Equipped"; o `military_tech` acompanha o número; o
`diamond` acompanha a frase); `canvas.json` = `scrollHeight` dos 8 `.ab` (2384 · 1499 · 2278 · 2146 · 1653 · 2003 · 1908 ·
1528); **os 18 pares de contraste do README conferem ao centésimo** nos dois temas (`ink/bg` 16,15 / 14,96 · `muted/surface`
7,43 / 5,80 · `muted/surface-2` 6,30 / 5,09 · `primary-ink/primary-soft` 7,69 / 5,21 · `gold-ink/surface` 8,84 / 5,87 ·
`gold-ink/surface-2` 7,49 / 5,15 · `credit-ink/surface` **7,56 / 7,10** · `viewport-ring/bg` 5,92 / 3,66 · `line/surface`
1,32 / 1,25 decorativo · `viewport-bg/surface` 1,24 / 16,23 — o vidro lê pela arte, Pet R3); **escala inteira em toda
arte** (chips 96→48, sofá 112→56, quadro 112×80→56×40, planta 96×104→48×52, caixote/prateleira 138×150→69×75, criatura
256→128 — todos 0,5×; berço a ⅓ e cenários a 0,08× / cover declarados como transição, precedente Home X11); **nenhuma arte
cortada no slot 72** — medido pela caixa de alfa: caixote 138×135 → 69×67,5 cai em y 2,5–70 do vidro de 72 (a 64 cortaria
3,5 px: a D-L3 está PROVADA, não só argumentada), prateleira 138×128 → y 4,5–68,5, sofá 56×38 em 26–64, quadro 44×40 em
22–56, chips 40×48 em 12–60; a dobra a 844 como o README mede (`Main`: 3º card 421–511, nota ⚰️ + marcador até 647, nav
774; `TorneioSegmento`: 2º prêmio 621–711; `ConviteDemo`: convite 115–232; `CenariosMobilias`: palco 92–300, Backdrops até
653, marcador a 776); as regras do `CLAUDE.md` respeitadas — **as três moedas não se parecem** (Bits "260 Bits" /
"120 Bits" em `--sm2-font-mono` 16 `tabular-nums` sem ícone e sem chip; Emblemas `military_tech` 20 FILL + Georgia 20/700
`gold-ink` no saldo E no preço "8 Emblems" E no prêmio "+3"; Créditos `diamond` 20 FILL `credit-ink` só no cabeçalho da
troca, e o número em `ink`); **o saldo é UMA leitura** e troca de moeda com o segmento (L1); **o Coraçãozinho não está à
venda** (nota ⚰️ com `SPECIAL_ITEMS`/`HEART_HEAL`/13.14) e o Glitchtama não aparece; **`unlock` = cadeado + a missão em
palavras** ("Evolve to MEGA level"; "Win 5 tournament matches · 2/5" só com `cur > 0`; nunca "0/3"); **o item que não
combina não some**: "Doesn't show in the current scene" no próprio card (a copy do `ShopModal.tsx` l. 244, palavra por
palavra); **nada de vermelho de cobrança** (recusa em âmbar; "The swap did not go through" em `muted`); **oferta = convite**
(`auto_awesome` dourado, `chevron_right`, sem ×, sem preço riscado, "No rush…" antes, a troca depois — guarda 3b) e **a
recusa não abre convite de Créditos** (guarda 3a: o strip LOJA-07 termina no card); a copy é a do código ("Earn Bits in
the minigames." · "Emblems only come from the Tournament — and only buy here." · "‹name› purchased." · "Not enough to buy
‹name›." · "Swap Credits for Bits — you have N" · "Nothing here yet." · "No rush — this stays here whenever you want to
look." · "The custom creature lives here" · "Goes to Items; use for +3 Power"); os `role` certos (`radiogroup` +
`radio aria-checked` nos segmentos; `status aria-live=polite` na dica, no flash, na recusa, na falha e no sucesso;
`aria-disabled` + `aria-busy` nos degraus; o travado `aria-disabled` e FORA da ordem de foco, sem `fo`; a tag "locked"
`aria-hidden` porque o rótulo já diz "locked"); **o travado é inerte por forma** (tracejado `muted` 1px sobre `bg` = 8,83,
nome em `muted`, fundo transparente, véu no vidro — nenhuma opacidade); **o segmento ativo é tonal** (`primary-soft`
composto + `primary-ink` + borda 1px `primary-ink`, não placa cheia — D-P1); **os degraus da troca inertes por
superfície** (`surface-2` + anel `line` + texto `muted` 6,30, `aria-disabled`; o ocupado com `sync` 20 `muted` +
`aria-busy`); `MainClaro` com o mesmo DOM sob `[data-theme=light]` (mini-visores continuam `#0E2422`; "Shop" `#0B6F68`
sobre `#D6F5EF` = 5,21).

## 1. Fatal (F — reprova a D-L12 como está)

**F1 · O palco prova um estado que o código não produz (`CenariosMobilias` LOJA-02/03, `[novo]`, D-L12)** — o vidro
348×200 desenha `bg-room` em cover + berço + criatura + `furn-plant` no `floor-right`, e a legenda diz que o Wall Poster
equipado "is not drawn (its card says why)". Conferido no código: `utils/backgrounds.ts` › `'bg-room': { setting:
'indoor', slots: FULL_SLOTS }` com `const FULL_SLOTS = [...GROUND_SLOTS, 'wall']`; `utils/shop.ts` › `furn-picture: { slot:
'wall', fits: 'any' }`. O Quarto TEM parede e o quadro CABE em qualquer cenário — o `petStage.ts` desenha o quadro acima do
pet. A frase do card ("Doesn't show in the current scene", `ShopModal.tsx` l. 244) só é verdadeira num cenário
`GROUND_SLOTS` (Night Sky, Mount Infinity — "céu aberto: nada onde pendurar") ou para um item `fits: 'indoor'` num
cenário `outdoor`. O wireframe já carregava a inconsistência (Bedroom equipado + "Doesn't show"), mas lá era copy de
amostra ao lado de um "ART" cinza; o canvas de identidade **acrescentou um elemento inteiro cuja única função é provar
essa frase com a arte real** — e a arte real contradiz a frase. É a família de erro que o `CLAUDE.md` mais repete ("a
justificativa escrita era falsa"): spec que afirma o que o código faz sem conferir. **Conserto, se o palco ficar (uma
linha na amostra):** equipar o **Night Sky** — `bg-night` é `outdoor` + `GROUND_SLOTS`, então o quadro (`wall`) e o sofá
(`indoor`) legitimamente não aparecem, a planta (`any`, `floor-right`) aparece, e os cards passam a "Bedroom — Equip" /
"Night Sky — Equipped" / "Pixel Sofa — Doesn't show in the current scene" / "Wall Poster — Doesn't show in the current
scene". Isso muda a amostra, não a estrutura (mesmos `role`, mesma ordem de foco). **Conserto recomendado:** tirar o
palco do canvas da Loja (§3, D-L12) — a regra já está provada no canvas da Home (D-H1) e em `PALCO-E-DECORACAO.md`, e o
card explica em palavras, como o `CLAUDE.md` pede.

## 2. Fixável (X — obrigatórios antes do checkpoint: X1–X3)

**X1 · O card de cenário EQUIPADO não deixa espaço para o nome (`CardEstados` LOJA-05 "Equipped" · `CenariosMobilias`
"Bedroom — Equipped")** — medido: a coluna de texto `.tx` mede **64 px** no card de 330 (dentro do strip) e **90 px** no
card de 356 (a página); "Night Sky" a Rubik 14/500 quebra em "Night / Sky" no LOJA-05 (2 linhas, card cresce de 75 para
95); a 356, "Bedroom" cabe mas a linha "The free default — everyone owns it" vira 3 linhas. A conta: 356 − 2×12 (padding)
− 96 (mini-visor de cenário) − 10 − 94 (tag "Equipped" com `check_circle`) − 10 = **90 px** — e os nomes do catálogo de
cenários medem até ~120 px ("Digital Coliseum", "Mount Infinity", "File City" cabe). Todo cenário equipado com nome de duas
palavras quebra. Os cards de mobília (slot 72) têm 114 px e passam. **Conserto (uma regra de CSS):** quando o slot da
direita é a tag "Equipped" (não um preço nem "Equip"), a tag desce para a segunda linha da coluna de texto (abaixo da
descrição, alinhada à esquerda) — o `.mv.sel` já acende o vidro, então a tag não precisa competir com o nome na mesma
linha; ou, se a fidelidade ao "tag à direita" do wireframe pesar mais, o mini-visor de cenário a **80×43** (0,067×) devolve
16 px e "Digital Coliseum" ainda não cabe — a primeira opção é a que resolve. Padrão de mercado: nas lojas de decoração
(Finch, Pou, Animal Crossing Pocket Camp) o estado "equipado" é um selo NO thumbnail + uma linha curta, nunca um chip
largo disputando a coluna do nome.

**X2 · A recusa pinta a linha do card em dourado, além do filete e da região (`CardEstados` LOJA-07, D-L7)** — computado:
`.no .tx .s { color: gold-ink; font-weight: 500 }` ("Stars over the roof" em `#EBBE84` 500 por 2,6 s), mais `box-shadow:
inset 0 0 0 1px gold-ink` e a região `role=status` em `gold-ink` 500. O wireframe (DECISÕES §12 L4) fixou "a borda da
recusa em 1px" + a região `aria-live`; a linha dourada é acréscimo da identidade. O problema não é contraste (8,84) — é
LEITURA: no Shop, `gold-ink` já é a cor do convite (`auto_awesome` do `.nudge`), e um card cuja descrição vira dourada e
pesada lê como "destaque/oferta", justamente o oposto de "não deu". A mensagem mora na região (`Not enough to buy Night
Sky.`) e o filete localiza o card; isso basta. **Conserto:** tirar a regra `.no .tx .s` (nome e linha ficam em
`ink`/`muted`); manter filete + região + preço em `muted` (D-L6). A D-L7 (âmbar em vez de `danger`) fica de pé — §3.

**X3 · "+100 Bits." em Rubik na região de sucesso da troca (`TrocaCreditos` LOJA-13, D-L4)** — computado: `role=status`
"+100 Bits." em Rubik 12/500 `ink`, enquanto o toast "+100 Bits!" está em `--sm2-font-mono` 16 e o saldo/preços em mono.
A D-L4 diz "a moeda lê igual nos dois lugares"; aqui são três lugares e um deles não lê igual. O `CLAUDE.md` 💠 é
explícito: Bits "exibida sem ícone, só o número + 'Bits' em fonte de calculadora". **Conserto:** o valor da região em
`.bits.num` (mono), a frase continua Rubik se houver frase. O mesmo vale, com menos peso, para "Swap 10 Credits for **100
Bits**" dentro dos três degraus — um rótulo de botão com duas fontes é feio, mas o rótulo é frase, não saldo; registro,
sem obrigar.

**X4 · Bits em `ink` contra `bitsStyle` em `primary-ink` — decisão do lead, já aberta em Jogos (X5 de lá)** — "260 Bits"
e "120 Bits" computam `#E9F5F2` = `--sm2-ink`; `utils/currencies.ts` › `bitsStyle` fixa `color: var(--sm2-primary-ink)` e
documenta a sobrescrita por `ink` como bug corrigido. O canvas segue o SIS-07 aprovado. Não é erro do designer; é a
mesma pergunta em duas superfícies, e **as duas têm que receber a mesma resposta** — se Jogos ficar em `primary-ink`, a
Loja também (saldo + preço, 4 nós em `Main`, 2 em `CenariosMobilias`, 1 em `CardEstados`, 1 no toast).

**X5 · README** — (a) "os cards 88–92": medido 75 (Night Sky Equip / recusa / travado de uma linha) a 95 (Equipped
quebrado); ≥ 44 em todos, mas a frase não bate; (b) a linha do palco ("Mostra o que o código DESENHA … e a ausência do que
não combina (Wall Poster)") cai com a F1; (c) "Para o `staff-frontend` … 13. Não existe preview do palco na loja" — se o
lead tirar o palco (§3), o achado 13 vira "não desenhar" e a nota `[novo]` sai do `canvas.json`.

**X6 · `aria-label="Bits: 260"` num `<span class="bits num">` sem `role`** — ARIA 1.2 proíbe `aria-label` em `generic`
e NVDA/VoiceOver o ignoram: o leitor lê "260 Bits" do texto, o que até é melhor que o rótulo. Herdado do wireframe (que
punha o rótulo num `.chip`, também `<span>`). Não muda o artboard; **registrar para o `staff-frontend`**: o saldo é um
`<p>`/`<output>` com o texto "260 Bits" e ponto — ou `role="status"` se ele muda ao vivo (o `ShopModal.tsx` l. 365 já tem
uma região `status` para o flash; não empilhar duas).

## 3. Decisões D-L1…D-L12 — veredito por decisão

| # | Decisão | Veredito | Evidência |
|---|---|---|---|
| D-L1 | Aparelho em vetor, pixel só no vidro | **ENTRA** | 0 Silkscreen, 0 PNG fora de `.screen`, cards SIS-03, segmentos SIS-04, Fredoka 20 / Rubik 14/12 medidos |
| D-L2 | O item é a arte real, não o emoji | **ENTRA** | 15 `<img>` reais, todos dentro de um `.screen`; 0 emoji no telefone (os dois do `CardEstados` estão nas legendas dos strips) |
| D-L3 | Mini-visor 72² (item/decoração) e 96×52 (cenário), sem anel | **ENTRA** | Provada pela caixa de alfa: caixote 69×67,5 a 0,5× cabe em 72 com 2,5 px de folga e **não cabe em 64** (cortaria 3,5 px); prateleira 64 de altura útil; chips 48. O 96×52 lê (luminância 39–42 / desvio 27–32). Ruído: o sistema fica com três diâmetros (64/72/80) — o lead pode unificar o Dex em 72 depois |
| D-L4 | Bits "N Bits" mono 16 sem ícone/chip, no saldo E no preço | **ENTRA com X3** | Saldo e 7 preços em `--sm2-font-mono` 16 `tabular-nums`; a região "+100 Bits." escapou (X3). A cor (`ink` × `primary-ink`) é X4, do lead |
| D-L5 | Segmento ativo `primary-soft` + `primary-ink` + borda | **ENTRA** | `.segi.on` = `rgba(95,243,224,.14)` sobre `surface` (= `#1A4643`, 7,69) + borda 1px `#5FF3E0`; claro 5,21; 176×44 |
| D-L6 | Preço sem saldo esmaece por TINTA | **ENTRA** | `.price.dim` = `#9DBCB4` (7,43 sobre `surface`); `opacity` 1 em todos os nós |
| D-L7 | Recusa em âmbar, sem `danger` | **ENTRA com X2** | 0 `danger` nos 8; filete `gold-ink` 1px inset (8,84) + região `gold-ink` 500 12px (10,51 sobre `bg`) — ok. A linha do card em dourado é acréscimo ao wireframe e lê como oferta (X2). O argumento "as três moedas nunca se misturam" não derruba: no Shop não há Emblemas, e a identidade dos Emblemas é serifa + `military_tech`, não só a cor — mas é por isso mesmo que a cor deve ficar SÓ no filete e na região, nunca na copy do item |
| D-L8 | Travado inerte por FORMA | **ENTRA** | Tracejado `muted` 1px sobre `bg` (8,83), nome `muted`, fundo transparente, `aria-disabled`, sem `fo`, tag "locked" `aria-hidden` com `lock` 18. O véu `color-mix(viewport-bg 70%, transparent)` é alfa sobre a arte — ruído, precedente Home D-H3 / Evolução "ON HOLD" |
| D-L9 | "Equip" 44 · "Equipped" = tag + slot aceso | **ENTRA com X1** | `.btn.out.sm` 90×44 (era 36); `.mv.sel .screen` = `box-shadow 0 0 0 2px primary-ink` por fora (11,12 / 6,02). A tag de 94 px espreme o nome do cenário (X1) |
| D-L10 | Emblemas em serifa dourada em toda ocorrência | **ENTRA** | Saldo Georgia 20/700 `#EBBE84` (10,51); preço "8 Emblems" Georgia 20 (8,84); "+3"/"+2" Georgia 16 em `.chip.tag.gold` (7,49 sobre `surface-2`); `military_tech` 20/18 FILL em todos |
| D-L11 | Créditos = `diamond` 20 FILL `credit-ink`; degraus `outline` | **ENTRA** | `#C9A7FF` / `#6D28D9` = 7,56 / 7,10 sobre `surface`; três `.btn.out` 330×48 com anel `muted` 1px (6,30); inertes em `surface-2` + anel `line` + `muted`; `aria-busy` + `sync`. Primeiro consumidor do token confirmado (0 ocorrências de `credit-ink` nos oito canvases anteriores) |
| D-L12 | O palco 348×200 como prova `[novo]` | **SAI (recomendação) — como está, REPROVADA (F1)** | (a) A prova é falsa: Bedroom = `FULL_SLOTS`, quadro = `fits: 'any'` → o código desenha o quadro. (b) Mesmo com a amostra corrigida (Night Sky equipado), um palco ESTÁTICO no meio da lista (entre Itens e Cenários, 232 px com o anel) não é o padrão do gênero: nas lojas de decoração (Finch, Pou, Tamagotchi On, Pocket Camp) o preview é **no topo, fixo, e reage ao toque no item** — "tap-to-preview" é estrutura, e estrutura é Fase 1, fechada. Sem reagir, o palco é uma ilustração de 200 px que custa a dobra do segmento rolado e não responde à pergunta do artboard ("where does my creature live — and what changes when I equip this?") melhor do que a Home, que o jogador acabou de deixar. (c) A regra "não aparece → a loja explica" já está no card (copy do código) e já tem prova visual no canvas da Home (D-H1). **Se o lead mantiver:** amostra corrigida (F1), posição no TOPO do segmento (antes de Itens, logo sob a dica), e registrar no achado 13 que a implementação é o `CompanionHUD` em modo leitura — nunca um segundo desenho do palco |

## 4. Ruído (R — registro, sem rodada)

- **R1** · `aria-label="Digital Coliseum — locked: Win 5 tournament matches · 2/5 sample"` — a tag `sample` (anotação do
  canvas) vazou para o nome acessível. Herdado do wireframe; é a mesma classe do B4 de lá (marcação dentro do rótulo). No
  código o rótulo é `${name} — locked: ${lockLine}` sem anotação — nada a implementar.
- **R2** · "Wall Poster" não existe em `SHOP_ITEMS`: `furn-picture` é "Soulmon Portrait" / "Quadro do Soulmon" ("Hangs
  above the pet — in scenes with somewhere to hang it"). Herdado. Se o lead corrigir a amostra da F1, usar o nome do
  código — e a descrição real já explica a regra do slot melhor que "Doesn't show".
- **R3** · Preços de amostra ≠ código: Night Sky **200** (código `150`), Pixel Sofa **150** (código `100`), "27 pieces" ok,
  Wooden Crate 8 / Simple Shelf 12 ok. Herdados; amostra, não regra.
- **R4** · O `.nudge` tem `max-width:280px` e fica alinhado à esquerda com 76 px de `bg` à direita; o `UnlockNudge`
  real é `maxWidth={440}` (largura inteira no telefone). O wireframe fixou 280 — fidelidade vence; fica como pergunta ao
  lead se o card-convite deve ser de largura inteira como todo card da tela (o canvas de Evolução usa o mesmo `.nudge`
  sem `max-width`).
- **R5** · O véu do travado (`.veil`, `color-mix(in srgb, viewport-bg 70%, transparent)`) escurece a arte por alfa
  dentro do vidro. O gerador reprova `opacity < 1` e este é o atalho equivalente — mas é placa sobre vidro, o precedente
  aprovado (Home D-H3, Evolução "ON HOLD"). Alternativa sólida, se um dia incomodar: a silhueta por `mask-image` do Dex
  (Pet D-P9).
- **R6** · Três diâmetros de mini-visor no sistema: 64 (SIS-07 / Dex), **72** (Loja, D-L3) e 80 (nó da Evolução, X3).
  Cada um tem razão medida; só registro para o lead decidir se o Dex sobe a 72 (a cena do Dex é 48, cabe nos dois).
- **R7** · O berço 220×104 em `top:98` termina em 202 no vidro de 200 (2 px sob o `overflow`). Idêntico à Home aprovada.
- **R8** · Miniaturas de cenário a 0,08× com `image-rendering:auto`: legíveis (a Bedroom é a mais escura, média 39 sobre
  card 48, mas a janela redonda identifica). O README lista as 96×52 nativas como "opcional" para a `squad-arte` — deveria
  ser pedido firme: são 19 + 6 cenários que vão aparecer em toda abertura da loja, e 0,08× de uma ilustração 1200×648 é
  o pior caso de transição do sistema.
- **R9** · No saldo do Torneio, "Emblems" 12 `muted` cola no "12" Georgia 20 (gap 4). Lê; só registro — a hierarquia
  número > moeda é a certa.

## 5. O que o autor não viu (fora do canvas, para o STATUS / cartógrafo)

- **O wireframe da Loja (`../CenariosMobilias.dc.html`) já era inconsistente com o código** no par Bedroom equipado +
  "Wall Poster — Doesn't show" — passou pela crítica da Fase 1 porque era copy de amostra ao lado de um "ART". Registro,
  não reabertura: a Fase 2 corrige a amostra (F1) sem tocar a estrutura.
- **`furn-picture` cabe em `any`, mas a descrição diz "in scenes with somewhere to hang it"** — as duas afirmações
  coexistem porque `fits` filtra por `setting` e o slot `wall` filtra por `slots`; o jogador lê "any" pela descrição e
  descobre o slot na prática. Candidato a achado de copy para o `product-designer` (não é regra de jogo).
- O achado 13 do README ("não existe preview do palco na loja") continua verdadeiro e é o único lugar onde a D-L12 tem
  consequência de código — se o lead tirar o palco, o achado sai junto.

## 6. Veredito

**VOLTA — rodada 2 curta.** F1 decide a D-L12 (recomendação: sair; se ficar, amostra corrigida e no topo). X1 (a tag
"Equipped" desce para a coluna de texto), X2 (a linha do card sai do dourado) e X3 (região da troca em mono) antes do
checkpoint. X4 espera a decisão do lead que Jogos já pediu; X5–X6 são README/STATUS. **Não passa numa revisão de staff como
está** por uma razão só: o único elemento novo do canvas afirma sobre o código algo que o código não faz — e a Loja é a
superfície onde o `CLAUDE.md` mais insiste que "a loja explica". A correção mais alavancada é tirar o palco e deixar a
explicação onde o código a põe: no card.
