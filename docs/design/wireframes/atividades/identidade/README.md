# Canvas "Atividades" — identidade (Fase 2, terceiro canvas) · rodada 2

> Dono: `soulmon-visual-designer` · 16/09/2026 · **rodada 2** (crítica em `CRITICA.md`: VOLTA, 1 fatal + 9 fixáveis — todos tratados na seção "Rodada 2") · HANDOFF-IDENTIDADE §1, §4–§7 · base: canvas **Sistema**
> aprovado (`../../sistema/identidade/`, DECISÕES §18 — P1 espaço 4/8/12/16/24/32 + 2, **P2 = (a)** 256² a
> 128 CSS, **P3 = nav 32**) e os achados da Home (`../../home/identidade/CRITICA.md`: F1 tinta em vez de
> opacidade, F2 dobra, X1 placa atrás dos medidores, X2 balão não cobre o sprite, `role=status`, `canvas.json`
> UTF-8) — aplicados desde a rodada 1 · estrutura: os 17 wireframes cinza aprovados de `../` (DECISÕES §6,
> A1–A8 / V1–V5 / S1–S7) e as linhas `ATIV-*` do `INVENTARIO-WIREFRAMES.md` §1.2.
> **Cada artboard = o wireframe de mesmo nome com a identidade aplicada** — mesma hierarquia, mesmos estados,
> mesma copy (EN; PT no rodapé), mesma ordem de foco. Nada estrutural mudou; o que "pediu" para mudar está no
> rodapé como achado. Escuro em todos; claro só no `MainClaro` (decisão 3 do dono).

## Como abrir

O `<style>` de cada `.dc.html` é o bloco do `Sistema/Main.dc.html` **copiado** (tokens `--sm2-*`, átomos,
rodapé) + o bloco `HOME (composição)` da Home (anel/vidro, `VisorBar`, deck, painel, dock, nav — os mesmos
átomos, para a lista ser a mesma lista) + um bloco `ATIV (composição)` só de layout (RitualRow, `TaskMeta`,
janela de 7, ficha, folhas) — nenhum token novo, nenhum literal de cor além do scrim/sombra do `ModalSheet`.
Imagens e fontes por caminho relativo ao repo. Servir a raiz do repo:
`npx -y serve -l 8767 D:/Soulmon/repo` → `http://localhost:8767/docs/design/wireframes/atividades/identidade/Main.dc.html`.
Gerador (fora do repo, no scratchpad da sessão): `gen_ativ.py` — os `.dc.html` são a fonte commitada.

## O que cada artboard prova

| Artboard | Id | Prova |
|---|---|---|
| `Main.dc.html` | ATIV-02 (04 · 06 · 07 · 08 · 09 · 11 · 25) | A lista do dia sob o pet fixo: a `RitualRow` do código vestida pelo SIS-03 — selo 24 `muted` (`task_alt` tarefa / `event_repeat` hábito), coluna de texto = botão de editar (Rubik 14/500 + 12 `muted`), checkbox 24 em alvo 44 ou chevron 44; hábito com **dois metadados** (janela de 7 em formas de 12px + glifo `eco` preenchendo por tier, com brilho na aura de 28 dias); tarefa com `TaskMeta` em 2ª linha (chips 24; o contador de adiamentos com o mesmo desenho de 24 sem borda, dentro de um alvo 44 invisível); cabeçalho "1/5" `tabular`; "+ New Activity" `outline`; gaveta "Put aside (2)" `quiet` `muted`; dock 52; nav 68. Ordem de foco 2–32 idêntica ao wireframe. |
| `MainClaro.dc.html` | ATIV-02 claro | O mesmo DOM sob `[data-theme=light]`: o vidro segue escuro, cobre escurece, ciano vira `#0B6F68`, `gold-ink` `#8A5A2B`. |
| `ListaVazia.dc.html` | ATIV-01 | Vazio do SIS-06 (`task_alt` 48 ciano + Rubik 14 `muted`) + o único `primary` da tela; energia sem dígito; sem Vínculo; Play inerte tracejado; captura com `add` pelado inerte em `muted`. |
| `ListaCompleta.dc.html` | ATIV-03 · 05 | Dia feito pela FORMA: glifo do cabeçalho FILL 1 ciano, selo "focus done" (chip `primary-soft`), "That's it!" no balão (acima do sprite, X2); concluídas de hoje riscadas em `muted` no fim, checkbox cheio e inerte; hábito fora do dia esmaecido pela tinta. |
| `CargaDoDia.dc.html` | D10 (ATIV-02) | O aviso de carga como **texto** `role="status"` em `gold-ink` com `info` 20, sem moldura, 7ª entrada da fila 2; a lista inteira continua viva. |
| `LinhaTarefaEstados.dc.html` | ATIV-04 · 08 · 09 · 10 | Os 5 estados da linha de tarefa: normal (chips de prazo e esforço), adiada (alvo 44, etiqueta 24 sem borda em `muted`, sublinhado no `POSTPONE_NUDGE_AT`), assombrada por parada e por prazo (tinta **`--sm2-haunted`** — token novo, P5 — + chip âmbar "haunted · +relief", alpha 1), concluída hoje. |
| `LinhaHabitoEstados.dc.html` | ATIV-06 · 07 | Os 7 estados da linha de hábito: normal, com passos (chevron + `.segb` 96), passos abertos (checkbox 24/44 por etapa), fora do dia (tinta + checkbox tracejado), hábito novo (traços + seed FILL 0), "no due days", "0 das últimas 7" = silêncio (7 anéis). |
| `FichaHabito.dc.html` | ATIV-11 · 12 · 13 | A ficha como card SIS-03 no topo do `EditModal`: janela + "5 of the last 7" `tabular` + glifo com rótulo; escudos como POSSE em 3 casas (◆ ciano = tem, ◇ tracejado `muted` = vazia), inclusive zero; `hideMetrics`; os 4 tiers de `eco` + a aura. |
| `CriarAtividade.dc.html` | ATIV-15 | `CreateModal` fechado (campo 44 + hint + "More options" `quiet` + Save inerte) e aberto (com o marcador tracejado da dobra a 844 dentro da folha) (Name, chips de categoria 44 com ícone vetor, Recurring/One-time em `.segi`, presets de rotina como chips de escolha, âncora, Steps, Time). |
| `CriarTetoDemo.dc.html` | ATIV-16 | Teto do demo: texto fica, hint em 12 `muted`, `UnlockNudge` como linha-botão `outline` 64 com `lock_open` em cobre, "Limit reached" = primário inerte rotulado. Folha ancorada embaixo (cabe em 844). |
| `EditarAtividade.dc.html` | ATIV-17 · 18 | `EditModal` inteiro com campos preenchidos, 3 passos com "Remove" 44, Delete `quiet` em `danger-ink` (único `danger` do canvas — tinta de rótulo, não alerta); ATIV-18 registrado como SAI. |
| `EditarTarefa.dc.html` | ATIV-19 | `TaskEditModal`: esforço em 3 `.segi` com pista em tinta (sem opacidade), convite de decompor, 3 check-rows 44 abrindo data/hora/alarme, presets de alarme em `.segi`, Delete quiet. |
| `CapturaRapida.dc.html` | ATIV-14 · 27 | A barra nos 4 estados (vazia · digitando com chips do parser em `primary-ink` · teto recusou com `role="alert"` em texto comum · atalhos abertos) + "Balance my week" `outline sm` com `calendar_month` no contexto. |
| `NudgeAdiamento.dc.html` | ATIV-20 | Três saídas iguais (`outline` 64 de duas linhas, ícone 24 pelado, nenhuma primária), os 3 estados do "Break it down", passos sugeridos com checkbox 24, "Shrink it" inerte com motivo (`.btn.out.dis`). |
| `EquilibrarSemana.dc.html` | ATIV-21 | Barras "hoje" em `surface-2`+`muted` × "como ficaria" em `primary-soft`+`primary-ink`, sem dígito na tela (o dígito vai no `aria-label`, que a leitura sonora precisa — R5); "Not now" e "Go ahead" com o mesmo peso (`outline` × 2); `naoCabe`, `semMudanca`, toast SIS-06. |
| `TriagemFila.dc.html` | ATIV-22 · 23 | Carta (card SIS-03) + 4 saídas iguais (`outline` `min-height` 72, medidas 174×99 pela pista de duas linhas, em 2×2; glifo + palavra + pista; Someday = `nightlight`) + barra segmentada do decidido; carta vencida diz a data, nunca "N days late". |
| `TriagemFim.dc.html` | ATIV-24 | A reação do pet = sprite num vidro 96² (D-H7), Fredoka 16, Rubik 12 `muted`, um `primary` "Back"; variante "já estava arrumada". |
| `GuardadasEstados.dc.html` | ATIV-25 · 26 | A gaveta `quiet` 44 em `muted` fechada e aberta: linha 44 com selo, status em palavra, "Bring back" `ghost sm` 44. |

**Medido no DOM (18 artboards, `getComputedStyle` + `getBoundingClientRect`, servidos em 8767):** 0 nós de texto
< 12px dentro do `.phone` · 0 elementos vazando a largura de 390 · 0 alvos < 44 entre `button/checkbox/textbox/radio`
· 0 Silkscreen fora de `.screen` · **0 nós com `opacity` < 1 e 0 com `text-shadow` dentro do `.phone`** (rodada 2; `getComputedStyle` em todos os nós dos 18 artboards) · alturas do `canvas.json` = `scrollHeight` do `.ab`. **Fidelidade:** a sequência de
`role`, de `aria-label` e dos marcadores de foco (`.fo`) é **idêntica** nos 17 pares wireframe × identidade (script
de diff, 17/17).

## Dobra medida a 390×844 (F2 da Home aplicado desde a rodada 1)

| Artboard | Wireframe aprovado | Identidade | |
|---|---|---|---|
| `Main` | painel a 401 (o `h2` a 414–433 dentro do cabeçalho 401–447); 1ª linha 447–549; dock 722 | painel a **419**; cabeçalho 420–464; 1ª linha **464–562**; 2ª 562–681; 3ª começa a 681; dock 722 | cabeçalho + 2 linhas inteiras + o início da 3ª antes do dock — o mesmo que o wireframe mostra (+18px pelo anel de cobre) |
| `ListaVazia` | "New Activity" 624–668 | **641–689** (o único `primary`, inteiro acima do dock 722) | ✓ |
| `ListaCompleta` | painel 401; 1ª linha 447–549 | painel 419; 1ª linha 464–546; 2ª 546–629; 3ª 629–687 | 3 linhas concluídas visíveis antes do dock |
| `CargaDoDia` | slot 401–446; painel 531; 1ª linha 577–680 | aviso **419–467**; painel 475; 1ª linha 520–617; 2ª 617–716 | aviso + cabeçalho + 2 linhas antes do dock |

As linhas ficaram **mais baixas** que no wireframe (tarefa com `TaskMeta` 98 × 102; hábito com janela 82 × ~100;
tarefa com contador 119 × 102): a dobra mostra o que o wireframe mostra, sem reabrir estrutura.

## Decisões de identidade tomadas neste canvas (canvas vence; a confirmar na crítica)

| # | Decisão | Motivo |
|---|---|---|
| D-A1 | **Janela de 7 = formas de 12px com 4 de ar** (● `primary-fill` · ◆ contorno 2px `primary-ink` · ○ anel 2px `muted` · — traço 2px `muted`); casa vazia de escudo (só na ficha) = ◇ tracejado `muted` | 02 §25 (formas por estado, o "não devido" é o menos saliente); não-texto ≥ 3:1 nos dois temas (tabela abaixo); 108px de largura cabem na coluna de texto com o glifo ao lado |
| D-A2 | **Selo da linha = TIPO** (`task_alt` tarefa / `event_repeat` hábito), 24 em `muted`; **glifo de maturidade = `eco` com FILL 0/.34/.67/1** (`TIER_FILL` do código) em `primary-ink`; **aura de 28 dias = FILL 1 + halo de 3px em `primary-soft`** (rodada 2, X3: sem `text-shadow` — no claro a sombra virava mancha), não chip | O wireframe desenha o tipo no selo; o código desenha a categoria (32, cobre) — cobre seria um 2º acento por linha. `eco` é o glifo que o código já usa para maturidade e não pode ser também o selo: **a Home usou `eco` no selo do hábito — achado para alinhar** (rodada seguinte da Home). T6: aura é tratamento do glifo |
| D-A3 | **Esmaecer é tinta, nunca alpha** — e agora é MEDIDO, não afirmado (rodada 2): fora do dia e concluída em `muted` (7,43 / 5,80), `opacity` computada = 1; **assombrada em `--sm2-haunted`** (token novo, decisão P5 do dono — DECISÕES §19: escuro `#85A0B8`, claro `#4E6A83`; o `#6E8AA3` proposto dava 4,21 e foi recalibrado) + chip âmbar "haunted · +relief" (`gold-ink` sobre `surface-2`); checkbox inerte = tracejado `muted` + `aria-disabled` | Home F1 repetido aqui na rodada 1 (`.dim{opacity:.55}` herdado do bloco HOME — 3,26 / 2,31); Home E7; guarda 1c; P5: a assombrada se distingue por MATIZ (azul × verde-cinza), com o chip como canal redundante |
| D-A4 | **Contador de adiamentos = etiqueta 24 sem borda (`surface-2`, `muted` 12/500, `schedule` 18) dentro de um alvo 44 invisível** (rodada 2, X2: o desenho fica no peso das outras etiquetas; o alvo cresce, o desenho não); sublinhado só em `POSTPONE_NUDGE_AT`; **aviso de carga = texto em `gold-ink`** com `info` 20, sem moldura | X10 do Sistema (nunca âmbar/vermelho no contador); PRINCÍPIOS §2 (aviso é texto); âmbar = convite |
| D-A5 | **Folhas de decisão sem primário**: "Not now"/"Go ahead" (`outline` × 2), as três saídas do nudge e as quatro da triagem (`outline`) — o primário existe só onde há UMA ação (Save, Back, New Activity) | 02 §36 (saída de primeira classe); SIS-02 (um primário por tela); a folha mostra, não decide |
| D-A6 | **Folha mais alta que 844 entra em fluxo** (`.folha.flow`, o telefone cresce): FichaHabito, CriarAtividade, EditarAtividade, EditarTarefa, NudgeAdiamento, EquilibrarSemana; as que cabem (CriarTetoDemo, TriagemFila, TriagemFim) ficam ancoradas embaixo sobre o scrim | O wireframe ancorava todas embaixo e **cortava o topo** (EditarTarefa: título a −281px, fora dos 844 — medido). O artboard tem de provar o formulário inteiro; no app o corpo do `ModalSheet` rola e Cancel/Save fica fixo. **Rodada 2 (X6):** cada folha em fluxo leva um marcador tracejado a 564px do topo da folha e o rodapé diz o que cabe — ver tabela na seção "Rodada 2" |
| D-A7 | **Chips de categoria com o ícone vetor** (20) do mapa que o código já tem (`CATEGORY_ICON_NAME`: `favorite · palette · bolt · psychology · inventory_2 · chat_bubble · spa · accessibility_new`) | Todos no subset de 102; nenhum `[pendente do dono]`; PNG `icon-cat-*` fora do visor sai |
| D-A8 | Glifos sem par exato: "haunted" = `visibility` (o pet OLHA a tarefa); "Break it down" = `psychology`; "Shrink it" = `do_not_disturb_on`; "Let it go" (nudge e triagem) = `archive`; "Someday" = `nightlight` (rodada 2, X9: `pending` lia como "em andamento"); "This week" = `calendar_month`; "Balance my week" = `calendar_month`; nudge do teto = `lock_open` | Inventário de 102 (`iconInventory.contract.test.ts`); "assombrada" fica `visibility` (decisão, crítica §4). **Play = `toys`**: P6 aprovado (§19) — o SVG inline fica só porque o `.woff2` servido ainda não tem o glifo (`data-subset`); o `staff-frontend` usa a ligature |
| D-A9 | **Anotações de spec saem do telefone** nos artboards de 844 (Main, ListaCompleta, CargaDoDia: notas → rodapé); nos artboards-espécime (`tall`) as legendas `.strip .cap` ficam, em Rubik 12 `muted` | Home F2c (a nota custava a dobra); os espécimes são folha de estados, não tela |

## Contraste (WCAG 2.x, hex do `index.css` bloco ONDA 1)

| Par | Onde | Escuro | Claro |
|---|---|---|---|
| `ink` / `surface` | título da linha, nome da carta | 13,59 | 16,23 |
| `muted` / `surface` | subtítulo, selo, título assombrado/fora do dia, "Put aside" | 7,43 | 5,80 |
| `muted` / `surface-2` | chip de etiqueta, contador de adiamentos, placeholder, rótulo inerte | 6,30 | 5,09 |
| `gold-ink` / `surface-2` | chip "haunted · +relief" | 7,49 | 5,15 |
| `gold-ink` / `bg` | aviso de carga | 10,51 | 5,41 |
| `primary-ink` / `surface` | glifo de maturidade, "Bring back", Add | 11,12 | 6,02 |
| `primary-ink` / `primary-soft` (composto) | chip selecionado, selo "focus done" | 7,69 | 5,21 |
| `on-primary` / `primary-fill` | Save, Back, New Activity, checkbox, segmento ativo | 12,38 | 6,02 |
| `ink` / `surface-2` | campo preenchido, segmento inativo | 11,52 | 14,23 |
| `danger-ink` / `surface` | "Delete" (`quiet`) | 6,73 | 6,54 |
| **`haunted` / `surface`** | título e selo da tarefa assombrada (token novo P5) | **5,58** | **5,66** |
| `haunted` / `surface-2` | (referência) | 4,73 | 4,96 |
| `haunted` / `bg` | (referência) | 6,63 | 5,03 |
| `muted` / `surface-2` · `on-primary` / `primary-fill` | pista dos `.segi` (tinta, sem alpha — X5) | 6,30 · 12,38 | 5,09 · 6,02 |
| `primary-fill` / `surface` (não-texto) | ● dia feito, ◆ escudo, barra "como ficaria" | 11,12 | 6,02 |
| `muted` / `surface` (não-texto) | ○ falta, — não devido, checkbox tracejado, borda do chip | 7,43 | 5,80 |
| `gold-ink` / `surface` | `lock_open` do nudge | 8,84 | 5,87 |

Nenhum par abaixo de 4,5 (texto) ou 3 (não-texto) nos dois temas. **Nenhuma opacidade em nó nenhum do telefone** (medido, rodada 2) — o gerador `gen_ativ.py` agora **reprova** qualquer `opacity < 1` no CSS ou inline dentro do `.phone` (guard testado com injeção).

## Achados (divergências com o código de hoje — para o `staff-frontend`)

1. **Selo da linha**: o código desenha o ícone de categoria (`RitualIcon`, 32, `gold`); o wireframe aprovado e o canvas desenham o TIPO (24, `muted`). Decisão de estrutura já tomada na Fase 1; a identidade só a veste.
2. **`eco` em dois papéis**: a Home (identidade) usa `eco` como selo do hábito; o código e este canvas usam `eco` como glifo de maturidade (`TIER_FILL`). Um só papel: a Home passa a `event_repeat` no selo (achado para a rodada seguinte da Home, D-A2).
3. **Ícones de categoria em PNG pixel** (`icon-cat-*.png`) fora do visor → o mapa vetor de `types/category-icons.ts` nos chips.
4. **Pixel fora do visor** no `RitualPanel` (`.sm-px-ritual-*`), `TaskMeta`, `QuickAddBar`, `PostponeNudgeSheet`, `TriagePile`, `BalanceWeekModal`, `UnlockNudge`, `ModalSheet` 9-slice — tudo vetor aqui (SIS achado 1).
5. **`feitos/total`** conta só `tasks` (a concluída sai) e todos os hábitos → dia devido + concluídas de hoje (A4).
6. **"0/3 steps"** antes do primeiro passo → "3 steps" (A7, piso E5).
7. **"Bring back"** e o "Remove step" a 36px → 44.
8. **Dois modais de criação** (CTA → `EditModal` sem `initialData`; `handleAddNewTask` sem chamador) → um só (A1); ATIV-18 perde o caminho vivo.
9. **`HabitConstancy compact`** imprime "N of the last 7" e "Spent automatically on a missed day." → saem da linha e da ficha (A2, A6).
10. **`<details>` da gaveta a `opacity:.75`** → tinta `muted`.
11. **Copy**: "Want to create without limits?" (C-S1) → "Want a ceiling that grows with you?" `[novo]`; a recusa "item limit" fica como o código com a alternativa de V2 como critério de aceite.
12. **Pose "yawn"** do pet (CargaDoDia) não existe no `animArt` → pedir quadro de bocejo à `squad-arte` (`[pendente da squad-arte]`).
13. **Campos de data/hora nativos** (`<input type=date/time>`) herdam o chrome do sistema — o canvas os desenha como `.inp`; o `staff-frontend` decide se veste o nativo.
14. **Segmento com pista** (`Segment` do FormKit) e **chip de escolha** (`Chip`) → `.segi` / `.chip.sel` (X1 do Sistema: canvas vence nos nomes, raio 12).
15. **`--sm2-haunted` é token NOVO** (P5): entra no `index.css` nos dois temas (`#85A0B8` / `#4E6A83`) e no `tokens.contrast.test.ts` (pares `haunted/surface` ≥ 4,5 nos dois temas).
16. **"Add 1 step" / "Add steps" sem `role=button`** no `PostponeNudgeSheet` (X8) — herdado do wireframe (par idêntico); achado para a rodada seguinte de `../` e para o `staff-frontend`.
17. **`toys` no subset** (P6): rebaixar o `.woff2` + `CACHE_VERSION`; até lá o artboard usa SVG inline.

## Pendentes (depois da rodada 2)

- Glifo de "assombrada" = `visibility` — **fica** (crítica §4: o pet OLHA; fantasma, se vier, é partícula no vidro). Nada pendente do dono.
- Quadro de bocejo do pet para o aviso de carga → `squad-arte` (`[pendente da squad-arte]`).
- Selo do hábito na Home `eco` → `event_repeat` — **decisão do lead registrada**; a Home implementa na rodada seguinte.

## Rodada 2 — achado → conserto (crítica de 16/09/2026, `CRITICA.md`)

| # | Achado | Conserto | Prova |
|---|---|---|---|
| **F1** | `.dim{opacity:.55}` herdado do bloco HOME somava alpha à tinta: fora do dia a 3,26 / 2,31 | Podado do CSS (junto com `.btn.busy`, `.chip.sel.dis`, `.switch.dis`, `.slot.locked img`, `.li.pressed`, `@keyframes sk` — R2); o fundo das folhas deixou de ser `opacity:.55` e virou o scrim literal do `ModalSheet`; **guard no gerador**: `guard_opacity()` reprova qualquer `opacity < 1` no CSS ou inline dentro do `.phone` (testado com injeção → `REPROVADO`) | `getComputedStyle` em todos os nós dos 18 artboards: **0 com `opacity < 1`, 0 com `text-shadow`**; `.li.dim .t` = `opacity: 1`, `color: rgb(157,188,180)` (escuro) / `rgb(78,107,102)` (claro) |
| **X1** | Assombrada em `muted` contra P5; hex do lead (`#6E8AA3`) a 4,21 | Token `--sm2-haunted` declarado no `<style>` dos 18 artboards (`.ab[data-theme=dark]` `#85A0B8`, `light` `#4E6A83`) como token novo já aprovado; `.li.haunt .t, .selo{color:var(--sm2-haunted)}` | medido `rgb(133,160,184)`; 5,58 / 5,66 sobre `surface`, 4,73 / 4,96 sobre `surface-2`, 6,63 / 5,03 sobre `bg` |
| **X2** | Contador com borda 44 mais pesado que o título | `.pc` = alvo 44 invisível (`role=button`, `aria-label`) com `.chip.tag` 24 sem borda dentro, `schedule` 18; `.nudge` sublinha só a etiqueta | medido alvo 171×44, etiqueta 147×24, `muted` |
| **X3** | Aura como `text-shadow` escuro no claro | `.mat.aura{--f:1;border-radius:50%;box-shadow:0 0 0 3px var(--sm2-primary-soft)}` — FILL 1 + tinta `primary-ink` + halo suave, sem sombra | `textShadow: none`; `FILL 1` nos dois temas; halo `#D6F5EF` no claro |
| **X4** | `toys` marcado "fora do subset" após P6 | atributo `data-subset="toys · P6 aprovado 16/09 — SVG só enquanto o .woff2 servido não tem o glifo"`; achado 17 | `grep data-fora-do-subset` = 0 |
| **X5** | `.segi span{opacity:.85}` | tinta: inativo `muted`, ativo `on-primary` | 0 opacidade; 6,30 / 5,09 e 12,38 / 6,02 |
| **X6** | Folhas em fluxo sem dizer o que cabe em 844 | marcador `.dobra` a 564px do topo da folha nas 6 folhas em fluxo + uma linha por folha no rodapé | tabela abaixo |
| **X7** | README com "outline 72", "sem dígito", "nenhuma opacidade" | corrigido: 174×99 (`min-height` 72); barras "sem dígito na tela, dígito no `aria-label`"; opacidade agora MEDIDA | este README |
| **X8** | "Add 1 step" sem `role` | herdado do wireframe (fidelidade 17/17) — registrado como achado 16, não alterado | diff estrutural |
| **X9** | Someday = `pending` | `nightlight` | — |
| R1 | `.sticky`/`.scrollhint` dentro do telefone | ficam (navegação, aceitas na Home) | — |
| R2 | CSS morto herdado | podado (ver F1) | `grep opacity` nos 18 = 0 fora do rodapé cinza |
| R3–R5 | "idle for 9 days" na carta; saliência do ○; `aria-label` das barras | registro para o guarda / lead; README corrigido (R5) | — |

### Dobra das folhas em fluxo a 844 (ModalSheet 640 = corpo útil ≈ 564 + rodapé fixo ≈ 60)

| Folha | O que cabe antes de rolar (offsets do topo da folha, medidos) |
|---|---|
| `FichaHabito` | título → a ficha inteira (84–490) → começo do `hideMetrics`; marcos e nota rolam |
| `CriarAtividade` | fechado inteiro (até 277); aberto: Name e as duas primeiras linhas de Category |
| `EditarAtividade` | título → Name → Category → **Repeat** inteiro (432–546); Anchor/Steps/Time rolam; Delete no fim (como o código) |
| `EditarTarefa` | título → Name → Category → **Effort** (388–477) → convite de decompor (489–533); Steps corta a 564 |
| `NudgeAdiamento` | frase-tese + as **três saídas inteiras** (157–463) |
| `EquilibrarSemana` | intro, as duas séries de barras, "What changes", frequência e **Not now / Go ahead** (504–552) |

## Lista de volta (o que a rodada 2 devolve)

- **Para o lead:** `--sm2-haunted` com o escuro recalibrado (`#85A0B8`, não `#6E8AA3`) → DECISÕES §19 P5 "aplicado" + `index.css` nos dois temas + par no `tokens.contrast.test.ts`; selo da Home `eco` → `event_repeat` (Home implementa); R3 (número de dias na carta da triagem) → `soulmon-guarda-linha-vermelha` como pergunta; R4 (○ nunca abaixo de 3:1; se "sumir", é forma, não cor).
- **Para o wireframe (`../`):** X8 — `role=button` + foco em "Add 1 step"/"Add steps" (NudgeAdiamento).
- **Para o `staff-frontend`:** achados 1–17.
- **Para a `squad-arte`:** quadro de bocejo (CargaDoDia).
- **Sem pendência do dono.**

## Fontes

`RitualPanel.tsx` · `TaskMeta.tsx` · `HabitConstancy.tsx` (`TIER_FILL`, formas) · `types/category-icons.ts` ·
`CreateModal.tsx` (`Segment`, `Chip`, `HabitAnchorFields`, `StepsFields`) · `TaskEditModal.tsx` · `QuickAddBar.tsx` ·
`TriagePile.tsx` · `BalanceWeekModal.tsx` · `UnlockAccountModal.tsx` · `tokens.md` §5 (subset de 102), §6.1, §7a ·
DECISÕES §6 e §18 · HANDOFF §1, §4–§7 · Home `README.md` (D-H1…D-H9) e `CRITICA.md` · Sistema `README.md`/`CRITICA.md` ·
02 §24–§36, §40 · PRINCÍPIOS §2, §5, §8, §13.
