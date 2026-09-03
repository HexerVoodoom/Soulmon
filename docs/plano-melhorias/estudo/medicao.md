# Estudo × código — Medição (guarda-medição)

**Data:** 03/09/2026 · **Guarda:** `soulmon-guarda-medicao` · **Domínio:** WP0.1–0.5, WP0.7 · **Ledger:** `../ledger/medicao.md` (não editado por este estudo — o consolidador integra depois da linha vermelha).

> **O fato que rege tudo abaixo:** a telemetria do Soulmon já existe e está em produção — `src/utils/telemetry.ts` (`EVENT_SCHEMA`, hoje **19 eventos**) + `functions/api/metrics.js` (agregado diário `m:<dia>` em KV, `onRequestGet` fail-closed em 404 sem `METRICS_ADMIN_KEY`). O relatório 07 e a seção F do guia foram escritos como se ela não existisse ("o Soulmon não tem NENHUMA telemetria"). Este estudo lê o corpus inteiro contra o código real, e o resultado mais importante não é o que falta — é **o que já está no schema e nunca é emitido**.

## Fontes lidas (inteiras)

- `docs/guia-experiencia/08-transcricoes-notebooklm.md` — blocos **A1** (Shuttleworth/Duolingo, com timestamps da repergunta), **A2** (Tim Gabe + Duolingo, tabela de mecânicas com dado), **A3** (NN/g × Gabe × Isford), **C6** (Emily Greer, GDC — "Data-Driven or Data-Blinded"; Mia Consalvo — teste ético).
- `docs/GUIA-EXPERIENCIA.md` — seções **E** (roadmap, metas), **F** (plano de telemetria mínimo), **I.4** (correções de Greer), I.6.
- `docs/guia-experiencia/07-retencao-engajamento.md` — §1 benchmarks, §2 mapa de churn com "sinal de confirmação", §3 plano de ~20 eventos, §4 pushes medidos, §7 "quando A/B é fantasia".
- `docs/guia-experiencia/05-onboarding.md` — §2 fricções, §4 #16 (alvos de tempo até o reveal).
- `docs/plano-melhorias/E-telemetria.md` e `docs/plano-melhorias/ledger/medicao.md`.
- Código: `src/utils/telemetry.ts`, `functions/api/metrics.js`, `src/utils/telemetry.test.ts`, `src/components/telemetryWiring.render.test.tsx`, `public/privacidade.html`, os `track(` de `src/App.tsx`, `SoulmonOnboarding.tsx`, `UnlockAccountModal.tsx`, `public/sw.js`.

## Estado verificado do código (03/09/2026 — comandos rodados)

```
$ npx vitest run src/utils/telemetry.test.ts functions/api/metrics.test.js \
    src/components/telemetryWiring.render.test.tsx src/utils/saveSize.test.ts
 Test Files  4 passed (4)
      Tests  115 passed (115)

$ grep -rn "track('" src --include=*.ts --include=*.tsx | grep -v test | grep -v utils/telemetry.ts
App.tsx: install · first_task_done · demo_cap_hit (×3) · activity_create (×2) · unlock_view · purchase · checkin_commit
SoulmonOnboarding.tsx: onboarding_step · purchase · demo_pick
UnlockAccountModal.tsx: unlock_dismiss
telemetry.ts (trackDayClosed): day_active · week_active

$ grep -rn -E "track\('(reveal_seen|milestone|shield_used|welcome_back|evolve|dungeon_run|bond_level)'" src | grep -v test
(vazio)
```

**Achado central deste estudo:** dos 19 eventos do schema, **12 são emitidos** e **7 existem só no schema** (`reveal_seen`, `milestone`, `shield_used`, `welcome_back`, `evolve`, `dungeon_run`, `bond_level`). Isso é *coerente* com o WP0.5 ("schema, sem UI ainda") — a fiação foi delegada aos WPs 1.1/2.1/2.4/2.6/4.x —, mas significa que **toda meta do plano que cita um desses sete não é calculável hoje**, e o ledger marca WP0.5 `VERIFICADO` sem dizer isso. Ver "Meta → evento → calculável?".

Outras ausências confirmadas por grep (`NÃO ENCONTRADO`): `heart_lost`, `degeneration`, `session_start`, `push_opened`, `push_optout`, `widget_tap`, `care_action`, `layer3_used`, `error`; qualquer framework de experimento/A-B; `tools/metrics-read.mjs` (o leitor do WP0.1) — `ls tools` → "No such file or directory", nem em `/home/user/Core/tools`. `public/sw.js` `notificationclick` só faz `clients.openWindow('/')`, sem marcador de origem.

---

## 1. Tabela de três colunas

Vereditos: **já faz** · **lacuna** · **conflita com a tese** · **não se aplica** · **já coberto por WP (qual)**.

### 1.1 Método de leitura de métrica — C6 (Emily Greer, GDC) e I.4

| O que a fonte diz (fonte + bloco) | O que o Soulmon faz hoje (arquivo + símbolo) | Veredito |
|---|---|---|
| **C6 §3 "Normal Curve Lie"**: métricas de jogo seguem power law; usar **medianas**, não médias; testes não-paramétricos (Wilcoxon). I.4 #1 repete. | `metrics.js` `summarizeNorthStar` lê a métrica-norte de um **histograma** (`week_active.goal_days.<n>`) — mediana de `goal_days` é calculável. **Mas** o "esforço por ativo" é declarado como `effort_sum / day_active` no comentário de `applyAggregate` — isso é **média**, e `effort` (0–500) só é somado, nunca histogramado. | **conflita com a tese** (parcial): a metade "≥4 de 7" segue Greer; a metade "peso de esforço por ativo" é a média que ela proíbe. → **C-M1** |
| **C6 §2**: amostras minúsculas ao fatiar coortes; **sempre exibir o tamanho da amostra** (I.4). | `summarizeNorthStar` devolve `weekly_active` (o *n*) junto com `on_target` e `rate`; `rate` é `null` quando n=0 ("zero sobre zero exibido como 0% é o jeito mais rápido de decidir a partir de um número que não existe"). | **já faz** (no JSON; não há gráfico ainda — WP0.1) |
| **C6 §5**: eixo Y cortado induz pânico; **eixo no zero** (I.4). | Não há gráfico nem leitor: `tools/metrics-read.mjs` do WP0.1 **NÃO ENCONTRADO**. | **já coberto por WP (WP0.1)** — a regra precisa entrar na spec do leitor, ver §3 |
| **C6 §1 "Audience Mix"**: fatiar por país, canal, aparelho, idade. | `EVENT_SCHEMA` só fatia por `tier` (demo/pago) e `funnel`. Não existe país/canal/aparelho em nenhum evento — e o cabeçalho de `telemetry.ts` (princípio 6) proíbe fingerprint. | **conflita com a tese** — e a tese vence: país+aparelho+dia é quase-identidade. O único fatiamento legítimo é o que já existe (`tier`) e, no máximo, `funnel`. Registrar como limite declarado, não como lacuna. |
| **C6 §4 cherry-picking**: olhar média e mediana juntas; paranoia analítica. | `onRequestGet` devolve `days` (por dia) **e** `totals` (somado), dando os dois olhares. Sem mediana de esforço (ver linha 1). | **já faz** parcialmente; depende de C-M1 |
| **C6 §6 correlação ≠ causalidade**: só A/B controlado separa. **07 §7**: abaixo de ~1k usuários A/B é fantasia; sequência = descritivo → 5 entrevistas → fake door → A/B com >2–3k/braço. | Nenhum framework de experimento no código (grep `experiment|variant|abTest` só acha usos não relacionados em `DinoGame`, `NightmareBattle`, `ScreenSkeleton`). A telemetria é **descritiva por desenho**. | **já faz** (por omissão correta). O corpus sustenta não ter A/B hoje. |
| **C6 §7 atribuição**: atribuir ao teste **quando toca o recurso**, não no login; rodar semanas, não dias. | `unlock_view`/`unlock_dismiss` só disparam ao **abrir** a tela de compra (`App.tsx` `setUnlockReason` → `track('unlock_view')`; `UnlockAccountModal` "Agora não" → `unlock_dismiss`). É exatamente "atribuir ao tocar". | **já faz** (precedente com evidência) |
| **C6 §8 / I.4 #2 "Office Space"**: nenhum experimento de monetização julgado antes de **30 dias**; olhar receita+retenção, não uma KPI. | `MAX_READ_DAYS = 92` em `metrics.js` — a janela de leitura comporta 30 dias com folga; TTL de 730 dias no `put`. A regra "30 dias" já está escrita em `PLANO-MELHORIAS.md` §2 "Regras de leitura". | **já faz** (infra) — a disciplina é de quem lê |
| **I.4 aha moment (YC/David Lee)**: medir o **achatamento da curva de coorte** sobre uma ação de valor real; "implementável com os ~20 eventos". | `metrics.js` cabeçalho: coorte é **impossível por desenho** ("não existe dia de INSTALAÇÃO em lugar nenhum, e portanto não existe coorte"); `notes.unreadable` no GET lista `retencao`, `D7`. A frase do guia ("implementável com os ~20 eventos") é **falsa** para o desenho atual. | **já coberto por WP (WP0.2)** — bloqueado por D2; e é uma mentira de documento para o WP0.4 |
| **C6 (Consalvo) §6 "data pack-ratting"**: pseudônimos; apagar dados ao fim do ciclo. | `sanitizeBatch` valida `batch.id` e **descarta** ("o pseudônimo é validado e JOGADO FORA aqui mesmo"); KV com `expirationTtl: 86400*730`; `telemetryId` é `crypto.getRandomValues`, sem relação com e-mail/saveId (teste "o pseudônimo não deriva do e-mail nem do saveId"). | **já faz** — e mais forte que a fonte pede (não há dado individual para apagar) |
| **C6 (Consalvo) §1–2**: consentimento informado, contínuo, revogável sem punição. | `setTelemetryEnabled(false)` **apaga a fila e o ledger da semana** (`K_QUEUE`, `K_ID`, `K_WEEK`); toggle em `SettingsPage` (`isTelemetryEnabled`/`telemetryConsentCopy`); testes "opt-out real". Ligado por padrão, justificado em `isTelemetryEnabled` (opt-in mediria "o funil dos curiosos"). | **já faz** |

### 1.2 O que medir — Guia F, 07 §3, 05 §4

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **07 §0 / F**: "o Soulmon não tem NENHUMA telemetria… o primeiro investimento é instrumentar". **E #1**: "instrumentar os ~20 eventos". | `telemetry.ts` (19 eventos, allowlist, opt-out) + `metrics.js` em produção. O guia E já risca o item #1 e aponta WP0.1/0.2. O relatório 07 **não** foi corrigido. | **já faz** — 07 §0 é documento que mente (WP0.4) |
| **F Ferramenta**: PostHog Cloud / Amplitude / Analytics Engine. | Princípio 2 em `telemetry.ts`: "SEM SDK DE TERCEIROS… contrato de privacidade que não escrevemos". `privacidade.html` §4 promete "não há Google Analytics, Firebase Analytics, Amplitude nem similar". | **conflita com a tese** — e a política pública já promete o contrário do que o guia recomenda. Recomendação da fonte é **inaplicável**. |
| **F Privacidade**: "identificar por `saveId` (hash), nunca e-mail". | Princípio 3: `saveId` **religaria métrica a conta**; `telemetryId` é aleatório local. `metrics.js`: "o `saveId` não aparece em lugar nenhum deste arquivo". | **conflita com a tese** — a fonte pede algo *menos* privado do que o código faz. Linha vermelha do guarda. |
| **F Privacidade**: não coletar texto de tarefa, `soulGoal`, psicometria, nascimento, humor; opt-out nas Configurações; declarar na Data Safety. | Allowlist rejeita evento inteiro com prop desconhecida (`sanitizeEvent`; teste "nome de tarefa passado como prop NÃO chega ao corpo"); `telemetryConsentCopy.never` lista tudo isso; opt-out em `SettingsPage`. **Data Safety**: só `docs/BILLING-SETUP.md` cita o formulário (para e-mail); não há checklist da seção 4 de telemetria ali. | **já faz** (código) · **lacuna** (doc: Data Safety não menciona os contadores) — pequena, cabe no WP0.4 |
| **F/07 §3 `onboarding_step {step_id, skipped}`** | `onboarding_step {step, funnel}` — `SoulmonOnboarding` `track('onboarding_step', { step: code, funnel })` a cada passo; `onboardingStepCode` mapeia ids negativos. `skipped` **NÃO ENCONTRADO** — mas GOAL/STRUGGLE pulados vs preenchidos não são distinguíveis. | **já faz** (o essencial, com `funnel` que a fonte nem pediu) · `skipped` é lacuna menor — e medir "pulou o textarea" tangencia conteúdo; deixar de fora |
| **07 §3 `onboarding_long_test {accepted}`**: o teste de 20 itens converte ou mata? | Derivável: `onboarding_step.paid.<REFINE_OFFER>` vs `.<REFINE_OFFER+1>` (`REFINE_OFFER = QUIZ_END`; 05 §1: passo 12 → itens 13..32). Aceitação = chegou ao 13 ÷ chegou ao 12. | **já faz** (por derivação; documentar no leitor do WP0.1) |
| **F `pet_revealed {duration_s, demo}`** | `reveal_seen {has_sprite, funnel}` no schema — **não emitido** (grep vazio). `duration_s` não existe; timestamp é proibido, mas *bucket* de duração não é. | **já coberto por WP (WP1.1 fia `reveal_seen`)** · duração → **C-M5** |
| **05 §4 #16**: alvos "demo <60s até reveal; oracle <4min", revisar o passo de maior queda a cada release. | Drop-off por passo: **já faz**. Tempo: **NÃO ENCONTRADO** (nenhum evento carrega duração). | **lacuna** → **C-M5** (bucket, não timestamp) |
| **F `task_created {type, effort, schedule_kind}`** | `activity_create {kind, path, tier}` — `App.tsx` em dois pontos. `effort` e `schedule_kind` ausentes. | **já faz** o denominador de ativação; `effort`/`schedule_kind` é lacuna de baixo valor (o esforço já chega agregado por `day_active.effort`) |
| **F `task_completed {…, was_haunted, was_focus}`** — insumo do farol | Não há evento por conclusão: o farol é `day_active {effort}` uma vez por dia (dedupe `ONCE_PER_DAY`), fechado em `trackDayClosed` a partir de `lastDayReport.done`. `was_haunted`/`was_focus` **NÃO ENCONTRADO**. | **já faz** o farol (melhor: menos eventos, mesma informação). `was_haunted` → conclusão de assombrada é a "peça mais Soulmon" (CLAUDE.md 👻) e ninguém mede se o bônus de alívio acontece. **lacuna** → **C-M6** |
| **F `perfect_day`** / **07 métricas derivadas "taxa de dia perfeito"** | `week_active.goal_days` = dias em que bateu o próprio `dailyGoalFor` — é a definição de dia perfeito no eixo esforço (`trackDayClosed` `goalMet`). | **já faz** |
| **F `heart_lost {hearts_after, cause}`** — "hipótese nº1 de churn" (07 §2) | **NÃO ENCONTRADO** em `telemetry.ts`; `computeDailyReset` calcula `heartsLost` (`dailyReset.ts`) mas não chega à telemetria. | **lacuna** → **C-M3** |
| **F `degeneration {days_since_install}`** | **NÃO ENCONTRADO**; `degeneratedByHP` existe em `dailyReset.ts`. `days_since_install` depende de D2. | **lacuna** → **C-M3** (sem a idade) |
| **F `evolution {stage, days_since_install}`** / 07 §2 "tempo mediano até 1ª evolução" | `evolve {level}` no schema, **não emitido**; `handleEvolve` em `App.tsx` não chama `track`. `days_since_install` impossível sem D2. | **já coberto por WP (WP4.x fia `evolve`)** · tempo até evolução → bloqueado por D2 |
| **F `welcome_back {days_away}`** | `welcome_back {days}` (bucket 0–3) no schema, **não emitido**; `computeDailyReset` tem `daysAway`/`wasAway`. | **já coberto por WP (WP3.x)** — mas nenhum WP de fiação está nomeado no ledger deste guarda |
| **F `checkin_done {focus_count, mood_answered}`** | `checkin_commit {focus_count}` **emitido** (`App.tsx`, `MAX_DAILY_FOCUS`). `mood_answered` ausente; humor está em `never` da política. | **já faz** · `mood_answered` (bool) não é conteúdo, mas roça a promessa pública — deixar fora |
| **F `care_action {kind}`** (carinho/comida/banho/dormir) | **NÃO ENCONTRADO**. | **lacuna** sem candidata: mede vício de toque, não a promessa; 07 §3 diz "tempo de sessão é anti-indicador" e care_action é da mesma família. Não propor. |
| **F `layer3_used {feature}`** | Só `dungeon_run {floors}` no schema (não emitido). Torneio/Dino/Loja/Sonhos: **NÃO ENCONTRADO**. | **lacuna** parcial → coberta por WP4.x para masmorra; o resto fica para depois de WP0.1 mostrar se alguém chega lá |
| **F `push_received/push_opened {campaign, hour, channel}`** / 07 §4 "todo push mensurado" | `sw.js` `notificationclick` → `clients.openWindow('/')` sem marcador; nenhum `track` no SW (ele não importa `telemetry.ts`). `hour` seria fingerprint parcial. | **lacuna** → **C-M4** (só `source` enum, sem hora, sem campanha por texto) |
| **F `push_optout`** — guarda-corpo | `handleToggleNotifications` em `App.tsx` não chama `track`. **NÃO ENCONTRADO**. | **lacuna** → **C-M4** |
| **F `session_start {source}`** / 07 guarda-corpo "aberturas/dia sem conclusão ↑" | Não existe evento de abertura: `day_active` exige `effort > 0` ("abrir o app não é atividade", teste `trackDayClosed`). Logo "aberturas sem conclusão" **não é calculável**. | **lacuna** → **C-M4** (`app_open` 1×/dia, com `source`) |
| **F `widget_tap`** | **NÃO ENCONTRADO**. Deep link do widget não marca origem. | **lacuna** → dentro de **C-M4** (`source = widget`) |
| **F `paywall_view / purchase {sku, origem do nudge}`** | `unlock_view {reason, tier}` + `unlock_dismiss {reason}` + `purchase {tier}`. `purchase` **não carrega `reason`**: `handleAccountUnlocked` chama `track('purchase')` sem prop e depois `setUnlockReason(null)`. | **já faz** o funil de oferta · **lacuna** na atribuição da compra ao convite → **C-M2** |
| **F `error {code}`** | **NÃO ENCONTRADO**. | **lacuna** de baixa prioridade; sem candidata (princípio 5: telemetria não pode virar canal de erro) |
| **07 métricas derivadas "DAU/MAU"** | DAU ≈ `day_active` (ativo = concluiu). MAU exige identidade entre dias — impossível (`metrics.js` cabeçalho: "frequência por pessoa… a versão mensal não"). | **não se aplica** por desenho (declarado) |
| **07 §3 "tempo de sessão é anti-indicador"** | Nenhum evento carrega duração ou hora; teste "nenhum timestamp de precisão alta no corpo". | **já faz** |
| **07 guarda-corpo "% de humor negativo em dias de perda de coração"** | Humor nunca sai (`never` em `telemetryConsentCopy`; política §4). | **conflita com a tese** — linha vermelha; não medir |
| **07 §2 sinal "% de novos com ≥1 tarefa criada em D0"** | `activity_create` e `install` são contagens do dia; a razão no mesmo dia é aproximação (o próprio `metrics.js` avisa que razão entre grupos diferentes não é taxa). `first_task_done` (ONCE_EVER) ÷ `install` numa janela de semanas é a aproximação honesta. | **já faz** (aproximado, declarar como tal) |
| **07 §2 sinal "churn D+1 após perda de coração vs sem perda"** | Impossível no servidor (sem identidade). Possível **no aparelho** pelo precedente `WeekLedger`: quem volta emite um evento com o bucket do intervalo. | **lacuna** → **C-M3** |
| **07 §2 "taxa de retorno pós-push; retenção D+7 dos que voltam"** | Sem `source` de abertura e sem coorte: nem uma nem outra. | **lacuna** (C-M4) · D+7 bloqueado por D2 |
| **07 §2 "% de veteranos sem objetivo ativo"** (D90) | Nada mede "sem tarefa aberta". | **lacuna** sem candidata agora — depende de existir veterano |

### 1.3 Números do corpus (A1–A3) — o que eles pedem de medição

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **A1 (~00:46:30–00:48:30)**: 2 freezes ≫ 1; 3 = 2; mais freezes **piorou CURR** (retorno D+1) e **melhorou WAURR** (retorno semanal) — a decisão exigiu as DUAS métricas. | `week_active` é a leitura semanal (WAURR-like) fechada no aparelho; `day_active` é diária. **Retorno** (a pessoa de ontem voltou hoje?) não é calculável em nenhuma das duas. WP2.1 propõe 3→2 escudos e o plano quer medir por `shield_used` (não emitido) e `welcome_back` (não emitido). | **lacuna**: o experimento do WP2.1/D3 não tem régua fiada hoje. Com D2 recusado, a régua possível é C-M3 (retorno após ausência, no aparelho). |
| **A1 (~00:52:00)**: "extinction event" — baratear a streak faz os 9M de 1 ano+ pararem de ligar. | Não há streak (CLAUDE.md 📈: "streak que zera desfaz a tese"). `week_active` histograma permite ver se o topo (`goal_days` 6–7) encolhe após uma mudança de perdão. | **já faz** (a régua existe; a leitura é WP0.1) |
| **A1 (via A2)**: "Commit To My Goal" no lugar de "Continue" = +10k DAU. | `checkin_commit {focus_count}` **emitido** — o numerador do WP2.3. **Denominador** (check-in exibido) **NÃO ENCONTRADO**: `needsCheckIn(gameState, now)` decide mostrar, sem `track`. A meta "≥80% dos check-ins" do plano não tem denominador. | **lacuna** → **C-M7** (`checkin_shown`, 1×/dia) |
| **A2 Perfect Streak** (recompensa estética por não usar freeze) → WP2.x prestígio. | `shield_used` no schema, não emitido. | **já coberto por WP (WP2.1/2.x fiação)** |
| **A2 Apple Watch 49,5% / Peloton +15%** — dados de terceiros sobre fechamento de anel/feedback de competência. | Benchmarks, não pedidos de medição. | **não se aplica** |
| **A3 Airtable +20% de ativação** com wizard guiado; Cal AI quiz 20+ passos; NN/g "onboarding zero". | Ativação = `first_task_done`; o "quiz longo" = bifurcação `REFINE_OFFER` (derivável, ver 1.2). O desacordo entre fontes só se arbitra com o funil lido — WP0.1. | **já faz** medir; a decisão espera D1 |
| **07 §1 benchmarks D1/D7/D30** (Finch ~54/~37; simulação 45–60/—/20–30; metas D1≥35 · D7≥18 · D30≥10; alarme D1<20 ou D30<4). | Nenhuma é calculável (ver §2). | **bloqueado por D2** |

---

## 2. Meta → evento → calculável?

Legenda: **SIM** = com os eventos emitidos hoje + WP0.1 ligado · **SCHEMA** = evento existe no schema mas não é emitido (depende de fiação já prevista noutro WP) · **D2** = impossível sem a decisão de coorte · **NÃO** = falta evento (candidata).

| Meta (fonte) | Evento(s) | Calculável? | Observação |
|---|---|---|---|
| D1 ≥ 35% (F, 07 §1) | — | **D2** | `metrics.js` cabeçalho: sem dia de instalação não há coorte. WP0.2 aproxima com `retained{bucket}` fechado no aparelho. |
| D7 ≥ 18% (F, 07 §1) | — | **D2** | idem |
| D30 ≥ 10% / alarme D30 < 4% | — | **D2** | idem |
| Achatamento da curva de coorte / aha moment (I.4) | — | **D2** | A frase "implementável com os ~20 eventos" do guia é falsa para o desenho atual. |
| Drop-off por passo do onboarding, por funil (07 §2, 05 #16) | `onboarding_step {step, funnel}` | **SIM** | `applyAggregate` → `onboarding_step.<funil>.<n>` |
| Teste longo converte ou mata (07 §3) | `onboarding_step` passo `REFINE_OFFER` → `+1` | **SIM** (derivação) | Documentar no leitor. |
| % que chega ao reveal **e vê o sprite** ≥ 70% (PLANO §2 onda 1) | `reveal_seen {has_sprite, funnel}` | **SCHEMA** | Não emitido; WP1.1 fia. |
| Tempo até o reveal (<60s demo / <4min oracle) (05 #16) | — | **NÃO** | C-M5 (bucket) |
| Ativação D0: `first_task_done` sobe (PLANO onda 1; 07 §2) | `first_task_done {tier}` ÷ `install` (janela) | **SIM** (aproximado) | Não é coorte; é razão de contagens numa janela. Declarar. |
| % novos com ≥1 atividade criada (07 §2) | `activity_create` ÷ `install` | **SIM** (aproximado) | idem |
| Métrica-farol: esforço por ativo/dia (F) | `day_active {effort}` → `effort_sum / day_active` | **SIM, mas como MÉDIA** | Greer/I.4 pede mediana → C-M1 |
| `goal_days` mediano ≥ 4/7 (PLANO onda 2) | `week_active {goal_days}` histograma | **SIM** | `summarizeNorthStar` já devolve `on_target/weekly_active` e o histograma permite a mediana. |
| Taxa de dia perfeito (F) | `week_active.goal_days` | **SIM** | |
| `shield_used` cai após WP2.1 sem `welcome_back` subir (PLANO onda 2; A1 CURR×WAURR) | `shield_used`, `welcome_back {days}` | **SCHEMA** | Nenhum dos dois emitido. O experimento D3 não tem régua hoje. |
| `welcome_back` bucket 5–14 cai (PLANO onda 3) | `welcome_back {days}` | **SCHEMA** | |
| `checkin_commit` ≥ 80% dos check-ins (PLANO onda 3) | `checkin_commit` ÷ **check-ins exibidos** | **NÃO** (numerador SIM, denominador ausente) | C-M7 |
| `week_active` de `tier=paid` não cai após D30 (PLANO onda 4) | `week_active.paid.goal_days.*` | **PARCIAL** | Por tier: SIM. "Após D30" da compra: D2. |
| `unlock_view reason=report → purchase` (PLANO onda 5) | `unlock_view.report`, `purchase.<tier>` | **PARCIAL** | `purchase` não carrega `reason`; só razão agregada entre dias. C-M2 |
| Dismiss/view por convite (WP5.5) | `unlock_dismiss.<reason>` ÷ `unlock_view.<reason>` | **SIM** | |
| Demo: criações por fora do teto (G-6) | `activity_create.<path>.<kind>`, `demo_cap_hit.<path>` | **SIM** | |
| Churn condicional pós-`heart_lost` / pós-degeneração (F) | — | **NÃO** | C-M3 (versão no aparelho, com viés declarado) |
| Tempo mediano até 1ª evolução (07 §2) | `evolve {level}` + idade | **SCHEMA + D2** | `evolve` não emitido; "tempo" exige idade → D2. |
| CTR de push por horário (F, 07 §4) | — | **NÃO** e **conflita** (hora) | C-M4 mede só `source`; horário fica fora (fingerprint). |
| Retorno pós-push / efeito do widget (07 §2, §5) | — | **NÃO** | C-M4 |
| `push_optout` ↑ (guarda-corpo) | — | **NÃO** | C-M4 |
| Aberturas/dia sem conclusão ↑ (guarda-corpo) | — | **NÃO** | C-M4 (`app_open` − `day_active`) |
| % humor negativo em dia de perda (guarda-corpo) | — | **NUNCA** | Linha vermelha. |
| DAU (F) | `day_active` | **SIM** (ativo = concluiu) | |
| MAU, frequência mensal por pessoa (F) | — | **D2/nunca** | Cabeçalho de `metrics.js`. |
| Uso de camada 3 (07 §2 D30) | `dungeon_run {floors}` | **SCHEMA** (masmorra); NÃO (resto) | |
| Guarda-corpo "aberturas sem conclusão" | ver acima | **NÃO** | C-M4 |

**Contagem:** 31 metas listadas → **9 calculáveis hoje** (SIM/SIM-aproximado), **1 calculável como média onde a fonte pede mediana**, **2 parciais**, **6 presas em SCHEMA** (evento existe, ninguém emite), **5 bloqueadas por D2**, **7 sem evento** (candidatas), **1 proibida**.

---

## 3. WPs existentes × corpus

| WP | Estado no ledger | O corpus… | Fonte | Nota do guarda |
|---|---|---|---|---|
| **WP0.1** Ligar leitura (`METRICS_ADMIN_KEY`) | `BLOQUEADO:D1` | **SUSTENTA, com força**. 07 §0 "toda afirmação é hipótese não testada"; 07 §6 #1 "pré-requisito de tudo"; E #1; C6 §4 (sem dado, cherry-picking é o padrão). | 07 §0, §6, §7; E; C6 | **Custo de não medir, dito pelo corpus:** o plano inteiro (36 WPs) está sendo priorizado por hipótese, e C6 diz que humanos sem dado buscam confirmação. O leitor `tools/metrics-read.mjs` **NÃO EXISTE** ainda — o WP pode avançar sem o dono: escrever o leitor (com eixo no zero, *n* em toda linha, mediana de `goal_days`) e deixá-lo esperando a chave. Ver §5. |
| **WP0.2** Retenção por ledger local | `BLOQUEADO:D2` | **SUSTENTA** a necessidade (07 §1 metas; I.4 aha moment; A1 CURR/WAURR) e **SUSTENTA** o método (Consalvo §6 pseudônimo/apagar; o precedente `WeekLedger`). **Contradiz** a frase do guia "implementável com os ~20 eventos" — não é, sem D2. | 07 §1; I.4; A1; C6 | **Custo de não decidir D2:** 5 metas (D1/D7/D30/aha/tempo até evolução) ficam ilegíveis; o experimento D3 (escudos 3→2) não tem a métrica que o Duolingo usou para decidir a mesma coisa (A1 ~00:47). O corpus não oferece alternativa privada — só a do próprio `metrics.js`. |
| **WP0.3** Política "sete" → dez + teste | `VERIFICADO` | **SUSTENTA**: Consalvo (consentimento informado, específico); F "declarar na Data Safety". | C6; F | Rodado hoje: `grep -c "<tr><td><code>" public/privacidade.html` → **38** = 19 PT + 19 EN; teste "todo evento do allowlist está nomeado" **passa**. Pequena lacuna: nenhum doc lista a seção 4 no checklist de Data Safety (`BILLING-SETUP.md` só cita e-mail). |
| **WP0.4** Documentos que mentem | `PROPOSTO` | **SUSTENTA** e acrescenta itens: (a) 07 §0 "NENHUMA telemetria" e §3 "PostHog" — nunca corrigidos; (b) I.4 "implementável com os ~20 eventos"; (c) F "identificar por saveId" contradiz princípio 3 e a política pública; (d) `docs/plano-melhorias/LEDGER.md` diz **"50 pacotes"** e cita o comando `grep -oE '^### WP…' | wc -l` — rodado hoje devolve **36** (o "+14 do Mobbin" não está em `### WP` em lugar nenhum: `grep -hoE 'WP[0-9]+\.[0-9]+' docs/plano-melhorias/mobbin/*.md | sort -u` → 32 refs a WPs já existentes). O LEDGER está violando a própria régua que cita. | 07; I.4; F; LEDGER.md | Itens (a)–(d) entram na lista do WP0.4. Apodrecimento vigiado hoje: `privacidade.html` (OK), contagem de WPs (**ERRADA no LEDGER**), cabeçalho de `playerDay.ts` (cita as 7 famílias — OK). |
| **WP0.5** Eventos novos (schema) | `VERIFICADO` | **SUSTENTA** a escolha dos eventos (todos rastreiam a A1/A2/07 §2), **mas** o corpus deixa claro que schema sem emissão não mede nada — e 7 dos 9 não são emitidos. | 07 §2; A1; A2 | O ledger deve dizer explicitamente: "VERIFICADO = schema+paridade+política; **fiação pendente** em WP1.1 (`reveal_seen`), WP2.1 (`shield_used`), WP2.4 (`milestone`), WP3.x (`welcome_back`), WP4.x (`evolve`, `dungeon_run`, `bond_level`)". Hoje o estado sugere que a régua das ondas 1–4 já existe. Não existe. |
| **WP0.7** Medir o save | `VERIFICADO` | **Indiferente** — nenhuma fonte fala de tamanho de save. | — | `saveSize.test.ts` **passa** hoje (79.602 bytes). |

---

## 4. Candidatas (não integradas — o consolidador passa pela linha vermelha antes)

Todas obedecem: só inteiros/enum; nada de texto; resolução máxima = dia; nos **dois** `EVENT_SCHEMA` + `privacidade.html` PT/EN + teste de paridade; nenhuma carrega `saveId`, hora, país ou aparelho.

### C-M1 · Esforço por ativo como histograma, não soma (Greer/I.4 #1)
- **Spec:** em `applyAggregate` (`metrics.js`), além de `effort_sum`, contar `day_active.effort_bucket.<b>` com b ∈ {0: 1–2, 1: 3–4, 2: 5–6, 3: 7–9, 4: 10+} — derivado no **servidor** a partir do `effort` que já chega (nenhuma mudança de cliente, nenhum evento novo). `summarizeNorthStar` (ou função irmã `summarizeEffort`) devolve mediana aproximada por bucket, `n`, e a média só rotulada como média.
- **Aceite:** teste em `metrics.test.js`: um agregado com 9 dias de esforço 1 e 1 dia de esforço 100 devolve mediana no bucket 0 e média > 10 — os dois números, rotulados.
- **Verificação:** `grep -q "effort_bucket" functions/api/metrics.js && npx vitest run functions/api/metrics.test.js`
- **Linha vermelha:** nenhum dado novo sai do aparelho.

### C-M2 · `purchase` carrega o convite que a originou
- **Spec:** `purchase { tier, reason 0..4 }` onde 4 = `onboarding` (compra no `INTRO`, `SoulmonOnboarding` `track('purchase')`) e 0–3 = `TELEMETRY_UNLOCK_REASON`. `handleAccountUnlocked` lê o `unlockReason` vigente **antes** de `setUnlockReason(null)`. Servidor: `bump('purchase.<reason>')`.
- **Aceite:** `purchase.report / unlock_view.report` legível por convite (é a meta da onda 5). Teste de fiação em `telemetryWiring.render.test.tsx`: compra iniciada por `evolution` sai com `reason=1`.
- **Verificação:** `grep -n "purchase: { tier" src/utils/telemetry.ts functions/api/metrics.js` → mostra `reason` nos dois; `npx vitest run src/utils/telemetry.test.ts src/components/telemetryWiring.render.test.tsx`

### C-M3 · Retorno após dia ruim, fechado no aparelho (07 §2 "hipótese nº1 de churn"; A1 CURR)
- **Spec:** precedente `WeekLedger`. Chave local `soulmon-telemetry-lastbad` = dia (nunca enviado) gravado por `trackDayClosed` quando `lastDayReport` registrou perda de coração (`heartsLost > 0`) ou degeneração. Na **próxima abertura** com `day_active`, emitir `after_bad_day { gap: 0 (dia seguinte) | 1 (2–4) | 2 (5–14) | 3 (15+), kind: 0 heart | 1 degeneration }` e apagar a chave. Quem nunca volta nunca emite — **viés declarado** no GET (`notes`), igual ao do `week_active`.
- **Aceite:** teste "o corpo nunca contém a data do dia ruim"; teste "sem perda de coração não emite"; paridade; linha PT/EN na política ("que você voltou depois de um dia em que perdeu coração, e em qual faixa de dias — nunca a data").
- **Verificação:** `grep -q "after_bad_day" src/utils/telemetry.ts functions/api/metrics.js public/privacidade.html && npx vitest run src/utils/telemetry.test.ts`
- **Por que agora:** é a única régua para a "hipótese nº1" que não precisa de D2, e é o que arbitra se a mensagem da virada deve virar convite de carinho (07 §6 #9).

### C-M4 · Abertura do dia com origem (F `session_start`/`push_opened`/`push_optout`/`widget_tap`, guarda-corpos)
- **Spec:** `app_open { source: 0 direct | 1 push | 2 widget | 3 desktop }`, dedupe `ONCE_PER_DAY` **por source** (o guard de `isDocumentHidden` já existe). `sw.js` `notificationclick` abre `'/?src=push'`; o widget/deep link e o overlay Electron passam `?src=widget|desktop`; `App.tsx` lê e apaga o parâmetro no boot. **Sem hora, sem campanha em texto** — "CTR por horário" da fonte fica **fora** de propósito (hora × dia é fingerprint). `push_optout` (sem props) em `handleToggleNotifications` ao desligar.
- **Leitura:** `app_open − day_active` = dias abertos sem conclusão (guarda-corpo 07); `app_open.push / push enviados` (o scheduler já sabe quantos mandou) ≈ retorno pós-push; `app_open.widget` = efeito do widget (07 §5 #3).
- **Aceite:** teste "dois `app_open` do mesmo dia e mesma origem contam um"; teste "URL com `src` desconhecido cai em `direct`, nunca derruba"; paridade; política.
- **Verificação:** `grep -q "app_open" src/utils/telemetry.ts functions/api/metrics.js public/privacidade.html && grep -q "src=push" public/sw.js && npx vitest run src/utils/telemetry.test.ts`
- **Cuidado (CLAUDE.md):** mudar `sw.js` exige bump de `CACHE_VERSION`.

### C-M5 · Duração do onboarding em faixa (05 §4 #16)
- **Spec:** `reveal_seen` ganha `duration: 0 (<60s) | 1 (<2min) | 2 (<4min) | 3 (4min+)`, medido no cliente entre o passo `INTRO` e o `REVEAL` com `performance.now()` **em memória** (nada gravado, nada de timestamp trafegado — só o bucket). Entra junto da fiação de WP1.1 para não abrir o evento duas vezes.
- **Aceite:** teste "o corpo não contém número maior que 3 na prop `duration`"; paridade.
- **Verificação:** `grep -q "duration: { min: 0, max: 3 }" src/utils/telemetry.ts functions/api/metrics.js && npx vitest run src/utils/telemetry.test.ts`

### C-M6 · Conclusão de tarefa assombrada (F `was_haunted`; CLAUDE.md 👻)
- **Spec:** `haunted_done` (sem props, ou `{ tier }`), emitido em `completeTask` quando `isHaunted(task, now)` era verdadeiro. Dedupe nenhum (pode acontecer várias vezes/dia). Nunca o nome da tarefa.
- **Leitura:** `haunted_done / day_active` — a pilha de culpa está virando loop de jogo ou não.
- **Verificação:** `grep -q "haunted_done" src/utils/telemetry.ts functions/api/metrics.js && npx vitest run src/utils/telemetry.test.ts`

### C-M7 · Denominador do check-in (A1 "Commit To My Goal"; PLANO onda 3)
- **Spec:** `checkin_shown` (sem props), `ONCE_PER_DAY`, emitido onde `needsCheckIn(gameState, now)` decide abrir o modal. `checkin_commit / checkin_shown` passa a ser a taxa da onda 3.
- **Verificação:** `grep -q "checkin_shown" src/utils/telemetry.ts functions/api/metrics.js && npx vitest run src/utils/telemetry.test.ts`

### Sobre o leitor do WP0.1 (não é candidata nova — é spec que faltava)
`tools/metrics-read.mjs` deve nascer com as cinco regras de Greer embutidas, não como nota de rodapé: (1) todo número com `n` ao lado; (2) `goal_days` e esforço como **mediana** (após C-M1); (3) qualquer sparkline/histograma com eixo em zero; (4) razão só entre contagens da **mesma janela** e rotulada "aproximada"; (5) recusar-se a imprimir comparação de conversão com janela < 30 dias. Isso pode ser escrito e testado **antes** de o dono definir a chave.

---

## 5. O que este guarda mudou de opinião

1. **"WP0.5 VERIFICADO" estava me tranquilizando indevidamente.** Verifiquei schema, paridade e política — e nunca escrevi que 7 dos 9 eventos não são emitidos. O corpus (C6 §4) descreve exatamente isso: o número que confirma minha hipótese ("a régua das ondas existe") era o que eu olhava. A régua não existe até WP1.1/2.1/2.4/3.x/4.x fiarem. O ledger precisa dizer "schema pronto, fiação em X".
2. **A métrica-farol está meio errada segundo a própria fonte que o plano cita.** `effort_sum / day_active` é média, e I.4 #1 (que o plano copiou como "regra de leitura") diz mediana. O histograma de `goal_days` foi feito do jeito certo; o de esforço não foi feito. É consertável só no servidor (C-M1).
3. **O relatório 07 foi a fonte mais útil e a mais errada ao mesmo tempo.** Errado no §0 e §3 (ferramenta, saveId, "nenhuma telemetria"); certo no §2 — a coluna "sinal de confirmação" é a melhor lista de perguntas do corpus, e 4 das 8 linhas não têm sinal fiado hoje.
4. **Retenção não é só D2.** Eu tratava tudo de "retorno" como bloqueado pelo dono. A1 mostra que o Duolingo decidiu freezes olhando CURR × WAURR, e o precedente `WeekLedger` permite uma versão privada de "voltou depois do dia ruim" (C-M3) sem tocar em coorte. O que continua impossível sem D2 é a **curva** (D1/D7/D30, aha).
5. **A frase mais perigosa do guia é a mais otimista:** "implementável com os ~20 eventos já planejados" (I.4, sobre o aha moment). Não é, e alguém vai ler isso e prometer uma curva de coorte. Entra no WP0.4 junto com o "50 pacotes" do LEDGER.
6. **O que não mudou:** SDK de terceiro, `saveId` em métrica, hora do dia, país/aparelho, humor — o corpus pede quatro desses cinco e a resposta continua não. A política pública já promete o contrário, e uma promessa pública quebrada custa mais do que qualquer segmentação rende.

## A pergunta que este guarda não consegue responder por falta de dado

**Quantas pessoas que chegaram ao `REVEAL` fizeram uma tarefa no mesmo dia?** É a única pergunta que liga o Oráculo (onde o produto gasta mais esforço) à promessa (executar a vida real) — e hoje o `reveal_seen` não é emitido, o `first_task_done` não sabe se veio de um reveal, e o dia de ambos só coincide por sorte. Com WP1.1 fiado e WP0.1 ligado, ela vira `first_task_done ÷ reveal_seen` na mesma semana. Até lá, é uma opinião.
