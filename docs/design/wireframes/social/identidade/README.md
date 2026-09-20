# Canvas "Social" — identidade (Fase 2, 11º canvas) · rodada 2 (20/09/2026)

> **Rodada 2 (pós-crítica, `CRITICA.md`: ENTRA COM CONSERTOS — 0 fatais, X1–X4; decisões do lead):** **X1 / D-S7 VOLTA
> ao `.seal` SIS-06 literal** (o selo é o 2º lugar autorizado da Silkscreen em `tokens.md`; isenção declarada no `guard()`
> — 1 Silkscreen fora do vidro, medida e nomeada); **X2 / D-S10 desenhada** — `GrupoSemGrupo` com "Create" `primary` e
> "Join" `outline` VIVOS no principal e o `ocupado` numa strip (exceção de fidelidade: +2 `.fo`, declarada abaixo);
> **X3** — `serah` são TRÊS tiras (rookie/champion/ultimate) → `squad-arte`, com a referência cruzada à Estatísticas
> (`Bestiario` desenha a tira; a masmorra a sorteia); **D-S9** entra (o primitivo `.dlg`, sem restyle da folha); **D-S8**
> entra. Ruídos registrados (R3 🌿 no `role=status`, R5 `aria-disabled` focável, R6 palco mini 17 px, R7 `astrase` sem
> margem) — ver "Achados" 15–18.

> Dono: `soulmon-visual-designer` · 20/09/2026 · HANDOFF-IDENTIDADE §1, §4–§7 · base: canvas **Sistema** aprovado
> (`../../sistema/identidade/`, DECISÕES §18 — P1 espaço 4/8/12/16/24/32 + 2, **P2 = (a)** 256² a 128 CSS, **P3** nav 32),
> **Home** (§19: vidro com anel de cobre, o palco mini, o deck com inerte por tracejado, `groups` no subset — P6),
> **Atividades** (§20: tinta nunca alpha, o gerador reprova `opacity < 1`), **Rituais** (§21: `.dlg` sobre o scrim literal;
> saídas em `outline`), **Pet** (§22: D-P1 aba ativa tonal; D-P2 heroína 128 no vidro 192²; D-P9 slot = mini-visor sem anel),
> **Evolução** (§24: o vidro cresce para não cortar a arte) e **Loja** (`<img>` só dentro de `.screen`; `danger` reprovado).
> Tudo que as `CRITICA.md` anteriores reprovaram está reprovado aqui desde a rodada 1 (FX/arte sem sobreposição nem corte;
> escala inteira; segmento/aba ativa tonal, nunca placa cheia).
> Estrutura: os 8 wireframes cinza aprovados de `../` (DECISÕES §14, C1–C5 / V1–V6 / S1–S4; T10 e T11 decididas pelo dono
> em 15/09: "N days playing" fica — 13.15; a lista fica) e as linhas `SOC-01`→`SOC-07` do `INVENTARIO-WIREFRAMES.md` §1.9a.
> **Cada artboard = o wireframe de mesmo nome com a identidade aplicada** — mesma hierarquia, mesmos estados, mesma copy
> (EN; PT no rodapé), mesma ordem de foco. Nada estrutural mudou; o que "pediu" para mudar está no rodapé como achado.
> Escuro em todos; claro só no `MainClaro` (decisão 3 do dono).
> **Regras que mordem, todas respeitadas no desenho** (`CLAUDE.md` › Vínculo, Biblioteca/NPCs, linhas vermelhas sociais;
> PRINCÍPIOS §10): só verbos de DAR (presente, amizade, "avisar que apareci"); nenhum componente de métrica do próprio
> perfil; a lista é diretório sem posição (ordem do servidor); o perfil do outro é OLHAR — criatura, nome do pet, GALHO (não
> altura), sem HP/sono/escada; a meta do grupo é SOMADA (por pessoa só "showed up / not yet today"); o presente desabilitado
> diz o motivo em palavras, sem cronômetro; o Vínculo não aparece (nível derivado, nunca persistido — nada a desenhar); os
> NPCs são as linhas de `DUNGEON_LINE_NAMES`; **nada de vermelho** (o `role=alert` é âmbar de convite); nenhum
> avatar/`person` em box — a identidade do outro é a criatura no vidro; `groups` marca a Biblioteca.

## Como abrir

O `<style>` de cada `.dc.html` é o bloco do `Sistema/Main.dc.html` **copiado** (tokens `--sm2-*`, átomos, rodapé) + o bloco
`HOME (composição)` (anel/vidro, `.stage`, nav, `.strip`) + `ATIV (composição)` (`.dobra`) + `JOG (composição)` (`.mv` = o
mini-visor 64² sem anel) + um bloco `SOCIAL (composição)` só de layout (o título `.ttl`, as abas `.tabs/.tab` SIS-04, a linha
`.prow` com `.who`/`.act`, os estados `.cstate`/`.busyline`/`.alert`, o selo `.seal.sealp` (SIS-06), o perfil `.center/.dlg/.hero`, o grupo
`.grp/.mem/.code/.frm`) — nenhum token novo, nenhum literal de cor. As mesmas podas da rodada 2 de Atividades e o mesmo
`guard()` no gerador (reprova `opacity < 1`, `text-shadow`, `.pix` fora de `.screen` — com a isenção declarada para `.seal`, X1 —, `<img>` fora de `.screen` e qualquer
`danger` dentro do telefone).
Imagens e fontes por caminho relativo ao repo. Servir a raiz do repo:
`npx -y serve -l 8777 D:/Soulmon/repo` → `http://localhost:8777/docs/design/wireframes/social/identidade/Main.dc.html`.
Gerador (fora do repo, no scratchpad da sessão): `gen_social.py` (importa `gen_ativ_head.py`, os blocos `STYLE_ATIV`/`STYLE_JOG`
de `gen_ativ.py`/`gen_jogos.py`); medição `measure_social.mjs`; diff de fidelidade `cmp.py` — os `.dc.html` são a fonte
commitada.

## O que cada artboard prova

| Artboard | Id | Prova |
|---|---|---|
| `Main.dc.html` | SOC-05 | O título Fredoka 20 com **`groups` 24 pelado** `muted`; a busca `.inp` 44 com `search`; as três abas SIS-04 (`role=tab` como o código; "All" ativa em `primary-ink` + sublinhado 3px + glifo FILL 1; `person`/`volunteer_activism`/`flag` são os glifos do `LibraryPage`); **cada linha = UM botão de 64 com a criatura num mini-visor 64² sem anel** (sprite 256² a 64, 0,25×, corte 0 %), nome 14/500 (+ "· demo" 12 `muted`), "N days playing" 12 `muted` abaixo do nome (nunca à direita como placar); à direita até duas ações 44 com ícone pelado 24 — `paid` em `ink`, `do_not_disturb_on` em `muted`, `add` em `primary-ink` FILL 1. |
| `MainClaro.dc.html` | SOC-05 claro | O mesmo DOM sob `[data-theme=light]` — `ink #0E2422` / `bg #F1F7F5`, `primary-ink #0B6F68` na aba ativa e no `add`; os mini-visores continuam escuros (`viewport-bg #0E2422`). |
| `Estados.dc.html` | SOC-01 · 02 · 03 | Carregando = `sync` 24 + "Looking for players…" 12 `muted` centrados; vazio = UMA frase 12 centrada (sem ilustração, sem "0 friends"); erro = `cloud_off` 48 `muted` pelado + frase 14 + linha 12 + **"Try again" `.btn.out.sm` 44** com `refresh` 20 (o `ghost` do wireframe/código vira `outline` — saída com fronteira); a linha degradada = o mesmo botão de 64 com o **vidro apagado** (mini-visor sem criatura) e as duas ações vivas; o alerta = **filete 3px + tinta `gold-ink` 500** (o `danger-ink` do código não entra). |
| `SemRede.dc.html` | SOC-04 | O selo `OfflineSeal` na raiz = **o `.seal` SIS-06 literal** (rodada 2, X1): pílula 32 `surface-2` + `line` 1px, `cloud_off` 20 `gold-ink`, "NO SIGNAL" Silkscreen 14 em `ink` — a única Silkscreen do canvas, fora do vidro por regra (`tokens.md`: Viewport **e selos**), isenção declarada no `guard()`; o mesmo bloco de erro do SOC-03; as duas linhas de demonstração intactas. |
| `AmigosPresente.dc.html` | SOC-05 | A aba "Friends 2/5" ativa (número PRÓPRIO); o presente vivo = `paid` 24 `ink`; **já dado / sem energia / limite de 5 = inerte por FORMA** (tinta `muted` + tracejado 1px `muted` no alvo 44 + `aria-disabled`, sem número de foco) — o `opacity .4` do wireframe não entra; ocupado = `sync` 24 `muted` no mesmo tracejado (o `busyId` por linha, como o código). Dobra: as cinco linhas e as duas notas antes da nav. |
| `PerfilJogador.dc.html` | SOC-07 | O `.dlg` SIS-06 sobre o scrim literal (a Home atrás com o palco mini, sem esmaecer por opacidade); "Ana" Fredoka 20 + × 44 `muted`; **a criatura 256² a 128 (0,5×) num vidro 192² com anel de cobre** (`role=img`, a mesma heroína do Pet); "Brasa" 14/500 + "12 days playing" 12; "PET'S PATH" `.lab` + o glifo de Poder (o SVG de `AlignmentIcons`, 18) + "Power" 14/500 em `ink`; "Close" `outline` 48. Nada de HP, escada, presente. |
| `GrupoSemGrupo.dc.html` | SOC-06 | A tese 14 `ink`; dois cards SIS-03 com rótulo 12, campo `.inp` 44 e o botão de largura inteira **VIVO** (rodada 2, X2): **"Create" `primary`** (foco 6) e **"Join" `outline`** com `arrow_forward` 20 (foco 8) — a hierarquia desenhada; abaixo, o `ocupado` numa strip (os dois inertes por superfície: `surface-2` + `muted`, `sync` 20 + `aria-busy` no tocado, fora do Tab), carregando e os dois alertas âmbar. Marcador de dobra a 776. |
| `GrupoComGrupo.dc.html` | SOC-06 | O nome Fredoka 20 + "7 of 20 this week" 12 `tabular-nums`; **o `.meter` SIS-07 (`primary-fill` a 35 %) como barra da meta SOMADA**; por pessoa só `check_circle` FILL 1 `primary-ink` / `radio_button_unchecked` `muted` + nome + "showed up today / not yet today"; o check-in `primary` de largura inteira INERTE por superfície + a frase 12 que diz o que falta; o código em mono 14 `letter-spacing .1em` num chip `surface-2` + `content_copy` 24 num alvo 44; "Leave the group" `outline`. Tudo antes da nav. |
| `GrupoEstados.dc.html` | SOC-06 | Sozinho (barra em zero + frase própria + check-in VIVO), já avisei (o botão some), **meta batida = a barra cheia + UMA frase 14 `ink` `role=status` — sem confete, sem dourado**, a falha dentro do grupo (alerta âmbar acima, o grupo intacto), ocupado (`sync` + `aria-busy`, "Leave" inerte) + copiado (`check` FILL `primary-ink`), a falha do servidor. |

## Decisões de identidade (D-S1…D-S10)

| # | Decisão | Fonte |
|---|---|---|
| D-S1 | **A criatura do outro num mini-visor 64² SEM anel** (slot SIS-07 = vidro `viewport-bg`; um anel por linha é regressão de ruído — Home D-H6, Pet D-P9): sprite `lines/<id>-<estágio>.png` 256² a 64 (0,25×; inteiro em DPR 4, 0,5× em DPR 2), corte 0 % (a caixa inteira cabe); no perfil, 0,5× (128) num vidro 192² com anel, como a heroína do Pet (D-P2) | Home P2 (a); Pet D-P2/D-P9; decisão 8b (estágio real) |
| D-S2 | **Nenhum avatar de pessoa** (`person` em box, iniciais, foto): a identidade do outro é a CRIATURA no vidro; o jogador é o nome em Rubik. `groups` 24 pelado marca a Biblioteca no título. A linha que não carregou fica com o **vidro apagado** (sem "?", sem `person`) | Regra do dono (ícone nunca em box); Home P6 |
| D-S3 | **Abas = `.tabs/.tab` SIS-04** (`role=tab` como o código): ativa em `primary-ink` + sublinhado 3px + glifo FILL 1, quietas em `muted`; Rubik 14/500 cabe ("Friends 2/5" ≈ 95 em 116). "Onde estou" nunca é placa cheia — o `sm-btn` cheio do código não é replicado | Pet D-P1; SIS-04 |
| D-S4 | **Inerte por FORMA, nunca por opacidade**: tinta `muted` + tracejado 1px `muted` (`outline-offset −2`) no alvo 44 + `aria-disabled`, sem número de foco; o `aria-label`/`title` continua dizendo o motivo em palavras (já dado / sem energia / limite de 5) | Atividades F1; Home deck `.cell.dis`; PRINCÍPIOS §10 |
| D-S5 | **Cor pela natureza da ação**: `add` (dar amizade) `primary-ink` FILL 1 — o ciano do "Add" da captura; `paid` (dar 20 Bits) `ink`; `do_not_disturb_on` (remover) `muted` — desfazer é quieto, nunca vermelho. Ícones pelados 24 num alvo 44 | Regra do dono; Home "Add" |
| D-S6 | **O `role=alert` é âmbar**: filete 3px `gold-ink` (a forma do wireframe) + tinta `gold-ink` 500 — "tente de novo" é convite, não culpa; `--sm2-danger-*` não aparece (o gerador reprova) | `CLAUDE.md` "o app nunca cobra"; Onboarding X2; Rituais; Loja D-L7 |
| D-S7 | **O selo = o `.seal` SIS-06 literal** (rodada 2, X1 — decisão do lead): pílula 32 `surface-2` + `line`, `cloud_off` 20 `gold-ink`, "NO SIGNAL" Silkscreen 14 em `ink`. O selo é o 2º lugar autorizado da bitmap (`tokens.md` "Quando usar Silkscreen"; cabeçalho de `ui/OfflineSeal.tsx`); o átomo já passou pelo dono (SIS-06, HOME-44) e um componente tem UMA identidade. A rodada 1 o tinha desenhado como micro-visor (pílula-vidro com aro) — derrubado: um vidro sem mundo dentro contradiz a tese. O `guard()` ganha a isenção declarada (`.pix` dentro de `.screen` **ou** `.seal`) | `tokens.md` §"Quando usar Silkscreen"; SIS-06; HOME-44; CRITICA X1 |
| D-S8 | **O galho em `ink`**: o glifo de `AlignmentIcons` (18, `currentColor`) + "Power" 14/500 — identidade, não semáforo; o `ATTR_COLOR`/`ATTR_INK` do `PlayerDetailModal` (tokens `--sm-attr-*` do sistema antigo) não entra no canvas (mesmo caso da Evolução: "Heading toward **Power**" sem cor). Decisão para o lead se a cor por galho ficar | Evolução (canvas); `types/attributes.ts` |
| D-S9 | **O perfil = `.dlg` centrado** sobre o scrim (Rituais D-R1: diálogo curto = centrado; a folha é para listas) — o código usa `ModalSheet` (folha) e o wireframe `.folha`; `role=dialog` + `aria-modal` + ordem de foco (×, Close) iguais. Decisão para o lead | Rituais D-R1; SIS-06 |
| D-S10 | **"Create" `primary`, "Join" `outline` — e DESENHADOS vivos** (rodada 2, X2): o wireframe pinta os dois iguais (cinza) e só no estado `ocupado`; o código usa `sm2Button('primary')` nos dois. Dois primários empilhados dividem a tela; entrar por código é o caminho alternativo. Hierarquia, não estrutura; o `ocupado` continua desenhado (strip). "Try again" e "Leave the group" (`ghost` no código) em `outline`: saída com fronteira, nunca `quiet` | SIS-02; Rituais; Loja D-L11; CRITICA X2 |

## Contraste (WCAG 2.x, hex do `index.css` bloco ONDA 1)

| Par | Onde | Escuro | Claro |
|---|---|---|---|
| `ink` / `bg` | wordmark, "Library", a tese do grupo, o nome do grupo, "Couldn't reach the server.", o código do convite (sobre `surface-2`: 11,52 / 14,23) | 16,15 | 14,96 |
| `muted` / `bg` | subtítulo, "N days playing", "· demo", as abas quietas, as notas, "Looking for…", "showed up / not yet today", "Invite code", os rótulos dos cards (sobre `surface`: 7,43 / 5,80) | 8,83 | 5,35 |
| `ink` / `bg` (nome do jogador) | "Lumel", "Ana", "Brasa", "Power" (no `.dlg`, sobre `surface`: 13,59 / 16,23) | 16,15 | 14,96 |
| `primary-ink` / `bg` | aba ativa + sublinhado, `add`, `check_circle` de presença, `check` de copiado, nav ativa | 13,21 | 5,55 |
| `primary-ink` / `surface` | `check_circle` dentro do card do grupo (`GrupoEstados`) | 11,12 | 6,02 |
| `on-primary` / `primary-fill` | "Let them know I showed up" vivo, "Create" vivo | 12,38 | 6,02 |
| `muted` / `surface-2` | os botões inertes (check-in, Create ocupado, Join, Leave travado), `.tagd` sample | 6,30 | 5,09 |
| `gold-ink` / `bg` | o `role=alert` (texto e filete) na página e nas folhas | 10,51 | 5,41 |
| `gold-ink` / `surface` | o alerta dentro do card do grupo | 8,84 | 5,87 |
| `ink` / `surface-2` | "NO SIGNAL" no selo (Silkscreen 14), o código do convite | 11,52 | 14,23 |
| `gold-ink` / `surface-2` (não-texto) | o `cloud_off` do selo | 7,49 | 5,15 |
| `muted` / `bg` (não-texto) | o tracejado do inerte, o anel dos `outline` (sobre `surface`: 7,43 / 5,80), a fronteira do `.inp` e do `.meter` | 8,83 | 5,35 |
| `viewport-ring` / `bg` (não-texto) | o anel do vidro 192² do perfil | 5,92 | 3,66 |
| `primary-fill` / `surface-2` (não-texto) | o preenchimento do `.meter` (35 %, 100 %) | 9,43 | 5,28 |
| `viewport-bg` / `bg` (decorativo) | a borda do mini-visor sem anel — o vidro lê pela arte e pelo brilho do `.glass`, não pela fronteira (Pet R3; Loja) | 1,04 | 14,96 |
| `line` / `surface` (decorativo) | as bordas dos cards e das linhas | 1,32 | 1,25 |

Nenhum par de TEXTO abaixo de 4,5 nos dois temas; nenhum não-texto funcional abaixo de 3. **Nenhuma opacidade em nó nenhum do
telefone** (medido nos 9); `--sm2-danger-*` não aparece no canvas. O vidro é sempre escuro — as criaturas não mudam de tema.

## Medição (9 artboards, `measure_social.mjs`, Chrome 420×900 DPR 1)

0 texto < 12 px · 0 overflow do telefone · 0 alvo interativo < 44 (as ações 44×44; as linhas 64; as abas 44; "Try again" 44;
os botões do grupo 48; a busca 44) · 0 opacidade < 1 (CSS e inline) · 0 `text-shadow` · **Silkscreen fora do vidro: 1, e
nomeada** — "NO SIGNAL" no `.seal` do `SemRede` (o 2º lugar autorizado, X1; o `guard()` isenta só `.pix` dentro de `.seal`,
nunca `<img>`) · 0 `<img>`/`background-image` PNG fora de `.screen`
(todo `<img>` está dentro de um mini-visor ou vidro — 18 nos 9 artboards, medido) · escalas: **0,25×** (256 → 64 nas linhas) e **0,5×** (256 → 128 no perfil
e no palco mini), inteiras em DPR 2/4; corte 0 % (a caixa de alfa maior, `astrase-rookie` 249×256, cabe inteira nos dois
vidros); berço 660×312 a ⅓ só no palco mini atrás do scrim (Home X11, transição) · **dobra**: `Main` — as quatro linhas
terminam em 484 e a nota em 559 (nav 774); `AmigosPresente` — a 5ª linha (Bruno) 685–749, antes da nav; `SemRede` — o erro,
as duas linhas e a nota até 627; `GrupoComGrupo` — o card inteiro até 624 (Leave 576–624); `GrupoSemGrupo` (`tall`) — os
dois cards VIVOS (Create 329–377, Join 486–534) antes de 776 (marcador tracejado); a nota, a strip do `ocupado`, o
carregando e os alertas rolam; `PerfilJogador` — o
`.dlg` 93–751 dentro de 844; as folhas de estado são `tall` · fidelidade `cmp.py` **8/8 com UMA exceção declarada** (X2): `GrupoSemGrupo` tem +2 `.fo` (Create 6, Join 8; nav 9–13
em vez de 7–11) e +2 `role=button`/`textbox` (a strip do `ocupado` repete os dois formulários) — mesmos `aria-label`s;
nos outros 7, `fo` idêntico, mesmos `role`s na mesma ordem, mesmos `aria-label`s (8/8 conjuntos iguais); diferenças de texto = nomes
de glifo Material (`heart`→`volunteer_activism`, `remove`→`do_not_disturb_on`, `ok`→`check_circle`, `o`→
`radio_button_unchecked`, `copy`→`content_copy`, `x`→`close`, `›`→`arrow_forward`, `glyph`→o SVG de Poder), os
placeholders "ART"/"PET" que viraram arte, o wordmark, `groups` no título, o marcador de dobra e, na legenda do
`AmigosPresente`, "opacity .4"→"inerte por forma — tinta muted + tracejado" (D-S4 — a legenda descreve o que o artboard
desenha).

## Achados (divergências com o código de hoje — para o `staff-frontend`)

1. **`PlayerRow` desenha a criatura num `Viewport` de 48 com anel** → mini-visor 64² sem anel, sprite a 0,25× (D-S1); o perfil já usa `Viewport` — passa a 192² com o sprite a 128 (0,5×), sem esticar.
2. **As abas em `sm-btn` (placa cheia na ativa)** → `.tabs/.tab` SIS-04 com sublinhado (D-S3); `role=tablist`/`tab`/`aria-selected` ficam.
3. **O inerte por `disabled` nativo** (opacidade do browser) → `aria-disabled` + forma (D-S4); `title` duplicado fica.
4. **O `role=alert` em `danger-ink`** → filete + tinta `gold-ink` (D-S6). Vale para os 6 alertas (amizade, presente, código inexistente, grupo cheio, "That didn't work", "Couldn't reach the server").
5. **`OfflineSeal`** — o código já é o `.seal` SIS-06; nada a mudar (D-S7, rodada 2).
6. **`PlayerDetailModal` pinta o galho em `ATTR_COLOR`/`ATTR_INK`** (`--sm-attr-*`, sistema antigo) → `ink` (D-S8, decisão do lead); `branchLevels` calculado e nunca renderizado (STATUS a); o comentário cita "D13" (STATUS b).
7. **O perfil é `ModalSheet`** → `.dlg` centrado (D-S9, decisão do lead).
8. **`sm2Button('ghost')` em "Try again" e "Leave the group"; `primary` nos dois botões do grupo** → `outline` / `primary` + `outline` (D-S10, desenhada no `GrupoSemGrupo`).
9. **A barra do grupo em `#ddd`/`#666` literais, 8px** → `.meter` SIS-07 por token (12px, `primary-fill`).
10. **O código do convite em `monospace` + `#111` literais** → `--sm2-font-mono` + `ink` num chip `surface-2`.
11. **Os NPCs do código são Kaelen/Orrin/Thalindra** (47/88/133 dias, champion/ultimate/mega) — o wireframe desenhou Lumel/Ignar "40 days playing"; o canvas mantém os nomes do wireframe (fidelidade) com as linhas `lumel`/`ignar` em rookie. Registro, não reabertura.
12. **`serah-rookie.png`, `serah-champion.png` e `serah-ultimate.png` são TIRAS de 4 quadros dentro do 256²** (`src/assets/soulmon/lines/`; só `serah-mega` é um quadro — colunas medidas na CRITICA X3): a masmorra de hoje sorteia a linha (`getDungeonEnemySprite`) e desenha quatro pintinhos, e o `Bestiario.dc.html` da Estatísticas (STAT-06) desenha o `serah-rookie` a 64 (X1 de lá) — achado para a `squad-arte` e para o `docs/STATUS.md` (uma régua contra tira em `lines/*.png` — projeção de colunas com mais de uma corrida — porque `sprites.dungeonRoster.test.ts` trava nomes, não a forma). A linha ficou fora do canvas (Ana em `astrase`).
13. **O `LibraryPage` não distingue erro de sem rede** (um `loadError`; STATUS d) — o selo distingue (D11).
14. **Nenhum glifo novo pedido**: `groups, search, person, volunteer_activism, flag, paid, add, do_not_disturb_on, sync, cloud_off, refresh, close, check_circle, radio_button_unchecked, content_copy, check, arrow_forward` + os da nav — todos no inventário de 102 (`tokens.md` §5); `groups` já renderiza do `.woff2` (P6, v122).

15. **R3 · "Weekly goal reached. That was everyone's 🌿"** no `role=status` é a copy de `CoopPanel.tsx` (fidelidade) — mesma família que Rituais X3 tirou da cerimônia (emoji na frase do sistema); para o `redator-ux`/`staff-frontend`, não para o canvas.
16. **R5 · `aria-disabled` NÃO tira do foco** — o canvas (como o wireframe e o deck da Home) desenha o inerte sem `.fo`, prometendo "fora do Tab". No código: `disabled` nativo + `opacity: 1` forçado + a forma tracejada, **ou** `aria-disabled` + `tabindex="-1"`. Vale para as ações da linha, o check-in e os botões do grupo.
17. **R6 · O palco mini (348×120) atrás do scrim corta 17 px dos pés do pet** (`igni-rookie` 128 em `top: 24`): é a peça de Rituais/Home, transição declarada (Home X11); registro.
18. **R7 · `astrase-rookie` (x 3–251, y 0–255) enche o mini-visor 64 sem margem** (Ana nas linhas; no perfil a 0,5× cabe com folga): corte 0 %, respiro 0 — pedido à `squad-arte` de grade 64² com margem (junto de Jogos R10 / Estatísticas R6).

## Pendentes

- **Sem pendência do dono.** Nenhum token novo; nenhum glifo fora do inventário; nenhuma estrutura reaberta; nenhuma cor
  de perigo.
- Decididos pelo lead na rodada 2: **D-S7** volta ao `.seal` SIS-06 (feito); **D-S8** entra (galho em `ink`);
  **D-S9** entra (o primitivo `.dlg` SIS-06 — a migração é para o primitivo, sem restyle da `ModalSheet`, que mantém os
  literais do §18); **D-S10** entra e está desenhada.
- Para a `squad-arte`: **`serah-rookie` / `serah-champion` / `serah-ultimate` como tiras de 4 quadros** (achado 12, X3 —
  o mesmo pedido da Estatísticas X1) — regerar como um quadro 256² por arquivo (ou mover a tira para `fx/` com
  `steps(4)` se for animação de propósito); grade 64² com margem para `astrase-rookie` (R7). Nada mais — toda a arte da
  Biblioteca já existe em grade.
- Para o `docs/STATUS.md`: a régua contra tira em `lines/*.png` (achado 12); R5 (`aria-disabled` × ordem de foco) junto
  do achado 3.
- Para o wireframe (`../`): o `opacity .4` do presente inerte e a `.folha` do perfil — registro, não reabertura.

## Fontes

`LibraryPage.tsx` · `PlayerDetailModal.tsx` · `CoopPanel.tsx` · `AlignmentIcons.tsx` · `types/attributes.ts` ·
`utils/libraryNpcs.ts` · `utils/sprites.ts` (`DUNGEON_LINE_SPRITES`, `DUNGEON_LINE_NAMES`) · `utils/bond.ts` (nível derivado
— nada a desenhar) · `ui/OfflineSeal.tsx` · `BottomNav.tsx` (`menuActive` com `currentView === 'library'`) ·
`assets/soulmon/lines/` · `CLAUDE.md` (Vínculo; Biblioteca/NPCs; linhas vermelhas sociais) · 02 §53 · 02 §55 · 02 §56 ·
03 §4.22 · 03 §4.25 · PRINCÍPIOS §10 · REGISTRO §5.5 · 13.7 · 13.15 · decisão 8b · proibição #21 · D2 · D9 · D11 · DECISÕES §14
(C1–C5, V1–V6, S1–S4) · §18 (P1–P3) · §19 (D-H6, P6, R3, X11) · §20 (F1) · §21 (D-R1) · §22 (D-P1, D-P2, D-P9) · Loja D-L7/D-L11 ·
`src/styles/tokens.md` · `tokens.contrast.test.ts` · `HANDOFF-IDENTIDADE.md` §1, §4–§7.
