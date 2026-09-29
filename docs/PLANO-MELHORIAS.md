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
| ~~`CLAUDE.md` 👻 Assombrada~~ | "o pet olha" | ✅ **verdade desde 06/09/2026** — `hauntedWatching` + `sm-pet-haunted` | WP3.2 VERIFICADO |
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
- **Evidência:** anexo F §4: `getNextEvolution` (`dailyReset.ts:86-89`) exige `mega-power`, `mega-harmony` **e** `mega-benevolence` em `unlockedEvolutions`; mega→mega não existe; o único caminho é `getPreviousForm` em HP=0 (`:96`, `:664`) — ~8 dias perdendo coração de propósito, com o teto de 1/dia. Contradiz a tese e não é explicado em lugar nenhum.
- **Proposta:** ultra = estar em **qualquer** mega + `perfectDays` ≥ gate de WP4.1 + **os três atributos** (poder/harmonia/benevolência) acima de um piso — os atributos vêm da **categoria** das tarefas (`CLAUDE.md` 🌿), então o caminho para ultra é **diversificar o que se cuida**, não perder HP. É a fusão dos 3 Megas do conceito original (`CLAUDE.md`, seção de nomes) contada pelo cuidado, não pela queda.
- **Aceite:** teste que prova que ultra é alcançável **sem** `getPreviousForm` ser chamado; `EvolutionPage` mostra os 3 pisos como o horizonte (guia #50).

### WP4.3 · Vínculo depois do nível 13 — M
- **Evidência:** anexo F §6: `bondRewardFor` → `null` ≥ L14; `BOND_TITLES` para no 13; 9/12 recompensas são itens da loja (`furn-plant`, `bg-forest`, `furn-picture`, `bg-sakura`, `furn-rug`) — duplicata para quem esvaziou a loja em D20; L13 cai em D25–D35.
- **Spec:** (a) trocar as 5 duplicatas por **variantes exclusivas do Vínculo** (`furn-plant-bond` etc. — mesmo asset com paleta/moldura; `shop.ts` marca `unlock: { kind: 'bond' }` e **nunca vende**); (b) escada procedural ≥ L14: a cada 3 níveis um título novo (lista em `BOND_TITLES` estendida até L31) e a cada 6 um sonho exclusivo de Vínculo (`DREAM_CATALOG` ganha `source: 'bond'`); (c) `bondRewardFor` nunca devolve `null` até L31 (teste).
- **Régua:** tudo cosmético — `currencies` já trava.

### WP4.4 · Estações cíclicas — P · **RECUSADO em 03/09/2026 (premissa falsa)**
- **Evidência (corrigida):** ~~anexo F §5: `SEASONS` termina 2027-02-27; `currentSeason()` → `null` depois~~ — **falso**. `coversDay` (`seasons.ts`) compara **mês/dia** e ignora o ano de propósito (cabeçalho "O ANO É CÍCLICO"); `seasons.test.ts` já exercitava 2031. O anexo leu a tabela ISO e não a função que a consome. O único `null` é a folga deliberada de 28/29 de fevereiro, documentada e testada.
- **O que ficou:** teste novo em `seasons.test.ts` varre todos os dias de 2026–2036 e exige estação em todos menos a folga. Nada a implementar. WP4.5 (vitrine da estação) não depende disto e segue válido.

### WP4.5 · Sumidouro recorrente de Bits — M
- **Evidência:** anexo F §1: 53 itens permanentes = 8.540 Bits, esgotados em D15–D23; depois só chips (120) e coração (150). Transcrição C2: atividade desacoplada de necessidade vira "ponto de ruído".
- **Spec:** (a) **vitrine da estação** na Loja: 3 itens (1 bg + 2 decor) por estação de WP4.4, saem quando a estação vira (sem "última chance" — FOMO que tira é dark pattern, C3); reaparecem no ano seguinte; (b) **presente cosmético para amigo** custa 200 Bits (o `gift` social de 20 Bits continua grátis) — dá destino ao Bits e usa a única mecânica social recorrente; (c) **nunca** um sumidouro que compre vantagem (`currencies` trava).
- **Aceite:** teste de que a vitrine muda com `currentSeason()`; nenhum item novo tem efeito mecânico.

### WP4.6 · Bestiário + Abismo (a maior massa de conteúdo já existente e invisível) — G
- **Evidência (corrigida em 02/09, WP4.9):** ~~`LEGACY_FORM_TIERS` é roster de 60 nomes~~ — **falso**; a masmorra sorteia de `DUNGEON_LINE_SPRITES` (6 linhas × 4 artes). O que segue verdadeiro: **não há registro do que o jogador enfrentou** e não há dex além do `DreamDex.tsx`; anexo F §2: `MAX_FLOORS = 5` local em `DungeonGame.tsx:44`, nada além do andar 5, `dmgReduction`/`speedBump` saturam.
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

## 16. Decisão do dono (27/09/2026) — Profissão sem campo, cosmética, nas habilidades

Registrado para implementação futura — **nada abaixo foi implementado ainda**.
Palavras do dono, verbatim:

> "Profissão deve ser algo que aparece para poucos usuários e influencia
> diretamente na criatura e suas habilidades mas não deve haver um campo
> 'profissão' - é apenas mais um elemento pra definir a criatura unica e deve
> aparecer em suas habilidades. Nao deve haver impacto em performance para
> quem tem profissão, é apenas cosmético."

### O que isso significa, decomposto

| Exigência | Leitura |
|---|---|
| Aparece para POUCOS usuários | não é um eixo que toda ficha exibe — é raro/notável, não universal |
| Influencia DIRETAMENTE a criatura e as habilidades | entra na identidade e no NOME/flavor das skills, não é decorativo solto |
| **Sem campo "profissão"** | nenhuma UI nomeia "Profissão: Ferreiro" em lugar nenhum — dissolve no que já existe, não vira mais um rótulo |
| "mais um elemento pra definir a criatura única" | é insumo de UNICIDADE, no mesmo espírito do que `dominantClass`/arquétipo já faz para o prompt de sprite (nunca aparece na UI, só molda o resultado) |
| Deve aparecer nas habilidades | ao contrário da classe (que NUNCA aparece pro jogador — ver `CLAUDE.md` § Arquitetura), a profissão flavoreia nome/descrição de skill |
| Sem impacto de performance | puramente cosmético — nenhum número de jogo (dano, HP, atributo) muda por causa dela |

### Onde isso encosta no código, para quem pegar depois

- **`src/utils/soulProfile/ficha/buildSheet.ts`** já computa `profissoes:
  Partial<Record<ProfissaoId, number>>` por ficha (11 profissões do
  class-system, mesma fonte de `elementos`/`escolas`/`talentos`) — o dado JÁ
  EXISTE, só não é consumido em lugar nenhum hoje.
- **`src/utils/soulProfile/ficha/skills.ts`** (`StageSkills`, básica/especial
  por estágio) é onde a exigência "aparece nas habilidades" provavelmente
  entra — hoje o nome da skill vem só de escola+elemento (`NOMES` por
  `EscolaId`); a profissão dominante poderia entrar como uma terceira camada
  de flavor no nome/descrição, no mesmo padrão de "ingrediente extra" que a
  classe já usa no prompt de sprite (`pipeline.ts` › `promptClassFlavor`),
  mas SEM o veto de nunca aparecer — aqui é o oposto, tem que aparecer.
- "Aparece para poucos usuários" sugere um LIMIAR de dominância (só quando a
  profissão líder passa de X% da distribuição, análogo ao
  `DOMINANT_SCHOOL_LEAD` de `buildSheet.ts`) — a maioria das fichas não teria
  profissão "notável" nenhuma, e é isso que a torna rara.
- **Não decidido, e é decisão de quem implementar**: o LIMIAR exato, ONDE no
  texto da skill ela entra, e se afeta 1 estágio ou os 5.

### Regras que este trabalho NÃO pode violar

- **Zero impacto mecânico** — nenhum dano/atributo/custo de recurso muda.
  Régua esperada: um teste que gera duas fichas idênticas exceto a
  profissão dominante e afirma `poderCombate`/atributos IDÊNTICOS.
- **Nenhuma UI nomeia "Profissão"** — nem rótulo, nem ícone dedicado, nem
  linha na ficha. Régua esperada: `grep -ri "profiss" src/components/` não
  pode achar string visível ao jogador fora de comentário.

## Anexos (`docs/plano-melhorias/`)

| Arquivo | O que fundamenta |
|---|---|
| `A-onboarding.md` | Steps, o reveal sem `<img>`, geração de sprite em ocioso, push só após 1ª conclusão, `soulStruggle` nunca lido, tutorial de 1 página, funil já instrumentado |
| `B-habitos.md` | Constantes e quais testes travam o quê; `REST_SHIELD_MAX` sem teste; `shielded[]`; botão do check-in; marco sem animação/háptico; `welcomeBack`; widget sem dado de hábito |
| `C-presenca.md` | Copy real das 3 pushes; copy duplicada no cliente; sem dedup/win-back; prompt literal do chat; memória zero; gatilhos de fala e os mudos; Vínculo sem HUD; sons sintetizados |
| `D-monetizacao.md` | Catálogo/SKUs/preços; Play Billing sem `obfuscatedAccountId`; os 3 nudges e seus textos; nenhum na Loja/relatório; cap demo; sem trial/assinatura |
| `E-telemetria.md` | O sistema que existe; bindings; padrão canônico de endpoint; cloud save; por que D1/D7 é impossível hoje e o precedente para resolver; consentimento e o bug "sete" |
| `F-conteudo.md` | Economia de Bits com contas; masmorra/torneio/evolução/sonhos/Vínculo/social esgotando; `daysToEvolve` morto; ultra via degeneração; `SEASONS` expira |

---

## 13. Rodada 3 — o dossiê Mobbin (02/09/2026)

Fonte: `docs/guia-experiencia/09-mobbin-dossie.md` (27 buscas no Mobbin Pro, ~90
achados, 13 dossiês, só iOS, sem estados transitórios — ver §1 dele). Cada
dossiê foi destrinchado pelo guarda dono em `docs/plano-melhorias/mobbin/`, em
três colunas (o que o app faz · o que o Soulmon faz hoje, por `grep` · veredito).
A linha vermelha inventariou 73 achados anti/limítrofes: o Soulmon **já evita 36**,
tropeça em 12 na exibição/copy, e está **exposto em 5** (E1–E5, abaixo).

### 13.1 O que a rodada corrigiu no próprio plano (de novo)

| Onde | Dizia | Verdade (por `grep`) | Ação |
|---|---|---|---|
| WP4.6, anexo F, ledger | "roster de 60 inimigos invisíveis em `LEGACY_FORM_TIERS`" | **Falso.** `LEGACY_FORM_TIERS` tem um uso (`LEGACY_LEVEL_OF`); a masmorra sorteia de `DUNGEON_LINE_SPRITES` — 6 linhas × 4 artes, 6 nomes. Origem do erro: comentário morto em `progression.ts:57-59` | WP4.6 reescrito (G→M); WP4.9 corrige as três fontes |
| WP1.2(c) | "calibrar `composeBio`" | `composeBio` **não existe**; a bio do reveal (`richConceptPt`) já é origem; a frase de comportamento vive em `stages[].description` e aparece no `PetPage` | Régua mira `stages[].description` |
| WP3.3 | "título **sob o nome** do pet no HUD" | **Não há nome do pet no HUD** (`grep soulmonDisplayName CompanionHUD.tsx` → 0) | Spec vira pílula nome + título |
| WP3.1 | contexto no chat | O chat recebe `petName: currentStage` — a criatura se apresenta pela **espécie**, não pelo nome batizado | Item 0 do WP3.1: persona = nome batizado |
| "Guia #37/#24" em WP4.8 | referências | não resolvem (o rel. 07 vai só até 24) | fontes reais: 01 lição 18, 02 rec. 4, 04 rec. 12 |

### 13.2 As cinco exposições (o código faz o que o dossiê marca como anti-padrão)

| # | Onde | O que | Proibição | Fecha em |
|---|---|---|---|---|
| E1 | `WidgetRenderer.kt` | `"Don't forget about me today!"` · `"N task(s) left, let's go!"` · corações vazios — **o anti-padrão de referência do dossiê inteiro, dentro do nosso APK** | #16, #19 | WP2.6 (aceite novo: nenhum dígito quando `completed < total`) |
| E2 | `CreditsModal` | cura de 1 coração por 10 Créditos | #13 | D7 (parecer: remover) |
| E3 | `LibraryPage.tsx:340`, `PlayerDetailModal.tsx:105`, `community.js:180-188` | perfil do amigo com `rank N` e a escada Rookie→Mega com o nível atual marcado — a armadilha do Mimo | **#21** (nova) | WP4.11 |
| E4 | aba Missões | 🔒 + `0/100 kills` em série | cadeado + zero em série | WP4.12 |
| E5 | `tournamentTiers.ts` ← pontos da season | a faixa **caduca todo mês** | monotonia (🎪 "acumular nunca rebaixa") | WP4.13 |

### 13.3 As oito decisões recebidas por via lateral (§16 do dossiê)

O dossiê registra oito decisões "do time de produto" em 02/09/2026. Foram
confrontadas com o código e passaram pela linha vermelha (pareceres em
`ledger/vetos.md`). Resumo: 1, 5, 7 **já são assim**; 3 já é assim com ressalva
(a copy do overlay vem da mesma fonte do push); **4 o código é melhor que a
decisão** (mostra escudo só quando `> 0`; "invisível total" jogaria fora a
leitura positiva — manter); 6 aprovada com a ressalva de que "invisível" não é
"sem sinal" (Problema 1 do dossiê → WP1.2); 2 e 8/8b **abrem trabalho** (abaixo)
e 8b está **vetada no código** até E3 fechar.

### 13.4 Especificações revisadas (o texto novo está no arquivo do guarda)

WP1.1 (espera atribuída à criatura, skeleton fiel, sem barra, `sprite_wait_ms`) ·
WP1.2 (régua em `stages[].description`; sinal de que os 20 itens foram usados
sem revelar perfil — Speak/Lovi/Noom) · WP1.3 (1 CTA por vez, contar feitos
nunca restantes, dissolve na fala do pet) · WP1.5 (prévia vem de `pushCopy`,
dismiss com data) · WP2.2 (`steadyWindow`, sem nome de "pureza", aura já
vestida, rótulo neutro) · WP2.4 (modal que **espera o gesto**, "marco
permanente", botão relacional) · WP2.6 (`shields`/`constancy_pct` **saem** do
bridge; entram `steady`, `habit_tier_max`, `needs_intervention`, `bond_level`,
`lang`; sprite é o traço que sobrevive; 1×1 sem texto) · WP2.7 (copy por bucket,
**sem o número de dias**; `onRecoverHearts` nunca em `welcome`) · WP3.1 (item 0:
persona = nome batizado) · WP3.2 (léxico sem mecânica: "HP baixo", "Vamos
completar tarefas!" saem) · WP3.3 (pílula nome + título; sem barra de Vínculo na
home) · WP3.4 (a copy das 20h entra na fonte única; win-back sem número de dias)
· WP4.6 (Álbum de formas vividas + Encontros, molde `DreamDex`; Abismo adiado) ·
WP4.8 (gatilho = forma nova; piso obrigatório; 4:5 + 9:16; só métricas
monótonas) · WP5.1 (dois canais: passivo na Loja fora do cap + proativo no 1º
dia perfeito vitalício; `×` grava dispensa permanente; `unlock_view.reason`
sobe a `max: 3`).

### 13.5 Pacotes novos (14) — o plano passa a ter **50**

| WP | Guarda | O quê | Esforço | Verificação |
|---|---|---|---|---|
| WP1.6 | nascimento | `BirthCard.tsx`: cartão de nascimento reutilizável (sprite/silhueta + nome + epíteto + `soulGoal` + data), **sem número**; no reveal e na `StatsPage` | P | `grep -l BirthCard SoulmonOnboarding.tsx StatsPage.tsx` → 2; `grep -cE '[0-9]+ (dias\|days)' BirthCard.tsx` → 0 |
| WP1.7 | nascimento | Rascunho persistente do ritual (`STORAGE_KEYS.ORACLE_DRAFT`): fechar o app no item 15 de 20 não perde as respostas; apagado em `finish()`; não altera a bifurcação SEM VOLTA | P | `grep -c ORACLE_DRAFT storageKeys.ts SoulmonOnboarding.tsx` ≥ 1 cada |
| WP1.8 | nascimento | Pedir permissão de push **ao ligar o lembrete de deitar** (janela de descanso), com a prévia de `pushCopy` das 22h — o momento-ouro do dossiê é "a pessoa ligou um toggle"; hoje `requestNotificationPermission` só sai de `handleToggleNotifications` | P | grep de chamada em `sleepReminder`/Configurações da janela |
| WP2.8 | constância | `hideMetrics` cobre a constância: esconde "N das últimas 7" e os pontos, preserva tier + aura + escudos | P | `grep -q hideMetrics HabitConstancy.tsx` + render test sem dígito |
| WP2.9 | constância | Teste de guarda: nenhum render de constância contém `/\d+\s*%/` (percentual cru hoje só é proibido por tese) | PP | o teste existe e passa |
| WP3.6 | vínculo | Sombra de contato sob o sprite (invariante de 5 apps; ausente) em `GROUND_Y`, `reducedMotion`-safe | PP | `grep -q sm2-pet-shadow index.css CompanionHUD.tsx` |
| WP3.7 | vínculo | Auditoria de gênero da criatura (decisão 2): ~15 referências misturam "ele"/"ela" (`PetPage` diz "ela", Guia/Glossário/`MorningDream`/push 16h dizem "ele") → copy neutra por nome próprio, PT+EN | P | `grep -rnE "\b(ele\|ela)\b" src/components functions/api/_pushCopy.js` referindo-se à criatura → 0 |
| WP4.9 | permanência | Corrigir a evidência do "roster de 60" nas três fontes + comentário morto de `progression.ts:57-59`; teste: `getDungeonEnemySprite` nunca devolve nome fora de `DUNGEON_LINE_NAMES` | PP | `grep -rn "60 nomes" docs/plano-melhorias --exclude-dir=mobbin \| grep -v "grep -rn"` → 0 (o arquivo de análise do guarda cita a frase falsa como histórico, de propósito) |
| WP4.10 | permanência | Datar as coleções: `formReachedAt` e `rest.dreamDates` (dayKey do jogador), migração `?? {}`; insumo de WP4.6/4.8 | P | `grep -n "formReachedAt\|dreamDates" GameStateContext.tsx restWindow.ts` ≥ 2 |
| WP4.11 | permanência | **E3** — perfil do amigo sem métrica (#21): só presença (criatura, nome, galho como palavra) e verbos de dar; `community.js` `profile` deixa de expor `tasksDone`/`rankPoints`; `PlayerDetailModal` sem escada | M | grep de `rank\|tasksDone` em `LibraryPage`/`PlayerDetailModal` → 0 |
| WP4.12 | permanência | **E4** — missão bloqueada mostra a condição em palavra, nunca 🔒 + `0/N` em série | P | render test da aba Missões sem `0/` |
| WP4.13 | permanência | **E5** — faixa do Torneio lê pontos **lifetime** (nunca rebaixa); a season só decide troféu | P | teste: faixa após virada de mês ≥ faixa anterior |
| WP4.14 | permanência | Criatura **visitável** (decisão 8): o box do amigo com forma + pose idle neutra + decoração, sem estado (HP/sono) e sem número; depende de WP4.11 | G | `grep -q visit LibraryPage.tsx community.js` + teste "visita nunca expõe HP" |
| WP5.5 | sustento | "Agora não" com peso de primário no `UnlockAccountModal` (Character AI); emite `unlock_dismiss` | PP | `grep -q "Agora não" UnlockAccountModal.tsx` + render test dos 3 botões |

### 13.6 Decisões novas para o dono (continuação da seção 10)

| # | Decisão | Evidência |
|---|---|---|
| D12 | **A criatura grátis ramifica?** A copy atual diz que a árvore demo "leva ao mesmo lugar"; a linha vermelha diz "sim, obrigatoriamente" (senão o grátis é pet pior, exposto na árvore de amigos) | §17 Q1, `UnlockAccountModal.tsx:142` |
| D13 | Ratificar as ressalvas às decisões 4 e 8b (escudo ">0 only" em vez de invisível total; 8b vetada no código até E3) | `ledger/vetos.md` |
| D14 | `Buddy up`/parceria: aprovar só na forma **meta somada + kudos**, nunca "a falha de um decepciona o outro" | §17 Q6 |

**D4 e D7 são a mesma pergunta vista de dois lados** (parecer da linha vermelha):
o produto empilha perdões para o coração não doer **e** vende a cura por
dinheiro. Se não dói, a cura não vale 10 Créditos; se vale, há incentivo para
que doa. Responder juntas.

### 13.7 Limites herdados do dossiê
Só iOS (sem Android, sem desktop) · sem data de captura · sem estados
transitórios (celebração não-bloqueante e clímax de revelação ficaram fora por
construção) · "app pequeno" é estimativa. A passada de fluxos (`search_flows`)
foi a mais subutilizada e a mais rentável — um terceiro passe deveria ser só
de fluxos.

## 14. Rodada 4 — o corpus pré-Mobbin destrinchado (03/09/2026)

Fonte: os seis estudos em `docs/plano-melhorias/estudo/` (nascimento, constância,
vínculo, permanência, sustento, medição). Até aqui só o dossiê Mobbin tinha
passado pelo crivo de três colunas (fonte · código por `grep` · veredito). Os
relatórios 01–07, as transcrições 08 e o guia alimentaram o plano na criação,
mas **ninguém os tinha confrontado linha a linha com o código**. Esta rodada fez
isso: ~300 linhas de tabela, 41 candidatas, parecer da linha vermelha em
`ledger/vetos.md` (17 APROVADO · 23 COM RESSALVA · 1 VETADO).

### 14.1 O que a rodada corrigiu no próprio plano (terceira vez)

| Onde | Dizia | Verdade (por `grep`) | Ação |
|---|---|---|---|
| WP2.5 | "onde a intervenção é montada" | **A intervenção não existe na UI**: `needsIntervention` (`habitRhythm.ts`) tem teste e 40 linhas de comentário e **nenhum componente o chama**. O guia e o `CLAUDE.md` prometem "o pet oferece 5 minutos"; o pet nunca oferece | WP2.5 passa a depender de **WP2.10** (a intervenção em si) |
| WP4.3 | "estender a escada do Vínculo além do L13" | **L2–L13 nunca é entregue**: `BOND_REWARDS` e `unclaimedBondRewards` (`bond.ts`) sem consumidor; `bondRewardsClaimed` nunca escrito. O jogador recebe só o título | WP4.3 em duas fases: **WP4.15** (ligar a escada existente) antes |
| WP4.5 | "vitrine por estação de WP4.4" | WP4.4 foi RECUSADO porque as estações **já são** cíclicas; o que falta é a UI: `seasonLabel`/`SEASON_PATHS`/`applySeasonMedal` sem consumidor — o jogador não sabe que estação é e a medalha nunca é ganha | WP4.5 depende de **WP4.16** |
| WP4.7 | "`SEASON_PATHS` (5 runs = medalha) é o que já há" | `SEASON_PATHS` existe e **está desligado** | evidência corrigida; depende de WP4.16 |
| WP4.13 | "faixa nunca desce" só pelo reset mensal | a faixa desce por **três** caminhos: derrota própria (−8), ser oponente sorteado (−4, sem jogar) e o reset. `tournamentTiers` testa só o cálculo, não `playMatch` | spec emendada: faixa deriva de contador **monotônico** (`wins`/pontos ganhos), teste exercita `playMatch` |
| WP4.1 / guia | `daysToEvolve` é "dado morto" | é dado morto **exibido**: `GuideModal` mostra 10/20/30/40 e `App.tsx` passa `daysToEvolve` ao HUD; o gate real é `required` (4/5/5/6) | **WP4.17** corrige o guia independentemente de D5 |
| WP1.6 | "data de nascimento no dia do jogador" | **não existe campo** de nascimento do pet (o único `createdAt` é de `Task`) | pré-requisito **WP1.16** (`bornAt`) |
| WP0.5 | `VERIFICADO` | verificado = schema + paridade + política. **7 dos 9 eventos novos nunca são emitidos** (`reveal_seen`, `milestone`, `shield_used`, `welcome_back`, `evolve`, `dungeon_run`, `bond_level`). A régua das ondas 1–4 não existe ainda | ledger anotado; fiação em **WP2.15** e nos WPs donos |
| Métrica-farol | "esforço por ativo" | `effort_sum / day_active` (`applyAggregate`) é **média** — exatamente o que I.4 #1 e C6 proíbem | **WP0.8** (histograma no servidor) |
| Guia I.4 | "aha moment por coorte é implementável com os ~20 eventos" | falso sem D2 (`metrics.js` declara) | item do WP0.4 |
| Guia H.3 / D7 | "a cura instantânea é a ÚNICA peça que vende HP" | são **duas**: `BITS_EXCHANGE` (1 Crédito = 10 Bits) + `heart-item` (150 Bits) = **15 Créditos → +1 coração, sem cap** | **D15** amplia D7 |
| Guia E #36 | seasons do Torneio "a fazer, esforço G" | `closeSeason`, `trophies` e as vitrines **existem**; falta só o cron | **WP4.18** (PP) |
| Guia M-2 e M-6 | recomendações P0/P1 | **nenhum WP** as cobria — escorregaram entre guia e plano | **WP5.6** e **WP5.7** |
| `dungeon.ts` | cabeçalho: "resets monthly", "daily play limit", "losing costs a heart" | as três são falsas (semanal, sem limite, sem custo) — mesma família do "roster de 60" | **WP4.20** |
| LEDGER | comando de contagem `### WP` → 50 | o comando devolve 36; os +14 são linhas da tabela de §13 | comando corrigido no LEDGER |

### 14.2 Duplicidades fundidas (três guardas, um número)

- **C-N8 ↔ C-V4** (`bornAt` × `soulmonMeta.bornOn`): UM campo, UM nome → **WP1.16**.
- **C-C6 ↔ C-V7** (`welcome_back` proposto duas vezes): um emissor → **WP2.15**.
- **C-V5** (frases do widget) é o conserto do veto E1, que já tem WP → **adendo ao WP2.6**, sem pacote novo.
- **C-S2** (travas de forma no relatório) → **adendo ao WP5.1b**, sem pacote novo.
- **C-C2** ("dias juntos") é uma segunda fonte para "há quanto tempo" (× `bornAt`) — fica, mas lê de `bornAt` quando existir, nunca de `saveDaysLived` em paralelo.
- **C-N9 ↔ C-V6 ↔ WP3.4**: uma fonte única de copy de push (`_pushCopy.js`); **WP0.11** mede o efeito.

### 14.3 Pacotes novos (36) — estado inicial `PROPOSTO`, salvo indicação

| WP | Área | Origem | Spec resumida (o completo está no estudo do guarda) | Parecer | Tam. | Aceite / comando |
|---|---|---|---|---|---|---|
| WP0.8 | medição | C-M1 | `effort_bucket.<0..4>` no `applyAggregate` (servidor); mediana por bucket, média rotulada | APROVADO | PP | `grep -q effort_bucket functions/api/metrics.js` + `metrics.test.js` |
| WP0.9 | medição | C-M2 | `purchase { tier, reason 0..4 }`, 4 = onboarding; `bump('purchase.<reason>')` | RESSALVA (#18: política PT/EN) | PP | `grep -n "purchase: { tier" telemetry.ts metrics.js` mostra `reason` nos dois |
| WP0.10 | medição | C-M3 | `after_bad_day { gap 0..3, kind 0..1 }` fechado no aparelho (chave local nunca enviada); viés declarado no GET | RESSALVA (#18/#20: bucket sem data; propósito = convite de carinho, nunca calibrar cobrança) | P | `grep -q after_bad_day telemetry.ts metrics.js privacidade.html` |
| WP0.11 | medição | C-M4 | `app_open { source 0..3 }` dedupe por dia e origem; `sw.js` abre `/?src=push`; `push_optout` | RESSALVA (**#19**: `app_open.push` só para CORTAR push que abre sem `day_active`; bump `CACHE_VERSION`) | P | `grep -q app_open …` + `grep -q "src=push" public/sw.js` |
| WP0.12 | medição | C-M5 | `reveal_seen.duration 0..3` em memória; junto da fiação de WP1.1 | APROVADO | PP | `grep -q "duration: { min: 0, max: 3 }" telemetry.ts metrics.js` |
| WP0.13 | medição | C-M6 | `haunted_done` em `completeTask` quando `isHaunted` | APROVADO | PP | `grep -q haunted_done telemetry.ts metrics.js` |
| WP0.14 | medição | C-M7 | `checkin_shown` (`ONCE_PER_DAY`) onde `needsCheckIn` abre o modal; denominador de `checkin_commit` | APROVADO | PP | `grep -q checkin_shown telemetry.ts metrics.js` |
| WP1.9 | nascimento | C-N1 | Ao avançar de `GOAL_STEP` com texto, o `STRUGGLE_STEP` abre com "Anotado. Seu Soulmon vai lembrar disso." (ecoa só `soulGoal`) | APROVADO | PP | `grep -c 'vai lembrar disso' SoulmonOnboarding.tsx` → 1 |
| WP1.10 | nascimento | C-N2 | Bifurcação diz custo (`SOUL_TEST_ITEMS.length`, ~2 min) e o que muda; nunca "melhor" | APROVADO | PP | `grep -c 'afinam quem' …` → 0; bloco sem `melhor\|better` |
| WP1.11 | nascimento | C-N3 | `hint` por pergunta dizendo QUAL eixo alimenta; linha-fôlego a cada 5 itens | RESSALVA (trava: só de onde vem, nunca como ela vai ser; o hint não ensina a mirar) | P | teste: nenhum hint casa `teimos\|brincalh\|tímid\|stubborn\|playful\|shy` |
| WP1.12 | nascimento | C-N4 | 3 chips de tonalidade no demo (`demoTint`, `hue-rotate` no palco); zero mecânica; screenshot obrigatório | APROVADO | P | `grep -c demoTint sprites.ts GameStateContext.tsx` ≥ 1 cada |
| WP1.13 | nascimento | C-N5 | Consent sem o parágrafo redundante; links, caixa, idade e ORDEM intactos | RESSALVA (aceite = teste de `consent.ts`, não `≤3 <p>`) | PP | `npx vitest run src/utils/consent` |
| WP1.14 | nascimento | C-N6 | Tela do link mágico com sprite/silhueta + fala; depende de WP1.1 | APROVADO | PP | `awk '/link de acesso/,/<\/div>/' … \| grep -c '<img'` ≥ 1 |
| WP1.15 | nascimento | C-N7 | Campo `onb-petname` vai para o REVEAL; botão "Nascer {nome}"; `REGISTER` fica com nick + e-mail | APROVADO | P | REVEAL contém `onb-petname`, REGISTER não; `oracleDraft.test.ts` |
| WP1.16 | nascimento | C-N8 + C-V4 | `bornAt` (dia do jogador) gravado UMA vez em `handleCompleteOnboarding`; save antigo **nunca infere**; exibido como DATA; na virada, `anniversary: 'month'\|'year'` no `lastDayReport` → fala 1× do HUD; **sem XP, sem push**. Upgrade = "trocou de pele" (mantém `bornAt`) — confirmar com o dono | RESSALVA (footgun 9: um campo; #5: nada persistido além da data) | P | `grep -c bornAt GameStateContext.tsx App.tsx dailyReset.ts` ≥ 1 cada |
| WP1.17 | nascimento | C-N9 | Push D1/D2 na voz do pet (D1 = dia SEGUINTE ao nascimento); copy em `_pushCopy.js`; só opt-in; `bornAt` na KV morre com a subscription | RESSALVA (**#19**/#18: nunca D0, sem condição de meta, fonte única com WP3.4) | P | `node --test functions/api/_pushCopy.test.js` com `ageDays` 1/2/3 |
| WP2.10 | constância | C-C1 | A intervenção never-miss-twice EXISTE: hábito com `needsIntervention` ganha "Só 5 minutos hoje" no check-in/lista; aceitar = `completeHabit` normal; nunca conta faltas | RESSALVA (**#17**: perdão já contado saindo do papel; "5 min conta" só na 2ª falta) | M | `grep -c needsIntervention App.tsx MorningCheckIn.tsx` ≥ 1 fora de comentário |
| WP2.11 | constância | C-C2 | "N dias juntos" na `StatsPage` (de `bornAt` quando existir); obedece `hideMetrics`; não vai a widget/perfil; renomear `streakDays` → `perfectDaysTotal` | RESSALVA (#14/#21: só sobe; uma fonte) | P | `grep -q saveDaysLived\|bornAt StatsPage.tsx` |
| WP2.12 | constância | C-C3 | Selo do dia quando `focusComplete`; nunca "2 de 3"; some na virada sem toast; sem recompensa | RESSALVA (#16/#9) | P | `grep -c focusComplete App.tsx HomeHud.tsx` ≥ 1 |
| WP2.13 | constância | C-C4 | `HABIT_CHEER_AT = [3, 36, 51]` em `taskModel.ts` + `cheerReached`; só fala do pet; nunca "faltam N" | RESSALVA (#16: sem bônus; cadência única com WP3.2) | P | `grep -q HABIT_CHEER_AT taskModel.ts`; `HABIT_MILESTONES` inalterado |
| WP2.14 | constância | C-C5 | `RARE_CHEER_RATE` (~5%) de fala rara ao concluir; ZERO efeito material; nunca anunciada | RESSALVA (#16: valor zero; taxa nunca vira alavanca) | P | teste com RNG fixo: recompensa idêntica com/sem sorteio |
| WP2.15 | constância | C-C6 + C-V7 | Emissores: `welcome_back { days }` (bucket) no efeito do relatório, `shield_used` no hook da virada, `bond_level` derivado na hora | RESSALVA (#18: bucket; #5: nunca persistir nível) | PP | `grep -c "'welcome_back'\|'shield_used'\|'bond_level'" App.tsx hooks/*.ts` ≥ 1 cada |
| WP3.8 | vínculo | C-V1 | `useEffect` sobre `triggerMessage` → `speak()` de alívio; o `toast` sai do `App.tsx` | APROVADO | PP | `grep -A3 triggerMessage CompanionHUD.tsx \| grep -q useEffect` |
| WP3.9 | vínculo | C-V2 | "Sou companhia, não tratamento." 1×/sessão + `chatSafety.ts` (léxico local → resposta fixa + CVV 188 / linha EN, **sem Groq**); condição de saída de WP3.1 | RESSALVA (#18: frase que casou NUNCA vira telemetria/save; nunca push) · **BLOQUEADO:D16** | M | `grep -q chatSafety ChatBox.tsx && npx vitest run chatSafety` |
| WP3.10 | vínculo | C-V3 | Uma fala extra por traço (`petPassive`) em feed/rub/hp-low/poop/dungeon; `TRAIT:` como enum para a IA | APROVADO | P | `grep -q petPassive CompanionHUD.tsx` |
| WP3.11 | vínculo | C-V6 | Ligar `sleepReminderAt` no `NotificationManager` (1×/dia, só com janela e notificações ligadas, nunca dormindo); copy em `_pushCopy.js` | RESSALVA (#12/#19: sem hora, sem "deveria", sem condição de meta) | P | `grep -q sleepReminderAt NotificationManager.tsx` |
| WP4.15 | permanência | C-P1 | Ligar `BOND_REWARDS`: ponto único no `App.tsx` lê `unclaimedBondRewards`, entrega (`ownedFurniture`/`ownedBackgrounds`/`collectDream`), grava `bondRewardsClaimed`; idempotente; item já possuído marca `claimed` sem refund | RESSALVA (Bits: nada de moeda) | P | `grep -c unclaimedBondRewards App.tsx` ≥ 1 |
| WP4.16 | permanência | C-P2 | `GameState.season`; `ensureSeasonProgress`/`applySeasonMedal` na virada; bloco na aba Missões com `seasonLabel`, caminhos só com `current ≥ 1`, medalha-selo; saudação 1× no primeiro dia | RESSALVA (**#15**/E4: virada nunca parece prazo; sem "faltam N dias"; sem push) | P | `grep -rn "ensureSeasonProgress\|applySeasonMedal" dailyReset.ts App.tsx` ≥ 2 |
| WP4.17 | permanência | C-P3 | Guia e HUD leem o MESMO símbolo que `handleEvolve` (`required`); `daysToEvolve` sai da tela | APROVADO | PP | `grep -c daysToEvolve GuideModal.tsx App.tsx` → 0 |
| WP4.18 | permanência | C-P4 | Cron mensal em `workers/push-scheduler.js` chama `closeSeason` (idempotente: `closed:<season>`) | APROVADO | PP | `grep -n closeSeason workers/push-scheduler.js` ≥ 1 |
| WP4.19 | permanência | C-P5 | Rota de redenção: re-evoluir após `degeneratedByHP` marca `redeemed` (variante cosmética, lê como prestígio); só após WP4.2 | RESSALVA (#21: nunca marca de queda; exibir é escolha do jogador) · **BLOQUEADO:D6** | M | `grep -n redeemed dailyReset.ts App.tsx` ≥ 2 |
| WP4.20 | permanência | C-P6 | Reescrever o cabeçalho de `dungeon.ts` com o que o código faz | APROVADO | PP | `grep -c "resets monthly\|daily play limit\|costs a real heart" dungeon.ts` → 0 |
| WP4.21 | permanência | C-P7 | Silhueta (`blur(6px) brightness(0.3)`) da próxima forma no nó `forecast` quando o sprite existe; sem sprite, silêncio | APROVADO | P | `grep -n blur EvolutionPath.tsx` ≥ 1 |
| WP5.6 | sustento | C-S1 | Copy do `UnlockAccountModal`: título "cresce porque você cresce", 3 perks como resultado (sem "Reroll liberado"); a frase "pagar nunca deixa mais forte" **só depois de D15** (hoje seria mentira) | RESSALVA (#13/verdade) | PP | `grep -q "cresce porque você cresce" UnlockAccountModal.tsx && ! grep -q "Reroll liberado" …` |
| WP5.7 | sustento | C-S4 | Reroll → "Nova Leitura" determinística: reabre as 6 perguntas preenchidas; seed = `hash(respostas + contador)`; "aleatoriamente" sai de `CreditsModal`/`termos.html` | RESSALVA (tela diz "mesma resposta = mesma criatura" ANTES de cobrar) · **BLOQUEADO:H.4** | M | `grep -n Math.random App.tsx \| grep -i reroll` vazio |
| WP5.8 | sustento | C-S5 | `formattedPrice` da Play via `BillingPlugin.kt` → `getLocalizedPrice(sku)`; rótulo BRL vira fallback | APROVADO · **requer APK** (agrupar com WP0.6) | P | `grep -q formattedPrice BillingPlugin.kt && grep -q getLocalizedPrice playBilling.ts` |

**Adendos a pacotes existentes** (sem número novo): WP2.6 absorve C-V5 (frases do
widget PT/EN sem cobrança, JSON único com paridade); WP5.1b absorve C-S2 (o pet
celebra e NÃO menciona compra; nunca modal por cima; recusa vale 2 semanas);
WP2.1 ganha "métrica de decisão = `week_active`, não `day_active`; `welcome_back`
emitindo antes"; WP2.4 tira a linha "este hábito já rende mais" (anúncio de
recompensa, C4); WP3.1 ganha `ORIGIN:` por enum e WP3.9 como condição de saída;
WP0.1 ganha a spec do leitor (`tools/metrics-read.mjs` com as 5 regras de Greer:
`n` em toda linha, mediana, eixo em zero, razões só na mesma janela, nada de
conversão com < 30 dias) — escrevível ANTES da chave; WP0.4 ganha 4 itens (07 §0
"nenhuma telemetria", 07 §3 "PostHog", I.4 "implementável", F "saveId").

### 14.4 Decisões novas para o dono (continuação das seções 10 e 13.6)

| # | Decisão | Fonte |
|---|---|---|
| D15 | **Amplia D7.** Além da cura instantânea, o trilho Créditos → Bits → 💗 vende +1 coração por 15 Créditos sem cap. A linha vermelha **vetou** a opção "aceitar e nomear" (#13: dinheiro comprando a volta do único recurso que a punição tira). Alternativa proposta: 💗 sai da loja de Bits e fica só como drop da masmorra; o câmbio serve a cosmético. O guarda do sustento recomendava nomear. **É sua a escolha** — e ela fecha ou não D7 de verdade | `estudo/sustento.md` C-S3 · `vetos.md` |
| D16 | **Texto de saúde mental no chat** (WP3.9): a linha "Sou companhia, não tratamento" e a ponte para o CVV 188 (PT) / linha internacional (EN). O corpus (02 rec 17, B.5) diz que memória de chat sem isto é irresponsável. Precisa da sua palavra por ser texto sobre saúde | `estudo/vinculo.md` C-V2 |
| D17 | **Upgrade é "nasceu de novo" ou "trocou de pele"?** Decide se `handleUpgradeRevealed` reescreve `bornAt` (WP1.16). Padrão assumido: trocou de pele (mantém a data) | `estudo/nascimento.md` C-N8 |
| D4 (sobe) | A aura (WP2.2) **vai doer**: A2 relata reações intensas à marca dourada do Duolingo. Não é "pode a aura ser a única coisa que dói?", é "você aceita que ela seja?" | `estudo/constancia.md` §2 |

### 14.5 Onde as fontes discordam (registrado, não reaberto)

Degeneração: 04 §1 ("acidente domesticado") × anexo F (pré-requisito do Ultra) —
os dois certos sobre partes diferentes; só WP4.2 resolve. Live-ops: 07 #13
"visita especial" × C2 "ruído desacoplado" — C2 vence (`via transcrição`).
Cadência de conteúdo: 07 mensal × `seasons.ts` trimestral — trimestral, porque
o código mediu custo e o relatório não. Trial: rel. 06 contradiz a si mesmo
(maior alavanca × comprador direto out-earns) — WP5.4 leva os dois números ao
dono. Priming de push: 05 rec.10 "após a 1ª tarefa (D0)" × guia S-7 "D2–D3" —
mantido D2–D3 (D0 é o dia de maior risco, pela própria fonte). Widget: rel. 07
"2/4 hoje" × Mobbin sem dígito abaixo da meta — decidido, Mobbin.

## 15. As decisões do dono — RESPONDIDAS (06/09/2026)

As dezesseis perguntas em aberto das seções 10, 13.6 e 14.4 foram respondidas de
uma vez. **Nenhum pacote continua bloqueado por decisão** — o plano sai de 11
bloqueados para zero. O que segue é a resposta e o que ela manda fazer.

| # | Resposta | O que muda no código |
|---|---|---|
| **D1** | **Escrever o leitor primeiro, chave depois** | `tools/metrics-read.mjs` nasce agora, testado, com as 5 regras de Greer embutidas (`n` em toda linha, mediana, eixo em zero, razões só na mesma janela, nada de conversão com < 30 dias). A chave entra quando o dono quiser e a leitura já está pronta. WP0.1 sai do bloqueio sem depender de ninguém |
| **D2** | **Aprovado o ledger local** | WP0.2 destravado. A conta de retenção fecha NO APARELHO (precedente `WeekLedger`) e só inteiros saem. Nenhum id, nenhuma coorte no servidor |
| **D3** | **Escudo fica em 3** | WP2.1 **RECUSADO**, com motivo registrado: os escudos do Duolingo são DADOS, os nossos são CONQUISTADOS (1 a cada 7 dias de boa constância). O 3º só existe para quem teve 21 dias bons — exatamente o público que o dado deles diz que não precisa dele. O dado não transfere |
| **D4** | **A aura é o que dói, e só ela** | É a régua das ondas 2 e 4. A aura (`steadyWindow`) some em silêncio, sem toast, sem número, sem aviso prévio. **Nenhuma outra mecânica ganha peso de perda** — e nenhum perdão novo entra sem passar por esta régua (o `BLOQUEADO:D4` genérico do `vetos.md` está respondido) |
| **D5** | **Apagar `daysToEvolve`** (opção b) | O gate é `required` (4/5/5/6) e ponto final. O campo sai de `FORM_REQUIREMENTS`, do teste de progressão e do save. A escada fica curta e honesta. WP4.1 vira uma remoção, não um redesenho |
| **D6** | **Ultra sem degeneração forçada** | WP4.2 destravado: o topo deixa de exigir que o jogador machuque a criatura de propósito. WP4.19 (rota de redenção) volta a ser o que devia — o capítulo de quem caiu, não o caminho oficial — e segue DEPOIS dele |
| **D7 + D15** | **Fechar os DOIS caminhos** | A opção máxima. Remover a cura instantânea por Créditos **e** tirar o 💗 da loja de Bits (fica só como drop da masmorra). O câmbio Créditos→Bits serve a cosmético. É a única resposta que deixa "dinheiro nunca compra cuidado" verdadeiro **sem asterisco** |
| **D8** | **Enum, nunca texto** | A camada 2 do WP1.4 e do WP3.1 volta a viver, mas o que a pessoa escreveu **nunca sai do aparelho**: o app classifica localmente em categorias fechadas e manda só o código. `_redact.js` continua barrando texto livre |
| **D9** | (não é pergunta) | Continua sendo ordem: ligar `PLAY_REQUIRE_ACCOUNT_BINDING` só DEPOIS do APK do WP0.6 |
| **D10** | **Vitalício + cosmético trimestral** | WP5.4 destravado, e a spec já sai decidida: ~R$ 9,90/trimestre **só de cosmético**, nunca mecânica nem cuidado; sem trial; nada expira (regra 1 das estações). Quem não assina não perde nada |
| **D11** | **Som só em resposta a gesto** | WP3.5 destravado com a fronteira escrita: som quando o jogador toca, chega ou faz carinho — nunca idle, nunca com `document.hidden`, 1× por sessão. É o que separa "vivo" de "alarme" |
| **D12** | **A árvore grátis NÃO ramifica — e a copy muda** | O `UnlockAccountModal` para de prometer que a árvore demo "leva ao mesmo lugar". O modo grátis passa a ser uma demonstração declarada, sem eufemismo. **Trabalho novo: WP5.9** |
| **D13** | **Ratificadas as duas ressalvas** | Escudo continua ">0 only" (o código já é melhor que a decisão original). A criatura do amigo no estágio real fica **vetada no código até WP4.11 fechar** — a tela só pode mostrar GALHO, nunca ALTURA |
| **D14** | **Só meta somada + kudos** | Parceria aprovada só nessa forma. Ninguém vê o déficit do outro, ninguém é notificado da falha alheia. Nenhum WP atual depende disto |
| **D15** | ver **D7** | — |
| **D16** | **PARCIAL: só a ponte, sem o aviso** | WP3.9 destravado em forma reduzida. Entra o `chatSafety.ts` (léxico local desvia da IA, resposta fixa na voz do pet, CVV 188 em PT / linha internacional em EN, sem alarme e sem push). **NÃO** entra a linha "sou companhia, não tratamento" — a escolha foi não quebrar a magia na primeira fala. Continua sendo condição de saída do WP3.1 |
| **D17** | **Trocou de pele — mantém a data** | `handleUpgradeRevealed` **não** reescreve `bornAt`. Quem joga há 40 dias continua tendo 40 dias juntos depois de comprar. WP1.16 sai com a spec fechada |
| **H.4** | **"Nova Leitura" determinística** | WP5.7 destravado. A semente passa a vir das respostas, não do acaso: mesma resposta, mesma criatura. Fecha a **única violação declarada da lista de proibições que ainda estava de pé no código** (#16, sorteio pago) e tira o vocabulário de gacha do `CreditsModal` e do `termos.html` §5 |

### 15.1 O que as respostas dizem juntas

Três delas formam uma posição, e vale registrar que ela é coerente:

**D4 + D7/D15 fecham a tensão que o plano carregava desde a rodada 3.** O
produto empilhava perdões para o coração não doer **e** vendia a cura por
dinheiro — se não dói, a cura não vale 10 Créditos; se vale, há incentivo para
fazer doer. A resposta corta pelos dois lados: o que dói passa a ser a aura
(cosmética, que ninguém pode comprar de volta) e o coração deixa de ser
comprável por qualquer caminho. Depois disto, "dinheiro nunca compra cuidado"
para de precisar de nota de rodapé.

**D3 e D5 são as duas recusas, e as duas são recusas de acrescentar.** Manter o
escudo em 3 recusa importar um dado que não transfere; apagar `daysToEvolve`
recusa esticar o jogo com um campo que já enganou três consumidores diferentes.

**D12 e D16 são as duas respostas que abrem mão de algo.** O modo grátis assume
que é demonstração em vez de fingir paridade, e o chat abre mão do disclaimer
para não quebrar a ilusão logo na abertura — mantendo a rede de proteção, que é
a parte que protege a pessoa e não o produto.

### 15.2 Pacote novo que nasceu das respostas

| WP | Área | Spec | Aceite |
|---|---|---|---|
| WP5.9 | sustento | **D12:** o `UnlockAccountModal` para de dizer que a árvore demo "leva ao mesmo lugar". A copy passa a nomear o modo grátis como demonstração — sem eufemismo e sem tom de punição. Cruza com WP5.6 (a copy do mesmo modal), então sai no mesmo lote | `grep -c "mesmo lugar" src/components/UnlockAccountModal.tsx` → 0 + render test PT/EN |
