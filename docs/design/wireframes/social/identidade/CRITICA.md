# CRÍTICA — canvas "Social" (identidade, Fase 2, 11º canvas) · `design-critic`

> Revisão BLOQUEANTE · 20/09/2026 · alvo: os 8 `.dc.html` + `MainClaro` + `canvas.json` + `README.md` desta pasta,
> servidos em `localhost:8777`. As decisões deste canvas são citadas como **D-C1…D-C10** (o README as chama D-S1…D-S10; a
> sigla colide com a Estatísticas).
> Método: (1) diff estrutural artboard a artboard contra `../<mesmo nome>.dc.html` — sequência de `role`, de `aria-label`,
> dos marcadores de foco (`.fo`) e a copy (8 pares); (2) `getComputedStyle` + `getBoundingClientRect` em todos os nós do
> `.phone` nos 9 artboards (texto < 12px, Silkscreen fora do `.screen`, alvo < 44 entre `button/input/a/summary` e
> `role=button/checkbox/radio/textbox/switch/tab/link/menuitem`, vazamento de 390, `<img>`/`background-image`/`border-image`/
> `mask-image` fora do vidro, `opacity < 1`, `opacity()` em `filter`, `text-shadow`, `scrollHeight` do `.ab` contra o
> `canvas.json`) + as caixas de cada `<img>` DENTRO de cada `.screen`, os `.meter` (fill × `aria-value*`), as
> `[role=tab]`, os `.dlg`, os `[aria-disabled]` (tinta, `outline`, `.fo`), os `[role=alert]`/`[role=status]`, o selo —
> script PRÓPRIO (`crit_gen.mjs` + `probe2.mjs`, Chromium via `playwright-core`, 420×900, DPR 1), não o do designer;
> (3) hex recalculados do `src/index.css` (bloco ONDA 1) com a fórmula WCAG 2.x, inclusive `gold-ink` sobre `viewport-bg`
> no claro (2,76 — o par que a D-C7 evitou) e `primary-soft` composto; (4) os 17 glifos + nav cruzados com o inventário
> de 102 (`tokens.md` §5); (5) **a caixa de alfa e a projeção de colunas das 36 artes de `lines/`** (sharp + Pillow, alfa
> > 8), em especial as quatro `serah-*`; (6) o código — `ui/OfflineSeal.tsx` (cabeçalho: "selo, que é o segundo lugar
> onde a bitmap é permitida"), `src/styles/tokens.md` §"Quando usar Silkscreen" (dois lugares: dentro do `Viewport` **e em
> selos**), `CoopPanel.tsx` (`disabled` l. 116/142/228/269; a copy da meta batida l. 183), `LibraryPage.tsx`,
> `PlayerDetailModal.tsx`, `utils/sprites.ts` (`DUNGEON_LINE_NAMES`), `Sistema/Estados.dc.html` e `Home/HomeOffline.dc.html`
> (o `.seal` aprovado); (7) cruzado com DECISÕES §14 (C1–C5 / V1–V6 / S1–S4) e §18–§25, `HANDOFF-IDENTIDADE.md` §4–§7,
> as dez `CRITICA.md` anteriores e `CLAUDE.md` › Vínculo derivado / Biblioteca-NPCs / linhas vermelhas sociais /
> Torneio-faixas / "o app nunca cobra".
> Não editei nenhum artboard.

## 0. Resumo

| Classe | Qtd | O que pesa |
|---|---|---|
| **fatal** | 0 | — |
| **fixável** | 4 | **D-C7 (o selo como micro-visor) reabre um átomo que o dono já aprovou** — o `.seal` do SIS-06 (16/09) e o `HomeOffline` da Home (HOME-44) desenham a `OfflineSeal` como pílula `surface-2` + Silkscreen; este canvas desenha o MESMO componente como `.screen` `viewport-bg` com `border-radius: 999px` e aro 2 px — uma terceira forma de visor (pílula) que o SIS-05 não tem, para resolver uma "exceção" que o `tokens.md` já sanciona por escrito ("Use só em dois lugares: dentro do `Viewport`; em **selos**") · **D-C10 ("Create" `primary`, "Join" `outline`) não é provada por artboard nenhum**: no `GrupoSemGrupo` os dois botões só existem INERTES (`aria-busy` / `aria-disabled`, `surface-2` + `muted` nos dois — computado), e inerte por superfície apaga a diferença que a decisão declara · **o achado 12 conta duas tiras; são TRÊS** (`serah-ultimate` também: quatro corridas x 5–61 / 67–122 / 137–178 / 199–250, alfa só em y 86–158) — e o canvas Estatísticas DESENHA a tira no bestiário (crítica de lá, X1) · README: o pedido à `squad-arte` e a recomendação de D-C7 |
| **ruído** | 9 | D-C9 `.dlg` × `ModalSheet` (entra — recomendação em §3) · D-C8 galho em `ink` (entra) · "That was everyone's 🌿" no `role=status` (copy do código, l. 183) · NPCs Lumel/Ignar × Kaelen/Orrin/Thalindra (achado 11, registro) · `aria-disabled` "sem número de foco" fica focável no browser (nota para o `staff-frontend`) · o palco mini de 120 atrás do scrim corta 17 px dos pés do pet (precedente Rituais/Home X11) · `astrase-rookie` (x 3–251, y 0–255) enche o mini-visor 64 sem margem (Ana em três artboards) · anotações dentro do telefone · 0,25× = 0,75× em DPR 3 |

**Veredito: ENTRA COM CONSERTOS.** Nenhum fatal, nada estrutural reaberto, fidelidade 8/8, AA por token nos dois temas,
0 alvo < 44, 0 texto < 12, 0 opacidade, 0 pixel fora do vidro, nenhum `danger`. **X1 é decisão do lead e minha
recomendação é VOLTAR ao `.seal` SIS-06** (§3 a); **X2 e X3 são obrigatórios antes do checkpoint do dono** (uma troca de
estado e uma linha de README). Rodada 2 só para X1–X4.

**O que está certo e não precisa de rodada:** estrutura **idêntica nos 8 pares** — mesma sequência de `role`, mesmos
`aria-label` (8/8 conjuntos iguais), mesmos marcadores de foco (17 · 4 · 13 · 20 · 3 · 11 · 11 · 12); **0 nós < 12 px**
nos 9; **0 alvo < 44** (ações 44×44; linhas 64; abas 116×44; "Try again" 200×44; busca 330×44; botões do grupo 330/356×48;
× 44; "Close" 324×48; nav 78×68); **0 vazamento**; **0 `opacity < 1`, 0 `opacity()`, 0 `text-shadow`** nos 9; **0 PNG /
`background-image` fora do vidro** (os 18 `<img>` estão dentro de um `.screen`: 64² nas linhas, 192² no perfil, o palco
mini de 348×120 atrás do scrim); **Silkscreen só em "NO SIGNAL"** (14 px, caixa alta — dentro de um `.screen`, o que é
exatamente a discussão de X1); **17 glifos + 5 da nav, todos no inventário de 102** (`groups, search, person,
volunteer_activism, flag, paid, add, do_not_disturb_on, sync, cloud_off, refresh, close, check_circle,
radio_button_unchecked, content_copy, check, arrow_forward`); **ícone nunca em box** em nenhum dos 9 (as ações são glifos
pelados 24 num alvo 44 transparente — medido `background: rgba(0,0,0,0)`); **nenhum avatar de pessoa** (a identidade do
outro é a criatura no vidro; o `person` só vive na aba "All"); `canvas.json` = `scrollHeight` dos 9 `.ab` (2626 · 1573 ·
2023 · 1924 · 1953 · 1805 · 1981 · 2012 · 3309); **os 15 pares de contraste do README conferem ao centésimo** nos dois
temas (`ink/bg` 16,15 / 14,96 · `muted/bg` 8,83 / 5,35 · `primary-ink/bg` 13,21 / 5,55 · `on-primary/primary-fill` 12,38
/ 6,02 · `muted/surface-2` 6,30 / 5,09 · `gold-ink/bg` 10,51 / 5,41 · `viewport-ink/viewport-bg` 16,82 / 14,53 ·
`viewport-ring/bg` 5,92 / 3,66 · `primary-fill/surface-2` 9,43 / 5,28 · `ink/surface-2` 11,52 / 14,23 no código do
convite · `line/surface` 1,32 / 1,25 decorativo); **`--sm2-danger-*` ausente do corpo dos 9** — os 6 `role=alert` em
filete 3 px + tinta `gold-ink` 500 (`rgb(235,190,132)` computado), nunca vermelho; **escala inteira em toda arte** (256²
a 64 = 0,25× nas linhas, caixa 0–64; 256² a 128 = 0,5× no perfil, caixa 32–160 no vidro 192²) e **corte 0 %** (a maior
caixa de alfa, `astrase-rookie` 249×256, cabe nos dois vidros; conferido contra a máscara 64/raio 4 nas 36 artes);
**as abas SIS-04** (`role=tablist`/`tab`/`aria-selected`; ativa `primary-ink` + sublinhado 3 px `rgb(95,243,224)`,
quietas `muted`; nunca placa cheia); **o inerte por FORMA** (`aria-disabled="true"`, tinta `muted`, `outline: dashed 1px
muted` `offset −2`, `opacity 1`, sem `.fo`; `title` + `aria-label` dizem o motivo em palavras — "Already gifted today",
"Needs full energy to gift", "Limit of 5 friends"; nunca cronômetro); **o `.meter` SIS-07 na meta SOMADA** (`aria-valuenow`
7/20 → 124/356 = 35 % ✓; 0/20 → 0 ✓; 20/20 → 302/304 ✓); **a meta batida em UMA frase `role=status` em `ink` 14** — sem
confete, sem dourado; **por pessoa só "showed up today / not yet today"** (`check_circle` FILL `primary-ink` /
`radio_button_unchecked` `muted`); **o perfil é OLHAR** (`role=dialog` + `aria-modal` "Ana"; criatura 128 no vidro 192²
com anel, `role=img` "Ana's Soulmon"; "Brasa" 14/500; "12 days playing" 12 `muted`; "PET'S PATH" `.lab` + glifo de Poder
18 + "Power" em `ink`; "Close" `outline` 48; nada de HP, escada, presente — decisão 8b + #21 ✓); **o Vínculo não
aparece** (derivado, nunca persistido — nada a desenhar ✓); **"N days playing" abaixo do nome, nunca à direita** (13.15
✓); **"Friends 2/5" número próprio** (guarda b ✓); **os NPCs são linhas de `DUNGEON_LINE_NAMES`** (Lumel, Ignar — ✓,
ver R4); **"Try again" e "Leave the group" em `outline`**, nunca `quiet`; **o código do convite em `--sm2-font-mono` 14
`letter-spacing .1em` num chip `surface-2`** com `content_copy` 24 num alvo 44 e o estado copiado (`check` FILL
`primary-ink`); **os quatro estados de C2** (carregando `sync` + frase; vazio UMA frase 12 sem ilustração e sem "0
friends"; erro `cloud_off` 48 `muted` + "Try again"; sem rede = o mesmo bloco + o selo na raiz + as duas linhas demo
intactas); **a linha degradada** com o vidro apagado e as duas ações vivas (guarda f ✓); a dobra a 844 como o README mede
(`Main`: as quatro linhas 224–484, nota até 559, nav 774; `AmigosPresente`: Bruno 685–749; `GrupoComGrupo`: o card
inteiro até 624 com "Leave" 576–624; `PerfilJogador`: `.dlg` 93–751).

## 1. Fixável (X — X1 decisão do lead; X2–X3 obrigatórios antes do checkpoint)

**X1 · D-C7: o selo como micro-visor reabre o `.seal` do SIS-06 — volta ao literal (recomendação; decisão do lead).**
Medido no `SemRede`: `[role=status]` 144×32 contendo um `.screen` com `background: viewport-bg`, `border: 2px solid
viewport-ring`, **`border-radius: 999px`**, `cloud_off` 20 e "NO SIGNAL" Silkscreen 14 em `viewport-ink`. Três problemas,
em ordem de peso:
(a) **Não é uma exceção que precisava ser eliminada.** A "2ª exceção à tese" de Home R3 foi registrada contra a
frase do `HANDOFF` §1 ("Silkscreen só dentro do visor"), mas a régua medida da identidade — `src/styles/tokens.md`
§"Quando usar Silkscreen" — diz: "Use **só** em dois lugares: 1. dentro do `Viewport`; 2. em **selos** (rótulo de
conquista, marca de dia perfeito, faixa de torneio)". O cabeçalho de `ui/OfflineSeal.tsx` repete: "é um selo, que é o
segundo lugar onde a bitmap é permitida". O `.seal` é regra, não desvio; R3 pediu que o `04` §1 *dissesse* as duas
exceções, não que a segunda sumisse.
(b) **O átomo já passou pelo dono.** `Sistema/Estados.dc.html` (SIS-06, checkpoint de 16/09) desenha
`.seal{min-height:32px; border-radius:999px; background:var(--sm2-surface-2); border:1px solid var(--sm2-line)}` com
`cloud_off` em `gold-ink` + `.pix` "NO SIGNAL", e `Home/HomeOffline.dc.html` (HOME-44, checkpoint de 16/09) o replica
byte a byte. O 11º canvas desenha o MESMO componente de outra forma: a partir daqui a `OfflineSeal` tem duas
identidades aprovadas, e o `staff-frontend` implementa uma só. Mudar um átomo do Sistema é rodada do Sistema (e da
Home), não decisão local.
(c) **Uma pílula com aro não é um visor.** A tese do Visor é "pixel art DENTRO (sprite, cenário, decoração, FX), aparelho
FORA em vetor". O SIS-05 tem duas formas de vidro — o visor (raio 12, anel 4 px, raio 20) e o slot/mini-visor (raio 4,
sem anel) —, ambas retangulares e ambas guardando MUNDO. Um `.screen` em `border-radius: 999px` com aro de 2 px, que
guarda um ícone Material e uma palavra do sistema, é uma terceira forma sem SIS e sem mundo dentro: é o aparelho fantasiado
de visor para que o `guard()` não o veja. O próprio argumento do README ("a voz do aparelho fala pelo vidro") contradiz o
`tokens.md`: a Silkscreen é a voz do APARELHO — e o selo é onde o aparelho fala fora do vidro, por definição.
**Conserto:** `.seal` SIS-06 literal (`surface-2` + `line` 1 px, `cloud_off` `gold-ink` 20, `.pix` "NO SIGNAL" 14 em
`ink` — 16,15 / 14,96 sobre `surface-2`: 11,52 / 14,23), a exceção declarada como na Home, e uma isenção declarada para
`.seal` no `guard()` (uma linha: `.pix` permitida dentro de `.screen` **ou** `.seal`). Se o lead preferir o micro-visor,
o caminho é: SIS-06 revisado → Home `HomeOffline` republicada → aqui; nunca nascer no 11º canvas.

**X2 · D-C10 não é provada por artboard nenhum (`GrupoSemGrupo` SOC-06).** Computado: "Create" = `.btn.pri.dis`,
`aria-disabled="true" aria-busy="true"`, `background rgb(22,55,53)` (`surface-2`), `color rgb(157,188,180)` (`muted`);
"Join" = `.btn.out.dis`, `aria-disabled="true"`, **o mesmo `surface-2` + `muted`**. Nenhum dos dois tem `.fo`. É o estado
"ocupado depois do toque" (coerente com `CoopPanel.tsx` l. 116/142: `disabled={ocupado || …}` nos dois), e é o ÚNICO
estado em que os dois botões aparecem em todo o canvas — o `GrupoEstados` cobre sete estados do grupo ATIVO, nenhum do
sem-grupo. A decisão "Create `primary`, Join `outline` — hierarquia, não estrutura" só existe no CSS; na tela os dois
são idênticos. O wireframe já desenhava o ocupado (fidelidade), mas o wireframe não tinha hierarquia de cor para provar.
**Conserto:** o artboard principal com as duas formas VIVAS (nome digitado → "Create" `primary`; código de 8 → "Join"
`outline` com `arrow_forward`) e o ocupado como `.strip` abaixo (a mesma peça dos outros canvases) — os dois botões
ganham `.fo`, e a ordem de foco do par muda em +2: exceção de fidelidade a declarar no README, como as de Onboarding.
Alternativa: rebaixar D-C10 a "declaração de CSS, sem artboard" — mas aí não passa pelo dono como decisão.

**X3 · O achado 12 diz duas tiras; são três — e o canvas irmão desenha a tira.** sharp/Pillow em
`src/assets/soulmon/lines/`: `serah-rookie` (y 16–159; colunas 11–60 · 70–120 · 135–184 · 192–247), `serah-champion` (y
24–158; 12–53 · 74–115 · 136–178 · 202–250) **e `serah-ultimate`** (y 86–158; 5–61 · 67–122 · 137–178 · 199–250) são
tiras de 4 quadros; só `serah-mega` (x 74–196, y 25–218) é um quadro. As outras 32 artes têm UMA corrida. A decisão de
tirar a Serah do canvas (Ana em `astrase`) está certa; o pedido à `squad-arte` precisa dizer **três** arquivos, e
registrar que o `Bestiario.dc.html` da Estatísticas (STAT-06) desenha o `serah-rookie` a 64 — quatro pintinhos num
mini-visor — e que a masmorra de hoje sorteia essa linha (`getDungeonEnemySprite`). Para o `docs/STATUS.md`: uma régua
que reprove tira em `lines/*.png` (projeção de colunas com mais de uma corrida larga), porque
`sprites.dungeonRoster.test.ts` trava nomes e linhas, não a forma da arte.

**X4 · README** — (a) D-C7 com a recomendação de X1 (ou a decisão do lead); (b) achado 12 e o pedido à `squad-arte`
com três arquivos + a referência cruzada à Estatísticas; (c) se X2 entrar, a exceção de fidelidade (+2 `.fo` no
`GrupoSemGrupo`) na seção de medição.

## 2. Ruído (R — registro; nada a mudar no canvas sem o lead)

- **R1 · D-C9 — o perfil em `.dlg` centrado em vez de `ModalSheet` (pendente do lead).** Ver §3 (b). Medido: `.dlg`
  356×658 (93–751 em 844), `role=dialog` + `aria-modal` "Ana", × primeiro (fo 2), "Close" segundo (fo 3) — os mesmos
  papéis e a mesma ordem do wireframe. Entra.
- **R2 · D-C8 — o galho em `ink`** (glifo de `AlignmentIcons` 18 `currentColor` + "Power" 14/500): identidade, não
  semáforo; a Evolução decidiu igual ("Heading toward Power" sem cor). Entra; `ATTR_COLOR`/`ATTR_INK` ficam como achado 6.
- **R3 · "Weekly goal reached. That was everyone's 🌿"** no `role=status` — é a copy de `CoopPanel.tsx` l. 183
  (fidelidade), mas é a mesma família que Rituais X3 tirou da cerimônia (emoji na frase do sistema). Registro para o
  `redator-ux`, não para o canvas.
- **R4 · NPCs Lumel/Ignar "40 days playing" × código Kaelen/Orrin/Thalindra (47/88/133, champion/ultimate/mega)** —
  achado 11 já registra; os nomes do canvas são chaves válidas de `DUNGEON_LINE_NAMES` (`CLAUDE.md` › Biblioteca), então
  a regra está respeitada; só a amostra difere. Registro.
- **R5 · `aria-disabled` + "sem número de foco"** — no browser, `aria-disabled` NÃO tira o elemento da ordem de foco
  (só `disabled` nativo tira); o canvas (e o wireframe, e o precedente da Home deck `.cell.dis`) desenha o inerte sem
  `.fo`, o que promete "fora do foco". Para o `staff-frontend`: ou `disabled` nativo + `opacity: 1` forçado por CSS +
  a forma tracejada, ou `aria-disabled` + `tabindex="-1"`. O achado 3 do README deve dizer qual.
- **R6 · O palco mini (348×120) atrás do scrim corta os pés do pet** — `igni-rookie` 128 em `top: 24` no vidro de 120:
  as linhas opacas vão até 137 (alfa y 29–226 → 38–137), 17 px cortados pelo fundo do vidro. É a peça de Rituais (mesmo
  CSS `.stage.mini{height:120px}`), aprovada como transição (Home X11); registro, não reabertura.
- **R7 · `astrase-rookie` (x 3–251, y 0–255) a 0,25× enche o mini-visor 64 sem margem** (Ana no `Main`, `MainClaro`,
  `AmigosPresente`; e a 0,5× no perfil, caixa 32–160 — ali cabe com folga). Corte 0 % medido, respiro 0. A mesma
  família de Jogos R10 / Estatísticas R6: pedido à `squad-arte` de grade 64² com margem.
- **R8 · Anotações dentro do telefone** (`.note` sob a lista, o marcador de dobra, as `.tagd`) — herdadas do wireframe,
  mesma prática dos outros canvases. O "(estrutura aprovada…)" do rodapé está fora do `.phone` ✓.
- **R9 · 0,25× = 0,75× em DPR 3** — P2 (a) declara a transição; idem Jogos R10.

## 3. Pendentes do lead — recomendação

**(a) D-C7 — micro-visor × `.seal` SIS-06.** Recomendação: **voltar ao `.seal`** (X1). O que decide não é a estética da
pílula (o aro de cobre é bonito) — é que (1) o `tokens.md` já autoriza Silkscreen em selo, então não há exceção a
eliminar; (2) o átomo foi aprovado pelo dono no Sistema e replicado na Home, e um componente com duas identidades é o
custo real; (3) um vidro sem mundo dentro contradiz a tese, não a serve. O `guard()` ganha a isenção declarada para
`.seal` — é uma linha, e é honesto: o gerador passa a saber que existe UM lugar fora do vidro onde a bitmap vive.

**(b) D-C9 — `.dlg` centrado × `ModalSheet`.** Recomendação: **manter o `.dlg`**. Conteúdo curto (vidro + três linhas +
um botão), sem lista, sem rolagem; Rituais D-R1 fixou "diálogo curto = centrado; a folha é para o que rola". Mesmos
`role`/`aria-modal`/ordem de foco do wireframe — é apresentação, não estrutura. Uma ressalva para o `staff-frontend`:
o `.dlg` mede 658 de 844 (78 %); a `ModalSheet` mantém os literais (§18), então a migração é para o primitivo `.dlg`
SIS-06, não um restyle da folha.

**(c) D-C8 — galho em `ink`.** Recomendação: manter (R2).

**(d) D-C10 — "Join" em `outline`.** Recomendação: manter a hierarquia e **desenhá-la** (X2).

## 4. Veredito por decisão (D-C1…D-C10)

| # | Veredito | Observação |
|---|---|---|
| D-C1 | **entra** (R7) | mini-visor 64² sem anel, sprite 0,25× caixa 0–64 (18 `<img>` medidos); perfil 0,5× no vidro 192² com anel; corte 0 % nas 36 ✓; `astrase` sem margem (R7) |
| D-C2 | **entra** | nenhum `person` em box, nenhuma inicial/foto; `groups` 24 pelado `muted` no título; a linha degradada com o vidro apagado ✓ |
| D-C3 | **entra** | `role=tablist`/`tab`/`aria-selected`; ativa `primary-ink` + sublinhado 3 px + glifo FILL; 116×44; "Friends 2/5" cabe ✓ |
| D-C4 | **entra** (R5) | `aria-disabled` + `muted` + `outline: dashed 1px` `offset −2` + `opacity 1`, sem `.fo`; `title`/`aria-label` em palavras nos três motivos ✓; a nota de foco é para o código (R5) |
| D-C5 | **entra** | `add` `primary-ink` FILL; `paid` `ink`; `do_not_disturb_on` `muted`; 24 pelados em 44 transparentes ✓ |
| D-C6 | **entra** | 6 `role=alert` em filete 3 px + `gold-ink` 500 (`rgb(235,190,132)`); `danger` ausente dos 9 ✓ |
| D-C7 | **volta (X1)** | reabre o `.seal` SIS-06 aprovado; "exceção" que o `tokens.md` já sanciona; pílula-visor sem SIS — recomendação §3 (a) |
| D-C8 | **entra** (pendente c) | glifo 18 + "Power" 14/500 `ink`; `ATTR_COLOR` fica achado 6 |
| D-C9 | **entra** (pendente b) | `.dlg` 356×658, `role=dialog` + `aria-modal`, ordem de foco igual; Rituais D-R1 |
| D-C10 | **volta (X2)** | "Try again"/"Leave" em `outline` ✓ (medido: `surface` + anel); "Create"/"Join" só existem inertes — a hierarquia não é desenhada |

## 5. Veredito por artboard

| Artboard | Id | Veredito | O que pesa |
|---|---|---|---|
| `Main` | SOC-05 | **entra** (R4, R7) | fidelidade ✓ (17 `.fo`), dobra ✓ (linhas 224–484), abas ✓, ações 44 pelados ✓, "N days playing" sob o nome ✓ |
| `MainClaro` | SOC-05 claro | **entra** | `ink #0E2422`, `primary-ink #0B6F68` (5,55) na aba e no `add`; os mini-visores `#0E2422` ✓ |
| `Estados` | SOC-01 · 02 · 03 | **entra** | carregando / vazio (uma frase) / erro (`cloud_off` 48 + "Try again" `outline` 200×44) / degradada com ações vivas / 2 `alert` âmbar ✓ |
| `SemRede` | SOC-04 | **volta (X1)** | o bloco de erro e as duas linhas demo ✓; o selo como micro-visor (D-C7) |
| `AmigosPresente` | SOC-05 | **entra** | 3 inertes por forma + 1 ocupado (`sync`), motivos em palavras, `.fo` só nos vivos; Bruno 685–749 antes da nav ✓ |
| `PerfilJogador` | SOC-07 | **entra** (R1, R6) | `.dlg` "Ana", criatura 128 inteira no vidro 192², "PET'S PATH · Power" em `ink`, "Close" 48; nada de HP/escada/presente ✓ |
| `GrupoSemGrupo` | SOC-06 | **volta (X2)** | cards SIS-03, `.inp` 44, carregando, 2 `alert` âmbar, marcador de dobra 776 ✓; os dois botões só inertes |
| `GrupoComGrupo` | SOC-06 | **entra** | `.meter` 7/20 = 35 % ✓; por pessoa só presença ✓; check-in inerte por superfície + a frase do que falta ✓; código mono + `content_copy` 44 ✓; "Leave" `outline` ✓ |
| `GrupoEstados` | SOC-06 | **entra** (R3) | sozinho (0/20 + check-in VIVO `primary`), já avisei, meta batida em `status` `ink` sem confete, aviso âmbar com o grupo intacto, ocupado (`aria-busy`), copiado (`check` FILL), servidor ✓ |

## 6. Para os outros papéis

- **`soulmon-design-lead`:** X1 (D-C7) com a recomendação de §3 (a) — e, se mantiver o micro-visor, a rodada volta ao
  Sistema (SIS-06) e à Home antes deste canvas; D-C9/D-C8 conforme §3 (b)/(c); X2 (desenhar D-C10, com a exceção de
  fidelidade declarada).
- **`soulmon-visual-designer` (rodada 2):** X1 no `SemRede` (e no `guard()`); X2 no `GrupoSemGrupo`; X3/X4 no README.
- **`squad-arte`:** `serah-rookie` / `serah-champion` / `serah-ultimate` como um quadro 256² cada (X3 — o mesmo pedido
  da Estatísticas X1; a masmorra já desenha a tira em produção); grade 64² com margem (R7, junto de Jogos R10).
- **`docs/STATUS.md`:** a régua contra tira em `lines/*.png` (X3); R5 (`aria-disabled` × ordem de foco) junto do
  achado 3; os achados de código do README (1–13) ficam.
- **Cartógrafo:** nada novo além do que §14.4 já registra; o `SOC-06` continua uma linha para sete estados.
- **`staff-frontend`:** achados 1–13 do README; o selo conforme X1; `PlayerRow` → mini-visor 64 sem anel; o perfil no
  primitivo `.dlg` (R1); o inerte com a semântica de foco de R5.
