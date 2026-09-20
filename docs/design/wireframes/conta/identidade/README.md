# Canvas "Conta" — identidade (Fase 2, 12º canvas) · rodada 2 (20/09/2026)

> Dono: `soulmon-visual-designer` · 20/09/2026 · **rodada 2** (`CRITICA.md`: ENTRA COM CONSERTOS, 0 fatais — X1 "2 of 3" (`AD_DAILY_CAP = 3`), X2 "4 of 30" (`DREAM_CATALOG.length = 30`), X3 `.num` = Rubik 500 tabular sem 700 sintetizado, X4 "Redo" `primary` por decisão do lead, R1 `.dobra` = filete 2px sem faixa) · HANDOFF-IDENTIDADE §1, §4–§7 · base: canvas **Sistema** aprovado
> (`../../sistema/identidade/`, DECISÕES §18 — P1 espaço 4/8/12/16/24/32 + 2, **P2 = (a)** 256² a 128 CSS, **P3** nav 32),
> **Home** (§19: o vidro 348×200 com anel de cobre, berço e cenário em cover como transição), **Atividades** (§20: tinta nunca
> alpha, o gerador reprova `opacity < 1`; folhas de decisão sem primário), **Rituais** (§21: saídas em `outline`, nunca
> `quiet`; folha em fluxo com marcador de dobra), **Pet** (§22: D-P1 segmento ativo em `primary-soft` + `primary-ink`),
> **Evolução** (§24: confirmar em `outline`; o convite `.nudge`), **Jogos** (§25: valores em mono `tabular-nums`), **Loja**
> (CRITICA: nada de `[novo]` dentro do telefone sem prova verdadeira; Créditos = `diamond` em `credit-ink`, número em `ink`;
> tags na coluna de texto, valores em mono) e **Social** (o `role=alert` âmbar, inerte por forma). Tudo que as onze
> `CRITICA.md` anteriores reprovaram está reprovado aqui desde a rodada 1.
> Estrutura: os 14 wireframes cinza aprovados de `../` (DECISÕES §15, K1–K5 / V1–V7 / S1–S4) e as linhas `CONTA-01`→`CONTA-25`
> + `CONTA-33` do `INVENTARIO-WIREFRAMES.md` §1.9 (`CONTA-13` `fora` por D5, confirmado pelo dono; `CONTA-26`→`32` migraram
> para o Social).
> **Cada artboard = o wireframe de mesmo nome com a identidade aplicada** — mesma hierarquia, mesmos estados, mesma copy
> (EN; PT no rodapé), mesma sequência de `role`, mesmos `aria-label`, mesma ordem de foco. Nada estrutural mudou; o que
> "pediu" para mudar está no rodapé como achado. Escuro em todos; claro só no `MainClaro` (decisão 3 do dono).
> **Regras que mordem, todas respeitadas no desenho:** **tudo é APARELHO** (vetor) — o único vidro é o palco mini da Home
> atrás das cinco folhas, onde o wireframe o põe; **Créditos = dinheiro real** (`--sm2-credit-ink` + `diamond`, número em
> `ink` mono; a única moeda com ícone; sem "Heal 1 heart", sem Bits→Créditos); **a Janela de Descanso é do usuário** (sem
> score, sem gráfico de estágios; `hideMetrics` esconde os números e os sonhos FICAM); **desbloquear é convite** (`.nudge`
> dourado de 280, nunca cobrança, nunca vermelho, nunca cronômetro); **telemetria = consentimento explícito** (o switch diz
> o que conta e o que nunca conta; o desligar é um toque igual); **Guia/Glossário: os números saem das CONSTANTES**;
> **perda irreversível em `outline`, nunca em primário nem em `danger`** (§20/§24); confirmação SEM perda leva o primário (X4) — o gerador reprova
> qualquer `danger` dentro do telefone.

## Como abrir

O `<style>` de cada `.dc.html` é o bloco do `Sistema/Main.dc.html` **copiado** (tokens `--sm2-*`, átomos, rodapé) + o bloco
`HOME (composição)` (anel/vidro, `.stage`, nav, `.strip`, `.folha`) + `ATIV (composição)` (`.dobra`, `.folha.flow`) +
`JOG (composição)` (`.alert`, `.two`) + um bloco `CONTA (composição)` só de layout (os grupos `.grp`, a `SwitchRow` `.swrow`,
a `ActionRow` `.arow`, o `Disclosure` `.disc`, o radiogroup tonal `.rg`, chave:valor `.kv`, os campos de hora `.times`, o
código `.code`, o painel do 503 `.panel503`, o inventário `.inv`, a linha-botão dos Créditos `.crow`, o saldo `.bal`, os
chips `.chips`, os perks `.perk`, o convite `.nudge`, os capítulos `.chap`, o glossário `.gl`, o skeleton `.skcard`) — nenhum
token novo, nenhum literal de cor. As mesmas podas da rodada 2 de Atividades e o mesmo `guard()` no gerador (reprova
`opacity < 1`, `text-shadow`, `.pix` fora de `.screen`, `<img>` fora de `.screen` **e qualquer `danger` dentro do telefone**).
Imagens e fontes por caminho relativo ao repo. Servir a raiz do repo:
`npx -y serve -l 8778 D:/Soulmon/repo` → `http://localhost:8778/docs/design/wireframes/conta/identidade/Main.dc.html`.
Gerador (fora do repo, no scratchpad da sessão): `gen_conta.py` (importa `gen_ativ_head.py`, os blocos `STYLE_ATIV`/`STYLE_JOG`
de `gen_ativ.py`/`gen_jogos.py`); medição `measure_conta.mjs`; diff de fidelidade `cmp.py` — os `.dc.html` são a fonte
commitada.

## O que cada artboard prova

| Artboard | Id | Prova |
|---|---|---|
| `Main.dc.html` | CONTA-01 · 02 · 06 | O cartão de instalar = card SIS-03 com **`download` 24 pelado em `primary-ink`** + título 14/500, "Install" `primary` 48, "Not now" `outline` (a recusa é saída, nunca `quiet`); "Your account" = card com **título Fredoka 20**, o campo `.inp` 44, **"Sign in" inerte por superfície** (`surface-2` + `muted`, `aria-disabled`, fora do Tab), a região `aria-live` sempre montada (18px), "Your plan · Demo" 14/500, **"Credits · `diamond` 0"** (`credit-ink` + mono), "Restore purchases" `outline`, o `Disclosure` com `expand_more`; o marcador "▼ … (one page)". Dobra a 844: instalar 63–244, conta 254–661, marcador 671–722, nav 774. |
| `MainClaro.dc.html` | CONTA-01 claro | O mesmo DOM sob `[data-theme=light]` — `ink #0E2422` / `bg #F1F7F5` / `surface #FFFFFF`, `on-primary` branco sobre `primary-fill #0B6F68` no "Install", `credit-ink #6D28D9` no `diamond`. |
| `ContaLogada.dc.html` | CONTA-03 | O e-mail 14/500 + o campo preenchido em `ink`; "Sign in" `primary` vivo; "Progress loaded!" em `ink` 500 na região; "Your plan · Full"; "Credits · `diamond` 32" mono; "Restore purchases" `outline`; **"Sign out" `quiet`** (sair é quieto, nunca vermelho); o código de recuperação em mono sobre `surface-2` + **"Copied" com `check` FILL `primary-ink` num alvo 44** (era 32); "Restore" inerte por superfície; as respostas em `muted` 12 (as boas em `ink` 500) — nenhuma em vermelho. **Sem vidro**: o wireframe não põe a criatura aqui, e o canvas não acrescenta (Loja F1). |
| `DadosTelemetria.dc.html` | CONTA-04 · 05 | Os dois botões `outline` 48 de largura inteira (`download` 20 `primary-ink` no exportar); o **switch de telemetria** ligado = `primary-fill` (consentimento explícito, sem dark pattern: o rótulo diz o que é contado e o que nunca é); o **503 = painel `surface-2` em tinta neutra** (título 14/500 + 12 `muted`), sem filete, sem âmbar, sem vermelho — é ESTADO; os botões inertes por superfície e fora do Tab; o inventário em três pares; **"Erase now" em `outline`** (perda irreversível nunca em primário, nunca em `danger`); "Go back" `quiet`; as respostas em `muted` 12. |
| `Grupos.dc.html` | CONTA-01 | Cinco cards SIS-03 (Fredoka 20); cada `SwitchRow` = 14/500 + 12 + **`.switch` 52×32** (ligado = `primary-fill`); cada `ActionRow` = 44 com `chevron_right` 24 `muted` pelado (a política é `role=link` na mesma linha); **Theme/Language = segmentos TONAIS 44** (`primary-soft` + `primary-ink` + borda no ativo — D-P1, nunca placa cheia); as horas em `.inp` 44 com `schedule` 20 + **mono `tabular-nums`**; "Soulmon 1.0.2" `note` 12. Rolagem (`tall`): 5 cards 92–1031, nav 1031–1100. |
| `Descanso.dc.html` | CONTA-07 · 08 · 09 · 10 | O card "Rest window" (Fredoka 20, caixa de frase — era `PixelPanel` Silkscreen 12); as horas em `.inp` + `schedule` + mono; "Remind me to lie down" `outline` (lembrete é convite) + a prévia do push em `note`; **"5 of 7" Rubik 14/500 `tabular-nums` (`.sm2-num`, sem 700 sintetizado) + o `.meter` SIS-07 em `primary-fill`** (constância de COMPORTAMENTO — nunca score, nunca resultado; sem registro a barra não existe, nunca "0 of 0"); "never counts against you" 12; a tag "Rare dream" `.chip.tag` + "4 of 30" tabular (`DREAM_CATALOG.length = 30`); **o switch de esconder métricas ligado — e os sonhos continuam na tela**. Proibido e ausente: score de sono, gráfico de estágios, meta de duração, texto que julga. |
| `Passos.dc.html` | CONTA-11 · 12 | O consentimento = card "Count your steps?" (a copy de `stepsConsentCopy`, caixa de frase), três parágrafos 12, **"Count them" `primary` + "Not now" `outline` do MESMO tamanho**; com permissão: **"4 320" em mono 24 `tabular-nums`** (valor = mono; leitura, não placar), "of 7000 steps", o `.meter` em `primary-fill`, a frase que tira o ponto; sem sensor: não desenhado (ramo morto, S2). |
| `Carregando.dc.html` | CONTA-33 | Card SIS-03 centrado (220, como `variant="page"`) com bloco `surface-2` 120×80 sem texto + "Loading" Rubik 12/500 caixa alta (`.lab`) + "Loading…" 12 `muted` — **0 Silkscreen fora do vidro** (Home HOME-04, Pet); a nav fica (fora do `Suspense`). |
| `Personalidade.dc.html` | CONTA-14 · 13 | A folha SIS-04 sobre o scrim literal (o palco mini da Home atrás, sem esmaecer por opacidade); "Personality" Fredoka 20 + × 44 pelado; três grupos com rótulo 12 e **chips SIS-03 a 44** (eram 32), o escolhido em `primary-soft` + `primary-ink` + borda; "More options" com `expand_more`; **"Default" `quiet` + "Save" `primary`** lado a lado, mesma largura; a strip de CONTA-13 (fora, pendente do dono → confirmado) como registro. |
| `GuiaGlossario.dc.html` | CONTA-15 · 16 | O Guia: sete capítulos = linhas 44 (eram 40) com `expand_more` 24 `muted`; o aberto em 14/500 com `expand_less` `primary-ink` e o corpo 12 recuado por um filete `line`; "Close" `outline`. O Glossário: `dl` com `dt` 14/500 e `dd` 12 `muted`, sem acordeão; "Close" `outline`. |
| `RefazerRitual.dc.html` | CONTA-17 | Folha curta ancorada (525–843): "Redo the ritual" Fredoka 20 + × 44; a frase 14 `ink`; **"Cancel" `outline` + "Redo" `primary`, lado a lado, mesma largura** (X4: nada se perde — o wireframe, o código e a copy são explícitos; `outline` fica só para perda), e nunca `danger`. |
| `Creditos.dc.html` | CONTA-18 · 19 | A folha SIS-04; "Earn"/"Spend" Fredoka 16; **cada linha = card-botão 56** (14/500 + 12 + `chevron_right` `muted`): "Watch ad (+5)" com "2 of 3" tabular (`AD_DAILY_CAP = 3`); **os packs com `diamond` 20 FILL `credit-ink` + "60 Credits" mono 16 + "R$ 4,90 BRL" mono 12** — Créditos são dinheiro real e a única moeda com ícone; "New Reading" com a frase da equivalência mecânica; o saldo `diamond` + "32" mono; **o "limit reached" inerte por FORMA** (tracejado + `muted`, fora do Tab); "Purchases are only available…" em `muted` — sem vermelho; nenhum `primary` na folha (nenhum pack "recomendado"). "Heal 1 heart" ⚰️ não volta. |
| `NovaLeitura.dc.html` | CONTA-20 · 21 | A tese 14; "Question 1 of 6" + chips 44 (A em `primary-soft`); **"Read again — 50 credits" INERTE por superfície até uma resposta mudar** — o primário só acende quando há o que cobrar; "Not now" `outline`; "Reading…" `sync` 20 + `aria-busy`; "Not enough credits." 12 `muted` (sem vermelho); **a falha = `role=alert` em âmbar** (filete 3px + `gold-ink`). |
| `Desbloquear.dc.html` | CONTA-22 · 23 · 24 | O título Fredoka 20 em duas linhas + × 44; os três perks com `check_circle` 20 FILL `primary-ink` pelado; "Paying never makes your creature stronger. It can't." 14/500; **"Unlock" `primary`, "Not now" `outline`, "Already bought — restore" `quiet` — os três da MESMA largura**; comprando: os três inertes + `sync` + `aria-busy`; a recusa = `role=alert` âmbar — o modal fica; sem cronômetro, sem preço riscado, sem badge. |
| `Convites.dc.html` | CONTA-25 | Os cinco convites = o `.nudge` da Evolução/Loja: card-botão SIS-03 de 280 (a assimetria diz "opcional"), **`auto_awesome` 24 FILL `gold-ink` pelado** (dourado = convite, nunca o ciano de ação), manchete 14/500 por motivo, o preço 12 `muted`, `chevron_right` `muted` no fim; nenhum ×, nenhuma cor de urgência. |

## Decisões de identidade (D-K1…D-K10)

| # | Decisão | Fonte |
|---|---|---|
| D-K1 | **A SettingsPage é aparelho puro**: cada grupo por intenção = card SIS-03 com título Fredoka 20 (o `h2` do código); `SwitchRow` = 14/500 + 12 + `.switch` 52×32 num alvo 44; `ActionRow` = 44 com `chevron_right` 24 `muted` pelado; `Disclosure` = a mesma linha com `expand_more`/`expand_less` (abrir para baixo, não navegar). Nenhum PNG, nenhuma Silkscreen — o `RestWindowCard`/`StepsCard` (`PixelPanel`/`PixelMeter`/`PixelTag`/`PixelSwitch`) viram os mesmos cards e primitivos SIS-03/SIS-07. | HANDOFF §1/§6; Sistema achado 1; K1 |
| D-K2 | **Radiogroup = segmentos TONAIS**: o ativo em `primary-soft` + `primary-ink` + borda 1px, os quietos em `muted` sobre `surface`; nunca placa cheia (o wireframe e o `sm-btn` pintam placa). | Pet D-P1; Loja (segmentos) |
| D-K3 | **Valor CONTÍNUO (hora, saldo, preço, código, número de passos) = `--sm2-font-mono` `tabular-nums`; contagem "N of M" ("5 of 7", "4 of 30", "2 of 3", "of 7000") = Rubik `tabular-nums` (`.sm2-num`, 500 — nunca 700 sintetizado: a face carrega 400/500), como o código; palavras ("Full", "Demo") em Rubik 500.** | Loja CRITICA (valores em mono); Jogos D-J |
| D-K4 | **Créditos = `diamond` 20 FILL em `--sm2-credit-ink` + número em `ink`** — a única moeda com ícone, porque é a única que é dinheiro real; aparece em "Credits" da conta, nos packs e no saldo da folha. Bits e Emblemas não aparecem nesta família (nada a misturar). | `CLAUDE.md` › 💎 Créditos; `currencies.ts`; Loja |
| D-K5 | **Inerte por superfície ou por forma, nunca por opacidade**: botão inerte = `surface-2` + `muted` (`aria-disabled`, fora do Tab, sem número); linha inerte = tracejado 1px `muted` + tinta `muted`; o switch desligado = trilho `surface-2` + bolinha `muted`. | Atividades F1/D-A3; Social D-S4 |
| D-K6 | **Perda irreversível em `outline`**: "Erase now" (apaga a conta); `--sm2-danger-*` não entra (o gerador reprova). Confirmação SEM perda leva o `primary` ("Redo" — X4, decisão do lead: o wireframe, o código e a copy dizem que nada se perde); "Cancel" `outline`; "Go back" numa saída é `quiet` (o cancelar não ganha peso). | §20 (folhas de decisão sem primário); §24 (degenerar/confirmar `outline`); D-A/Rituais |
| D-K7 | **O `role=alert` é âmbar**: filete 3px `gold-ink` + tinta `gold-ink` 500 (falha da compra, falha da leitura); "Not enough credits." e as respostas da região `aria-live` ficam em `muted` 12 (as boas em `ink` 500). O 503 não é alerta: painel `surface-2` em tinta neutra. | Social D-S6; K2 (503 é estado) |
| D-K8 | **O convite = `.nudge`** (280, `auto_awesome` FILL `gold-ink`, `chevron_right` `muted`) — dourado é convite; o ciano é ação. Nenhum × no convite, nenhuma cor de urgência, nunca abre sozinho. | Evolução; Loja D-L; REGISTRO 13.1 |
| D-K9 | **As folhas = SIS-04 vetor** (R1: o marcador de dobra é um filete tracejado 2px `primary-ink` + rótulo "▲ 844" à esquerda, sem faixa — não cobre conteúdo) (surface, raio 20, alça, × 44 pelado primeiro, Escape) sobre o scrim literal com o palco mini da Home atrás — o único vidro da família, onde o wireframe o põe; chips a 44 (eram 32), capítulos a 44 (eram 40). Com strips a folha vai em FLUXO com o marcador de dobra a 564 (D-A6). | Rituais; Atividades D-A6 |
| D-K10 | **O skeleton sem Silkscreen**: bloco `surface-2` + "Loading" Rubik 12/500 caixa alta; sem pulso por opacidade. | Home HOME-04; Pet |

## Contraste (WCAG 2.x, hex do `index.css` bloco ONDA 1)

| Par | Onde | Escuro | Claro |
|---|---|---|---|
| `ink` / `bg` | wordmark, o marcador, a tese das folhas | 16,15 | 14,96 |
| `ink` / `surface` | os títulos dos grupos, os rótulos 14/500, os valores, o corpo das folhas, os cards-botão | 13,59 | 16,23 |
| `ink` / `surface-2` | o texto dos campos `.inp`, o código de recuperação | 11,52 | 14,23 |
| `muted` / `bg` | as notas, o marcador de dobra | 8,83 | 5,35 |
| `muted` / `surface` | as linhas 12 dos grupos, os rótulos dos radiogroups, "Loading…", as respostas `aria-live`, os chevrons | 7,43 | 5,80 |
| `muted` / `surface-2` | os botões inertes (Sign in, Restore, Read again, Purchasing…), o painel do 503, o placeholder do campo | 6,30 | 5,09 |
| `primary-ink` / `surface` | `download` do instalar, `check_circle` dos perks, `check` de copiado, o capítulo aberto, "Copied" | 11,12 | 6,02 |
| `primary-ink` / `primary-soft` | o segmento ativo (System, English), os chips escolhidos (Calm, Few, Holds space, A) | 7,69 | 5,21 |
| `primary-ink` / `bg` | a nav ativa | 13,21 | 5,55 |
| `on-primary` / `primary-fill` | Install, Sign in (logada), Count them, Unlock, Save | 12,38 | 6,02 |
| `gold-ink` / `surface` | o `role=alert` (texto e filete) nas folhas; o `auto_awesome` dos convites | 8,84 | 5,87 |
| `credit-ink` / `surface` | o `diamond` dos Créditos (conta, packs, saldo) | 7,56 | 7,10 |
| `viewport-ink` / `viewport-bg` | (nenhum texto dentro do vidro nesta família) | 16,82 | 14,53 |
| `muted` / `surface` (não-texto) | o anel dos `outline`, a fronteira do `.inp`, do `.meter`, do `.switch`, o tracejado do inerte | 7,43 | 5,80 |
| `primary-fill` / `surface` (não-texto) | o switch ligado, o preenchimento do `.meter` (71 %, 62 %) | 11,12 | 6,02 |
| `viewport-ring` / `bg` (não-texto) | o anel do palco mini atrás das folhas | 5,92 | 3,66 |
| `line` / `surface` (decorativo) | as bordas dos cards, o filete do capítulo aberto | 1,32 | 1,25 |

`primary-soft` escuro composto = `rgba(95,243,224,.14)` sobre `surface` → `#1A4643`. Todos os pares de texto ≥ 4,5:1 e os
não-texto ≥ 3:1 nos dois temas (`viewport-ring/bg` claro 3,66 é anel decorativo, precedente Home/Loja).

## Medição (15 artboards, `measure_conta.mjs`, Chrome 420×900 DPR 1)

- **0 texto < 12 px** · **0 vazamento** de 390 · **0 alvo < 44** (`role=button/checkbox/textbox/radio/link/summary`: botões 48, linhas 44–56, chips 44, segmentos 44, × 44, "Copied" 44, nav) · **0 opacidade < 1** · **0 `text-shadow`** · **0 Silkscreen** (nenhum texto dentro dos vidros nesta família) · **0 PNG / `background-image` / `border-image` fora do vidro** (o berço 660→220 e a criatura 256→128 só dentro do `.screen` do palco mini; o único `background-image` fora é o gradiente do anel de cobre — precedente da Home).
- **Fidelidade 14/14 pares** (`cmp.py`): mesma sequência de `role`, mesmos `aria-label` (conjuntos iguais), mesmos marcadores de foco (Main 10 · ContaLogada 7 · Convites 5 · Creditos 6 · DadosTelemetria 6 · Desbloquear 4 · Descanso 10 · Grupos 20 · GuiaGlossario 9 · NovaLeitura 5 · Passos 2 · Personalidade 16 · RefazerRitual 3 · Carregando 5); as diferenças de texto são os nomes de glifo (`check_circle`, `chevron_right`, `expand_more`, `schedule`, `diamond`, `auto_awesome`, `close`), "SOULMON" → "Soulmon" (o wordmark em Fredoka), os títulos dos `PixelPanel` em caixa de frase ("Rest window", "Count your steps?", "Today's steps"), "LOADING" que saiu, os números em `<span class=num>` e o marcador de dobra.
- **Glifos usados (15)**: `check_circle, download, diamond, expand_more, expand_less, chevron_right, schedule, close, check, sync, auto_awesome, home, casino, storefront, menu` — todos no inventário de 102 (`tokens.md` §5).
- **Dobra a 844**: `Main` — instalar 63–244, "Your account" 254–661, marcador 671–722, nav 774 (tudo antes da nav); `Carregando` — card 63–283, nota 293–374, nav 774; `Grupos` (`tall`) — 5 cards 92–1031, nav 1031–1100 (uma página rolável); `RefazerRitual` — folha ancorada 525–843 (nota 762–827), Cancel/Redo 702–750 (cabe); `Personalidade` (fluxo) — o marcador a 755 corta na nota de "More options" (745–826): do título aos 12 chips e "More options" cabe, Default/Save (868–916) são o rodapé que a `ModalSheet` fixa embaixo; `Creditos` (fluxo) — Earn + 3 linhas + nota cabem (358–605), "Spend" + "New Reading" (651–778) cruzam o marcador; `NovaLeitura` (fluxo) — até "Not now" (598–646) e a frase do Rookie cabem; `Desbloquear` (fluxo) — até "Not now" (676–724) cabe, "Already bought — restore" (732–780) cruza o filete (R1: só a linha de 2px, legível) — o corpo rola.
- `canvas.json` = `scrollHeight` dos 15 `.ab` (Main 2416 · MainClaro 1544 · ContaLogada 2586 · DadosTelemetria 3086 · Grupos 2470 · Descanso 2577 · Passos 1997 · Carregando 1651 · Personalidade 2125 · GuiaGlossario 2159 · RefazerRitual 1711 · Creditos 2471 · NovaLeitura 2070 · Desbloquear 2420 · Convites 2010).

## Achados (divergências com o código de hoje — para o `staff-frontend`)

1. **Pixel fora do visor** em `RestWindowCard.tsx` e `StepsCard.tsx` (`PixelPanel` Silkscreen 12 "REST WINDOW"/"TODAY'S STEPS"/"COUNT YOUR STEPS?", `PixelMeter`, `PixelTag`, `PixelSwitch`) → cards SIS-03 com Fredoka 20 em caixa de frase, `.meter`, `.chip.tag`, `.switch` (HANDOFF §6).
2. **`ModalSheet` 9-slice** (`FormKit.tsx`) nas cinco folhas → folha vetor SIS-04; os literais (× "Close", `role=dialog`, Escape) ficam.
3. **Os `radiogroup` Theme/Language em `sm-btn` de placa cheia** → segmento tonal (D-K2).
4. **Valores em Rubik** ("Full", "0", "23:00", "4 320", "R$ 4,90 BRL") → mono `tabular-nums` (D-K3); `--sm2-font-mono` já existe.
5. **"Copied" a 32px** (`SettingsPage` Disclosure) → alvo 44 com `check` 24 FILL.
6. **Chips de `ChipGroup` a 32px** (`AISettingsModal`, `NewReadingModal`) → 44.
7. **Capítulos do `GuideModal` a 40px** → 44; `chevron_right` como marcador de acordeão → `expand_more`/`expand_less`.
8. **"Redo" fica `primary`** (X4, lead): confirmação sem perda leva o primário. Ressalva do crítico: `handleConfirmResetOnboarding` apaga `USER_NAME` e o perfil — a copy diz o que continua, não o que se reescreve (achado de copy para o `redator-ux`).
9. **"Erase now" `destructive`** (`AccountDataSection`) → `outline`; `--sm2-danger-*` não entra na família.
10. **Linha "limit reached" a `opacity .5`** (wireframe/`CreditsModal` `disabled`) → tracejado + `muted`.
11. **Os `role=alert` em tinta preta** (wireframe) e `danger-ink` (código) → `gold-ink` (D-K7).
12. **`ScreenSkeleton` com "LOADING" em Silkscreen fora do vidro** → Rubik 12/500 (D-K10); o pulso por opacidade sai (varredura em `steps()` sobre cor, se houver).
13. **`InstallPrompt` com ícone em box** → `download` 24 pelado.
14. **`UnlockNudge` real com `maxWidth 440`** — o wireframe e o canvas fixam 280 (aceite (d) do guarda).
15. Achados do wireframe que ficam: `onEntitlementChange` nunca passado pela `SettingsPage`; só o export tem `aria-describedby` no 503; o corpo do `UnlockAccountModal` com 2 ramos para 4 motivos (V2); o lembrete de deitar dispara o toggle geral (V4); "Default" que não salva (V5); `accountTier ?? 'paid'` (V7); "Soulmon 1.0.2" literal; o ramo sem sensor do `StepsCard` morto (S2); o erro da Nova Leitura persiste até a próxima tentativa; sem teste para `RestWindowCard`/`StepsCard`/`InstallPrompt`; "Complete Day" defasado no Glossário.

## Pendentes

- Nenhum do dono. X1–X4 e R1 aplicados na rodada 2; X4 decidido pelo lead ("Redo" `primary`).
- Constantes citadas em copy de amostra agora com fonte: `AD_DAILY_CAP = 3` (`monetization.ts`), `DREAM_CATALOG.length = 30` (`restWindow.ts`), `DEFAULT_STEP_GOAL = 7000` (`steps.ts`), `REST_WINDOW_DAYS = 7` (`taskModel.ts`), `REROLL_COST_CREDITS = 50`, `CREDIT_PACKS` 60/150/400.
- Nota sobre o briefing: o despacho citou "a miniatura do pet em `ContaLogada`, sprite 0,25× em mini-visor 64²"; o wireframe aprovado de `ContaLogada` não tem criatura, e acrescentá-la seria `[novo]` dentro do telefone sem prova (Loja F1) — não foi acrescentada. O único vidro da família é o palco mini da Home atrás das cinco folhas (Créditos, Nova Leitura, Personalidade, Refazer, Desbloquear), exatamente onde o wireframe o desenha, com o sprite a 0,5× (128) como nos precedentes de Rituais/Social/Evolução.

## Fontes

`SettingsPage.tsx` · `AccountSection.tsx` · `AccountDataSection.tsx` · `InstallPrompt.tsx` · `RestWindowCard.tsx` · `StepsCard.tsx` ·
`ScreenSkeleton.tsx` · `AISettingsModal.tsx` · `GuideModal.tsx` · `HelpModal.tsx` · `ConfirmDialog.tsx` · `FormKit.tsx` ·
`CreditsModal.tsx` · `NewReadingModal.tsx` · `UnlockAccountModal.tsx` · `utils/monetization.ts` · `utils/priceLabel.ts` ·
`utils/telemetry.ts` · `utils/steps.ts` · `utils/currencies.ts` · `types/taskModel.ts` · `src/index.css` (ONDA 1) ·
`src/styles/tokens.md` · DECISÕES §15, §18–§25 · HANDOFF-IDENTIDADE §1, §4–§7 · `CLAUDE.md` › 💎 Créditos, Janela de
Descanso, Desbloqueio no meio do jogo, Guia · PRINCÍPIOS §8, §11 · REGISTRO §5.3, 13.1, 13.7, 13.11, linha #13.
