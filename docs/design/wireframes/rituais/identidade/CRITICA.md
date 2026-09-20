# CRÍTICA — canvas "Rituais" (identidade, Fase 2, quarto canvas) · `design-critic`

> Revisão BLOQUEANTE · 16/09/2026 · alvo: os 21 `.dc.html` + `MainClaro` + `canvas.json` + `README.md`
> desta pasta, servidos em `localhost:8769`.
> Método: (1) diff estrutural artboard a artboard contra `../<mesmo nome>.dc.html` — sequência de `role`,
> de `aria-label`, dos marcadores de foco (`.fo`), rótulos dos botões e a copy visível (conjunto de palavras);
> (2) `getComputedStyle` + `getBoundingClientRect` em todos os nós do `.phone` nos 22 artboards (texto < 12px,
> Silkscreen fora do `.screen` ou < 14, alvo < 44 entre `button/input/summary` e `role=button/checkbox/radio/
> textbox/switch/tab/link`, vazamento da largura de 390, `<img>`/`background-image`/`border-image` fora do
> vidro, **`opacity < 1` e `text-shadow` em qualquer nó do `.phone`**, `scrollHeight` do `.ab` contra o
> `canvas.json`); (3) hex recalculados do `src/index.css` (bloco ONDA 1, `:root` + `[data-theme=dark]`) com a
> fórmula WCAG 2.x, inclusive o composto `primary-soft` (rgba .14 sobre `surface` → `#1A4643` no escuro);
> (4) os 19 glifos cruzados com o inventário de 102 (`tokens.md` §5); (5) escala real de cada PNG dentro do
> vidro (`naturalWidth` × largura renderizada) em DPR 1/2/3; (6) cruzado com Sistema/Home/Atividades aprovados
> (DECISÕES §18–§20), `HANDOFF-IDENTIDADE.md` §4–§7, DECISÕES §7 (R1–R8 / V1–V6 / S1–S8), `CLAUDE.md` ›
> Rituais/Relatório/Sonhos/Marcos/Janela de Descanso, `01-VISAO.md` §7, e o código (`MorningCheckIn.tsx`,
> `MilestoneCeremony.tsx`, `App.tsx` `MILESTONE_TEXT`, `utils/achievements.ts`, `utils/emblemArt.ts`,
> `types/taskModel.ts`). Renders de conferência em Chromium headless 390×1900, DPR 1. Não editei nenhum artboard.

## 0. Resumo

| Classe | Qtd | O que pesa |
|---|---|---|
| **fatal** | 0 | — |
| **fixável** | 5 | o emblema do marco entra no vidro a **0,75×** (64² → 48 CSS = 1,5× em DPR 2 — a única arte do canvas fora da grade inteira; P2 declarou 0,5×/1×/1,5× só para a criatura) · o confete **atravessa o título** "Complete day!" (3 de 14 peças dentro da caixa do `h2`, `ink` sobre `primary-ink` ≈ 1,3:1 nos pixels cruzados) · a cerimônia mostra o tier **duas vezes** (o `eco` 48 e o 🌿 da copy do código, um glifo colorido fora do vidro) · os emblemas `streak-7`/`milestone-21` — ids, rótulos e arte descasados de `HABIT_MILESTONES` 7/21/66 (recomendação abaixo) · README com 3 afirmações que o DOM/código não confirmam (carinhas "2 de 5", `.dlg` da cerimônia sem `role`, tabela de AA sem os pares do `primary-soft`) |
| **ruído** | 6 | `.dobra` sobre o texto das strips (Proteger, Notificações) · "Planned load: 5 · chosen focus: 5" com o mesmo dígito duas vezes na amostra · `PrimeiraTarefa` com × (fidelidade ao wireframe) enquanto R8 a promove a cerimônia sem × (V1) — tensão da Fase 1, para o lead · `.tagd` "sm-milestone-pop" dentro do telefone (herdado) · o `.hchip` sem borda em `surface-2` sobre `surface` (1,5:1) — é etiqueta, não alvo, passa · `MainClaro` sem o par `gold-ink/primary-soft` medido (não há caso de uso) |

**Veredito: ENTRA COM CONSERTOS** (nenhum fatal; os cinco fixáveis são de uma linha cada, nenhum
estrutural, nenhum pede o dono). Rodada 2 só para colar a medição dos X1/X2 no README — não precisa
voltar ao lead.

**O que está certo e não precisa de rodada:** estrutura **idêntica nos 21 pares** — mesma sequência de
`role`, mesmos `aria-label`, os mesmos números de foco, os mesmos rótulos de botão (as únicas diferenças
de texto são nomes de ligature dos ícones, as anotações do wireframe que viraram desenho — "confetti art
140×140…", "ícone sol/noite", "sunrise"→`wb_sunny`, "clock"→`schedule` — e o marcador `.dobra` nas duas
folhas em fluxo); **0 nós < 12px** dentro do `.phone` nos 22; **0 alvo < 44**; **0 elemento vazando** 390;
**0 Silkscreen fora do vidro**; **0 `opacity < 1` e 0 `text-shadow` em nó nenhum** (o único alpha é o
scrim literal `rgba(4,18,20,.55)` do `ModalSheet` e o `primary-soft`, os dois declarados); **0 PNG e 0
`background-image` fora do `.screen`** (o `linear-gradient` do `.ring` é o anel do Visor, SIS-05); os 19
glifos estão nos 102; `canvas.json` UTF-8, alturas = `scrollHeight` dos 22 `.ab`; os 15 pares de contraste
do README **conferem ao centésimo** nos dois temas; dobra a 844 como o README mede (o pior diálogo,
`RelatorioOferta`, termina a 756); sprite 256² a 128 (0,5×, P2a), cena do sonho 96² **a 1×**, aventura
96² a 48 (0,5×) — os três na grade; scrim cobre o palco "mini" (`elementFromPoint` no vidro devolve o
scrim, z 10); a carga do dia = `role=status` em `gold-ink` **sem fundo e sem borda** (D-A4); o inerte =
`outline: 1px dashed muted`, `aria-disabled`, `aria-pressed=false`, fundo transparente (forma, não alpha);
"1 recovering" em 400/14/normal, sem sinal, sem vermelho; "Hearts untouched"/"Complete days saved" em
`primary-ink`; janela de 7 no léxico A2 (● 12 `primary-fill` · ○ 12 anel 2px `muted` · — 12×2 `muted`);
"Close" 120×44 `quiet`; sugestão com filete 3px `primary-ink`; "Save my progress" inerte como `span`
sem `role` e sem `tabindex` (fora do Tab, como o `disabled` do código); `role=alert` das variantes em
`ink`, sem vermelho; o × das folhas por último no foco; a cerimônia com **um** botão (V1/B3), a data 12
`muted`, `role=status` mantido por fidelidade; a linha da folga ("used this week's day off…") presente
em `RelatorioEstados`; nenhuma ocorrência de "streak" fora das citações que o proíbem; "not logged" sem
dígito; "N of M" só com N ≥ 1; sonho sem duração e com raridade sem causa; retorno sem "N days".

## 1. Medições

### 1.1 Escala do pixel dentro dos vidros (o que D-R3 declara × o que o DOM mede)

| Peça | Arte | Nativo | CSS | DPR 1 | DPR 2 | DPR 3 | Grade |
|---|---|---|---|---|---|---|---|
| Palco "mini" / Home | `igni-rookie.png` | 256² | 128 | 0,5× | **1×** | 1,5× | P2 (a) — declarado |
| Cerimônia, sprite | `igni-rookie.png` | 256² | 96 | 0,375× | 0,75× | 1,125× | ver X1 (o sprite a 96 também sai da grade; o README diz "sprite 96") |
| Cerimônia, emblema | `milestone-21.png` | 64² | 48 | 0,75× | **1,5×** | 2,25× | **fora** — X1 |
| Retorno / memória / primeira tarefa | `igni-rookie.png` | 256² | 64 | 0,25× | 0,5× | 0,75× | 0,5× em DPR 2 = D-H7 (aprovado na Home) |
| Sonho | `dream-pillow-cloud.png` | 96² | 96 | **1×** | 2× | 3× | ✓ |
| Aventura | `adv-orvalho.png` | 96² | 48 | 0,5× | **1×** | 1,5× | ✓ (mesma transição de P2a) |
| Berço | `nest-cradle-wide.png` | 660×312 | 220×104 | 1/3 | 2/3 | 1× | Home (para a `squad-arte`, já registrado) |

### 1.2 AA por token — recálculo (os 15 pares do README + os que ele não lista)

Hex do `index.css`: escuro `bg #08191A · surface #0F2A29 · surface-2 #163735 · ink #E9F5F2 · muted #9DBCB4 ·
primary-ink/fill #5FF3E0 · on-primary #04211F · gold-ink #EBBE84 · primary-soft = rgba(95,243,224,.14) sobre
surface → #1A4643`; claro `bg #F1F7F5 · surface #FFFFFF · surface-2 #E9F2EF · ink #0E2422 · muted #4E6B66 ·
primary-ink/fill #0B6F68 · on-primary #FFFFFF · gold-ink #8A5A2B · primary-soft #D6F5EF`.

| Par | Escuro | Claro | README | Onde |
|---|---|---|---|---|
| `ink/surface` | 13,59 | 16,23 | confere | títulos, valores |
| `muted/surface` | 7,43 | 5,80 | confere | pistas, rótulos, data |
| `ink/surface-2` | 11,52 | 14,23 | confere | `.hchip`, `.focus-row`, `.inp` |
| `muted/surface-2` | 6,30 | 5,09 | confere | radio, placeholder, "Save my progress" inerte |
| `primary-ink/surface` | 11,12 | 6,02 | confere | valores destacados, `eco`, `download` |
| `primary-ink/primary-soft` | 7,69 | 5,21 | confere | foco escolhido, carinha escolhida |
| `on-primary/primary-fill` | 12,38 | 6,02 | confere | todos os `primary` |
| `gold-ink/surface` | 8,84 | 5,87 | confere | carga, "· New!", estrela, sol |
| `gold-ink/bg` · `muted/bg` · `ink/bg` · `primary-ink/bg` | 10,51 · 8,83 · 16,15 · 13,21 | 5,41 · 5,35 · 14,96 · 5,55 | conferem | quadros |
| `primary-ink/surface-2` (não-texto) · `muted/surface` (não-texto) · `primary-fill/surface` (não-texto) | 9,43 · 7,43 · 11,12 | 5,28 · 5,80 · 6,02 | conferem | anéis, tracejado, ● da janela |
| **`ink/primary-soft`** | 9,40 | 14,04 | **não listado** | título do foco escolhido, "Stretch · counted" |
| **`muted/primary-soft`** | 5,14 | 5,02 | **não listado** | a PALAVRA de esforço ("quick"/"medium") dentro da linha escolhida — passa, mas é o par mais apertado do canvas no claro (5,02) e não está na tabela |
| `gold-ink/surface-2` | 7,49 | 5,15 | não usado | (referência, caso a carga um dia entre num card) |
| `line/surface` | 1,32 | 1,25 | — | só divisor decorativo (`.hr`), nunca fronteira de alvo — ✓ |

Nenhum par abaixo de 4,5 (texto) ou 3 (não-texto) nos dois temas — **confirmado**. Os emoji de humor são
glifos coloridos; o que se mede é o anel do alvo (`muted/surface-2` 6,30 / 5,09).

### 1.3 Dobra a 390×844

Confere com a tabela do README (medido `getBoundingClientRect` do `.dlg` e dos botões, DPR 1): `CheckInPendencias`
85–759 · `RelatorioOferta` 88–756 · `MarcoCerimonia` 213–631 · `WelcomeInstalar` 430–843 · `PrimeiraTarefa`
409–843 · `SemanaCartao` cartão 419–800 · `ProtegerProgresso`/`WelcomeNotificacoes` marcador a 753 (= 189 + 564).
Nenhum diálogo precisa rolar; nenhum `tall`.

## 2. Achados

### FATAL

Nenhum.

### FIXÁVEL (ordem de alavancagem)

**X1 — Emblema do marco a 0,75× dentro do vidro (`MarcoCerimonia`).** `milestone-21.png` é 64² e está desenhado
a 48 CSS: em DPR 2 são 96 px de aparelho para 64 px nativos = **1,5×** — `image-rendering: pixelated` a 1,5×
alterna pixels de 1 e 2 e a arte sai "tremida" justamente na única peça em que o pixel é o protagonista. P2
(a) declarou a transição 0,5×/1×/1,5× **para a criatura** (256² a 128), não como licença geral; a cena do
sonho (1×) e a aventura (0,5×) mostram que o canvas sabe ficar na grade. O sprite da mesma cerimônia a 96
(0,375×) tem o mesmo problema em escala menor. **Conserto:** emblema a **64** (1× em DPR 1, 2× em DPR 2 —
cabe no canto do vidro 176×120 com o sprite a 128, ou o vidro cresce para 200×136) ou a **32** (0,5×); o
sprite a 128 (o mesmo 0,5× do palco) ou a 64 (o mesmo do retorno). Regra para o README: **toda arte no
vidro em múltiplo de 0,5× do nativo** — e a tabela §1.1 acima entra no rodapé.

**X2 — Confete atravessando o título (`RelatorioDiaCompleto`, `RelatorioOferta`).** O SVG 200×100 ocupa
176–276 e o `h2` "Complete day!" ocupa 130–260 × 240–264: **3 das 14 peças** caem dentro da caixa do título
(gold 125,250 12×4 · primary 253,250 12×4 · rect primary 166,261 8×8). Onde uma peça `primary-ink #5FF3E0`
passa por trás de uma letra `ink #E9F5F2` o contraste local é ≈ **1,3:1**. "Atrás do título" (PRINCÍPIOS §5,
o anti-padrão Weverse evitado) é sobre z-order, não sobre permissão de cruzar as letras. **Conserto:**
manter as 14 peças **fora do retângulo do título** (reservar 130–260 × 236–268), ou subir o SVG 16 px
(160–260) para que a estrela e o confete vivam acima da linha de base do título — nada de `text-shadow`
(o README já proíbe, e está certo).

**X3 — O tier aparece duas vezes na cerimônia (`MarcoCerimonia`).** O `eco` 48 FILL .34 `primary-ink` (D-R10,
"o mesmo glifo da lista") e, logo abaixo, a linha do código `MILESTONE_TEXT.sprout.en` = "🌿 7 days! This
habit is a sprout now." — o 🌿 é o `tierIcon` emoji do `MilestoneCeremony.tsx` que a identidade **acabou de
trocar** pelo `eco`, e ele volta pela copy. Emoji é glifo colorido do sistema (Segoe no Windows, Noto no
Android — a peça muda de cara por plataforma) **fora do vidro**, o oposto da tese do aparelho; e o rodapé
do próprio artboard diz que o emoji sai. Copy idêntica ao wireframe (fidelidade OK), mas a identidade tem
de registrar: **"7 days! This habit is a sprout now." sem o emoji** — lote de copy do `staff-frontend`
(`MILESTONE_TEXT` × 3 tiers × PT/EN + `tierIcon` deixa de ser prop). Não é mudança de regra nem de
estrutura. (As carinhas de humor são caso diferente — ver D-R6.)

**X4 — Emblemas de marco: ids, rótulos e arte descasados (`utils/achievements.ts` + `assets/soulmon/emblems/`).**
Estado medido: `ACHIEVEMENT_IDS` tem `'streak-7'` e `'milestone-21'`; os rótulos são "7-day habit" /
"21-day milestone"; **o comentário do cabeçalho do mesmo arquivo já os chama `habit-7`/`habit-21`** (o
código diverge do próprio comentário); `HABIT_MILESTONES = [7, 21, 66]` com tiers `sprout/sapling/tree`;
os arquivos são `streak-7.png` (um **anel**) e `milestone-21.png` (o **broto**) — a arte do broto (tier de
7 dias) está no arquivo "21", e o marco de **66** (Lally, o único com evidência) **não tem emblema**. O
artboard, com razão, usa o broto para o marco de 7. Nada disso é persistido (`unlockedAchievements` deriva
do save na leitura, "nada aqui é persistido") — **renomear é grátis**, sem migração.
**Recomendação (casamento id ↔ tier ↔ arte):**

| id (novo) | Tier | Dias | Arte | Rótulo EN/PT |
|---|---|---|---|---|
| `habit-7` | sprout | 7 | **broto** = o `milestone-21.png` de hoje, renomeado `habit-7.png` | "7-day habit" / "Hábito de 7 dias" (fica) |
| `habit-21` | sapling | 21 | **arvoreta** — `habit-21.png`, nova (`squad-arte`, 64², mesma paleta do broto) | "21-day habit" / "Hábito de 21 dias" |
| `habit-66` | tree | 66 | **árvore** — `habit-66.png`, nova | "66-day habit" / "Hábito de 66 dias" |

O anel (`streak-7.png`) **sai** — "streak" é o vocabulário que o produto trocou por constância (R7/guarda 5a)
e um anel não é planta; se a `squad-arte` quiser reaproveitar, `perfect-day` é o único emblema sem
planta. A cerimônia passa a receber `emblemFor(tier)` (`emblemArt.ts`) em vez de `tierIcon` emoji, o que
fecha X3 junto. Testes a tocar: `achievements.test.ts` (ids), `emblemArt` (glob), nenhum de save.
Dono: `staff-frontend` (ids) + `squad-arte` (duas artes). Fica registrado no README como achado 10 —
**confirmo o achado e amplio para 66**.

**X5 — README com afirmações que o DOM/código não confirmam.** (a) D-R6: "`mood`/`sentiment_satisfied`
cobrem 2 de 5" — a Material Symbols Rounded tem o conjunto **completo** (`sentiment_very_dissatisfied`,
`sentiment_dissatisfied`, `sentiment_neutral`, `sentiment_satisfied`, `sentiment_very_satisfied`); o que
falta é **no subset de 102** (+5 nomes, o mesmo caminho de P6). Corrigir a frase: a decisão de ficar com o
emoji é válida (ver D-R6), mas o motivo escrito é falso. (b) D-R10 diz "cerimônia num `.dlg`" e a tabela
"`role=status` como o wireframe" — o `.dlg` da cerimônia **não tem `role` nenhum** (o `role=status` está no
container do véu, como no código); está certo por fidelidade, mas o README lê como se o `.dlg` fosse
diálogo. (c) Tabela de AA sem `ink/primary-soft` e `muted/primary-soft` (§1.2) — acrescentar.

### RUÍDO (registrar, não voltar por isso)

**N1 —** `.dobra` (Proteger, Notificações) cobre uma linha do texto das strips (`color-mix(surface 85%)`
translúcido sobre "'evolution'), fica." / "Condição de entrada…"). É marcador de spec, `pointer-events:
none`, aceito em Atividades (D-A6). Se der para descer 2 px o texto ou pôr o marcador entre parágrafos,
melhor; não bloqueia.

**N2 —** `CheckInNormal`: "Planned load: **5** points · chosen focus: **5**" — a amostra tem os dois dígitos
iguais (1+2+2 = 5 e todos os focos escolhidos), e o leitor não distingue as duas medidas. Amostra com uma
pendência fora do foco (carga 6 · foco 5) explica melhor a linha. Só amostra.

**N3 —** `PrimeiraTarefa` mantém o × ("× = last in focus order") por fidelidade ao wireframe RIT-26 — mas R8
promove a peça a **cerimônia** (classe do marco, z-300, espera o gesto), e V1 tirou o × da cerimônia
(um botão, `MilestoneCeremony.render.test.tsx`). O wireframe aprovado carrega a tensão; o canvas de
identidade não deve resolvê-la sozinho. Para o lead: quando o `staff-frontend` implementar R8, a folha
vira `.dlg` sem × — ou o teste de "um botão" é da cerimônia do marco só.

**N4 —** `.tagd` "sm-milestone-pop — off under reduced-motion" dentro do telefone, sobre o vidro — herdado
do wireframe (D-R12 respeitada). Fica.

**N5 —** `.hchip` (`surface-2` sobre `surface`, 1,5:1 escuro / 1,1 claro) sem borda: é **etiqueta** (não
interativa, no código é `<span>`), então a fronteira não precisa de 3:1 (Sistema F2 vale para alvo). OK.

**N6 —** `MainClaro` prova AA dos quadros; os diálogos claros não têm artboard (decisão 3 do dono: claro
só no Main). Os pares medidos em §1.2 cobrem os diálogos no claro — está coberto por cálculo, não por
render. Registro, não pedido.

## 3. D-R1…D-R12 — veredito

| # | Veredito | Nota |
|---|---|---|
| D-R1 `.dlg` sobre scrim literal | **confirmo** | scrim `rgba(4,18,20,.55)` z 10 cobre o palco (medido por `elementFromPoint`); fundo nunca por opacidade; Home F1 respeitada |
| D-R2 relatório/check-in como aparelho | **confirmo** com X2 | manchetes Material 48 no subset; confete em vetor; "recovering" 400 sem sinal; `primary-ink` como o sublinhado do wireframe — o confete só não pode cruzar as letras |
| D-R3 pixel só em vidro, quatro tamanhos | **confirmo** com X1 | sonho 1×, aventura 0,5×, retorno 0,5× (DPR 2) na grade; o emblema 0,75× e o sprite 96 da cerimônia saem dela — corrigir a escala, não a decisão |
| D-R4 `.focus-row` (escolhido/não/inerte) | **confirmo** | inerte = tracejado + `aria-disabled` + tinta, sem alpha (Home E7/F1); `muted/primary-soft` 5,14 / 5,02 passa |
| D-R5 `.hchip` 32 etiqueta | **confirmo** | no código é `<span>` não interativo; 24/32 = leitura (SIS-03) |
| D-R6 humor = emoji em alvos 44 | **confirmo, com ressalva** | a decisão de não trocar por glifo é de produto (`utils/mood.ts`, guarda 5b) e fica; o **motivo** no README está errado (X5a): o conjunto `sentiment_*` existe completo, só não está nos 102. Se o lead quiser um dia o aparelho puro, é +5 glifos (P6) — decisão, não identidade |
| D-R7 saídas em `outline`, um `primary` por peça | **confirmo** | conferido em todas as 12 peças com CTA; "Close" do cartão `quiet` 120×44 |
| D-R8 carga = `role=status` `gold-ink` sem moldura | **confirmo** | bg transparente, 0 borda, 14px, `info` 20 (D-A4) |
| D-R9 convite `outline` de duas linhas a 260, sem cadeado | **confirmo** | `max-width:260`, `role=button`, × "Do not show again" 44 antes do convite no foco; sem preço riscado |
| D-R10 cerimônia num `.dlg` | **confirmo** com X3 | precisa de superfície para AA (texto branco sobre véu, como o código faz, depende do que está por baixo); o `eco` 48 é o tier — então o 🌿 da copy sai |
| D-R11 folhas de gate = `ModalSheet`, fluxo com marcador a 564 | **confirmo** | D-A6 aplicada; marcador a 753 nos dois casos |
| D-R12 anotações só as do wireframe | **confirmo** | diff de palavras: nada acrescentado além dos nomes de ligature e do `.dobra` |

## 4. Para o lead / `[pendente do dono]`

- **Nenhuma decisão do dono.** Nenhum token novo, nenhum glifo fora dos 102.
- **Para o lead:** X4 (casar `habit-7/21/66` com a arte; duas artes novas para a `squad-arte`) e N3 (o ×
  da primeira tarefa quando R8 virar cerimônia).
- **Para o `staff-frontend`:** os 17 achados do README ficam de pé; acrescentar X3 (copy da cerimônia sem
  emoji, `tierIcon` → `emblemFor(tier)`) e X4 (ids). Regra nova para o rodapé: arte no vidro sempre em
  múltiplo de 0,5× do nativo.
- **Para o guarda:** nada de vermelho, nada de dígito de falta, nada de contagem de ausência; a folga
  é contada; a oferta é convite; a raridade do sonho vem sem causa. Não há linha para vetar.

## 5. Veredito final

**ENTRA COM CONSERTOS.** 0 fatais · 5 fixáveis (X1 escala do emblema/sprite na cerimônia, X2 confete fora
das letras, X3 copy da cerimônia sem emoji, X4 casamento dos emblemas, X5 três frases do README) · 6 ruídos.
Estrutura 21/21 idêntica ao wireframe aprovado; AA por token confirmado nos dois temas; 0 alpha, 0 texto
< 12, 0 alvo < 44, 0 pixel fora do vidro. A rodada 2 é de uma tarde: X1/X2 são CSS de uma linha, X3/X5 são
texto, X4 é para o código. Pode ir ao checkpoint do dono com os consertos colados no README — o recorte
200×200 recomendável é o vidro da cerimônia (`MarcoCerimonia`, sprite + broto) **depois** de X1.
