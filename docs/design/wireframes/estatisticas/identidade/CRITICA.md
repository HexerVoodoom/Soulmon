# CRÍTICA — canvas "Estatísticas" (identidade, Fase 2, décimo canvas) · `design-critic`

> Revisão BLOQUEANTE · 20/09/2026 · alvo: os 7 `.dc.html` + `MainClaro` + `canvas.json` + `README.md` desta pasta,
> servidos em `localhost:8776`.
> Método: (1) diff estrutural artboard a artboard contra `../<mesmo nome>.dc.html` — sequência de `role`, de `aria-label`,
> dos marcadores de foco (`.fo`) e a copy (7 pares); (2) `getComputedStyle` + `getBoundingClientRect` em todos os nós do
> `.phone` nos 8 artboards (texto < 12px, Silkscreen fora do `.screen`, alvo < 44 entre `button/input/a/summary` e
> `role=button/checkbox/radio/textbox/switch/tab/link/menuitem`, vazamento de 390, `<img>`/`background-image`/`border-image`/
> `mask-image` fora do vidro, `opacity < 1`, `opacity()` em `filter`, `text-shadow`, `scrollHeight` do `.ab` contra o
> `canvas.json`) + as caixas de cada `<img>` DENTRO de cada `.screen`, o `.meter` do vínculo (fill, trilho, `aria-value*` ×
> largura), as silhuetas (`mask-image` + `color-mix`) — script PRÓPRIO (`crit_gen.mjs`, Chromium via `playwright-core`,
> 420×900, DPR 1), não o do designer; (3) hex recalculados do `src/index.css` (bloco ONDA 1) com a fórmula WCAG 2.x,
> inclusive `primary-soft` composto (rgba .14 sobre `bg`) e a silhueta `color-mix(viewport-bg 58%, viewport-ink)`; (4) os 12
> glifos cruzados com o inventário de 102 (`tokens.md` §5); (5) **a caixa de alfa e a projeção de colunas de cada uma das 36
> artes de `lines/`** (Pillow + sharp, alfa > 8) e a máscara do quadrado 64 com raio 4; (6) o código —
> `StatsPage.tsx` (interface `StatsPageProps` l. 68–98), `App.tsx` (`hideMetrics` l. 5167 e 5723), `BestiaryCard.tsx`
> (`linhas.length × TIERS.length`, l. 51–53), `utils/sprites.ts` (`DUNGEON_LINE_NAMES`, 9 chaves; l. 108–112),
> `sprites.dungeonRoster.test.ts` l. 150 (as 9 linhas travadas), `utils/bond.ts` (`BOND_TITLES`), `CoopPanel`/`bond` só
> por referência; (7) cruzado com DECISÕES §13 (E1–E5 / V1–V5 / S1–S4) e §18–§25, `HANDOFF-IDENTIDADE.md` §4–§7, as nove
> `CRITICA.md` anteriores e `CLAUDE.md` › ✨ Traço / ⚔️ Bestiário / 📈 Constância / 🛏️ `hideMetrics`.
> Não editei nenhum artboard.

## 0. Resumo

| Classe | Qtd | O que pesa |
|---|---|---|
| **fatal** | 0 | — |
| **fixável** | 4 | **o mini-visor da Serah no `Bestiario` (STAT-06) mostra QUATRO pintinhos** — `serah-rookie.png` é uma tira de 4 quadros dentro do 256² (medido: quatro corridas de colunas x 11–60 / 70–120 / 135–184 / 192–247, alfa só em y 16–159; e `serah-champion` e `serah-ultimate` são tiras também), então o "visto" desenha quatro criaturas de ~12 px e as três silhuetas ao lado desenham quatro vultos cada; o README declara "corte 0,00 % nas 36 artes" (verdade — a métrica de corte não enxerga tira) e "para a `squad-arte`: nada" (falso) · **o mapa D-S2 dá ao traço Sortudo o glifo `casino`**, que é o glifo da aba "Games" na nav da MESMA tela, ambos a 24 em `primary-ink` · **nenhum artboard prova a dobra do primeiro uso**: o `Vazio` é `tall` (nav a 1196) e o README mede "tudo antes da nav" contra uma nav que o artboard não desenha (uma linha tracejada a 774 resolve, como o `GrupoSemGrupo` do Social) · README: a lista para a `squad-arte` e a frase das 36 artes |
| **ruído** | 9 | 36 × 24 do bestiário (código + teste vencem; sete lugares para o cartógrafo) · `hideMetrics` não chega à `StatsPage` (confirmado no código; o aceite precisa cobrir também o `progressbar` do vínculo) · `event_repeat` com dois significados na mesma tela (ritmo Constante e o cabeçalho "What you repeat most") · `role=img` no vidro do nascimento (exceção declarada, igual Onboarding) · sub-abas `role=button` (código) · 12 das 36 artes tocam a borda do mini-visor 64 (margem 0) · "Level 0" com trilho a 0 % (guarda d) · o rótulo "BORN" sob a nav no `Main` a 844 · 0,25× = 0,75× em DPR 3 |

**Veredito: ENTRA COM CONSERTOS.** Nenhum fatal, nada estrutural reaberto, fidelidade 7/7 (as três adições de `role=img`
são a exceção declarada), AA por token nos dois temas, 0 alvo < 44, 0 texto < 12, 0 opacidade, 0 pixel fora do vidro, 0
Silkscreen. **X1 é obrigatório antes do checkpoint do dono** (é o recorte 200×200 mais provável da prateleira de encontros
e é a mesma arte que a masmorra desenha hoje); X2–X4 custam uma linha cada. Rodada 2 só para X1–X4 e o README.

**O que está certo e não precisa de rodada:** estrutura **idêntica nos 7 pares** — mesma sequência de `.fo` (2–9 nos
quatro artboards com foco; nenhum nas três folhas de estado), mesma sequência de `role` em 4 e a adição declarada em 3
(`Main`, `Vazio`: `+img` no vidro; `Nascimento`: 3 `img` onde o wireframe tinha 0 papéis), `aria-label` iguais com a
única adição do nome ("Pixel", "Ignar"); **0 nós < 12 px** nos 8; **0 alvo < 44** (sub-abas 113×44; nav 78×68); **0
vazamento**; **0 Silkscreen** (nenhum `.pix`); **0 `opacity < 1`, 0 `opacity()`, 0 `text-shadow`** (a data do álbum em
`opacity .7` do código virou tinta `muted`); **0 PNG / `mask-image` fora do vidro** (os 12 + 7 + 3 + 3 + 1 + 1 `<img>` e as
18 silhuetas estão todos dentro de um `.screen` 192² ou 64²); **12 glifos, 12 no inventário de 102** (`auto_awesome,
calendar_month, casino, event_repeat, home, menu, military_tech, psychology, restaurant, storefront, swords, task_alt`);
`canvas.json` = `scrollHeight` dos 8 `.ab` (2549 · 1571 · 2087 · 2094 · 2374 · 2235 · 2005 · 1831); **os 12 pares de
contraste do README conferem ao centésimo** nos dois temas (`ink/surface` 13,59 / 16,23 · `muted/surface` 7,43 / 5,80 ·
`primary-ink/primary-soft` 9,33 / 5,21 · `gold-ink/surface` 8,84 / 5,87 · `primary-fill/surface-2` 9,43 / 5,28 ·
`viewport-ring/surface` 4,98 / 3,97 · silhueta `#667271`/`#6A7C79` sobre o vidro 3,76 / 3,69 · `viewport-bg/surface`
1,24 decorativo); **`--sm2-danger-*` e `--sm2-haunted` ausentes do corpo dos 8**; **escala inteira em toda arte** (256²
a 128 = 0,5× no vidro 192², caixa 32–160 — o `igni-rookie` y 29–226 cai em 46–145, inteiro; 256² a 64 = 0,25× nos 64²,
caixa 0–64) e **corte 0 % nas 36 + 4 artes contra a máscara 64/raio 4** (reamostragem `any(4×4)`, conferida por conta
própria: nenhuma arte pinta pixel fora do canto arredondado); **o medidor do vínculo é o SIS-07** (12 px, `surface-2` +
fronteira `muted` 1 px 6,30, `primary-fill`, `aria-valuenow` 40/100 → 131 de 330 = 40 % ✓; no `Vazio` 0/100 → 0 ✓);
**o Vínculo pela PALAVRA** ("Companion" = `BOND_TITLES[level 2]` em `bond.ts`; "Just met" = o fallback `title ?? 'Just
met'` da `StatsPage` l. 277; "Level 3" 12 `muted` `tabular`; a frase "It only goes up…" idêntica à l. 305); **o traço em
ícone Material 24 pelado** (`restaurant` em `primary-ink` 11,12 / 6,02; nunca pixel — `A15` obsoleto); **o cartão de
nascimento é o visor do reveal** (anel 200 = 192 + 2×4, cobre em gradiente, raio 20; "BORN · SEPTEMBER 3" `.lab` — data
SEM ano, SEM epíteto, E2/S2 ✓); **bestiário como coleção** ("7 of 36" / "36 of 36", nunca percentual, nunca "faltam N";
ausente = o cartão não monta; completo sem troféu); **constância nunca streak** (nenhuma palavra "streak" nos 8; "12
complete days so far" é `perfectDays`, que só acumula); **nenhum score de sono, nenhum número de moeda/XP, nenhum
vermelho**; **a estação é calendário** (`calendar_month` `muted`, caminhos como fração à direita só com `current ≥ 1`,
"Medals kept: 2 — forever." com `military_tech` FILL `gold-ink` — a única cor de acento além do ciano); **o emoji das
listas é conteúdo** (20 px pelado, `aria-hidden`, coluna de 24; `formatDate` relativa "3h ago · Yesterday · 2d ago · Sep
03" como E5); **ícone nunca em box** em nenhum dos 8; **sub-aba ativa tonal** (`primary-soft` + `primary-ink` + anel 1
px, nunca placa cheia — Pet D-P1); a dobra do `Main` a 844 como o README mede (sub-abas 61–105, vínculo 113–274, "Who they
are" 282–429, "12" 482–511, anel do vidro **557–757**, nav 774 — 17 px de folga ✓); `JornadaRolada` com as duas linhas de
encontros (193–430) e a primeira fileira do álbum inteiras antes da nav ✓; `EstacaoListas` com a estação (140–363) e as
duas listas (371–517, 525–703) antes da nav ✓.

## 1. Fixável (X — obrigatórios antes do checkpoint: X1–X4)

**X1 · A Serah do `Bestiario` (STAT-06) é uma tira de 4 quadros, e o mini-visor mostra quatro pintinhos** — medido com
sharp e Pillow em `src/assets/soulmon/lines/`: `serah-rookie.png` 256×256 com alfa só em y 16–159 e **quatro** corridas
de colunas (x 11–60 · 70–120 · 135–184 · 192–247); `serah-champion.png` idem (y 24–158; x 12–53 · 74–115 · 136–178 ·
202–250); `serah-ultimate.png` idem (y 86–158; x 5–61 · 67–122 · 137–178 · 199–250). Só `serah-mega.png` é um quadro (x
74–196, y 25–218). Todas as outras 32 artes têm UMA corrida (a `lumel-champion` tem faíscas soltas, mas um corpo). No
artboard, a linha "Serah" desenha o `serah-rookie` a 0,25× — quatro criaturas de ~12 px lado a lado num vidro de 64 — e as
três silhuetas por `mask-image` desenham quatro vultos cada (a de `serah-mega` é a única inteira). O README afirma "corte
0,00 % nas 36 artes" (é verdade: a tira cabe inteira; a métrica de corte não vê tira) e "para a `squad-arte`: nada" (não
é verdade). O canvas Social achou o mesmo defeito (achado 12 de lá — e citou duas tiras, não três) e tirou a linha do
canvas; este canvas a pôs na única prateleira que existe para mostrá-la. É a arte que a masmorra desenha hoje quando o
sorteio cai em `serah` (rookie/champion/ultimate), então não é só um problema de amostra. **Conserto (uma linha no
artboard):** trocar a linha de amostra por uma que tenha quadro único (Nautilu, Astrase, Igni — qualquer uma das 8) e
registrar no README, junto do Social, o pedido à `squad-arte`: **três** arquivos (`serah-rookie`, `-champion`,
`-ultimate`) regerados como um quadro 256² cada (ou movidos para `fx/` com `steps(4)` se forem animação de propósito —
mas aí `DUNGEON_LINE_SPRITES` não pode apontar para eles). Para o `docs/STATUS.md`: uma régua em
`sprites.dungeonRoster.test.ts` (ou vizinha) que reprove tira — projeção de colunas do alfa com mais de UMA corrida
larga por arquivo de `lines/*.png`; hoje o teste trava as 9 linhas e os 36 nomes, não a forma da arte.

**X2 · O mapa D-S2 dá a Sortudo o `casino` — o glifo da aba "Games" na nav da mesma tela** — nenhum artboard desenha o
traço Sortudo (todos usam Foodie), mas o README fixa o mapa para o `staff-frontend`: `Lucky casino`. Na Estatísticas a
nav mostra `casino` a 24 (Games) e o traço mostraria `casino` a 24 em `primary-ink` no card "Who they are" — o mesmo
desenho para "minijogos" e para "sorte de nascimento", a 700 px de distância. No inventário de 102 há `star` (livre —
o Torneio usa `emoji_events`/`park`, a Evolução `auto_awesome`) e `favorite` (o coraçãozinho, não serve). **Conserto
(README):** `Lucky → star`. Enquanto isso, registrar que `Steady → event_repeat` também divide o glifo com o cabeçalho
"What you repeat most" (D-S3) e com o selo de hábito da Home/Atividades — três significados para um desenho; aceitável
porque os três dizem "repetição", mas o README precisa dizer que foi de propósito (R3).

**X3 · Nenhum artboard prova a dobra do primeiro uso (STAT-02)** — o `Vazio` é `tall` (2374; nav a 1196), e a tabela de
dobra do README afirma "vidro inteiro (483–683), 'BORN' 695–709, 'Pixel' 717–746 e 'You said…' 754–772 — tudo antes da
nav", contra uma nav que o artboard não desenha a 774. Os números batem com o DOM (medi: anel 483–683, cartão 470–785),
mas "You said…" a 754–772 termina **2 px** antes da nav — a afirmação mais apertada do README é justamente a que ninguém
vê. **Conserto:** o marcador de dobra tracejado a 774 (a mesma peça que o `GrupoSemGrupo` do Social usa a 776), ou
declarar o `Vazio` como folha de estado sem dobra e tirar a linha da tabela.

**X4 · README** — (a) "para a `squad-arte`: nada — o canvas usa só arte já instalada" → o pedido de X1 (três tiras);
(b) "corte 0,00 % nas 36 artes" → acrescentar "33 de quadro único; 3 são tiras (X1)"; (c) o mapa D-S2 conforme X2; (d)
a nota da dobra do `Vazio` conforme X3.

## 2. Ruído (R — registro; nada a mudar no canvas sem o lead)

- **R1 · 36 × 24 do bestiário — código vence, e o teste também.** `DUNGEON_LINE_NAMES` tem 9 chaves (`ignar, lumel,
  serah, kaelen, orrin, thalindra, igni, nautilu, astrase`), `BestiaryCard` deriva `linhas.length × TIERS.length` = 36, e
  `sprites.dungeonRoster.test.ts` l. 150 **trava as 9 linhas** — não há dúvida de qual fonte manda. O que precisa ser
  atualizado (para o cartógrafo / `manter-docs`; nenhum é código): `CLAUDE.md` ⚔️ Masmorra ("as **6 linhas próprias** de
  `DUNGEON_LINE_SPRITES`" e "as 24 artes possíveis (6 linhas × 4 tiers)"); `docs/design/INVENTARIO-WIREFRAMES.md` l.
  335–336 (STAT-06 "24 artes", STAT-07 "24 de 24"); `docs/INVENTARIO-ASSETS.md` l. 47 ("24 · 256² — 6 linhas");
  `docs/HANDOFF-IMPLEMENTACAO-IDENTIDADE.md` l. 48 ("3 branches: Ignar/Lumel/Serah + Kaelen/Orrin/Thalindra"); as notas
  e a contagem do wireframe `../` (12 ocorrências de "24"); `02 §52`. O canvas fez o certo: desenhou 36 com a tag `código
  20/09` dentro do artboard.
- **R2 · `hideMetrics` não chega à `StatsPage` — confirmado no código.** `StatsPageProps` (l. 68–98) não tem o campo; o
  `App.tsx` passa `hideMetrics={gameState.rest?.hideMetrics === true}` só ao `DailyRituals` (l. 5167) e ao modal de
  edição (l. 5723); os comentários da `StatsPage` (l. 354, 366) afirmam "obedece `hideMetrics` como todo o resto" — é
  falso hoje. Achado de código, não do canvas (V3 de §13 já o mandou ao STATUS como critério de aceite). Duas coisas a
  acrescentar ao aceite, que o README não lista: o **`progressbar`** do vínculo carrega número (`aria-valuenow` 40,
  `aria-valuetext` se houver) — com o descanso ligado ou some ou perde o valor; e "Level N" (legenda) é número também.
  O que fica, como o README diz: a palavra do vínculo, o cartão de nascimento, as artes vistas/vividas, as medalhas e as
  listas sem contagem.
- **R3 · `event_repeat` com dois papéis na mesma tela** — ver X2; registro de que é aceitável se declarado.
- **R4 · `role=img` + `aria-label` = nome no vidro do nascimento** (`Main`, `Vazio`, `Nascimento` ×3) — exceção de
  fidelidade declarada, a mesma da heroína no Onboarding; o wireframe desenhava "ART 112" sem papel e o código tem
  `<img alt={name}>`. Aceito.
- **R5 · Sub-abas "Evolution · Soulmon · Stats" como três `role=button`** — é o código e o wireframe; a semântica de
  grupo (`tablist`) continua dívida no STATUS (achado 8). Aceito.
- **R6 · 12 das 36 artes tocam a borda do mini-visor 64** — `astrase-*` (x 0/3–251/255, y 0–255), `igni-*` (x 0–255),
  `nautilu-*` (x 0–255), `orrin-ultimate` (x 0–253): a 0,25× ocupam os 64 px de largura sem margem. Corte 0 % (medido),
  mas respiro 0 — a mesma família do pedido de Jogos R10 (`64²` nativos com margem para Dino/oponentes). Registro para
  o pedido à `squad-arte` (grade 64² com 4 px de margem).
- **R7 · "Level 0" com o trilho a 0 % no `Vazio`** — o guarda aceitou (d, "legenda quieta") e o README explica por que
  não é o caso do Dex (é o medidor do PRÓXIMO nível, não coleção). Aceito.
- **R8 · No `Main` a 844, o cartão de nascimento (544–859) passa sob a nav (774)**: o vidro inteiro aparece, "BORN ·
  SEPTEMBER 3" e o nome ficam abaixo da dobra. O README declara; o wireframe tinha o mesmo corte. Registro.
- **R9 · 0,25× = 0,75× em DPR 3** (e 0,5× = 1,5×) — a P2 (a) já declara a transição; Jogos R10 idem.

## 3. Pendentes do lead — recomendação

**(a) 36 × 24 (achado 5 / R1).** Não é decisão de design: código e teste dizem 36. Recomendação: o canvas fica como está;
os sete lugares de R1 vão ao cartógrafo na mesma rodada do `manter-docs` — e o `CLAUDE.md` é do dono, então a linha ⚔️
vai como pedido, não como edição.

**(b) `hideMetrics` (achado 6 / R2).** Não é do canvas. Recomendação: o aceite do WP no STATUS ganha as duas linhas de
R2 (o `progressbar` e "Level N"); o canvas não desenha o estado porque ele não existe — certo.

## 4. Veredito por decisão (D-S1…D-S12)

| # | Veredito | Observação |
|---|---|---|
| D-S1 | **entra** | "Companion" Fredoka 24 = `BOND_TITLES`; "Level 3" 12 `muted` `tabular`; `.meter` SIS-07 com `aria-valuenow` = largura (40 % → 131/330); no vazio 0 % declarado como medidor do próximo nível |
| D-S2 | **entra com X2** | `restaurant` 24 `primary-ink` pelado ✓; o mapa `Lucky → casino` colide com a nav (X2); `A15` obsoleto ✓ |
| D-S3 | **entra** (R3) | `.ch` = ícone 24 `muted` + Fredoka 16 nos seis cabeçalhos; `event_repeat` com dois papéis, declarar |
| D-S4 | **entra** | sprite 128 centrado no vidro 192² (caixa 32–160), anel 200 raio 20, `role=img` no vidro, `img alt=""`; data sem ano, sem epíteto (E2/S2) ✓ |
| D-S5 | **entra com X1** | mini-visor 64² sem anel, sprite 0,25×, 4 por linha (280 ≤ 334), `role=img` "linha — tier" só no visto ✓; a amostra Serah é tira (X1) |
| D-S6 | **entra** | `mask-image` + `color-mix(viewport-bg 58%, viewport-ink)` = `#667271` / `#6A7C79`, 3,76 / 3,69 sobre o vidro; `aria-hidden`; nenhum `filter: opacity()` ✓ |
| D-S7 | **entra** | slot 64² do Dex, sprite a 64, nome 12/500 `ink` + data 12 `muted` `tabular`, "???" na não alcançada; grade `minmax(84px,1fr)` (3 por fileira a 330) ✓; sem `opacity .7` ✓ |
| D-S8 | **entra** | `calendar_month` `muted`; `.path` com fração à direita só com `current ≥ 1`; `military_tech` FILL `gold-ink` 8,84 / 5,87 nas medalhas — posse, não oferta ✓ |
| D-S9 | **entra** | emoji 20 pelado em coluna de 24, `aria-hidden`; nome 14 com reticências e `title`; "done 14×" / "3h ago" 12 `muted` `tabular`; sem posição ✓ |
| D-S10 | **entra** | 0 `.pix`, 0 Silkscreen medidos nos 8 ✓ |
| D-S11 | **entra** | "0" Fredoka 24 `tabular`, mesmo peso do "12", sem frase — como o dono decidiu (E4 revogada) ✓ |
| D-S12 | **entra** | só as anotações do wireframe + a tag `código 20/09` no bestiário ✓ |

## 5. Veredito por artboard

| Artboard | Id | Veredito | O que pesa |
|---|---|---|---|
| `Main` | STAT-01 (1/3) | **entra** (R8) | fidelidade ✓ (`+img` declarado), dobra ✓ (vidro 557–757, nav 774), AA ✓, `.meter` ✓ |
| `MainClaro` | STAT-01 claro | **entra** | o mesmo DOM, `ink #0E2422`, `primary-ink #0B6F68` (5,55 sobre `bg`, 5,21 sobre `primary-soft`), o vidro continua `#0E2422` ✓ |
| `JornadaRolada` | STAT-01 (2/3) | **entra** | um cartão contínuo ✓; encontros 193–430 e a 1ª fileira do álbum inteiras antes da nav ✓; sprites 0,25× inteiros (`kaelen-champion-virus` 8–245 → 2–61) ✓ |
| `EstacaoListas` | STAT-01 (3/3) | **entra** | estação como calendário ✓, medalhas `gold-ink` ✓, emoji como conteúdo ✓, datas relativas ✓, o strip "entre estações" ✓ |
| `Vazio` | STAT-02 | **entra com X3** | "Just met", "Level 0", trilho 0 %, só o dígito "0", cartão inteiro, frases de futuro ✓; a dobra não é provada |
| `Nascimento` | STAT-03 · 04 | **entra** | normal / demo (`ignar-rookie`, sem "You said") / sem `bornAt` ("BORN" sozinho) ✓; sem epíteto nos três ✓ |
| `Bestiario` | STAT-05 · 06 · 07 | **volta (X1)** | ausente não monta ✓, "7 of 36" / "36 of 36" ✓, sem troféu ✓; a linha Serah desenha uma tira de 4 quadros |
| `Album` | STAT-08 · 09 · 10 | **entra** | vivida com nome e data, silhueta com "???", sem `reachedAt` = nome sem data (D11) ✓; STAT-10 fora (D4) ✓ |

## 6. Para os outros papéis

- **`soulmon-design-lead`:** nada a decidir no desenho; (a) e (b) de §3 são registro. Confirmar que o pedido à
  `squad-arte` (X1) entra com prioridade — a arte errada já está em produção na masmorra.
- **`soulmon-visual-designer` (rodada 2):** X1 no `Bestiario`; X3 no `Vazio`; X2/X4 no README.
- **Cartógrafo / `manter-docs`:** os sete lugares de R1 (36 ≠ 24); `03 §4.8a` (achado 12, já registrado).
- **`docs/STATUS.md`:** R2 com as duas linhas a mais no aceite de `hideMetrics`; a régua contra tira em `lines/*.png`
  (X1); nenhum teste monta a `StatsPage` (achado 11, já registrado).
- **`squad-arte`:** `serah-rookie` / `serah-champion` / `serah-ultimate` como um quadro 256² cada (X1); grade 64² com
  margem para as 12 artes de R6 (junto do pedido de Jogos).
- **`staff-frontend`:** achados 1–10 do README; o mapa de ícones com `Lucky → star` (X2); `hideMetrics` até a
  `StatsPage` cobrindo também o `progressbar` (R2).
