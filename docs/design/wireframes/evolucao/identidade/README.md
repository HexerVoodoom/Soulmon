# Canvas "Evolução" — identidade (Fase 2, sétimo canvas) · rodada 2 (X1–X9 da `CRITICA.md` aplicados, 20/09/2026)

> **Rodada 2 — o que mudou:** X1 burst a **3× = 288** na `Cerimonia` (os raios passam 80 px além da criatura, o centro ciano aparece nas frestas) e **sem burst** na `CerimoniaReduzida` (a 3× centrado no "depois" vazaria 14 px do vidro; o quadro parado não precisa do FX) · X2 faísca = **quadro 4** (a dispersão) a 2× no canto superior direito, alfa em x 164–220 (`EvoPronto`) / 294–350 (`Cerimonia`) — **0 px sobre o sprite** (32–160 / 130–258) · X3 vidro circular do nó **80** (o 72 sugerido ainda cortava 0,8 % da mega; a 80 o corte é **0,00 %** nas quatro artes e nos placeholders), anel r 41 · X4 ALCANÇADO = `primary-deep` 3px sólido · X5 BLOQUEADO = `muted` 3px (decisão do lead; o nó é controle, WCAG 1.4.11) · X6 sem aura no demo (`auraForElement` → `undefined`) · X7 "complete 3 tasks per day" nos dois arquivos (identidade e `../EvolveTaskModal.dc.html`) · X8 "Confirm degeneration" sem primário (Cancel e Confirm `outline`) · X9 tabela de contraste recalculada (abaixo). Re-medido: 0/0/0/0/0/0/0, fidelidade 15/15.

> Dono: `soulmon-visual-designer` · 20/09/2026 · HANDOFF-IDENTIDADE §1, §4–§7 · base: canvas **Sistema** aprovado
> (`../../sistema/identidade/`, DECISÕES §18 — P1 espaço 4/8/12/16/24/32 + 2, **P2 = (a)** 256² a 128 CSS, **P3** nav 32),
> **Home** (§19: D-H1…D-H9, P4–P7), **Atividades** (§20: tinta nunca alpha, gerador reprova `opacity < 1`), **Rituais**
> (§21: cerimônia com sprite 128 em vidro, `role=dialog`) e **Pet** (§22: D-P1 sub-aba ativa em `primary-soft`, D-P2 heroína
> 128 no vidro 192², D-P3 aura a 2× com corte declarado, D-P7 silhueta por `mask-image`, D-P9 forma anterior a 64).
> **H1 (decisão do dono, `STATUS.md` §3): os nós da EvoArvore em SVG por token — opção (a) de `H1-evoarvore-3-versoes.png`.**
> Tudo que as cinco `CRITICA.md` anteriores (Home F1/F2/X1–X12, Atividades F1/X1–X9, Rituais X1–X5, Pet X1–X7, Onboarding)
> reprovaram está reprovado aqui desde a rodada 1 (o gerador herda os guards).
> Estrutura: os 15 wireframes cinza aprovados de `../` (DECISÕES §10, X1–X5 / V1–V5 / S1–S5) e as linhas `EVO-01`→`EVO-21` do
> `INVENTARIO-WIREFRAMES.md` §1.5.
> **Cada artboard = o wireframe de mesmo nome com a identidade aplicada** — mesma hierarquia, mesmos estados, mesma copy
> (EN; PT no rodapé), mesma ordem de foco. Nada estrutural mudou; o que "pediu" para mudar está no rodapé como achado.
> Escuro em todos; claro só no `MainClaro` (decisão 3 do dono).
> **Regras que mordem, todas respeitadas no desenho:** evolução MANUAL (o visor é o gesto; nenhum botão "Evolve" novo — V2),
> cadeado = toque na forma atual (e o botão de 44 replica), galho previsto + ritmo desempata (EVO-09/10 como notas), `perfectDays`
> só acumulam (a barra cheia continua cheia no travado), renascimento só após ultra + pago + uma vez (recusa MOTIVADA: `not-paid` =
> convite, `not-ultra` = nada, `already-used` = a linha de registro), ovo do renascimento = tela (não estágio), **nada de vermelho**
> (degenerar, renascer e o alerta de confirmação são `outline`/âmbar).

## Como abrir

O `<style>` de cada `.dc.html` é o bloco do `Sistema/Main.dc.html` **copiado** (tokens `--sm2-*`, átomos, rodapé) + o bloco
`HOME (composição)` (anel/vidro, nav, `.strip`, `.sticky`, `.folha`, `.scrimfull`) + o bloco `ATIV (composição)` (`.dobra`,
`.miniglass`) + um bloco `EVO (composição)` só de layout (sub-abas, o visor da forma atual 192², a barra vetor, o cadeado, os
galhos, os nós SVG, a cerimônia em visor de tela cheia, o convite, a folha do renascimento) — nenhum token novo, nenhum literal
de cor. As mesmas podas da rodada 2 de Atividades e o mesmo `guard()` no gerador (reprova `opacity < 1`, `text-shadow` e
`.pix` fora de `.screen`).
Imagens e fontes por caminho relativo ao repo. Servir a raiz do repo:
`npx -y serve -l 8773 D:/Soulmon/repo` → `http://localhost:8773/docs/design/wireframes/evolucao/identidade/Main.dc.html`.
Gerador (fora do repo, no scratchpad da sessão): `gen_evo.py` (importa `gen_ativ_head.py` e o bloco `STYLE_ATIV` de
`gen_ativ.py`); medição `measure_evo.mjs`; diff de fidelidade `cmp.py` — os `.dc.html` são a fonte commitada.

## O que cada artboard prova

| Artboard | Id | Prova |
|---|---|---|
| `Main.dc.html` | EVO-01 · 02 · 08 | A forma atual num VISOR de verdade: anel de cobre (raio 20) em volta do vidro **192²**; dentro, a aura elemental `fx-fogo-aura` 128² a **2×** (corte declarado como na Ficha, D-P3) atrás do **sprite `igni-champion` 256² a 128 centrado** (P2 a — a MESMA escala da Home e da Ficha); o visor é `role="button"` (alterna o cadeado). Fora do vidro, aparelho: nome Fredoka 20; a barra `.meter` SIS-07 em vetor (`role=progressbar` 4/7) + "3 complete days to go." 14 centrado; o cadeado `.btn.sm.out` 44 com `lock_open` 24 pelado; "Where they are heading" com o galho em `primary-ink` 500 dentro da frase e os três atributos em `.segb` (10 segmentos vetor, `role=progressbar` cada). Sub-abas = três `.btn.sm` 44, ativa em `primary-soft` + `primary-ink` + anel 1px (Pet D-P1). |
| `MainClaro.dc.html` | EVO-01 claro | O mesmo DOM sob `[data-theme=light]` — o ciano `#0B6F68`, `muted` `#4E6B66`, anel `#B0722F`; o vidro continua escuro (`viewport-bg #0E2422`): o pixel não muda de tema. |
| `EvoArvore.dc.html` | EVO-08 · 09 · 10 | A árvore rolada: os três galhos como `.chip` 44 (`role=radio`, selecionado em `primary-soft`); um card SIS-03 por nó com o **NÓ em SVG por token (H1 a)**: anel por estado — ATUAL `primary-ink` 3px + halo 1px · PREVISTO tracejado `primary-deep` (6/5) · BLOQUEADO `muted` 3px (X5) · ALCANÇADO `primary-deep` 3px sólido (X4) — em volta de um **vidro circular 80** (`viewport-bg`, X3: corte 0 %) com o sprite 256² a **64** (0,25×, D-P9) na forma atual, e a **silhueta por `mask-image`** (`color-mix(viewport-bg 58%, viewport-ink)`, D-P7) nas ocultas; "???" 14/500 e a tag `.chip.tag` Rubik 12/600 (CURRENT em `primary-soft`+`primary-ink`); as notas W3 / EVO-09 / EVO-10 em 12 `muted`. |
| `EvoTravado.dc.html` | EVO-03 | O cadeado É do jogador: botão segurado no idioma de SELEÇÃO (`primary-soft` + `primary-ink` + anel, `lock` FILL 1, `aria-pressed="true"`), nunca no de bloqueio; **no vidro, a placa "ON HOLD"** (Silkscreen 14, moldura `frame-pipe-vine-96` a ½× sobre placa `color-mix(viewport-bg 78%)`) — a MESMA peça do "EVOLVE" da Home (X3) com a palavra de X3; a barra cheia continua cheia; a frase X4 ("Holding the form doesn't shield it…") em 12 `muted` centrada, sem âmbar. |
| `EvoPronto.dc.html` | EVO-04 | Barra cheia em `primary-fill`, "Ready! Tap your Soulmon to evolve." 14; a criatura ganha a **faísca** (`anim-sparkle-pop` **quadro 4**, a dispersão, 64² a 2× = 128) no canto superior direito do vidro, fora da criatura (X2: 0 px de sobreposição) — o FX que o código já liga na evolução pronta; **sem botão novo**: o visor é o gesto (V2 = dívida registrada). |
| `EvoOffline.dc.html` | EVO-05 + D9 | Card SIS-06 `role=status` com `wifi_off` 24 `muted` pelado + "Offline — it'll be here when you're back." — sem âmbar, sem vermelho; barra (2/7) e cadeado vivos. |
| `EvoSpriteEstados.dc.html` | EVO-05 · 06 · 07 | Folha de estados: os três cards `role=status` (gerar, falhar e sintonizar não são culpa de ninguém); "Try again" `outline` 44 com `refresh`; "Tune the Visor" o único primário (`tune`), "Keep the old look" `outline` (`undo`); "NEW · Visor tuned" com `auto_awesome` FILL 1 `primary-ink` 20; e o strip **`[novo — código 15/09]`** com os **placeholders v3 no nó** (D1): `dormant` = GERANDO, `forming` = RESERVA_FINAL, `glitch` = ERRO — 256² a 64 dentro do vidro circular 80, anel tracejado enquanto gera, `muted` no erro. |
| `EvoEstados.dc.html` | EVO-08 · 09 | Diálogos `.dlg` SIS-06 (`role=dialog`, Cancel `outline` + primário lado a lado); a forma revelada = nó PREVISTO (tracejado) com o SPRITE no vidro, nome/estágio em tinta normal (o wireframe esmaecia a `.7` — tinta, nunca alpha; "revealed this session only" em 12 `muted`); o zênite = nó ATUAL com o mega e as tags ZENITH (`gold-ink`) + CURRENT; a forma anterior = nó ALCANÇADO (`primary-deep` 3px, X4) com "Degenerate" `outline` 44 e o diálogo "Confirm degeneration" **sem primário** (X8: Cancel e Confirm `outline`) — nada de vermelho; o primário fica só no spoiler, que não perde nada. |
| `ConviteDemo.dc.html` | EVO-11 | O `UnlockNudge` como card-botão SIS-03 (56) com `auto_awesome` 24 FILL 1 em **`gold-ink`** pelado (âmbar = convite, PRINCÍPIOS §8), título 14/500 + frase 12 `muted`; a página inteira viva embaixo (Pyraka = `kaelen-rookie` a 128 no visor, **sem aura** — X6: o demo não tem oráculo). |
| `ConvitePago.dc.html` | EVO-12 | O mesmo card-botão, mesma cor (é a porta do ritual, não oferta nova), copy `variant='reveal'`. |
| `Cerimonia.dc.html` | EVO-13 · 14 | O diálogo z-500 é um **VISOR de tela cheia** (D-E6): o vídeo é cenário DENTRO do vidro (quadro `evolution-bg-thumb.webp` em `cover`, `image-rendering:auto` — ilustração/transição, como o `bg-room`), o **burst** `gain-evolution-burst` 96² a **3× = 288** (X1) atrás da forma evoluída a **128**, a faísca (quadro 4, 64² a 2×) no canto superior direito fora da criatura (X2); embaixo, o APARELHO (faixa `surface` com filete de cobre 3px): "EVOLVED INTO" Rubik 12/500 caixa alta `muted` (`.lab` — rótulo é aparelho, não Silkscreen), nome Fredoka 24, a data 12 `muted` `[novo]`, o primário "Let's keep going together" `[novo]`; `role="dialog" aria-modal="true"` (X5). |
| `CerimoniaReduzida.dc.html` | EVO-13 + D7 | O mesmo visor com o quadro parado: antes a **64** (0,25×) → `arrow_forward` 24 (vetor sobre o vidro, como o balão da Home) → depois a **128**, sem burst (X1); o mesmo aparelho e a mesma saída — a pausa fica. |
| `EvolveTaskModal.dc.html` | EVO-15 | `.dlg` centrado sobre o scrim literal (`rgba(4,18,20,.55)` — cor, não opacidade): `auto_awesome` 48 FILL 1 pelado, Fredoka 20, corpo 14, o número em 12 `muted` ("complete 3 tasks per day" — X7, plural real também na primeira frase), "Create new task" primário + "Got it" `outline` em coluna. (13.12: vira CARD — estrutura do wireframe replicada; o card é do `staff-frontend`.) |
| `RenascimentoModal.dc.html` | EVO-17 · 19 | Folha SIS-04 (`role=dialog`, alça, raio 20): Fredoka 20 + × 44 `close`; a perda em 14 `ink`, o que fica em 12 `muted`, "ONCE" 12/500; campo SIS-03 44 com placeholder; dois `combobox` lado a lado (`expand_more` 24); "Be reborn" inerte por SUPERFÍCIE (`surface-2` + `muted`, `aria-disabled`), "Not now" `outline`. |
| `RenascimentoConfirmando.dc.html` | EVO-18 | Campo preenchido com anel de foco; `role=alert` com filete **`gold-ink`** 3px (âmbar, nunca vermelho); "I'm sure — be reborn" primário + "Back" `outline`. |
| `RenascimentoBlocos.dc.html` | EVO-16 · 20 · 21 | "Rebirth" primário com `egg` 24 pelado; a recusa `not-paid` = o MESMO card-convite âmbar; `not-ultra`/`already-used` não montam nada; o registro = linha 12 `muted` com `egg` FILL 1 20 — memória, nunca oferta repetida. |

**Medido no DOM (16 artboards, `getComputedStyle` + `getBoundingClientRect` em todos os nós do `.phone`, Chromium via
Playwright em `localhost:8773`, DPR 1 — `measure_evo.mjs`):** **0** nós de texto < 12px dentro do `.phone` (o wireframe tinha
10px no `.lbl` e 8px nas tags — subiram para 12) · **0** elementos vazando a largura de 390 · **0** alvos < 44 entre
`button/checkbox/textbox/radio/combobox/link/summary` (as três sub-abas medem 113,3×44; os chips dos galhos 115,3×44; os nós
ocultos 88×88; a placa "ON HOLD" não é alvo — o visor 200×200 é) · **0** Silkscreen fora de `.screen` (a única Silkscreen do
canvas é "ON HOLD" 14, dentro do vidro do `EvoTravado`) · **0** nós com `opacity` < 1, **0** com `opacity()` em `filter` e
**0** com `text-shadow` · **0** `<img>`, `background-image` ou `border-image` fora de `.screen` (sprites, aura, faísca, burst, o
quadro do vídeo, os placeholders e a moldura da placa estão todos dentro de um `.screen`; a silhueta é `mask-image` dentro
do vidro circular do nó; o anel do nó é `<svg>` inline, vetor) · **15 glifos usados, 15 no inventário de 102**
(`arrow_forward, auto_awesome, casino, close, egg, expand_more, home, lock, lock_open, menu, refresh, storefront, tune, undo,
wifi_off` — contando a nav; nenhum fora do subset) · alturas do `canvas.json` = `scrollHeight` do `.ab`.
**Escala inteira em toda arte:** sprite 256² a 128 (0,5×) no visor, a 64 (0,25×) no nó (vidro 80: corte 0,00 %); aura 128² a 256 (2×); faísca 64² a 128
(2×, quadro 4, 0 px sobre o sprite); burst 96² a 288 (3×, `Cerimonia`); placeholders 256² a 64 (0,25×); moldura da placa 96² a ½×; o quadro do vídeo 720×1280 em `cover`
(≈0,54×) é ilustração, não grade — transição declarada (Home X11).
**Fidelidade (`cmp.py`, 15 pares):** a sequência dos marcadores de foco (`.fo`) é **idêntica nos 15**; a sequência de `role` é
idêntica nos 15; os `aria-label` são idênticos nos 15 — a única adição são os três rótulos dos nós do strip `[novo]` de `EvoSpriteEstados` (GERANDO / RESERVA_FINAL / ERRO) — (o wireframe rotula o visor "Pixel, current form" também no demo cuja
tela diz "Pyraka" — replicado como está e registrado como achado 12). A copy EN é a mesma; as únicas diferenças de texto são
(a) as ligatures dos ícones (`lock`→`lock_open`, `spark`→`auto_awesome`, `x`→`close`, `▾`→`expand_more`, `▲`→silhueta), (b)
"PET" dos placeholders cinza que viraram sprite, (c) "ON HOLD" na placa do vidro (a palavra de X3, que o wireframe cita na nota
e desenha como `lock` na tag), (d) "3 tasks per day" (X7 — corrigido também no wireframe), (e) o strip `[novo — código 15/09]` dos placeholders no nó (`EvoSpriteEstados`), declarado no
artboard e aqui.

## Dobra medida a 390×844 (F2 da Home aplicada)

A página rola (visor → barra → cadeado → galhos → árvore); a pergunta é "o que da tela aparece antes da nav (774)?":

| Artboard | Wireframe aprovado (`../`) | Identidade | |
|---|---|---|---|
| `Main` · `MainClaro` · `EvoPronto` | visor 119–295; barra ~305; cadeado ~340; "Where they are heading" inteiro | sub-abas 65–109; visor **121–357** (200 com o anel); nome 361–385; barra **369–409** (com a frase); cadeado **421–465**; "Where they are heading" **477–612** (inteiro); `.sticky` 620 | a pergunta ("who is my creature turning into, and why") e os três atributos cabem sem rolar ✓ (162 px de folga até a nav) |
| `EvoTravado` | idem + a frase X4 | cadeado 421–465; frase X4 477–512; "Where they are heading" **524–659** (inteiro) | ✓ |
| `EvoOffline` | visor; card offline; barra; cadeado | visor 121–357; card **369–447**; barra 459–500; cadeado **512–556** | ✓ |
| `EvoArvore` | galhos ~150; três cards até ~470 | galhos 129–201; cards **214–344 · 352–466 · 474–588** (os três inteiros); notas W3/EVO-09 até ~770 | os três nós cabem antes da nav ✓ |
| `ConviteDemo` · `ConvitePago` | convite ~120; visor; barra; cadeado | convite **121–200**; visor **212–448**; barra 460–500; cadeado **512–556** | ✓ (o convite é o primeiro bloco e não empurra o cadeado para fora) |
| `Cerimonia` | tudo centrado | visor de tela cheia **1–579** (burst 288 centrado: 50–338 × 145–433, inteiro); nota 12; "EVOLVED INTO" → nome → data → primário **731–779** | tudo antes de 844 ✓ |
| `CerimoniaReduzida` | idem | visor **1–603**; primário **771–819** | ✓ (a nota D7 de três linhas empurra 40 px; ainda cabe) |
| `EvolveTaskModal` | modal centrado | `.dlg` ~215–630; primário **470–518**; "Got it" 526–574 | ✓ |
| `RenascimentoModal` | folha 800 | folha **211–843** (título → "Not now" 779–827) | a folha inteira cabe em 844 ✓ |
| `RenascimentoConfirmando` | idem + alerta | folha **159–843** (o alerta entra e a folha sobe 52 px; "Back" 779–827) | ✓ |

`EvoSpriteEstados`, `EvoEstados` e `RenascimentoBlocos` são folhas de estados (`tall`), sem dobra a medir.

## Decisões de identidade tomadas neste canvas (canvas vence; a confirmar na crítica)

| # | Decisão | Motivo |
|---|---|---|
| D-E1 | **A forma atual = sprite 256² a 128 CSS centrado num vidro 192²** (anel de cobre raio 20), aura elemental a 2× atrás (opacidade 1, corte declarado: 32 px de cada lado ficam fora — D-P3) — a MESMA escala da Home e da Ficha. O código estica o sprite ao vidro (192, 0,75×) | DECISÕES §18 P2 (a); §22 D-P2/D-P3; HANDOFF §1 |
| D-E2 | **A barra de progresso é APARELHO**: `.meter` SIS-07 (12px, trilho `surface-2` + fronteira `muted` 1px, preenchimento `primary-fill`), `role=progressbar` com `aria-valuemax = gateDays`; a frase 14 centrada abaixo. O código usa `PixelMeter` fora do vidro (pixel fora do visor, SIS achado 1) | HANDOFF §1/§6; SIS-07 |
| D-E3 | **Nó da árvore = SVG por token (H1 opção (a), decisão do dono)**: `<svg 88²>` com o disco `surface-2` (r 41) e o anel por estado — ATUAL `primary-ink` 3px + halo 1px (r 43,5) · PREVISTO tracejado `primary-deep` 3px (6/5) · BLOQUEADO `muted` 3px (X5) · ALCANÇADO `primary-deep` 3px sólido (X4) — e, dentro, um **vidro circular 80** (`.screen`, `viewport-bg`; X3) com o sprite 256² a **64** (0,25×) ou a **silhueta por `mask-image`** em `color-mix(viewport-bg 58%, viewport-ink)` (3,76 / 3,69 sobre o vidro). Quatro assinaturas, todas ≥ 3:1 nos dois temas: halo / tracejado / cinza / ciano-escuro. Duas leituras de (a) que o canvas fixa: (i) o interior do nó é o VIDRO (`viewport-bg`), não `surface-2` — o pixel só entra em vidro; o `surface-2` de (a) fica no disco do SVG, atrás do vidro (decorativo); (ii) "cheio" no ALCANÇADO virou anel 3px sólido — o disco cheio taparia o sprite e o 6px da rodada 1 pesava mais que o ATUAL (X4). O `line` de (a) no BLOQUEADO (1,32) saiu: o nó oculto é `role=button` ("Reveal (spoiler)") e a fronteira do controle precisa de 3:1 (1.4.11) — `muted` é o "apagado" de (a), só que visível (§3 da CRITICA, decisão do lead) | STATUS §3 H1; `H1-evoarvore-3-versoes.png` (a); CRITICA X3/X4/X5; Pet D-P7/D-P9; HANDOFF §1 (O Visor) |
| D-E4 | **O cadeado fala a língua da SELEÇÃO, não a do bloqueio**: aberto = `.btn.sm.out` 44 com `lock_open` 24; segurado = `primary-soft` + `primary-ink` + anel 1px (o mesmo idioma da sub-aba ativa e do chip do galho) com `lock` FILL 1 — `aria-pressed` intacto. O cadeado é controle do jogador (PRINCÍPIOS §6), não uma coleção trancada: a placa cheia não entra (é o CTA) e o `muted`/tracejado não entra (é inerte) | PRINCÍPIOS §6; SIS-02; Pet D-P1 (X4) |
| D-E5 | **"ON HOLD" no vidro** (só no travado): placa pixel (Silkscreen 14 caixa alta, moldura `frame-pipe-vine-96` a ½× sobre `color-mix(viewport-bg 78%)`, 17,3:1) no canto superior direito, `aria-hidden` (o `aria-label` do visor já diz "locked") — a MESMA peça do "EVOLVE" da Home (§19 X3) com a palavra de X3 (a tag do cadeado do jogador é "ON HOLD", não "LOCKED"). Duas palavras em caixa alta, não frase (HANDOFF §1) | DECISÕES §10 X3; §19 X3 |
| D-E6 | **A cerimônia = VISOR de tela cheia + aparelho embaixo**: o diálogo z-500 tem o vídeo como CENÁRIO dentro do vidro (o quadro `evolution-bg-thumb.webp` em `cover`, filtro — ilustração, transição como o `bg-room`), o burst `gain-evolution-burst` 96² a 2× e a forma evoluída a 128 com a faísca a 2×; abaixo, uma faixa `surface` com filete de cobre 3px (a borda inferior do aparelho) carrega "EVOLVED INTO" em `.lab` Rubik 12/500 caixa alta, o nome Fredoka 24, a data e o primário. Texto e botão nunca ficam sobre o vídeo (contraste sobre imagem não é medível por token); o que é cena fica no vidro. Movimento: a intercalação e o burst são `steps()` dentro do vidro; reduzido = quadro antes (64) → `arrow_forward` → depois (128), a pausa fica (D7) | HANDOFF §1 (O Visor); §21 (cerimônia de marco: sprite 128 em vidro, `role=dialog`); D7; PRINCÍPIOS §5 |
| D-E7 | **O convite (`UnlockNudge`) é âmbar de convite**: card-botão SIS-03 com `auto_awesome` 24 FILL 1 em `gold-ink` pelado, título 14/500, frase 12 `muted`; sem placa cheia (o convite não compete com o cadeado), sem × (V4/D11). A recusa `not-paid` do renascimento usa a MESMA peça | PRINCÍPIOS §8; DECISÕES §10 V4; `rebirthRefusal` |
| D-E8 | **Nada de vermelho em degenerar, renascer e confirmar**: "Degenerate" `outline` 44; "Confirm degeneration" com o primário `primary-fill` (a ação é do jogador, pedida duas vezes); o `role=alert` do renascimento com filete `gold-ink` 3px; "Be reborn" inerte por superfície (`surface-2` + `muted` + `aria-disabled`), nunca opacidade. `--sm2-danger-*` não aparece no canvas | CLAUDE.md (o app nunca cobra); Atividades F1; SIS-06 |
| D-E9 | **Placeholders v3 no NÓ** (D1, código de 15/09): `dormant`/`forming`/`glitch` 256² a 64 dentro do vidro circular, com o anel do estado (tracejado enquanto gera, `line` no erro) — só conta paga. A pauta pedia "256²→128": 128 é a escala do VISOR, e o visor mostra a forma ATUAL durante a geração (EVO-05); no nó a escala é 64 (D-P9) | STATUS `a388ddb9`; EVO-05; Pet D-P9 |
| D-E10 | **Tags de estado do nó** (CURRENT/FORECAST/LOCKED/ZENITH) em `.chip.tag` Rubik 12/600 (12 é o piso; o wireframe usava 8px e o código Silkscreen fora do vidro): CURRENT em `primary-soft` + `primary-ink`, ZENITH em `gold-ink`, as outras `muted` sobre `surface-2` | HANDOFF §1 (≥ 12; Silkscreen só no vidro); SIS-03 |
| D-E11 | **"Where they are heading"**: o galho previsto em `primary-ink` 500 dentro da frase (é a resposta da tela, PRINCÍPIOS §6) e os três atributos em `.segb` de 10 segmentos (vetor, `role=progressbar` por atributo, rótulo 12 `muted` de 90px) — nenhum percentual, nenhum "N%" (02 §16) | 02 §16; SIS-07 |
| D-E12 | **Anotações dentro do telefone** só as do wireframe (`.sticky`, `.tagd` `sample`/`novo`, as `.note` 12 dos estados, o `.tagd` "video loop · z-500" sobre o vidro da cerimônia) + o strip `[novo — código 15/09]` dos placeholders no nó | D-A9; D-R12; D-P12 |

## Contraste (WCAG 2.x, hex do `index.css` bloco ONDA 1)

| Par | Onde | Escuro | Claro |
|---|---|---|---|
| `ink` / `bg` | nome Fredoka 20, "3 complete days to go.", "Heading toward…", frases dos cards de status | 16,15 | 14,96 |
| `muted` / `bg` | `.lab`, rótulos dos atributos, `.sticky`, `.note`, a frase X4, "revealed this session only" | 8,83 | 5,35 |
| `ink` / `surface` | nomes dos nós, títulos dos diálogos, corpo do renascimento, título do convite | 13,59 | 16,23 |
| `muted` / `surface` | estágio dos nós, frase do convite, "Nothing else is lost…", "EVOLVED INTO" da cerimônia | 7,43 | 5,80 |
| `primary-ink` / `bg` | o galho na frase ("Power"), sub-aba ativa, cadeado segurado, `auto_awesome` da linha NEW | 13,21 | 5,55 |
| `primary-ink` / `primary-soft` (composto sobre `bg`) | sub-aba ativa, chip do galho selecionado, cadeado segurado (D-E4) | 9,33 | 5,21 |
| `primary-ink` / `primary-soft` (composto sobre `surface`) | tag CURRENT no card | 7,69 | 5,21 |
| `on-primary` / `primary-fill` | "Yes, reveal", "Confirm", "Create new task", "Tune the Visor", "Rebirth", "I'm sure — be reborn", "Let's keep going together" | 12,38 | 6,02 |
| `gold-ink` / `surface` | `auto_awesome` do convite, tag ZENITH, filete do `role=alert` | 8,84 | 5,87 |
| `primary-fill` / `surface-2` (não-texto) | a barra, os segmentos cheios | 9,43 | 5,28 |
| `primary-ink` / `surface-2` (não-texto) | o anel ATUAL sobre o disco do nó | 9,43 | 5,28 |
| `primary-deep` / `surface-2` (não-texto) | o anel PREVISTO (tracejado) e o ALCANÇADO (sólido, X4) sobre o disco do nó | 6,21 | 7,70 |
| `primary-deep` / `surface` (não-texto) | os mesmos anéis onde cavalgam a borda do disco, sobre o card | 7,33 | 8,28 |
| `muted` / `surface` · `muted` / `surface-2` (não-texto) | o anel BLOQUEADO (X5) sobre o card e sobre o disco | 7,43 · 6,30 | 5,80 · 5,09 |
| `muted` / `surface-2` (não-texto) | fronteira do `.meter` e dos segmentos vazios, anel dos `outline` | 6,30 | 5,09 |
| `viewport-ring` / `bg` (não-texto) | o anel de cobre do visor | 5,92 | 3,66 |
| `viewport-ink` / placa `color-mix(viewport-bg 78%)` | "ON HOLD" (Silkscreen 14, dentro do vidro) | 17,3 | 17,3 |
| silhueta `color-mix(viewport-bg 58%, viewport-ink)` / `viewport-bg` (não-texto) | a forma oculta no vidro circular (`#667271` / `#6A7C79`) | 3,76 | 3,69 |
| `viewport-bg` / `surface-2` (decorativo, não fronteira) | a borda do vidro circular sobre o disco do nó — o vidro é palco; a fronteira do controle é o anel (X9) | 1,46 | 14,2 |
| `surface-2` / `surface` (decorativo) | o disco do SVG sobre o card — no escuro não se distingue; o que se vê é o vidro e o anel (X9) | 1,18 | 1,10 |
| `muted` / `surface-2` | "Be reborn" inerte (texto informativo, não ação) | 6,30 | 5,09 |

Nenhum par de TEXTO abaixo de 4,5 nos dois temas; os anéis dos quatro estados do nó ≥ 3:1 nos dois temas (X4/X5); os dois pares abaixo de 3 são decorativos e declarados (a borda do vidro circular e o disco do SVG — nenhum dos dois identifica o controle). **Nenhuma opacidade em nó nenhum do telefone** (medido nos 16). O vidro é sempre escuro
(`viewport-bg` `#071413`/`#0E2422`) — o pixel, a silhueta e a placa não mudam de tema.

## Achados (divergências com o código de hoje — para o `staff-frontend`)

1. **Sprite esticado ao vidro** no `EvolutionPath` (`Viewport 64×64 scale 3`, sprite a 192 = 0,75×) → 128 centrado (D-E1); aura a 2×, opacidade 1.
2. **Barra de progresso em pixel fora do vidro** (`PixelMeter`) → `.meter` SIS-07 vetor (D-E2); `aria-valuemax = gateDays` fica.
3. **Cadeado em `PixelButton`** com ícones `lucide` (`Lock`/`Unlock`) → `.btn.sm` + `Icon` `lock`/`lock_open` (D-E4); no vidro, a placa "ON HOLD" (D-E5) — hoje o vidro não desenha nada quando travado.
4. **Nós da árvore**: `<img 48>` solto (0,19×) ou o placeholder v3 a 48 → SVG por token (H1 a) + vidro circular 80 com sprite a 64 / silhueta por `mask-image` (D-E3). As versões (b) `soulmon/evolution/` 128² e (c) `E:/nodes` cristal ficam sem consumidor.
5. **Silhueta por `filter: brightness(0)` + `opacity`** → `mask-image` + `color-mix` (Pet D-P7).
6. **Tags CURRENT/FORECAST/LOCKED/ZENITH em Silkscreen 8px** → `.chip.tag` Rubik 12/600 (D-E10); "LOCKED" duplicado no cadeado do jogador sai (X3, "ON HOLD").
7. **"Where they are heading" com `PixelSegmentedBar`** → `.segb` vetor (D-E11).
8. **Sub-aba ativa como `sm-btn` cheio** → `primary-soft` + `primary-ink` (Pet D-P1/X4); a semântica (grupo) continua dívida no STATUS.
9. **`EvolutionCeremony`**: vídeo em loop sobre a tela inteira + sprites brancos intercalando → vídeo DENTRO do vidro, texto e botão no aparelho (D-E6); `role="dialog"` + `aria-modal` + trap + Escape (§10.4 b); `prefers-reduced-motion` (§10.4 c) = quadro antes → depois; **capar a intercalação em ≥ 334 ms** (B3, WCAG 2.3.1 — prioridade alta); "Continue" → "Let's keep going together" (X2) e a data `formReachedAt` (X1); `gainArt`/`animArt` (burst a 3×, faísca quadro 4 no canto, nunca sobre a criatura) ganham a primeira chamada real; em movimento reduzido, sem burst.
10. **`EvolveTaskModal` no kit antigo** (Consolas, `sm-card`, botões só em inglês) → `.dlg` SIS-06 + PT; e, pela decisão 13.12, vira CARD na página com o mesmo conteúdo (V1) — o canvas replica o wireframe (modal) porque a estrutura não se reabre aqui.
11. **`UnlockNudge`** (`sm-card`, `lucide Sparkles`) → card-botão vetor com `auto_awesome` `gold-ink` (D-E7). No demo o visor fica **sem aura** (X6): `auraForElement(dominantElement)` devolve `undefined` sem oráculo — o canvas desenha o que o código produz.
12. **O `aria-label` do visor no demo** diz "Pixel, current form" com "Pyraka" na tela (herdado do wireframe, replicado por fidelidade) — no código o rótulo usa o `petName` real; nada a mudar no código, só no wireframe. O "tap to lock" no rótulo de um visor que, com a barra cheia, também EVOLUI é o gesto duplo V2 — registrado como achado, não corrigido aqui (D11).
17. **"complete 3 task(s) per day"** sobrevivia no wireframe e no código (`EvolveTaskModal.tsx`) contra S4 — plural real nos dois arquivos do canvas (X7); o código acompanha.
13. **Não existe ramo offline no `EvolutionPath`** (D9) → o card `role=status` com `wifi_off` (EvoOffline).
14. **Diálogos do spoiler e da degeneração** em `confirm` nativo → `.dlg` SIS-06 com `role=dialog`; a degeneração **sem primário** (X8); o "Degenerate" continua sem linha no inventário (§10.4).
15. **`RebirthModal`** (`sm-card`, `<select>` nativos, botões pixel) → folha SIS-04 + campos SIS-03; os `optgroup`s do elemento ficam; o inerte por superfície, nunca opacidade; "Renascendo…" (`aria-busy`) em tinta `muted`.
16. **Nenhum glifo novo pedido**: `arrow_forward, auto_awesome, close, egg, expand_more, lock, lock_open, refresh, tune, undo, wifi_off` — todos no inventário de 102.

## Pendentes

- **Sem pendência do dono.** H1 está decidida (opção (a)) e desenhada; nenhum token novo; nenhum glifo fora do inventário; nenhuma estrutura reaberta.
- Para o lead: nada — o anel BLOQUEADO foi decidido (`muted`, X5) e aplicado.
- Para a `squad-arte`: nada novo — a aura em 96² já está pedida pelo Pet (D-P3/R1); as versões (b)/(c) dos nós não serão usadas.
- Para o wireframe (`../`): o `aria-label` "Pixel" no demo (achado 12) — registro, não reabertura.

## Fontes

`EvolutionPath.tsx` · `EvolutionCeremony.tsx` · `EvolveTaskModal.tsx` · `RebirthModal.tsx` · `UnlockAccountModal.tsx` (`UnlockNudge`) ·
`App.tsx` (sub-abas, `handleEvolveRequest`, `canRebirth`/`rebirthRefusal`, `gameState.rebirth`) · `ui/Viewport.tsx` · `utils/rebirth.ts` ·
`utils/carePattern.ts` · `utils/placeholderArt.ts` · `utils/gainArt.ts` · `utils/animArt.ts` · `utils/attackFxArt.ts` · `utils/oracle.ts`
(`STAGE_NAMES`) · `evolucaoManual.contract.test.ts` · `filaDeAvisos.contract.test.ts` · `tokens.md` §5 (subset de 102), §6.1 ·
DECISÕES §10, §18–§22 · HANDOFF §1, §4–§7 · STATUS §3 (H1) · `H1-evoarvore-3-versoes.png` · Home/Atividades/Rituais/Pet/
Onboarding `README.md`/`CRITICA.md` · CLAUDE.md (🔒 Cadeado, 🥚 Renascimento, Desbloqueio) · 02 §14, §16, §17, §45 · 03 §4.10 ·
PRINCÍPIOS §5, §6, §8 · REGISTRO 13.12.
