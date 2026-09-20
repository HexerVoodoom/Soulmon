# Canvas "Onboarding-funil" — identidade (Fase 2, sexto canvas) · rodada 2

> Dono: `soulmon-visual-designer` · 16/09/2026, rodada 2 em 20/09/2026 (após `CRITICA.md`: ENTRA COM CONSERTOS, X1–X6 aplicados, R1–R8 registrados) · HANDOFF-IDENTIDADE §1, §4–§7 · base: canvas **Sistema** aprovado
> (`../../sistema/identidade/`, DECISÕES §18 — P1 espaço 4/8/12/16/24/32 + 2, **P2 = (a)** 256² a 128 CSS, **P3** nav 32),
> **Home** (§19: D-H1…D-H9, P4–P7), **Atividades** (§20: D-A1…D-A9 — tinta nunca alpha, o gerador reprova `opacity < 1`)
> e as `CRITICA.md` de Sistema, Home, Atividades e Rituais (escala INTEIRA de toda arte no vidro — Rituais X1;
> confete/decoração fora do título — X2; nada por opacidade — Home F1; `role` só onde o wireframe tem; legendas Rubik 12).
> Estrutura: os 17 wireframes cinza aprovados de `../` (DECISÕES §9, O1–O7 / V1–V4 / S1–S5) e as linhas `ONB-*` do
> `INVENTARIO-WIREFRAMES.md` §1.3 (`ONB-13` = `fora` por D4, desenhado como nota).
> **Cada artboard = o wireframe de mesmo nome com a identidade aplicada** — mesma hierarquia, mesmos estados, mesma copy
> (EN; PT no rodapé), mesma ordem de foco. Nada estrutural mudou; o que "pediu" para mudar está no rodapé como achado.
> Escuro em todos; claro só no `MainClaro` (decisão 3 do dono).

## Como abrir

O `<style>` de cada `.dc.html` é o bloco do `Sistema/Main.dc.html` **copiado** (tokens `--sm2-*`, átomos, rodapé) + o bloco
`HOME (composição)` (anel/vidro, `.strip`) + o bloco `ATIV (composição)` (`.dobra`) + um bloco `ONB (composição)` só de layout
(a splash como visor de tela cheia, a marca vetorial, o vidro da intro, o bloco legal, os campos, a grade 2×3 de personagens, a
heroína no visor 192, os slots de tonalidade, os pontinhos do tutorial, chips e sugestões) — nenhum token novo, nenhum literal
de cor fora do vidro. As mesmas podas da rodada 2 de Atividades e o mesmo `guard()` no gerador (reprova `opacity < 1` **e**
`text-shadow` dentro do telefone/CSS).
Imagens e fontes por caminho relativo ao repo. Servir a raiz do repo:
`npx -y serve -l 8772 D:/Soulmon/repo` → `http://localhost:8772/docs/design/wireframes/onboarding-funil/identidade/Main.dc.html`.
Gerador (fora do repo, no scratchpad da sessão): `gen_onb.py` (importa `gen_ativ_head.py` e o bloco `STYLE_ATIV` de
`gen_ativ.py`; lê a chama de `index.html`) — os `.dc.html` são a fonte commitada. Medição: `measure_onb.mjs`; diff: `cmp.py`.

## O que cada artboard prova

| Artboard | Id | Prova |
|---|---|---|
| `Main.dc.html` | ONB-01 | **A splash É o visor do aparelho ligando** (`index.html #splash`, 15/09): um `.screen` de tela cheia (390×844, `viewport-bg` + grade/gradiente por `color-mix`), a **chama da marca** (SVG, um `<rect>` por pixel, 19×30 a **4×** = 76×120), o wordmark **"SOULMON" em Silkscreen 32** (dentro do vidro — o único lugar onde a bitmap pode ser título), "LOADING DATA..." Silkscreen 14 `muted`, a **barra de 8 segmentos** 220×16 (`surface-2` + `line`; 3 acesos em `primary-ink`, os apagados em TINTA `color-mix(primary-ink 15%, surface-2)`), "SOUL_LINK ESTABLISHED" 14 `primary-ink`, os três cristais. `aria-hidden`; nenhum alvo. |
| `MainClaro.dc.html` | ONB-01 claro | O mesmo DOM sob `[data-theme=light]` e o **render é idêntico**: dentro do vidro a paleta é a do visor e não muda de tema (o `#splash` copia o bloco escuro de propósito; `tokens.contrast.test.ts` trava o vidro escuro). O canvas declara isso em CSS (`.screen.splash/.introglass` redefinem `primary-ink/muted/surface/surface-2/line` com os hex do escuro) — sem isso o ciano do claro daria **2,7:1** sobre o vidro. |
| `SplashWebView.dc.html` | ONB-02 | A única tela terminal: `download` 48 `gold-ink` pelado (SIS-06: erro em âmbar), Fredoka 20, Rubik 14 `ink`, "How to fix it" 14/500, centrado no aparelho (`bg`), sem vidro (o WebView que não abre o app não liga o visor), sem botão; `role=alert`. |
| `IntroEstados.dc.html` | ONB-03 · 04 | **A intro é a continuação do boot** (X4): o MESMO `.screen.splash` da splash, full-bleed (sem anel; no strip 322×260, na tela real 390 × a altura inteira), paleta do visor, com o vídeo dentro em `cover` — aqui o quadro é o corvo-mascote (512², ilustração, a **128** = 0,25×, `image-rendering:auto`) + "SOULMON" Silkscreen 20; a superfície inteira é o alvo **"Skip intro"** (foco 2) e diz "TAP TO SKIP" em Silkscreen 14 no pé. ONB-04 = o mesmo quadro sem alvo (sai sozinho). |
| `PortaoDuasPortas.dc.html` | ONB-06 | A marca = **a chama do kit num slot SIS-07** (X3: pixel art em `.svg` é pixel — vive no visor, como o `favicon.svg` a põe sobre `#071413`): slot 64×80 `viewport-bg` sem anel (`role=img` "Soulmon"), a chama a 2× (38×60) dentro, wordmark Fredoka 16 fora — o mesmo fundo nos dois temas; Fredoka 20; o porquê em 12 `muted`; "Continue with Google" **primário**, "or" entre filetes `line`, "New User" **outline** (uma porta, não um link). |
| `PortaoGoogle.dc.html` | ONB-10 · 11 | Os dois links como **ghost 44** em `primary-ink` (`role=link`, alvo real), as duas caixas SIS-03 (24, anel 2px `muted`, alvo 44) nascidas VAZIAS, o primário inerte (`surface-2` + `muted`, `aria-disabled`, fora do Tab) + a frase do que falta 12 `muted` centrada, "Back" quiet; ONB-11 = `role=alert` com **filete 3px `gold-ink`** e texto 14 `ink`. |
| `PortaoEmail.dc.html` | ONB-12 | Um formulário, as duas direções: campos SIS-03 (44, `surface-2` + anel `muted`, rótulo 12/500), o bloco legal, o primário inerte, o link de inversão ghost, "Back" quiet; em "Sign in": e-mail malformado com anel âmbar (`.inp.warn`) + `aria-invalid` **+ "Enter a valid email." em `role=alert` âmbar** (X2: erro em texto, copy do código); o reset enviado como `role=status` com filete `primary-ink` (boa notícia, não alerta). |
| `PortaoEstados.dc.html` | ONB-05 · 07 · 08 · 09 · 13 | Ocupado = primário inerte com `sync` 24 no lugar do texto e `aria-label` FIXO; erro = alerta âmbar; sem-Firebase = "Before we start" + o bloco legal com as duas caixas MARCADAS (`primary-fill` + `check` 18 `on-primary`) + "Continue" vivo; carregando e rascunho como notas 12. |
| `Objetivo.dc.html` | ONB-14 | Fredoka 20, a justificativa do campo `[novo]` em 12 `muted` (O2), o campo multilinha SIS-03 (96), "Continue" primário, o pulo como **quiet** (`muted`, sem borda — pular é legítimo e não compete com o primário). |
| `Atrapalha.dc.html` | ONB-15 | O eco "Noted. Your Soulmon will remember." em 12 `primary-ink` com `check_circle` 20 FILL 1 (a única luz forte da tela além do primário); "Back" `[novo]` quiet (O4). |
| `Escolha.dc.html` | ONB-16 | A bifurcação sem empurrão: grátis **primário**; "Get the full game — preço" **outline** (peso igual, sem dourado, sem badge); "Back" quiet `[novo]`. |
| `EscolhaEstados.dc.html` | ONB-17 · 18 · 19 | Três `role=alert` com filete âmbar e texto `ink`, sob os botões; nada de modal, nada de vermelho. |
| `EscolherPersonagem.dc.html` | ONB-20 | **Seis criaturas DESENHADAS** (`PREMADE_CHARACTERS` tem 6 hoje; o wireframe de 14/09 desenhou 3 — `[novo — código]`): grade 2×3 de cards SIS-03, cada um com o sprite **256² a 128 (0,5×, P2 a)** num vidro 128² com anel, nome Rubik 14/500, bio 12 `muted`; iguais em peso; "Back" quiet. |
| `CadastroDemo.dc.html` | ONB-34 | O nascimento com a criatura (O1): vidro **192²** com anel (sprite 256² a 128), na tonalidade escolhida; as 4 tonalidades como **slots 64²** (`viewport-bg`, sprite a 64 = 0,25×, `hue-rotate` do `demoTintFilter`), a escolhida com anel interno 2px `primary-ink`; campos SIS-03; "Hatch Pyraka" inerte + frase; "Back" quiet `[novo]`. |
| `TutorialConceito.dc.html` | ONB-39 | Pontinhos (8px, `primary-fill` / anel 2px `muted`; `role=progressbar` "Step 1 of 2"), o vidro 192² com a criatura que acabou de nascer, Fredoka 20, Rubik 14, um primário no pé. |
| `TutorialTarefa.dc.html` | ONB-40 · 43 | "Back" quiet pequeno (`arrow_back` 20), o campo JÁ PREENCHIDO com o `soulGoal` (O3, anel de foco ciano), 8 chips SIS-03 (44, Rubik 12/500; selecionado = `primary-soft` + anel `primary-ink`), **"Suggest tasks with AI" VIVO** (primário, foco 12 — X1: o código só o desliga com campo vazio E nenhuma área), "Select at least 1 task" inerte, o aviso da IA `[novo]` 12 `muted` (O6). |
| `TutorialSugestoes.dc.html` | ONB-41 | Cada sugestão = card SIS-03 de 44 com `check_circle` 24 FILL 1 (`primary-ink`; selecionada = `primary-soft` + anel 2px) ou `radio_button_unchecked` 24 `muted`; a 4ª além do teto é **inerte por forma** (tracejado 1px `muted` + tinta `muted`, `aria-disabled`); o teto em 12 `gold-ink` sem moldura (D-A4); "Suggest tasks with AI" outline (já respondeu); "Add 2 and start" primário. |
| `TutorialErro.dc.html` | ONB-42 | Quatro tarefas de dois minutos, nenhum banner, nenhuma selecionada; o primário inerte até ≥ 1; a resposta VAZIA da IA como frase 12 `muted` centrada (espécime abaixo da marca `.dobra` a 844). |

**Medido no DOM (18 artboards, `getComputedStyle` + `getBoundingClientRect` em todos os nós do `.phone`, Chromium via
Playwright em `localhost:8772`, DPR 1):** **0** nós de texto < 12px dentro do `.phone` · **0** elementos vazando a largura de 390 ·
**0** alvos < 44 entre `button/checkbox/textbox/radio/link/summary` (links do bloco legal 44; chips 44; sugestões 44; slots de
tonalidade 64; cards de personagem 128+) · **0** Silkscreen fora de `.screen` (a Silkscreen aparece só na splash — 32/14 — e no
vidro da intro — 20/14) · **0** nós com `opacity` < 1, **0** com `opacity()` em `filter` (o único filtro é `hue-rotate` nos slots
de tonalidade), **0** `text-shadow` · **0** `<img>`, `background-image` ou `border-image` fora de `.screen` e **0 SVG pixel fora do vidro** (a chama do portão
está num slot `viewport-bg` — X3; o corvo, os 6 sprites, a heroína e os 4 slots estão dentro de um `.screen`) · **6 glifos usados,
6 no inventário de 102** (`arrow_back, check, check_circle, download, radio_button_unchecked, sync`) · alturas do `canvas.json`
= `scrollHeight` do `.ab`.
**Fidelidade (`cmp.py`, sequência de `role`, `aria-label`, `.fo` e conjunto de textos, 17 pares):** a sequência dos marcadores
de foco é **idêntica em 15 de 17** — as duas exceções são declaradas: `EscolherPersonagem` (7 focos em vez de 4: **3 personagens a
mais**, porque `PREMADE_CHARACTERS` tem 6 desde 08/09 e o wireframe desenhou 3 — D11, `[novo — código]` no artboard) e
`TutorialTarefa` (foco 12 = "Suggest tasks with AI" vivo — X1: o wireframe desenhava um estado que o código não produz). Roles:
idênticas em 11 de 17; as diferenças são declaradas: (a) `role="link"` dos Termos/Privacidade mantido sobre `.btn.gho` (igual);
(b) `CadastroDemo` e `TutorialConceito` têm **um `role="img"` a mais** — o vidro da heroína ("Pyraka, in tint 1"), porque a
criatura é conteúdo, não decoração (R6, confirmado); (c) `EscolherPersonagem` (os 3 botões a mais); (d) `PortaoDuasPortas`: o slot
da marca é `role="img"` "Soulmon" (X3); (e) `PortaoEmail`: um `role="alert"` a mais ("Enter a valid email.", X2); **(f) ONB-07 leva
`aria-busy="true"`** a mais que o wireframe (R7 — a 5ª diferença de ARIA, que o `cmp.py` não vê; casa com o `sm2Button`). Copy EN
idêntica; as únicas diferenças de texto são as ligatures dos ícones, as anotações do wireframe que viraram desenho ("MASCOT",
"PET", "VIDEO (brand intro)", "1"), as duas linhas de Silkscreen da splash que são texto do `index.html` ("LOADING DATA..." /
"SOUL_LINK ESTABLISHED"), "TAP TO SKIP" dentro do alvo da intro, "Enter a valid email." (copy do código, X2), os 3 nomes + 3 bios do
`bioEn`, e a marca `.dobra` de `TutorialErro`. **Nenhum skip link no funil**: o `App` só monta `.sm-skip-link` após
`hasCompletedOnboarding` (DECISÕES §17 R5) — a numeração a partir de 2 é fidelidade ao wireframe, não um skip link oculto (X5-a).

## Rodada 2 — achado → conserto (`CRITICA.md`, 20/09/2026)

| # | Achado | Conserto | Onde |
|---|---|---|---|
| X1 | "Suggest tasks with AI" inerte com o campo pré-carregado — estado que o código não produz | primário VIVO, foco 12; nota no artboard; achado para o lead: com `goalText` o código renderiza **o próprio objetivo como 1ª linha selecionável** (`customKey`) — nem o wireframe nem o canvas o desenham | `TutorialTarefa` |
| X2 | e-mail malformado só por cor | "Enter a valid email." em `role=alert` âmbar sob o campo (copy do código, `authErro = "email-invalido"`); `aria-invalid` fica; linha para o cartógrafo (`03 §2.3` não cita o `authErro` do e-mail) | `PortaoEmail` |
| X3 | a chama pixel fora do visor (1,10:1 no claro) | chama 2× num slot SIS-07 64×80 `viewport-bg`, sem anel, `role=img` — como o `favicon.svg`; D-O4 revista | `PortaoDuasPortas` |
| X4 | intro num vidro 358×260 com anel (alvo encolhe, sequência encolhe, `cover` perde borda) | o MESMO `.screen.splash` full-bleed em fluxo (322×260 no strip), vídeo `cover` dentro, sem anel; D-O3 revista | `IntroEstados` |
| X5 | "1 = skip link" em 14 rodapés; 13,75 no claro; 358 no strip; corvo "a 96"; 13.19 ausente | W10 reescrito (sem skip link no funil); 11,89; "322 no strip, 390 na tela"; "ícone em box de 96 com o corvo a 64"; **13.19 citada** nos rodapés de `Escolha`, `EscolherPersonagem`, `CadastroDemo` e abaixo em Pendentes; `aria-busy` de ONB-07 declarado | rodapés + README |
| X6 | "·" órfão entre os dois links legais | separador removido; `gap: 0` (empilhados, os dois já são lista) | `PortaoGoogle`, `PortaoEmail`, `PortaoEstados` |
| R1–R8 | ruído (slots sem borda 1,04:1; segmentos apagados 1,48:1; anotações no telefone; Back a 13px da dobra; `auto_awesome` fora do botão da IA; `role=img`; `aria-busy`; pular e voltar com o mesmo quiet) | registrados; R5 justificado no rodapé de `TutorialTarefa` (o glifo de brilho ao lado de "IA" é ornamento — decisão, não omissão) | — |

## Dobra medida a 390×844 (F2 da Home aplicada)

| Artboard | Wireframe aprovado (`../`) | Identidade | |
|---|---|---|---|
| `Main` | splash centrada | chama 262–382 · wordmark 398–437 · barra 483–499 · cristais 550–584 | ✓ |
| `SplashWebView` | bloco centrado | `download` 245–293 · título 313–337 · texto até ~530 | ✓ |
| `PortaoDuasPortas` | mascote 24–80; título ~104; Google ~170; New User ~230 | slot da marca+wordmark 25–132 · título **144–168** · Google **235–283** · New User **324–372** | a pergunta e as duas portas antes de 380 ✓ |
| `PortaoGoogle` | links; caixas; primário ~250; Back ~300 | links **61–149** · caixas 153–290 · primário **306–354** · frase · Back **395–443** · ONB-11 (espécime) 455–579 | ✓ |
| `PortaoEmail` (`tall`) | Back ~470 | e-mail 61 · senha 129 · links 209–297 · caixas 301–438 · Criar **454–502** · entrar 514–562 · Back **574–622** · espécime "Sign in" 634–1068 | a tela de criar cabe inteira ✓ |
| `Objetivo` | campo ~100; Continue ~210; pular ~260 | título+justificativa 25–73 · campo 85–218 · Continue **230–278** · pular 290–338 | ✓ |
| `Atrapalha` | idem + Back | eco 61 · campo 85–189 · Continue **201–249** · pular · Back 321–369 | ✓ |
| `Escolha` | dois botões ~110/170; Back ~290 | grátis **116–164** · completo **176–224** · Back 329–377 | ✓ |
| `EscolherPersonagem` | 3 cards 64 (61–289); Back ~300 | grade **61–727** (3 linhas de 222) · Back **783–831** | os 6 cabem sem rolar; o Back termina 13px antes da dobra ✓ |
| `CadastroDemo` | PET 120 (61–181); tons ~200; campos ~260/330; Hatch ~400; Back ~470 | vidro **61–261** (+ nota) · slots **319–383** · nome 395–463 · apelido 469–537 · Hatch **543–591** · frase · Back **633–681** | ✓ |
| `TutorialConceito` | PET centrado; Let’s start no pé | vidro 262–462 · título **474–498** · texto até ~560 · Let’s start **771–819** | ✓ |
| `TutorialTarefa` | Back; campo; chips; 2 inertes ~600/650 | Back 53–97 · título 109 · campo 145–249 · chips 300–470 · sugerir (vivo) **577–625** · aviso · selecionar (inerte) **666–714** | ✓ |
| `TutorialSugestoes` | sugestões ~430–600; Add ~700 | campo 89–193 · chips 205–345 · sugerir 357–405 · sugestões **417–617** · teto 629–664 · Add **736–784** | ✓ |
| `TutorialErro` (`tall` + `.dobra` a 844) | idem; strip do vazio ~720 | sugestões **417–617** · selecionar **722–770** · espécime do vazio **782–867** (cruza a dobra — marcado) | o que a pessoa vê cabe; a espécime é anotação ✓ |

`IntroEstados`, `PortaoEstados`, `EscolhaEstados` são folhas de estados (`tall`), sem dobra a medir.

## Decisões de identidade tomadas neste canvas (canvas vence; a confirmar na crítica)

| # | Decisão | Motivo |
|---|---|---|
| D-O1 | **A chama da splash a 4× inteiro** (76×120) em vez dos 48×76 do código (2,53×) | É vetor, mas é pixel desenhado (`crispEdges`): escala fracionária sai desigual — a mesma régua de Rituais X1 |
| D-O2 | **Nenhuma opacidade e nenhuma sombra na splash**: segmentos apagados em TINTA (`color-mix(primary-ink 15%, surface-2)`), sem `text-shadow` no wordmark, sem `drop-shadow` na chama; o pulso anima a cor | Home F1 / Atividades F1 / X3 (brilho vira mancha); o ciano sobre o vidro escuro já é o brilho |
| D-O3 | **A intro é a continuação do boot: o mesmo `.screen.splash` full-bleed** (rodada 2, X4 — sem anel, sem janela 358×260), o vídeo em `cover` dentro; os literais `#0b0d16`, o gradiente Tailwind e a placa 96² do corvo saem | A splash liga o visor, a intro continua nele, o portão é o aparelho — o alvo "tap anywhere" é a tela inteira e a sequência não encolhe |
| D-O4 | **A marca = a chama do kit num slot `viewport-bg`** (rodada 2, X3: 64×80, sem anel, `role=img`) + wordmark Fredoka fora; o corvo-mascote só aparece DENTRO do vidro da intro | A fronteira do visor é a LINGUAGEM, não o arquivo: a chama é um `<rect>` por pixel (`crispEdges`) — pixel vive no visor; o `favicon.svg` já a desenha sobre `#071413`; solta no claro os pixels claros somem a 1,10:1 |
| D-O5 | **Segunda porta/segunda escolha = `outline`**, nunca ghost em ciano ("New User", "Get the full game") | SIS-02: ghost ciano ao lado de um primário ciano lê como a mesma ação; outline diz "outra porta"; o preço nunca em `gold-ink` |
| D-O6 | **Links dos Termos/Privacidade = botões ghost 44** em `primary-ink`, `role=link` mantido | W10 (alvo ≥ 44); a cor + o verbo já dizem "abre"; abrem em aba nova como hoje |
| D-O7 | **Todo `role=alert` do funil em ÂMBAR** (filete 3px `gold-ink` + texto `ink`); `role=status` em `primary-ink` | Nenhuma dessas mensagens é culpa da pessoa (pop-up bloqueado, janela sem resposta, compra cancelada, loja indisponível) — âmbar convida, vermelho acusa (W6; SIS-06); `danger-ink` fica para o irreversível |
| D-O8 | **"I’d rather not say right now" e todo "Back" = quiet** (`muted`, sem borda) | Pular é legítimo e não compete com o primário; a saída neutra tem a cor da saída neutra |
| D-O9 | **Os 6 personagens desenhados** (o wireframe desenhou 3) | D11 — como o código (`PREMADE_CHARACTERS` = 6 desde 08/09); a única diferença de conteúdo com a réplica, marcada no artboard |
| D-O10 | **Personagem = card SIS-03 com o sprite 256² a 128 num vidro 128² com anel, em grade 2×3** | P2 (a): uma criatura, um tamanho (Home/Ficha/aqui a 0,5×); 6 linhas de 128 não cabem em 844, 6 células de 171 cabem; nada de 48 de 256² |
| D-O11 | **A heroína do cadastro e do tutorial num vidro 192² com anel** (sprite a 128), na tonalidade escolhida | O1 (a criatura no nascimento); a mesma peça da Ficha (Pet D-P2) |
| D-O12 | **Tonalidades = slots 64²** (SIS-07, `viewport-bg`) com o sprite a 64 (0,25×) e `hue-rotate`; seleção = anel interno 2px | Os swatches do código são 44 com o sprite a 32 (0,125×, tremido); D-H7 (miniatura em vidro); seleção por forma, não só cor |
| D-O13 | **`TutorialConceito` mostra a criatura** (vidro 192²), não o glifo `pets` 48 do código | O wireframe já decidiu (PET 120); `pets` saiu do subset por isso mesmo (Home P6) |
| D-O14 | **Chips e sugestões em vetor** (chip SIS-03 44; card SIS-03 44 com `check_circle`/`radio_button_unchecked` como estado) | `PixelChoiceChip`/`.sm-px-*` são pixel fora do visor (Sistema achado 1) |
| D-O15 | **A sugestão além do teto inerte por FORMA** (tracejado 1px `muted` + tinta `muted` + `aria-disabled`) | O wireframe/código usam `opacity:.5` — nada por opacidade (Home F1) |
| D-O16 | **Dentro do vidro a paleta é a do visor** (`.screen.splash/.introglass` fixam os hex do escuro) | O `#splash` copia o bloco escuro de propósito; sem isso o ciano do claro daria 2,7:1 sobre o vidro |

## Contraste (WCAG 2.x, hex do `index.css` bloco ONDA 1)

| Par | Onde | Escuro | Claro |
|---|---|---|---|
| `ink` / `bg` | títulos, textos, nomes de personagem, rótulos das caixas | 16,15 | 14,96 |
| `muted` / `bg` | hints, justificativa, bios, frases do que falta, "or", notas, quiet | 8,83 | 5,35 |
| `ink` / `surface` | nome/bio nos cards de personagem, texto das sugestões | 13,59 | 16,23 |
| `muted` / `surface` | sugestão inerte, bio | 7,43 | 5,80 |
| `ink` / `surface-2` | valor nos campos, chips, primário inerte (texto `muted`) | 11,52 | 14,23 |
| `muted` / `surface-2` | placeholder, chip não selecionado, texto do inerte | 6,30 | 5,09 |
| `primary-ink` / `bg` | links ghost, eco "Noted.", filete de status, `check_circle` | 13,21 | 5,55 |
| `primary-ink` / `primary-soft` | chip "Study" selecionado, sugestão selecionada (ícone) | 7,69 | 5,21 |
| `ink` / `primary-soft` | texto da sugestão selecionada | 9,40 | 14,04 |
| `on-primary` / `primary-fill` | todos os primários, `check` da caixa marcada | 12,38 | 6,02 |
| `gold-ink` / `bg` | filetes dos alertas, `download` 48, teto do tutorial, anel `.inp.warn` | 10,51 | 5,41 |
| `primary-fill` / `surface-2` (não-texto) | pontinho aceso, caixa marcada | 9,43 | 5,28 |
| `muted` / `surface-2` (não-texto) | anel das caixas, dos campos, dos chips, tracejado do inerte | 6,30 | 5,09 |
| `viewport-ring` / `bg` (não-texto) | anéis de cobre (intro, personagens, heroína) | 5,92 | 3,66 |
| `primary-ink` (visor `#5FF3E0`) / `viewport-bg` | wordmark da splash, "SOUL_LINK", "SOULMON" da intro, segmentos acesos | 13,75 | **11,89** (sobre `#0E2422`; paleta do visor, D-O16) |
| `muted` (visor `#9DBCB4`) / `viewport-bg` | "LOADING DATA...", "TAP TO SKIP" | 9,20 | 7,95 (idem) |
| segmento apagado `#21534F` / `surface-2` (não-texto, decorativo) | barra da splash | 1,48 | — (R2: frame parado, como o código) |
| `viewport-bg` / `bg` (não-texto) | borda dos slots de tonalidade e do slot da marca | 1,04 | 14,96 (R1: o selecionado tem anel; ruído registrado) |

Nenhum par abaixo de 4,5 (texto) ou 3 (não-texto) nos dois temas. **Nenhuma opacidade em nó nenhum do telefone** (medido nos 18).
O vidro é sempre escuro (`viewport-bg` `#071413`/`#0E2422`); a paleta dentro dele é a do visor (D-O16) — o único par que
falharia sem isso é `primary-ink` claro `#0B6F68` sobre o vidro (2,70), e é exatamente o que o `#splash` do `index.html` evita ao
copiar o bloco escuro.

## Escala do pixel dentro dos vidros

| Peça | Arte | Nativo | CSS | DPR 1 | DPR 2 | Grade |
|---|---|---|---|---|---|---|
| Chama da splash | SVG `.sp-flame` | 19×30 | 76×120 | 4× | 8× | ✓ (código: 48×76 = 2,53× — D-O1) |
| Chama do portão | SVG `.sp-flame` | 19×30 | 38×60 | 2× | 4× | ✓ dentro do slot `viewport-bg` (X3) |
| Corvo da intro | `mascot-raven.png` | 512² (ilustração) | 128 | 0,25× | 0,5× | ilustração, `image-rendering:auto` (como `bg-room`, Home X11) |
| 6 personagens · heroína (cadastro, tutorial) | `lines/<id>-rookie.png` | 256² | 128 | 0,5× | 1× | ✓ P2 (a) |
| Slots de tonalidade | `kaelen-rookie.png` | 256² | 64 | 0,25× | 0,5× | ✓ D-H7 (código: 32 = 0,125×) |
| Silkscreen | — | — | 32 / 20 / 14 | — | — | ✓ piso 14, só no vidro |

## Achados (divergências com o código de hoje — para o `staff-frontend`)

1. **Splash**: chama a 48×76 (fracionária) → 76×120 (D-O1); segmentos por `opacity:.15` + `@keyframes sp-seg` em opacidade → tinta (D-O2); `text-shadow`/`drop-shadow` saem (D-O2). Os tokens do `#splash` continuam CÓPIA do bloco escuro (comentário do próprio arquivo) — ao mudar a paleta, `index.html` muda junto.
2. **`SplashWebView`** é montada pelo `<script>` inline sem fonte nem ícone (o bundle não chega): a única tela sem Fredoka/Rubik — aceitar; o `download` 48 vira SVG inline na implementação.
3. **Intro**: `<video>` em `cover` sobre `#0b0d16` e o erro em gradiente Tailwind (literais) → o mesmo `.screen.splash` full-bleed (D-O3, X4); **o corvo do erro está num ícone em box** (placa 96² `borderRadius: 28` com o `<img>` a 64) → 128 direto sobre o vidro; skip sem rótulo nem `onKeyDown` → `role=button` + `aria-label="Skip intro"` + Enter/Espaço (O5); "TAP TO SKIP" Silkscreen 14 dentro do alvo (identidade, não estrutura).
4. **Portão**: `ravenMascot` 56 solto → a chama do kit num slot `viewport-bg` + wordmark (D-O4, X3); "New User" `ghost` → `outline` (D-O5); links `<a>` sublinhados → ghost 44 (D-O6); `role=alert` em `danger-ink` → âmbar (D-O7); o spinner do `authOcupado` → `sync` 24 com `aria-label` fixo.
5. **E-mail**: `Field`/`CheckRow` do `FormKit` já são vetor — casam; `aria-invalid` sem estilo visual no código → anel âmbar (`.inp.warn`) **+ a frase "Enter a valid email." em `role=alert`** (X2; o wireframe só tinha o anel — linha para o cartógrafo). **Achado de copy**: a regra "At least 6 characters" some ao digitar — manter como `sm2Hint` enquanto `< 6` (não desenhado: copy nova).
6. **ONB-05**: um tick de ONB-09 com Firebase configurado (STATUS c) — desenhado como está, sem "carregando" inventado.
7. **Objetivo/Atrapalha/Escolha/Cadastro**: "I’d rather not say" `ghost` ciano → quiet (D-O8); a justificativa do campo (O2), o eco com `check_circle` 20 (o código usa ✓ em texto `muted`), os três "Back" (O4, B1 — STATUS a).
8. **Escolha**: "Get the full game" `ghost` → `outline` (D-O5); `precoLabel` em `tabular-nums`.
9. **Personagens**: `PREMADE_CHARACTERS` = 6 (o wireframe = 3) → 6 desenhados (D-O9); linhas com `<img 48>` solto → vidro 128² com anel em grade 2×3 (D-O10).
10. **Cadastro demo**: sem `<img>` → vidro 192² com a criatura (O1, D-O11); swatches 44 com sprite a 32 → slots 64² com sprite a 64 (D-O12); `hue-rotate` é o único filtro aceito no vidro (muda matiz, não alfa).
11. **Tutorial**: **"Suggest tasks with AI" vivo com o objetivo no campo** (X1 — o wireframe desenhava inerte; `disabled` só com campo vazio E nenhuma área) e, **para o lead**, o próprio objetivo como 1ª linha selecionável (`customKey`) que nem o wireframe nem o canvas desenham; `auto_awesome` 20 do botão tirado de propósito (R5); `Icon pets 48` → a criatura no vidro (D-O13); `PixelChoiceChip`/botões pixel → chips e cards SIS-03 (D-O14); campo vazio → pré-carregado com `soulGoal` (O3, S1); o aviso da IA (O6; guarda 2e: linha na política antes); sugestão além do teto a `opacity:.5` → forma (D-O15); **o teto ("Stage limit…") muda sob o dedo e não tem `role=status`** nem no código nem no wireframe — anunciar na implementação (D-A4); a barra são pontinhos (S4).
12. **Nenhum glifo novo**: `arrow_back, check, check_circle, download, radio_button_unchecked, sync` — todos no inventário de 102.
13. **Nenhuma copy diz que a 1ª atividade é REAL** (V4) e o porquê da ausência de conta em ONB-09 (V2) — lote de copy, não desenhados.

## Pendentes

- **Sem pendência do dono.** Nenhum token novo, nenhum glifo fora do inventário, nenhuma estrutura reaberta (a ordem do funil é a de hoje — V1 do dono).
- **Pendente do lead — `REGISTRO-DE-DECISOES.md` 13.19 (15/09/2026, X5-d):** o funil ganhou um **REVEAL DEMO** (as 6 perguntas do ritual valem para todos; a oferta 13.1 mora no reveal demo; a criatura própria só pagando — DECISÕES §17 V1 reabriu a Fase 1 "só num artboard novo no canvas do Oráculo"). Este canvas desenha a estrutura aprovada em §9 (14/09), ANTERIOR à 13.19: `Escolha` (ONB-16) ainda pergunta "How do you want to start?" com "Get the full game" como segunda porta ANTES do ritual; `EscolherPersonagem` (ONB-20) e `CadastroDemo` (ONB-34) ainda são o caminho grátis sem reveal. **A posição de ONB-16, ONB-20 e ONB-34 sob a 13.19 não foi decidida pelo lead** — os três rodapés dizem isso; o designer não a reabre. O checkpoint do dono deve saber que aprova uma bifurcação que a decisão dele de 15/09 já deslocou.
- **Para o lead (estrutura, de X1):** o objetivo digitado como 1ª linha selecionável do tutorial (`customKey`) não está no wireframe nem no canvas.
- Crítica (20/09): D-O1/O2/O5–O16 confirmadas; D-O3 e D-O4 derrubadas em parte e revistas na rodada 2 (X4, X3); D-O16 com pedido de implementação: a paleta do visor é UM escopo no `index.css` (ex.: `.sm2-visor`), nunca cópia por componente, e `tokens.contrast.test.ts` cobre visor × `viewport-bg` claro (11,89). O `role="img"` a mais em `CadastroDemo`/`TutorialConceito` (o vidro da heroína) é o mesmo caso do visor de emblemas do Pet.
- Para a `squad-arte`: um corvo-mascote em grade (128²) se a intro um dia virar pixel; hoje o corvo é ilustração e entra com filtro (transição, como `bg-room`).
- Para o wireframe (`../`): `EscolherPersonagem` com 3 personagens (o código tem 6 desde 08/09) — registro, não reabertura.

## Fontes

`index.html` (`#splash`, o `<script>` de WebView antigo) · `main.tsx` · `IntroScreen.tsx` · `SoulmonOnboarding.tsx` (`IDENTITY_STEP`,
`GOOGLE_STEP`, `EMAIL_STEP`, `blocoLegal`, `GOAL_STEP`, `STRUGGLE_STEP`, `CHOICE_STEP`, `DEMO_PICK`, `REGISTER`, `handleUnlockFull`) ·
`components/form/FormKit.tsx` · `GameTutorialFlow.tsx` · `utils/monetization.ts` (`PREMADE_CHARACTERS`) · `utils/sprites.ts`
(`DEMO_TINTS`, `demoTintFilter`, `DUNGEON_LINE_NAMES`) · `utils/goalToCategory.ts` · `public/favicon.svg` ·
`src/assets/soulmon/lines/`, `mascot-raven.png`, `brand/intro.mp4` · `tokens.md` §4, §5 (subset de 102) · `tokens.contrast.test.ts` ·
DECISÕES §9, §18–§20 · HANDOFF §1, §4–§7 · Sistema/Home/Atividades/Rituais `CRITICA.md` · Pet `README.md` (D-P2, D-P9) · 02 §21, §33 ·
03 §2.1–§2.4 · PRINCÍPIOS §3, §6, §8, §13.
