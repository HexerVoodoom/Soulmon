# Canvas "Loja" — identidade (Fase 2, nono canvas) · rodada 2 (20/09/2026, pós-crítica)

> **Rodada 2** (`CRITICA.md`: VOLTA curta — 1 fatal, 6 fixáveis, 9 ruídos): **F1/D-L12 — o palco SAIU** (a prova era falsa: `bg-room` é `FULL_SLOTS` e `furn-picture` `fits: any`, o código desenha o quadro no Quarto; o card explica em palavras com a copy literal do `ShopModal.tsx`); **X1** a tag "Equipped" desce para a coluna de texto, o nome nunca quebra (ellipsis); **X2** a recusa é só filete + região (a linha do card não muda de cor); **X3** todo valor em Bits em mono (região "+100 Bits.", os degraus "100 Bits", o toast); **X4** Bits em `primary-ink` como `bitsStyle` (mesma decisão de Jogos) + achado; **X5** medidas refeitas (cards 56–107); **X6** nota do `aria-label` em `<span>` para o `staff-frontend`. Ruídos aplicados: `sample` fora do `aria-label` (R1), "Soulmon Portrait" (R2), preços do código — Night Sky 150, Pixel Sofa 100 (R3); R8 o pedido das miniaturas à `squad-arte` vira firme.

> Dono: `soulmon-visual-designer` · 20/09/2026 · HANDOFF-IDENTIDADE §1, §4–§7 · base: canvas **Sistema** aprovado
> (`../../sistema/identidade/`, DECISÕES §18 — P1 espaço 4/8/12/16/24/32 + 2, **P2 = (a)** 256² a 128 CSS, **P3** nav 32),
> **Home** (§19: cenário em cover como transição), **Atividades** (§20: tinta nunca
> alpha, o gerador reprova `opacity < 1`), **Rituais** (§21), **Pet** (§22: D-P1 aba ativa em `primary-soft` + `primary-ink`,
> slot do Dex = mini-visor sem anel), **Evolução** (§10 + canvas: o vidro cresce para não cortar a arte — X3; o convite
> `.nudge` com `auto_awesome` dourado) e **Jogos** (§11 + canvas: Bits em mono sem ícone, Emblemas em serifa dourada,
> `<img>` só dentro de `.screen`). Tudo que as sete `CRITICA.md` anteriores reprovaram está reprovado aqui desde a rodada 1.
> Estrutura: os 7 wireframes cinza aprovados de `../` (DECISÕES §12, L1–L4 / V1–V4 / S1–S5) e as linhas `LOJA-01`→`LOJA-13`
> do `INVENTARIO-WIREFRAMES.md` §1.7 (`LOJA-12` `fora` por D5).
> **Cada artboard = o wireframe de mesmo nome com a identidade aplicada** — mesma hierarquia, mesmos estados, mesma copy
> (EN; PT no rodapé), mesma ordem de foco. Nada estrutural mudou; o que "pediu" para mudar está no rodapé como achado.
> Escuro em todos; claro só no `MainClaro` (decisão 3 do dono).
> **Regras que mordem, todas respeitadas no desenho:** as três moedas nunca se misturam (Bits = número em mono `primary-ink`, sem
> ícone — 💠; Emblemas = serifa dourada — 🎖️; Créditos = `diamond` em `credit-ink`, só na troca — 💎); o saldo é UMA leitura
> só, a da moeda do segmento (L1); o Coraçãozinho não está à venda (L2, 13.14) e o Glitchtama nunca; `unlock` = cadeado + a
> missão em palavras, progresso só com `cur > 0` (L3); o item equipado que não combina com o cenário não some — a loja
> explica; **nada de vermelho de cobrança** (a recusa sem saldo é âmbar de convite, o preço "esmaece" por tinta); a oferta é
> convite passivo no fim, sem × (L4, guarda 3b); a recusa não abre convite de Créditos (guarda 3a).

## Como abrir

O `<style>` de cada `.dc.html` é o bloco do `Sistema/Main.dc.html` **copiado** (tokens `--sm2-*`, átomos, rodapé) + o bloco
`HOME (composição)` (anel/vidro, nav, `.strip`) + `ATIV (composição)` + `JOG (composição)` (`.bits`,
`.embl`, `.mv`) + um bloco `LOJA (composição)` só de layout (o saldo `.balance`, os segmentos `.seg/.segi`, o card-aparelho
`.item` com o mini-visor `.mv.s72`/`.mv.bg`, o travado `.lk`, a recusa `.no`, a missão `.mis`, o convite
`.nudge`, a troca `.swap`) — nenhum token novo, nenhum literal de cor. As mesmas podas da rodada 2 de Atividades e o mesmo
`guard()` no gerador (reprova `opacity < 1`, `text-shadow`, `.pix` fora de `.screen`, `<img>` fora de `.screen` **e qualquer
`danger` dentro do telefone**).
Imagens e fontes por caminho relativo ao repo. Servir a raiz do repo:
`npx -y serve -l 8775 D:/Soulmon/repo` → `http://localhost:8775/docs/design/wireframes/loja/identidade/Main.dc.html`.
Gerador (fora do repo, no scratchpad da sessão): `gen_loja.py` (importa `gen_ativ_head.py`, os blocos `STYLE_ATIV`/`STYLE_JOG`
de `gen_ativ.py`/`gen_jogos.py`); medição `measure_loja.mjs`; diff de fidelidade `cmp.py` — os `.dc.html` são a fonte
commitada.

## O que cada artboard prova

| Artboard | Id | Prova |
|---|---|---|
| `Main.dc.html` | LOJA-01 | O saldo **"260 Bits" em `--sm2-font-mono` 16 `primary-ink` (a cor de `bitsStyle` — X4), sem ícone, sem chip** (V1 resolvido: o `<b>` 12px vira 16 mono); os dois segmentos SIS-04 com "Shop" em `primary-soft` + `primary-ink` + borda (não placa cheia — D-P1); a dica `role=status` 12 `muted`; a prateleira Itens = três **card-aparelhos**: o chip real (`item-chip-*.png` 96² a **48**, 0,5×) num mini-visor 72² sem anel, nome 14/500, "Goes to Items; use for +3 …" 12, **"120 Bits" na mesma fonte e cor do saldo**. A nota ⚰️ e o marcador "▼ … scroll below" ficam. |
| `MainClaro.dc.html` | LOJA-01 claro | O mesmo DOM sob `[data-theme=light]` — `ink #0E2422` / `bg #F1F7F5`, `primary-ink #0B6F68` sobre `primary-soft #D6F5EF`; os mini-visores continuam escuros (`viewport-bg #0E2422`). |
| `CenariosMobilias.dc.html` | LOJA-02 · 03 | **Sem palco** (rodada 2, F1): a regra "o que não combina não é desenhado, a loja explica" fica onde o código a põe — no card ("Doesn't show in the current scene", `ShopModal.tsx`). **Cenários num mini-visor 96×52** (a cena inteira, 1200×648 → 0,08×, ilustração — transição); **mobílias a 0,5× num slot 72²**; o EQUIPADO acende o slot (anel 2px `primary-ink` por fora do vidro) + tag "Equipped" com `check_circle` 18 FILL **na coluna de texto, sob a linha** (X1 — o nome nunca quebra: ellipsis); amostra do código: "Soulmon Portrait", Night Sky 150, Pixel Sofa 100; o TRAVADO inerte por forma (tracejado `muted`, nome `muted`, véu `color-mix(viewport-bg 70%)` no vidro, `lock` 18 + "locked" na tag `aria-hidden`). Dobra: tudo antes da nav (2º card de mobília 570–660, nota até 728, nav 774). |
| `CardEstados.dc.html` | LOJA-04 · 05 · 06 · 07 | Quatro estados do MESMO card: travado (missão em palavras, "· 2/5" `tabular-nums`, nunca "0/3"); comprado ("Equip" = `.btn.out.sm` **44** dentro do card — era 36 no wireframe; "Equipped" = tag + slot aceso); flash ("Night Sky purchased." 500 `ink` na região); **sem saldo = preço em `muted` (tinta, nunca `opacity .5`) e, no toque, SÓ o filete 1px `gold-ink` + "Not enough to buy Night Sky." em `gold-ink` na região** (X2: a copy do card não muda de cor — dourado é a cor do convite) — âmbar de convite, o `danger-ink` do código não entra. |
| `ConviteDemo.dc.html` | LOJA-08 | "No rush…" 12 `muted`; o convite é o `.nudge` da Evolução: card-botão 280, `auto_awesome` 24 FILL `gold-ink` pelado (dourado = convite, nunca ciano de ação), título 14/500, "Unlock the full Soulmon for `precoLabel` — your progress stays." 12, `chevron_right` 24 `muted` no fim; sem ×, sem preço riscado. |
| `TrocaCreditos.dc.html` | LOJA-13 | O cabeçalho com **`diamond` 20 FILL em `--sm2-credit-ink`** (a única moeda com glifo, na cor própria — 7,56 / 7,10 sobre `surface`) e o saldo `tabular-nums`; três degraus `.btn.out` 48 de largura inteira; o inerte por forma (`surface-2` + anel `line` + `muted`, `aria-disabled`); ocupado com `sync` 20 `muted` + `aria-busy`; falha em 12 `muted` (sem vermelho); sucesso "+100 Bits." na região e "+100 Bits!" no toast, **os dois em mono `primary-ink`, como "100 Bits" dentro dos degraus** (X3). |
| `TorneioSegmento.dc.html` | LOJA-09 · 10 | **O saldo troca de moeda com o segmento**: "12 Emblems" = `military_tech` 20 FILL + número Georgia 20 `gold-ink` + "Emblems" 12; "Tournament" ativo; as três missões em cards de 56 (frase 14, "2/3" 12 na própria linha, prêmio **"+3" em serifa dourada numa tag com o glifo**, "claimed" 12 `muted`); os prêmios no mesmo card-aparelho (`furn-crate`/`furn-shelf-simple` 138×150 a 69×75, 0,5× — a caixa de alfa 138×135/128 cabe em 72 sem corte) com **"8 Emblems" em Georgia 20 `gold-ink`**. |
| `TorneioEstados.dc.html` | LOJA-11 · 12 | Sem missões: mesmos segmentos, mesma dica, o card-aparelho direto; seção vazia = "Nothing here yet." 12 `muted` (sem ilustração, sem "volte segunda"); LOJA-12 não desenhado (D5). |

## Decisões de identidade (D-L1…D-L11; D-L12 saiu)

| # | Decisão | Fonte |
|---|---|---|
| D-L1 | **O aparelho em vetor, pixel só no vidro**: cards SIS-03, segmentos SIS-04, títulos Fredoka 20, Rubik 14/12; toda arte (chips, mobílias, cenários) dentro de um `.screen` — o `ShopModal` em `sm-px-*` + Silkscreen não é replicado | HANDOFF §1/§6; SIS achado 1 |
| D-L2 | **O item é a arte real, não o emoji**: `soulmon/items/item-chip-*.png` 96² a 48 (0,5×), `decor/furn-*.png` a 0,5×, `backgrounds/bg-*.png` em cover — o emoji continua sendo a CHAVE no código (`CHIP_EMOJI`, `item.icon`) | Home P2 (a) — escala inteira; `shop.ts` |
| D-L3 | **Mini-visor 72² para item/decoração** (o slot SIS-07 de 64 alargado a 72, como o vidro do nó da Evolução — X3 — para caber a caixa de alfa do caixote 69×68 e da prateleira 69×64 a 0,5× sem corte); **96×52 para cenário** (1200×648 inteira a 0,08×, `image-rendering:auto` — ilustração, transição). Sem anel (é identificação, como o slot do Dex — Pet D-P9) | Evolução X3; Pet D-P9; Home X11 |
| D-L4 | **Bits = "N Bits" em `--sm2-font-mono` 16 `primary-ink`, sem ícone, sem chip** — no saldo, no preço, na região e no toast (a moeda lê igual em todo lugar — X3); a cor é a de `bitsStyle` (`currencies.ts`), a mesma decisão de Jogos X5 (X4); `aria-label` "Bits: 260" e "‹name› — N Bits" ficam | `CLAUDE.md` 💠; 02 §46; V1 (§12.2); Jogos X5 |
| D-L5 | **Segmento ativo em `primary-soft` + `primary-ink` + borda `primary-ink`** — "onde estou" não é ação (a placa cheia é do primário) | Pet D-P1; SIS-04 |
| D-L6 | **O preço sem saldo esmaece por TINTA** (`muted`), nunca por `opacity` — o card continua botão | Atividades F1; 03 §4.6a |
| D-L7 | **A recusa é âmbar, e só no filete + região**: filete 1px `gold-ink` (inset, sem mudar a caixa) + a região `role=status` em `gold-ink`; a copy do card fica em `ink`/`muted` (X2 — dourado na copy leria como oferta); o `--sm2-danger-*` não aparece no canvas (o gerador reprova `danger` no telefone) | `CLAUDE.md` "o app nunca cobra"; visual-designer (âmbar e linguagem de convite); Jogos (sem `danger`) |
| D-L8 | **O card travado é inerte por FORMA**: borda tracejada `muted`, fundo transparente, nome `muted`, o cenário sob véu `color-mix(viewport-bg 70%, transparent)` dentro do vidro (placa, não opacidade na arte — precedente da placa dos medidores, Home D-H3), `lock` 18 + "locked" numa tag `aria-hidden` à direita (o cadeado acompanha texto — nunca sozinho em box, nunca dentro do vidro); `aria-disabled`, sem `fo` | Atividades F1; DECISÕES §12 L3; regra do dono (ícone nunca em box) |
| D-L9 | **"Equip" = `.btn.out.sm` 44** dentro do card (o wireframe tinha 36 — alvo); **"Equipped" = `.chip.tag.pri`** com `check_circle` 18 FILL **na coluna de texto, sob a linha** (X1: à direita, a tag de 94 deixava 90 px para o nome — "Digital Coliseum" quebrava) + o slot do item aceso (anel 2px `primary-ink`, `.slot.sel` SIS-07); o nome nunca quebra (ellipsis) | HANDOFF §5 (alvo ≥ 44); SIS-07; padrão do gênero (selo no thumbnail + linha curta) |
| D-L10 | **Emblemas em serifa dourada em toda ocorrência**: saldo (`military_tech` 20 FILL + Georgia 20), preço ("8 Emblems", Georgia 20 + "Emblems" 12 `muted`), prêmio da missão ("+3" Georgia 16 numa `.chip.tag.gold` com o glifo 18) | `CLAUDE.md` 🎖️; Jogos D-J12; `emblemStyle` |
| D-L11 | **Créditos = `diamond` 20 FILL em `--sm2-credit-ink`** (o token existe nos dois temas e não tinha consumidor no canvas até aqui); os degraus da troca em `.btn.out` (o `ghost` de largura inteira sem borda lê como texto solto — três alvos empilhados precisam de fronteira); sem primário (troca não é a ação da tela) | 02 §46; `currencies.ts`; SIS-02 |
| ~~D-L12~~ | **SAIU (F1, decisão do lead)**: o palco `[novo]` afirmava que o código não desenha o quadro no Quarto — falso (`bg-room` = `FULL_SLOTS`, `furn-picture` = `fits: any`). Um preview que reage ao toque seria estrutura (Fase 1). A explicação fica no card, em palavras, como o `CLAUDE.md` pede | `CRITICA.md` F1; `backgrounds.ts`; `shop.ts` |

## Contraste (WCAG 2.x, hex do `index.css` bloco ONDA 1)

| Par | Onde | Escuro | Claro |
|---|---|---|---|
| `ink` / `bg` | wordmark, títulos das seções | 16,15 | 14,96 |
| `primary-ink` / `bg` | "260 Bits" (saldo, X4) | 13,21 | 5,55 |
| `primary-ink` / `surface` | "120 Bits" (preço), "+100 Bits" (região/toast), "100 Bits" nos degraus | 11,12 | 6,02 |
| `muted` / `bg` | as dicas `role=status`, `.note`, `.sticky`, "Nothing here yet.", "claimed" (sobre card: abaixo) | 8,83 | 5,35 |
| `ink` / `surface` | nome do item, frase da missão, "Swap N Credits for" | 13,59 | 16,23 |
| `muted` / `surface` | a linha do item, "2/3", "Bits"/"Emblems" ao lado do preço, "claimed", o preço sem saldo (D-L6), o nome do travado (sobre `bg`: 8,83 / 5,35) | 7,43 | 5,80 |
| `muted` / `surface-2` | "locked" na tag, `.tagd` sample | 6,30 | 5,09 |
| `primary-ink` / `primary-soft` (sobre `surface`) | o segmento ativo | 7,69 | 5,21 |
| `primary-ink` / `surface` | `check_circle` de "Equipped" (sobre `surface-2`: 9,43 / 5,28) | 11,12 | 6,02 |
| `gold-ink` / `bg` | o saldo de Emblemas | 10,51 | 5,41 |
| `gold-ink` / `surface` | o preço em Emblemas, o `auto_awesome` do convite | 8,84 | 5,87 |
| `gold-ink` / `surface-2` | "+3" e o glifo na tag da missão | 7,49 | 5,15 |
| `credit-ink` / `surface` | o `diamond` da troca | 7,56 | 7,10 |
| `on-primary` / `primary-fill` | — (nenhum primário nesta loja: comprar é o card; a troca é `outline`) | 12,38 | 6,02 |
| `muted` / `surface-2` (não-texto) | anel dos `outline`, borda tracejada do travado, o anel do toast | 6,30 | 5,09 |
| `gold-ink` / `surface` (não-texto) | o filete da recusa (1px) | 8,84 | 5,87 |
| `primary-ink` / `surface` (não-texto) | o anel do slot equipado (2px por FORA do vidro — por dentro, sobre `viewport-bg`, o claro mede 2,70) | 11,12 | 6,02 |
| `line` / `surface` (decorativo) | as bordas dos cards | 1,32 | 1,25 |
| `viewport-bg` / `surface` (decorativo) | a borda do mini-visor sem anel (o vidro lê pela arte, não pela fronteira — Pet R3) | 1,24 | 16,23 |

Nenhum par de TEXTO abaixo de 4,5 nos dois temas. **Nenhuma opacidade em nó nenhum do telefone** (medido nos 8);
`--sm2-danger-*` não aparece no canvas. O vidro é sempre escuro — os itens e os cenários não mudam de tema.

## Medição (8 artboards, `measure_loja.mjs`, Chrome 420×900 DPR 1, rodada 2)

0 texto < 12 px · 0 overflow do telefone · 0 alvo interativo < 44 (os "Equip" 90×44; os cards 56–107 — missões 56–58, cards de
uma linha 75, de duas 90, o Bedroom equipado 107 com a tag sob a descrição; os segmentos 44; os degraus 48) · 0 opacidade < 1
(CSS e inline) · 0 `text-shadow` · 0 Silkscreen em lugar nenhum (não há texto dentro dos vidros) · 0 `<img>`/`background-image`
PNG fora de `.screen` · 0 `[novo]` dentro do telefone (só o `decisão 13/09` do wireframe, em `TorneioEstados`) · escalas:
**0,5×** (chips 96→48, sofá 112→56, quadro 112×80→56×40, caixote/prateleira 138×150→69×75), inteiras em DPR 2; **transição
declarada**: cenários 1200×648 a 96×52 (0,08×) · **dobra**: `Main` — 3ª card 421–511, nota ⚰️ + marcador até 647, nav 774;
`CenariosMobilias` — 2º card de mobília 570–660, nota final até 728, nav 774 (tela de 844 outra vez, sem `tall`);
`TorneioSegmento` — 2º prêmio 621–711; `ConviteDemo` — convite 115–232; as folhas de estado são `tall` · fidelidade `cmp.py`
**7/7**: mesma ordem de foco (`fo` idêntico — `CardEstados` 3·2·4·6·5·7), mesmos `role`s, mesmos `aria-label`s **exceto os 5
corrigidos por R1–R3** ("Digital Coliseum — locked: Win 5 tournament matches · 2/5" sem o `sample`; "Night Sky — 150 Bits" ×2;
"Pixel Sofa — 100 Bits"; "Soulmon Portrait — Equipped" — amostra alinhada ao `shop.ts`, não estrutura); diferenças de texto =
nomes de glifo Material (`ok`→`check_circle`, `emb`→`military_tech`, `gem`→`diamond`, `spark`→`auto_awesome`,
`›`→`chevron_right`), os "ART" que viraram arte, "260" + "(sem ícone — 02 §46)" → "260 Bits", os valores em `<span class=num>`
/ `.bits` (X3), e nas legendas dos strips "opacity .5"→"tinta muted", "danger-ink"→"gold-ink" (D-L6/D-L7).

## Achados (divergências com o código de hoje — para o `staff-frontend`)

1. **`ShopModal` inteiro em `sm-px-*`** (`sm-px-card`, `sm-px-chip-btn`, Silkscreen em títulos e preços, moldura pixel) → vetor por token (D-L1); o `ModalSheet`/`asPage` fica.
2. **O item é emoji** (`item.icon` 28px fora de vidro) → a arte real num mini-visor 72² / 96×52 (D-L2, D-L3). Os PNGs já existem para tudo que a loja vende (`items/item-chip-*`, `decor/furn-*` + os 4 `furniture-*` do Torneio, `backgrounds/bg-*` incl. os 6 `bg-mission-*` e as 2 arenas).
3. **Saldo de Bits em chip com `<b>` 12px** → "260 Bits" mono 16 `primary-ink`, sem chip (D-L4, V1); o preço, a região da troca e o toast na mesma fonte e cor. **A cor é a de `bitsStyle`** (`currencies.ts`, `primary-ink`) — mesma decisão de Jogos X5 (X4): o canvas segue o código, não o SIS-07.
3b. **`aria-label="Bits: 260"` num `<span>` sem `role`** (herdado do wireframe; ARIA 1.2 proíbe em `generic`, NVDA/VoiceOver ignoram) → o saldo é um `<p>`/`<output>` com o texto "260 Bits"; se mudar ao vivo, UMA região `status` (a do flash, `ShopModal.tsx` l. 365) — nunca duas (X6).
4. **`PixelTabs` com placa cheia** no segmento ativo → `.seg/.segi` com `primary-soft` (D-L5).
5. **`opacity: affordable ? 1 : 0.5` no preço** → tinta `muted` (D-L6).
6. **A recusa em `1px solid --sm2-danger-ink` por 2,6 s** → `gold-ink` 1px inset + região em `gold-ink`; a copy do card não muda (D-L7, X2). O `vibrate(60)` fica.
7. **O card travado com `disabled` nativo** (opacidade do browser) → `aria-disabled` + forma; o cadeado só na tag `aria-hidden` (D-L8). O `aria-label` "‹name› — locked: ‹lockLine›" sem separador de progresso legível (achado d do §12.4) fica como a11y do STATUS.
8. **"Equip" a 36px** → 44 (D-L9); "Equipped" com `check_circle` + slot aceso.
9. **Emblemas**: o código já usa `emblemStyle` (serifa) — o canvas replica e estende ao preço e ao prêmio da missão (D-L10); o 💎 do cabeçalho da troca → `diamond` em `credit-ink` (D-L11).
10. **A troca em `sm2Button('ghost')`** → `outline` (D-L11); **nenhum teste monta os botões da troca** (V3 → STATUS).
11. **`weeklyMissions.ts` `mood-checkins` alvo 3 × 13.10 (alvo 5)** (V2 → STATUS); o canvas desenha "on 5 days".
12. **`!asPage` é ramo morto** (V4 → STATUS, candidato a remoção).
13. **Não existe preview do palco na loja, e não é para desenhar um** (D-L12 saiu): a regra do slot/`fits` vive em `petStage.ts` e a loja explica em palavras. Para o cartógrafo/`product-designer`: `furn-picture` é `fits: any` mas a descrição diz "in scenes with somewhere to hang it" — copy, não regra.
14. **Nenhum glifo novo pedido**: `check_circle, lock, military_tech, diamond, auto_awesome, chevron_right, sync` + os da nav — todos no inventário de 102 (`tokens.md` §5).

## Pendentes

- **Sem pendência do dono.** Nenhum token novo (o `--sm2-credit-ink` já existia e ganha o primeiro consumidor); nenhum glifo
  fora do inventário; nenhuma estrutura reaberta; nenhuma cor de perigo.
- Decididos pelo lead na rodada 2: D-L12 sai; D-L7 fica (só filete + região); D-L3 (slot 72) fica — provado pela caixa de
  alfa na `CRITICA.md`; X4 = `primary-ink` (a resposta de Jogos, herdada). Registro para o lead: R4 (o `.nudge` a 280 × o
  `UnlockNudge` real a 440 — fidelidade venceu), R6 (três diâmetros de mini-visor no sistema: 64 Dex · 72 Loja · 80 nó —
  candidato a unificar o Dex em 72).
- Para a `squad-arte` (**pedido firme**, R8): miniaturas de cenário **96×52 em grade a 1×** para os 19 + 6 cenários da loja —
  0,08× de uma ilustração 1200×648 é o pior caso de transição do sistema e aparece em toda abertura da loja.
- Para o wireframe (`../`): a nota "(sem ícone — 02 §46)" dentro do chip de Bits, o "Equip" a 36px, o par "Bedroom
  equipado + Wall Poster — Doesn't show" (inconsistente com o código, §5 da crítica), "Wall Poster" e os preços de amostra —
  registro, não reabertura.

## Fontes

`ShopModal.tsx` · `utils/shop.ts` (`SHOP_ITEMS`, `TOURNAMENT_ITEMS`, `SPECIAL_ITEMS`, `CHIP_BOOST`) · `utils/currencies.ts`
(`bitsStyle`, `emblemStyle`, `BITS_EXCHANGE`, `CREDIT_TO_BITS`) · `utils/weeklyMissions.ts` · `utils/missions.ts` ·
`utils/backgrounds.ts` (`FULL_SLOTS`/`GROUND_SLOTS`) · `utils/petStage.ts` · `UnlockAccountModal.tsx` · `CRITICA.md` (rodada 1) · `assets/soulmon/items/`, `assets/decor/`,
`assets/backgrounds/` · `CLAUDE.md` (🛒 💠 🎖️ 💎 "as três moedas nunca se misturam") · 02 §46 · 02 §47 · 02 §49 · 02 §50 ·
03 §4.6 · 03 §4.6a · 03 §4.6b · PRINCÍPIOS §8 · §13 · REGISTRO 13.7 · 13.10 · 13.14 · §5.3 · guarda 2a/2b/3a/3b · D5 ·
D11 · DECISÕES §12 (L1–L4, V1–V4, S1–S5) · §18 (P1–P3) · §19 (D-H1, D-H3, X11) · §20 (F1) · §22 (D-P1, D-P9) · Evolução X3 ·
Jogos D-J12 · `src/styles/tokens.md` · `tokens.contrast.test.ts` · `HANDOFF-IDENTIDADE.md` §1, §4–§7.
