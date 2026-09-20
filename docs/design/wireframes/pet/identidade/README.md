# Canvas "Pet" — identidade (Fase 2, quinto canvas) · rodada 2 (X1–X7 da `CRITICA.md` aplicados, 20/09/2026)

> Dono: `soulmon-visual-designer` · 16/09/2026 · HANDOFF-IDENTIDADE §1, §4–§7 · base: canvas **Sistema** aprovado
> (`../../sistema/identidade/`, DECISÕES §18 — P1 espaço 4/8/12/16/24/32 + 2, **P2 = (a)** 256² a 128 CSS, **P3** nav 32),
> **Home** aprovada (§19: D-H1…D-H9 — D-H4 FX a 2×, D-H6 item em pixel dentro de célula vetor = slot SIS-07, D-H7 miniatura
> sempre em vidro; P4–P7) e **Atividades** aprovada (§20: D-A1…D-A9 — tinta nunca alpha, gerador reprova `opacity < 1`,
> legendas `.strip .cap` em Rubik 12). Tudo que as `CRITICA.md` da Home (F1/F2/X1–X12) e de Atividades (F1/X1–X9)
> reprovaram está reprovado aqui desde a rodada 1; o canvas Rituais (quarto) ainda não tem `CRITICA.md` — as D-R1…D-R12
> dele foram tomadas como base (D-R3: o pixel entra só em vidro, em tamanhos declarados).
> Estrutura: os 9 wireframes cinza aprovados de `../` (DECISÕES §8, P1–P4 / V1–V5 / S1–S5) e as linhas `PET-01`→`PET-08`
> do `INVENTARIO-WIREFRAMES.md` §1.4a (`PET-02` = `fora` por D4, desenhado como nota).
> **Cada artboard = o wireframe de mesmo nome com a identidade aplicada** — mesma hierarquia, mesmos estados, mesma copy
> (EN; PT no rodapé), mesma ordem de foco. Nada estrutural mudou; o que "pediu" para mudar está no rodapé como achado.
> Escuro em todos; claro só no `MainClaro` (decisão 3 do dono).

## Como abrir

O `<style>` de cada `.dc.html` é o bloco do `Sistema/Main.dc.html` **copiado** (tokens `--sm2-*`, átomos, rodapé) + o bloco
`HOME (composição)` (anel/vidro, nav, `.strip`, `.sticky`) + o bloco `ATIV (composição)` (`.dobra`, `.miniglass`) + um bloco
`PET (composição)` só de layout (sub-abas, o visor da heroína 192², o visor de emblemas 284×40, a ficha, o Dex em slots, o
diário, os três skeletons) — nenhum token novo, nenhum literal de cor. As mesmas podas da rodada 2 de Atividades e o mesmo
`guard_opacity()` no gerador (que aqui reprova também `opacity(` dentro de `filter`).
Imagens e fontes por caminho relativo ao repo. Servir a raiz do repo:
`npx -y serve -l 8770 D:/Soulmon/repo` → `http://localhost:8770/docs/design/wireframes/pet/identidade/Main.dc.html`.
Gerador (fora do repo, no scratchpad da sessão): `gen_pet.py` (importa `gen_ativ_head.py` e o bloco `STYLE_ATIV` de
`gen_ativ.py`) — os `.dc.html` são a fonte commitada.

## O que cada artboard prova

| Artboard | Id | Prova |
|---|---|---|
| `Main.dc.html` | PET-01 | A heroína num VISOR de verdade: anel de cobre (raio 20) em volta do vidro **192²** (`Viewport 64×64×3`); dentro, a **aura elemental** `fx-fogo-aura` 128² a **2×** (256 CSS — 33% mais larga que o vidro: 32 px de cada lado ficam fora, o anel ATRAVESSA o vidro; FX, não moldura — X3 b), o **sprite `igni-champion` 256² a 128 centrado** (`top 32`; P2 a, a mesma escala da Home; X5/R2) e o **sigilo de classe** 192² a **48** (0,25×) no canto superior esquerdo (D6); abaixo, o **2º visor 284×40** (`142×20×2`) com os 3 emblemas ABERTOS a 32 (0,5×), `gap` 2 + `padding` 4 (X1), e a linha quieta **"Achievements · 3 of 9"** 12 `muted` sob o visor (X2) — `[novo — código 15/09]`. Fora do vidro, aparelho: nome Fredoka 24 (`h1`), "Ascendant · Wanderer" Rubik 12 `muted` (duas PALAVRAS), descrição 14 centrada; sub-abas = três `.btn.sm` 44 (ativa em `primary-soft` + `primary-ink` + anel 1px — seleção, não ação, X4; as outras `outline`); card SIS-03 "What they can do" com `bolt` 24 FILL 0 `primary-ink` (básica) e `auto_awesome` 24 FILL 1 `gold-ink` (especial), nome 14/500 + "power 12" 12 `muted` `tabular`, tipo · custo, descrição. |
| `MainClaro.dc.html` | PET-01 claro | O mesmo DOM sob `[data-theme=light]` — o ciano `#0B6F68`, `muted` `#4E6B66`, `gold-ink` `#8A5A2B`, anel `#B0722F`; o vidro continua escuro (`viewport-bg #0E2422`): o pixel não muda de tema. |
| `FichaRolada.dc.html` | PET-01 | "Who they used to be": card SIS-03 em linha com a forma anterior num **vidro 80² sem anel** (`igni-rookie` 256² a 64, 0,25× — D-H7; a heroína é `igni-champion`: duas artes, X5), nome 14/500, "Awakened · Scout" 12 `muted`, a linha de caráter 12; o mais recente primeiro; sem data (V2). |
| `FichaEstados.dc.html` | PET-01 · 02 | Folha de estados: habilidades sem "power" (a linha não muda de altura quando ele chega) · nome sem classe · o vazio = card centrado com `egg` 48 `muted` pelado + Fredoka 20 + 14 + 12, **sem vidro vazio** · PET-02 (legado, D4) e a forma fora da lista como notas 12. |
| `DexVazio.dc.html` | PET-03 | "0 of 30 · dreams discovered" como texto quieto 12 `muted` (sem barra, sem frações — P1); três seções Fredoka 16; a grade de **slots** (SIS-07: mini-visor 64² sem anel, `viewport-bg`) com a **silhueta = máscara do PNG** preenchida numa tinta só (`color-mix` de `viewport-bg` 58% + `viewport-ink`, sem alpha) e "???" 12 `muted`; `info` 20 + a frase da coleção. |
| `DexParcial.dc.html` | PET-04 | "8 of 30" Rubik 16/500 `tabular` + "dreams discovered" 12; o `.meter` SIS-07 (12px, `surface-2` + fronteira `muted`, `primary-fill` a 27%); células obtidas com a cena 96² a 48 (0,5×) no slot, nome 12/500 `ink`, **"#NN · data"** 12 `muted` `tabular` alinhado à base da célula em toda a linha (`height:100%` + `margin-top:auto`, X6; P2, #NN = índice global no `DREAM_CATALOG`); Rare 3 + 1 silhueta; "Legendary 0 of 8" fica (guarda 1c). |
| `DexCompleto.dc.html` | PET-05 | "30 of 30", o medidor cheio, a frase como prêmio; sem troféu/badge/"100%". |
| `DiarioVazio.dc.html` | PET-06 | Card com título Fredoka 20, tese 12 `muted` e promessa 12 `muted`; nenhum slot, silhueta ou "0 of 24" — o diário não é Dex. |
| `DiarioComEntradas.dc.html` | PET-07 | Cada achado = linha com a arte 96² a 48 num **vidro 48² sem anel** (a mesma peça da aventura do relatório, D-R3), título 14/500 + data 12 `muted` `tabular` à direita, e o texto em 1ª pessoa em **Rubik 14 `ink`** (é o conteúdo — D-P8); o mais recente primeiro. |
| `PetCarregando.dc.html` | PET-08 | Três cards SIS-03 com o vidro 56×40 (anel a 12 de raio) e um segmento `primary-fill`, "LOADING" em Rubik 12/500 caixa alta FORA do vidro, a nota 12 do bloco; `role="status" aria-live="polite" aria-label="Loading"` em cada card (Home X6). |

**Medido no DOM (10 artboards, `getComputedStyle` + `getBoundingClientRect` em todos os nós do `.phone`, Chromium via
Playwright em `localhost:8770`, DPR 1):** **0** nós de texto < 12px dentro do `.phone` (o wireframe tinha 10/9px nas células
do Dex — subiram para 12) · **0** elementos vazando a largura de 390 · **0** alvos < 44 entre `button/checkbox/textbox/radio/
summary` (as três sub-abas medem 113,3×44 — (358 − 16) / 3) · **0** Silkscreen fora de `.screen` (não há Silkscreen nenhuma neste canvas — nenhum
texto dentro dos vidros) · **0** nós com `opacity` < 1, **0** com `opacity()` em `filter` e **0** com `text-shadow` · **0**
`<img>`, `background-image` ou `border-image` fora de `.screen` (as 12 cenas do Dex, os 3 emblemas, o sigilo, a aura, o sprite,
as 3 artes do diário e o sprite da forma anterior estão todos dentro de um `.screen`; a silhueta é `mask-image` dentro do slot) ·
**8 glifos usados, 8 no inventário de 102** (`auto_awesome, bolt, casino, egg, home, info, menu, storefront`) · alturas do
`canvas.json` = `scrollHeight` do `.ab`.
**Fidelidade:** a sequência dos marcadores de foco (`.fo`) é **idêntica nos 9 pares** (8 focos em cada tela: 2–4 sub-abas,
5–9 nav; 0 em `FichaEstados`); a sequência de `role` é idêntica em **8 de 9** — no `Main` a identidade tem UM `role="img"`
a mais: o visor de emblemas, que o código ganhou em 15/09 (decisão do dono), um dia DEPOIS do wireframe (14/09) — marcado
`[novo — código 15/09]` no artboard e no rodapé, e declarado aqui (nada mais muda de estrutura). A copy EN é a mesma; as
únicas diferenças de texto são (a) os nomes das células do Dex e a 3ª entrada do diário, que passam da copy de exemplo do
wireframe ("Chasing fireflies", "A warm stone" — não existem no catálogo) para o **catálogo real** (`DREAM_CATALOG` na
ordem, `ADVENTURE_CATALOG`), (b) as ligatures dos ícones, (c) "Viewport 64×64 · scale 3" (anotação do wireframe que virou
desenho). Script de diff: `cmp.py` (sequência de `role`, `aria-label`, `.fo`, textos).

## Dobra medida a 390×844 (F2 da Home aplicada)

A sub-aba é uma coluna que rola (ficha → Dex → diário); a pergunta é "o que da tela aparece antes da nav (774)?":

| Artboard | Wireframe aprovado (`../`) | Identidade | |
|---|---|---|---|
| `Main` | visor 119–315; card "What they can do" 404–576 (inteiro) | visor **129–321**; emblemas 341–381; "Achievements · 3 of 9" 393–434; nome 446–475; descrição até 549; card **561–763** (inteiro, 11px antes da nav) | a pergunta ("who is my creature today") e as duas habilidades cabem sem rolar ✓ |
| `FichaRolada` | card da forma 165–239 | card **184–290** | ✓ |
| `DexVazio` | Common 303 · Rare 434 · Legendary 553 (todas as três com células) | Common **356** (células 399–482) · Rare **515** (células 558–641) · Legendary **674** (título visível; as células 717–800 cortam na nav) | os slots 64 + nome 12 são mais altos que as células de 36 + 10px do wireframe; duas raridades inteiras antes da nav, a terceira anuncia-se |
| `DexParcial` · `DexCompleto` | contagem 151; barra 207; Common 264 · Rare 411 · Legendary 557 | título 149–173; contagem **181–201**; barra **209–221**; Common **272** (células 301–435) · Rare **467** (células 496–630) · Legendary **662** (título visível; células cortam) | idem ✓ |
| `DiarioVazio` | card curto | card **152–270** | ✓ |
| `DiarioComEntradas` | 3 entradas 202–370 | 3 entradas **222–496** (texto a 14 em vez de 12) | cabem as três ✓ |
| `PetCarregando` | 3º skeleton 373–493 | 3º skeleton **385–506** | ✓ |

`FichaEstados` é folha (`tall`), sem dobra a medir.

## Decisões de identidade tomadas neste canvas (canvas vence; a confirmar na crítica)

| # | Decisão | Motivo |
|---|---|---|
| D-P1 | **Sub-abas = três `.btn.sm` 44** em linha (`flex:1`), Rubik 14/500; **a ativa em `primary-soft` + `primary-ink` + anel 1px** (o idioma de SELEÇÃO do chip de Atividades — aba é "onde estou", não ação; a placa ciano cheia fica para o CTA), as outras `outline` — semântica como o código (três `<button>`, ativa só por classe, sem `tablist`; `aria-current="page"` como o wireframe); o código pinta a ativa como `sm-btn` cheio → achado 6 | DECISÕES §8 P3 (B1) é sobre semântica, não cor; X4 (decisão do lead); SIS-02; a dívida a11y fica no STATUS |
| D-P2 | **A heroína = sprite 256² a 128 CSS centrado num vidro 192²** (`Viewport 64×64×3`, anel de cobre raio 20) — a MESMA escala da Home (P2 a): uma criatura, um tamanho. O código estica o sprite ao vidro (192, 0,75×); três escalas da mesma arte (Home 0,5×, Ficha 0,75×, anterior 0,19×) leriam como três criaturas | DECISÕES §18 P2 (a); Home D-H4; HANDOFF §1 |
| D-P3 | **Aura elemental a 2×** (128² → 256 CSS), atrás do sprite, a **opacidade 1** — o PNG já traz o alfa; a 1× a aura fica inteira atrás do sprite (caixa de alfa 32–160 × 61–146, dentro do sprite); a 2× é a escala dos FX da Home (D-H4). **O corte é declarado (X3 b):** a caixa de alfa ocupa x 0–127, a largura inteira, então a 2× o anel mede 256 num vidro de 192 — **33% mais largo, 32 px de cada lado ficam fora**, cortados pela borda: o anel atravessa o vidro, não fecha dentro dele (vertical cabe, y 18–188). **Para a `squad-arte`: aura em 96²** (anel redesenhado para 96 de largura) — a 2× dá 192 = o vidro inteiro, na grade, com o canto superior esquerdo livre para o sigilo (R1) | D9; Home F1 / Atividades F1; X3 (escolha (b) do lead + pedido de arte) |
| D-P4 | **Sigilo de classe DENTRO do visor**: 192² a 48 CSS (0,25×, inteiro), canto superior esquerdo a 8px, à frente da aura — nunca solto no aparelho | D6 ("dentro do visor na Ficha — o canvas define tamanho/posição"); `sigilArt.ts` sem consumidor hoje |
| D-P5 | **Emblemas no 2º visor** 284×40 (`142×20×2`, anel a 12 de raio), emblemas 64² a 32 (0,5×), **`gap` 2 + `padding` 4** (X1: 8 × 32 + 7 × 2 + 8 = 278 ≤ 284), só os ABERTOS, `alt`/`title` = rótulo; **a contagem de posse repetida como linha quieta 12 `muted` sob o visor — "Achievements · 3 of 9"** (X2: a MESMA frase do `aria-label`; o vidente vê o que o leitor ouve), nunca "faltam N"; sem cadeado nem silhueta para os fechados. **A conta que a decisão precisa:** hoje são **9** conquistas (`habit-7/21/66` no lugar de `streak-7`/`milestone-21`) → 9 × 32 + 8 × 2 + 8 = **312 > 284**: com as nove abertas o `Viewport 142×20` não comporta a coleção — achado 4 (`158×20` = 316, ou emblemas a 1× = 16 CSS a partir de 9 abertos) | código de 15/09 (decisão do dono); E5/13.7 (posse); W6; X1/X2 |
| D-P6 | **Ícone de habilidade = APARELHO** (Material): básica `bolt` FILL 0 `primary-ink`, especial `auto_awesome` FILL 1 `gold-ink` — como o `SkillRow`. Os ícones de elemento em pixel (`elementos/el-*.png`) **não entram na Ficha**: o elemento já é dito dentro do vidro pela aura (D9); fora do vidro só vetor. Se um dia precisar de glifo fora do vidro, é `local_fire_department`/`water_drop`/`park`/`bolt` do subset | HANDOFF §1 (O Visor); `elementIconArt.ts` ("exceção de 27/ago" — o canvas desenha a tese e registra) |
| D-P7 | **Célula do Dex = slot SIS-07** (mini-visor 64² sem anel, `viewport-bg`, raio-sm) com a cena 96² a 48 (0,5×) DENTRO; nome e "#NN · data" fora, em vetor. **Silhueta = `mask-image` do PNG preenchida com `color-mix(viewport-bg 58%, viewport-ink)`** — 3,76 / 3,69 sobre o vidro, sem alpha, forma limpa, o mesmo cinza nos dois temas | Home D-H6 (nem mini-vidro com anel por célula, nem PNG solto); SIS-07; o código usa `grayscale + brightness(.35) + opacity(.6)` |
| D-P8 | **Texto do diário em Rubik 14 `ink`** (o código usa `sm2Hint` 12 `muted`): a voz da criatura é o CONTEÚDO do card, não metadado; título 14/500, data 12 `muted` `tabular`; a arte 96² a 48 num vidro 48² sem anel | 02 §43; D-R3 (a mesma peça da aventura do relatório) |
| D-P9 | **Forma anterior = sprite 256² a 64 CSS (0,25×) num vidro 80² sem anel** (o código: `<img 48>` solto no card); a amostra usa `igni-rookie` na anterior e `igni-champion` na heroína (X5) — o champion tem caixa de alfa y 20–235 (108 px a 0,5×) e, centrado (`top 32`), não toca o sigilo (8–56) | D-H7 (miniatura sempre em vidro); escala inteira |
| D-P10 | **O vazio da ficha sem vidro**: `egg` 48 `muted` pelado + `h1` Fredoka 20 no card — um vidro apagado leria como "faltando" | PRINCÍPIOS §9; ícone nunca em box |
| D-P11 | **Skeleton = card SIS-03 com o vidro 56×40 + "LOADING" em Rubik 12/500 caixa alta fora do vidro**, `role=status` em cada um dos três (como o código, D11) | Home achado 8 / X6; SIS-06 |
| D-P12 | **Anotações dentro do telefone** só as do wireframe (`.sticky`, `.tagd` `sample`/`novo`, as `.note` 12 dos estados) + a `.tagd.p` "novo — código 15/09" sob o visor de emblemas | D-A9; D-R12 |

## Contraste (WCAG 2.x, hex do `index.css` bloco ONDA 1)

| Par | Onde | Escuro | Claro |
|---|---|---|---|
| `ink` / `bg` | nome Fredoka 24, descrição 14, "Pixel"/"Ascendant" do estado sem classe | 16,15 | 14,96 |
| `muted` / `bg` | estágio · classe, `.sticky`, `.note` | 8,83 | 5,35 |
| `ink` / `surface` | títulos dos cards, nomes das habilidades, das formas, das células, das entradas; texto do diário | 13,59 | 16,23 |
| `muted` / `surface` | "power N", tipo · custo, descrições 12, "#NN · data", "???", frações, datas, "dreams discovered" | 7,43 | 5,80 |
| `primary-ink` / `surface` | `bolt` da básica | 11,12 | 6,02 |
| `gold-ink` / `surface` | `auto_awesome` da especial | 8,84 | 5,87 |
| `on-primary` / `primary-fill` | sub-aba ativa "Soulmon" | 12,38 | 6,02 |
| `ink` / `surface` (outline) | sub-abas "Evolution"/"Stats" (`.btn.out` = `surface` + anel `muted`) | 13,59 | 16,23 |
| `primary-fill` / `surface-2` (não-texto) | o `.meter` do Dex | 9,43 | 5,28 |
| `muted` / `surface-2` (não-texto) | fronteira do `.meter`, anel dos `outline` | 6,30 | 5,09 |
| `viewport-ring` / `bg` (não-texto) | os anéis de cobre (heroína, emblemas, skeleton) | 5,92 | 3,66 |
| silhueta `color-mix(viewport-bg 58%, viewport-ink)` / `viewport-bg` (não-texto) | a cena não descoberta no slot (`#667271` / `#6A7C79`) | 3,76 | 3,69 |
| `viewport-bg` / `surface` (decorativo, não fronteira) | a borda do slot 64² sem anel do Dex e dos vidros 80²/48² sobre o card — o slot é palco, não controle (R3); a informação está na arte/silhueta e no nome, não na borda | 1,24 | 5,71 |
| `primary-ink` / `primary-soft` (composto sobre `bg`) | sub-aba ativa (X4) | 7,69 | 5,21 |

Nenhum par abaixo de 4,5 (texto) ou 3 (não-texto) nos dois temas. **Nenhuma opacidade em nó nenhum do telefone** (medido
nos 10). O vidro é sempre escuro (`viewport-bg` `#071413`/`#0E2422`) — o pixel e a silhueta não mudam de tema.

## Achados (divergências com o código de hoje — para o `staff-frontend`)

1. **Sprite esticado ao vidro** (`spriteInScreen: inset 0` → 192 CSS, 0,75×) → 128 CSS centrado (D-P2); a aura idem.
2. **Aura a `opacity: 0.6`** (`data-aura`) → 1, a 2× (D-P3); nenhuma opacidade no aparelho (Home F1).
3. **Sigilo de classe**: `sigilArt.ts` sem consumidor; o lugar é o canto do visor a 48 (D-P4) — entra quando o Class-System for integrado (a classe não existe no save).
4. **Emblemas**: já no 2º visor no código (`gap 2; padding 0 2px` → 274 para 8); o canvas fixa 284×40, emblemas a 32, `gap` 2 + `padding` 4, anel a 12 de raio (D-P5). **Com 9 conquistas (`habit-7/21/66`, arquivos já renomeados) o `Viewport 142×20` não comporta as nove abertas (312 > 284)** — o lead decide: `158×20` (316) ou emblemas a 1× quando abertos ≥ 9. A contagem visível sob o visor (X2) é linha nova no `PetPage`; o toque no visor abrindo os rótulos (folha/toast) é estrutura → lead.
5. **Ícones de elemento em pixel** (`elementos/el-*.png`, `elementIconArt.ts` "exceção da Ficha") → não entram na Ficha (D-P6); o cabeçalho de `elementIconArt.ts` e o `PLANO-DESIGN` devem registrar que a exceção não vale para a Ficha do canvas.
6. **Sub-abas a 12px com `padding 10px 4px` e a ativa como `sm-btn` cheio** → `.btn.sm` 44 a 14 (cabe: 113,3px por célula) com a ativa em `primary-soft` + `primary-ink` (X4). A semântica (grupo, roving-tabindex) continua dívida no STATUS (c).
7. **Forma anterior com `<img 48>` solto** → vidro 80² com sprite a 64 (D-P9).
8. **Dex: barra a 0% e frações em zero** sempre renderizadas (STATUS a) → branch `collected === 0` (P1).
9. **Dex: `dreamDates` nunca exibido** (STATUS b) → "#NN · data" (P2), `collectedAt` `null` → sem data.
10. **Dex: silhueta por `grayscale + brightness + opacity(.6)`** → máscara + tinta derivada (D-P7); célula = slot SIS-07 (a arte 96² a 48 dentro do mini-visor), não `<img>` solto na célula.
11. **Dex: células a `minmax(84px, 1fr)`** com texto a 10/9px no wireframe → 4 colunas fixas em 390, texto 12 (piso).
12. **Diário: arte a 24 CSS solta no `li`** → 48 num vidro 48²; texto de `sm2Hint` 12 → 14 `ink` (D-P8).
13. **`ScreenSkeleton` com "LOADING" em Silkscreen fora do vidro** → Rubik 12/500 caixa alta (Home achado 8); três `Suspense` = três skeletons (V4, STATUS e).
14. **Copy de exemplo do wireframe fora do catálogo** ("Chasing fireflies", "Rain on the roof", "A warm stone") → nomes do `DREAM_CATALOG`/`ADVENTURE_CATALOG`; o `staff-frontend` não deve copiar a do wireframe.
15. **Nenhum glifo novo pedido**: `bolt`, `auto_awesome`, `egg`, `info` — todos no inventário de 102.

## Pendentes

- **Sem pendência do dono.** Nenhum token novo, nenhum glifo fora do inventário, nenhuma estrutura reaberta.
- Para o lead: o visor de emblemas com 9 conquistas (achado 4) e o toque no visor para ver os rótulos (X2, estrutura).
- Para a `squad-arte`: **aura elemental em 96²** para o vidro 192 (a 2× = o vidro inteiro; hoje a de 128² a 2× perde 32 px de cada lado — X3), com o canto superior esquerdo livre para o sigilo (R1). O sigilo 192² já é grade.
- Para o wireframe (`../`): as células do Dex a 10/9px e os nomes de exemplo fora do catálogo (achados 11 e 14) — registro, não reabertura.

## Fontes

`PetPage.tsx` · `ui/Viewport.tsx` · `DreamDex.tsx` · `AdventureDiary.tsx` · `ScreenSkeleton.tsx` · `App.tsx` (sub-abas, três
`Suspense`) · `utils/achievements.ts` · `utils/emblemArt.ts` · `utils/sigilArt.ts` · `utils/attackFxArt.ts` · `utils/elementIconArt.ts` ·
`utils/restWindow.ts` (`DREAM_CATALOG`) · `utils/adventure.ts` (`ADVENTURE_CATALOG`) · `utils/collectionDates.ts` · `tokens.md` §5
(subset de 102), §6.1 · DECISÕES §8, §18–§20 · HANDOFF §1, §4–§7 · Home `README.md`/`CRITICA.md` · Atividades
`README.md`/`CRITICA.md` · Rituais `README.md` (D-R3, D-R12) · Sistema `README.md`/`CRITICA.md` · 02 §14, §17, §41, §43, §45 ·
03 §1.3, §4.7 · PRINCÍPIOS §5, §6, §9.
