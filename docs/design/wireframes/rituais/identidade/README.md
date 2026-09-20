# Canvas "Rituais" — identidade (Fase 2, quarto canvas) · rodada 2

> Dono: `soulmon-visual-designer` · 16/09/2026 · **rodada 2** (crítica em `CRITICA.md`: ENTRA COM CONSERTOS — 0 fatais, X1–X5 aplicados, seção "Rodada 2" no fim) · HANDOFF-IDENTIDADE §1, §4–§7 · base: canvas **Sistema** aprovado
> (`../../sistema/identidade/`, DECISÕES §18 — P1 espaço 4/8/12/16/24/32 + 2, **P2 = (a)** 256² a 128 CSS, **P3** nav 32),
> **Home** aprovada (§19: D-H1…D-H9, P4–P7; `--sm2-haunted`, `toys`/`groups` no subset) e **Atividades** aprovada (§20:
> D-A1…D-A9 — tinta nunca alpha, gerador reprova `opacity < 1`, folhas > 844 em fluxo com marcador a 564, léxico da janela
> de 7, `nightlight`). Tudo que as duas `CRITICA.md` reprovaram (Home F1/F2/X1–X12, Atividades F1/X1–X9) está reprovado aqui
> desde a rodada 1. Estrutura: os 21 wireframes cinza aprovados de `../` (DECISÕES §7, R1–R8 / V1–V6 / S1–S8) e as linhas
> `RIT-01`→`RIT-26` do `INVENTARIO-WIREFRAMES.md` §1.4.
> **Cada artboard = o wireframe de mesmo nome com a identidade aplicada** — mesma hierarquia, mesmos estados, mesma copy
> (EN; PT no rodapé), mesma ordem de foco. Nada estrutural mudou; o que "pediu" para mudar está no rodapé como achado.
> Escuro em todos; claro só no `MainClaro` (decisão 3 do dono).

## Como abrir

O `<style>` de cada `.dc.html` é o bloco do `Sistema/Main.dc.html` **copiado** (tokens `--sm2-*`, átomos, rodapé) + o bloco
`HOME (composição)` (anel/vidro, `VisorBar`, deck, painel, nav) + o bloco `ATIV (composição)` (janela de 7, `.strip`,
`.dobra`, `.miniglass`) + um bloco `RIT (composição)` só de layout (diálogo centrado, `.hchip`, `.focus-row`, linhas
rótulo/valor, `.mood`, cartão da semana, cerimônia) — nenhum token novo, nenhum literal de cor além do scrim/sombra do
`ModalSheet`. As mesmas podas da rodada 2 de Atividades (`.dim{opacity:.55}`, `.btn.busy`, `.chip.sel.dis`, `.switch.dis`,
`.slot.locked img`, `.li.pressed`, `@keyframes sk`, `.segi span{opacity}`) e o mesmo `guard_opacity()` no gerador.
Imagens e fontes por caminho relativo ao repo. Servir a raiz do repo:
`npx -y serve -l 8769 D:/Soulmon/repo` → `http://localhost:8769/docs/design/wireframes/rituais/identidade/Main.dc.html`.
Gerador (fora do repo, no scratchpad da sessão): `gen_rituais.py` (importa `gen_ativ_head.py` e o bloco `STYLE_ATIV` de
`gen_ativ.py`) — os `.dc.html` são a fonte commitada.

## O que cada artboard prova

| Artboard | Id | Prova |
|---|---|---|
| `Main.dc.html` | RIT-01 | Quadro de estrutura da fila 1: os seis cartões como `.card` SIS-03; o montado agora = anel interno 2px `primary-ink`; pendentes = tinta `muted` no título (nunca opacidade); setas Rubik 12 `muted`; as três strips (gate reativo · fora das filas de propósito · fora e não declarado). Sem foco (nada interativo — como o wireframe). |
| `MainClaro.dc.html` | RIT-01 claro | O mesmo DOM sob `[data-theme=light]` — prova de AA dos pares de texto sobre `bg`/`surface`. |
| `Fila2Slot.dc.html` | RIT-02 | Quadro da fila 2: o slot desenhado como na Home (cartão + "+2 notices" `quiet` 44 com `expand_more` — o único foco) e os sete cartões (a 7ª entrada `carga` como `[novo — estrutura]`). |
| `CheckInNormal.dc.html` | RIT-03 | O diálogo centrado (`.dlg` 358, raio 20) sobre o scrim com o palco "mini" atrás: título Fredoka 20 + pista 12; hábitos como `.hchip` 32 com `eco` FILL por tier; três focos sugeridos já marcados (`.focus-row` 44 em `primary-soft` + anel 1px + `check_circle` FILL 1; esforço em PALAVRA `muted`); "Planned load" com dígitos `ink` `tabular`; "Commit" `primary` 48 + "Not today, thanks" `outline` 48. |
| `CheckInPendencias.dc.html` | RIT-04 (+ D10) | Pendências como texto plano (14 + "· postponed 2 times" em 12 `muted`); o 4º candidato inerte = `radio_button_unchecked` `muted` + contorno tracejado + `aria-disabled` (forma, não opacidade); a carga = texto `role=status` em `gold-ink` com `info` 20, sem moldura (D-A4). Cabe centrado em 844 (85–759). |
| `CheckInSemTarefas.dc.html` | RIT-05 | A seção de foco é uma frase 12 `muted`; "Planned load: 2 points" sem o "· chosen focus: 0" (R5). |
| `CheckInOfertaReduzida.dc.html` | RIT-06 | A oferta = UM `outline` 48 à esquerda entre duas frases 12 `muted`; sem botão de recusa; sem dígito de falta. |
| `CheckInEstados.dc.html` | RIT-07 (+ RIT-06 aceito) | Pulado (o "Not today" com o anel de foco de 2px: é aqui que Escape cai) · CTA neutro "Start the day" · sem hábito devido · "Stretch · counted" = `.chip.sel` + `check` 18 + `aria-disabled` sem alpha · limite de 3 (tracejado) · carga (âmbar) · nome vazio · D0. |
| `RelatorioNormal.dc.html` | RIT-08 · 11 · 12 · 15 | O relatório como aparelho: × 44 (primeiro focável), `bedtime` 48 `muted` + Fredoka 20, três linhas rótulo/valor (12 `muted` · 14/500 `tabular`; "1 recovering" em 400 — sem sinal, sem vermelho), aventura = card com a arte 96² num vidro 48², 5 carinhas em alvos 44, "I did it, forgot to log" `outline` + nota, "Start the day" `primary`. Ordem R2 (ontem → humor → CTA). |
| `RelatorioDiaCompleto.dc.html` | RIT-09 · 12 | `star` 48 FILL 1 `gold-ink` com o confete em VETOR na faixa da estrela (SVG 200×60, `primary-ink`/`gold-ink`, `aria-hidden`; **0 das 14 peças dentro do retângulo do `h2`** — X2); valores em `primary-ink`; o `soulGoal` em 12 `muted` itálico; "· new" no rótulo da aventura; sem "I did it". |
| `RelatorioRetorno.dc.html` | RIT-10 | A criatura na peça: sprite 64 num vidro 96² (D-H7) + UMA linha `welcomeBackLine`; "untouched"/"Complete days saved" em `primary-ink`; sem "N days", sem "Yesterday's tasks", sem oferta. |
| `RelatorioOferta.dc.html` | RIT-14 | O convite depois do relatório inteiro: card irmão com × "Do not show again", narração 12 `muted`, convite = `outline` de duas linhas com largura PARCIAL (260); sem preço riscado, contagem ou tabela. Cabe centrado em 844 (88–756). |
| `RelatorioEstados.dc.html` | RIT-11 · 12 · 13 · 15 | Humor escolhido (`primary-soft` + anel 2px), aventura com "· new", memória = card centrado com o sprite num vidro 96², recuperar corações, "Hearts restored", "not logged" (sem dígito, R5), as manchetes alternativas com `wb_sunny`/`nightlight` 24 e as notas do código. |
| `SonhoComCena.dc.html` | RIT-16 | A cena do sonho é PIXEL num vidro 128²: `dream-pillow-cloud.png` 96² **a 1×** (grade nativa); em volta, aparelho: Fredoka 16, raridade como rótulo 12 caixa alta `muted` com "· New!" em `gold-ink` (texto, nunca barra), um `primary`. |
| `SonhoSemCena.dc.html` | RIT-17 | `wb_sunny` 48 `gold-ink` (sol = bom-dia; âmbar = convite), uma frase, um `primary`; nenhum vidro vazio. |
| `SemanaCartao.dc.html` | RIT-18 | Cartão no slot da Home (posição 2): "YOUR WEEK" `.lab` `ink`, frase-tese 12 `muted`, hábitos com `event_repeat` 20 + janela de 7 (léxico A2) + "N of M" só com N ≥ 1, tarefas/esforço 14, `nightlight` 20 "4 dreams collected", sugestão com filete 3px `primary-ink`, "Close" `quiet sm` 44, "+1 notice" `quiet`. Sem dock/nav — como o wireframe. |
| `SemanaSemSugestao.dc.html` | RIT-19 | O mesmo cartão sem o filete e sem a linha de tarefas; o slot vazio como `.stub` tracejado; a estreia. |
| `MarcoCerimonia.dc.html` | RIT-20 · 21 | Cerimônia sobre tudo (z-300): `.dlg` `role=dialog` + `aria-labelledby` (X5) centrado, com o VIDRO 208×144 (sprite **128** = 0,5× + emblema do broto `habit-7` 64² **a 64** = 1× no canto — o pixel do marco mora no vidro, na grade); fora dele `eco` 48 FILL .34 `primary-ink` (o tier, o mesmo glifo da lista), Fredoka 20, a frase **sem o 🌿** (X3), a DATA 12 `muted`, um único `primary` relacional; `sm-milestone-pop` como `.tagd`; o véu mantém `role=status` como o código. |
| `ProtegerProgresso.dc.html` | RIT-22 | `ModalSheet` literal em fluxo (D-A6, marcador a 564): frase 14, campo `.inp` 44 + rótulo, "Save my progress" INERTE (`surface-2` + `muted`, fora do Tab), "Not now" `outline`; a strip de variantes com `role=alert` como texto comum (sem vermelho) e `sync` 20. |
| `WelcomeInstalar.dc.html` | RIT-23 | Folha curta ancorada: `download` 48 `primary-ink` pelado, frase 14, "Install" `primary` + "Not now" `outline`, × 44 último no foco com a `.tagd` "× = last in focus order". |
| `WelcomeNotificacoes.dc.html` | RIT-24 · 25 | A mesma folha com `schedule` 48 (sino não existe no subset), em fluxo por causa da strip RIT-25 (marcador a 564 prova que a folha real cabe). |
| `PrimeiraTarefa.dc.html` | RIT-26 | Folha ancorada com a criatura na peça: sprite 64 num vidro 96² ao lado do `eco` 32 FILL 0 (a semente); frase 14; "Got it" `primary`. Desenhada como o código; R8 muda a classe na implementação. |

**Medido no DOM (22 artboards, `getComputedStyle` + `getBoundingClientRect` em todos os nós do `.phone`, Chromium via
Playwright em `localhost:8769`, DPR 1 e 2):** 0 nós de texto < 12px dentro do `.phone` · 0 elementos vazando a largura de
390 · 0 alvos < 44 entre `button/checkbox/textbox/radio/summary` · 0 Silkscreen fora de `.screen` · **0 nós com `opacity`
< 1 e 0 com `text-shadow`** (o gerador reprova qualquer `opacity < 1` no CSS ou inline dentro do `.phone`) · **0 `<img>`,
`background-image` ou `border-image` fora de `.screen`** · 19 glifos usados, **19 no inventário de 102** (`bedtime, check,
check_circle, close, download, eco, event_repeat, expand_more, info, inventory_2, nightlight, radio_button_unchecked,
restaurant, schedule, shower, star, sync, task_alt, wb_sunny`; `toys` é o SVG inline com `data-subset`, P6) · alturas do
`canvas.json` = `scrollHeight` do `.ab`.
**Fidelidade:** a sequência de `aria-label` e dos marcadores de foco (`.fo`) é **idêntica** nos 21 pares wireframe ×
identidade (script de diff, 21/21); a sequência de `role` é idêntica em **20/21** — em `MarcoCerimonia` o `.dlg` ganhou
`role=dialog` + `aria-labelledby` **por pedido da crítica (X5; STATUS f)**, a única diferença, deliberada. A copy EN é a
mesma — as únicas diferenças de texto são os nomes de ligature dos ícones, as anotações do wireframe ("confetti art
140×140…", "ícone sol/noite") que viraram desenho, o marcador `.dobra` nas duas folhas em fluxo e o 🌿 retirado da frase
da cerimônia (X3, `[novo]`).

## Dobra medida a 390×844 (F2 da Home aplicada)

Os intersticiais são diálogos centrados — a pergunta é "cabe inteiro sem rolar?", e a resposta é sim em todos, como no
wireframe:

| Artboard | Wireframe aprovado (`../`) | Identidade | |
|---|---|---|---|
| `CheckInNormal` | diálogo 185–659; Commit 548–592; Not today 598–642 | diálogo **186–658**; Commit 538–586; Not today 594–642 | igual ao px ✓ |
| `CheckInPendencias` (o mais alto) | 87–757; Commit 646–690; Not today 696–740 | **85–759**; Commit 639–687; Not today 695–743 | cabe inteiro, com a carga ✓ |
| `CheckInOfertaReduzida` · `CheckInSemTarefas` | cabem | 148–696 · 251–593 | ✓ |
| `RelatorioNormal` | 167–677; Start 616–660 | **136–708**; "I did it" 545–593; Start 644–692 | ✓ |
| `RelatorioDiaCompleto` · `RelatorioRetorno` | cabem | 165–679 · 144–700 | ✓ |
| `RelatorioOferta` (o mais alto) | 116–728; Start 667–711 | **89–755**; convite 556–670; Start 691–739 | cabe inteiro, com o convite ✓ |
| `SonhoComCena` · `SonhoSemCena` | 280–564 | 241–603 · 309–535 | ✓ |
| `MarcoCerimonia` | botão 508–552 | diálogo 201–643; botão 539–587 | ✓ |
| `WelcomeInstalar` | folha 523–843; Install 683–727 | folha **430–843**; Install 646–694; Not now 702–750 | ancorada, cabe ✓ |
| `PrimeiraTarefa` | folha 504–843; Got it 744–788 | folha **409–843**; Got it 718–766 | ancorada, cabe ✓ |
| `SemanaCartao` | cartão 401–761; sugestão 659–696; Close 704–748 | cartão **419–800**; sugestão 691–735; Close 743–787; "+1 notice" 743–787 | o cartão inteiro antes de 844 (sem dock/nav — como o wireframe; na Home real, com dock 52 + nav 68, a dobra cai a 724: cabe até a sugestão, "Close" rola) |
| `ProtegerProgresso` (fluxo) | folha 163–843 (a strip cortava) | folha 189–1015; **marcador a 753** (= 189 + 564): do título até "Not now" (476–524) e a nota cabem; a strip de variantes rola | D-A6 ✓ |
| `WelcomeNotificacoes` (fluxo) | folha 640 | folha 189–925; **marcador a 753**: título, ícone, frase, Enable (406–454), Not now (462–510) cabem; a strip RIT-25 rola | D-A6 ✓ |

Os diálogos ficaram **mais altos** que no wireframe (botões 48 em vez de 44, linhas 32, cards com vidro) e ainda cabem
em 844 com folga (o pior caso, `RelatorioOferta`, termina a 756); nenhum precisou de `tall`. Os quadros e espécimes
(`Main`, `Fila2Slot`, `CheckInEstados`, `RelatorioEstados`, `SemanaSemSugestao`) são folhas, sem dobra a medir.

## Decisões de identidade tomadas neste canvas (canvas vence; a confirmar na crítica)

| # | Decisão | Motivo |
|---|---|---|
| D-R1 | **Intersticial = `.dlg` do SIS-06 centrado** (`surface`, raio 20, sombra 2 níveis, 16 de padding, largura 358/318/298 conforme o `max-width` do wireframe) sobre o **scrim literal do `ModalSheet`** (`rgba(4,18,20,.55)`), com a Home e o palco "mini" (120 de altura, sem medidores) atrás — o fundo nunca esmaece por opacidade | Home F1 (tinta/scrim, não alpha); SIS-06 diálogo; o wireframe põe o diálogo centrado (`useDialogA11y`, foco no container) |
| D-R2 | **Relatório e check-in são APARELHO**: manchetes com glifo Material 48 (`bedtime` `muted` · `star` FILL 1 `gold-ink` · `wb_sunny` · `nightlight`), confete em **SVG vetor** (nunca `gain-confetti.png` fora do vidro) **na faixa da estrela, nunca sobre as letras** (X2), linhas rótulo/valor em Rubik 12 `muted` · 14/500 `tabular`; o valor destacado do dia completo/retorno = tinta `primary-ink` (o sublinhado do wireframe), a perda = peso 400 sem sinal, sem itálico, sem vermelho | HANDOFF §1 (O Visor); PRINCÍPIOS §5 (confete atrás do título); W6; 02 §11 (descrição, nunca veredito) |
| D-R3 | **O pixel entra só em vidro, sempre em múltiplo de 0,5× do nativo** (X1): sprite 64 CSS em vidro 96² (0,25×/0,5× DPR 2 — retorno, memória, primeira tarefa, D-H7), **cena do sonho 96² a 1×** em vidro 128², aventura 96² a 48 (0,5×) em vidro 48² no card, e o vidro 208×144 da cerimônia com sprite 128 (0,5×, o mesmo do palco) + emblema 64² a 64 (1×) | HANDOFF §1; P2 (a) transição declarada; D-H7 (miniatura também no vidro); a tarefa: "a cena do sonho e o marco mostram pixel só dentro de um vidro" |
| D-R4 | **Foco escolhido = `.focus-row`** 44 em `primary-soft` + anel interno 1px `primary-ink` + `check_circle` FILL 1 (a mesma seleção do chip do SIS-03, em linha); não escolhido = `radio_button_unchecked` `muted` em `surface-2`; **inerte = sem fundo + contorno tracejado 1px `muted` + `aria-disabled`** (forma, nunca opacidade); esforço em PALAVRA à direita em 12 `muted` | Home E7; Atividades D-A3 derrubada → tinta; 02 §32 (a função SUGERE: o marcado por padrão é o estado normal) |
| D-R5 | **Hábito do dia = `.hchip` 32** (`surface-2`, sem borda, não interativo) com `eco` 18 FILL por tier (`TIER_FILL`, D-A2) — não é chip de escolha (44), é etiqueta com o glifo de maturidade | SIS-03 (chip 44 = interativo; etiqueta 24/32 = leitura); D-A2 (`eco` = maturidade) |
| D-R6 | **Humor = 5 alvos 44 iguais** (`surface-2` + anel 1px `muted`, emoji 24 do `utils/mood.ts`), escolhido = `primary-soft` + anel 2px `primary-ink`; nenhum rótulo de prêmio, nenhum glifo Material no lugar do emoji | 02 §12 (opcional, nunca pontua; guarda 5b). A Material Symbols Rounded TEM o conjunto completo (`sentiment_very_dissatisfied` … `sentiment_very_satisfied`) — o que falta é no **subset de 102** (+5 nomes pelo caminho do P6): trocar é decisão do lead/dono, não identidade (X5a) |
| D-R7 | **Botões de saída em `outline`, nunca `quiet`**: "Not today, thanks", "Not now", "I did it, forgot to log", a oferta reduzida — o único `primary` de cada peça é a ação de seguir (Commit / Start the day / Good morning! / Install / Enable / Got it / Let's keep going together); "Close" do cartão semanal (não é diálogo) fica `quiet sm` | 02 §37 (skip sempre visível; Escape = skip); PRINCÍPIOS §8 (recusa com peso de botão); D-A5 (um primário por peça) |
| D-R8 | **Carga do dia no check-in = a mesma peça da fila 2** (texto `role=status` em `gold-ink` com `info` 20, sem moldura); o contador "· postponed 2 times" em 12 `muted` | D-A4; X10 do Sistema; DECISÕES §6 A5 |
| D-R9 | **Convite de compra = `outline` de duas linhas com largura parcial (260)**, sem cadeado (é convite, não recusa — o `lock_open` fica no `CriarTetoDemo`); o × do card em `iconbtn s44` fora do texto | PRINCÍPIOS §8/§13 (as quatro decisões juntas); C-S1 |
| D-R10 | **Cerimônia num `.dlg` com `role=dialog` + `aria-labelledby`** (X5; o véu mantém o `role=status` do código): o texto precisa de superfície com AA nos dois temas; o vidro 208×144 é o palco do marco; `eco` 48 FILL .34/.67/1 = o tier, o mesmo glifo da lista — e por isso **a copy vai sem o emoji** (X3: "7 days! This habit is a sprout now.") | PRINCÍPIOS §5 (celebração = diálogo de um CTA); D-A2; STATUS f |
| D-R11 | **Folhas de gate = `ModalSheet` literal** (SIS-04); as que cabem ficam ancoradas (Instalar, Primeira tarefa); as que carregam strip de espécime entram em fluxo com o marcador a 564 (Proteger, Notificações) | D-A6 com a condição do X6 |
| D-R12 | **Anotações de spec dentro do telefone** só as do wireframe (`.tagd` "sm-milestone-pop", "× = last in focus order", `[novo]`, `sample`) e as `.note` 12 `muted` dos quadros/folhas — nada acrescentado; as strips dos espécimes com legenda `.cap` | D-A9 |

## Contraste (WCAG 2.x, hex do `index.css` bloco ONDA 1)

| Par | Onde | Escuro | Claro |
|---|---|---|---|
| `ink` / `surface` | títulos e valores do diálogo, nome do hábito no cartão, corpo das folhas | 13,59 | 16,23 |
| `muted` / `surface` | pistas, rótulos das linhas, esforço em palavra, data da cerimônia, notas | 7,43 | 5,80 |
| `ink` / `surface-2` | `.hchip`, `.focus-row` não escolhido, campo | 11,52 | 14,23 |
| `muted` / `surface-2` | `radio_button_unchecked`, placeholder, "Save my progress" inerte | 6,30 | 5,09 |
| `primary-ink` / `surface` | valores destacados (dia completo/retorno), `eco`, `download`, filete da sugestão | 11,12 | 6,02 |
| `primary-ink` / `primary-soft` (composto) | foco escolhido, carinha escolhida, "Stretch · counted" | 7,69 | 5,21 |
| `ink` / `primary-soft` (composto) | título do foco escolhido, "Stretch · counted" | 9,40 | 14,04 |
| `muted` / `primary-soft` (composto) | a palavra de esforço ("quick"/"medium") na linha escolhida — o par mais apertado do canvas | 5,14 | 5,02 |
| `on-primary` / `primary-fill` | Commit, Start the day, Good morning!, Install, Enable, Got it, Let's keep going | 12,38 | 6,02 |
| `gold-ink` / `surface` | carga do dia (`info` + texto), "· New!", estrela do dia completo, `wb_sunny` | 8,84 | 5,87 |
| `gold-ink` / `bg` | (referência) | 10,51 | 5,41 |
| `muted` / `bg` | pendentes dos quadros, setas, `.stub`, legendas das strips | 8,83 | 5,35 |
| `ink` / `bg` | títulos dos quadros | 16,15 | 14,96 |
| `primary-ink` / `bg` | "+2 notices" `expand_more` | 13,21 | 5,55 |
| `primary-ink` / `surface-2` (não-texto) | anel do foco escolhido sobre `surface-2` | 9,43 | 5,28 |
| `muted` / `surface` (não-texto) | anel das carinhas, tracejado do inerte, ○ e — da janela | 7,43 | 5,80 |
| `primary-fill` / `surface` (não-texto) | ● da janela, anel 2px da cerimônia | 11,12 | 6,02 |

Nenhum par abaixo de 4,5 (texto) ou 3 (não-texto) nos dois temas. **Nenhuma opacidade em nó nenhum do telefone**
(medido nos 22). Os emoji de humor não são texto de cor (glifos coloridos) — o que se mede é o anel do alvo.

## Achados (divergências com o código de hoje — para o `staff-frontend`)

1. **Pixel fora do visor** em todos os rituais: `DailyReportModal`, `MorningCheckIn`, `MorningDream`, `WeeklyReportCard`, `MilestoneCeremony`, `ProtectProgressModal`, `WelcomePromptModal`, `FirstTaskCompletedPopup` montam em `.sm-px-*`/`PixelKit`/`ModalSheet` 9-slice → aparelho vetor; o pixel só em vidro (D-R3).
2. **Manchetes por emoji** (🌙⭐☀️) no `DailyReportModal` → `bedtime`/`star`/`wb_sunny`/`nightlight` (subset). As carinhas ficam emoji (D-R6).
3. **Confete `gain-confetti.png`** solto sobre o card → SVG vetor (D-R2); o PNG fica para o vidro da Home.
4. **Arte da aventura** (`adv-*.png` 96²) solta no card → vidro 48²; **cena do sonho** com moldura pixel → vidro 128² a 1×; **"PET" 72** do `MemoriesCard`/retorno/primeira tarefa → sprite 64 em vidro 96².
5. **Ordem do relatório** (R2): ontem inteiro → humor → convite → "Start the day"; o código intercala o humor antes da aventura.
6. **Copy que sai (S1–S8)**: "You were away N days…", "0 of 4", "0 task(s) done · 0 effort point(s)", "chosen focus: 0", "Planned load: 0 points", "Yesterday's tasks 0 of M" (→ "not logged"), a nota do carinho, "You're on a good streak!" (→ "You two have a history now."), "(s)" nos plurais.
7. **`.focus-row` inerte a `opacity:.5`** no `MorningCheckIn` → tracejado + `aria-disabled` + tinta (Home F1/E7).
8. **Linha de carga** do check-in em caixa com borda → texto `gold-ink` sem moldura; e ela é cega ao foco escolhido (V2, STATUS c).
9. **`MilestoneCeremony` `role="status"` sem trap nem Escape** → `role="dialog"` + `useDialogA11y` com Escape = `onDone` (STATUS f); o artboard mantém `status` por fidelidade.
10. **Emblemas de marco — decisão (X4, lead 16/09/2026)**: `ACHIEVEMENT_IDS` tem `streak-7`/`milestone-21` com arte descasada de `HABIT_MILESTONES` 7/21/66 (o broto está no arquivo "21"; o 66 não tem emblema; nada é persistido — renomear é grátis). Casamento id ↔ tier ↔ arte: **`habit-7`** = sprout = **broto** (o atual `milestone-21.png` renomeado `habit-7.png`, "7-day habit" / "Hábito de 7 dias") · **`habit-21`** = sapling = **arvoreta** (`habit-21.png`, arte nova da `squad-arte`, 64², mesma paleta) · **`habit-66`** = tree = **árvore** (`habit-66.png`, arte nova). **`streak-7` sai** (o anel; vocabulário vetado). A cerimônia recebe `emblemFor(tier)` (`emblemArt.ts`) em vez de `tierIcon` emoji. Testes: `achievements.test.ts` (ids), `emblemArt` (glob). O artboard já usa o broto como `habit-7`.
18. **Copy da cerimônia sem emoji (X3)**: `MILESTONE_TEXT` × 3 tiers × PT/EN perde o 🌿/🌾/🌳 — o tier é o `eco` (FILL .34/.67/1) e o emblema no vidro; `tierIcon` deixa de ser prop.
19. **Regra para toda arte no vidro (X1)**: escala sempre em múltiplo de 0,5× do nativo (0,5× · 1× · 1,5× em DPR 1/2/3) — nunca 0,75×.
11. **`FirstTaskCompletedPopup`** em `ModalSheet` z-120 sob os intersticiais → classe da cerimônia (z-300, espera o gesto) (R8/S8; STATUS a).
12. **`ProtectProgressModal` × `WelcomePromptModal`** no mesmo valor de `interstitial` (B5; STATUS b).
13. **`offerShownWeek`** carimbado no toque → ao mostrar (dono, 13.11; STATUS i). **`restDayUsed`/`weeklyRelief`** sem `!welcome` (STATUS h).
14. **Sino** não existe no subset → `schedule`; **sunrise** → `wb_sunny`; `download`, `info`, `check_circle`, `radio_button_unchecked`, `sync` — todos no inventário; **nenhum glifo novo pedido**.
15. **× da folha por último no foco** (E9) — o DOM da `ModalSheet` o tem primeiro (`[novo — estrutura]` já declarado na Home).
16. **"+N notices"** e "Close" do cartão semanal em `PixelButton` → `quiet sm` com `expand_more` / `quiet sm` 44.
17. **`SemanaCartao` sem dock/nav** — o wireframe não os desenha (o cartão vive na Home, HOME-01, onde eles existem); na Home real a dobra cai a 724 e "Close" rola (tabela acima).

## Pendentes

- **Sem pendência do dono.** Nenhum token novo, nenhum glifo fora do inventário.
- Para a `squad-arte`: as duas artes novas de marco (`habit-21` arvoreta, `habit-66` árvore, 64², paleta do broto) e o rename `milestone-21.png` → `habit-7.png` (achado 10).
- Para o lead: N3 da crítica — o × de `PrimeiraTarefa` (fidelidade ao RIT-26) × R8 que a promove a cerimônia sem × (V1): quando o `staff-frontend` implementar R8, a folha vira `.dlg` sem ×, ou o teste de "um botão" fica só na cerimônia do marco.
- Para o wireframe (`../`): nada — os 21 pares são idênticos em aria/foco/copy (o único `role` a mais é o X5).

## Rodada 2 — achado → conserto (crítica de 16/09/2026, `CRITICA.md`)

| # | Achado | Conserto | Prova (medida no DOM) |
|---|---|---|---|
| **X1** | Emblema 64² a 48 (0,75×) e sprite a 96 (0,375×) no vidro da cerimônia | vidro 208×144; sprite a **128** (0,5×, o mesmo do palco), emblema a **64** (1×) | `naturalWidth` 256 → 128 CSS; 64 → 64 CSS; regra "múltiplo de 0,5×" no D-R3 e no achado 19 |
| **X2** | 3 de 14 peças do confete dentro da caixa do `h2` (≈1,3:1 local) | SVG 200×**60** na faixa da estrela (`top:0`, termina 2px acima do título) | `getBoundingClientRect` de cada peça × caixa do `h2`: **0 de 14 dentro** em `RelatorioDiaCompleto` (svg até 241, título a 239) e `RelatorioOferta` (165 / 163) |
| **X3** | 🌿 da copy repete o tier (o `eco`) com um glifo colorido fora do vidro | frase "7 days! This habit is a sprout now." sem emoji, marcada `[novo]`; achado 18 para o `staff-frontend` | 🌿 no telefone = 0 |
| **X4** | `streak-7`/`milestone-21` descasados de 7/21/66 | decisão registrada (achado 10): `habit-7` broto · `habit-21` arvoreta · `habit-66` árvore; `streak-7` sai | — |
| **X5** | README: "2 de 5" falso; `.dlg` sem `role`; pares `*/primary-soft` ausentes | D-R6 corrigida (conjunto `sentiment_*` completo, fora do subset); `.dlg` com `role=dialog` + `aria-labelledby="mc-title"`; `ink/primary-soft` 9,40 / 14,04 e `muted/primary-soft` 5,14 / 5,02 na tabela | fidelidade: roles 20/21 + 1 diferença deliberada; aria/foco/copy 21/21 |
| N2 | "5 · 5" na amostra do `CheckInNormal` | carga 6 · foco 5 | — |
| N1 · N3–N6 | `.dobra` sobre texto das strips; × da primeira tarefa; `.tagd` no telefone; `.hchip` sem borda; claro por cálculo | registro (N3 vai ao lead, acima) | — |

Re-medido após os consertos (22 artboards): **0** texto < 12 · **0** overflow · **0** alvo < 44 · **0** `opacity` < 1 ·
**0** `text-shadow` · **0** Silkscreen fora do vidro · **0** PNG fora de `.screen`; `canvas.json` com as alturas novas
(`MarcoCerimonia` 1973, `RelatorioDiaCompleto` 1695).

## Fontes

`DailyReportModal.tsx` · `MorningCheckIn.tsx` · `MorningDream.tsx` · `WeeklyReportCard.tsx` · `MilestoneCeremony.tsx` ·
`ProtectProgressModal.tsx` · `WelcomePromptModal.tsx` · `FirstTaskCompletedPopup.tsx` · `MemoriesCard.tsx` · `utils/rituals.ts` ·
`utils/mood.ts` · `utils/welcomeBack.ts` · `utils/offerMoment.ts` · `tokens.md` §5 (subset de 102), §6.1 · DECISÕES §7, §18–§20 ·
HANDOFF §1, §4–§7 · Home `README.md`/`CRITICA.md` · Atividades `README.md`/`CRITICA.md` · Sistema `README.md`/`CRITICA.md` ·
02 §7, §11, §12, §21, §27, §28, §30–§33, §37, §38, §41, §43, §45 · PRINCÍPIOS §4, §5, §8, §13.
