# CRÍTICA — canvas "Jogos" (identidade, Fase 2, oitavo canvas) · `design-critic`

> Revisão BLOQUEANTE · 20/09/2026 · alvo: os 16 `.dc.html` + `MainClaro` + `canvas.json` + `README.md` desta pasta,
> servidos em `localhost:8774`.
> Método: (1) diff estrutural artboard a artboard contra `../<mesmo nome>.dc.html` — sequência de `role`, de `aria-label`,
> dos marcadores de foco (`.fo`) e o conjunto de palavras (`cmp.py`, 16 pares); (2) `getComputedStyle` +
> `getBoundingClientRect` em todos os nós do `.phone` nos 17 artboards (texto < 12px, Silkscreen fora do `.screen`, alvo
> < 44 entre `button/input/a/summary` e `role=button/checkbox/radio/textbox/switch/tab/link/menuitem`, vazamento de 390,
> `<img>`/`background-image`/`border-image`/`mask-image` fora do vidro, `opacity < 1`, `opacity()` em `filter`,
> `text-shadow`, `scrollHeight` do `.ab` contra o `canvas.json`) + as caixas de cada `<img>` DENTRO de cada `.screen`,
> os `.meter` (fill, trilho, `aria-value*` × largura desenhada), os `.trail` da barra de timing, os `.switch`, as
> `[role=tab]`, as linhas `.rk`, os `.dlg` — script PRÓPRIO (`crit_jog.mjs` + `pos_jog.mjs`, Chromium via
> `playwright-core`, 420×900, DPR 1), não o do designer; (3) hex recalculados do `src/index.css` (bloco ONDA 1) com a
> fórmula WCAG 2.x, inclusive `primary-soft` composto (rgba .14 sobre `surface`) e a placa `color-mix(viewport-bg 78%)`
> sobre cena branca/preta; (4) os 16 glifos cruzados com o inventário de 102 (`tokens.md`); (5) **a caixa de alfa de
> cada arte** (Pillow, alfa > 8) e a composição pixel a pixel do FX sobre o sprite onde os dois ocupam a mesma caixa;
> (6) cruzado com DECISÕES §11 (J1–J5 / V1–V4 / S1–S4) e §18–§23, `HANDOFF-IDENTIDADE.md` §4–§7, as sete
> `CRITICA.md` anteriores, `CLAUDE.md` › ⚔️ Masmorra / 💠 Bits / 🎖️ Emblemas / 🎪 Rodada / "três moedas", e o código
> (`DungeonGame.tsx`, `ArenaGame.tsx`, `TournamentPage.tsx` `TIER_ICON`, `utils/currencies.ts` `bitsStyle`,
> `utils/fxArt.ts`, `assets/soulmon/lines|fx|bg|dino|icons/games`).
> Não editei nenhum artboard.

## 0. Resumo

| Classe | Qtd | O que pesa |
|---|---|---|
| **fatal** | 0 | — |
| **fixável** | 7 | **a faísca `fx-sparkle` a 1× é desenhada POR CIMA do pet** no clímax da run (`MasmorraFim` JOGO-08) e na vitória do pesadelo (`PesadeloFim` JOGO-24) — caixa 97–225 × −8–120 sobre o sprite 97–225 × 24–152: **28,4 % dos pixels opacos do pet cobertos**, cabeça e dorso (900 dos 1.774 px das 48 linhas de cima), e 54 px da estrela cortados pelo topo do vidro (`top:-8`); o README diz "em cima" e é literalmente em cima — a regra "FX não sobrepõe a criatura" (Evolução X2, Home D-H5) está reprovada de novo · **o `favorite` do coraçãozinho renderiza a 12 px** (classe `.i16` não existe em nenhum bloco de CSS; herda os 12 da linha) e 16 nem está na escala de ícones do Sistema (20/24/32/48, +18 só em checkbox) — o README afirma "16 FILL" · **a luta da Arena desenha um estado impossível** ("You · Charge 2/3" + "Special charged — aim for the center!": no código o título "Special charged" só existe com carga ≥ 3, e aí a linha diz "✨ Special ready") — herdado do wireframe, mas é copy de amostra, não estrutura; e é exatamente o estado que provaria o `auto_awesome` da D-J9, que **nenhum artboard desenha** · **o visor da run encolhe 16 px entre fases** (176 no turno → 160 no inimigo derrubado / andar limpo / fim: o mesmo vidro da mesma tela pula de altura) · **Bits em `ink`** quando `bitsStyle` (`currencies.ts`) fixa `--sm2-primary-ink` no call-site e documenta a sobrescrita por `ink` como bug corrigido — o canvas segue o SIS-07 aprovado (número em `ink`), então é decisão do lead, não erro do designer · README com cinco medidas de visor que não batem com o DOM (350→348, 308→288, ×3) |
| **ruído** | 10 | o mini-visor 32 do ranking mostra **~16 px de criatura** (Lumel: caixa 125×110 → 16×14) — é um ponto colorido, não identificação (pendente do lead, §3) · `gold-fill` na barra do inimigo (pendente do lead, §3) · anotações herdadas do wireframe DENTRO de nós semânticos (`(fightError, B5)` dentro do `role=alert`; a `.note` do "top tier" dentro do card da faixa) · "Fight" com nome acessível "Challenge ‹nome›" (WCAG 2.5.3, herdado do código) · a derrota do Torneio sem visor enquanto a vitória tem (wireframe) · a folha "luta" do pesadelo sem visor (o código mantém os sprites) · as tags-pílula dentro do card-botão da página · "S12 · 3rd" no cabeçalho (posição absoluta de season passada — aprovado pelo guarda) · "Go deeper — 30 Bits" sem o saldo na tela (estrutura) · 0,25× = 0,75× em DPR 3 |

**Veredito: ENTRA COM CONSERTOS.** Nenhum fatal, nada estrutural reaberto, fidelidade 16/16, AA por token nos dois
temas, 0 alvo < 44, 0 texto < 12, 0 opacidade, 0 pixel fora do vidro. **X1–X4 são obrigatórios antes do checkpoint do
dono** — X1 é o recorte 200×200 mais provável (a run completa) e cada um custa uma linha (posição do FX, uma classe de
ícone, uma linha de copy, um `height`). **X5 é decisão do lead** (recomendação em §3). X6–X7 são README. Rodada 2 para
colar as medições novas no README; só X5 e as duas pendências passam pelo lead.

**O que está certo e não precisa de rodada:** estrutura **idêntica nos 16 pares** — mesma sequência de `role`, mesmos
`aria-label` (a única diferença é o do inimigo da `MasmorraTurno`, que no wireframe carregava um `<span>` dentro do
atributo e aqui é "Sand Wisp" limpo — correção, não divergência), mesmos marcadores de foco (10 · 3 · 3 · 4 · 5 · 6 · 4 ·
6 · 4 · 2 · 8 · 7 · 10 · 9 · 8 · 2), mesma copy (as diferenças são ligatures de glifo, os placeholders "PIXEL WINDOW" /
"PET" / "ENEMY" / "HAND" que viraram arte, "vs" → "VS", "💗 +1 heart" → glifo + "+1 heart", e "2.4s" separado num
`<span class=num>`); **0 nós < 12 px** nos 17; **0 alvo < 44** (× 44×44; "Attack!"/"Dodge!"/"Push!" 240×48; "Jump"
356×64; jogadas do PPT 44; abas 176×44; switch em host 52×44; "Fight" 95×44; nav); **0 vazamento** de 390; **0 Silkscreen
fora do `.screen`** (a única do canvas é "VS" 14 dentro do vidro do PPT, `viewport-ink` sobre placa 78 % — 8,46 / 17,30
no pior caso); **0 `opacity < 1`, 0 `opacity()`, 0 `text-shadow`** em nó nenhum dos 17; **0 PNG / `background-image` /
`border-image` / `mask-image` fora do vidro** (todos os 27 `<img>` e as 8 cenas estão dentro de um `.screen`; o único
`background-image` fora é o gradiente do anel de cobre, precedente da Home); **16 glifos, 16 no inventário de 102**
(`bolt, close, cloud_off, emoji_events, favorite, leaderboard, military_tech, pan_tool, park, play_arrow, swords` + os
5 da nav); ícone nunca em box (os mini-visores guardam SPRITE, não ícone — precedente SIS-07 / Pet D-P8);
`canvas.json` = `scrollHeight` dos 17 `.ab` (2475 · 1572 · 1922 · 2459 · 1728 · 1955 · 2274 · 1894 · 1819 · 1602 · 1710 ·
1863 · 1571 · 1908 · 1708 · 1921 · 1739); **os 18 pares de contraste do README conferem ao centésimo** nos dois temas
(`ink/bg` 16,15 / 14,96 · `muted/surface-2` 6,30 / 5,09 · `primary-ink/primary-soft` 7,69 / 5,21 · `gold-fill/surface-2`
5,59 / 4,20 · `viewport-ring/bg` 5,92 / 3,66 · `line/surface` 1,32 / 1,25 decorativo); **`--sm2-danger-*` ausente do
corpo dos 17**; **escala inteira em toda arte** (pet/inimigo/mãos/FX no popup/obstáculo 0,5×; FX no vidro, espírito e
faixas do Dino 1×; Dino/oponentes/resultado 0,25×; a única fracionária é o 32 do ranking, declarada — D-J13); **os
`aria-valuenow/max` batem com a largura desenhada** (34/40 → 85 %; 12/30 → 40 %; 18/30 → 59 %; 30/40 → 74 %; 160/300 →
53 %); a dobra a 844 como o README mede (Torneio 117–189, os quatro minijogos 223–597, nav 774; Lobby "Enter" 373–421 e
"Go deeper" 429–477; Dino "Jump" 539–603; PPT jogadas 307–351; Arena do Torneio oponentes 361–535; Ranking: faixa
202–330, sete linhas 360–638, botão 646–694); as regras do `CLAUDE.md` respeitadas — **perder não custa coração e a tela
diz** ("Losing costs you the run — never your hearts." no Lobby; "You were defeated — your hearts are untouched." no
JOGO-09, na MESMA tinta da vitória); **Bits sem ícone, em `--sm2-font-mono`** ("42 Bits", `aria-label` "Bits: 42");
**Emblemas em serifa dourada** (`military_tech` 20 FILL `gold-ink` + Georgia 16/700; "+3"/"+1" a 20 no resultado — 3
vitória / 1 derrota como `EMBLEMS_PER_WIN/_LOSS`); **a faixa ANTES do ranking** ("Your tier" · `park` = Broto, como
`TIER_ICON` · barra `gold-fill` "só sobe" · depois "Season ranking" com a janela de ±3, você em 12 entre 9 e 15); **a
rodada como ritual** ("Round of Sep 14–20" 12 `muted`, sem relógio, sem contagem regressiva; "2 matches left today" plural
real); **as barras de HP FORA do vidro, em vetor, sem ❤️ e sem vermelho** ("You" `primary-fill`, o outro `gold-fill`,
trilho `surface-2` + fronteira `muted` 6,30); **"VS" a única palavra pixel** do canvas, dentro do vidro; **o × é o
primeiro interativo em todo minijogo** (fo 2 nos oito); **as três moedas não se parecem** (mono sem ícone × serifa
dourada com `military_tech`; Créditos ausentes); os `role` certos (`dialog` + `aria-modal` no pesadelo e no resultado;
`status` nos popups do golpe, no erro `sem-motor` e no offline; `alert` no `fightError` com filete `gold-ink` 3 px;
`progressbar` com rótulo nas cinco barras; `tablist`/`tab` com `aria-selected`; `switch` com `aria-checked` e, no
travado, `aria-disabled` + forma tracejada, fora da ordem de foco); o inimigo espelhado de frente para o pet (Turno,
Resultado); **o FX de derrota no lugar exato do inimigo** (`fx-defeat` 178–306 × 8–136 = a caixa do `nautilu-rookie` no
Turno — a derrota é do outro, e o vidro conta isso sem palavra); o obstáculo do Dino e o pet na mesma linha de chão
(pés a 152, faixa do chão 144–192); as mãos do PPT inteiras (alfa 0–128 de altura → 40–104 no vidro de 144); os
oponentes inteiros no mini-visor 64 (`kaelen-champion-virus` 8–246 → 2–62; `thalindra` 25–231 → 6–58).

## 1. Fixável (X — obrigatórios antes do checkpoint: X1–X4)

**X1 · A faísca cobre a criatura no clímax (`MasmorraFim` JOGO-08 · `PesadeloFim` JOGO-24)** — medido no DOM: `fx-sparkle`
128² a 1× em `left:97 top:-8` (e `80 / −8` no pesadelo), o pet 128 em `left:97 top:24` (`80 / 8`). Composição pixel a
pixel (Pillow): dos 7.688 px opacos do pet, **2.186 (28,4 %) ficam sob pixel opaco da faísca** — todos com alfa > 128, ou
seja, cobertura sólida, não brilho —, e nas 48 linhas de cima (a cabeça) são 900 de 1.774. A massa da faísca está nas
bandas 32–80 da arte (623 · 968 · 1.051 px por 16 linhas), que caem exatamente sobre a cabeça e o dorso. Além disso
`top:-8` corta 54 px da estrela grande pelo topo do vidro. É a terceira vez que a mesma regra aparece na Fase 2 (Home
D-H5: "reduzido ao balão, não cobre o sprite"; Evolução X2: "a faísca a 2× desenhada POR CIMA da criatura"), e é o
recorte 200×200 mais provável deste canvas. **Conserto (uma linha por artboard):** a faísca no lugar do inimigo
derrubado — a composição do Turno, com o pet em `left:16 bottom:8` e o `fx-sparkle` em `right:16 top:8` (no vidro de
288 do pesadelo: `left:8` / `right:8`, como a Intro faz com o espírito). Nenhum pixel do FX sobre o sprite, nenhum
cortado, e a narrativa fecha sozinha: a run acabou onde o último inimigo estava. Se o designer preferir o pet centrado,
a alternativa é o FX a 0,5× (64) no canto superior direito — mas aí o clímax da run ganha menos pixel que o popup de
um golpe.

**X2 · O `favorite` do coraçãozinho está a 12 px, não a 16 (`MasmorraFim` JOGO-10; D-J9)** — `<span class="ico i16 on">`:
a classe `.i16` não existe em nenhum dos quatro blocos de CSS (existem `.i18{18px}`, `.i20`, `.i24`, `.i32`, `.i48`), então o
glifo herda os 12 px da linha `.s`. Computado: `font-size: 12px`. E 16 não está na escala do Sistema (SIS-01: ícones
20/24/32/48, "+18 só dentro de checkbox"). **Conserto:** usar a escala — `.i18` (reusando a exceção "glifo inline",
declarada) ou `.i20` com `vertical-align` — e corrigir o README/D-J9. A mesma correção vale para o `auto_awesome` da Arena
(X3), que a D-J9 também promete a 16.

**X3 · A luta da Arena desenha um estado que o código não produz (`Arena` JOGO-11, terceiro strip)** — a linha de estado
diz "You · Charge 2/3 · enemies weakened" e o título diz "Special charged — aim for the center!". Em `ArenaGame.tsx`
(l. 501–516) o título "Special charged" só aparece com `carga >= SPECIAL_CHARGE_TURNS` (3), e nesse caso a linha de
estado é "✨ Special ready", nunca "Charge N/3". O wireframe já tinha o par (fidelidade), mas é copy de amostra, não
estrutura — o mesmo tipo de conserto que Onboarding X1 ("`TutorialTarefa` sem estado impossível"). **Conserto:** linha
"You · Special ready · enemies weakened" com o `auto_awesome` FILL `primary-ink` no lugar do ✨ — o que, de quebra, faz a
D-J9 ter UM artboard que a prova (hoje o glifo não é desenhado em lugar nenhum: `Arena` só carrega `close` e
`cloud_off`). Alternativa: manter "Charge 2/3" e trocar o título para "Your turn — aim for the center!".

**X4 · O visor da run muda de altura entre fases (`MasmorraTurno` 176 → `MasmorraAndar`/`MasmorraFim` 160)** — medido:
`.screen.gv` 322×176 no Turno, 322×160 no inimigo derrubado, no andar limpo, na run completa e na derrota. É o mesmo
componente (`DungeonGame`), o mesmo chrome, a mesma tela: entre "PERFECT!" e "Sand Wisp defeated!" o vidro encolhe 16 px e
tudo abaixo sobe. O wireframe variava 130 → 110 (placeholder), o que explica a herança, mas o placeholder não tinha
sprite de 128 dentro. **Conserto:** `height:176px` nos quatro visores da masmorra (o Lobby já está em 176). A Arena (160)
é outra tela e pode ficar.

**X5 · Bits em `ink` contra `bitsStyle` em `primary-ink` — decisão do lead** — "42 Bits" computa `rgb(233,245,242)` =
`--sm2-ink`. `utils/currencies.ts` › `bitsStyle` fixa `color: var(--sm2-primary-ink)` e o comentário do arquivo registra
como bug corrigido justamente o call-site que fazia `{ ...bitsStyle, color: 'var(--sm2-ink)' }` ("o número saía na tinta
do texto corrido e o `--sm2-primary-ink` daqui não chegava à tela"). O canvas não inventou: segue o SIS-07 aprovado pelo
dono (`Dados.dc.html`: `.stat b` em `ink`, "Bits" em `muted`) e a tese do próprio `currencies.ts` ("A DISTINÇÃO CONTINUA
NA FAMÍLIA TIPOGRÁFICA"). Precedência: código > canvas — mas o canvas Sistema passou pelo checkpoint com `ink`, então há
duas fontes aprovadas discordando. **Recomendação:** manter `ink` (ciano é a única luz forte da página e já está no card
do Torneio; a família mono é a distinção declarada; AA 16,15 / 14,96) e registrar para o `staff-frontend` que
`bitsStyle.color` vira `--sm2-ink` quando a página migrar (com o par no `tokens.contrast.test.ts`). Se o lead preferir o
código, é uma linha no `.bits` e o par `primary-ink/bg` (13,21 / 5,55) já está na tabela do README.

**X6 · README: cinco medidas de visor não batem com o DOM** — "vidro 350×176" (Lobby) → **348×176** (anel 356 − 2×4);
"350×192" (Dino) → **348×192**; "350×144" (PPT) → **348×144**; "VISOR 308×160" (PesadeloIntro) → **288×160** (anel 296
dentro do `.dlg` de 330); "308×112" (TorneioResultado) → **288×112**; e no Turno/Andar/Fim/Arena, por estarem dentro de
`.strip`, os vidros medem **322** (na tela real, 348). A tabela de dobra está certa (69–245 etc.); é o texto das
decisões (D-J3, D-J4, README §"O que cada artboard prova") que arredonda para 350/308. Corrigir para o número medido —
o `staff-frontend` vai usar esses números.

**X7 · README: "favorite 16 FILL" e "auto_awesome 16 FILL" (D-J9) e "fx-sparkle a 1× em cima"** — os três descrevem o
que X1–X3 reprovam; reescrever depois dos consertos (o "em cima" vira "no lugar do inimigo derrubado").

## 2. Ruído (R — registro; nada a mudar no canvas sem o lead)

- **R1 · Mini-visor 32 do ranking (D-J13, pendente do lead)** — ver §3.
- **R2 · `gold-fill` na barra do inimigo/pesadelo (D-J5, pendente do lead)** — ver §3.
- **R3 · Anotações dentro de nós semânticos, herdadas do wireframe** — `<span class="note">(fightError, B5)</span>` está
  DENTRO do `<p role="alert">` (`TorneioArena`), e a `.note` "top tier: …" está dentro do card da faixa (`TorneioRanking`):
  um leitor de tela anuncia "The match didn't happen. Try again. (fightError, B5)". D-J16 manda replicar as notas do
  wireframe e o canvas replicou; registro para o wireframe (`../`), não reabertura.
- **R4 · "Fight" com nome acessível "Challenge Lu"** — o texto visível ("Fight") não está contido no nome acessível
  (WCAG 2.5.3 Label in Name; quem usa comando de voz diz "Fight" e nada acontece). É o código (`TournamentPage.tsx` l. 475)
  e o wireframe; vai para o STATUS junto de J5.
- **R5 · A derrota do Torneio não tem visor; a vitória tem** (`TorneioResultado`) — o wireframe só desenhou uma janela, e
  a tinta é a mesma. Mas "a saída não muda de cor com o resultado" vale para a tinta e não para a imagem: quem perde não
  vê as criaturas. `PesadeloFim` faz o certo (o pet inteiro nos dois — nada caiu). Sugestão para o lead, estrutural:
  o mesmo visor 288×112 nos dois diálogos.
- **R6 · A folha "luta" do pesadelo não tem visor** (`PesadeloIntro`, segundo strip) — o wireframe idem; o
  `NightmareBattle` mantém os sprites durante a luta. Declarar no `.cap` que o visor da proposta persiste (ou desenhá-lo)
  para o `staff-frontend` não ler "sem sprite na luta".
- **R7 · Tags-pílula dentro de card-botão** (`Main`: "Ranking" / "Your sheet" / "High score" / "Quick" em `surface-2`,
  24 de altura) — dentro de um `role=button` de 72, uma pílula lê como segunda ação. Não é alvo (0 < 44) e é do
  wireframe; registro.
- **R8 · "S12 · 3rd"** — o troféu de season (`emoji_events` `gold-ink`) traz posição absoluta de season passada no
  cabeçalho do Torneio. É o troféu REAL ganho (`CLAUDE.md` 🎖️: 🥇🥈🥉) e o guarda aprovou a família; registro de que é
  a única posição absoluta acima da faixa.
- **R9 · "Go deeper — 30 Bits" sem o saldo na tela** (`MasmorraLobby`) — a aposta é oferecida sem o número que ela
  gasta (o código tem `bits` na prop e responde "Not enough Bits." depois do toque). Estrutura do wireframe; nota para o
  lead (o `.bits` do `Main` caberia no chrome do Lobby).
- **R10 · 0,25× (Dino, oponentes, resultado) = 0,75× em DPR 3** e 0,125× = 0,375× — o README diz "inteiras em DPR 2/4",
  o que é verdade e é também a metade que importa: em DPR 3 (a maioria dos Android) nenhuma das três escalas do canvas
  é inteira, o que a P2 (a) já declarou como transição. Registro para o pedido à `squad-arte` (64² para o Dino e os
  oponentes, 32² para o ranking).

## 3. Pendentes do lead — recomendação

**(a) Mini-visor 32 do ranking (D-J13).** Medido: `lumel-rookie` tem caixa de alfa 125×110 em 256 → a 0,125× são **16×14 px
de criatura** dentro de um quadrado de 32; `serah` 237×144 → 30×18; `orrin` 173×192 → 22×24. Com `image-rendering:auto`
vira um borrão de cor. Isso não identifica ninguém; a linha se identifica pelo nome, e a linha "you" pela tinta
`primary-soft` + anel. Trocar para 64 quebra a dobra (7 × 68 = 476 → o ranking iria de 360 a 836 e "See the whole season"
sairia da tela). **Recomendação: manter D-J13 como transição, com o pedido à `squad-arte` (ícone 32² por linha × tier)
como CONDIÇÃO, não opcional** — e registrar no README a medida acima (16×14) para que ninguém leia "criatura a 32" como
identificação. O `staff-frontend` deve renderizar os 256² a 32 com filtro (como o canvas), nunca `pixelated`.

**(b) Barra do inimigo em `gold-fill` (D-J5).** A alternativa `muted` reprova por outro motivo: `muted` é a tinta do
inerte no canvas (switch travado D-J14, esmaecer F1 de Atividades) e é a fronteira do próprio trilho — uma barra
preenchida em `muted` dentro de uma fronteira `muted` lê como barra desativada, não como o HP do outro. `gold-fill` não é
moeda (a moeda é `gold-ink` em serifa com `military_tech`) e passa como não-texto (5,59 / 4,20). O que torna a escolha
segura é uma regra, não a cor: **a barra do outro nunca aparece na mesma tela que Emblemas ou a barra da faixa** — hoje
é verdade (masmorra, pesadelo e Arena não mostram Emblemas; o Torneio não tem tela de luta). **Recomendação: manter
`gold-fill` e escrever essa regra no README** (D-J5), para que uma tela futura que junte as duas leituras saiba que
precisa de outra tinta.

## 4. Veredito por decisão (D-J1…D-J16)

| # | Veredito | Observação |
|---|---|---|
| D-J1 | **entra** | 5 glifos Material 24 pelados, todos no inventário; o card em destaque por anel 1 px `primary-ink` (11,12 sobre `surface`) + ícone ciano; nenhum `icon-game-*.png` |
| D-J2 | **entra com X5** | mono sem ícone ✓, serifa dourada ✓, `aria-label` "Bits: 42"/"Emblems: 12" ✓; a COR dos Bits é decisão do lead (§1 X5) |
| D-J3 | **entra com X4/X6** | chrome vetor + `.ring` + `.screen.gv` + HUD fora, × primeiro interativo (fo 2 nos oito) ✓; a altura do vidro da run varia (X4) e as medidas do README arredondam (X6) |
| D-J4 | **entra com X1** | escalas 0,5× / 1× / 0,25× medidas nos 27 `<img>` ✓; `fx-defeat` no lugar do inimigo ✓; **`fx-sparkle` sobre o pet** (X1) |
| D-J5 | **entra** (pendente b) | `.meter` fora do vidro, `primary-fill` / `gold-fill`, `aria-value*` = largura ✓; recomendação em §3 (b) |
| D-J6 | **entra** | trilho `surface-2` + fronteira `muted` (6,30), zona `primary-soft` com filetes `primary-ink` (9,43), marcador 3×22 `primary-ink`, `aria-hidden` ✓; nenhum `#4ade80`/`#60a5fa` |
| D-J7 | **entra** | `role=status` SIS-03, mini-visor 64 sem anel com o FX 128² a 0,5×, título Rubik 14/500 `ink` nos três (inclusive "Too slow!"), "2.4s" `ink` `tabular-nums` ✓ |
| D-J8 | **entra** | nenhuma cor de prêmio/perda nas frases de fase; `--sm2-danger-*` ausente; "Recovered 10 HP" e "The next run got harder." em `muted` ✓ |
| D-J9 | **volta (X2, X3)** | o `favorite` renderiza a 12 px (`.i16` não existe) e 16 está fora da escala; o `auto_awesome` não é desenhado em nenhum artboard |
| D-J10 | **entra** | três `.chip` 44 de texto; mãos só no vidro (0,5×, inteiras); "VS" Silkscreen 14 caixa alta sobre placa 78 %, 8,46 / 17,30 no pior caso — a única palavra pixel do canvas |
| D-J11 | **entra** | HP/DMG/Essence em `.chip.tag` com valor `ink` (11,52 sobre `surface-2`); sem `military_tech` no lobby; `cloud_off` 48 `muted` no `sem-motor` |
| D-J12 | **entra** | mini-visor 64 nos oponentes (sprites inteiros), `.tabs` 176×44 com sublinhado 3 px, `.alert` com filete `gold-ink`, J1 "pet · estágio" sem faixa ✓ |
| D-J13 | **entra como transição** (pendente a) | 0,125× declarada; medida real 16×14 px de criatura — condição: os ícones 32² (§3 a) |
| D-J14 | **entra** | `aria-disabled` + borda tracejada `muted` + botão `muted`, sem `.fo`, `opacity` 1; a frase do Vínculo em 12 `muted` sem âmbar ✓ |
| D-J15 | **entra como transição** | 8 cenas 1080×1920 (75–173 mil cores) em `cover` com `image-rendering:auto`, ~28 % da cena visível; sprites/FX/faixas `pixelated` ✓; pedido à `squad-arte` mantido |
| D-J16 | **entra** (R3) | só as notas do wireframe — inclusive as duas que ficaram dentro de nós semânticos (registro para `../`) |

## 5. Veredito por artboard

| Artboard | Id | Veredito | O que pesa |
|---|---|---|---|
| `Main` | JOGO-01 | **entra** (X5) | fidelidade ✓, dobra ✓, AA ✓; só a cor dos Bits espera o lead |
| `MainClaro` | JOGO-01 claro | **entra** | o mesmo DOM, `ink #0E2422`, ciano `#0B6F68` (5,55), tags 5,09 ✓ |
| `MasmorraLobby` | JOGO-02 | **entra** (X6, R9) | pet 128 inteiro no vidro 348×176 (pés a 153); "Enter" primário / "Go deeper" `outline` ✓ |
| `MasmorraTurno` | JOGO-03·04·05 | **entra** (X4) | o inimigo espelhado, barras fora do vidro, timing vetor, três popups `status` ✓; `aria-label` do inimigo corrigido |
| `MasmorraAndar` | JOGO-06·07 | **entra** (X4) | `fx-defeat` exatamente na caixa do inimigo ✓; três linhas do andar em `muted` ✓ |
| `MasmorraFim` | JOGO-08·09·10 | **volta (X1, X2)** | faísca sobre o pet e cortada no topo; `favorite` a 12 px; derrota na mesma tinta ✓ |
| `PesadeloIntro` | JOGO-23 | **entra** (R6) | `.dlg` `role=dialog` com × primeiro, pet 128 × espírito 128² a 1× sem sobreposição (8–136 / 152–280) ✓; J3 `[novo]` ✓ |
| `PesadeloFim` | JOGO-24·25 | **volta (X1)** | a mesma faísca sobre o pet na vitória; a derrota com o pet inteiro e o MESMO primário ✓ |
| `Dino` | JOGO-12·13 | **entra** (X6, R10) | parallax 512×128 e chão 384×48 a 1× repetidos, pet 64 e obstáculo 64 na mesma linha de chão, "Jump" 356×64 ✓ |
| `PPT` | JOGO-14 | **entra** (X6) | "VS" a única palavra pixel; mãos 0,5× inteiras; jogadas como chips 44 ✓ |
| `Arena` | JOGO-11 | **volta (X3)** | ficha em tags ✓, `sem-motor` como `status` com `cloud_off` ✓; a luta desenha "Charge 2/3" + "Special charged" |
| `TorneioVazio` | JOGO-15 | **entra** | switch desligado em host 52×44, "Round of Sep 14–20" sem relógio ✓ |
| `TorneioTravado` | JOGO-21 | **entra** | inerte por forma, `aria-disabled`, fora do foco, sem âmbar ✓ |
| `TorneioArena` | JOGO-22 | **entra** (R3, R4) | Emblemas serifa, abas com sublinhado, `alert` com filete, oponentes em mini-visor 64 inteiros, "Fight" 95×44 ✓ |
| `TorneioOffline` | JOGO-22 offline | **entra** | `status` com `cloud_off` 48 `muted`, "Try again" `outline` 200 ✓ |
| `TorneioRanking` | JOGO-16·17·18 | **entra como transição** (R1) | faixa antes do ranking ✓, janela ±3 ✓, linha "you" em `primary-soft` + anel ✓; o 32 mostra 16×14 px de criatura |
| `TorneioResultado` | JOGO-19·20 | **entra** (X6, R5) | "Victory"/"Defeat" na mesma tinta, "Emblems +3/+1" serifa 20, criaturas a 64 inteiras no vidro 288×112 ✓ |

## 6. Para os outros papéis

- **`soulmon-design-lead`:** X5 (cor dos Bits); pendentes (a) e (b) com as recomendações de §3; R5 e R9 são estruturais
  (wireframe) — decidir se voltam como achado para `../` ou ficam.
- **`soulmon-visual-designer` (rodada 2):** X1–X4 nos artboards; X6–X7 no README; colar as medições de §0 e §3 (a).
- **`docs/STATUS.md` (a11y, junto de J5):** R3 (anotação dentro de `role=alert` — só no wireframe, mas o padrão de
  `<span class="note">` dentro de nó semântico vale checar no código), R4 (Label in Name do "Fight").
- **`squad-arte`:** os pedidos do README ficam; acrescentar a medida do §3 (a) ao pedido dos ícones 32² e o R10 aos
  64² do Dino/oponentes.
- **`staff-frontend`:** `bitsStyle.color` conforme X5; o FX da run completa no lugar do último inimigo (X1); a altura do
  vidro da masmorra fixa (X4); o `auto_awesome`/`favorite` na escala (X2/X3).
