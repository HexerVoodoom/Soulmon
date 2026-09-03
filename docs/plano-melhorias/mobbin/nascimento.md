# Mobbin × Nascimento — dossiês 1–4 contra o código (WP1.1–1.5)

Dono: `soulmon-guarda-nascimento`. Fonte: `docs/guia-experiencia/09-mobbin-dossie.md`
(§1 método, §2 Dossiê 1, §3 Dossiê 2, §4 Dossiê 3, §5 Dossiê 4). Ledger:
`docs/plano-melhorias/ledger/nascimento.md`. Anexo factual: `../A-onboarding.md`.

**Regra deste arquivo:** toda afirmação sobre o código foi confirmada por `grep`/`awk`/`sed`
em 02/09/2026. A referência canônica é `arquivo` + SÍMBOLO; número de linha aparece só como
atalho e apodrece. Onde eu **não** verifiquei, está escrito "não verificado".

## 0. Limites que herdo do dossiê (§1) e como eles pesam aqui

- **Só iOS.** O Soulmon é PWA + APK Android. O diálogo de permissão de push (Dossiê 4) tem
  comportamento diferente no Android (o `PushManager` do WebView, e o canal FCM) — nada
  do Dossiê 4 é evidência de Android. Trato como evidência de **copy e momento**, não de
  mecânica.
- **Sem estado transitório.** O clímax de uma revelação dura menos de um segundo e **não está
  no acervo**. O Dossiê 1 me dá a tela *em repouso* depois do clímax; a sequência
  silhueta → flash → criatura do WP1.2 continua sem referência externa. Não finjo que
  o Mobbin a valida.
- **Sem estado de erro de IA** (Dossiê 2 declara). O que existe é erro genérico.
- **Sem estado pós-conclusão de checklist** (Dossiê 3 declara). "Como o checklist some" é
  decisão nossa, sem precedente fotografado além do Preply.

## 0.1 Parecer: qual filosofia o Soulmon segue

As três fontes da transcrição A3 discordam e o Soulmon **não segue uma só**:

- **No nascimento, Tim Gabe (fricção positiva).** As 6 perguntas + a bifurcação dos 20 itens
  + data/hora de nascimento são custo afundado que **personaliza de verdade** — a criatura
  não pode existir sem esse input. NN/g ("onboarding zero, conserte a interface") não se
  aplica a um produto cujo valor É o resultado das perguntas. O Dossiê 1 confirma a aposta
  (Tolan, Noom, Replika) e dá a condição: **quem encena precisa de conteúdo denso para
  cobrir o cheque**. Hoje o Soulmon encena (`GENERATING`) e entrega raso (texto) — "o pior
  dos quatro quadrantes", nas palavras do dossiê. É o WP1.1.
- **No D0, Airtable (assistente guiado), com prazo de validade.** `GameTutorialFlow` + o
  cartão de três gestos do WP1.3 são assistente guiado. O Dossiê 3 (Preply) diz como ele
  deve sair de cena: **dissolvendo-se no conteúdo**, não sumindo por flag.
- **Do D1 em diante, NN/g.** Nenhum tutorial persistente; a interface (o pet falando, a
  lista) tem que bastar. É por isso que o cartão do WP1.3 morre no D1 e não vira "dica".

O que nenhuma das três autoriza — **paywall no reveal** — o Soulmon já evita (ver Replika
abaixo), e eu defendo isso contra invasão: o value moment é o **1º dia perfeito** (C.3 do
guia), domínio do `soulmon-guarda-sustento`.

---

## 1. Três colunas, achado a achado

Legenda do veredito: **JÁ FAZ** · **LACUNA** · **CONFLITA** (com a tese/proibição) ·
**N/A** (não se aplica) · **PARCIAL**.

### Dossiê 1 — Revelação pós-quiz

| # | O que o app faz | O que o Soulmon faz hoje (grep) | Veredito |
|---|---|---|---|
| 1.1 | **Tolan** — miniatura da criatura ao lado do nome; epíteto em cinza sob o nome; leitura paginada com barra própria | Bloco `step === REVEAL` de `src/components/SoulmonOnboarding.tsx`: **0 `<img>`** (`awk '/step === REVEAL/,/step === REGISTER/' … \| grep -c '<img'` → `0`); `<h1>{result.creature.baseName}</h1>`; a linha de essência (`essence`) **só existe no caminho dos 20 itens** — no caminho curto `setEssence(null)` (bloco `else { r = generateOracle(input); setEssence(null) }`); `bio` = 1 parágrafo. A única `<img>` do trecho é `ravenMascot` no `GENERATING`. | **LACUNA** (imagem) · **PARCIAL** (epíteto: falta no caminho curto) · **N/A** (paginação: conteúdo raso — encenar raso é o pior quadrante; não paginar) |
| 1.2 | **Noom** — nome do arquétipo ANTES do texto; bloco `Next steps` que prova que a resposta será usada | Nome antes do texto: sim (`<h1>` precede `bio`). "O que vem a seguir": **nada no REVEAL**; o botão é `Nascer {baseName}`/`Continuar`. A única frase de ponte vive **depois** do `REGISTER`, em `GameTutorialFlow.tsx` `PAGES[0]` ("Ele cresce com você — cada tarefa que você cumpre… o ajuda a evoluir"). | **JÁ FAZ** (nome primeiro) · **LACUNA** (ponte no reveal → WP1.2) |
| 1.3 | **Lovi** — os termos que vieram do quiz em cor diferente dentro da frase | O que o REVEAL mostra é `creature.bio` = `richConceptPt` (`src/utils/oracle.ts`, `const richConceptPt = … "${dominantClass.pt} da linhagem ${identity.pt}, marcado por algo ${secondaryFlavor.pt}."`) — três termos derivados da leitura, **sem marcação nenhuma**; `soulGoal` não é ecoado (grep `soulGoal` em `SoulmonOnboarding.tsx` só nos estados/`finish`). | **LACUNA** → enriquece WP1.2 (marcar os 3 termos derivados; ecoar `soulGoal`) |
| 1.4 | **Life Reset** — ficha de 5 atributos numéricos + "você começa no Day 4" | Traço de nascimento existe (`src/utils/passives.ts`, `petPassive`), visível só em Estatísticas (CLAUDE.md). O `SoulmonOnboarding` não recebe `gameState` (assinatura `{ onComplete, mode, onRevealed, onCancel }`) — **não verifiquei** onde `petPassive` é sorteado nem se estaria disponível no REVEAL. | **N/A** para os números (a forma "planilha" contradiz a tese de que a bio diz de ONDE veio) · o "progresso dotado" já existe em outro lugar (constância de hábito novo = 1, `habitRhythm.ts`) |
| 1.5 | **Headway** — tela-interstício só para anunciar ("unlocked") antes do resultado | `GENERATING` é o interstício do Soulmon: `ravenMascot` + `<Spinner>` + "Revelando a criatura da sua alma…" (`role="status" aria-live="polite"`). Depois dele vem texto. | **CONFLITA com o próprio dossiê**: "esta tela vira pedágio se o resultado seguinte for um parágrafo — é exatamente o risco do Soulmon". WP1.1 é o que cobre o cheque |
| 1.6 | **Replika** — silhueta gestáltica (PADRÃO) + paywall no clímax (ANTI) | Silhueta: não existe. Paywall: a compra do onboarding (`track('purchase')` em `SoulmonOnboarding.tsx`, anexo A) acontece na **escolha do fluxo, antes do ritual**; o bloco REVEAL não tem preço, SKU nem `UnlockNudge` (grep no bloco: só `h1`/`essence`/`bio`/`button`). `FULL_UNLOCK_SKU`/`FULL_UNLOCK_PRICE_LABEL` são importados para a intro. | **JÁ FAZ** (não cobra no clímax — defender) · **LACUNA** (silhueta → WP1.1/1.2) |
| 1.7 | **Speak** — "What I heard" (eco literal) + `Delete my answers` na própria tela | Eco: nenhum. Reversibilidade: o perfil é gravado em `STORAGE_KEYS.SOULMON_PROFILE` (`writeJson`, para o reroll) e existe exclusão de conta (`functions/api/account.js` `delete-request`/`delete-confirm` + UI `src/components/AccountDataSection.tsx`) — **fora** do momento do reveal, nas Configurações. | **PARCIAL** — o eco literal de 26 itens seria pior que nada (o próprio dossiê avisa em Canva); a síntese é o `soulGoal` (WP1.2). Exclusão existe onde deve |
| 1.8 | **Tock** — resultado em folha modal, segmentado por dimensão, `Done` | O REVEAL é passo de tela cheia do ritual, não modal. Os eixos (elemento/papel/alinhamento/reino) vivem em `OraclePage.tsx`, **sem entrada na navegação** (CLAUDE.md: "o jogador vê só nome e descrição"). | **N/A** — decisão registrada; folha modal mataria a sacralidade |
| 1.9 | **MyFitnessPal** — 3 checkboxes pré-marcados no clímax (ANTI) + link "How we make recommendations" (PADRÃO) | Consentimento vive em `CONSENT_STEP` **antes** do ritual, com caixa própria ("A caixa de consentimento vive FORA do texto legal", `SoulmonOnboarding.tsx`); push só depois de valor (`notificationsUnlocked={jaConcluiuAlgo}`, `App.tsx`). Link de método: `docs/ORACULO.md` existe; **nenhum link no app** no reveal. | **JÁ FAZ** (evita o anti) · lacuna menor sem WP (a explicação do método é ferramenta interna) |
| 1.10 | **Fi** — o resultado sai como card reutilizável (perfil, coleção, share) | Não existe container reutilizável: o REVEAL é markup solto; `StatsPage.tsx` mostra `Começou por: “{soulGoal}”` e **0 `<img>`** (grep `<img\|getSpriteForStage\|displaySprite` → nada). | **LACUNA** → candidato C-A |

**Convergência do dossiê aplicada:** nome antes do texto — **já faz**; um único botão
primário de largura total, sem garfo — **já faz** (`Nascer {baseName}`). O que falta é o
que o Soulmon tem de único e não mostra: a criatura.

### Dossiê 2 — Estado de "gerando"

| # | O que o app faz | O que o Soulmon faz hoje (grep) | Veredito |
|---|---|---|---|
| 2.1 | **Finch** — o pet dentro do anel; "Generating … with Lee" (espera atribuída ao companheiro) | `GENERATING`: `ravenMascot` (o Oráculo, mascote do app) + `Spinner` + "Revelando a criatura da sua alma…". A criatura ainda **não existe** neste passo (nome vem de `generateOracle`), então "com {nome}" é impossível aqui. Mas no WP1.1 o texto chega antes do sprite — e **ali** a espera pode ser "com {baseName}". | **PARCIAL** — há personagem (o corvo), não a criatura. **Muda o WP1.1** (ver §2) |
| 2.2 | **GoFundMe** — skeleton fiel à forma do resultado + slot "Did you know?" | Sem skeleton; sem slot. A silhueta do WP1.1 **é** o skeleton fiel (a forma é a da arte de reserva `getSpriteForStage` → `legacySpriteForStage`, `src/utils/sprites.ts`). Slot educativo: sem estoque de fatos; **não proponho**. | **LACUNA** (skeleton → WP1.1) · **N/A** (slot) |
| 2.3 | **Canva** — eco da prompt entre aspas; `Cancel` de largura total; navegação do app viva | Sem eco (não há prompt textual — o dossiê mesmo diz que a síntese seria a saída). Cancelar: **não verifiquei** se a barra de Voltar é renderizada no `GENERATING`; `back()` faz `s - 1` genérico. | **N/A** (eco) · **não verificado** (cancelar) — geração do oráculo é local e rápida; o que demora é o sprite, e esse não bloqueia (WP1.1 §2) |
| 2.4 | **Google Photos** — "This may take about a minute" + "Results may be unexpected" | Sem estimativa de tempo. Sem aviso de qualidade. | **LACUNA** (estimativa verbal, só no estado de sprite pendente) · **CONFLITA** (o aviso "pode sair estranho" num output permanente assusta — o dossiê classifica LIMÍTROFE; **não adotar**) |
| 2.5 | **Any Distance** — pedir follow/menção durante a espera | Nada. | **CONFLITA** — pedir antes de entregar inverte a reciprocidade; mesma proibição do push antes de valor |
| 2.6 | **WhatsApp** — spinner escondido no botão desabilitado; sem estimativa, sem cancelar (ANTI) · `Step 2 of 5` (PADRÃO) | Spinner **central** com `aria-live` — já evita o anti. Contador de etapa no ritual: **não verificado** (o `GameTutorialFlow` tem barra `aria-valuemax={TASK_STEP + 1}`; o `SoulmonOnboarding` emite `onboarding_step` por mudança de passo, mas se mostra barra ao usuário eu não conferi). | **JÁ FAZ** (evita o anti) · não verificado (contador) |
| 2.7 | **Orbe brilhante** (Snapchat/Beside/Character AI) — objeto luminoso + 1 linha; Character AI liga o motion ao domínio | O Soulmon é a variante "mascote + spinner + 1 linha", sem estimativa. O corvo é o Oráculo — o motion **tem** relação com o domínio (leitura), como no Character AI. | **JÁ FAZ o piso** · **LACUNA** (estimativa verbal) |
| 2.8 | **Erro — ABY Journal** (preserva o input atrás do erro) · **Chase UK** (caminho alternativo; "OK, that didn't work") · **Mimo** (sem ação — ANTI) | `doGenerate().catch(() => { setGenerateError(true); setStep(REFINE_OFFER) })`: volta à bifurcação com "Não foi possível revelar sua criatura agora. Escolha de novo para tentar outra vez." — `answers`/`testAnswers` **ficam** (só `next()` os zera, e ele roda no reinício). Duas saídas existem (teste longo/curto), mas as duas repetem a **mesma** geração. Tom: sem drama, sem desculpa. | **JÁ FAZ** (preserva input, retry, tom) · **PARCIAL** (não há caminho *diferente*; aceitável — a geração é local) |
| 2.9 | *(lacuna que o acervo não cobre, mas o ABY sugere)* — ninguém reescreve 20 respostas | As respostas do ritual vivem **só em estado React** até `writeJson(STORAGE_KEYS.SOULMON_PROFILE)` **depois** da geração. Fechar o app no item 15 dos 20 perde tudo (grep `localStorage\|STORAGE_KEYS` em `SoulmonOnboarding.tsx`: só `LANGUAGE`, e `SOULMON_PROFILE` no fim). | **LACUNA** → candidato C-B |
| 2.10 | Convergência: gerúndio na 1ª pessoa do sistema | "Revelando a criatura da sua alma…" / "Revealing your soul's creature…" | **JÁ FAZ** |

### Dossiê 3 — Checklist de D0

Estado do Soulmon, confirmado: **não existe checklist** (`ls src/components \| grep -i
'FirstDay\|Checklist'` → nada). O que há: `GameTutorialFlow.tsx` (modal; `PAGES` em `:51`
com "Seu Soulmon nasceu!"; há um segundo objeto "Loja, minijogos & créditos" em `:73`
**cuja ligação a `PAGES` não verifiquei**; `TASK_STEP = PAGES.length` obriga ≥1 atividade;
botão "Começar" leva direto ao `TASK_STEP`) → `FirstTaskCompletedPopup.tsx` ("Primeira
tarefa feita!" / "Entendi") → fila de intersticiais `triage → dailyReport → checkIn → dream
→ nightmare → welcome` (`App.tsx`, `const interstitial`). **Sem `<img>` no tutorial** (grep
`<img\|sprite` em `GameTutorialFlow.tsx`: só um comentário).

| # | O que o app faz | O que o Soulmon faz hoje (grep) | Veredito |
|---|---|---|---|
| 3.1 | **Strava** — bloco no topo da home, `0/4`, **`I don't have one`** (toda tarefa dispensável ou satisfazível); perde a disputa contra o `Suggested Goal` acima | Não há cartão. **Há disputa equivalente**: o efeito do check-in (`App.tsx`, `if (!hasCompletedOnboarding \|\| !hasCompletedTutorial) return; if (!needsCheckIn(gameState, now)) return; … if (plan.habitsToday.length === 0 && …) return;`) dispara **no D0** assim que o tutorial criou o 1º hábito devido hoje — `needsCheckIn` (`rituals.ts`) só olha `lastCheckInDate`, e `handleCompleteOnboarding` grava `soulGoal`/`soulStruggle` mas **não** `lastCheckInDate` (grep no trecho: nada). | **LACUNA** (cartão) · **confirma WP1.3(b)**: o check-in D0 é o "Suggested Goal" do Strava competindo com o cartão |
| 3.2 | **monday.com** — item feito fica visível, riscado, com `✓`; `33%` em vez de `1/3` | Nada. | **LACUNA** → spec WP1.3 (feitos ficam, com `✓`); **não** usar percentual (ver 3.5) |
| 3.3 | **Peloton** — um CTA por vez; o próximo expandido, os outros fechados | Nada. | **LACUNA** → spec WP1.3 (só o gesto atual tem botão) |
| 3.4 | **Cleo** — 3 marcadores (feito/atual/futuro), futuro com opacidade reduzida; "You're on a roll" ANTES do trabalho | Nada. | **LACUNA** → spec WP1.3 (copy do pet afirma, não cobra) |
| 3.5 | **Shopify** — 6 itens iguais, `0 / 6`, oferta paga dentro do bloco (ANTI) | Não existe. `UnlockNudge` vive em `CreateModal`/`EditModal`/Evolução (CLAUDE.md) — não no D0. | **JÁ EVITA** — e o cartão do WP1.3 **nunca** carrega oferta |
| 3.6 | **Hatch** — `6 remaining to complete` (dívida) | Não existe. | **CONFLITA** com "encoraja, nunca cobra" — contar feitos, nunca restantes |
| 3.7 | **Turo** — seções; "One more step" | N/A — 3 gestos não precisam de seção. | **N/A** |
| 3.8 | **Preply** — o checklist **se transforma** em conteúdo (o passo atual carrega o objeto real) | Nada. Mas a peça que substitui o cartão já existe: o pet fala (`CompanionHUD.tsx`, `speak()`). | **LACUNA** → spec WP1.3: o cartão se dissolve **na fala do pet**, não some por flag |
| 3.9 | **Future Pro** — checklist morto com 3 `✓` + contagem regressiva `02D 19H` (ANTI) | Não existe cronômetro nenhum no D0. | **CONFLITA** — proibição: nada de urgência que a pessoa não controla (CLAUDE.md: "janela de DIAS, nunca de horas"; Rodada do Torneio) |
| 3.10 | Divergência home × tela dedicada; resolução = ficar na home e se dissolver | WP1.3 já escolhe a view `main`, acima da lista. | **JÁ DECIDIDO** no WP1.3 |

### Dossiê 4 — Priming de push

Estado do Soulmon, confirmado: `WelcomePromptModal.tsx`, passo `'notif'`: ícone `schedule`,
título "Ativar notificações?", texto "Lembretes das suas tarefas e recados do seu Soulmon.",
primário "Ativar" (`sm2Button('primary')`, largura total), secundário "Agora não"
(`sm2Button('quiet')`, largura total). Portão `notifPromptable = notificationsUnlocked &&
!notificationsEnabled && !notifPermission.denied`; `notificationsUnlocked={jaConcluiuAlgo}`
(`App.tsx`: `completedTasks.length > 0 || activityLog.length > 0 || activityStats…completionCount > 0`).
Dispensa grava `STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED` (`writeFlag … true`, **sem data**).
**As pushes reais são na voz do pet**: `functions/api/_pushCopy.js` — "`${name}` pensou em
você", "`${name}` passou pra dizer oi", "🌙 `${name}` está indo dormir".

| # | O que o app faz | O que o Soulmon faz hoje (grep) | Veredito |
|---|---|---|---|
| 4.1 | **Finch** — o pet pede; a prévia é uma **notificação dele** (`From Lee`); dois botões de peso igual; momento: depois de o pet existir | Remetente do priming = o app ("recados do seu Soulmon"), não o pet; **sem prévia**; secundário em voz baixa. A promessa **é verdadeira** (as pushes são do pet, `_pushCopy.js`) — mas o priming não a mostra. | **PARCIAL** → **muda WP1.5**: prévia construída a partir de `pushCopy` (mesma fonte, promessa não pode divergir) |
| 4.2 | **Atoms** — pedir no segundo em que a pessoa escreveu o hábito, com o hábito visível atrás | O Soulmon pede **depois** — na 1ª conclusão (`jaConcluiuAlgo`). É mais forte que o Atoms: não é "você escreveu", é "você fez". | **JÁ FAZ (melhor)** — não antecipar; linha vermelha |
| 4.3 | **Duolingo / Liven** — diálogo nativo desenhado com **seta para `Allow`**; pedido a 40% do onboarding | Não renderiza diálogo nativo (`checkNotificationPermission()` só lê o estado); pede depois de valor. | **JÁ EVITA** — ANTI: manipular a superfície neutra do SO |
| 4.4 | **The Outsiders** — "Not that you need them, but still"; "We won't spam you"; `Skip` e `Go For It` **iguais** | "Agora não" é `quiet` (o comentário do arquivo: "UMA ação dominante e 'Agora não' em voz baixa"). Sem frase de escopo/anti-spam. | **LIMÍTROFE** — decisão de produto: manter dominante+quiet (é o que 8/10 fazem) **e** acrescentar a frase de escopo (4.6) |
| 4.5 | **5 Minute Journal** — enumera as 3 categorias que vai mandar | "Lembretes das suas tarefas e recados do seu Soulmon" — enumera 2. | **JÁ FAZ (parcial)** — a enumeração deve **derivar de `_pushCopy.js`**, não ser texto à mão (a mesma regra dos números do `GuideModal`) |
| 4.6 | **Babbel** — "You can always turn them off in Settings" (piso do padrão) · **Tempo** — declara frequência e horário exatos; **mas** dispara o diálogo em cima do priming (ANTI de sequência) | Sem frase de reversibilidade. Horas são fixas em `_pushCopy.js` (`brtHour`). Sequência: `handleEnableNotif` só roda no toque — priming é lido **antes** do diálogo. | **LACUNA** (copy de reversibilidade + frequência) · **JÁ FAZ** (sequência) |
| 4.7 | **Yazio** — atrela a data da meta ao opt-in; sem recusa (ANTI) | Nada disso. | **CONFLITA** com "nada pune por inatividade" e "nenhum resultado depende de notificação" |
| 4.8 | **Buddy** — permissão pedida **como consequência** de o usuário ligar um toggle (padrão-ouro de momento) | `handleToggleNotifications` (`App.tsx`) via Configurações — já existe o caminho por ação do usuário. Ligar o lembrete de deitar (`sleepReminderAt`, `restWindow.ts`) como gatilho de permissão: **não verificado** se hoje pede. | **JÁ FAZ** (Settings) · a verificar (janela de descanso) — ver §3 |
| 4.9 | Convergência: prévia como card do sistema (7/10); `Maybe later` literal (4 apps) | Sem prévia; "Agora não" existe. | **LACUNA** (prévia) → WP1.5 |

---

## 2. Impacto nos meus WPs

### WP1.1 · Sprite no REVEAL — **o dossiê muda a spec**

O que muda (Finch 2.1, GoFundMe 2.2, Replika 1.6, Google Photos 2.4, Headway 1.5):

- O `REVEAL` tem **dois tempos naturais** — o texto do oráculo chega em milissegundos
  (local), o sprite em segundos (`/api/generate-sprite`). O estado "sprite pendente" é o
  único lugar onde a espera pode ser **atribuída à criatura** (Finch), porque ali ela já tem
  nome. Antes disso (no `GENERATING`) o corvo está certo e fica.
- A silhueta não é enfeite: é o **skeleton fiel à forma** (GoFundMe) e o fechamento
  gestáltico (Replika). Ela **tem** que ter a forma da arte que vai aparecer (a reserva de
  `getSpriteForStage`), senão é um orbe.
- Estimativa verbal de tempo, **só** no estado pendente. **Nunca** "pode sair estranho"
  (Google Photos) — output permanente.

**Texto novo da spec (substitui o item 2):**

> 2. `REVEAL` em dois tempos. **(a) Sprite pronto:** `<img>` com fade-in, acima do `<h1>`.
> **(b) Sprite pendente:** silhueta com a forma da arte de reserva (`getSpriteForStage(stage)`,
> `src/utils/sprites.ts`), pulsando, e a linha **"{baseName} está tomando forma… costuma
> levar uns segundos" / "{baseName} is taking shape… usually takes a few seconds"** — a
> espera é da criatura, não do servidor (Finch). Timeout de 20 s → mostra a reserva com
> "a arte definitiva chega em instantes" / "the final art is on its way". O botão
> `Nascer {baseName}` **nunca** espera o sprite. Não existe barra de progresso (não há
> etapa de servidor reportável — barra sem marco é promessa que trava). Não existe aviso
> de qualidade.

**Aceite (acrescentar):**
- Render test do estado pendente contém `baseName` no texto de espera (Finch) e um
  elemento com a forma da reserva (não um spinner genérico).
- `reveal_seen { has_sprite, funnel }` emitido **uma vez**; **`sprite_wait_ms`** (ou
  `reveal_sprite_timeout`) para o funil ler quanto a arte demora — depende de D1.
- `grep -c 'progress' ` no bloco REVEAL → 0 (sem barra determinada).
- Demo: o bloco `step === REGISTER` tem hoje **0 `<img>`** enquanto `DEMO_PICK` tem 2 —
  o item 3 da spec (mostrar o sprite escolhido no REGISTER) continua e ganha comando:
  `awk '/step === REGISTER/,/^        \)\}/' … \| grep -c '<img'` → ≥1.

### WP1.2 · Reveal cerimonial + "porquê" ecoado — **o dossiê muda a spec**

- **Achado que corrige a spec (c):** o que o REVEAL mostra é `creature.bio` =
  `richConceptPt` ("X da linhagem Y, marcado por algo Z") — **isso já é ORIGEM, não
  comportamento**. A frase de comportamento está em outro lugar: `stages[].description`
  (`oracle.ts`, `behaviorSentence` = `ROLE_INFO[role].profile + ALIGNMENT_INFO[align].profile`,
  ex.: "Perfil competitivo: combate corpo a corpo, direto e implacável."), exibida em
  `PetPage.tsx` (`L(atual.description)`, `L(form.description)`). O comentário do código
  defende que é "igual em toda a espécie" (o argumento do frogMak). **A régua do teste tem
  que apontar para `stages[].description`/`ROLE_INFO.profile`/`ALIGNMENT_INFO.profile`,
  não para `composeBio`** — que nem existe como símbolo (grep → só `bio:` e `const bio`).
- **Epíteto (Tolan 1.1):** a linha sob o nome só existe no caminho longo (`essence`). No
  caminho curto o nome fica sozinho. A spec ganha: **sempre** uma linha sob o nome —
  `essence` quando houver, senão a primeira oração de `richConcept` ("X da linhagem Y").
- **Ponte (Noom 1.2):** uma frase que prova que a leitura será usada.
- **Marcação (Lovi 1.3):** os termos derivados em cor de destaque.

**Texto novo da spec:**

> (a) sequência CSS de 2,5 s (silhueta → flash → arte) com `usePrefersReducedMotion`
> (**já existe** em `src/components/ui/Viewport.tsx` — não criar `src/utils/motion.ts`;
> `CompanionHUD.tsx` já o consome). (b) Sob o `<h1>`, **sempre** um epíteto: `essence`
> (caminho longo) ou a oração "{dominantClass} da linhagem {identity}" (caminho curto). (c)
> Na `bio`, os três termos derivados (`dominantClass`, `identity`, `secondaryFlavor`) em
> `var(--sm-accent)` — é o "isto veio das suas respostas" sem citar resposta nenhuma. (d)
> Se `soulGoal` não-vazio: "Você disse: “{soulGoal}”. {baseName} nasceu disso." (PT/EN).
> (e) Ponte, sempre: "A partir de hoje, cada tarefa que você fechar alimenta {baseName}." /
> "From today on, every task you finish feeds {baseName}." (f) Régua de origem-não-comportamento:
> teste em `oracle.ts` sobre `ROLE_INFO[*].profile` e `ALIGNMENT_INFO[*].profile` rejeitando
> a lista curta acordada de adjetivos de temperamento (a decidir com o dono — "implacável"
> é o caso-limite que motiva a lista); `creature.bio` já passa por construção.

**Aceite:** screenshot Playwright com e sem `soulGoal`, nos dois caminhos (com e sem
`essence`); `reduced-motion` pula; `grep -c "soulGoal" ` no bloco REVEAL ≥1; teste da régua
(f) verde.

### WP1.3 · Cartão D0 + check-in não dispara no D0 — **o dossiê muda a spec**

Confirmado por grep que (b) é necessário: o efeito do check-in só guarda
`hasCompletedOnboarding`/`hasCompletedTutorial`/`needsCheckIn`/plano não-vazio, e o
tutorial cria o 1º hábito — logo o check-in **entra em cima do recém-nascido** (é o
"Suggested Goal" do Strava competindo com o cartão, 3.1).

**Texto novo da spec (a):**

> `FirstDayCard.tsx` na view `main`, acima da lista. **Três gestos em ordem de
> dependência** (comida vem de concluir atividade): 1 marcar uma atividade → 2 dar comida →
> 3 carinho. **Um CTA por vez** (Peloton): só o gesto atual tem botão; os futuros com
> opacidade reduzida (Cleo); os feitos **ficam** com `✓` (monday). Contador **de feitos**
> (`1/3`), nunca de restantes (Hatch) e nunca percentual. Copy do pet **antes** do
> trabalho, afirmando ("Você já está comigo. Falta pouco.") — nunca "faltam 2". **Nenhuma
> oferta** dentro do cartão (Shopify) e **nenhum cronômetro** (Future Pro). Dispensável com
> um toque (Strava: toda tarefa dispensável ou satisfazível). **Como some (Preply):** ao
> fechar os 3, o cartão não desaparece por flag — ele **se dissolve na fala do pet**
> (`speak()` do `CompanionHUD`) e a lista sobe; no D1 some sem cerimônia. Flag
> `STORAGE_KEYS.FIRST_DAY_DONE` (nova, `storageKeys.ts`).

**Aceite (acrescentar):** render test com os 3 estados mostrando **exatamente um**
`<button>` de ação; contador exibe feitos; `grep -c 'UnlockNudge\|FULL_UNLOCK' src/components/FirstDayCard.tsx` → 0.

### WP1.4 · Templates do `soulGoal`/`soulStruggle` — **spec não muda; aceite ganha um item**

Nenhum dos 4 dossiês trata de sugestão de hábito. Mas o Noom (1.2) cria a obrigação: se o
REVEAL passa a **prometer** que a leitura será usada (ponte do WP1.2), o WP1.4 é quem
**cumpre** — no `TASK_STEP` do tutorial (o momento Atoms: a pessoa acabou de "escrever" o
porquê). Aceite novo: a categoria pré-selecionada é **atribuída na tela** ("porque você
disse: “…”"), em camada 1, sem rede — é o que fecha a dívida do `soulStruggle`.

### WP1.5 · Push em nome do pet no D2–D3 — **o dossiê muda a spec**

**Texto novo da spec:**

> No D2 ou D3 (`lastDayReport` existe e `daysAway === 0`), se `notificationsEnabled ===
> false`, permissão não negada e o dismiss tem > 24 h: uma fala do pet no HUD **com
> prévia** — um card no formato de notificação cujo título/corpo vêm de
> `pushCopy(hora, petName, language)` (`functions/api/_pushCopy.js`) — a promessa não pode
> divergir do que será enviado (Finch 4.1; o risco que o dossiê nomeia é exatamente
> "notificação que não soa como o personagem"). Abaixo: frase de escopo derivada das
> constantes de `_pushCopy.js` ("no máximo N por dia; nunca de madrugada") + "dá pra
> desligar nas Configurações" (Babbel/Tempo 4.6). Botão "Pode, {petName}" chama
> `handleToggleNotifications`; "Agora não" em `quiet`, largura total, sempre visível.
> **Uma vez só.** `NOTIFICATION_PROMPT_DISMISSED` passa a guardar **data** (hoje é
> `writeFlag(…, true)`, booleano) — necessário para o "> 24 h".

**Aceite (acrescentar):** teste de que a prévia é literalmente a string de `pushCopy` para
a hora corrente; nunca no D0/D1; nunca 2×; a primeira pedida (`WelcomePromptModal`)
**continua** sendo só depois de `jaConcluiuAlgo` — linha vermelha, teste travando.

---

## 3. Candidatos novos (SEM número — o consolidador numera)

### C-A · Cartão de nascimento reutilizável (Fi 1.10)
- **Lacuna:** o REVEAL é markup solto; `StatsPage.tsx` mostra "Começou por" sem imagem;
  nada do momento sobrevive como objeto.
- **Spec:** `src/components/BirthCard.tsx` — sprite (ou silhueta) + nome + epíteto +
  `soulGoal` (se houver) + data de nascimento no dia do jogador. **Sem número nenhum**
  (nem atributos, nem dias). Renderizado no REVEAL (WP1.1/1.2) e em `StatsPage` (ao lado
  de "Começou por"). Compartilhar é domínio de outro guarda (dossiê 12) — este WP só cria
  o container; não desenha share.
- **Aceite:** o mesmo componente importado nos dois lugares; snapshot com e sem sprite.
- **Verificação:** `grep -l 'BirthCard' src/components/SoulmonOnboarding.tsx src/components/StatsPage.tsx` → 2 arquivos; `grep -cE '[0-9]+ (dias|days)' src/components/BirthCard.tsx` → 0.

### C-B · Rascunho persistente do ritual (ABY 2.8/2.9)
- **Lacuna:** `answers`/`testAnswers`/`birthCity` só existem em estado React até
  `writeJson(SOULMON_PROFILE)` depois da geração. Fechar o app no item 15 de 20 perde 5
  minutos de investimento — o dossiê diz "ninguém reescreve 20 respostas".
- **Spec:** `STORAGE_KEYS.ORACLE_DRAFT` (nova) gravada a cada resposta com `{ step, answers,
  testAnswers, birthCity, refine }`; restaurada na montagem do `SoulmonOnboarding` (modo
  `onboarding`, não `upgrade`); apagada em `finish()`/`next()`. Uma linha ao restaurar:
  "Suas respostas ficaram guardadas." Sem rede. Não altera a bifurcação SEM VOLTA (o
  rascunho guarda `refine` como está).
- **Aceite:** teste: montar com rascunho → `step` e respostas restauradas; `finish` limpa.
- **Verificação:** `grep -c 'ORACLE_DRAFT' src/utils/storageKeys.ts src/components/SoulmonOnboarding.tsx` → ≥1 cada.

### C-C · Permissão como consequência de ligar um lembrete (Buddy 4.8) — **a verificar antes de virar WP**
- O momento-ouro do dossiê é "a pessoa ligou um toggle". O Soulmon tem `sleepReminderAt`
  (`restWindow.ts`) e a janela de descanso nas Configurações. **Não verifiquei** se ligar a
  janela pede permissão de push. Se não pede, é lacuna real de custo baixo: pedir ali, com
  a prévia de `pushCopy` das 22 h. Registro como candidato condicionado ao grep de quem
  o pegar (`grep -n 'sleepReminder' src/App.tsx src/components/Settings*.tsx`).

---

## 4. Anti-padrões dos meus dossiês, e a proibição que cada um viola

| Anti-padrão (app) | Proibição no Soulmon |
|---|---|
| **Paywall no clímax** (Replika 1.6) | Value moment é o 1º dia perfeito (guia C.3); a criatura nunca é refém do reveal. `UnlockNudge` só em `CreateModal`/`EditModal`/Evolução (CLAUDE.md) |
| **Consentimentos pré-marcados no reveal** (MyFitnessPal 1.9) | Consentimento em `CONSENT_STEP`, caixa própria fora do texto legal; push só depois de valor (`notificationsUnlocked={jaConcluiuAlgo}`) |
| **Encenar um resultado raso** (Headway 1.5 aplicado ao Soulmon) | É o estado atual: `GENERATING` + texto. WP1.1 é a saída; sem ele, o interstício é pedágio |
| **Ficha com números que podem cair** (Life Reset 1.4) | "Nenhum número exposto diminui" (brief §4); `perfectDays` só acumulam; C-A nasce sem número |
| **Aviso "results may be unexpected"** (Google Photos 2.4) | Output permanente e insubstituível — o aviso lê como "criatura ruim para sempre" |
| **Pedir follow durante a espera** (Any Distance 2.5) | Mesma regra do push: nada é pedido antes de o app ter entregue algo |
| **Barra determinada sem etapa real** (regra do Dossiê 2) | Não há marco de servidor no sprite; orbe + estimativa verbal, nunca arco travando |
| **Erro sem ação** (Mimo 2.8) | `doGenerate().catch` volta à bifurcação com retry e input preservado — manter |
| **`0 / 6` + oferta dentro do checklist** (Shopify 3.5) | Cartão D0 sem oferta; 3 gestos, um CTA por vez |
| **`6 remaining`** (Hatch 3.6) | "Encoraja, nunca cobra" — contar feitos |
| **Checklist morto + contagem regressiva** (Future Pro 3.9) | Nada de urgência que a pessoa não controla (Torneio: "janela de DIAS, nunca de horas"); o cartão se dissolve, não fica |
| **Seta apontando para `Allow`** (Duolingo/Liven 4.3) | O app não desenha o diálogo do SO; a recusa tem botão próprio, sempre visível |
| **Opt-in atrelado a resultado** (Yazio 4.7) | "Nada pune por inatividade"; nenhuma recompensa ou meta depende de notificação |
| **Diálogo nativo em cima do priming** (Tempo 4.6) | `handleEnableNotif` só no toque — o argumento é lido antes do pedido |
| **Pedir a 40% do onboarding** (Duolingo 4.3) | Linha vermelha: `jaConcluiuAlgo` primeiro. Se alguém antecipar, veto |

---

## 5. A fricção que eu mediria primeiro (depende de D1)

**A queda entre chegar ao REVEAL e apertar `Nascer {baseName}`**, por funil.

Por quê primeiro: é a única fricção do meu domínio que **já está instrumentada** —
`onboarding_step` é emitido a cada mudança de `step` (`SoulmonOnboarding.tsx`, `useEffect
… track('onboarding_step', { step: code, funnel })`, `onboardingStepCode`), então o par
(código do REVEAL → código do REGISTER) existe no `metrics.js` desde hoje; só falta D1 ler.
É exatamente o número que decide se o WP1.1 é o P0 que o plano diz: se quase ninguém
abandona no reveal, o problema é depois (D0); se muita gente some ali, texto sem criatura
custa usuários e a prioridade se confirma.

Segunda leitura, no mesmo evento: a divisão em `REFINE_OFFER` (quantos escolhem os 20
itens) e a queda **dentro** do bloco `DEEP` — se o abandono está no item 12 de 20, o C-B
(rascunho persistente) sobe de candidato a WP.

O que **não** dá para medir hoje e o WP1.1 deve emitir: `reveal_seen { has_sprite }` e
`sprite_wait_ms` — sem isso não se sabe se o sprite chega a tempo de ser visto.

## 6. Dívida `soulStruggle` — estado

Continua **coletado e nunca lido**: `grep -rn soulStruggle src` fora de
`SoulmonOnboarding`/`GameStateContext`/`App.tsx`/testes → só o comentário de
`telemetry.ts` (que o exclui da telemetria) e `functions/api/_redact.js` (que o mantém fora
da IA). Nenhum dos 4 dossiês dá padrão para ele — é insumo de sugestão (WP1.4) e de fala
(WP2.5), não de reveal nem de push. WP1.2 ecoa **só** `soulGoal` no reveal de propósito: o
"porquê" é celebração; a "dificuldade" ecoada no clímax viraria cobrança no dia do
nascimento. Registrado.
