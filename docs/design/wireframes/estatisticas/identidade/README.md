# Canvas "Estatísticas" — identidade (Fase 2, décimo canvas) · rodada 2 (X1–X4 da `CRITICA.md` aplicados, 20/09/2026)

> **Rodada 2 — o que mudou:** X1 a linha **Serah sai da amostra** do `Bestiario` (STAT-06) — `serah-rookie/-champion/-ultimate.png` são **tiras de 4 quadros** dentro do 256² (quatro corridas de colunas do alfa; só `serah-mega` é quadro único), então o mini-visor a 0,25× mostrava quatro pintinhos e as silhuetas quatro vultos; a amostra passa a Ignar · Lumel · **Nautilu** (quadro único), a nota do artboard leva a tag `X1`, e o pedido à `squad-arte` + a régua anti-tira entram abaixo (Pendentes / achado 15) · X2 `Lucky → star` no mapa D-S2 (o `casino` é o glifo da aba "Games" na nav da mesma tela) · X3 o `Vazio` (tall) ganha o **marcador de dobra tracejado a 774** (a peça `.dobra` do `GrupoSemGrupo` do Social) — a dobra do primeiro uso agora é provada no artboard · X4 README: `squad-arte` com pedido, "corte 0 % nas 36" com a ressalva das tiras, o mapa D-S2, a nota da dobra; R1 os **sete lugares do 24 → 36** para o cartógrafo; R2 o aceite de `hideMetrics` cobre também o `progressbar` do vínculo e "Level N". Re-medido: 0/0/0/0/0/0/0, fidelidade 7/7 (a única troca de rótulo é "Serah — rookie" → "Nautilu — rookie", X1).

> Dono: `soulmon-visual-designer` · 20/09/2026 · HANDOFF-IDENTIDADE §1, §4–§7 · base: canvas **Sistema** aprovado
> (`../../sistema/identidade/`, DECISÕES §18 — P1 espaço 4/8/12/16/24/32 + 2, **P2 = (a)** 256² a 128 CSS, **P3** nav 32),
> **Home** (§19: D-H1…D-H9, P4–P7), **Atividades** (§20: tinta nunca alpha, gerador reprova `opacity < 1`), **Rituais**
> (§21), **Pet** (§22: D-P1 sub-aba ativa em `primary-soft`, D-P2 heroína 128 no vidro 192², D-P7 silhueta por
> `mask-image`, D-P9 forma anterior a 64, slot SIS-07 = mini-visor sem anel), **Onboarding-funil** (§23) e **Evolução**
> (§24: D-E3 nó com sprite a 64 e silhueta por máscara, corte 0 %).
> Tudo que as seis `CRITICA.md` anteriores fecharam (Home F1/F2/X1–X12, Atividades F1/X1–X9, Rituais X1–X5, Pet X1–X7,
> Onboarding X1–X6, Evolução X1–X9) já entra aqui de saída: nenhuma opacidade no telefone, tinta nunca alpha, escala inteira
> em toda arte, corte 0 % nos vidros, silhueta por máscara, ícone nunca em box, Silkscreen só no vidro (aqui: nenhuma).
>
> **Cada artboard = o wireframe de mesmo nome com a identidade aplicada** — mesma hierarquia, mesmos estados, mesma copy
> EN, mesma ordem de foco (`.fo` idêntico nos 7 pares). Estrutura aprovada em DECISÕES §13 (E1–E5, V1–V5, S1–S4) — **nada
> reaberto**: o Vínculo pela PALAVRA, a data sem ano e sem epíteto, o vazio com a forma corrigida (B3), "só o dígito" no "0"
> (decisão do dono de 15/09, E4 revogada), "The journey" como UM cartão contínuo, `formatDate` relativa até 7 dias, STAT-10 fora.
>
> **Regras que mordem, todas respeitadas no desenho:** traço de nascimento sempre positivo (ícone Material, não pixel — `A15`
> obsoleto); bestiário = coleção com silhueta para o que não apareceu, contagem NUNCA percentual nem "faltam N" (**36 artes = 9
> linhas × 4 tiers**, o código de hoje); constância "N das últimas 7", nunca streak (nenhum streak nesta tela — `streakDays` é o
> nome do campo dos dias completos, que só acumulam); sem score de sono; `hideMetrics` esconde números e preserva recompensas
> (achado 6: hoje não chega à `StatsPage`); nada de vermelho; nenhum número de moeda/XP.

## Como abrir

O `<style>` de cada `.dc.html` é o bloco do `Sistema/Main.dc.html` **copiado** (tokens `--sm2-*`, átomos, rodapé) + o bloco
`HOME (composição)` (anel/vidro, nav, `.strip`, `.sticky`) + o bloco `ATIV (composição)` (`.dobra`, `.miniglass`) + um bloco
`STATS (composição)` só de layout (sub-abas, o cartão do vínculo, os traços, a jornada com o nascimento em vidro, os
mini-visores do bestiário, os slots do álbum, a estação, as listas) — nenhum token novo, nenhum literal de cor. As mesmas podas
da rodada 2 de Atividades (+ a `.quiet-danger` da Evolução R5) e o mesmo `guard()` no gerador (reprova `opacity < 1`,
`text-shadow`, **qualquer `.pix`** — não há HUD nesta tela — e `<img>`/`mask-image` fora de `.screen`).
Imagens e fontes por caminho relativo ao repo. Servir a raiz do repo:
`npx -y serve -l 8776 D:/Soulmon/repo` → `http://localhost:8776/docs/design/wireframes/estatisticas/identidade/Main.dc.html`.
Gerador (fora do repo, no scratchpad da sessão): `gen_stats.py` (importa `gen_ativ_head.py` e o bloco `STYLE_ATIV` de
`gen_ativ.py`); medição `measure_stats.mjs`; diff de fidelidade `cmp.py` — os `.dc.html` são a fonte commitada.

## O que cada artboard prova

| Artboard | Id | Prova |
|---|---|---|
| `Main.dc.html` | STAT-01 (1/3) | O Vínculo primeiro, como PALAVRA: "BOND LEVEL" em `.lab` 12/500, **"Companion" em Fredoka 24**, "Level 3" em 12 `muted` `tabular`, o **medidor SIS-07** em vetor (12px, `surface-2` + fronteira `muted`, `primary-fill` a 40 %, `role=progressbar` 0–100 rotulado) e a frase de que nada desce. "Who they are" com o cabeçalho `.ch` (`psychology` 24 `muted` + Fredoka 16) e um **ícone Material 24 pelado em `primary-ink` por traço** (`restaurant` Foodie) e por ritmo (`event_repeat` Steady). "The journey" (`auto_awesome`) com o ÚNICO número grande da tela (Fredoka 24 `tabular`, "12"), "34 days together" 12 `muted` e, dentro, o **cartão de nascimento como VISOR**: sprite `igni-rookie` 256² a **128** centrado no vidro **192²** com anel de cobre (raio 20) — a MESMA peça do reveal, da Home e da Ficha; embaixo, aparelho: "BORN · SEPTEMBER 3" em `.lab`, o nome Fredoka 24, "You said…" 12 `muted`. Sub-abas = três `.btn.sm` 44, ativa em `primary-soft` + `primary-ink` + anel 1px (Pet D-P1). |
| `MainClaro.dc.html` | STAT-01 claro | O mesmo DOM sob `[data-theme=light]` — `ink` `#0E2422` sobre `bg` `#F1F7F5` / `surface` `#FFFFFF`, `primary-ink` `#0B6F68`, `muted` `#4E6B66`, anel `#B0722F`; o vidro do nascimento continua escuro (`viewport-bg #0E2422`): o pixel não muda de tema. |
| `JornadaRolada.dc.html` | STAT-01 (2/3) | O MESMO cartão "The journey", continuado (topo tracejado, nenhum separador entre os blocos — V1 adiado, não reaberto). "Encounters" (`swords`) com "7 of 36 dungeon creatures" `tabular` e linhas de **4 mini-visores 64²** (SIS-07: slot = mini-visor sem anel, `viewport-bg`, raio 4): o visto com o sprite 256² a **64** (0,25×, `role=img` "Ignar — rookie"), o não visto como **silhueta por `mask-image`** em `color-mix(viewport-bg 58%, viewport-ink)` (`aria-hidden`). "Forms lived" com "2/11" e a grade `minmax(84px, 1fr)` de slots iguais: a vivida com nome 12/500 `ink` + data 12 `muted` `tabular`, a não alcançada com a silhueta e "???" 12 `muted`. Os feitos e "Started for" em 12 `muted`. |
| `EstacaoListas.dc.html` | STAT-01 (3/3) | "The season" com `calendar_month` 24 `muted` pelado (é calendário, nunca prazo), a descrição 14, os dois caminhos como `.path` — rótulo 12 `muted` + fração "7/20" em `ink` 500 `tabular` à direita (só `current ≥ 1`), "One path is enough — never all three." e "Medals kept: 2 — forever." com `military_tech` 20 FILL 1 em **`gold-ink`** (posse guardada = âmbar). As duas listas (`event_repeat` / `task_alt`) com o **emoji da pessoa como CONTEÚDO** (20px pelado numa coluna de 24 — nunca em caixa), nome 14 com reticências, "done 14×" / "3h ago" / "Sep 03" em 12 `muted` `tabular`. O strip "entre estações" com a mesma peça e o rótulo trocado. |
| `Vazio.dc.html` | STAT-02 | "Just met" em Fredoka 24, "Level 0" quieto, o trilho SIS-07 a 0 % (é o medidor do PRÓXIMO nível, como o código — não coleção); um traço só (`restaurant`, sem ritmo); **"0" só como dígito** (V2, decisão do dono) com o cartão de nascimento inteiro (o vidro 192²); a estação só com o rótulo; as duas listas com a frase de FUTURO em 12 `muted`. Sem ilustração, sem CTA, sem "0 of 36", sem "0/11". |
| `Nascimento.dc.html` | STAT-03 · 04 | O cartão é um visor: sprite 128 (0,5×) no vidro 192² com anel de cobre, `role=img` com o nome (o `alt` do código, dito uma vez); "BORN · SEPTEMBER 3" `.lab`, nome Fredoka 24, "You said…". Demo = `ignar-rookie` (o personagem escolhido, fallback `getSpriteForStage('rookie', demoCharacterId)`) e o nome do demo, sem "You said"; sem `bornAt` = "BORN" sozinho. **Sem epíteto** nos três (E2/S2 — o `App.tsx` não o passa; o componente o aceita). |
| `Bestiario.dc.html` | STAT-05 · 06 · 07 | Ausente = o cartão NÃO monta (a jornada mostra "— no Encounters card —"); parcial = "7 of 36" com três linhas (Ignar 2, Lumel 1, Nautilu 1 — X1: Serah fora da amostra, é tira) em mini-visores 64² + silhuetas; completo = "36 of 36", a mesma prateleira cheia (duas linhas mostradas), sem troféu, sem "100 %". |
| `Album.dc.html` | STAT-08 · 09 · 10 | A vivida com arte a 64 no slot, nome e data (`Sprout · Sep 3`, `Ember · Sep 18`); a silhueta com "???"; save antigo sem `reachedAt` = nome sem data (a linha é omitida, D11); STAT-10 não desenhado (D4). |

**Medido no DOM (8 artboards, `getComputedStyle` + `getBoundingClientRect` em todos os nós do `.phone`, Chromium via Playwright
em `localhost:8776`, DPR 1 — `measure_stats.mjs`):** **0** nós de texto < 12px dentro do `.phone` (o wireframe tinha 8px nas
molduras "ART" e 9px no "ART 112" — viraram sprite) · **0** elementos vazando a largura de 390 · **0** alvos < 44 entre
`button/checkbox/textbox/radio/combobox/link/summary` (as três sub-abas 113,3×44; a nav 78×68; nada mais é botão — como o
wireframe) · **0** Silkscreen (nenhuma `.pix` no canvas: a Estatísticas não tem HUD; o vidro só carrega criatura) · **0** nós
com `opacity` < 1, **0** com `opacity()` em `filter` e **0** com `text-shadow` (a data do álbum em `opacity .7` no código
virou tinta `muted`) · **0** `<img>`, `background-image`, `border-image` ou `mask-image` fora de `.screen` (os 7 + 3 + 12 + 3
sprites e as silhuetas estão todos dentro de um vidro 192² ou de um mini-visor 64²) · **12 glifos usados, 12 no inventário de
102** (`auto_awesome, calendar_month, casino, event_repeat, home, menu, military_tech, psychology, restaurant, storefront,
swords, task_alt` — contando a nav; nenhum fora do subset; os outros traços/ritmos mapeados no achado 2 também estão nele:
`volunteer_activism, pan_tool, star, wb_sunny, bolt, spa`) · alturas do `canvas.json` = `scrollHeight` do `.ab`.
**Escala inteira em toda arte:** sprite 256² a **128** (0,5×) no vidro 192² do nascimento (o quadrado 192 contém 128 — corte 0 %);
256² a **64** (0,25×) nos mini-visores 64² do bestiário e nos slots 64² do álbum — **corte 0,00 % nas 36 artes de
`DUNGEON_LINE_SPRITES`** — 33 de quadro único; **3 são tiras** (`serah-rookie/-champion/-ultimate`, X1: cabem inteiras, a métrica de corte não vê tira; fora da amostra, pedidas à `squad-arte`) — (reamostragem `any(4×4)` do alfa contra a máscara do quadrado 64 com raio 4: nenhuma arte toca os
cantos; a mais larga, `kaelen-champion-virus` x 8–245 / y 12–241, vira x 2–61 / y 3–60 a 64, ainda dentro do raio) e nas 4
`igni-*` do álbum (x 0–255, y 20–235 → y 5–59: a largura inteira cabe, os cantos ficam livres).
**Fidelidade (`cmp.py`, 7 pares):** a sequência dos marcadores de foco (`.fo`) é **idêntica nos 7**; os `aria-label` diferem só em "Serah — rookie" → "Nautilu — rookie" (X1, a troca de amostra) e no nome no vidro do nascimento; a sequência de `role` é
idêntica em 4 e difere em 3 por UMA adição declarada — `role=img` + `aria-label` = nome no vidro do cartão de nascimento
(`Main`, `Vazio`, `Nascimento` ×3), que o wireframe desenhava como caixa "ART 112" sem papel e o código como `<img alt={name}>`
(o leitor ouve o nome uma vez); os `aria-label` são idênticos nos 7 (a única adição é esse nome). A copy EN é a mesma; as
únicas diferenças de texto são (a) as ligatures dos ícones (`act`→`casino`, `evo`→`auto_awesome`, `shop`→`storefront`; os
cabeçalhos ganham `psychology`/`swords`/`calendar_month`/`event_repeat`/`task_alt`/`military_tech`), (b) "ART"/"▲" das
molduras cinza que viraram sprite/silhueta, (c) **"7 of 36" / "36 of 36" / "9 lines × 4 tiers = 36"** no lugar de 24 — o
código de hoje (`DUNGEON_LINE_NAMES` tem 9 linhas; `BestiaryCard` deriva `linhas.length × 4`), declarado no artboard com a tag
`código 20/09` e registrado para o cartógrafo (achado 5), (d) "20 complete days during the season" sem o " ·" (a fração foi
para a direita da linha, não para o fim da frase — mesma copy, outra posição), (e) as notas dos strips que citavam
`brightness(0) opacity(.35)` passam a citar `mask-image`.

## Dobra medida a 390×844 (F2 da Home aplicada)

A página rola (vínculo → quem é → jornada → encontros → formas → estação → listas); a pergunta é "o que da tela aparece antes
da nav (774)?":

| Artboard | Wireframe aprovado (`../`) | Identidade | |
|---|---|---|---|
| `Main` · `MainClaro` | vínculo ~120–260; "Who they are"; "The journey" com o "12" e o começo do cartão de nascimento (ART 112) | sub-abas 65–109; vínculo **113–274** (inteiro); "Who they are" **282–429** (inteiro); "The journey" 437→: o "12" **482–511**, "34 days together" 519–536, o cartão de nascimento 544→ com o **vidro 192² inteiro (557–757)** antes da nav; "BORN"/nome abaixo da dobra; `.sticky` 880 | a pergunta ("what have we two lived through") responde antes de rolar: a palavra do vínculo, quem ele é, o único número grande e a criatura no vidro ✓ (17 px de folga do anel até a nav) |
| `JornadaRolada` | encontros ~150–330; "Forms lived" ~340–560 | `.sticky` 113–132; o cartão continuado 140→; "Encounters" **193–430** (as duas linhas inteiras); "Forms lived" 494→ com a **primeira fileira de 3 slots inteira** (548–651) e a segunda cortada pela nav; feitos/"Started for" abaixo | as duas prateleiras aparecem antes da nav ✓ |
| `Vazio` (tall, **marcador `.dobra` a 774** — X3) | vínculo; traço; "0" + cartão | vínculo 113–274; "Who they are" **282–381**; "The journey" 389→, "0" 434–462, o cartão 470→ com o **vidro inteiro (483–683)**, "BORN · SEPTEMBER 3" 695–709, "Pixel" 717–746 e "You said…" 754–772 — tudo acima do marcador (2 px de folga; o cartão fecha a 785, 11 px abaixo) | o primeiro uso mostra a criatura E o nome antes de rolar ✓ — agora visível no artboard |
| `EstacaoListas` | estação; as duas listas | `.sticky` 113–132; "The season" **140–363** (inteira); "What you repeat most" **371–517**; "Latest completions" **525–703** (inteira, 4 linhas); a nota 12 até ~760 | a estação e as duas listas cabem antes da nav ✓ (o strip "entre estações" fica abaixo, é anotação) |

`Nascimento`, `Bestiario` e `Album` são folhas de estados (`tall`), sem dobra a medir; o `Vazio` também é `tall`, mas é uma TELA (STAT-02) — por isso leva o marcador.

## Decisões de identidade tomadas neste canvas (canvas vence; a confirmar na crítica)

| # | Decisão | Motivo |
|---|---|---|
| D-S1 | **O Vínculo é a PALAVRA em Fredoka 24** (`text-xl`, não o `text-2xl` do código): é a leitura dominante da tela (E1), mas divide o tamanho com o nome da criatura no cartão de nascimento (também 24) e com o único número grande (24) — três Fredoka 24, três respostas da mesma pergunta; "Level N" 12 `muted` `tabular` como legenda; o **medidor SIS-07** (12px, `surface-2` + `muted` 1px, `primary-fill`) no lugar da barra de 8px arredondada — `role=progressbar` 0–100 e o rótulo intactos. No vazio o trilho fica a 0 %: é o medidor do PRÓXIMO nível (o código o desenha), não um medidor de coleção — o Dex do Pet suprimiu a barra de coleção no zero (P1), regra que não se aplica aqui | DECISÕES §13 E1; REGISTRO 13.7; SIS-07; Pet P1 (por contraste) |
| D-S2 | **Traço e ritmo com ícone Material 24 pelado em `primary-ink`** (`restaurant` Foodie · `volunteer_activism` Cuddly · `pan_tool` Stubborn · **`star` Lucky** (X2 — `casino` é a aba "Games" na nav da mesma tela) · `wb_sunny` Early Bird · `event_repeat` Steady · `bolt` Burst · `spa` Balanced — todos no subset de 102); o nome em 14/500, a frase em 14. Nunca pixel: o traço é aparelho, não visor — `A15` (traços em pixel) está obsoleto desde o `PLANO-DESIGN` §1 | CLAUDE.md ✨ (todos positivos); HANDOFF §1 (O Visor); STATUS (A15 obsoleto); `tokens.md` §5 |
| D-S3 | **Cabeçalho de card = `.ch`**: ícone 24 `muted` pelado + Fredoka 16 (`.h3`) — a MESMA peça do painel de rituais da Home (`task_alt` + "Daily rituals"); `psychology` Who they are · `auto_awesome` The journey · `swords` Encounters · `calendar_month` The season · `event_repeat` What you repeat most · `task_alt` Latest completions. O ícone é aparelho (identifica a prateleira), o `muted` o mantém abaixo do conteúdo | Home D-H (painel); regra do dono (ícone nunca em box) |
| D-S4 | **O cartão de nascimento é o MESMO visor do reveal**: sprite 256² a 128 (0,5×, P2 a) centrado num vidro 192² com anel de cobre (raio 20), dentro do card `surface`; embaixo, aparelho — "BORN · <data>" em `.lab` 12/500 caixa alta, o nome Fredoka 24 (`text-xl`, como o código), "You said…" 12 `muted`. O `<img 112>` solto do código (0,44×) sai. `role=img` + `aria-label` = nome no vidro, `img alt=""` (o `alt={name}` do código, dito uma vez). Sem epíteto aqui (E2/S2), embora o componente o aceite: quando o `App.tsx` passar, a linha `gold-ink` 12/500 entra entre o nome e o "You said" | DECISÕES §13 E2/S2; §22 D-P2; §18 P2 (a); `BirthCard.tsx` |
| D-S5 | **Encontro = mini-visor 64²** (SIS-07: slot é um mini-visor sem anel, `viewport-bg`, raio 4) com o sprite 256² a **64** (0,25×) — a escala da forma anterior da Ficha (D-P9) e do nó da árvore (D-E3): uma criatura, um tamanho por contexto; 4 por linha (4 × 64 + 3 × 8 = 280 ≤ 334); o nome da linha 12/500 acima; `role=img` "linha — tier" só no visto (o `alt` do código). A moldura 56×56 com `<img>` solto (0,22×) sai | Pet D-P7/D-P9 (slot, escala); Evo D-E3; SIS-07 |
| D-S6 | **Silhueta por `mask-image`** em `color-mix(viewport-bg 58%, viewport-ink)` (`#667271` / `#6A7C79`, 3,76 / 3,69 sobre o vidro) — bestiário e álbum; `aria-hidden`; nunca `filter: brightness(0) opacity(.35)` (alpha), nunca cadeado ("?" convoca curiosidade) | Pet D-P7; Evo D-E3; Atividades F1; PRINCÍPIOS §9 |
| D-S7 | **Forma vivida = slot 64²** (a MESMA célula do Dex do Pet) com o sprite a 64, nome 12/500 `ink` + data 12 `muted` `tabular`; a não alcançada com a silhueta e "???" 12 `muted`; a grade `minmax(84px, 1fr)` do código fica (3–4 por fileira). A moldura 72×72 (0,28×) e a data em `opacity .7` saem | Pet D-P7; Atividades F1; `FormAlbum.tsx` |
| D-S8 | **A estação é calendário**: `calendar_month` no cabeçalho; os caminhos como `.path` (rótulo 12 `muted` à esquerda, fração em `ink` 500 `tabular` à direita) — nenhuma barra, nenhuma contagem regressiva; as medalhas com `military_tech` 20 FILL 1 em **`gold-ink`** — a única cor de acento além do ciano nesta tela, e é posse guardada ("forever"), nunca oferta | 02 §57; PRINCÍPIOS §8/§9; DECISÕES §13 (aceite do guarda b) |
| D-S9 | **O emoji das listas é CONTEÚDO** (o `emoji` da atividade que a pessoa escolheu): texto 20px pelado numa coluna de 24, `aria-hidden` — não é ícone do sistema e não vai em caixa (a de 26px do código sai); nome 14 com reticências (`title` com o nome inteiro), contagem/data 12 `muted` `tabular` à direita; sem posição, sem comparação (V4) | regra do dono (ícone nunca em box); DECISÕES §13 V4 |
| D-S10 | **Nenhuma Silkscreen no canvas**: a Estatísticas não tem HUD (HP/EN/EVOLVE são da Home); o vidro aqui só carrega a criatura ou a silhueta. O `guard()` do gerador reprova qualquer `.pix` | HANDOFF §1 (Silkscreen só no vidro, e só para HUD) |
| D-S11 | **Só o dígito no "0"** (Fredoka 24 `tabular`, o mesmo peso do "12") — sem frase de contexto, sem peso reduzido: decisão do dono (15/09, modal final, opção (b)). O número grande é UM por tela e governa algo (dias completos → evolução) | DECISÕES §13 V2/E4 (revogada) |
| D-S12 | **Anotações dentro do telefone** só as do wireframe (`.sticky`, `.tagd` `sample`, as `.note` 12 dos estados, o "— no Encounters card —" tracejado) + a tag `código 20/09` na nota do bestiário (36 ≠ 24) | D-A9; D-R12; D-P12; D-E12 |

## Contraste (WCAG 2.x, hex do `index.css` bloco ONDA 1)

| Par | Onde | Escuro | Claro |
|---|---|---|---|
| `ink` / `bg` | (nada — todo texto desta tela está sobre `surface`) | 16,15 | 14,96 |
| `ink` / `surface` | a palavra do vínculo, o "12"/"0", o nome do nascimento, os traços, a descrição da estação, os nomes das listas, "Medals kept", nomes das linhas e das formas | 13,59 | 16,23 |
| `muted` / `surface` | `.lab` ("BOND LEVEL", "BORN · …"), "Level N", "complete days so far", "N days together", "You said…", "7 of 36", "2/11", datas, "???", "done N×", "3h ago", os caminhos da estação, as frases de futuro, os ícones dos cabeçalhos | 7,43 | 5,80 |
| `muted` / `bg` | `.sticky`, as `.note` fora dos cards, os `.strip` | 8,83 | 5,35 |
| `primary-ink` / `surface` | os ícones dos traços (`restaurant`, `event_repeat`) | 11,12 | 6,02 |
| `primary-ink` / `bg` · `primary-ink` / `primary-soft` (composto sobre `bg`) | sub-aba ativa "Stats" | 13,21 · 9,33 | 5,55 · 5,21 |
| `gold-ink` / `surface` | `military_tech` das medalhas | 8,84 | 5,87 |
| `primary-fill` / `surface-2` (não-texto) | o preenchimento do medidor do vínculo | 9,43 | 5,28 |
| `muted` / `surface-2` (não-texto) | a fronteira do medidor (e o trilho vazio no `Vazio`), anel dos `outline` | 6,30 | 5,09 |
| `viewport-ring` / `surface` (não-texto) | o anel de cobre do vidro do nascimento sobre o card | 4,98 | 3,97 |
| silhueta `color-mix(viewport-bg 58%, viewport-ink)` / `viewport-bg` (não-texto) | a forma não vista / não alcançada no mini-visor (`#667271` / `#6A7C79`) | 3,76 | 3,69 |
| `viewport-bg` / `surface` (decorativo) | a borda do mini-visor 64² sobre o card — o slot é palco, não controle (nenhuma célula é botão; Pet R3, mesmo caso) | 1,24 | 16,23 |

Nenhum par de TEXTO abaixo de 4,5 nos dois temas; os não-texto que identificam algo (medidor, anel de cobre, silhueta) ≥ 3:1;
o único par abaixo de 3 é decorativo e declarado (a borda do mini-visor no escuro — como o slot do Dex). **Nenhuma opacidade em
nó nenhum do telefone** (medido nos 8). O vidro é sempre escuro (`viewport-bg` `#071413`/`#0E2422`) — o pixel e a silhueta
não mudam de tema. **Nenhum `--sm2-danger-*` e nenhum `--sm2-haunted` no canvas** (declarados no `:root` copiado, sem consumidor).

## Achados (divergências com o código de hoje — para o `staff-frontend`)

1. **`StatsPage` inteira em `style={{}}` inline** (`card`, `sectionTitle` 16/600 Rubik, `sm2Text`/`sm2Hint`, `sm2-num`) → `.card` SIS-03 + `.ch` (ícone 24 `muted` + Fredoka 16) + `.s`/`.t`/`.num` (D-S3); o título do vínculo em `text-2xl` → Fredoka 24 (D-S1); a barra de 8px `borderRadius 999` → `.meter` SIS-07 (D-S1).
2. **"Who they are" sem ícone** → ícone Material 24 `primary-ink` por traço/ritmo (D-S2); mapa: `Foodie restaurant · Cuddly volunteer_activism · Stubborn pan_tool · Lucky star · Early Bird wb_sunny · Steady event_repeat · Burst bolt · Balanced spa` (X2: nunca `casino`, que é a nav; `event_repeat` também abre "What you repeat most" — dois papéis na mesma tela, declarado, R3) — nenhum glifo novo; `passives.ts`/`carePattern.ts` ganham um campo `icon` (ou um mapa no componente). `A15` do backlog de arte (traços em pixel) está obsoleto — não gerar.
3. **`BirthCard`: `<img 112>` solto** (0,44×) → sprite 128 (0,5×) num `Viewport` 64×64×3 (192²) com anel, `role=img` no vidro (D-S4). É UM componente (reveal + Estatísticas): a mudança vale nos dois lugares. O `epithet` continua não passado pela `StatsPage` (§13.4 b) — o cartão aqui não o tem; se passar a ser, entra sem reabrir nada.
4. **`BestiaryCard`: moldura 56×56 com `<img>` a 56** (0,22×) + `filter: brightness(0) opacity(.35)` na silhueta → mini-visor 64² (`.screen` sem anel) com o sprite a 64 e a silhueta por `mask-image` + `color-mix` (D-S5/D-S6); `alt`/`aria-hidden` ficam.
5. **O total do bestiário é 36, não 24**: `DUNGEON_LINE_NAMES` tem **9** linhas (Ignar · Lumel · Serah · Pyraka · Akashaoi · Nimbrata · Igni · Nautilu · Astrase), o card deriva `linhas.length × 4` e `sprites.dungeonRoster.test.ts` trava as 9 — código e teste dizem 36. **Os sete lugares que dizem 24 (para o cartógrafo / `manter-docs`; nenhum é código):** (1) `CLAUDE.md` ⚔️ Masmorra — "as **6 linhas próprias** de `DUNGEON_LINE_SPRITES`" e "as 24 artes possíveis (6 linhas × 4 tiers)"; (2) `docs/design/INVENTARIO-WIREFRAMES.md` STAT-06 ("24 artes possíveis (6 linhas × 4 tiers)") e (3) STAT-07 ("24 de 24"); (4) `docs/INVENTARIO-ASSETS.md` ("24 · 256² — 6 linhas"); (5) `docs/HANDOFF-IMPLEMENTACAO-IDENTIDADE.md` ("3 branches: Ignar/Lumel/Serah + Kaelen/Orrin/Thalindra"); (6) o wireframe `../` (12 ocorrências de "24" nas notas e contagens de `JornadaRolada`/`Bestiario`); (7) `02 §52` do manual. O canvas desenha 36 com a tag `código 20/09` dentro do artboard.
6. **`hideMetrics` não chega à `StatsPage`** (§13.4 a; guarda f): a interface de props não o tem e o `App.tsx` não o passa; os comentários do arquivo afirmam o contrário. Critério de aceite do WP (R2 — duas linhas a mais que o §13.4): com o descanso ligado somem `streakDays` ("12"), `daysTogether`, **"Level N"** (a legenda é número) e **o `progressbar` do vínculo** (carrega `aria-valuenow` 40 — ou some, ou perde o valor e o `aria-valuetext`), "7 of 36", "2/11", as frações da estação e "done N×"; **ficam** a palavra do vínculo, o cartão de nascimento, as artes vistas/vividas, as medalhas e as listas sem contagem (recompensas preservadas). O canvas não desenha esse estado porque ele não existe hoje.
7. **`FormAlbum`: moldura 72×72 com `<img 72>`** (0,28×), silhueta por filtro, data em `opacity .7` → slot 64² com o sprite a 64, máscara, tinta `muted` (D-S7). O "#25"/"-" do PRINCÍPIOS §9 (V5) continuam fora (D11).
8. **Sub-aba ativa como `sm-btn` cheio** → `primary-soft` + `primary-ink` (Pet D-P1); a semântica de grupo continua dívida no STATUS.
9. **O emoji das listas numa caixa de 26px** → texto 20px pelado numa coluna de 24 (D-S9).
10. **As frações da estação inline no `sm2Hint`** → `.path` com a fração em `ink` 500 `tabular` à direita (D-S8); "Medals kept" ganha `military_tech` `gold-ink`.
11. **Nenhum teste monta a `StatsPage`** (§13.4 c) — o vazio (`Vazio`) não tem régua; este canvas é a referência visual até ela existir.
12. **`03 §4.8a` e o inventário STAT-02** dizem que "Who they are" e "The season" somem no primeiro uso — falso (B3); mantido como achado do cartógrafo.
13. **`STAT-10`** (linha de texto legada, save sem `album`) — fora (D4); a conta vai ao STATUS como candidato a remoção (já registrado).
14. **Nenhum glifo novo pedido**: `calendar_month, event_repeat, military_tech, psychology, restaurant, swords, task_alt` (+ os do achado 2, com `star` no lugar de `casino`) — todos no inventário de 102.
15. **Três tiras em `lines/`** (X1): `serah-rookie/-champion/-ultimate.png` são folhas de 4 quadros e `DUNGEON_LINE_SPRITES` aponta para elas — a masmorra desenha quatro pintinhos hoje. Pedido à `squad-arte` e régua anti-tira em Pendentes.

## Pendentes

- **Sem pendência do dono.** Nenhum token novo; nenhum glifo fora do inventário; nenhuma estrutura reaberta; o "0" como o dono decidiu.
- Para o lead: o **36 × 24** do bestiário (achado 5, os sete lugares) é registro para o cartógrafo e o sync do manual, não decisão de design; e a adição de `role=img` no vidro do nascimento (fidelidade, exceção declarada — mesma da heroína no Onboarding).
- Para a `squad-arte`: nada — o **três arquivos a regerar** (X1): `serah-rookie.png`, `serah-champion.png`, `serah-ultimate.png` como UM quadro 256² cada (hoje são tiras de 4 quadros: alfa em y 16–159 / 24–158 / 86–158 e quatro corridas de colunas x 11–60 · 70–120 · 135–184 · 192–247, etc.; `serah-mega` já é quadro único) — **nunca** como animação: cada criatura tem UM sprite (D5 do dono, reafirmada em 20/09; guard `sprites.umQuadro.contract.test.ts`). ✅ Recortadas em `7ea27825`. É a arte que a masmorra desenha hoje quando o sorteio cai em `serah`, não só a amostra do canvas (mesmo achado do Social, achado 12 de lá — que citou duas tiras; são três). **Régua anti-tira (para o `docs/STATUS.md` / `staff-frontend`):** em `sprites.dungeonRoster.test.ts` (ou vizinha), projetar as colunas do alfa de cada `lines/*.png` e reprovar mais de UMA corrida larga por arquivo — hoje o teste trava as 9 linhas e os 36 nomes, não a forma da arte. Fora isso, nenhum FX, nenhum HUD.
- Para o wireframe (`../`): "24" nas notas e na contagem (registro, não reabertura).

## Fontes

`StatsPage.tsx` · `BirthCard.tsx` · `BestiaryCard.tsx` · `FormAlbum.tsx` · `App.tsx` (sub-abas, `birth`, `album`, `bestiary`, `season`, o fallback do demo) ·
`utils/bond.ts` (`BOND_TITLES`) · `utils/passives.ts` · `utils/carePattern.ts` · `utils/seasons.ts` (`seasonLabel`, `seasonProgress`) · `utils/sprites.ts`
(`DUNGEON_LINE_NAMES` 9, `DUNGEON_LINE_SPRITES`) · `BirthCard.render.test.tsx` · `BestiaryCard.render.test.tsx` · `FormAlbum.render.test.tsx` ·
`tokens.md` §5 (subset de 102), §6.1 · DECISÕES §13, §18–§24 · HANDOFF §1, §4–§7 · Sistema/Home/Atividades/Rituais/Pet/Onboarding/Evolução
`README.md`/`CRITICA.md` · CLAUDE.md (✨ Traço, ⚔️ Masmorra/Bestiário, 📈 Constância, 🛏️ Janela de Descanso/`hideMetrics`, UI: ícone nunca em box) ·
02 §41, §45, §52, §57 · 03 §4.8, §4.8a · PRINCÍPIOS §8, §9 · REGISTRO 13.7.
