# CRÍTICA — canvas "Conta" (identidade, Fase 2, 12º canvas) · `design-critic`

> Revisão BLOQUEANTE · 20/09/2026 · alvo: os 14 `.dc.html` + `MainClaro` + `canvas.json` + `README.md` desta pasta,
> servidos em `localhost:8778`.
> Método: (1) diff estrutural artboard a artboard contra `../<mesmo nome>.dc.html` — sequência de `role`, conjunto de
> `aria-label`, marcadores de foco (`.fo`), lista de `role=button` e conjunto de palavras (14 pares); (2)
> `getComputedStyle` + `getBoundingClientRect` em todos os nós do `.phone` nos 15 artboards (texto < 12px, Silkscreen fora
> do `.screen`, alvo < 44 entre `button/input/a/summary` e `role=button/checkbox/radio/textbox/switch/tab/link/option`,
> vazamento de 390, `<img>`/`background-image`/`border-image`/`mask-image` fora do vidro, `opacity < 1`, `opacity()` em
> `filter`, `text-shadow`, qualquer `danger` em classe ou `style`, emoji no telefone, `scrollHeight` do `.ab` contra o
> `canvas.json`) + **a cor de cada nó de texto sobre o fundo efetivo** (subindo a árvore até o primeiro `background-color`
> opaco — 60 pares distintos) + as caixas dos `.grp/.swrow/.arow/.disc/.rg/.segi/.kv/.inp/.code/.panel503/.inv/.crow/
> .bal/.chip/.perk/.nudge/.chap/.gl/.skcard/.btn/.meter/.switch/.folha/.dobra` e de cada `.ico` (glifo, tamanho, cor,
> `FILL`, fundo e borda do pai) — script PRÓPRIO (`crit_conta.mjs`, Chromium via `playwright-core`, 420×900, DPR 1), não o
> do designer; (3) hex recalculados do `src/index.css` (bloco ONDA 1) com a fórmula WCAG 2.x, inclusive `primary-soft`
> composto (rgba .14 sobre `surface` → `#1A4643`) e `--sm2-credit-ink`; (4) os 15 glifos cruzados com o inventário de 102
> (`tokens.md` §5); (5) **as constantes que a copy cita**: `monetization.ts` (`AD_DAILY_CAP`, `AD_REWARD_CREDITS`,
> `REROLL_COST_CREDITS`, os packs, `FULL_UNLOCK_PRICE_LABEL`), `restWindow.ts` (`DREAM_CATALOG`, `dexProgress`,
> `REST_WINDOW_DAYS`), `steps.ts` (`DEFAULT_STEP_GOAL`), `taskModel.ts` (`DEFAULT_REST_WINDOW`); (6) **a copy contra o
> código**: `AccountDataSection.tsx`, `SettingsPage.tsx`, `RestWindowCard.tsx`, `StepsCard.tsx`, `CreditsModal.tsx`,
> `NewReadingModal.tsx`, `UnlockAccountModal.tsx`, `GuideModal.tsx`, `HelpModal.tsx`, `ConfirmDialog.tsx` + o trecho do
> `App.tsx` que hospeda "Redo the ritual" (`handleConfirmResetOnboarding`); (7) cruzado com DECISÕES §15 (K1–K5 / V1–V7 /
> S1–S4) e §18–§26, `HANDOFF-IDENTIDADE.md` §4–§7, as onze `CRITICA.md` anteriores, `CLAUDE.md` › 💎 Créditos / 🛏️ Janela
> de Descanso / Desbloqueio no meio do jogo / Guia, e o rodapé do wireframe aprovado de cada artboard.
> Não editei nenhum artboard.

## 0. Resumo

| Classe | Qtd | O que pesa |
|---|---|---|
| **fatal** | 0 | — |
| **fixável** | 4 | **X1** "3 of 5 left today" (Créditos, duas vezes + README) é um estado que o código **não produz**: `AD_DAILY_CAP = 3`, então o máximo é "3 of 3" · **X2** "Dreams collected: 4 of 24" (Descanso, três vezes) contra `DREAM_CATALOG.length = 30` (`CLAUDE.md` › 🌠 Sonhos: "dizia 18 até 26/08" — agora diz 24 num canvas cuja tese é "os números saem das CONSTANTES") · **X3** "5 of 7" (Descanso) é `<b class=num>` → **Rubik 700 sintetizado** (o `@font-face` carrega Rubik 400–500 só; a escala do Sistema não tem 700) e o README o descreve como "500 mono" — nem um nem outro; a D-K3 mistura duas coisas: `.num` (= `sm2-num`, Rubik `tabular-nums`) e `.mono` (`--sm2-font-mono`) · **X4 (achado 8, decisão)** "Redo" em `outline` contradiz o wireframe APROVADO (§15), cujo rodapé declara "*'Redo' is PRIMARY, not destructive: the action keeps everything — a red button would be dishonest*", o código (`ConfirmDialog` sem `destructive`) e a própria copy da folha ("stay exactly as they are"). D-K6 vale para **perda** (Erase now); para uma confirmação sem perda o padrão é o primário — ver §2 |
| **ruído** | 9 | `.dobra` (85 % de alfa) sobre conteúdo nas quatro folhas em fluxo — o pior é `Desbloquear`, onde cobre 19 px do botão "Already bought — restore" (o caminho que a Play exige) · a nota de rodapé de `Passos` diz "O número em Rubik 24/700" e o artboard renderiza Cascadia Mono 24/400 (o README acerta) · o código de recuperação "SOUL-7K2Q-…" com reticências (herdado) — a amostra devia ser um código inteiro para medir a largura do mono · packs: o código tem três (60/150/400), a folha mostra dois (declarado na nota) · o corpo do capítulo aberto do Guia é o placeholder "body from constants: …" em mono (herdado): o `staff-frontend` não vê como fica um parágrafo real com número · a tabela de contraste do README não lista `primary-ink/surface-2` (o chip "focus done" do cabeçalho, 9,43 / 5,28) nem `gold-ink/surface-2` (o `check_circle` do mesmo chip, 7,49 / 5,15) — os dois passam · `.nudge` a 280 alinhado à esquerda com 76 px vazios (precedente Loja/Evolução; `UnlockNudge` real 440 — achado 14) · dois primários na mesma página (`Main`: "Install" + "Sign in" quando há e-mail) — fidelidade ao código, só registro · o wordmark renderiza "SOULMON" em caixa alta (`text-transform`) enquanto o README diz "Soulmon" (precedente do Sistema) |

**Veredito: ENTRA COM CONSERTOS.** 0 fatais. X1–X3 são amostras/uma classe (texto no gerador); X4 é a decisão que o
próprio README já pede ao lead — e a resposta está no wireframe aprovado. Nenhum pede o dono. Rodada 2 só para colar
X1–X3 e aplicar X4 conforme o lead decidir.

**O que está certo e não precisa de rodada:** estrutura **idêntica nos 14 pares** — mesma sequência de `role`
(`textbox`/`button`/`switch`/`radiogroup`/`radio`/`link`/`img`/`dialog`/`status`/`alert`), mesmos `aria-label` (14/14
conjuntos iguais), mesmos marcadores de foco (Main 10 · ContaLogada 7 · Convites 5 · Creditos 6 · DadosTelemetria 6 ·
Desbloquear 4 · Descanso 10 · Grupos 20 · GuiaGlossario 9 · NovaLeitura 5 · Passos 2 · Personalidade 16 · RefazerRitual 3 ·
Carregando 5), mesma lista de botões (as diferenças são `›`→`chevron_right`, `˅`→`expand_less`, `spark`→`auto_awesome`,
`gem`→`diamond`, `ok`→`check_circle`, `clock`→`schedule`, "PET"→o palco, "REST WINDOW"→"Rest window", "COUNT YOUR
STEPS?"→"Count your steps?", "TODAY'S STEPS"→"Today's steps", o marcador de dobra); **0 nós < 12 px** nos 15; **0 alvo <
44** (botões 48; linhas `.arow`/`.disc`/`.chap` 44; `.swrow` 44–73; segmentos 83×44 / 127×44; chips 68–160×44; `.crow`
58–127; `.nudge` 280×117; × 44; "Copied" 44; `.inp` 44; nav); **0 vazamento** de 390; **0 Silkscreen** em lugar nenhum
(nenhum texto dentro do vidro nesta família); **0 `opacity < 1`, 0 `opacity()`, 0 `text-shadow`** em nó nenhum dos 15
(o único alfa é o `background-color` do `.dobra`, anotação do canvas); **0 PNG / `background-image` / `border-image` /
`mask-image` fora do vidro** — o berço 660×312→220×104 (⅓) e a criatura 256→128 (0,5×) estão dentro do `.screen`
348×120 do palco mini das cinco folhas, com `bg-room.png` em `cover` (transição declarada, precedente Home/Rituais); o
único `background-image` fora é o gradiente do anel de cobre; **`--sm2-danger-*` ausente dos 15** (classe e `style`);
**0 emoji dentro do telefone** (os "⚠" estão nas legendas dos strips, herdados); **15 glifos, 15 no inventário de 102**;
ícone nunca em box (o `download` acompanha "Install Soulmon"/"Download my data", o `diamond` acompanha o número, o
`check_circle` acompanha o perk, o `auto_awesome` acompanha a manchete, o `schedule` acompanha a hora, os chevrons
acompanham a linha; os cinco da nav e o × são pelados); `canvas.json` = `scrollHeight` dos 15 `.ab` (2416 · 1544 · 2586
· 3086 · 2470 · 2577 · 1997 · 1651 · 2125 · 2159 · 1727 · 2471 · 2070 · 2420 · 2010 — 15/15); **os 17 pares de contraste
do README conferem ao centésimo** nos dois temas (`ink/bg` 16,15 / 14,96 · `ink/surface` 13,59 / 16,23 · `ink/surface-2`
11,52 / 14,23 · `muted/bg` 8,83 / 5,35 · `muted/surface` 7,43 / 5,80 · `muted/surface-2` 6,30 / 5,09 · `primary-ink/surface`
11,12 / 6,02 · `primary-ink/primary-soft` 7,69 / 5,21 · `primary-ink/bg` 13,21 / 5,55 · `on-primary/primary-fill` 12,38 /
6,02 · `gold-ink/surface` 8,84 / 5,87 · `credit-ink/surface` 7,56 / 7,10 · `viewport-ink/viewport-bg` 16,82 / 14,53 ·
`primary-fill/surface` 11,12 / 6,02 · `viewport-ring/bg` 5,92 / 3,66 · `line/surface` 1,32 / 1,25 decorativo) e **o pior
par de texto renderizado nos 15 artboards é 5,09** (`muted` sobre `surface-2` no claro: o placeholder do e-mail e o "Sign
in" inerte — o menor de 60 pares medidos no DOM, todos ≥ 4,5); **a copy é a do código, palavra por palavra** ("What is NOT
here · — nothing here", "Paying never makes your creature stronger. It can't.", "Counters about app usage. Never what you
wrote.", "The window is yours — the app suggests none.", "Steps never score on their own…", "Nothing changed yet — …
nothing to charge for.", "Not enough credits.", "Couldn't do the reading right now. Nothing was charged.", "Purchase
cancelled.", "Purchases go through Google Play…", "Not available yet … Nothing you did caused this.", "Tap a topic. None of
this is required knowledge to play.", "What each word on screen means.", a mensagem de "Redo the ritual"); **as
constantes que batem**: 50 créditos (`REROLL_COST_CREDITS`), 60 → R$ 4,90 e 400 → R$ 19,90 (`CREDIT_PACKS`), R$ 29,90
(`FULL_UNLOCK_PRICE_LABEL`), "+5" (`AD_REWARD_CREDITS`), 7000 (`DEFAULT_STEP_GOAL`, 4 320/7 000 = 62 % no `.meter`),
23:00–07:00 (`DEFAULT_REST_WINDOW`), "last 7 days" (`REST_WINDOW_DAYS`), 5/7 = 71 % no `.meter`; **as regras que
mordem**: Créditos com `diamond` FILL em `credit-ink` (`#C9A7FF` / `#6D28D9`) e número em `ink` mono nos três lugares —
única moeda com ícone, Bits e Emblemas ausentes da família, "Heal 1 heart" ausente, nenhum Bits→Créditos; a Janela de
Descanso sem score, sem gráfico de estágio, sem meta de duração — a barra é `role=img` "Bedtime constancy" 71 % e some
inteira no strip `hideMetrics` **enquanto "Rare dream" e a contagem de sonhos ficam** (o `aria-live` fica montado, como o
código); vazio = frase neutra, sem "0 of 0"; o 503 = `.panel503` em `surface-2` tinta neutra, botões inertes por
superfície e fora do Tab; "Erase now" `outline` + "Go back" `quiet`; o switch de telemetria com a copy de
`telemetryConsentCopy` (o padrão ligado é decisão do código — `SettingsPage.tsx`: "O padrão (ligado) NÃO é decidido
aqui" — e o guarda já aprovou em §15); os cinco `.nudge` dourados sem ×, sem cronômetro, sem preço riscado; "Read again —
50 credits" inerte por superfície até uma resposta mudar; o `role=alert` em `gold-ink` 500 com filete 3 px (8,84) — nunca
vermelho; o `role=dialog` `aria-modal` com × 44 pelado primeiro nas cinco folhas; a região `aria-live` sempre montada
(18 px) nas seis ocorrências.

## 1. Fatal

Nenhum.

## 2. Fixável (X — obrigatórios antes do checkpoint: X1–X3; X4 é do lead)

**X1 — "3 of 5 left today" é impossível.** `Creditos.dc.html`, linha "Watch ad (+5)" (artboard principal e o strip "nos
outros estados") + README ("'3 of 5' tabular"). `monetization.ts`: `AD_DAILY_CAP = 3`, `AD_REWARD_CREDITS = 5`. A copy
do `CreditsModal` é `${adsLeft} of ${AD_DAILY_CAP} left today` → o teto é 3. O designer leu o "+5" do título como o
denominador. Herdado do wireframe — mas o wireframe não prometia constantes; este canvas promete no seu primeiro
parágrafo. **Fix:** "2 of 3 left today" (uma amostra que o código produz e que ainda mostra o contador vivo). Mesmo
padrão que a Loja X5 (amostras alinhadas ao `shop.ts`).

**X2 — "Dreams collected: 4 of 24".** `Descanso.dc.html`, três ocorrências (os três strips). `restWindow.ts`:
`DREAM_CATALOG` tem **30** entradas e `dexProgress().total = DREAM_CATALOG.length`. `CLAUDE.md` › 🌠 já registra que esse
número apodreceu uma vez ("dizia 18 até 26/08/2026"). Herdado do wireframe. **Fix:** "4 of 30" — e, no rodapé, citar
`DREAM_CATALOG.length` como a fonte, para que o próximo canvas não herde de novo.

**X3 — "5 of 7" em bold sintetizado, e a D-K3 promete o que o artboard não faz.** `Descanso.dc.html` usa `<b
class="num">5 of 7</b>`: computado **Rubik 14 px / 700** — o `@font-face` de Rubik carrega `font-weight: 400 500`, então o
700 é *faux bold* do navegador (traço engrossado por software, não a face). A escala do Sistema (§18) tem 400/500 no
texto e 500/600 no display; 700 não existe nela. O README descreve o mesmo nó como "**5 of 7 500 mono**" e a D-K3 lista
"o número de passos (24)" como mono junto com horas e saldos. Medido: `.num` (`5 of 7`, `4 of 24`, `3 of 5`, `of 7000`) é
**Rubik + `tabular-nums`** — exatamente o `.sm2-num` do `index.css` — e `.mono` (`23:00`, `0`, `32`, `R$ 4,90 BRL`,
`4 320`, `SOUL-…`) é `--sm2-font-mono`. Os dois estão certos no artboard; o que está errado é o `<b>` e a prosa. **Fix:**
(a) `<b class=num>` → `<span class="num" style="font-weight:500">` (o código põe este número em `text-lg` 20/500 `ink`;
20/500 é a leitura mais fiel, 14/500 também passa); (b) README: "5 of 7 **Rubik 14/500 tabular**"; (c) D-K3 reescrita
em duas frases: *"valor CONTÍNUO (hora, saldo, preço, código, número de passos) = `--sm2-font-mono` `tabular-nums`;
contagem 'N of M' = Rubik `tabular-nums` (`.sm2-num`), como o código"*. O `.chip.tag` "sample" a 12/600 também é
sintetizado, mas é anotação do canvas, não UI.

**X4 — achado 8: "Redo" volta a `primary`; D-K6 fica só para perda.** Três fontes dizem a mesma coisa e o canvas
contradiz as três: (1) o **wireframe aprovado** (`../RefazerRitual.dc.html`, §15 K4, checkpoint fechado em 15/09)
escreve no rodapé *"'Redo' is PRIMARY, not destructive: the action keeps everything — a red button would be dishonest"*
e em "Sai da tela atual": *"Botão vermelho — o `destructive` é omitido de propósito (nada se perde)"* — ou seja, o TOM do
botão foi decidido na Fase 1, não é "variante de botão" livre; (2) o **código** (`App.tsx` › `ConfirmDialog` sem
`destructive`, comentário "o código só limpa nome e linha de sprite — o save de jogo continua inteiro";
`handleConfirmResetOnboarding` remove `ONBOARDING_COMPLETE`/`USER_NAME`/`EGG_TYPE` e recarrega); (3) a **copy** da
própria folha: "Your Soulmon, activities, Bits and all progress stay exactly as they are". Os precedentes que a D-K6 cita
(§20 "folhas de decisão sem primário", §24 "degenerar/confirmar `outline`") são folhas onde **algo se perde** (degenerar,
apagar a conta, deixar uma tarefa pra lá) — o `outline`+`outline` lado a lado é a forma que o sistema reservou para
"escolha com custo, sem empurrão". Aplicá-la a uma confirmação sem custo faz a forma dizer "cuidado" enquanto a copy diz
"nada muda" — e a pessoa que abriu o menu para refazer o ritual perde o botão que veio apertar. Padrão de mercado: Material 3
(*Dialogs › Actions*: a ação confirmatória é a de maior ênfase; só ações destrutivas trocam a ênfase por cor de erro) e
HIG (*Alerts*: o botão default é o que executa a ação pedida, salvo quando destrutiva). **Fix:** `Redo` = `.btn.pri`,
`Cancel` = `.btn.out`, mesma largura (uma classe no gerador, como o README já prevê); D-K6 reescrita: *"perda irreversível
em `outline`, nunca `danger` (Erase now); confirmação sem perda = `primary` + `outline` (Redo the ritual)"*.
**Ressalva para o cartógrafo (não muda o botão):** o briefing desta crítica chama o refazer de "perda irreversível". Se
o lead sustentar isso, o que está errado é a COPY do código ("stay exactly as they are") — e aí é achado de produto para o
STATUS, não uma classe CSS: `USER_NAME` some e o ritual re-pergunta o nome; `EGG_TYPE` é a linha de sprite de fallback do
`hydrateSave`, que o reroll reescreve por `hashString(seed)`. Duas leituras coerentes existem; o canvas hoje mistura as
duas (copy de uma, botões da outra).

## 3. Decisões D-K1…D-K10 — veredito por decisão

| # | Decisão | Veredito | Evidência |
|---|---|---|---|
| D-K1 | SettingsPage aparelho puro: card SIS-03 + Fredoka 20; `SwitchRow` 14/500+12+`.switch` 52×32; `ActionRow` 44 + `chevron_right`; `Disclosure` = `expand_more/less` | **ENTRA** | `.grp` = `surface` + `line` 1px, `.h2` Fredoka 20/600 (13,59 / 16,23); `.swrow` 330×44–73 com `role=switch` + `aria-checked` na LINHA (alvo = a linha, como o wireframe); `.switch` 52×32, trilho `surface-2` + anel `muted` 1px + bolinha `muted` (6,30) desligado, `primary-fill` + bolinha `on-primary` (12,38) ligado; `.arow` 330×44, `chevron_right` 24 `muted` sem fundo; "Privacy policy" `role=link` na mesma linha; `.disc` = `<summary role=button aria-expanded>` com `expand_more`; 0 Silkscreen, 0 PNG. `RestWindowCard`/`StepsCard` como cards SIS-03 com `.meter` SIS-07 (`role=img` + `aria-label`, anel `muted` 1px, preenchimento `primary-fill` 71 % / 62 %) |
| D-K2 | Radiogroup = segmentos tonais | **ENTRA** | `.segi.on` = `rgba(95,243,224,.14)` sobre `surface` (= `#1A4643`, 7,69) + borda 1px `#5FF3E0` + tinta `primary-ink`; quietos `surface` + anel `muted` 1px + tinta `muted` (7,43); 83×44 (Theme) / 127×44 (Language); `role=radiogroup` + `aria-label` + `role=radio` `aria-checked` — a sequência do wireframe. Mesmo `.segi` da Loja/Pet |
| D-K3 | Valor = mono `tabular-nums`; palavras em Rubik 500 | **ENTRA com X3** | Mono confirmado onde a decisão diz: `23:00`/`07:00`/`22:00` (Cascadia 16), `0`/`32` (16/500), `60 Credits`/`400 Credits` (16), `R$ 4,90 BRL`/`R$ 19,90 BRL` (12), `4 320` (24), `SOUL-7K2Q-…` (14); "Full"/"Demo" Rubik 14/500. O que a decisão NÃO diz e o artboard faz certo: as contagens "N of M" em `.num` = Rubik tabular (`sm2-num`); o que faz errado: `<b>` 700 sintetizado (X3) |
| D-K4 | Créditos = `diamond` 20 FILL `credit-ink` + número `ink` — única moeda com ícone | **ENTRA** | `#C9A7FF` (7,56) / `#6D28D9` (7,10) sobre `surface`; FILL 1 confirmado nas 5 ocorrências (Main, MainClaro, ContaLogada, packs, saldo); número sempre em `ink` mono; 0 "Bits", 0 "Emblems", 0 💎 nos 15 artboards; "Heal 1 heart" ausente; a troca Bits→Créditos ausente. Segundo consumidor do token depois da Loja, mesma forma |
| D-K5 | Inerte por superfície ou forma, nunca por opacidade | **ENTRA** | `.btn.dis` = `surface-2` + tinta `muted` (6,30 / 5,09) + `aria-disabled=true`, sem `tabindex`, sem `.fo` — Sign in (Main), Restore (código), Download/Delete (503 e deslogado), Read again, Purchasing…/Not now/restore (comprando); `.crow.dis` = tracejado `muted` 1px + fundo transparente + `aria-disabled`; switch desligado = trilho `surface-2` + bolinha `muted`; **0 `opacity < 1`** nos 15 — o gerador reprova |
| D-K6 | Confirmação e perda em `outline`; `danger` não entra; "Go back" `quiet` | **ENTRA com corte (X4)** | "Erase now" `.btn.out` 304×48 + "Go back" `.btn.qui` — certo (perda irreversível, §20/§24); `--sm2-danger-*` ausente dos 15. **"Redo" em `outline` reprovado**: o wireframe aprovado, o código e a copy dizem que nada se perde — confirmação sem perda leva o primário (X4). A decisão fica valendo para perda; a segunda metade ("Cancel e Redo em outline") sai |
| D-K7 | `role=alert` âmbar; respostas `aria-live` em `muted` 12 (boas em `ink` 500); 503 é painel neutro | **ENTRA** | `.alert` = filete 3px `gold-ink` + tinta `gold-ink` 500 14 (8,84 sobre `surface`) em Desbloquear ×2 e NovaLeitura; "Not enough credits." `muted` 12; as 12 respostas das regiões (`Purchases restored!`, `No purchases found…`, `Invalid email or sync failed.`, `Code not found.`, `This request has expired…`, …) em `muted` 12/400, as boas em `ink` 12/500 — **nenhuma em vermelho, nenhuma em âmbar**; `.panel503` = `surface-2`, título 14/500 `ink`, corpo 12 `muted`, sem filete. Coerente com Social D-S6 e com K2 |
| D-K8 | O convite = `.nudge` 280 dourado, sem ×, sem urgência | **ENTRA** | 5 × `card nudge` 280×117 `role=button`, `auto_awesome` 24 FILL `#EBBE84` (8,84), manchete 14/500 `ink`, preço 12 `muted`, `chevron_right` `muted`; 0 ×, 0 cronômetro, 0 preço riscado, 0 `danger`; a mesma peça da Evolução/Loja. Ruído: 76 px vazios à direita (precedente) |
| D-K9 | Folhas SIS-04 sobre scrim literal com o palco mini atrás; chips 44, capítulos 44; fluxo com `.dobra` | **ENTRA** | 5 × `role=dialog aria-modal=true` com `aria-label` = título; × 44 pelado primeiro (`.fo` 2); o palco 348×120 no anel a 67–187 com `bg-room` cover + berço ⅓ + sprite 0,5× — dentro do `.screen`, e só ali; chips 68–160×44 (eram 32); `.chap` 304×44 (eram 40); `.folha.anch` ancorada 525–843 (Refazer); as quatro em fluxo com `.dobra` a 755–774. Ruído: o `.dobra` cobre conteúdo (§4) |
| D-K10 | Skeleton sem Silkscreen, sem pulso | **ENTRA** | `.skcard` 356×220 `role=status aria-label="Loading"`, bloco `surface-2` 120×80 sem texto, `.lab` "Loading" Rubik 12/500 caixa alta `muted` (7,43), "Loading…" 12 `muted`; 0 Silkscreen, 0 `opacity`; a nav fica |

## 4. Ruído (R — registro, sem rodada)

**R1 —** `.dobra` ("▲ a 844 (ModalSheet 640): daqui para baixo o corpo rola", `color-mix` 85 %) sobre conteúdo nas
quatro folhas em fluxo: `Desbloquear` cobre 19 px de "Already bought — restore" (732–780 × marcador 755–774) — o botão
que a Play exige aparece cortado no recorte provável do checkpoint; `Personalidade` cobre a nota sob "More options";
`Creditos` cruza o corpo de "New Reading"; `NovaLeitura` cruza a frase do Rookie. Precedente Rituais N1 (ruído). Se o
gerador puder, a alternativa é um filete de 2 px sem faixa (a informação é a POSIÇÃO, não o texto).
**R2 —** `Passos.dc.html`, rodapé: "O número em Rubik 24/700" — o artboard renderiza Cascadia Mono 24/400 e o README diz
"mono 24". Corrigir a frase do rodapé.
**R3 —** "SOUL-7K2Q-…" com reticências dentro da amostra (herdado): um código de recuperação truncado é exatamente o que a
tela não pode fazer; a amostra devia ter o comprimento real para medir o mono no chip de 330.
**R4 —** Packs: `CREDIT_PACKS` tem três (60 / 150 / 400 — R$ 4,90 / 9,90 / 19,90); a folha mostra dois. Declarado na nota
sob os packs; fica.
**R5 —** O capítulo aberto do Guia mostra "body from constants: heart loss/absence/relief/milestone thresholds" em mono
(herdado do wireframe). Como spec, o `staff-frontend` não vê o corpo real (12 `muted`, recuado pelo filete `line`) com
um número dentro. Uma linha de amostra ("You lose at most 1 heart a day, and never for a day you were away.") resolveria.
**R6 —** A tabela de contraste do README não lista `primary-ink/surface-2` (o chip "focus done": 9,43 / 5,28) nem
`gold-ink/surface-2` (o `check_circle` do mesmo chip: 7,49 / 5,15). Passam; só faltam na tabela.
**R7 —** `.nudge` 280 alinhado à esquerda com 76 px vazios (precedente Loja R/Evolução); o `UnlockNudge` real usa
`maxWidth 440` (achado 14) — decisão de implementação já registrada.
**R8 —** `Main`: dois primários na página quando há e-mail digitado (Install + Sign in). É o código; registro para o
`product-designer` (V1 já pôs Install no fim como recomendação, o dono manteve a ordem).
**R9 —** O wordmark renderiza "SOULMON" (caixa alta via `text-transform`) enquanto o README diz "Soulmon" — precedente do
Sistema; só o texto do README.

## 5. O que o autor não viu (fora do canvas, para o STATUS / cartógrafo)

- **Constantes citadas em copy de amostra sem fonte**: X1 e X2 são a terceira vez que um número "de constante" chega ao
  canvas de outro canvas (Loja X5, Jogos). Regra prática para o gerador: toda contagem "N of M" no telefone leva no rodapé
  o nome da constante de M.
- **"Redo the ritual" — o que se perde de verdade** (X4, ressalva): `handleConfirmResetOnboarding` apaga `USER_NAME` e
  `EGG_TYPE` e recarrega; a copy diz "stay exactly as they are". Se o ritual re-perguntar o nome e re-sortear a linha
  de sprite de fallback, a copy é otimista. Confirmar com o cartógrafo antes de qualquer canvas de Onboarding tocar no
  modo `redo`.
- **Telemetria com padrão LIGADO** (`SettingsPage.tsx`): o canvas desenha o ligado como estado normal, fiel ao código; o
  guarda aprovou em §15. Se algum dia virar opt-in, o artboard `DadosTelemetria` precisa do ramo desligado.
- Os achados 15 do README (`onEntitlementChange`, `aria-describedby` só no exportar, V2/V4/V5/V7, "Soulmon 1.0.2",
  S2, o erro persistente da Nova Leitura, "Complete Day" defasado) continuam válidos e sem dono no STATUS.

## 6. Veredito final

**ENTRA COM CONSERTOS.** 0 fatais · 4 fixáveis (X1 "2 of 3", X2 "4 of 30", X3 `<b>` → 500 + D-K3/README, X4 "Redo"
`primary` — do lead, com a recomendação de seguir o wireframe aprovado) · 9 ruídos. Estrutura 14/14 idêntica ao wireframe
aprovado; AA por token confirmado nos dois temas e por nó renderizado (pior par 5,09); 0 alpha, 0 texto < 12, 0 alvo < 44,
0 pixel fora do vidro, 0 `danger`, 0 emoji no telefone; as regras de produto (Créditos = dinheiro real; Descanso sem
score; Desbloqueio = convite; consentimento com a copy do código; Guia/Glossário com os números vindos das constantes —
salvo X1/X2, que são justamente onde não vieram) respeitadas. Rodada 2 é de texto no gerador; não precisa voltar ao dono.
Maior alavanca: X4 — é a única linha do canvas em que a forma contradiz a copy.
