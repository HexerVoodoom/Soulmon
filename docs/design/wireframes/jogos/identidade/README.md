# Canvas "Jogos" — identidade (Fase 2, oitavo canvas) · rodada 2 (20/09/2026, pós-crítica)

> Dono: `soulmon-visual-designer` · 20/09/2026 · HANDOFF-IDENTIDADE §1, §4–§7 · **Crítica (`CRITICA.md`): ENTRA COM CONSERTOS — 0 fatais,
> X1–X7 aplicados nesta rodada** (X1 faísca no lugar do inimigo derrubado, 0 px sobre o pet, 0 px cortado; X2 `favorite` a 20;
> X3 Arena sem estado impossível + `auto_awesome` desenhado; X4 visor da run a 176 em todas as fases; X5 Bits em `ink` por
> decisão do lead; X6/X7 medidas e frases do README). Pendentes do lead decididos: (a) mini-visor 32 = transição CONDICIONADA
> aos ícones 32² da `squad-arte`; (b) `gold-fill` na barra do outro, com a regra escrita em D-J5. · base: canvas **Sistema** aprovado
> (`../../sistema/identidade/`, DECISÕES §18 — P1 espaço 4/8/12/16/24/32 + 2, **P2 = (a)** 256² a 128 CSS, **P3** nav 32),
> **Home** (§19), **Atividades** (§20: tinta nunca alpha, gerador reprova `opacity < 1`), **Rituais** (§21: `.dlg` com vidro
> dentro, `role=dialog`, copy sem emoji), **Pet** (§22: D-P1 aba ativa, D-P7 silhueta, slot do Dex = mini-visor 64 sem anel) e
> **Evolução** (§10 + canvas de identidade: FX de `fxArt`/`animArt` a 1×/2× dentro do vidro, `cloud_off`/`wifi_off` no offline).
> Tudo que as seis `CRITICA.md` anteriores reprovaram está reprovado aqui desde a rodada 1 (o gerador herda os guards e
> acrescenta um: **nenhum `<img>` fora de `.screen`**).
> Estrutura: os 16 wireframes cinza aprovados de `../` (DECISÕES §11, J1–J5 / V1–V4 / S1–S4) e as linhas `JOGO-01`→`JOGO-25`
> do `INVENTARIO-WIREFRAMES.md` §1.6.
> **Cada artboard = o wireframe de mesmo nome com a identidade aplicada** — mesma hierarquia, mesmos estados, mesma copy
> (EN; PT no rodapé), mesma ordem de foco. Nada estrutural mudou; o que "pediu" para mudar está no rodapé como achado.
> Escuro em todos; claro só no `MainClaro` (decisão 3 do dono).
> **Este é o fluxo mais "visor" da Fase 2**: o minijogo É o conteúdo do vidro; o chrome de cada jogo é aparelho em vetor.
> **Regras que mordem, todas respeitadas no desenho:** perder na masmorra não custa coração (e a tela diz — JOGO-09); Bits sem
> ícone, em fonte de calculadora (💠); Emblemas dourados com serifa (🎖️); a faixa do Torneio ANTES do ranking (🎪); a rodada
> sex–dom é ritual, não tranca; a criatura do amigo no estágio REAL, sem faixa nem rank (J1/T7); **nada de vermelho de
> cobrança** — dano e derrota são leitura, na mesma tinta da vitória; a barra "You" nunca usa ❤️ (guarda 2b); "N matches left
> today" nunca vira push nem contagem regressiva (guarda 2c); "N pts" = poder da partida (13.13).

## Como abrir

O `<style>` de cada `.dc.html` é o bloco do `Sistema/Main.dc.html` **copiado** (tokens `--sm2-*`, átomos, rodapé) + o bloco
`HOME (composição)` (anel/vidro, nav, `.strip`, `.folha`) + o bloco `ATIV (composição)` (`.miniglass`, `.dobra`) + um bloco
`JOG (composição)` só de layout (o visor de jogo `.gv`, o chrome `.ghdr`, as barras `.bars2/.hpb`, a barra de timing `.timing`,
o popup `.pop` com mini-visor `.mv`, os cards `.gcard/.opp/.pvp/.tier/.rank`, as abas do Torneio) — nenhum token novo, nenhum
literal de cor. As mesmas podas da rodada 2 de Atividades e o mesmo `guard()` no gerador (reprova `opacity < 1`,
`text-shadow`, `.pix` fora de `.screen` **e `<img>` fora de `.screen`**).
Imagens e fontes por caminho relativo ao repo. Servir a raiz do repo:
`npx -y serve -l 8774 D:/Soulmon/repo` → `http://localhost:8774/docs/design/wireframes/jogos/identidade/Main.dc.html`.
Gerador (fora do repo, no scratchpad da sessão): `gen_jogos.py` (importa `gen_ativ_head.py` e o bloco `STYLE_ATIV` de
`gen_ativ.py`); medição `measure_jogos.mjs`; diff de fidelidade `cmp.py` — os `.dc.html` são a fonte commitada.

## O que cada artboard prova

| Artboard | Id | Prova |
|---|---|---|
| `Main.dc.html` | JOGO-01 | A página sem um pixel fora de vidro: cinco card-botões SIS-03 de 72 com o **ícone Material 24 pelado** (`emoji_events` · `swords` · `bolt` · `play_arrow` · `pan_tool`), título 14/500, descrição 12 `muted`, tag `.chip.tag` à direita; o Torneio em destaque por anel 1px `primary-ink` + ícone em ciano (a única luz forte); **Bits = "42 Bits" em `--sm2-font-mono`, sem ícone** (💠, SIS-01). |
| `MainClaro.dc.html` | JOGO-01 claro | O mesmo DOM sob `[data-theme=light]` — `ink #0E2422` / `bg #F1F7F5`, `primary-ink #0B6F68`, tags sobre `surface-2 #E9F2EF`. |
| `MasmorraLobby.dc.html` | JOGO-02 | O primeiro VISOR de jogo: chrome vetor (Fredoka 20 + "Floor 1/5 · scene" 12 + × 44 pelado, o primeiro interativo — J5) e o vidro **348×176** com anel de cobre, a cena `dungeon-1` (1080×1920 em `cover`, ilustração) atrás do pet a **128** (0,5×); "Best"/"Base level" como tags com o número em `ink` `tabular-nums` (placar, não moeda); "Enter the dungeon" primário, "Go deeper — 30 Bits" `outline` (aposta opcional, sem placa cheia). |
| `MasmorraTurno.dc.html` | JOGO-03 · 04 · 05 | O chrome da run sobre `line`; o campo de batalha no vidro (inimigo `nautilu-rookie` a 128 espelhado no alto à direita, pet embaixo à esquerda — o layout do código); **as duas barras de HP FORA do vidro em `.meter` vetor** ("You" `primary-fill`, o inimigo `gold-fill` — o outro, nunca vermelho); a **barra de timing em vetor** (trilho `surface-2`, zona `primary-soft` com filetes `primary-ink`, marcador `primary-ink` 3px) e o primário "Attack!"/"Dodge!"; os três popups `role=status` com o **FX 128² num mini-visor 64** (`fx-attack` / `fx-shield` / `fx-hit`) e o título Rubik 14/500 — "Too slow!" na mesma tinta dos outros; "2.4s" em `tabular-nums` `ink` (não muda de cor). |
| `MasmorraAndar.dc.html` | JOGO-06 · 07 | O inimigo derrubado vira o FX `fx-defeat` a 1× no lugar dele (a derrota é do outro, e é pixel no vidro); "Sand Wisp defeated!" 14/500; "Challenge Dune Beetle" primário; o andar limpo em três linhas (placar `tabular-nums`, cura em `muted` — fato, não prêmio) + "Floor 2" / "Bank & exit". |
| `MasmorraFim.dc.html` | JOGO-08 · 09 · 10 | A run completa com o pet à esquerda e `fx-sparkle` a 1× **no lugar do último inimigo** (caixa 178–306 × 8–136 — a mesma do `nautilu-rookie` no Turno; 0 px sobre o sprite, 0 px cortado — X1); **nenhuma cor de prêmio** (título 14/500 `ink`, o resto 12 `muted`); a derrota **sem visor de derrota e sem cor de perda** — só a frase que diz que os corações ficam, na mesma tinta da vitória; o drop do coraçãozinho no popup do golpe com **`favorite` 20 FILL `primary-ink`** no lugar do 💗 (X2) (copy sem emoji, Rituais X3). |
| `PesadeloIntro.dc.html` | JOGO-23 | O diálogo `.dlg` SIS-06 com o × pelado primeiro e um VISOR 288×160 dentro: o pet a 128 de frente para o **espírito `dungeon-spirit` 128² a 1×**; "Stand in its way" primário e "Not now" `outline` com o mesmo alvo; na luta, "Nightmare health" `gold-fill` × stamina `primary-fill`, a **instrução J3** em 12 `[novo]`, a mesma barra de timing. |
| `PesadeloFim.dc.html` | JOGO-24 · 25 | Dois diálogos iguais com o pet a 128 no vidro (faísca só na vitória, no lugar do pesadelo — 152–280 × 8–136, nunca sobre o pet, X1; na derrota o pet inteiro — nada caiu) e o MESMO primário "Good morning!" — a saída não muda de cor com o resultado. |
| `Dino.dc.html` | JOGO-12 · 13 | O vidro 348×192 com a cena `minigame-dino`, o **parallax `dino-parallax-far` (512×128) e o chão `dino-ground-strip` (384×48) a 1×** como faixas repetidas dentro do vidro, o pet a **64** (0,25× — a criatura pequena correndo) e o obstáculo 128² a 64; "Best 1830" 12 `tabular-nums` no chrome; "Start" 240; o strip do fim; o **"Jump" primário de 64 de altura e largura inteira**. |
| `PPT.dc.html` | JOGO-14 | "You 1 × 0 Soulmon" 14/500 `tabular-nums`; o vidro 348×144 com as mãos `hand-rock`/`hand-paper` 128² a 64 frente a frente e **"VS" em Silkscreen 14** sobre placa `color-mix(viewport-bg 78%)` — a única palavra pixel do canvas, dentro do vidro; as três jogadas como `.chip` 44 de texto (as mãos em PNG só aparecem no vidro); "Rematch" / "Exit". |
| `Arena.dc.html` | JOGO-11 | A ficha em três `.chip.tag` (HP/DMG/Essence, valor em `ink`) sob a forma atual a 128 na cena de arena; o erro `sem-motor` como card `role=status` com `cloud_off` 48 `muted` + "Go back" `outline` (é rede, não medalha); a luta com a linha "You · `auto_awesome` Special ready · enemies weakened" (X3: o estado que o código produz com `carga >= 3`; o wireframe juntava "Charge 2/3" com "Special charged") e a mesma barra de timing; "Try again" / "Leave". |
| `TorneioVazio.dc.html` | JOGO-15 | O `.switch` desligado vivo em alvo 52×44; "Round of Sep 14–20" 12 `muted` sem ícone e sem contagem regressiva (🎪 ritual, não tranca); abas com sublinhado; "Enable PvP above…". |
| `TorneioTravado.dc.html` | JOGO-21 | O switch **inerte por forma** (borda tracejada `muted`, botão `muted`, `aria-disabled`), nunca por opacidade; a frase do Vínculo em 12 `muted` `tabular-nums` — informação, sem âmbar, sem barra vazia acusando. |
| `TorneioArena.dc.html` | JOGO-22 | **Emblemas em serifa dourada** (`military_tech` 20 FILL + o número Georgia 16 `gold-ink`); o troféu de season como tag com `emoji_events`; as abas `.tabs` SIS-04 com `swords`/`leaderboard` 20 e sublinhado ciano; "2 matches left today" 12; o `role=alert` com filete `gold-ink` 3px; **cada oponente = criatura num mini-visor 64 (0,25×) + nome + "pet · estágio" (J1, sem faixa)** + "Fight" 44 `aria-label` "Challenge ‹nome›". |
| `TorneioOffline.dc.html` | JOGO-22 offline (D9) | Card `role=status` com `cloud_off` 48 `muted` pelado, a frase 14, a hipótese 12 e "Try again" `outline` 200 — sem vermelho, sem ícone de erro. |
| `TorneioRanking.dc.html` | JOGO-16 · 17 · 18 | **A faixa ANTES do ranking**: "Your tier" 12, `park` 32 FILL `gold-ink` pelado + "Sprout" Fredoka 16, a barra `.meter` em `gold-fill` (a faixa só sobe); "Season ranking" `.lab`; a janela de ±3 em linhas de 36 (posição `tabular-nums`, criatura em mini-visor 32, nome 14, pontos 12) com a **linha "you" em `primary-soft` + anel `primary-ink`** (o idioma de seleção, não um pódio); "See the whole season" `outline`. |
| `TorneioResultado.dc.html` | JOGO-19 · 20 | "Victory" / "Defeat" Fredoka 20 na MESMA tinta; na vitória o vidro 288×112 com a arena `tournament-final` e as duas criaturas a 64 frente a frente; "Against ‹oponente› · N pts" 12 `muted` (13.13); **"Emblems +3" com o número em serifa dourada 20**; "Continue" primário nos dois. |

## Dobra medida a 390×844 (F2 da Home aplicada)

| Artboard | Wireframe aprovado (`../`) | Identidade | |
|---|---|---|---|
| `Main` · `MainClaro` | Torneio ~110; quatro cards até ~530 | cabeçalho 63–107; Torneio **117–189**; "Minigames" 205; Masmorra **223–319** · Arena **329–426** · Dino **436–515** · PPT **525–597**; nav 774 | os cinco cards inteiros antes da nav ✓ (177 px de folga; V4 só morde em viewport curto) |
| `MasmorraLobby` | chrome; janela 150; chips; blurb; dois botões | chrome 11–55; visor **69–245** (com o anel); tags 257–281; blurb 293–361; "Enter" **373–421**; "Go deeper" **429–477**; nota até ~520 | ✓ (tela cheia, sem nav) |
| `Dino` | chrome; janela 160; regras; Start; strip do fim; Jump | chrome 11–55; visor **69–261**; regras 273–290; "Start" **302–350**; strip 362–528; **"Jump" 539–603** | ✓ |
| `PPT` | placar; janela 130; status; jogadas; strip do fim | placar 67–107; visor **119–263**; status 275–295; jogadas **307–351**; strip com "Rematch"/"Exit" **443–491** | ✓ |
| `TorneioArena` | cabeçalho; season; PvP; abas; contagem; alerta; 2 oponentes | cabeçalho 63–107; season 117–145; PvP **155–238**; abas **248–293**; "2 matches left today" 303–320; alerta **330–351**; oponentes **361–443 · 453–535**; nota até ~610 | ✓ (239 px de folga) |
| `TorneioRanking` | faixa ~200; sete linhas até ~560; botão | abas **149–194**; faixa **202–330**; "Season ranking" 338; ranking **360–638** (sete linhas de 36); "See the whole season" **646–694**; nav 774 | a faixa, as sete linhas e o botão cabem ✓ (80 px de folga) |
| `TorneioVazio` · `TorneioTravado` · `TorneioOffline` | PvP; frase/abas; card | PvP **117–200**; abas 237–300; card **292–356** / offline **303–487** (com "Try again" 426–474) | ✓ |

`MasmorraTurno`, `MasmorraAndar`, `MasmorraFim`, `PesadeloIntro`, `PesadeloFim`, `Arena` e `TorneioResultado` são folhas de
estados (`tall`), sem dobra a medir. Na run real da masmorra, chrome + visor + barras + timing somam ≈ 560 px (cabe em 844);
o diálogo do pesadelo mede ≈ 470 px e cabe centrado.

## Decisões de identidade tomadas neste canvas (canvas vence; a confirmar na crítica)

| # | Decisão | Motivo |
|---|---|---|
| D-J1 | **Ícone de cada jogo = Material 24 pelado** (`emoji_events` · `swords` · `bolt` · `play_arrow` · `pan_tool`), nunca o PNG `icon-game-*.png` (pixel fora de vidro) e nunca em box; o card em destaque (Torneio) leva anel 1px `primary-ink` + ícone em ciano. Todos os glifos estão no inventário de 102 — nenhum pedido novo (`directions_run`/`sports_esports` seriam mais literais para o Dino/PPT, mas não valem uma volta ao subset) | HANDOFF §1 (O Visor; ícone nunca em box); SIS achado 1; `tokens.md` §5 |
| D-J2 | **Bits = "42 Bits" em `--sm2-font-mono`, sem ícone**; Emblemas = `military_tech` 20 FILL + o número em `--sm2-font-serif` 16/700 `gold-ink`. As três moedas nunca se parecem (Créditos não aparecem neste canvas) | `CLAUDE.md` 💠/🎖️; `utils/currencies.ts`; SIS-01 |
| D-J3 | **O minijogo é o conteúdo de um VISOR; o chrome é aparelho.** Cada tela de jogo = `.ghdr` vetor (título Fredoka 20, linha 12 `muted`, × 44 `close` pelado — o PRIMEIRO interativo, J5) + `.ring` + `.screen.gv` (cena em `cover`, sprites e FX pixel dentro) + HUD/botões vetor embaixo. O código hoje é um fliperama de tela inteira (`sm-px-arcade-root`, fundo cru) com o cenário fora de qualquer vidro | HANDOFF §1/§6; PRINCÍPIOS §7 (pixel confinado a uma janela); Life Reset (MOB §15.2) |
| D-J4 | **Escalas dentro do vidro**: pet e inimigo 256² a **128** (0,5×, P2 a; inimigo espelhado); FX de batalha 128² a **1×** no vidro e a **64** (0,5×) no mini-visor do popup; espírito do pesadelo 128² a 1×; mãos do PPT 128² a 64; Dino: pet a **64** (0,25× — é a criatura pequena correndo), obstáculos 128² a 64, faixas de chão/parallax a 1×; oponente/resultado do Torneio 256² a 64 (0,25×, D-P9). O hit é o FX `fx-hit` sobre o sprite, nunca `filter: brightness(3)` | §18 P2 (a); §22 D-P9; `fxArt.ts` |
| D-J5 | **As barras de HP são APARELHO** (`.meter` SIS-07, FORA do vidro, como o wireframe): "You" em `primary-fill`, o inimigo/pesadelo em `gold-fill` — "o outro", nunca vermelho; nenhuma delas usa ❤️ (a barra que representa cuidado é a da Home). **Regra (decisão do lead, pendente b):** `muted` reprova porque é a tinta do inerte e a fronteira do próprio trilho; `gold-fill` não é moeda (a moeda é `gold-ink` em serifa com `military_tech`) — e **a barra do outro nunca aparece na mesma tela que Emblemas ou a barra da faixa** (hoje verdade: masmorra, pesadelo e Arena não mostram Emblemas; o Torneio não tem tela de luta). Uma tela futura que junte as duas leituras precisa de outra tinta | guarda 2b; SIS-07; `CLAUDE.md` (o app nunca cobra) |
| D-J6 | **A barra de timing em vetor**: trilho `surface-2` + fronteira `muted`, zona central `primary-soft` com filetes `primary-ink`, marcador `primary-ink` 3px; o botão primário 48 para o marcador. Cores cruas do `TimingBar` (`#4ade80`/`#60a5fa`) saem | SIS-07; `pixel/TimingBar.tsx` |
| D-J7 | **O popup do golpe** = `role=status` SIS-03 com o FX num **mini-visor 64 sem anel** (o slot do Dex, SIS-07) + título Rubik 14/500 `ink` + detalhe 12 `muted`. Nunca Silkscreen no título (V3); "Too slow!" / "You took N damage" na MESMA tinta do "PERFECT!" — dano é leitura, nunca cobrança | DECISÕES §11 V3; PRINCÍPIOS §7; Pet D-P8 (slot) |
| D-J8 | **Nenhuma cor de prêmio nem de perda nos textos de fase**: "Run complete!", "Glitchtama acquired!", "got harder", "Recovered N HP", o relógio da defesa (`#facc15`→`#f87171` no código) — tudo `ink`/`muted`; o tempo e o placar em `tabular-nums`. O que é ganho fala pela frase | `CLAUDE.md` (nada de vermelho de alerta); PRINCÍPIOS §7 |
| D-J9 | **Emoji na copy vira glifo, na escala do Sistema (20)**: "· 💗 +1 heart" → `favorite` 20 FILL `primary-ink` + "+1 heart" (`MasmorraFim`); "✨ Special ready" → `auto_awesome` 20 FILL na linha de estado da Arena (X2/X3). O emoji continua sendo a CHAVE de `FX_ART` no código (não muda) | Rituais X3 (copy sem emoji); `fxArt.ts` |
| D-J10 | **As jogadas do PPT são chips de texto** (`.chip` 44); as mãos em PNG aparecem só DENTRO do vidro, com "VS" em Silkscreen 14 (uma palavra, caixa alta, sobre placa `color-mix(viewport-bg 78%)`) | HANDOFF §1 (Silkscreen só no vidro, ≥ 14, nunca frase) |
| D-J11 | **A ficha da Arena em `.chip.tag`** (HP/DMG/Essence, valor em `ink`) — a ficha é a da Ficha (Pet), e lá o dado é Rubik `tabular-nums`; sem `military_tech` decorativo no lobby (a criatura está no visor) | §22 (Ficha); SIS-03 |
| D-J12 | **O Torneio replica o que o código já fez bem** (é a superfície mais próxima do canvas: sem `sm-px-*`, `Icon`, Emblemas em serifa, faixa antes do ranking, `TIER_ICON`) e corrige três coisas: o sprite do oponente solto a 44 → mini-visor 64; as abas em botões → `.tabs` com sublinhado (SIS-04, como a Ficha); o `role=alert` sem filete → `.alert` `gold-ink`. O oponente = criatura + nome + "pet · estágio" (J1, veto 3b: sem faixa) | DECISÕES §11 J1/J4; `TournamentPage.tsx` |
| D-J13 | **Linhas do ranking: criatura num mini-visor 32 com o sprite 256² a 32 (0,125×)** — a única escala fracionária do canvas, declarada como **transição CONDICIONADA** (decisão do lead, pendente a): medido pela crítica, a caixa de alfa a 0,125× é **16×14 px de criatura** (`lumel`; `serah` 30×18, `orrin` 22×24) — um ponto de cor, não identificação; a linha se identifica pelo nome e a "you" pela tinta. Trocar para 64 quebra a dobra (7×68 = 476). **Condição: a `squad-arte` entrega um ícone 32² por linha × tier (9 × 4 = 36) em grade a 1×**; até lá o `staff-frontend` renderiza os 256² a 32 com filtro (`image-rendering:auto`), nunca `pixelated` | §19 X11 (transição); Pet D-P9 |
| D-J14 | **O switch travado é inerte por FORMA** (borda tracejada `muted`, botão `muted`, `aria-disabled`, fora do Tab), nunca por opacidade; a frase do Vínculo é informação (12 `muted`), sem âmbar — não é aviso, é a régua do servidor | Atividades F1; `bond.ts` (`canPvp` nos dois lados) |
| D-J15 | **Cenas 1080×1920 em `cover` são ilustração (transição)**: `dungeon-1/3/4/5/7`, `minigame-dino/rps`, `tournament-final` (75–170 mil cores) entram com `image-rendering:auto` no vidro; sprites/FX/faixas ficam `pixelated`. Pedir à `squad-arte` cenas 176×88 (e 154×80 para os diálogos) em grade a 1× | §19 X11; §18 P2 |
| D-J16 | **Anotações dentro do telefone** só as do wireframe (`.strip`, `.tagd` `sample`/`novo`/`JOGO-NN`, as `.note` 12) — nenhuma nova | D-A9; D-R12; D-P12; D-E12 |

## Contraste (WCAG 2.x, hex do `index.css` bloco ONDA 1)

| Par | Onde | Escuro | Claro |
|---|---|---|---|
| `ink` / `bg` | títulos dos jogos, "Games", Bits em mono, frases de fase, placar do PPT | 16,15 | 14,96 |
| `muted` / `bg` | "Play with your Soulmon…", "Floor 1/5 · scene", blurb da masmorra, regras do Dino, "2 matches left today", `.note`, `.lab` | 8,83 | 5,35 |
| `ink` / `surface` | título dos cards, popups, oponentes, "Victory"/"Defeat", "Enable PvP above…" | 13,59 | 16,23 |
| `muted` / `surface` | descrições dos cards, detalhe dos popups, "pet · estágio", "Against … · N pts", "Your tier" | 7,43 | 5,80 |
| `muted` / `surface-2` | tags (`Every week`, `Ranking`, `Best`, `HP`…), posição/pontos do ranking sobre o card | 6,30 | 5,09 |
| `ink` / `surface-2` | o valor dentro das tags (`1240`, `40`, `Fire`) | 11,52 | 14,23 |
| `primary-ink` / `bg` | ícone do Torneio, aba ativa + sublinhado, marcador da barra de timing, `favorite`/`auto_awesome` na copy | 13,21 | 5,55 |
| `primary-ink` / `primary-soft` (sobre `surface`) | a linha "you" do ranking | 7,69 | 5,21 |
| `on-primary` / `primary-fill` | "Enter the dungeon", "Attack!", "Dodge!", "Push!", "Fight", "Jump", "Continue", "Good morning!", "New run", "Rematch", "Start" | 12,38 | 6,02 |
| `gold-ink` / `bg` | Emblemas (`military_tech` + número em serifa) no cabeçalho | 10,51 | 5,41 |
| `gold-ink` / `surface` | número dos Emblemas no resultado, ícone da faixa, troféu de season, filete do `role=alert` | 8,84 | 5,87 |
| `primary-fill` / `surface-2` (não-texto) | a barra "You", a stamina, o switch ligado | 9,43 | 5,28 |
| `gold-fill` / `surface-2` (não-texto) | a barra do inimigo/pesadelo, a barra da faixa | 5,59 | 4,20 |
| `muted` / `surface-2` (não-texto) | fronteira dos `.meter` e do trilho de timing, anel dos `outline`, borda do switch | 6,30 | 5,09 |
| `primary-ink` / `surface-2` (não-texto) | filetes da zona central da barra de timing, anel do card em destaque | 9,43 | 5,28 |
| `viewport-ring` / `bg` (não-texto) | o anel de cobre dos visores | 5,92 | 3,66 |
| `primary-ink` / `bg` (glifo 20 na copy) | `favorite` do coraçãozinho (sobre `surface`: 11,12), `auto_awesome` da Arena | 13,21 | 5,55 |
| `viewport-ink` / placa `color-mix(viewport-bg 78%)` | "VS" (Silkscreen 14, dentro do vidro) — pior caso sobre cena branca / preta | 8,46 / 17,30 | 7,15 / 15,72 |
| `line` / `surface` (decorativo) | a linha sob o chrome da run e as bordas dos cards | 1,32 | 1,25 |

Nenhum par de TEXTO abaixo de 4,5 nos dois temas. `gold-fill`/`surface-2` no claro (4,20) é não-texto e passa o piso de 3:1.
**Nenhuma opacidade em nó nenhum do telefone** (medido nos 17). `--sm2-danger-*` não aparece no canvas. O vidro é sempre
escuro (`viewport-bg #071413`/`#0E2422`) — a cena, os sprites e a placa "VS" não mudam de tema.

## Medição — rodada 2 (17 artboards, `measure_jogos.mjs`, Chrome 420×900 DPR 1)

0 texto < 12 px (o `favorite`/`auto_awesome` computam **20 px**) · 0 overflow do telefone · 0 alvo interativo < 44 · 0 opacidade < 1 (CSS e inline) · 0 `text-shadow` ·
0 Silkscreen fora de `.screen` · 0 `<img>`/`background-image` PNG fora de `.screen` · escalas: 0,5× (pet/inimigo/mãos/FX no
popup/obstáculo), 1× (FX no vidro, espírito, faixas do Dino), 0,25× (Dino, oponentes, resultado) — inteiras em DPR 2/4 (em DPR 3 nenhuma das três é inteira: 0,75×/1,5× — é a transição que a P2 (a) já declarou; R10); a
única fracionária é o mini-visor 32 do ranking (0,125×, transição declarada, D-J13) · fidelidade `cmp.py` **16/16**: mesma
ordem de foco (`fo` idêntico em todos), mesmos `role`s, mesmos `aria-label`s (o do inimigo na `MasmorraTurno` corrigido de
`"Sand Wisp <span class="tag">sample</span>"` para `"Sand Wisp"` — o wireframe tinha o `<span>` dentro do atributo);
diferenças de texto = nomes de glifo Material, os placeholders "PIXEL WINDOW"/"PET"/"ENEMY"/"HAND" que viraram arte, "vs" →
"VS" (Silkscreen caixa alta), "💗 +1 heart" → glifo + "+1 heart" (D-J9), "2.4s" separado num `<span class=num>`, e a linha da Arena "Charge 2/3" → "Special ready" (X3). **Composição pixel a pixel (X1)**: `fx-sparkle` em 178–306 × 8–136 e o pet em 16–144 × 40–168 (`MasmorraFim`); 152–280 × 8–136 e 8–136 × 8–136 (`PesadeloFim`) — **0 px de sobreposição, 0 px cortado**. **Visor da run**: 176 nas quatro fases (`Turno`/`Andar`/`Fim`) + Lobby (X4). Alturas do `canvas.json` = `scrollHeight` medido de novo (`MasmorraFim` 2002, `PesadeloFim` 1753, `Arena` 2338).

## Achados (divergências com o código de hoje — para o `staff-frontend`)

1. **Cinco PNGs de ícone na página** (`icons/games/icon-game-*.png`) → Material 24 pelado (D-J1); o badge de Bits com ícone → mono sem ícone (D-J2). **Cor dos Bits = `ink` (X5, decisão do lead)**: `utils/currencies.ts` › `bitsStyle` fixa `--sm2-primary-ink` e documenta a sobrescrita por `ink` como bug; o canvas Sistema (SIS-07, aprovado pelo dono) põe o número em `ink` e deixa a distinção na família mono. Quando a página migrar, `bitsStyle.color` vira `--sm2-ink` (com o par `ink/bg` 16,15 / 14,96 no `tokens.contrast.test.ts`) e o comentário do arquivo é reescrito.
2. **Cada minijogo é um fliperama de tela inteira** (`sm-px-dark-ctx sm-px-arcade-root`, `sm-px-arcade-bar/-value/-label/-close`, fundos crus `#07090f`/gradientes) → chrome vetor + visor (D-J3). `ArenaGame.tsx` continua no bundle (HANDOFF §6) e o canvas o desenha porque JOGO-11 foi aprovado.
3. **Campo de batalha da masmorra** (`sm-px-card` com `scene.bg`, overlay VHS animado, sprites a 96/84 com `drop-shadow`, `brightness(3)` no hit) → vidro 348×176, sprites a 128, FX `fx-hit` no lugar do `filter` (D-J4). O overlay VHS é movimento contínuo sem propósito — sai (`prefers-reduced-motion` já não o lia).
4. **Barras de HP dentro do campo em `#4ade80`/`#f87171`** → `.meter` vetor fora do vidro, `primary-fill`/`gold-fill` (D-J5).
5. **`TimingBar` em cores cruas + `PixelButton`** → vetor por token (D-J6).
6. **Popups em `sm-px-card` + Silkscreen + `popup.color` (vermelho no "Too slow!")** → `role=status` SIS-03 com mini-visor 64 (D-J7); `FX_ART[popup.icon]` continua sendo o mapa (o emoji é chave, não copy).
7. **Textos de fase em `sm-px-arcade-value`** ("PERFECT!", "Floor 1 cleared!", "Sand Wisp defeated!", "Run complete!") → Rubik 14/500 (V3); cores de prêmio/perda (`#facc15`, `#4ade80`, `#c084fc`, o relógio que fica vermelho) → `ink`/`muted` (D-J8).
8. **O inimigo derrubado some sem FX** → `fx-defeat` 128² a 1× na caixa do inimigo; **a run completa sem FX** → `fx-sparkle` a 1× NA MESMA caixa (a run acabou onde o último inimigo estava — X1), nunca sobre o pet; **o vidro da run tem altura fixa (176) em todas as fases** (X4).
9. **"· 💗 +1 heart" e "✨ Special ready" com emoji na string** → glifo 20 + texto (D-J9).
10. **`NightmareBattle`** (`sm-px-card sm-px-dark-ctx`, barras 104×10 cruas, cena fora de vidro) → `.dlg` + visor 288×160 + `.meter`; `role=dialog`/`aria-modal`/`useDialogA11y` já existem e ficam; **a instrução da barra (J3) não existe** → linha 12 `[novo]`.
11. **Dino**: pet a 46 (`DINO_S`, 0,18×) → 64 (0,25×); chrome `pets` 20 + Silkscreen → Fredoka 20 + "Best N" 12; "Jump" em `PixelButton` com `expand_less` → `.btn.pri` 64 sem ícone; o placar desenhado no canvas fica dentro do jogo (se virar DOM, é Silkscreen ≥ 14 DENTRO do vidro).
12. **PPT**: mãos em `<img>` nos botões (`sm-px-chip-btn`) → chips de texto (D-J10); placar em Silkscreen → Rubik `tabular-nums`; `rpsScene` como fundo da tela → dentro do vidro.
13. **Arena**: ficha em `sm-px-arcade-label/-value` com três cores → `.chip.tag` (D-J11); `military_tech` 32 no lobby e no erro → sai / `cloud_off`.
14. **Torneio** (já migrado): sprite do oponente a 44 solto → mini-visor 64; abas em botões → `.tabs` com sublinhado; `role=alert` sem filete → `.alert`; ranking com sprite solto → mini-visor 32 (transição, D-J13); o switch travado por `disabled` nativo → inerte por forma (D-J14). O que o código já faz certo e o canvas só replica: Emblemas em `emblemStyle` serifa, faixa antes do ranking, `TIER_ICON`, janela de ±3, `cloud_off` no offline, `tournamentWindowLabel`.
15. **O × da masmorra sai da run sem confirmação em qualquer fase** (V2, STATUS) — o canvas replica (D11); os cards da página sem `aria-label` e o "N match(es)" (J5) ficam como achados a11y do STATUS.
16. **A11y para o STATUS (junto de J5)**: "Fight" com nome acessível "Challenge ‹nome›" — o texto visível não está contido no nome (WCAG 2.5.3 Label in Name; código `TournamentPage.tsx` e wireframe; R4); anotação `(fightError, B5)` dentro do `role=alert` e a `.note` "top tier" dentro do card da faixa (só no wireframe — R3; vale checar o padrão no código).
17. **Nenhum glifo novo pedido**: `bolt, close, cloud_off, emoji_events, favorite, leaderboard, military_tech, pan_tool, park, play_arrow, swords` + os da nav — todos no inventário de 102.

## Pendentes

- **Sem pendência do dono.** Nenhum token novo; nenhum glifo fora do inventário; nenhuma estrutura reaberta; nenhuma cor de
  perigo. Pendentes do lead (a) e (b) decididos e escritos em D-J13 e D-J5.
- Para o lead (estruturais, do wireframe `../` — registro, não reabertura): R5 a derrota do Torneio sem visor enquanto a
  vitória tem; R6 a folha "luta" do pesadelo sem visor (o `NightmareBattle` mantém os sprites — o visor da proposta persiste);
  R9 "Go deeper — 30 Bits" sem o saldo na tela.
- Para a `squad-arte` (pedidos, com medidas): cenas de jogo em grade a 1× (174×88 para os visores de 348×176; 144×80 para os
  diálogos de 288) no lugar das 1080×1920 (D-J15); **ícones-ficha 32² por linha × tier (36) para o ranking — CONDIÇÃO da D-J13**
  (hoje 16×14 px de criatura); 64² para o Dino e os oponentes (R10: 0,25× = 0,75× em DPR 3); um FX de "derrota do pet" NÃO é
  pedido — na derrota o pet fica inteiro (02 §51).
- Para o wireframe (`../`): o `aria-label` da barra do inimigo com `<span>` dentro do atributo (`MasmorraTurno`); as duas
  anotações dentro de nós semânticos (R3) — registro, não reabertura.

## Fontes

`ActivitiesPage.tsx` · `DungeonGame.tsx` · `pixel/TimingBar.tsx` · `DinoGame.tsx` · `RPSGame.tsx` · `ArenaGame.tsx` ·
`NightmareBattle.tsx` · `TournamentPage.tsx` · `utils/fxArt.ts` · `utils/dungeonScenes.ts` · `utils/sprites.ts`
(`DUNGEON_SPIRIT_SPRITE`, `DUNGEON_LINE_SPRITES`) · `utils/currencies.ts` · `utils/tournamentTiers.ts` ·
`utils/tournamentSeason.ts` · `utils/bond.ts` · `CLAUDE.md` (⚔️ 💠 🎖️ 🎪) · 02 §51 · 02 §54 · 03 §4.4 · 03 §4.14 ·
PRINCÍPIOS §7 · MOB §15.2 · DECISÕES §11 (J1–J5, V1–V4, S1–S4) · §18 (P1–P3) · §19 (X11) · §20 (F1) · §21 (X3) · §22
(D-P8/D-P9) · REGISTRO 13.13 · guarda 2b/2c/3b/3c · T7 · D9 · D11 · `src/styles/tokens.md` · `tokens.contrast.test.ts` ·
`HANDOFF-IDENTIDADE.md` §1, §4–§7.
