# CRÍTICA — canvas "Onboarding-funil" (identidade, Fase 2, sexto canvas) · `design-critic`

> Revisão BLOQUEANTE · 20/09/2026 · alvo: os 17 `.dc.html` + `MainClaro` + `canvas.json` + `README.md`
> desta pasta, servidos em `localhost:8772`.
> Método: (1) diff estrutural artboard a artboard contra `../<mesmo nome>.dc.html` — sequência de `role`
> **e de todo `aria-*`**, marcadores de foco (`.fo`), rótulos e o conjunto de palavras visíveis (script próprio,
> `cmp_aria.py`, não o `cmp.py` do designer); (2) `getComputedStyle` + `getBoundingClientRect` em todos os nós do
> `.phone` nos 18 artboards, no **browser pane** (Chromium, os 18 em iframes na mesma origem, `document.fonts.ready`,
> DPR 1): texto < 12px, Silkscreen fora do `.screen`, alvo < 44 entre `button/a/input/summary` e `role=button/
> checkbox/radio/textbox/switch/tab/link/menuitem`, vazamento de 390, `<img>`/`background-image` fora do vidro,
> `opacity < 1`, `opacity()` em `filter`, `text-shadow`, `scrollHeight` do `.ab` × `canvas.json`; (3) screenshot
> de cada par de artboards a 800×960 para o que a medida não vê (composição, órfãos, hierarquia); (4) hex
> recalculados do `src/index.css` (bloco ONDA 1, `:root` + `[data-theme=dark]`) com a fórmula WCAG 2.x — inclusive
> a splash sob `[data-theme=light]` (`viewport-bg` `#0E2422`), os `color-mix` da barra e da `primary-soft`, e os
> literais da chama; (5) os 6 glifos cruzados com o inventário de 102 (`tokens.md` §5); (6) escala real de cada
> PNG/SVG dentro e fora do vidro (`naturalWidth` × largura renderizada); (7) cruzado com Sistema/Home/Atividades/
> Rituais/Pet (DECISÕES §18–§22), DECISÕES §9 (O1–O7 / V1–V4 / S1–S5) **e §17 V1 → `REGISTRO` 13.19**,
> `HANDOFF-IDENTIDADE.md` §4–§7, `CLAUDE.md` › Oráculo / porquê do usuário, `REGISTRO-DE-DECISOES.md` §13
> (13.1, 13.19), e o código (`index.html` `#splash`, `IntroScreen.tsx`, `SoulmonOnboarding.tsx`,
> `GameTutorialFlow.tsx`, `utils/monetization.ts`, `public/favicon.svg`, `App.tsx` `.sm-skip-link`).
> Não editei nenhum artboard.

## 0. Resumo

| Classe | Qtd | O que pesa |
|---|---|---|
| **fatal** | 0 | — |
| **fixável** | 6 | **um estado impossível no tutorial** (campo pré-carregado com o `soulGoal` — O3 — e "Suggest tasks with AI" INERTE; no código o botão só desliga com campo vazio E nenhuma área) · **erro só por cor no e-mail malformado** (anel âmbar e nenhuma frase — o código já tem "Enter a valid email." em `role=alert`) · **a chama pixel fora do visor** (D-O4: 1 `<rect>` por pixel, `crispEdges`, escala inteira — é pixel art de formato vetorial; no claro os pixels claros somem a 1,10:1 e nenhum token a protege; o padrão já existe no kit: o `favicon.svg` põe a chama sobre `#071413` = `viewport-bg`) · **a intro num vidro 358×260 com anel** (D-O3: o alvo "tap anywhere" encolhe para o vidro; a sequência vira visor-cheio → janela → aparelho) · **README/rodapés com 5 afirmações que o DOM/código não confirmam** (o "1 = skip link" em 14 rodapés; 13,75 no claro; 358 no strip; o corvo "a 96"; e a **13.19** ausente) · o "·" órfão entre os dois links legais em 3 artboards |
| **ruído** | 8 | slot de tonalidade sem borda perceptível (1,04:1) · segmentos apagados da barra a 1,48:1 · anotações dentro do telefone · `Back` de `EscolherPersonagem` a 13px da dobra · `auto_awesome` do código ausente no botão da IA · o `role=img` a mais (confirmado) · `aria-busy` a mais (confirmado) · pular e voltar com o mesmo peso em `Atrapalha` |

**Veredito: ENTRA COM CONSERTOS** (nenhum fatal; X1, X2, X5 e X6 são obrigatórios antes do checkpoint do dono e
custam uma classe, um parágrafo e linhas de texto; X3 e X4 são decisão do lead — as duas derrubam em parte D-O4 e
D-O3, e as duas têm o conserto desenhado abaixo com o padrão já existente no repo). Nada estrutural reaberto pelo
designer; **a única coisa que pede o lead é a 13.19**, que não é deste canvas mas o atravessa (X5-d). Rodada 2 sem
voltar ao dono.

**O que está certo e não precisa de rodada:** estrutura **idêntica nos 17 pares** — mesma sequência de `role` e
de `aria-*` em 13 (as 4 diferenças são as declaradas no README e confirmadas abaixo, mais o `aria-busy` de ONB-07
que o README não declara — ver R7); os mesmos números de foco em 16 de 17 (a exceção é `EscolherPersonagem`, os 3
personagens a mais — D-O9); os mesmos rótulos, `aria-label` e `aria-pressed` (os 4 slots de tonalidade e os 8 chips
conservam `aria-pressed` e o `role=group` do wireframe — eu conferi porque o `cmp.py` do designer só compara
`role`); **0 nós < 12px**, **0 alvo < 44**, **0 vazamento** de 390, **0 Silkscreen fora do `.screen`** (32/14 na
splash, 20/14 na intro), **0 `opacity < 1`, 0 `opacity()` em `filter`, 0 `text-shadow`** em nó nenhum dos 18,
**0 `<img>`/`background-image` fora do `.screen`** (o corvo, os 6 sprites, a heroína e os 4 slots estão em vidro;
a chama do portão é SVG — mas ver X3), os **6 glifos** (`arrow_back, check, check_circle, download,
radio_button_unchecked, sync`) nos 102; `canvas.json` com alturas = `scrollHeight` dos 18 `.ab`; **os 17 pares de
contraste do README conferem** nos dois temas (a única correção é a da splash clara, 11,89 e não 13,75 — passa
igual); a dobra a 844 como o README mede (grade dos personagens 61–727, Back 783–831; vidro da heroína 61–261; os
dois inertes do tutorial 577–625 / 666–714); **toda arte no vidro em múltiplo inteiro ou ½/¼ declarado** (chama 4×,
sprites 0,5×, slots 0,25×, corvo 0,25× como ilustração); nenhum vermelho no funil (os 7 `role=alert` em âmbar, o
`role=status` em ciano); as duas perguntas puláveis com o pulo visível e sem culpa (quiet `muted`, 16px, alvo 48);
a bifurcação sem badge, sem dourado, sem preço riscado (13.1); o muro de idade como duas caixas vazias + primário
inerte + frase do que falta (nada vermelho); demo × pago sem cobrança em tela nenhuma; Termos/Privacidade como
alvos de 44 com `role=link` mantido, antes das caixas (ordem de foco 2–3 → 4–5).

## 1. Medições

### 1.1 Escala da arte (o que D-O1/D-O10/D-O11/D-O12 declaram × o que o DOM mede)

| Peça | Arte | Nativo | Renderizado | DPR 1 | Onde | Confere |
|---|---|---|---|---|---|---|
| Chama da splash | SVG 1 rect/px | 19×30 | **76×120** | 4× | dentro do `.screen.splash` | ✓ D-O1 |
| Chama do portão | SVG 1 rect/px | 19×30 | **38×60** | 2× | **fora de qualquer `.screen`** | escala ✓ · lugar ✗ → X3 |
| Corvo da intro | `mascot-raven.png` | 512² | 128 | 0,25× | `.introglass` (322×260 no strip) | ✓ (ilustração, `image-rendering:auto`) |
| 6 personagens | `lines/<id>-rookie.png` | 256² | 128 | 0,5× | `.charc .screen` 128² | ✓ P2 (a) |
| Heroína (cadastro, tutorial) | `kaelen-rookie.png` | 256² | 128 em 192² (offset 32/32) | 0,5× | `.screen.hero` | ✓ = Pet D-P2 |
| Slots de tonalidade | `kaelen-rookie.png` + `hue-rotate` | 256² | 64 em 64² | 0,25× | `.tint .screen` | ✓ D-H7; filtro só de matiz |
| Silkscreen | — | — | 32 / 20 / 14 | — | só dentro de `.screen` | ✓ piso 14 |

### 1.2 AA por token — recálculo (os pares do README + os que ele não lista)

Os 17 pares da tabela do README batem ao centésimo nos dois temas. O que falta lá:

| Par | Onde | Escuro | Claro | Veredito |
|---|---|---|---|---|
| `primary-ink` (visor `#5FF3E0`) / `viewport-bg` **claro** `#0E2422` | wordmark, "SOUL_LINK" no `MainClaro` | — | **11,89** (o README diz 13,75: usou o `#071413`) | passa; corrigir o número (X5-b) |
| `muted` (visor `#9DBCB4`) / `viewport-bg` claro | "LOADING DATA..." no claro | — | 7,95 | passa |
| `muted` (visor) / `surface` escuro `#0F2A29` | a faixa central do gradiente da splash (55%) | 7,43 | 7,43 | passa |
| segmento apagado `color-mix(primary-ink 15%, surface-2)` = `#21534F` / `surface-2` | barra da splash (não-texto, decorativo) | **1,48** | idem | R2 |
| `viewport-bg` / `bg` | borda dos 4 slots de tonalidade (não-texto) | **1,04** | 14,96 | R1 |
| `line` / `surface` · `line` / `bg` | filetes do "or" | 1,32 · 1,57 | 1,15 | decorativo, como Sistema F2 aceitou |
| chama `#7FFFFB` / `bg` claro | a marca no portão sob tema claro (não desenhado) | — | **1,10** | X3 |
| chama `#001314` / `bg` claro | idem — só o contorno sobrevive | — | 17,55 | X3 |

### 1.3 Dobra a 390×844 — confirma o README

Todas as 14 linhas da tabela do README conferem no DOM. Duas notas: `EscolherPersonagem` termina o Back em 831 (13px
de folga — R4); `TutorialErro` tem a `.dobra` a 844 e a espécime do vazio cruza (782–867), marcada.

### 1.4 O que o browser pane viu além da medida

- **`TutorialTarefa`**: campo com "get back to studying without beating myself up" (anel de foco ciano) e, 60px
  abaixo, "Suggest tasks with AI" em `surface-2` + `muted` — um primário morto ao lado de um campo cheio (X1).
- **`PortaoGoogle` / `PortaoEmail` / `PortaoEstados` (ONB-09)**: "Read the Terms of Use" termina em x=210, o "·"
  fica em 222–226 na mesma linha, "Read the Privacy Policy" cai na linha seguinte — o ponto separa nada (X6).
- **`PortaoEmail` "Sign in"**: `maria@exemplo` com anel âmbar 2px e, abaixo, só a anotação
  `aria-invalid="true" — e-mail malformado` em mono — nenhuma frase para a pessoa (X2).
- **`CadastroDemo`**: os 3 slots não selecionados são sprites flutuando no `bg` — a caixa 64² não tem borda visível
  (R1); o selecionado tem o anel interno ciano e por isso "existe".
- **`IntroEstados`**: o vidro com anel de cobre é bonito e é o problema — parece uma "janela de vídeo" no meio do
  aparelho, quando 400 ms antes a tela inteira era o visor (X4).

## 2. Achados

### FATAL

Nenhum.

### FIXÁVEL (ordem de alavancagem)

**X1 — `TutorialTarefa` (ONB-40): "Suggest tasks with AI" inerte com o objetivo pré-carregado é um estado que o
código não produz.** `GameTutorialFlow.tsx`: `disabled={loading || (!goalText.trim() && selectedCats.size === 0)}`
— com o `soulGoal` no campo (O3, `[novo — estrutura]` no próprio artboard) o botão está VIVO. O wireframe de 14/09
desenhou os dois inertes com o campo vazio (antes de O3 entrar); a rodada 2 pré-carregou o campo e esqueceu o botão;
a identidade replicou fielmente uma contradição. Para quem lê o artboard, é um primário morto sem explicação ao lado
de um campo cheio — e para o `staff-frontend` é uma instrução errada. **Conserto:** "Suggest tasks with AI" =
`btn pri full` vivo (foco 12), "Select at least 1 task" continua inerte (nada selecionado); nota no rodapé. **Achado
para o lead (estrutura, não desenhar agora):** com `goalText` preenchido o código também renderiza **o próprio
objetivo como a primeira linha selecionável** (`GameTutorialFlow.tsx`, linha ~371, `customKey`) — nem o wireframe
nem o canvas o desenham; é a peça que faz "Select at least 1 task" ser cumprível sem IA.

**X2 — `PortaoEmail` (ONB-12, espécime "Sign in"): e-mail malformado indicado só pelo anel âmbar.** WCAG 1.4.1 (uso
de cor) + 3.3.1 (erro identificado em texto): a pessoa vê o campo mudar de cor e não sabe o quê. O código já
resolve: `isValidEmail` falso → `setAuthErro('email-invalido')` → "Enter a valid email." / "Digite um e-mail
válido." em `role=alert`. **Conserto:** o mesmo `.alert` âmbar de ONB-08 sob o campo, com essa copy (não é copy
nova — é a do código); `aria-invalid` fica. Herdado do wireframe → linha para o cartógrafo (`03 §2.3` não cita o
`authErro` do e-mail).

**X3 — `PortaoDuasPortas` (ONB-06), D-O4: a chama fora do visor é pixel art, não vetor.** O SVG é um `<rect>` por
pixel com `shape-rendering:crispEdges`, e o próprio D-O1 a trata como pixel ("é vetor, mas é pixel desenhado:
escala inteira"). A tese do Visor é sobre a LINGUAGEM (pixel dentro, limpo fora — HANDOFF §1), não sobre o formato
do arquivo; chamar a chama de "vetor" porque é `.svg` é a exceção que não se declara. E custa no tema claro, que a
decisão 3 não desenha: os pixels claros da chama (`#7FFFFB`, `#06FBFB`) somem sobre `bg` claro (**1,10:1**), sobra
o contorno escuro (17,5:1) — a marca vira uma silhueta serrilhada, e nenhum token a protege porque as cores são
literais da marca (`index.html`: "cores da MARCA, não de token"). **O padrão já está no kit:** `public/favicon.svg`
desenha a chama sobre `#071413` — o `viewport-bg`. A marca é, por construção, "a chama no visor". **Conserto:** a
chama 2× (38×60) dentro de um slot SIS-07 (`viewport-bg`, sem anel, ~64×80 — o mesmo átomo dos slots de
tonalidade), wordmark Fredoka 16 fora; nos dois temas o fundo da chama é o mesmo, como no favicon. Alternativa
(decisão do lead): declarar a marca como exceção nominal à tese, como P4 fez com a textura da Home — mas aí o
`MainClaro` do portão precisa ser desenhado para provar o claro. Recomendo o slot: resolve o claro sem exceção nova.

**X4 — `IntroEstados` (ONB-03/04), D-O3: a intro num vidro 358×260 com anel no meio do aparelho.** Três custos:
(a) o alvo "tap anywhere = skip" (cap do wireframe; `IntroScreen.tsx` raiz com `onClick`) encolhe para o vidro — a
área que o wireframe aprovou como alvo é a tela inteira; (b) a sequência vira visor-cheio (splash) → janela com
anel (intro) → aparelho (portão): o aparelho "liga" em tela cheia, encolhe, e só depois mostra a interface; (c) o
código exibe o vídeo em `object-fit: cover` de tela cheia — num 358×260 (1,38:1) o filme perde as bordas ou ganha
tarja. **Conserto:** a intro é a continuação do boot — o MESMO `.screen.splash` full-bleed (sem anel, paleta do
visor por D-O16) com o vídeo dentro (`cover`), "TAP TO SKIP" Silkscreen 14 `muted` no pé, o vidro inteiro como
`role=button` "Skip intro"; ONB-04 = o mesmo frame com o corvo 128 + "SOULMON" 20. Os literais (`#0b0d16`, o
gradiente Tailwind, a placa `borderRadius: 28` de 96² em volta do corvo — um ícone em box) saem igual. Decisão do
lead; recomendo full-bleed. Nota: no strip o vidro mede **322×260** (o README diz 358 — é a projeção na tela real).

**X5 — README e rodapés: cinco afirmações que o DOM ou o código não confirmam.**
(a) **"W10: ordem de foco numerada (1 = skip link, oculto)"** em 14 rodapés — falso no funil: `App.tsx` retorna
`<SoulmonOnboarding>` antes do bloco que monta `.sm-skip-link` (`if (!hasCompletedOnboarding)` vs `<a href="#conteudo">`),
e DECISÕES §17 R5 já disse "vale também para o funil (§9)". A numeração a partir de 2 fica (fidelidade ao wireframe);
a frase sai e o rodapé diz "nenhum skip link no funil — o App só o monta após `hasCompletedOnboarding`".
(b) Contraste da splash no claro: **11,89** sobre `#0E2422`, não 13,75 (§1.2).
(c) `IntroEstados`: o vidro mede 322×260 no strip; 358 é o que seria na tela — escrever os dois.
(d) **`REGISTRO` 13.19 (15/09/2026) não aparece no canvas** — o funil ganhou um REVEAL DEMO (o quiz de 6 para todos;
a oferta 13.1 mora no reveal demo; a criatura própria só pagando). O README cita só V1 (14/09, "a ordem de hoje
fica") e o `Escolha` (ONB-16) desenha a bifurcação grátis × completo ANTES do ritual, com "Get the full game" como
segunda porta — sob a 13.19 a oferta mora depois do reveal demo, e o que ONB-16 pergunta muda de "como quer
começar?" para algo que o lead ainda não decidiu (a §17 V1 reabriu a Fase 1 "só num artboard novo no canvas do
Oráculo", sem dizer o que acontece com ONB-16/20/34). Não é o designer que decide; mas o canvas precisa dizer que
sabe: rodapé de `Escolha` e README com "**pendente do lead**: posição de ONB-16, ONB-20 e ONB-34 sob a 13.19" —
senão o checkpoint do dono aprova uma bifurcação que a decisão dele de 15/09 já moveu.
(e) `IntroEstados` rodapé: "corvo solto a 96 CSS" — no código a PLACA é 96² (`borderRadius: 28`) e o `<img>` é 64;
o achado certo é "ícone em box de 96 com o corvo a 64" (regra do dono: ícone nunca em box).

**X6 — `PortaoGoogle`, `PortaoEmail`, `PortaoEstados` (ONB-09): o "·" entre os dois links legais fica órfão.**
Os dois ghost 44 não cabem lado a lado (193 + 4 + 201 > 358) e o segundo quebra de linha; o ponto sobra no fim da
primeira (medido: 222–226). Empilhados, os dois já são lista — tirar o "·" (e o `gap: 0 8px` vira `gap: 0`).

### RUÍDO (registro; nada a fazer nesta rodada)

- **R1 — Slots de tonalidade sem borda perceptível no escuro**: `viewport-bg` sobre `bg` = 1,04:1; os três não
  selecionados são sprites soltos, só o selecionado tem forma (anel interno ciano). Mesmo caso do Pet (slot a
  1,24:1, ruído lá). Se o lead quiser: 1px `muted` (6,3:1) nos quatro, o anel das caixas SIS-03 — um visor tem
  borda, não é "ícone em box".
- **R2 — Segmentos apagados da barra da splash** a 1,48:1 sobre `surface-2`: decorativo, frame parado de uma
  animação; como o código (D-O2 só trocou opacidade por tinta). Registrar.
- **R3 — Anotações dentro do telefone** (`.note`, `.tagd`) em 14 artboards, como D-P12 do Pet; o `SplashWebView`
  tem um parágrafo em mono dentro do `role=alert`. Convenção da Fase 1; fica.
- **R4 — `EscolherPersonagem`**: o Back termina em 831 (13px de folga a 844); em 360×740 a 3ª linha e o Back caem
  abaixo — rola, e a tela é uma lista; ok.
- **R5 — "Suggest tasks with AI"** no código leva `auto_awesome` 20 (`GameTutorialFlow.tsx`); o canvas tira o glifo
  — está no inventário dos 102 (Pet o usa). Decisão de identidade; registrar no rodapé como escolha, não omissão.
- **R6 — O `role="img"` a mais** no vidro da heroína (`CadastroDemo`, `TutorialConceito`, "Pyraka, in tint 1"):
  **confirmo** — a criatura é conteúdo (O1), o wireframe tinha uma caixa "PET" sem role; mesmo caso D-P5.
- **R7 — `aria-busy="true"` em ONB-07** a mais que o wireframe (que só o cita na legenda): casa com o código
  (`aria-busy` no `sm2Button`); declarar no README como a 5ª diferença de ARIA, porque o `cmp.py` não a vê.
- **R8 — `Atrapalha`**: "I’d rather not say right now" (pular, 4) e "Back" (voltar, 5) com o mesmo `quiet` — dois
  verbos, um idioma. Sistema X1 fixou `quiet` = "Not now"/"Skip"; o Back quiet é o mesmo dos passos do ritual (O4).
  Aceitável; registrar.

## 3. Veredito por decisão de identidade

| # | Decisão | Veredito | Onde conferi |
|---|---|---|---|
| D-O1 | chama da splash a 4× inteiro (76×120) | **confirmo** | DOM: `.flame` 76×120, `viewBox 0 0 19 30`, `crispEdges` |
| D-O2 | nenhuma opacidade/sombra na splash; apagado em tinta | **confirmo** | 0 `opacity < 1`, 0 `text-shadow`, 0 `drop-shadow` nos 18; `color-mix` 15% medido (R2) |
| D-O3 | intro e erro da intro num vidro 358×260 com anel | **derrubo em parte** → X4: vidro sim (os literais saem, a placa do corvo sai), mas o vidro é o MESMO da splash, em tela cheia — o alvo é a tela, a sequência não encolhe | screenshot; `IntroScreen.tsx` (`object-fit: cover`, raiz `onClick`); cap do wireframe "em tela cheia" |
| D-O4 | marca fora do vidro = chama vetorial + wordmark; corvo só no vidro | **corvo só no vidro: confirmo** (a placa 96² do código é ícone em box) · **chama fora do vidro: derrubo** → X3 (pixel art em `.svg`; 1,10:1 no claro; o favicon já a põe sobre `viewport-bg`) | §1.2; `favicon.svg`; `index.html` "cores da MARCA" |
| D-O5 | segunda porta/escolha = `outline` | **confirmo** | "New User" e "Get the full game" em `btn out`; peso igual; sem dourado (13.1) |
| D-O6 | Termos/Privacidade = ghost 44 com `role=link` | **confirmo** (X6 é o separador, não a decisão) | 193×44 e 201×44; `role=link` nos 3 artboards; antes das caixas |
| D-O7 | todo `role=alert` em âmbar; `role=status` em ciano | **confirmo** | 7 alertas com filete `gold-ink` 3px + `ink` 14; 1 status `primary-ink`; 0 `danger-*` no funil |
| D-O8 | "I’d rather not say" e "Back" = quiet | **confirmo** (R8) | Sistema X1: quiet = Not now/Skip; alvo 48; `muted` 8,83 |
| D-O9 | os 6 personagens (o wireframe tinha 3) | **confirmo** — D11, `PREMADE_CHARACTERS` = 6 (kaelen, orrin, thalindra, igni, nautilu, astrase), marcado `[novo — código]` | `monetization.ts`; 6 `aria-label` "‹nome› — ‹bio›" |
| D-O10 | card SIS-03 com vidro 128² em grade 2×3 | **confirmo** | 6 × 256² a 128 (0,5×); grade 61–727; Back 783–831 (R4) |
| D-O11 | heroína em vidro 192² (sprite 128) | **confirmo** = Pet D-P2 | offset 32/32, `role=img` (R6) |
| D-O12 | tonalidades = slots 64² com sprite 64 + `hue-rotate`; seleção = anel interno 2px | **confirmo** (R1) | 4 × 64², `aria-pressed`, `role=group`; único filtro = `hue-rotate` |
| D-O13 | `TutorialConceito` mostra a criatura, não `pets` 48 | **confirmo** | vidro 262–462; `pets` fora do subset (Home P6) |
| D-O14 | chips e sugestões em vetor (SIS-03) | **confirmo** | 8 chips 44 `aria-pressed`; 4 cards 44 com `check_circle`/`radio_button_unchecked` |
| D-O15 | sugestão além do teto inerte por FORMA | **confirmo** | `outline: 1px dashed muted` + `muted` + `aria-disabled`; 0 opacidade |
| D-O16 | dentro do vidro a paleta é a do visor, nos dois temas | **confirmo** — com um pedido de implementação: o canvas faz isso com `.screen.splash/.introglass { --sm2-primary-ink: … }`; no app o `#splash` é cópia por necessidade (pré-bundle), mas a intro e qualquer vidro com texto rodam DEPOIS do bundle — a redefinição tem que ser **um** escopo no `index.css` (ex.: `.sm2-visor { --sm2-primary-ink; --sm2-muted; --sm2-surface; --sm2-surface-2; --sm2-line }`), nunca cópia por componente (footgun 9), e `tokens.contrast.test.ts` deve cobrir o par visor × `viewport-bg` claro (11,89) | `MainClaro` render idêntico; §1.2 |

### As 4 exceções de fidelidade declaradas no README

| Exceção | Veredito |
|---|---|
| (a) `role="link"` dos Termos/Privacidade vira `.btn.gho` mantendo `role="link"` | **aceito** — é o mesmo role; só o átomo muda (W10) |
| (b) `role="img"` a mais no vidro da heroína (`CadastroDemo`, `TutorialConceito`) | **aceito** — conteúdo, não decoração (R6) |
| (c) `EscolherPersonagem` com 7 focos em vez de 4 | **aceito** — D11 (código > wireframe); registro para o wireframe, não reabertura |
| (d) textos: ligatures, anotações que viraram desenho, as 2 linhas de Silkscreen da splash, "TAP TO SKIP", 3 nomes + 3 bios | **aceito** — conferido palavra a palavra (`cmp_aria.py`): nenhuma copy de UI mudou; "TAP TO SKIP" é identidade dentro do alvo (não muda estrutura) |
| **(e) não declarada:** `aria-busy` em ONB-07 | **aceito**, mas declarar (R7) |

## 4. Veredito final

**ENTRA COM CONSERTOS.** O canvas prova a tese do Visor onde ela mais importa — a splash É o visor ligando, a
paleta do visor não muda de tema, a criatura nasce em vidro no caminho grátis (O1) — e chega limpo em tudo que se
mede: 0 texto < 12, 0 alvo < 44, 0 opacidade, 0 sombra, 0 bitmap fora do vidro, 17/17 estruturas idênticas, AA
em todos os pares nos dois temas. As duas decisões que "mais interpretam" (o README mesmo as nomeia) são as duas
que derrubo em parte, e as duas pelo mesmo motivo: **a fronteira do visor é a linguagem, não o arquivo** — a
chama pixel não vira vetor por ser `.svg` (X3), e a intro não deixa de ser o visor por ganhar anel (X4). Os dois
consertos usam peças que o repo já tem (o favicon; o `.screen.splash`).

Obrigatórios antes do checkpoint: **X1** (o estado impossível do tutorial — é a única coisa que enganaria o
`staff-frontend`), **X2** (erro só por cor — a copy já existe), **X5** (o "skip link" falso em 14 rodapés e a 13.19
ausente) e **X6** (o ponto órfão). **X3 e X4 são do lead** — recomendo os dois consertos desenhados. Ruído R1–R8
fica registrado.

**A alavanca única:** X5-d. Sem uma linha dizendo que a 13.19 existe, o dono aprova no checkpoint uma bifurcação
(ONB-16) que a decisão dele de 15/09 já deslocou — e ninguém saberá se o canvas está certo ou velho.
