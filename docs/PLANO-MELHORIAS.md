# Plano de Melhorias do Soulmon — completo, sequenciado e ancorado no código

> **O que este documento é.** O plano de execução que sai de tudo que foi
> levantado: os 7 relatórios de pesquisa, os 84 vídeos verificados, as 16
> transcrições lidas via NotebookLM (`docs/guia-experiencia/08-*.md`), a seção I
> do `GUIA-EXPERIENCIA.md` **e seis mapeamentos do código real** feitos para
> este plano (anexos em `docs/plano-melhorias/`). Cada pacote de trabalho cita
> **arquivo + símbolo verificado** — quando algo não foi encontrado no código, o
> plano diz "NÃO ENCONTRADO" em vez de supor.
>
> **O que ele não é.** Não é mais uma rodada de pesquisa, e não muda regra de
> jogo por conta própria: toda mudança de regra fica atrás de uma decisão do
> dono (seção 7), com a evidência ao lado.
>
> **Hierarquia de autoridade:** `CLAUDE.md` > `PLANO-EVOLUCAO.md` > este plano
> > `GUIA-EXPERIENCIA.md` > relatórios. Onde este plano **corrige** o guia, diz
> isso explicitamente (seção 1.2).

Legenda de esforço: **PP** ≤ 2h · **P** ≤ ½ dia · **M** 1–2 dias · **G** 3–5
dias · **GG** > 1 semana. "Requer APK" = mexe em `android/`, precisa de build.

---

## 0. A tese, e a régua de toda decisão

O Soulmon é **um avatar que evolui COM o usuário e o encoraja — nunca um
cobrador**. Isso continua sendo o diferencial e continua defendido por teste
(streak que zera, humor como score, punição por sono: todos proibidos).

A rodada de transcrições acrescentou uma régua que não existia, e ela vale
para **toda** mecânica nova deste plano (I.1.3 do guia):

> *"Isto faz a pessoa querer fazer a tarefa, ou querer a notificação?"*

Mecânica que só responde a segunda metade não entra — é a configuração que a
literatura de motivação intrínseca aponta como a que corrói (Errant Signal,
Extra Credits, via transcrição). E a segunda régua, do PM de retenção do
Duolingo: **perdoar tem limite** — passado certo ponto, a mecânica deixa de
significar cuidado e passa a significar que nada importa (I.1.2). O Soulmon
empilhou oito mecanismos de perdão sem nunca decidir onde é a sua linha. Este
plano não decide por você; ele coloca a pergunta na seção 7 e evita acrescentar
um nono perdão sem resposta.

---

## 1. Diagnóstico consolidado — o que o código diz que os relatórios não sabiam

### 1.1 As doze verdades do código que mudam prioridade

Cada uma vem de um anexo (A–F) com arquivo e símbolo.

| # | Verdade | Onde | Consequência no plano |
|---|---|---|---|
| 1 | **Telemetria EXISTE e está ligada** — 10 eventos, allowlist, opt-out, política publicada. O que falta é `METRICS_ADMIN_KEY` (GET responde 404) e retenção por coorte, impossível **por desenho declarado** | `src/utils/telemetry.ts`, `functions/api/metrics.js` (anexo E) | O P0 #1 do guia ("instrumentar ~20 eventos") estava **errado**. Vira: ligar a leitura + reabrir com o dono a decisão da coorte (WP0.1, WP0.2) |
| 2 | **O REVEAL não tem `<img>` nenhuma.** O sprite só começa a ser gerado em ocioso **depois** de o app montar (`useSpriteGeneration` só é montado em `App.tsx:644`) | `SoulmonOnboarding.tsx:1114-1158`, `App.tsx:668-676` (anexo A) | Confirma o P0 #2 do guia e diz exatamente onde ligar (WP1.1) |
| 3 | **`soulStruggle` é coletado e NUNCA lido** em tela nenhuma. `soulGoal` é lido em 2 lugares; nenhum dos dois entra no chat | anexo A §3, anexo C §2 | O "porquê" do usuário é o insumo mais barato de vínculo e está desperdiçado (WP1.4, WP2.5, WP3.1) |
| 4 | **`daysToEvolve` é dado morto** — o gate real é `.required`: 4/5/5/6 dias perfeitos por estágio, não 10/20/30/40. Mega em **14 dias perfeitos**; depois, nada | `progression.ts` vs `App.tsx:2207-2208` (anexo F §4) | O conteúdo de progressão declarado é ~3× maior que o real. É a raiz do eixo D30–D90 fraco (WP4.1) |
| 5 | **Ultra só é alcançável DEGENERANDO de propósito** (exige os 3 megas; mega→mega não existe; único caminho de volta é HP=0) | `dailyReset.ts:86-96,664` (anexo F §4) | Contradiz a tese anti-punição: o jogo exige perder para progredir, e não explica. É bug de desenho (WP4.2) |
| 6 | **`bondRewardFor` devolve `null` do nível 14 em diante**, e 9 das 12 recompensas são itens que a loja já vende | `bond.ts:355` (anexo F §6) | O único sistema de curva infinita para de recompensar em D25–D35 (WP4.3) |
| 7 | **`SEASONS` termina em 2027-02-27** e `currentSeason()` passa a devolver `null` | `seasons.ts:97` (anexo F §5) | 12 sonhos + 4 medalhas têm prazo de validade codificado (WP4.4) |
| 8 | **O catálogo de Bits esgota entre D15 e D23** (53 itens permanentes = 8.540 Bits; ~360–470/dia) | `shop.ts`, contas no anexo F §1 | Depois disso masmorra e minijogos são "pontos de ruído" (Freedom Fallacy, via transcrição) (WP4.5) |
| 9 | **O chat do pet tem memória ZERO** (2 mensagens por chamada) e o prompt não recebe HP, Vínculo, `soulGoal`, humor, tarefas nem ausência | `functions/api/chat.js` (anexo C §2) | O canal de vínculo mais potente é o mais raso (WP3.1) |
| 10 | **Push: sem win-back, sem dedup PWA×APK** (chaves `push:hash(endpoint)` e `fcm:hash(token)`, sem `saveId`), e a copy é **duplicada** no cliente (`NotificationManager.tsx` não importa `_pushCopy.js` — footgun 9). Mas `refreshedAt` já existe na inscrição | anexo C §1; `subscribe.js:87-94` | Win-back é possível sem tocar no save (WP3.4) |
| 11 | **Mudar `REST_SHIELD_MAX` 3→2 não quebra nenhum teste** (tudo derivado), mas a hidratação não clampa saves com `shields:3` | `taskModel.ts`, `GameStateContext.tsx:653` (anexo B §1) | O experimento I.1.1 é barato; precisa de clamp (WP2.1) |
| 12 | **`setObfuscatedAccountId(saveId)` NÃO EXISTE** no `BillingPlugin.kt` nem em `playBilling.ts` — a trava anti-clonagem de conta paga não pode ser ligada | anexo D §5 | É integridade de receita, não feature: entra na onda 0 (WP0.6) |

Mais quatro menores, todos com símbolo: o `HabitRhythm.shielded[]` **já existe** (prestígio "sem escudo gasto" é computável hoje, anexo B §2); **não há animação nem háptico** no marco de hábito (só `playEvolve` + toast; `@capacitor/haptics` não instalado, anexo B §4); o HUD **não fala** ao concluir tarefa, ao esfregar, ao dar banho, nem olha a tarefa assombrada (o `CLAUDE.md` diz "o pet olha" — NÃO ENCONTRADO, anexo C §3); e `bondTitle` **não aparece** sob o nome do pet apesar do comentário em `BOND_REWARDS` dizer que aparece (anexo C §4).

### 1.2 Correções ao `GUIA-EXPERIENCIA.md` e ao `CLAUDE.md`

| Onde | Dizia | Verdade | Ação |
|---|---|---|---|
| Guia E, P0 #1 | "Instrumentar os ~20 eventos de telemetria" | 10 eventos já existem; falta leitura e coorte | Reescrito como WP0.1/WP0.2 |
| Guia F | plano de telemetria como se fosse do zero | `EVENT_SCHEMA` duplicado em 2 arquivos com paridade testada | Eventos novos entram nos DOIS (WP0.5) |
| Guia E, P0 #14 | "1ª evolução alcançável em ≤5 dias (auditar)" | Já é 4 dias perfeitos. O problema é o **oposto**: a árvore inteira acaba em 14 | Substituído por WP4.1 |
| `CLAUDE.md` 👻 Assombrada | "o pet olha" | NÃO ENCONTRADO no `CompanionHUD.tsx` | WP3.2 implementa; até lá, corrigir a linha |
| `bond.ts` comentário de `BOND_REWARDS` | título "aparece na home, sob o nome do pet" | Só em `StatsPage` e `TournamentPage` | WP3.3 |
| `public/privacidade.html:111` | "sete eventos" | São dez | WP0.3 |
| `progression.ts` `daysToEvolve` | valores 10/20/30/40 | nunca lidos em produção | WP4.1 (decisão) |

---

## 2. Metas e como medir — com a telemetria que existe

**Métrica-farol (já instrumentada):** `week_active` — `goal_days` (dias em que
bateu o próprio `dailyGoalFor`) e `active_days`, fechados no aparelho. É a
única métrica que mede a promessa, não o vício.

**O que dá para ler hoje** (depois de WP0.1): funil do onboarding por passo e
por caminho demo/pago (`onboarding_step`), `first_task_done`, `demo_cap_hit`
por caminho, `unlock_view`, `purchase`, `activity_create`, `day_active` com
esforço, `week_active`.

**O que NÃO dá, e depende de decisão** (WP0.2): D1/D7/D30 e qualquer conversão
em N dias.

Metas por onda, todas legíveis com o que existe ou com WP0.2 aprovado:

| Onda | Meta | Como ler |
|---|---|---|
| 1 — Primeira sessão | ≥ 70% dos que chegam ao `REVEAL` veem o sprite (`reveal_seen.has_sprite=1`); `first_task_done` no D0 sobe | `onboarding_step` + evento novo `reveal_seen` |
| 2 — Constância | `goal_days` mediano ≥ 4/7 entre ativos; `shield_used` cai após WP2.1 sem `welcome_back` subir | `week_active`, eventos novos |
| 3 — Presença | `welcome_back` bucket 5–14 dias cai (win-back funciona); `checkin_commit` ≥ 80% dos check-ins | eventos novos |
| 4 — Conteúdo | `week_active` de quem tem `tier=paid` não cai após D30 | `week_active` por tier (já existe) |
| 5 — Monetização | `unlock_view` reason=report → `purchase` | eventos existentes + reason novo |

Regras de leitura, via transcrição (I.4): **medianas, não médias**; nenhum
experimento de monetização julgado antes de **30 dias**; tamanho de amostra em
todo gráfico; eixo Y no zero; e com menos de ~1k usuários, A/B é teatro —
telemetria descritiva + 5 entrevistas moderadas primeiro.

---

## 3. Onda 0 — Ver o que já existe e fechar as verdades (1 sprint, quase tudo P)

Objetivo: **antes de construir, conseguir ler o número e corrigir o que o código
sabe e os documentos não.** Nada aqui muda regra de jogo.

### WP0.1 · Ligar a leitura da telemetria — P · depende do dono (segredo)
- **Evidência:** anexo E; `metrics.js:470` (`onRequestGet` responde 404 sem `env.METRICS_ADMIN_KEY`, de propósito).
- **Do dono:** definir `METRICS_ADMIN_KEY` no projeto Pages.
- **Código:** `tools/metrics-read.mjs` (novo, no repo `Core` ou em `tools/` aqui): `GET /api/metrics?days=92` com header `X-Metrics-Key`, imprime funil `onboarding_step` por `funnel` (demo/pago) e por passo, `first_task_done`, `demo_cap_hit` por `path`, `unlock_view`/`purchase` por `tier`, `week_active` (mediana de `goal_days`).
- **Aceite:** o dono roda um comando e vê o funil do onboarding com número por passo. Até isso existir, **todo o resto do plano é hipótese** — é por isso que é o primeiro.

### WP0.2 · Retenção D1/D7/D30 sem trair a privacidade — M · **decisão do dono (reabrir)**
- **Evidência:** `metrics.js` cabeçalho: coorte é "trade-off do dono… ninguém deve implementá-lo por cima deste desenho sem que ele reabra o assunto". Precedente para fazer certo: `WeekLedger` (`telemetry.ts:698-707`) fecha a conta no aparelho e manda só o resultado.
- **Proposta (o que o dono aprova ou recusa):** chave local `soulmon-telemetry-install` (dia de instalação, **nunca enviado**); na **abertura** do app, se o dia atual cruzou D1/D7/D30 desde a instalação e o bucket ainda não foi emitido (`K_SEEN`), emitir `retained { bucket: 0|1|2, tier }` — um inteiro, sem data. O servidor agrega por dia como sempre. Leitura: `retained[bucket=1]` na semana W+1 ÷ `install` na semana W ≈ D7. É aproximado e **declarado como aproximado** no GET (`notes`).
- **Por que na abertura e não no fechamento:** o próprio `telemetry.ts:690-695` avisa que o `WeekLedger` só despacha no dia seguinte, então quem abandona nunca despacha — viés aceitável para o north star e **inaceitável para retenção**.
- **Arquivos:** `telemetry.ts` (`EVENT_SCHEMA`, nova função `trackRetentionOnOpen(now)`, chamada onde `track('install')` já é chamado em `App.tsx:1033`), `metrics.js` (`EVENT_SCHEMA` espelhado), `telemetry.test.ts` (paridade + "nunca envia a data"), `public/privacidade.html` (linha nova na tabela).
- **Aceite:** teste que prova que o corpo do lote nunca contém a chave de instalação; GET devolve `retained` por bucket.

### WP0.3 · Política de privacidade: "sete" → dez, com teste — PP
- `public/privacidade.html:111`. Teste novo em `telemetry.test.ts`: para cada chave de `EVENT_SCHEMA`, o HTML contém o nome do evento (a tabela não pode ficar para trás de novo).

### WP0.4 · Corrigir os documentos que mentem sobre o código — P
- `CLAUDE.md` 👻 Assombrada ("o pet olha" → "o pet **ainda não** olha; ver WP3.2"); comentário de `BOND_REWARDS` em `bond.ts`; `GUIA-EXPERIENCIA.md` E #1 e #14 (apontar para este plano); `docs/STATUS.md`.
- `progression.ts`: comentário em `FORM_REQUIREMENTS` declarando que `daysToEvolve` **não é lido em produção** até a decisão de WP4.1 — ou a linha some junto com o teste que a documenta (`progression.test.ts:64-67`).

### WP0.5 · Eventos novos que o plano precisa (schema, sem UI ainda) — P
Todos inteiros/enum, nos **dois** `EVENT_SCHEMA` + `privacidade.html` + paridade:
`reveal_seen { has_sprite 0..1, funnel }` · `checkin_commit { focus_count 0..3 }` · `milestone { tier 1..3 }` · `shield_used` · `welcome_back { days 0..3 }` (bucket: 2–4 / 5–7 / 8–14 / 15+) · `evolve { level 1..4 }` · `dungeon_run { floors 1..5 }` · `bond_level { level 1..30 }` · `unlock_view.reason` passa a 0..2 (novo valor `report`).
- **Aceite:** `npx vitest run src/utils/telemetry.test.ts functions/api/metrics.test.js` verde; nenhum evento carrega string.

### WP0.6 · `setObfuscatedAccountId(saveId)` no Play Billing — P · **requer APK**
- **Evidência:** anexo D §5 — NÃO ENCONTRADO em `BillingPlugin.kt` nem em `src/utils/playBilling.ts`; `docs/BILLING-SETUP.md` e `isPlayPurchaseBoundTo` (`_billing.js`) dependem dele.
- **Código:** `playBilling.ts` `purchase(sku, saveId)` → plugin `BillingPlugin.kt` monta `BillingFlowParams.Builder().setObfuscatedAccountId(saveId)`; teste de contrato em `billing.play.test.js` cobrindo o caminho `PLAY_REQUIRE_ACCOUNT_BINDING='true'`.
- **Do dono, depois:** ligar `PLAY_REQUIRE_ACCOUNT_BINDING=true` **só depois** do APK com isso publicado (senão recusa toda compra — `STATUS.md` §3.2).

### WP0.7 · Medir o tamanho do save — PP
Nunca medido (anexo E §4). Um teste que serializa um `GameState` de 90 dias sintéticos e imprime bytes; regista no `STATUS.md`. Decide se WP3.1 pode carregar contexto e se `bestiary[]` (WP4.6) cabe.

---

## 4. Onda 1 — A primeira sessão (o reveal que revela + D0)

Objetivo: **a pessoa vê a criatura que veio dela, entende o que fazer em 1
minuto, e sai do D0 com uma tarefa feita.** É onde o retorno por hora de
trabalho é maior (guia A.3), e onde os vídeos mais concordam.

### WP1.1 · Sprite no REVEAL — M
- **Evidência:** anexo A §1: `REVEAL` renderiza nome + essência + bio, sem imagem; `birthBatch` (`spriteTrigger.ts:123`) só roda via `useSpriteGeneration` montado em `App.tsx:644`; comentário `App.tsx:670-675` (F-1) registra que quem paga "chegava ao reveal vendo a MESMA arte de reserva do demo".
- **Spec:**
  1. No step `GENERATING` do caminho oracle (não demo — `App.tsx:668` já impede demo de gerar), disparar `requestSprite` (`spriteGen.ts:155`) para a forma `rookie` **em paralelo** com a geração do oráculo, marcando na `spriteLibrary` que a tentativa já foi feita (senão `birthBatch` refaz — `generate-sprite.dedupe.test.js` cobre o servidor, o cliente precisa do mesmo cuidado).
  2. `REVEAL`: se o sprite chegou, `<img>` com fade-in; se não, **silhueta animada** da arte de reserva (`legacySpriteForStage`/arte nossa) com "revelando…"; timeout de 20s → mostra a reserva com uma linha honesta ("a arte definitiva chega em instantes") — nunca trava a pessoa no reveal.
  3. Demo: no `REGISTER` após `DEMO_PICK`, mostrar o sprite do `PREMADE_CHARACTERS` escolhido (já existe arte).
  4. Emitir `reveal_seen { has_sprite }`.
- **Arquivos:** `SoulmonOnboarding.tsx` (bloco `step === REVEAL` :1114-1158, `doGenerate`), `spriteGen.ts`, `spriteLibrary.ts` (`recordSprite`/`hasSprite`), `useSpriteGeneration.ts:221` (não re-pedir rookie), `index.css` (keyframe da silhueta — footgun 1: só lá).
- **Aceite:** teste de render do reveal com sprite pronto e com sprite pendente; `reveal_seen` emitido uma vez; `SPRITE_FORM_ATTEMPT_CAP` respeitado (não gasta tentativa extra).
- **Risco:** custo de IA no onboarding. O caminho oracle já é pago (`requirePaidTier`), então o COGS está coberto pelo unlock.

### WP1.2 · Reveal cerimonial: silhueta → flash → criatura, e o "porquê" ecoado — M
- **Evidência:** rel. 05 (7 fricções), rel. 01 (Emotional Integration como etapa própria), transcrição B4 (frogMak: a criatura precisa ser **espécie**, não personagem — descrição fechada impede projetar a própria história) e I.3.4.
- **Spec:** (a) sequência CSS de 2,5s antes do sprite (silhueta escura → flash → arte), com `prefers-reduced-motion` respeitado (`CompanionHUD.tsx` já tem `reducedMotion` local; extrair para `src/utils/motion.ts`); (b) linha sob o nome: se `soulGoal` não-vazio, `"Você disse: “{soulGoal}”. {baseName} nasceu disso."` (PT/EN) — é o commitment & consistency do rel. 05 e o que prova que a criatura veio da pessoa (I.1.2); (c) **calibrar a bio** em `oracle.ts`: dizer **de onde** a criatura veio (a leitura), não **como** se comporta — passar `composeBio` por essa régua com um teste que rejeita verbos de personalidade fechada na lista curta acordada.
- **Aceite:** screenshot Playwright do reveal com e sem `soulGoal`; `reduced-motion` pula a sequência.

### WP1.3 · D0 guiado: cartão de três gestos, e o check-in não dispara no D0 — M
- **Evidência:** anexo A §4: `GameTutorialFlow.tsx` tem **uma** página de conceito + criação obrigatória de ≥1 atividade; **NÃO EXISTE** checklist D0; a fila de intersticiais `triage → dailyReport → checkIn → …` (`App.tsx:1290-1296`) pode disparar o check-in em cima de quem acabou de nascer.
- **Spec:** (a) `FirstDayCard.tsx` (novo) na view `main`, acima da lista, com 3 gestos e estado: **carinho** (`onPet` já existe), **marcar 1 atividade** (`first_task_done` já existe), **dar comida** (energia sobe); some sozinho quando os 3 fecham ou no D1; flag `STORAGE_KEYS.FIRST_DAY_DONE` (nova, em `storageKeys.ts`). (b) `handleCompleteOnboarding` (`App.tsx:3440/3483`) grava `lastCheckInDate = playerDayKey(now)` para que `needsCheckIn` (`rituals.ts`) seja falso no D0. (c) `FirstTaskCompletedPopup` continua; o cartão só complementa.
- **Aceite:** teste do `needsCheckIn` no dia da criação = false; render test do cartão com os 3 estados; `first_task_done` no D0 sobe (leitura WP0.1).

### WP1.4 · Templates de hábito a partir do `soulGoal`/`soulStruggle` — M · **decisão do dono na metade IA**
- **Evidência:** anexo A §3: `soulStruggle` NUNCA é lido; `taskSuggestions.ts` já tem IA (`/api/suggest-tasks`) e `FALLBACK_BY_CATEGORY`; `_redact.js:15` afirma que `soulGoal`/`soulStruggle` **não passam** por rotas de IA hoje — isso é uma linha de privacidade, não um esquecimento.
- **Spec em duas camadas:** (1) **local, sem rede** — mapa de palavras-chave → categoria (`src/utils/goalToCategory.ts`, novo, testado: "dormir/sono" → Health/rest, "estudar/prova" → Study, "academia/correr" → Fitness…) que pré-seleciona a categoria e ordena o `FALLBACK_BY_CATEGORY` no `GameTutorialFlow`; (2) **IA, só com decisão do dono** — enviar o texto a `/api/suggest-tasks` sob as mesmas regras de `_redact.js` e com o consentimento específico dito na tela. Sem a decisão, fica só a camada 1.
- **Aceite:** teste do mapa com 20 frases PT/EN; nenhuma chamada de rede na camada 1.

### WP1.5 · Pedido de push em nome do pet no D2–D3 — P
- **Evidência:** anexo A §2: permissão só depois da 1ª conclusão real, via `WelcomePromptModal`, e `NOTIFICATION_PROMPT_DISMISSED` já existe — o desenho está certo (rel. 05: permission priming contextual). O que falta é o **segundo** convite, contextual, para quem dispensou.
- **Spec:** no D2 ou D3 (`lastDayReport` existe e `daysAway === 0`), se `notificationsEnabled === false` e o dismiss tem > 24h, uma fala do pet no HUD ("posso te lembrar de mim amanhã?") com botão que chama `handleToggleNotifications` (`App.tsx:3522`). Uma vez só; guarda em `NOTIFICATION_PROMPT_DISMISSED` com data.
- **Aceite:** nunca aparece no D0/D1; nunca duas vezes.

---

## 5. Onda 2 — Constância e rituais (o "streak" sem punição, com significado)

Objetivo: **capturar os três mecanismos do streak que são de graça (número que
cresce, prestígio, presença) sem importar o quarto (medo de perder)** — e
responder à evidência do Duolingo sobre o teto de escudos.

### WP2.1 · Experimento `REST_SHIELD_MAX` 3 → 2 — P · **decisão do dono** · gate: WP0.1
- **Evidência:** transcrição A1 (Shuttleworth): "three streak freezes was actually no better than two… we were training them to take more time off". Anexo B §1: **nenhum teste quebra** (todos derivam da constante); UI já derivada (`GuideModal.tsx:150-151`, `HelpModal.tsx:99-100`, `HabitConstancy.tsx:141`).
- **Por que é experimento e não correção:** o escudo do Soulmon é **ganho por constância e gasto sozinho** (`earnShield`/`applyMissedDay`), não comprado e ativado como no Duolingo — não é a mesma peça.
- **Spec:** `taskModel.ts` `REST_SHIELD_MAX = 2`; **clamp na hidratação** (`GameStateContext.tsx:653` hoje só faz `Math.max(0, floor)`) e em `earnShield` (já barra ≥ MAX); teste novo: save com `shields: 3` hidrata para 2. `GuideModal`/`HelpModal` seguem. Emitir `shield_used` (WP0.5).
- **Aceite / leitura:** 4 semanas antes e depois: `shield_used` por `day_active` e `welcome_back` bucket 5–7. Se `welcome_back` subir, reverter — é uma constante.

### WP2.2 · Prestígio "sem escudo gasto" (modelo Perfect Streak) — M
- **Evidência:** transcrição A2: Perfect Streak é **puramente estético** (calendário dourado, sem recompensa material) e é a resposta direta ao dilema de I.1.2. Anexo B §2: `HabitRhythm.shielded[]` **já existe** — só `constancy`, `consecutiveMisses` e o ponto dourado de `HabitConstancy.tsx:87,107,149` leem.
- **Spec:** `habitRhythm.ts` `pureWindow(rhythm, now, windowDays = 28): boolean` = nenhum `shielded` nem `missed` nos últimos 28 dias **devidos** (mesmo denominador de `constancy`). UI: aura dourada no ícone do hábito em `HabitConstancy.tsx` e no tier da lista; **estado, não número** — aparece e some; ao usar escudo a aura some **em silêncio** (nenhum texto de perda). Nunca bloqueia o escudo.
- **Aceite:** teste "usar escudo nunca altera `shields`/`constancy` por causa da aura"; teste "aura some sem evento de fala/toast".

### WP2.3 · Botão do check-in vira compromisso ativo — PP
- **Evidência:** transcrição A2: trocar "Continue" por "Commit To My Goal" rendeu ao Duolingo > 10.000 DAU só no texto; anexo B §3: `MorningCheckIn.tsx:408` é `'Começar o dia' / 'Start the day'`.
- **Spec:** PT `'Assumir minha meta de hoje'` · EN `'Commit to today's goal'`; o secundário (`:411`) fica. Emitir `checkin_commit { focus_count }` em `handleCheckInConfirm` (`App.tsx`). Quando `plannedEffort` for zero, o texto vira `'Começar o dia'` (não há meta para assumir).
- **Aceite:** render test dos dois textos; evento emitido só no confirm.

### WP2.4 · Celebração de marco que INTERROMPE o fluxo — M
- **Evidência:** transcrição A2/B5: háptico + animação rica para o usuário **pausar e saborear**, complexidade reservada aos marcos; anexo B §4: hoje é `playEvolve()` + `toast.success` + trigger de fala — sem animação, sem háptico; `navigator.vibrate` já é usado em 6 componentes (não precisa de dependência nova).
- **Spec:** `MilestoneCeremony.tsx` (novo): overlay de 2,5s com sprite atual, ícone do tier (`HABIT_TIER_ICONS`) e `MILESTONE_TEXT` (`App.tsx:534-538`); `navigator.vibrate([30, 40, 60])` quando disponível; respeita `reduced-motion` (cai para o toast atual). Ligado em `celebrateHabitMilestone` (`App.tsx:1463-1471`). Emitir `milestone { tier }`.
- **Aceite:** nunca aparece durante `busy` (virada/relatório — `App.tsx:665`); uma vez por marco (`milestoneReached` já garante).

### WP2.5 · Never-miss-twice usa o `soulStruggle` — P
- **Evidência:** anexo A §3 (`soulStruggle` nunca lido); `CLAUDE.md` 🚫 (`needsIntervention` em `MISS_INTERVENTION_AT = 2` oferece versão reduzida).
- **Spec:** onde a intervenção é montada (consumidor de `needsIntervention` no `App.tsx`/modal), se `soulStruggle` não-vazio: `"Você me contou que {soulStruggle} costuma atrapalhar. Hoje, só 5 minutos?"` — local, sem IA, sem culpa. Teste de que a frase nunca contém "deveria"/"falhou".

### WP2.6 · Widget = janela do pet — G · **requer APK**
- **Evidência:** rel. 03/07 (widget "tão eficaz quanto push", Finch/Duolingo); anexo B §6: o widget recebe só `completed_tasks/total_tasks/hp/…` — **nenhum dado de hábito**; chaves do bridge são congeladas (só **acrescentar**).
- **Spec:** `DigiWidgetPlugin.ts`/`.kt` ganham chaves **novas**: `constancy_pct` (média de `constancy` dos hábitos devidos, inteiro), `shields`, `habit_tier_max` (0–3), `needs_intervention` (bool), `bond_level`. `WidgetRenderer.kt` `renderFull`: `contextualMessage` passa a escolher a frase por esses campos (ex.: `needs_intervention` → "hoje só 5 minutos?"; `constancy_pct ≥ 71` → aura). Sem número de streak; sem "%" cru na tela (I.2, rel. 03).
- **Aceite:** widget de APK antigo continua renderizando (chaves antigas intactas); teste de `contextualMessage` em Kotlin (ou tabela de decisão testada em TS e espelhada).

### WP2.7 · Reencontro por DIAS, não por minutos — P
- **Evidência:** anexo C §3: a saudação do HUD usa limiar fixo de 10 min e o mesmo texto para 11 min e 3 semanas; anexo B §5: `lastDayReport.welcomeBack` e `daysAway` já existem.
- **Spec:** `CompanionHUD` recebe prop `daysAway` (de `gameState.lastDayReport`); em `saudar()`, se `daysAway ≥ ABSENCE_FORGIVENESS_DAYS`, fala dedicada por bucket ("Você voltou! Guardei tudo como estava." / "Senti saudade esses dias. Sem pressa."); emite `welcome_back { days }`. `DailyReportModal` modo acolhida (`:45-100`) ganha a mesma copy por bucket.
- **Aceite:** teste das 4 faixas; nenhuma frase menciona o que "ficou por fazer".

---

## 6. Onda 3 — Presença e voz (o pet que lembra, fala e chama de volta)

Objetivo: **o canal de vínculo mais potente (o chat) deixa de ser o mais raso;
os momentos mudos ganham voz; a push para de duplicar e passa a chamar quem
sumiu.**

### WP3.1 · Memória curta e contexto no chat — M · **uma decisão do dono** (texto do `soulGoal`)
- **Evidência:** anexo C §2: `messages = [system, user]`, sem histórico; o prompt de sistema não recebe HP, Vínculo, `soulGoal`, humor, tarefas nem ausência (HP só entra como texto no toque). Rel. 02/04: memória é o maior ganho de vínculo por custo.
- **Spec:**
  1. **Contexto numérico/enum, allowlisted** — o cliente manda `context: { hp: 0..4, energy: 0..4, bond: 1..30, daysAway: 0..3, perfectStreakBucket: 0..3, lastCategory: enum, moodToday: enum|null }`; `chat.js` valida com allowlist (mesmo padrão de `metrics.js`: prop desconhecida → ignora o bloco inteiro) e injeta um bloco `CONTEXT` no `buildSystemPrompt`. **Humor entra como insumo de FALA, nunca de pontuação** (decisão C.3 do guia; o teste que exige virada idêntica com e sem humor continua).
  2. **Memória de sessão** — o `ChatModal`/HUD guarda as últimas 3 trocas **em memória** (não no save, não em KV) e as envia como `messages`; `max_tokens` fica 120.
  3. **`soulGoal` em texto:** só com decisão do dono, porque `_redact.js:15` hoje garante que ele não passa por IA. Sem a decisão, entra como `goalCategory` (enum derivado localmente por WP1.4).
- **Arquivos:** `chat.js` (`buildSystemPrompt`, `onRequestPost`), `CompanionHUD.tsx` (`handlePetClick`, idle), `ChatModal.tsx`, `chat.promptInjection.test.js` (cobrir o bloco `CONTEXT` com valores fora da faixa).
- **Aceite:** teste do servidor rejeitando `context` com string; teste do cliente provando que `context` nunca contém texto de tarefa; latência não sobe (2 mensagens → ≤ 8).

### WP3.2 · Voz nos momentos mudos — M
- **Evidência:** anexo C §3: concluir tarefa, esfregar, banho e tarefa assombrada **não geram fala**; o `CLAUDE.md` promete "o pet olha" a assombrada e isso NÃO EXISTE.
- **Spec:** prop `speakSignal: { n, kind: 'task'|'haunted'|'rub'|'shower'|'milestone' }` no `CompanionHUD` (padrão já usado por `feedAnim`/`fullSignal`/`healCapSignal`); tabelas de 3 frases PT/EN por kind, **sem culpa** (a assombrada concluída é alívio: "Aquela que estava te olhando… foi. Respira."); `rub` fala **uma vez por sessão**; `haunted`: o sprite vira o olhar (classe CSS em `index.css`) enquanto houver `isHaunted` na lista — é o "olha" prometido. Fala continua por `speak()` (sem emoji).
- **Aceite:** render test por kind; teste de que nenhuma frase contém "deveria", "atrasou", "falhou".

### WP3.3 · Título do Vínculo sob o nome + micro-cerimônia de nível — P
- **Evidência:** anexo C §4: `bondTitle` só em `StatsPage`/`TournamentPage`; o comentário de `BOND_REWARDS` promete a home. Rel. 04: marcos de vínculo nomeados (modelo Buddy do GO).
- **Spec:** `CompanionHUD` importa `bondTitle(bondLevelFor(totalXP))` e mostra sob o nome (derivado, nunca persistido — footgun 9). Ao subir de nível: fala dedicada + `bond_level { level }`. Corrigir o comentário.

### WP3.4 · Push: uma fonte de copy, sem duplicata PWA×APK, com win-back — M (+ deploy manual do worker)
- **Evidência:** anexo C §1 e verificação: `NotificationManager.tsx` **reimplementa** a copy de `_pushCopy.js` (footgun 9; `workers/pushCopy.parity.test.js` só cobre worker×função); sem dedup por `saveId`; sem win-back; `subscribe.js:87-94` já mantém `refreshedAt` (reescreve quando `stale`).
- **Spec em três partes:**
  1. **Uma fonte:** `src/utils/pushCopy.ts` que **importa** `../../functions/api/_pushCopy.js` (é ESM puro; nenhum arquivo de produção em `src/` importa de `functions/` hoje, então validar que o Vite empacota — se não, o teste de paridade passa a cobrir o cliente também). `NotificationManager.tsx` para de ter texto próprio.
  2. **Dedup na origem:** no Capacitor Android, quando `registerForPushNotifications` obtém token FCM, chamar `unsubscribeFromPush` (Web Push) — o mesmo aparelho não fica nos dois prefixos. Não precisa de `saveId` no servidor (que o princípio 3 da telemetria e o `_redact` desaconselham).
  3. **Win-back sem tocar no save:** no `push-scheduler.js`, para cada inscrição, se `Date.now() - refreshedAt` estiver em 5–7 dias e `winbackSentAt` ausente → copy de retorno em nome do pet ("{name} guardou tudo como estava. Sem pressa."), grava `winbackSentAt`; em 14–16 dias, segunda e última; depois **silêncio**. Copy em `_pushCopy.js` (`winbackCopy(daysBucket, name, language)`), sem menção a tarefas. Exige que o cliente re-POSTe a inscrição a cada abertura (o `useEffect` de `NotificationManager` já faz quando `enabled`).
- **Aceite:** paridade cliente×função×worker; teste do scheduler com `refreshedAt` em 3/6/15/40 dias (0/1/1/0 envios); `wrangler deploy` em `workers/` (manual — não é Pages Function).

### WP3.5 · Um som de presença — PP · **gosto do dono**
- **Evidência:** anexo C §5: 11 SFX sintetizados, **nenhum** ligado a `speak`/saudação/idle. Rel. 02: som é alavanca conhecida de vínculo, ausente da rodada.
- **Spec:** `sounds.ts` `playChirp()` (2 notas curtas, 90ms) em `saudar()` e no primeiro `speak` da sessão; respeita `SOUND_MUTED`. Um por sessão, nunca no idle.

---

## 7. Onda 4 — Conteúdo D30–D90 (o eixo mais fraco, agora com número)

Objetivo: **que quem chegou a D30 tenha para onde ir.** Os números do anexo F
sustentam cada item — este é o eixo em que a rodada 1 acertou o diagnóstico e
errou o tamanho: a árvore inteira acaba em 14 dias perfeitos, não em ~100.

### WP4.1 · Uma verdade para a evolução: `daysToEvolve` vira gate ou some — M · **decisão do dono**
- **Evidência:** anexo F §4: gate real `perfectDays >= FORM_REQUIREMENTS[level].required` (`App.tsx:2207-2208`, `:4021-4022`) = 4/5/5/6; `daysToEvolve` (10/20/30/40) nunca lido (`progression.test.ts:64-67` prova). Guia P0 #14 pedia 1ª evolução ≤ 5 dias — já é 4.
- **Opções para o dono:**
  - **(a) Escada crescente** — manter rookie→champion em 4 (a 1ª evolução cedo é a certa) e usar `daysToEvolve` corrigido nas seguintes: champion→ultimate **10**, ultimate→mega **20**, mega→ultra **30** (total ~64 dias perfeitos até ultra, coerente com `HABIT_MILESTONES` 7/21/66). `required` continua sendo só a meta diária.
  - **(b) Apagar** `daysToEvolve` e o teste, e aceitar que o conteúdo de progressão é de 14 dias — e investir tudo em WP4.3–4.7.
- **Se (a):** `App.tsx` `handleEvolve`/`canEvolve` passam a ler `evolveGateFor(level)` (novo, em `progression.ts`, dono único), `EvolutionPage` mostra "X de Y dias perfeitos", `GuideModal`/`HelpModal` (números das constantes), `useDailyReset.test.ts` + `progression.test.ts`. **Retrocompatível:** quem já está em mega fica em mega.
- **Aceite:** um único símbolo decide o gate; teste que lê `FORM_REQUIREMENTS` e o gate e exige que concordem.

### WP4.2 · Ultra sem degeneração forçada — M · **decisão do dono** (é bug de desenho)
- **Evidência:** anexo F §4: `getNextEvolution` (`dailyReset.ts:86-89`) exige `mega-virus`, `mega-data` **e** `mega-vaccine` em `unlockedEvolutions`; mega→mega não existe; o único caminho é `getPreviousForm` em HP=0 (`:96`, `:664`) — ~8 dias perdendo coração de propósito, com o teto de 1/dia. Contradiz a tese e não é explicado em lugar nenhum.
- **Proposta:** ultra = estar em **qualquer** mega + `perfectDays` ≥ gate de WP4.1 + **os três atributos** (vírus/dado/vacina) acima de um piso — os atributos vêm da **categoria** das tarefas (`CLAUDE.md` 🌿), então o caminho para ultra é **diversificar o que se cuida**, não perder HP. É a fusão dos 3 Megas do conceito original (`CLAUDE.md`, seção de nomes) contada pelo cuidado, não pela queda.
- **Aceite:** teste que prova que ultra é alcançável **sem** `getPreviousForm` ser chamado; `EvolutionPage` mostra os 3 pisos como o horizonte (guia #50).

### WP4.3 · Vínculo depois do nível 13 — M
- **Evidência:** anexo F §6: `bondRewardFor` → `null` ≥ L14; `BOND_TITLES` para no 13; 9/12 recompensas são itens da loja (`furn-plant`, `bg-forest`, `furn-picture`, `bg-sakura`, `furn-rug`) — duplicata para quem esvaziou a loja em D20; L13 cai em D25–D35.
- **Spec:** (a) trocar as 5 duplicatas por **variantes exclusivas do Vínculo** (`furn-plant-bond` etc. — mesmo asset com paleta/moldura; `shop.ts` marca `unlock: { kind: 'bond' }` e **nunca vende**); (b) escada procedural ≥ L14: a cada 3 níveis um título novo (lista em `BOND_TITLES` estendida até L31) e a cada 6 um sonho exclusivo de Vínculo (`DREAM_CATALOG` ganha `source: 'bond'`); (c) `bondRewardFor` nunca devolve `null` até L31 (teste).
- **Régua:** tudo cosmético — `currencies` já trava.

### WP4.4 · Estações cíclicas — P
- **Evidência:** anexo F §5: `SEASONS` (`seasons.ts:97`) termina 2027-02-27; `currentSeason()` → `null` depois.
- **Spec:** estação derivada do **mês** (mar–mai sprout, jun–ago ember, set–nov tide, dez–fev starlit), sem tabela de datas; medalhas e sonhos sazonais por `season-*` continuam. Teste: para qualquer data entre 2026 e 2036, `currentSeason() !== null`.

### WP4.5 · Sumidouro recorrente de Bits — M
- **Evidência:** anexo F §1: 53 itens permanentes = 8.540 Bits, esgotados em D15–D23; depois só chips (120) e coração (150). Transcrição C2: atividade desacoplada de necessidade vira "ponto de ruído".
- **Spec:** (a) **vitrine da estação** na Loja: 3 itens (1 bg + 2 decor) por estação de WP4.4, saem quando a estação vira (sem "última chance" — FOMO que tira é dark pattern, C3); reaparecem no ano seguinte; (b) **presente cosmético para amigo** custa 200 Bits (o `gift` social de 20 Bits continua grátis) — dá destino ao Bits e usa a única mecânica social recorrente; (c) **nunca** um sumidouro que compre vantagem (`currencies` trava).
- **Aceite:** teste de que a vitrine muda com `currentSeason()`; nenhum item novo tem efeito mecânico.

### WP4.6 · Bestiário + Abismo (a maior massa de conteúdo já existente e invisível) — G
- **Evidência:** anexo F §5: `LEGACY_FORM_TIERS` é roster de arte com 60 nomes consumido por `getDungeonEnemySprite` **sem registro do que o jogador enfrentou**; não há dex além do `DreamDex.tsx`; anexo F §2: `MAX_FLOORS = 5` local em `DungeonGame.tsx:44`, nada além do andar 5, `dmgReduction`/`speedBump` saturam.
- **Spec:** (a) **Bestiário**: `GameState.bestiary: string[]` (ids de inimigos vistos; migração `?? []`), gravado ao derrotar (`DungeonGame.tsx` onde credita Bits), página `BestiaryPage.tsx` no molde do `DreamDex.tsx` (silhueta até ver; sprite depois; contagem X/60); (b) **Abismo**: após limpar os 5 andares, oferta opcional de andares 6–8 com a mesma escada e `ptsMult` **congelado** no do andar 5 (sem inflação de Bits), rendendo só `DUNGEON_BEST` e entradas do bestiário de tiers altos; perder no Abismo não custa nada (a run já contou). `MAX_FLOORS` sai do componente e vai para `dungeon.ts` (dono único).
- **Aceite:** teste de que o Abismo nunca rende mais Bits/andar que o andar 5; teste do bestiário idempotente; WP0.7 confirma que `bestiary[]` cabe no save.

### WP4.7 · Missões semanais repetíveis — G
- **Evidência:** anexo F §5: 6 missões de alvo único, nada repetível; `SEASON_PATHS` (5 runs = medalha do trimestre em 5 dias).
- **Spec:** `weeklyMissions.ts` (novo, puro): 3 missões por semana sorteadas com seed = `isoWeekKey` de um pool de ~12 (ex.: "3 noites na janela", "2 runs", "1 tarefa assombrada concluída", "5 check-ins"), recompensa **pequena e cosmética/Emblemas** + `awardBondXP({kind:'weeklyMission'})`; exibidas no relatório semanal (`rituals.ts` `weeklyReport`) e na aba Missões. **Nunca** "faça N tarefas" cru (recompensa por contagem é proibida — `CLAUDE.md`).
- **Aceite:** teste de sorteio determinístico por semana; teste de que nenhuma missão premia contagem de itens.

### WP4.8 · "Memórias" aos 30/90 dias + card compartilhável — M
- Guia #37/#24. `MemoriesCard.tsx`: sprite atual, formas vividas (`unlockedEvolutions`), sonhos coletados, `soulGoal`; renderizado para PNG via canvas (`utils/shareCard.ts`), sem dado de terceiro. Disparo no `DailyReportModal` nos dias 30 e 90 do save (`NEW_SAVE_GRACE_DAYS` e `lastDayReport` dão a base).

---

## 8. Onda 5 — Monetização (o que é técnico, e o que espera o dono)

Objetivo: **a oferta fica visível sem virar pressão, e o dinheiro nunca compra
a barra de cuidado.** As decisões grandes (assinatura, trial, preço) são do
dono e ficam na seção 9; aqui vai o que é executável.

### WP5.1 · Ponto de descoberta na Loja e no 1º dia perfeito — M
- **Evidência:** anexo D §3: `UnlockNudge` **NÃO ENCONTRADO** em `ShopModal` nem em `DailyReportModal`; `CreditsModal` só abre pelo menu sanduíche da `BottomNav`. Rel. 06 e I.5: o value moment é o 1º dia perfeito; nunca o reveal.
- **Spec:** (a) `ShopModal`: para `tier === 'demo'`, um card fixo no fim da aba Itens (`UnlockNudge` `reason='task-limit'`); para pago, entrada "Créditos" que abre o `CreditsModal` (hoje só pela nav); (b) `DailyReportModal`: quando `report.wasPerfect` **pela primeira vez** e `tier === 'demo'`, uma linha do pet + `UnlockNudge` novo `reason='report'`; **cap 1/semana** (`offerShownWeek` no save, `isoWeekKey`); emite `unlock_view { reason: 2 }` (WP0.5).
- **Aceite:** nunca no D0; nunca duas vezes na semana; nunca no modo acolhida (`welcome`).

### WP5.2 · Cura instantânea por Créditos: reenquadrar — P · **decisão do dono**
- **Evidência:** anexo D §2: `handleInstantHealWithCredits` cobra 10 e faz `hp+1`; é a **única** peça atual que vende HP por dinheiro real (guia H.3, rel. 06 e I.5 "valores sagrados"). Sem estorno server-side (dívida declarada em `instantHeal.ts`).
- **Opções:** **(a) remover** o `Row` do `CreditsModal` e `handleInstantHealWithCredits` (mantendo `instantHeal.ts` e teste até a limpeza); **(b) reenquadrar** como compra do item 💗 (vai à pastinha; usa `applySpecialItem`, dono único de item especial) — continua sendo HP por dinheiro, só com um passo a mais; o plano **recomenda (a)**.

### WP5.3 · Idempotência de `spend` — M
- **Evidência:** anexo D §2 e comentários em `instantHeal.ts`/`_entitlements.js`: dois toques podem debitar duas vezes; `healInFlightRef` é guarda de cliente.
- **Spec:** `spendCredits(amount, reason, opId)` com `opId` aleatório por gesto; servidor grava `spend:<saveId>:<opId>` (TTL 24h) e devolve o mesmo resultado na repetição. Testes em `_entitlements.test.js`.

### WP5.4 · Especificação (não implementação) de assinatura e trial — documento · **dono**
- Rel. 06 + transcrição C5: assinatura "Vínculo" com Créditos recorrentes **ao lado** do vitalício; trial de 7 dias como presente do pet no 3º dia perfeito; **double dipping** proibido (franquia robusta); promoções espaçadas e imprevisíveis; `PRODUCTS` em `_billing.js` ganharia SKU de assinatura e `verifyPlayPurchase` precisaria de `purchases.subscriptions`. Fica como anexo de decisão (seção 9), não como WP.

---

## 9. Guardrails — o que nenhum WP pode fazer

Travados por **teste** (remover o teste é remover o produto): streak que zera ·
humor como pontuação · Bits→Créditos · Emblemas comprando vantagem · `bondLevel`
persistido · dia da regra diária pelo relógio do aparelho · aritmética de HP no
`App.tsx` · regra dentro de updater inline · `MAX_DAILY_FOCUS ≠ 3` (literal
travado) · `ABSENCE_FORGIVENESS_DAYS ≠ 2` (literal travado).

Travados por **tese** (e este plano acrescenta os três últimos):
- Nunca vender proteção contra punição; nunca percentual cru de constância;
  nunca "última chance" (FOMO que tira é dark pattern nomeado — C3).
- Nunca recompensa por **contagem** de tarefas (WP4.7 respeita).
- **Nunca um nono perdão** sem responder à pergunta da seção 10 (I.1.2).
- **Nunca texto do usuário em IA ou telemetria** sem decisão explícita do dono
  (`_redact.js`, `telemetry.ts` princípio 1) — WP1.4 e WP3.1 têm as duas
  camadas por isso.
- **Nunca mecânica cuja resposta seja "querer a notificação"** (seção 0).
- Chaves do bridge do widget e `digiapp_*` do save: **só acrescentar**.

---

## 10. Decisões que só o dono pode tomar (e o que cada uma destrava)

| # | Decisão | Evidência | Destrava |
|---|---|---|---|
| D1 | Definir `METRICS_ADMIN_KEY` no Pages | anexo E | **Tudo** (WP0.1) |
| D2 | Reabrir a coorte de retenção (aprovar/recusar a proposta de WP0.2) | `metrics.js` cabeçalho | Metas D1/D7/D30 |
| D3 | `REST_SHIELD_MAX` 3 → 2 (experimento) | transcrição A1 | WP2.1 |
| D4 | **Onde é a linha de perdão do Soulmon** — o que ainda dói perder | I.1.2 | Régua para toda a onda 2 e 4 |
| D5 | `daysToEvolve`: escada crescente (a) ou apagar (b) | anexo F §4 | WP4.1 e o tamanho real do conteúdo |
| D6 | Ultra sem degeneração (aprovar WP4.2) | anexo F §4 | WP4.2 |
| D7 | Cura instantânea: remover (a) ou reenquadrar (b) | anexo D §2 | WP5.2 |
| D8 | `soulGoal`/`soulStruggle` em texto para IA (sugestões, chat) | `_redact.js:15` | camada 2 de WP1.4 e WP3.1 |
| D9 | Ligar `PLAY_REQUIRE_ACCOUNT_BINDING=true` **depois** do APK de WP0.6 | `STATUS.md` §3.2 | integridade de compra |
| D10 | Assinatura / trial / preço | rel. 06, C5 | WP5.4 |
| D11 | Som de presença (gosto) | anexo C §5 | WP3.5 |

As D1–D4 valem mais que todas as outras juntas: sem D1 ninguém lê nada; sem D4
a onda 4 corre o risco de acrescentar perdão onde falta significado.

---

## 11. Sequência sugerida (6 sprints de 1 semana)

| Sprint | Pacotes | Sai com |
|---|---|---|
| **S1 — Ver** | WP0.1–0.7 (+ D1, D2 pedidas) · WP1.1 começa | Funil legível; docs corrigidos; eventos novos; `obfuscatedAccountId`; **sprite no reveal** |
| **S2 — Nascer** | WP1.1 fecha · WP1.2 · WP1.3 · WP1.4 (camada 1) · WP1.5 · WP2.3 (PP) | Reveal cerimonial com o "porquê"; D0 guiado; botão de compromisso |
| **S3 — Cuidar** | WP2.2 · WP2.4 · WP2.5 · WP2.7 · WP3.2 · WP3.3 · (WP2.1 se D3) | Prestígio sem punição; marco que interrompe; pet fala nos momentos mudos; reencontro por dias |
| **S4 — Lembrar** | WP3.1 · WP3.4 (+ `wrangler deploy`) · WP2.6 (APK) · WP3.5 (se D11) | Chat com contexto e memória; push única, com win-back; widget-janela |
| **S5 — Durar (1/2)** | WP4.4 · WP4.3 · WP4.5 · WP4.1/4.2 (se D5/D6) | Estações cíclicas; Vínculo até L31; vitrine da estação; evolução com uma verdade |
| **S6 — Durar (2/2)** | WP4.6 · WP4.7 · WP4.8 · WP5.1 · WP5.3 · (WP5.2 se D7) | Bestiário + Abismo; missões semanais; memórias; oferta no value moment; `spend` idempotente |

Dependências duras: WP0.1 antes de qualquer leitura de meta · WP0.5 antes de
qualquer WP que emita evento · WP0.7 antes de WP3.1/4.6 · WP4.4 antes de WP4.5
· APK (WP0.6, WP2.6) agrupados num build só.

O que **não** está em nenhum sprint, de propósito: assinatura/trial/preço
(D10), cooperativo, arte de decoração (`BRIEF-ARTE-DECORACAO.md`), Health
Connect — todos dependem do dono ou de fora do código.

---

## 12. Riscos do plano inteiro

- **Ler o número tarde.** Se D1 demorar, S2–S3 seguem às cegas. Mitigação: S1 é
  quase todo P e independente — dá para executar em paralelo com a espera.
- **Custo de IA no reveal (WP1.1).** Já coberto pelo `requirePaidTier`; o risco
  real é tentativa dupla — o aceite exige respeitar `SPRITE_FORM_ATTEMPT_CAP`.
- **Mudar regra de evolução (WP4.1/4.2) em save vivo.** Retrocompatibilidade
  é critério de aceite; ninguém regride de estágio.
- **Acrescentar perdão sem querer.** WP2.2 (aura), WP2.7 (reencontro), WP3.4
  (win-back) são **acolhimento**, não perdão mecânico — nenhum altera HP,
  escudo ou constância. Se algum WP futuro alterar, passa por D4 primeiro.
- **Regra copiada (footgun 9).** WP3.4 existe para matar uma cópia; WP0.5,
  WP4.1 e WP4.6 criam **donos únicos** (`EVENT_SCHEMA` espelhado com paridade,
  `evolveGateFor`, `MAX_FLOORS` em `dungeon.ts`).
- **Timestamps das transcrições são aproximados** (I.6) — para citação pública,
  conferir no vídeo.

---

## Anexos (`docs/plano-melhorias/`)

| Arquivo | O que fundamenta |
|---|---|
| `A-onboarding.md` | Steps, o reveal sem `<img>`, geração de sprite em ocioso, push só após 1ª conclusão, `soulStruggle` nunca lido, tutorial de 1 página, funil já instrumentado |
| `B-habitos.md` | Constantes e quais testes travam o quê; `REST_SHIELD_MAX` sem teste; `shielded[]`; botão do check-in; marco sem animação/háptico; `welcomeBack`; widget sem dado de hábito |
| `C-presenca.md` | Copy real das 3 pushes; copy duplicada no cliente; sem dedup/win-back; prompt literal do chat; memória zero; gatilhos de fala e os mudos; Vínculo sem HUD; sons sintetizados |
| `D-monetizacao.md` | Catálogo/SKUs/preços; Play Billing sem `obfuscatedAccountId`; os 3 nudges e seus textos; nenhum na Loja/relatório; cap demo; sem trial/assinatura |
| `E-telemetria.md` | O sistema que existe; bindings; padrão canônico de endpoint; cloud save; por que D1/D7 é impossível hoje e o precedente para resolver; consentimento e o bug "sete" |
| `F-conteudo.md` | Economia de Bits com contas; masmorra/torneio/evolução/sonhos/Vínculo/social esgotando; `daysToEvolve` morto; ultra via degeneração; `SEASONS` expira |
