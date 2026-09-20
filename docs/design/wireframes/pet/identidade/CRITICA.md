# CRÍTICA — canvas "Pet" (identidade, Fase 2, quinto canvas) · `design-critic`

> Revisão BLOQUEANTE · 16/09/2026 · alvo: os 9 `.dc.html` + `MainClaro` + `canvas.json` + `README.md`
> desta pasta, servidos em `localhost:8770`.
> Método: (1) diff estrutural artboard a artboard contra `../<mesmo nome>.dc.html` — sequência de `role`,
> de `aria-label`, dos marcadores de foco (`.fo`), rótulos dos botões e a copy visível (conjunto de palavras);
> (2) `getComputedStyle` + `getBoundingClientRect` em todos os nós do `.phone` nos 10 artboards (texto < 12px,
> Silkscreen fora do `.screen`, alvo < 44 entre `button/input/a/summary` e `role=button/checkbox/radio/textbox/
> switch/tab/link/menuitem`, vazamento da largura de 390, `<img>`/`background-image`/`border-image`/`mask-image`
> fora do vidro, **`opacity < 1`, `opacity()` em `filter` e `text-shadow` em qualquer nó do `.phone`**,
> `scrollHeight` do `.ab` contra o `canvas.json`) — script PRÓPRIO (`crit_pet.mjs`, Chromium via
> `playwright-core`, 420×900, DPR 1), não o do designer; (3) **no browser pane**, a prova do estado que o canvas
> não desenha: o visor de emblemas com a coleção INTEIRA (8/8), a composição da heroína (posição de aura/sprite/
> sigilo), a tinta computada da silhueta e a altura das células do Dex; (4) hex recalculados do `src/index.css`
> (bloco ONDA 1, `:root` + `[data-theme=dark]`) com a fórmula WCAG 2.x, inclusive o `color-mix` da silhueta;
> (5) os 8 glifos cruzados com o inventário de 102 (`tokens.md` §5); (6) escala real de cada PNG dentro do vidro
> (`naturalWidth` × largura renderizada) em DPR 1/2/3 **e a caixa de alfa de cada arte** (`sharp`, alfa > 8) —
> é ela que diz o que o vidro corta de verdade; (7) cruzado com Sistema/Home/Atividades/Rituais aprovados
> (DECISÕES §18–§20 + `rituais/identidade/CRITICA.md`), DECISÕES §8 (P1–P4 / V1–V5 / S1–S5),
> `HANDOFF-IDENTIDADE.md` §4–§7, `CLAUDE.md` › Sonhos/Emblemas/Bestiário, e o código (`PetPage.tsx`,
> `ui/Viewport.tsx`, `utils/restWindow.ts` `DREAM_CATALOG`, `utils/oracle.ts` `STAGE_NAMES`,
> `assets/soulmon/lines/`). Não editei nenhum artboard.

## 0. Resumo

| Classe | Qtd | O que pesa |
|---|---|---|
| **fatal** | 0 | — |
| **fixável** | 7 | **o 2º visor não comporta a coleção inteira** (8 emblemas a 32 com gap 4 + padding 4 = 292 > 284 — medido no browser pane: o 8º cai em 309–341 num vidro que termina em 337, 4 px cortados e zero margem à direita; o canvas só desenha 3) · **os emblemas não têm nome visível** (`title` é hover, e toque não tem hover — o leitor de tela recebe mais que o vidente) · a **aura a 2× perde 25 % da largura** (caixa de alfa 0–127 → −32..224 num vidro de 192: o "anel que envolve a criatura" nunca aparece inteiro) · a sub-aba ativa em placa `primary` cheia (idioma da AÇÃO, SIS-02) para dizer "onde estou" · a amostra usa `igni-rookie.png` para a forma ATUAL ("Ascendant") e para a ANTERIOR ("Awakened") — a ficha que existe para provar "who they used to be" mostra a mesma criatura duas vezes · "#NN · data" desalinhado entre células da mesma linha (103 vs 119) · README com 3 números que o DOM não confirma e 1 par de contraste que falta na tabela |
| **ruído** | 8 | sigilo (placa opaca 48²) sobre as chamas do canto · sprite + aura 8 px abaixo do centro do vidro · slot sem anel a 1,24:1 sobre o card no escuro · `auto_awesome` com dois sentidos na mesma tela · anotações dentro do telefone (D-P12) · arte de aventura full-bleed no vidro 48² · três skeletons idênticos (V4) · `#NN` global intercala as sazonais (Fase 1, P2) |

**Veredito: ENTRA COM CONSERTOS** (nenhum fatal; X1 e X2 são obrigatórios antes do checkpoint do dono e custam
uma linha de CSS e uma linha de texto; X3 e X4 são decisão do lead; X5–X7 são de uma linha cada). Nada
estrutural, nada reaberto, nada que peça o dono. Rodada 2 só para colar as medições de X1/X3 no README —
não precisa voltar ao lead.

**O que está certo e não precisa de rodada:** estrutura **idêntica nos 9 pares** — mesma sequência de `role`
em 8 de 9 (o `Main` tem o `role="img"` a mais do visor de emblemas, marcado `[novo — código 15/09]` no artboard,
no rodapé e no README — ver D-P5), os mesmos `aria-label` (as únicas diferenças são os nomes das cenas, que
saem da copy de exemplo do wireframe para o `DREAM_CATALOG` real, na ordem, com o `#NN` global certo: `#09`–`#12`
raros, `#15`–`#18` lendários), os mesmos 8 números de foco em cada tela (2–4 sub-abas, 5–9 nav; 0 em
`FichaEstados`), os mesmos rótulos de botão (só as ligatures dos ícones mudam); **0 nós < 12px** dentro do
`.phone` nos 10 (o wireframe tinha 10/9 px nas células do Dex — subiram para 12); **0 alvo < 44** (as três
sub-abas medem 113,3×44); **0 elemento vazando** 390; **0 Silkscreen** em lugar nenhum (não há texto dentro
dos vidros); **0 `opacity < 1`, 0 `opacity()` em `filter`, 0 `text-shadow` em nó nenhum** (o `.glass` do vidro
e o `.dobra` são os únicos alphas, os dois declarados desde o Sistema/Atividades); **0 PNG, 0 `background-image`,
0 `mask-image` fora do `.screen`** — as 12 cenas, os 3 emblemas, o sigilo, a aura, o sprite, as 3 artes do
diário e a forma anterior estão todos dentro de um vidro, e a silhueta é `mask-image` dentro do slot; os
**8 glifos** (`auto_awesome, bolt, casino, egg, home, info, menu, storefront`) estão nos 102; ícone nunca em
box (`bolt`/`auto_awesome` 24, `egg` 48, `info` 20 — pelados); `canvas.json` UTF-8, alturas = `scrollHeight`
dos 10 `.ab`; os **12 pares de contraste do README conferem ao centésimo** nos dois temas (a silhueta
computa `#667271` no escuro — 3,76 — e `#6A7C79` no claro — 3,69); `MainClaro` com o vidro escuro
(`#0E2422`), cobre `#B0722F` (3,66 sobre `bg`), ciano `#0B6F68`; a dobra a 844 como o README mede (visor
129–321, emblemas 337–385, card das habilidades 536–737 inteiro; Dex com duas raridades inteiras antes da nav
e a terceira anunciada; as três entradas do diário 222–496; o 3º skeleton 385–506); **toda arte no vidro em
múltiplo de 0,5× do nativo** (tabela §1.1 — a regra que a crítica de Rituais pediu, cumprida aqui em todas as
peças); estágio · classe como duas PALAVRAS, nunca número ("Ascendant · Wanderer", "Awakened · Scout",
"Ascendant" sozinho quando a classe não veio); o Dex sem `%`, sem "faltam N", sem "left/remaining" (varrido),
com "0 of 30" como texto quieto e sem barra no vazio (P1), frações em zero só quando as três estão em zero
(guarda 1c: "Legendary 0 of 8" fica no parcial), "#NN · data" só no obtido (P2), silhueta + "???" no não
obtido, o medidor como posse (13.7); o diário como DESCRIÇÃO em 1ª pessoa, em Rubik 14 `ink` — conteúdo, não
metadado (D-P8), data 12 `muted` `tabular`, sem "N days"; o vazio da ficha sem vidro apagado (D-P10); os três
`role="status" aria-live="polite" aria-label="Loading"` com "LOADING" em Rubik 12/500 fora do vidro (Home X6);
ícone de habilidade em Material (`bolt` FILL 0 `primary-ink` / `auto_awesome` FILL 1 `gold-ink`) — a tese do
Visor no seu ponto mais tentador (os `el-*.png` ficaram fora, D-P6); "power N" em 400 `muted` `tabular` e a
linha sem mudar de altura quando ele chega (`FichaEstados`); nenhum vermelho, nenhum cadeado, nenhuma silhueta
de emblema fechado (o app não cobra).

---

## 1. Medições

### 1.1 Escala do pixel dentro dos vidros (o que D-P2…D-P9 declaram × o que o DOM mede × a caixa de alfa)

| Peça | Arte | Nativo | Caixa de alfa (nativo) | CSS | DPR 1 | DPR 2 | DPR 3 | Grade |
|---|---|---|---|---|---|---|---|---|
| Heroína (`Main`, `MainClaro`) | `lines/igni-rookie.png` | 256² | x 0–255 · y 29–226 | 128 em 192² (a 32,40) | 0,5× | **1×** | 1,5× | P2 (a) ✓ |
| Aura (`Main`, `MainClaro`) | `fx-ataque/fx-fogo-aura.png` | 128² | **x 0–127** · y 21–106 | 256 em 192² (a −32,−24) | **2×** | 4× | 6× | inteira ✓ — mas **corta 32 px de cada lado** (X3) |
| Sigilo (`Main`, `MainClaro`) | `sigilos/marcial.png` | 192² | x 4–187 · y 4–187 | 48 (a 8,8) | 0,25× | 0,5× | 0,75× | ✓ (mesma transição de D-H7) |
| Emblemas (2º visor) | `emblems/*.png` | 64² | x 4/5–58 · y 0–63 | 32 em 284×40 | 0,5× | **1×** | 1,5× | ✓ — mas 8/8 não cabe (X1) |
| Forma anterior (`FichaRolada`) | `lines/igni-rookie.png` | 256² | idem heroína | 64 em 80² | 0,25× | 0,5× | 0,75× | ✓ D-H7 |
| Cena do Dex (obtida) | `dreams/*.png` | 96² | ex.: y 18–77 | 48 em 64² | 0,5× | **1×** | 1,5× | ✓ (Rituais: aventura a 0,5×) |
| Silhueta do Dex | `mask-image` do mesmo PNG | 96² | idem | 48 em 64² | 0,5× | 1× | 1,5× | ✓ (`image-rendering: pixelated`) |
| Arte do diário | `adventures/*.png` | 96² | `adv-pegadas` x 0–95 · y 0–95 | 48 em 48² | 0,5× | 1× | 1,5× | ✓ D-R3 (R6) |
| Skeleton | segmento vetor `primary-fill` | — | — | 56×40 | — | — | — | ✓ SIS-06 |

Nenhuma peça fora do múltiplo de 0,5× — a regra que a crítica de Rituais (X1) pediu para o README vale aqui
em todas as nove. O que a tabela acrescenta ao README é a **coluna da caixa de alfa**: é ela que mostra que a
aura usa os 128 px de largura do PNG (e por isso o vidro de 192 corta 64 deles) e que o sprite usa os 256 de
largura (e por isso a aura a 1× ficaria inteira atrás dele — o motivo declarado de D-P3 confere).

### 1.2 AA por token — recálculo (os 12 pares do README + os que ele não lista)

Hex do `index.css`: escuro `bg #08191A · surface #0F2A29 · surface-2 #163735 · ink #E9F5F2 · muted #9DBCB4 ·
primary-ink/fill #5FF3E0 · on-primary #04211F · gold-ink #EBBE84 · viewport-bg #071413 · viewport-ink #E9F5F2 ·
viewport-ring #C68642`; claro `bg #F1F7F5 · surface #FFFFFF · surface-2 #E9F2EF · ink #0E2422 · muted #4E6B66 ·
primary-ink/fill #0B6F68 · on-primary #FFFFFF · gold-ink #8A5A2B · viewport-bg #0E2422 · viewport-ring #B0722F`.

| Par | Onde | Escuro | Claro | README |
|---|---|---|---|---|
| `ink/bg` | nome Fredoka 24, descrição 14, "Pixel"/"Ascendant" do estado sem classe | 16,15 | 14,96 | confere |
| `muted/bg` | "Ascendant · Wanderer", `.sticky`, `.note`, `.tagd` | 8,83 | 5,35 | confere |
| `ink/surface` | títulos dos cards, nomes (habilidade, forma, célula, entrada), texto do diário 14 | 13,59 | 16,23 | confere |
| `muted/surface` | "power N", tipo · custo, descrições 12, "#NN · data", "???", frações, "dreams discovered" | 7,43 | 5,80 | confere |
| `primary-ink/surface` | `bolt` da básica | 11,12 | 6,02 | confere |
| `gold-ink/surface` | `auto_awesome` da especial | 8,84 | 5,87 | confere |
| `on-primary/primary-fill` | sub-aba ativa "Soulmon" | 12,38 | 6,02 | confere |
| `ink/surface` (`.btn.out`) | "Evolution"/"Stats" | 13,59 | 16,23 | confere |
| `primary-fill/surface-2` (não-texto) | o `.meter` do Dex | 9,43 | 5,28 | confere |
| `muted/surface-2` (não-texto) | fronteira do `.meter`, anel dos `outline` | 6,30 | 5,09 | confere |
| `viewport-ring/bg` (não-texto) | anéis de cobre (heroína, emblemas, skeleton) | 5,92 | 3,66 | confere |
| silhueta `color-mix(viewport-bg 58 %, viewport-ink)` / `viewport-bg` (não-texto) | cena não descoberta (`#667271` / `#6A7C79`) | 3,76 | 3,69 | confere — ver nota |
| **`gold-ink/bg`** | a `.tagd.p` "novo — código 15/09" (anotação) | 10,51 | 5,41 | não listado |
| **`primary-ink/bg`** | os `.fo` (anotação), o sublinhado da nav | 13,21 | 5,55 | não listado |
| **`viewport-bg/surface`** (não-texto) | a BORDA do slot 64² do Dex e do vidro 48² do diário (sem anel) sobre o card | **1,24** | 16,23 | **não listado** (R3) |
| `viewport-ink/viewport-bg` | (referência — nenhum texto dentro dos vidros neste canvas) | 16,82 | 14,53 | — |
| `line/surface` | divisor do card | 1,32 | 1,25 | decorativo ✓ |

**Nota sobre a silhueta (3,76 / 3,69 — a pergunta do briefing):** é não-texto, e WCAG 1.4.11 pede ≥ 3:1 só
para o gráfico "necessário para entender o conteúdo". Aqui a informação — "existe uma cena aqui e ela ainda
não veio" — está TAMBÉM no "???" 12 `muted` (7,43 / 5,80) e no `aria-label` "Dream not discovered yet"; a
forma da silhueta é pista, não o único portador. **≥ 3 basta**, e a tinta única em `color-mix` (sem alpha) é
a resposta certa ao `grayscale + brightness + opacity(.6)` do código — a mesma família de conserto da Home F1.
O que NÃO passaria é a silhueta a menos de 3, ou uma silhueta que fosse o único sinal (sem "???"). Confirmado.

Nenhum par de TEXTO abaixo de 4,5 e nenhum par de não-texto FUNCIONAL abaixo de 3 nos dois temas. O único
par abaixo de 3 é a borda do slot sem anel no escuro (1,24) — decorativa, ver R3.

### 1.3 Dobra a 390×844 (nav 774–843) — confirma o README, com duas correções

| Artboard | README | Medido | |
|---|---|---|---|
| `Main` | visor 129–321 · emblemas 333–381 · nome 421–450 · card 536–737 | vidro 129–321 (anel 125–325) · vidro dos emblemas 341–381 (anel 337–385) · `.namebl` 421–524 · card **536–737** · `.sticky` 749–768 | ✓ (a pergunta e as duas habilidades cabem sem rolar) |
| `FichaRolada` | card 184–290 | 184–290 | ✓ |
| `DexVazio` | Common 356 (399–482) · Rare 515 (558–641) · Legendary 674 | 356 (399–482) · 515 (558–642) · 674 (717–801, corta na nav) | ✓ |
| `DexParcial`/`DexCompleto` | **contagem 149–173** · barra 209–221 · Common 272 (301–435) · Rare 467 (496–630) · Legendary 662 | **contagem 181–201** (149–173 é o `h2` "Dream collection") · barra 209–221 · 272 (301–435) · 467 (496–630) · 662 (690–774) | ✓ salvo o número (X7) |
| `DiarioVazio` | card 152–270 | 152–270 | ✓ |
| `DiarioComEntradas` | 3 entradas 222–496 | 222–306 · 318–380 · 392–496 | ✓ |
| `PetCarregando` | 3º skeleton 385–506 | 121–241 · 253–373 · 385–506 | ✓ |

### 1.4 O que o browser pane mediu além do artboard (estados que o canvas não desenha)

- **Visor de emblemas com 8/8** (clonei 5 `<img>` no `.embs` do `Main`, inspeção só): vidro 53–337 (284);
  `gap: 4px; padding: 0 4px`; o 8º emblema em **309–341** → **4 px cortados pelo `overflow: hidden` e zero
  margem à direita** (o 1º tem 4 à esquerda). A conta: 8 × 32 + 7 × 4 + 8 = **292 > 284**. O código
  (`PetPage.tsx`, `screenStyle={{ gap: 2, padding: '0 2px' }}`, `<img width={16}>` em `scale={2}`) dá
  8 × 32 + 7 × 2 + 4 = 274 — cabe. O canvas "escalou" gap e padding (2 nativo → 4 CSS) e o `Viewport` não
  escala `screenStyle`.
- **Composição da heroína** (`.hero` 192² em 99,129): aura −32,−24 (256²) · sprite 32,40 (128²) · sigilo
  8,8 (48²); ordem no DOM aura → sp → sigil → glass. Centro do sprite e da aura em y = 104 (vidro: 96).
- **Silhueta**: `background-color: color(srgb .3997 .4490 .4418)` = `#667271`; `mask-image: url(…dream-*.png)`;
  `image-rendering: pixelated`; slot `#071413` sem borda sobre card `#0F2A29`.
- **Células do Dex** (`DexParcial`): as 4 células de cada linha têm a mesma altura (134), mas "#NN · data"
  começa a 103 nas de nome em 2 linhas e a **119** na de 3 linhas ("Sleeping under the rain", "Among floating
  lanterns") — X6.

---

## 2. Achados

### FATAL

Nenhum.

### FIXÁVEL (ordem de alavancagem)

**X1 — O 2º visor não comporta a coleção inteira (`Main`, `MainClaro`; D-P5).** Medido em §1.4: com os 8
emblemas abertos o 8º é cortado em 4 px e encosta na borda direita. O canvas desenha 3 de 8 e por isso nunca
vê o estado em que a peça falha — justamente o estado que o jogador dedicado alcança. É o único achado deste
canvas que quebra num estado REAL do produto. **Conserto (uma linha):** `.embs{gap:2px;padding:0 4px}`
(`--sm2-space-half` + `--sm2-space-1`, P1) → 8 × 32 + 7 × 2 + 8 = **278 ≤ 284**, 3 px de folga; ou exatamente
como o código (`gap 2; padding 0 2px` → 274). O README ganha a conta 8/8 em D-P5 — é ela que prova a decisão.
A caixa de alfa dos emblemas (x 4/5–58 de 64) dá ~2,5 CSS px de ar dentro de cada um; gap 2 lê como 7.

**X2 — Emblemas sem nome visível (`Main`, `MainClaro`; D-P5).** Cada emblema leva `alt` e `title`; o `title` só
aparece no hover, e toque não tem hover. Resultado medido: o leitor de tela recebe "Achievements: 3 of 8" +
"First complete day", "First evolution", "Ten dungeon runs"; o vidente recebe **três desenhos de 32 px sem
legenda e sem contagem** — inversão da regra de que o `aria-label` nunca carrega mais que a tela. Não é o
padrão do gênero: o Finch põe o nome sob o emblema, o Pokémon Sleep põe a contagem "N/M" sob a vitrine — a
vitrine sem nome é o padrão dos jogos de troféu que este produto recusa. **Conserto mínimo, sem estrutura:** a
contagem de posse como linha quieta `.s` 12 `muted` sob o visor — "Achievements · 3 of 8" (a MESMA frase do
`aria-label`; posse, E5/13.7; nunca "5 to go") — no lugar onde hoje está a `.tagd.p`, que continua ao lado.
**Achado para o `staff-frontend` (decisão do lead, porque é estrutura):** toque no visor → os rótulos dos
abertos (folha `ModalSheet` ou `toast`), como o `title` faria no desktop; o `role="img"` não muda.

**X3 — A aura a 2× perde 25 % da largura para as bordas do vidro (`Main`, `MainClaro`; D-P3).** A caixa de
alfa do `fx-fogo-aura.png` ocupa **x 0–127** (a largura inteira) × y 21–106. A 2× ela vai de −32 a 224 num
vidro de 192: **32 px de cada lado do anel ficam fora**, cortados em linha reta pela borda do vidro, nos dois
temas (visível nos renders: o anel nunca fecha). Vertical cabe (y 18–188). O README diz "recortada pelo vidro"
E "o anel de fogo envolve a criatura" — a segunda frase não é o que o vidro mostra: ele mostra um anel maior
que a janela. D-P3 acerta o motivo (a 1× a aura fica inteira atrás do sprite — confirmado pela caixa de alfa:
32–160 × 61–146, dentro do sprite 32–160 × 54–153) e acerta a escala inteira (2× / 4× / 6×); o que falta é
decidir o corte. **Duas saídas, escolha do lead:** (a) para a `squad-arte`: a aura em **96²** (o anel
redesenhado para 96 de largura), que a 2× dá **192 = o vidro** — o anel inteiro, na grade, e o README deixa de
dizer "nada novo para a squad-arte"; (b) manter 2× e o README declarar o corte com o número ("o anel é 33 %
mais largo que o vidro; as laterais ficam fora — FX, não moldura"), trocando "envolve" por "atravessa". (a) é a
que fecha a tese; (b) é honesta e custa zero. Nenhuma das duas reabre estrutura.

**X4 — Sub-aba ativa em placa `primary` cheia (`Main`, todos; D-P1) — para o lead.** SIS-02 reserva a placa
ciano cheia para a AÇÃO principal da tela (uma por tela). Aqui ela marca "onde estou": a ficha ganha um botão
com cara de CTA que não faz nada ao toque, e na sub-aba Evolution ele vai disputar com o "Evolve" de verdade.
O código faz o mesmo (`sm-btn`/`sm-btn-secondary`) e P3 pede "desenhadas como o código" — mas P3 é sobre
SEMÂNTICA (três `<button>`, sem `tablist`), não sobre a cor do ativo. O Sistema já tem o idioma de seleção:
o chip selecionado de Atividades (`primary-soft` + `primary-ink`, 7,69 / 5,21) e o sublinhado da nav.
**Conserto (uma linha, sem DOM):** `.subtabs .btn.pri{background:var(--sm2-primary-soft);color:var(--sm2-primary-ink);box-shadow:inset 0 0 0 1px var(--sm2-primary-ink)}`
— o ativo continua "só por classe", `aria-current` fica, e a placa cheia volta a significar ação. Se o lead
mantiver o `primary`, registrar a exceção em D-P1 ("a sub-aba é o único lugar em que a placa cheia é estado").

**X5 — A amostra usa o MESMO sprite para a forma atual e a anterior (`Main`, `MainClaro`, `FichaRolada`).**
A heroína é "Ascendant" (champion) com `igni-rookie.png`; a forma anterior é "Awakened" (rookie) com o mesmo
`igni-rookie.png`. A ficha que existe para responder "who has it been?" mostra a mesma criatura nos dois
vidros — e o canvas nunca testa a composição do visor com o bbox maior do champion (`igni-champion.png` existe:
x 0–255 × y 20–235 → 108 px de altura a 0,5×, contra 99 do rookie). **Conserto:** `igni-champion.png` na
heroína (Main/MainClaro) e o rookie na forma anterior; conferir que o sigilo (8–56) não toca a caixa de alfa
do champion (a 0,5× ela começa em y = 40 + 10 = 50 — 6 px de sobreposição no canto: mover o sprite para
`top: 32` (centrado) resolve e fecha R2 junto).

**X6 — "#NN · data" desalinhado entre células da mesma linha (`DexParcial`, `DexCompleto`; D-P7).** Nome em 2
linhas → metadado a 103; nome em 3 linhas → 119, na célula ao lado (medido em §1.4). A grade lê como
serrilhada nas duas fileiras de obtidos. **Conserto:** `.dcell{height:100%}` + `.dcell .dt{margin-top:auto}`
(o `grid` já estica a linha; a data desce para a base da célula em todas) — sem cortar nome (`line-clamp`
esconderia "Sleeping under the rain", que é o dado).

**X7 — README: três números e um par.** (a) "contagem 149–173" no Dex é o `h2`; a contagem (`.count`) mede
181–201; (b) "as três sub-abas medem 114×44" — 113,3 (o grid é (358 − 16) / 3); (c) a tabela AA não lista
`viewport-bg/surface` (1,24 no escuro) — o par do slot sem anel tem de estar lá como "decorativo, não
fronteira" (R3), senão a pergunta volta na próxima crítica; (d) "para a `squad-arte`: nada novo" fica
condicionado a X3 (a). Cosméticos, mas o README é o documento que o lead e o `staff-frontend` leem.

### RUÍDO (registro; nada a fazer nesta rodada)

**R1 — O sigilo cobre chamas.** `marcial.png` traz a própria placa (caixa de alfa 4–187: opaca), e a 48² no
canto 8,8 ela fica sobre a aura, que alcança y = 18 — as pontas de fogo do canto superior esquerdo somem atrás
da placa. D6 deu ao canvas o tamanho e a posição; a caixa de alfa da aura chega aos quatro cantos, então não há
canto "livre". Se X3 (a) entrar, a aura de 96² pode nascer com o canto reservado. Registro.

**R2 — Sprite e aura 8 px abaixo do centro.** `top: 40` (centrado seria 32): centro em y = 104 num vidro cujo
centro é 96. Provavelmente para dar ar ao sigilo; o README não declara. X5 fecha isto.

**R3 — Slot sem anel a 1,24:1 no escuro.** `viewport-bg #071413` sobre `surface #0F2A29`: a borda do slot 64² do
Dex e do vidro 48² do diário quase some no tema escuro (no claro, 16,23). É contêiner decorativo — a silhueta,
a cena ou a arte carregam a forma, e o `.glass` dá o brilho — SIS-07 aprovou o slot assim. Passa; entra na
tabela AA (X7 c).

**R4 — `auto_awesome` com dois sentidos na mesma tela.** No `Main` ele é a habilidade ESPECIAL (`gold-ink`,
FILL 1) e, 500 px abaixo, a aba Evolution ativa na nav (`primary-ink`, FILL 1). Cores diferentes, tamanhos
diferentes (24 / 32) — não confunde, mas é o mesmo glifo dizendo duas coisas. Para o lead do subset, se um dia
sobrar um glifo de "especial" (`star`, `flare`).

**R5 — Anotações dentro do telefone** (`.sticky` ▲▼, `.tagd` `sample`/`novo`, `.note` dos estados, a `.tagd.p`
sob o visor de emblemas): as do wireframe + uma, todas declaradas em D-P12. Passa (D-A9/D-R12).

**R6 — Arte de aventura full-bleed no vidro 48².** `adv-pegadas.png` tem caixa de alfa cheia (0–95) e é escura;
a 48 num vidro 48² a borda do vidro é a borda da arte, e a primeira entrada do diário lê como mancha escura
(a folha e a pedra, com fundo claro, leem bem). É a mesma peça da aventura do relatório (D-R3) — questão de
ARTE (margem interna nas cenas escuras), para a `squad-arte`, não de composição.

**R7 — Três skeletons idênticos** (`PetCarregando`): "LOADING" × 3 com o mesmo vidro — V4 adiou ao STATUS; o
canvas desenha o código (D11). Passa.

**R8 — `#NN` global intercala as sazonais.** O `DREAM_CATALOG` é 8 comuns + 6 raros + 4 lendários + 12 sazonais
(3 por estação, uma de cada raridade); com o índice GLOBAL a seção Common mostra `#01`–`#08`, `#19`, `#22`,
`#25`, `#28` — e o jogador não consegue inferir pela numeração qual silhueta é qual. É P2 da Fase 1 (decisão do
dono, 14/09) — não se reabre aqui; registro para quando as sazonais forem desenhadas.

---

## 3. Veredito por decisão de identidade

| # | Decisão | Veredito | Por quê |
|---|---|---|---|
| D-P1 | Sub-abas = três `.btn.sm` 44, ativa `primary` | **Confirmada com ressalva (X4, lead)** | 113,3×44 medidos, Rubik 14/500, sem `tablist`, `aria-current` — P3/B1 ✓. A cor do ativo é o único ponto: placa cheia = ação (SIS-02) |
| D-P2 | Heroína = sprite 256² a 128 num vidro 192² | **Confirmada** | 0,5× / 1× / 1,5× = P2 (a), a mesma escala da Home; "uma criatura, um tamanho" é o argumento certo contra o `inset 0` do código. Amostra a corrigir (X5); 8 px abaixo do centro (R2) |
| D-P3 | Aura a 2×, opacidade 1, recortada | **Confirmada como escala e como tinta; corte a decidir (X3)** | 2× / 4× / 6× inteiras ✓, opacidade 1 ✓ (Home F1), motivo do 2× confirmado pela caixa de alfa ✓. O corte de 32 px por lado não está declarado como corte — (a) arte 96² ou (b) declarar |
| D-P4 | Sigilo 192² a 48 dentro do visor, canto superior esquerdo | **Confirmada** | 0,25× / 0,5× / 0,75× = D-H7; dentro do vidro, à frente da aura — a tese. R1/R2 são registro |
| D-P5 | Emblemas no 2º visor 284×40, só abertos, contagem de posse | **Confirmada como exceção DECLARADA ao wireframe — condicionada a X1 e X2** | O código de 15/09 é posterior ao wireframe de 14/09 e é decisão do dono; o canvas marca `[novo — código 15/09]` no artboard, no rodapé e no README; a adição é `role="img"` sem foco (a ordem de foco 2–9 não muda) — é a forma certa de declarar. Mas como está desenhada falha a 8/8 (X1) e não tem nome visível (X2) |
| D-P6 | Ícone de habilidade = Material (`bolt`/`auto_awesome`); `el-*.png` fora da Ficha | **Confirmada** | É a tese do Visor no ponto em que ela mais custa (a "exceção de 27/ago" de `elementIconArt.ts`); o elemento já está dito pela aura dentro do vidro. Registrar no cabeçalho de `elementIconArt.ts` (README achado 5) ✓ |
| D-P7 | Célula = slot SIS-07; silhueta = `mask-image` + `color-mix` (3,76 / 3,69) | **Confirmada** | Não-texto, ≥ 3 basta (nota em §1.2): o "???" e o `aria-label` carregam o texto; tinta única sem alpha é o conserto certo ao `opacity(.6)` do código. X6 (alinhamento) e R3 (borda 1,24) são de uma linha / registro |
| D-P8 | Texto do diário em Rubik 14 `ink` | **Confirmada** | A voz da criatura é o conteúdo (02 §43); 13,59 / 16,23; data 12 `muted` `tabular` |
| D-P9 | Forma anterior = sprite a 64 num vidro 80² sem anel | **Confirmada** | 0,25× / 0,5× / 0,75× = D-H7 ("miniatura sempre em vidro"); 8 px de ar no slot. X5 troca só a amostra |
| D-P10 | Vazio da ficha sem vidro: `egg` 48 pelado + Fredoka 20 | **Confirmada** | Vidro apagado leria como "faltando" (PRINCÍPIOS §9); ícone nunca em box ✓; `h1` presente ✓ |
| D-P11 | Skeleton = card SIS-03 + vidro 56×40 + "LOADING" Rubik 12/500 fora do vidro, `role=status` × 3 | **Confirmada** | Home X6 aplicada (sem Silkscreen fora do vidro); três porque o código tem três `Suspense` (V4 → STATUS) |
| D-P12 | Anotações dentro do telefone = as do wireframe + a `.tagd.p` do visor novo | **Confirmada** | D-A9/D-R12; a única acrescida é a que declara a única adição de DOM |

---

## 4. Veredito final

**ENTRA COM CONSERTOS.** Zero fatal. A tese do Visor está inteira neste canvas — e no ponto mais difícil (o
ícone de elemento em pixel ficou fora da Ficha; a silhueta virou tinta; a aura, o sigilo, os emblemas e as
miniaturas estão todos dentro de um vidro, em múltiplos de 0,5×). A fidelidade é 9/9, o AA confere ao
centésimo nos dois temas, e nenhuma linha vermelha foi tocada (posse sem cobrança, palavra em vez de número,
descrição em vez de veredito).

**O conserto de maior alavancagem: X1** — é o único achado que quebra num estado REAL do produto (a coleção
completa), custa uma linha (`gap: 2px`) e a conta 8/8 entra no README como prova de D-P5. Junto com ele, X2
(a contagem de posse como linha quieta sob o visor) — o mesmo bloco, a mesma rodada.

**Para o `soulmon-design-lead` (DECISÕES §21):** X3 (aura 96² para a `squad-arte` × declarar o corte) e X4
(a placa cheia como estado × `primary-soft`) são as duas decisões; X5–X7 o `visual-designer` fecha sozinho.
Rodada 2 = as medições de X1 e de X3 coladas no README, sem voltar ao lead.

**Para o checkpoint do dono:** o recorte 200×200 que responde "dá para dizer que é o Soulmon?" é o visor da
heroína do `Main` (99,129 → 291,321) — com X5 aplicado, para que a criatura no recorte seja a que a ficha
diz que é.
