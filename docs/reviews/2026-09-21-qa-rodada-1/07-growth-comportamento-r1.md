# QA rodada A — 07 · Growth + Insights + Comportamento · E0 (10 conhecidos, PWA, cortesia, 14 dias)

Data: 21/09/2026 (noite) · Base: `qa/rodada-a` @ `5228145e` · Somente leitura.
Papéis: `alpha-growth` + `alpha-insights` + `alpha-analista-comportamento`.
Regra: `caminho` + SÍMBOLO; número só com comando; **sem instrumentação = lacuna, nunca número inventado**.
Não repete o `12-growth-distribuicao.md` da manhã salvo onde continua aberto (marcado "ainda aberto").

---

## 0. Veredito em cinco linhas

1. `scripts/metrics-report.mjs` com a chave imprime o funil de 8 linhas (`LINHAS_DO_FUNIL`) — cobre **ativação** e **retenção D7** por aproximação, mas **não cobre a hipótese de hábito** ("≥2 de 4 dias") — o agregado não tem pessoa, e o `week_active` que a substituiria só despacha na semana seguinte (`flushWeekLedger`), logo a semana 2 de E0 **nunca é lida dentro dos 14 dias**.
2. `evolve`/`milestone`/`dungeon_run`: schema nos dois lados, **zero emissor — ainda aberto** desde a review 12 (`grep -rn "track('evolve'\|track('milestone'\|track('dungeon_run'" src --include=*.tsx --include=*.ts | grep -v test` → 0). Emissores propostos em §1.3 com símbolo.
3. `day_active` tem um **furo silencioso**: `track` descarta evento com `document.hidden` (`isDocumentHidden`), `useDailyReset` › `checkRollover` roda sem guard de visibilidade, e o efeito de `trackDayClosed` em `App.tsx` depende só de `[gameState.lastDayReport]` — virada numa aba oculta perde o dia ativo para sempre.
4. Push no **D0 não é suprimido**: `_pushCopy.js` › `pushCopy` diz "nunca no D0" no comentário, mas a idade 0 cai na copy padrão; o worker (`push-scheduler.js` › `drainPrefix`) manda 16h e 22h no dia do nascimento a quem aceitou notificação na 1ª conclusão.
5. Critério de morte da review 12 (`first_task_done < 6/10` ou `retained.d7 ≤ 2/10`) **se sustenta com correção de leitura**: `retained.d7` = "abriu ao menos uma vez entre D7 e D29" (`retentionBucketFor`), e o denominador é `install`, que para 10 pessoas pode ser 11–13 (iOS conta duas vezes). Corrigido em §7.

---

## 1. `scripts/metrics-report.mjs` — o que imprime, o que cobre

### 1.1 Saída com `METRICS_ADMIN_KEY` definida (execução mental, `tabelaDoFunil`)

```
FUNIL — 2026-09-15 a 2026-09-21
  etapa            │     n │ % do topo (≈, mesma janela, NÃO é coorte)
  ─────────────────┼───────┼──────────────────────────────────────────
  install          │     n │ ~100.0%
  onboarding_step  │     n │ ~x%      ← TOTAL de passos emitidos (todo funil, todo passo) — não é "pessoas"
  first_task_done  │     n │ ~x%
  day_active       │     n │ ~x%      ← dias-ativos, não pessoas
  week_active      │     n │ ~x%
  retained d1      │     n │ ~x%
  retained d7      │     n │ ~x%
  retained d30     │     n │ ~x%

  ⚠️ NÃO calculável a partir deste agregado: retencao · D7 · conversao em N dias · qualquer serie por usuario
  ⚠️ first_task_done ÷ install: ~x%  (a de b)
     — dois grupos da mesma semana, não as mesmas pessoas. Leia como tendência, nunca como taxa.
```

`--full` acrescenta `renderRelatorio` (`tools/metricsReport.mjs`): esforço (mediana por `effort_bucket.*`), histograma `week_active.goal_days.0..7`, oferta, funil do nascimento por passo (`onboarding_step.demo.<n>`), retenção D1/D7/D30 + `app_open.{direct,push,widget,shortcut}`, ritual do dia. Saídas: 0 ok · 2 sem chave · 3 chave recusada · 4 outro HTTP (`main`). Régua: `tests/metricsReportFunil.test.ts` (existe; `ls tests/metricsReport*.test.ts` → 2 arquivos).

**Defeito de leitura na tabela curta**: a linha `onboarding_step` soma todos os passos de todos os funis (`bump(record.e)` em `applyAggregate`), então com 10 pessoas × ~14 passos ela imprime "~1400% do topo". O próprio cabeçalho do script avisa, mas a coluna "% do topo" sai mesmo assim. Para E0 a linha útil é `onboarding_step.demo.<REGISTER=35>` (só no `--full`).

### 1.2 Cobertura das 3 hipóteses de E0

| Hipótese | Evento | Emissor (verificado) | Lê no script? | Lacuna |
|---|---|---|---|---|
| **Ativação** = `first_task_done` no D0/D1 | `first_task_done` (`ONCE_EVER`) | `App.tsx` efeito sobre `showFirstTaskPopup` (setado em `handleToggleActivityCompletion`/`handleCompleteTask` via `hasShownFirstTaskPopup`) | Sim (`n` e ÷ install) | **"D0/D1" não é legível**: o evento tem só `d` (dia do evento), não a idade. Com 10 pessoas que instalam em dias diferentes, `first_task_done` do dia X pode ser de quem instalou no dia X−3. Proxy: comparar `first_task_done` acumulado em 14 dias contra `install` acumulado — perde a distinção D0/D1 vs D5. Conserto mínimo: prop `age` (faixa 0/1/2, mesma de `sound_off`) no `first_task_done` — inteiro, sem data, fechado no aparelho a partir de `K_INSTALL_DAY`. |
| **Hábito** = `day_active` em ≥2 dos 4 primeiros dias | `day_active` (1×/dia, sem id) · `week_active {active_days}` | `telemetry.ts` › `trackDayClosed` ← `App.tsx` efeito `[gameState.lastDayReport]` | `day_active` sim (total); `week_active.active_days` **não** (só `goal_days` no `--full`) | **Não calculável por pessoa** — por desenho (`notes.unreadable`). `week_active.active_days` é a versão honesta (fechada no aparelho), mas (a) `renderRelatorio` › `histogramaGoalDays` imprime só `goal_days`; `active_days` chega ao KV (`applyAggregate` só faz `bump(record.e)` + tier — **não há chave `week_active.active_days.N`**, ver §1.4) e (b) `flushWeekLedger` despacha a semana W no primeiro fechamento de dia da semana W+1 → a semana 2 de E0 só aparece se a pessoa fechar um dia na semana 3. **A leitura tem de ser no D21+, não no D14.** |
| **Retenção** = `retained.d7` | `retained {bucket}` (1× por marco na vida) | `telemetry.ts` › `trackRetentionOnOpen` ← `App.tsx` boot | Sim | `retentionBucketFor` devolve o MAIOR marco cruzado: quem abre D0 e volta só no D10 emite `d7` e **nunca `d1`**. Logo `d1` = "voltou em algum dia de D1–D6", `d7` = "voltou em algum dia de D7–D29". Serve para E0 (é exatamente "voltou na 2ª semana"), mas não é D7 clássico. |

### 1.3 Emissores que faltam — proposta com caminho + símbolo

Schema já aceita nos dois lados (`EVENT_SCHEMA` em `src/utils/telemetry.ts` e `functions/api/metrics.js`; `applyAggregate` já faz `evolve.level_N`, `milestone.days_N`, `dungeon_run.floors_N`). Falta só fiação, e o local é o **dono da regra**, nunca a UI:

| Evento | Onde disparar | Por quê ali |
|---|---|---|
| `evolve {level}` | `src/App.tsx` › `handleEvolve` — **fora** do updater `setGameState(prev => …)` (footgun 6). Padrão já usado: efeito sobre `evolutionCeremony` ou sobre `gameState.evolutionStage` com `getStageLevel(novo)`. `level` = índice de `FORM_REQUIREMENTS` do estágio novo (1..4). | É o único ponto onde a evolução acontece (`MANUAL_EVOLUTION`). Um efeito `[gameState.evolutionStage]` com guard `prev !== next` é o mais barato e não toca o updater. |
| `milestone {level}` | `src/App.tsx` › `celebrateHabitMilestone`, logo após `setMilestoneCeremony({...})`, com `level: tier` (1..3). | `habitMilestoneOf` → `milestoneReached` já garante "uma vez por corte"; a cerimônia é o gesto. **Não** na `MilestoneCeremony.tsx` (componente pode montar 2× em StrictMode). |
| `dungeon_run {floors}` | `src/components/DungeonGame.tsx` no ponto de fim de run (derrota ou 5º andar) — onde `dungeonRunsCompleted`/`setDungeonDifficultyAtLeast` são chamados. `floors` = andares limpos (1..5); run com 0 andares não emite (schema `min:1`). | É onde `MAX_FLOORS` mora. |
| `first_task_done {tier, age}` (novo prop) | mesmo efeito de hoje; `age` calculado por `K_INSTALL_DAY` como `trackSoundOff` já faz (0 = D0, 1 = D1–D6, 2 = D7+). | Torna "ativação no D0/D1" legível sem data. Exige bump nos dois `EVENT_SCHEMA` + `applyAggregate` (`first_task_done.age_N`) + política? **Não**: é inteiro derivado do que já se declara ("primeira conclusão"), mas `alpha-compliance` confirma. |

### 1.4 `week_active.active_days` chega e morre no servidor

`applyAggregate` para `week_active`: só `bump('week_active')` + `bump('week_active.<tier>')` + o histograma de `goal_days` (`grep -n "goal_days" functions/api/metrics.js`). `active_days` sai do aparelho (declarado na política: "em quantos dias você concluiu alguma coisa") e **não vira chave** — é o mesmo padrão que o cabeçalho de `metrics.js` chama de "custo de privacidade sem retorno". Conserto: `bump(\`week_active.active_days.${p.active_days}\`)` + linha em `renderRelatorio`. Sem isso a hipótese de hábito de E0 não tem leitor.

### 1.5 Furo: `day_active` perdido em aba oculta (novo)

- `telemetry.ts` › `track`: `if (isDocumentHidden()) return;`
- `hooks/useDailyReset.ts` › `checkRollover`: `setInterval(…, 30000)` sem guard de visibilidade (`grep -n "hidden\|visibilityState" src/hooks/useDailyReset.ts` → 0).
- `App.tsx` efeito `trackDayClosed` depende de `[gameState.lastDayReport]` — roda uma vez por relatório.
- Sequência: PWA em segundo plano à meia-noite (desktop Chrome não congela abas; Android congela após ~5 min, então lá o risco é menor) → reset roda → `trackDayClosed` chama `track('day_active')` → descartado → `lastDayReport` não muda mais → **o dia ativo nunca é enviado**. O ledger da semana (`WeekLedger`) É atualizado (a escrita vem depois do `track`), então `week_active` fica certo e `day_active` fica menor — as duas linhas do funil deixam de bater e ninguém sabe por quê.
- Conserto: em `trackDayClosed`, enfileirar mesmo oculto (o dado é do dia que fechou, não da sessão) — passar um flag `force` para `track`, ou mover o guard de `hidden` para os emissores de sessão (`app_open`, `install`) em vez de para todos.

---

## 2. Origem: `?src=convite`

Hoje `openSourceFromUrl` (`src/utils/telemetry.ts`) só conhece `push|widget|shortcut`; qualquer outro valor cai em `direct` — de propósito ("inventar origem a partir de query string de terceiro seria deixar a métrica ser escrita por quem manda o link"). O `sw.js` › `notificationclick` abre `/?src=push`. Proposta mínima, respeitando a allowlist:

1. `TELEMETRY_OPEN_SOURCE` ganha `invite: 4`; `openSourceFromUrl` aceita `src=convite` (PT, porque é o que vai no WhatsApp; aceitar também `invite`). `EVENT_SCHEMA.app_open.source.max` 3 → 4 **nos dois arquivos** (paridade `telemetry.test.ts`); `OPEN_SOURCE_LABEL[4] = 'invite'` em `metrics.js`; `origens` em `tools/metricsReport.mjs` › `renderRelatorio` ganha `'invite'`.
2. **Ler uma vez e apagar da URL**: após o `track('app_open', …)` do boot em `App.tsx`, `history.replaceState(null, '', location.pathname)`. Sem isso, a página recarrega com a query (o portão troca `saveId` e faz `window.location.reload()` — `SoulmonOnboarding.tsx` comentário "o caminho feliz normalmente recarrega a página"), e o dedupe `app_open:<dia>:4` segura só o mesmo dia; quem salva o link nos favoritos reemite `invite` toda semana.
3. `install` continua sem prop (é `null` no schema). A leitura de E0 é `app_open.invite` **do primeiro dia de cada pessoa** ≈ chegadas por convite; com 10 conhecidos, `app_open.invite` acumulado > 10 significa reabertura pelo link, não pessoa nova. Alternativa mais limpa e ainda sem texto: `install {source}` — exige mudar o schema de `install` de `null` para `{source}` e o texto do consentimento (`telemetryConsentCopy` › "primeira abertura") — mais custo, adiar.
4. O link a mandar: `https://soulmon.mateus-sprnd.workers.dev/?src=convite`. Não usar `?c=N` por pessoa (a review 12 propôs `campaign 0–9`): com 10 pessoas, `c` por pessoa é **identificador**, viola o princípio 3 do módulo.

---

## 3. Comportamento: interrupções nos 3 primeiros dias do convidado

Fontes de código: `03-FLUXO-DE-TELAS.md` §2 (onboarding), §3.1 (intersticiais), §3.2 (slot de avisos); `src/App.tsx` › `const interstitial`, IIFE `avisos`; `src/utils/welcomeBack.ts`, `pushPriming.ts`; `functions/api/_pushCopy.js`; `src/components/NotificationManager.tsx`; `workers/push-scheduler.js`.

**Correção de premissa**: o pedido fala em "fila de 7 avisos". O código tem **8** `avisos.push` (`grep -c "key: '" src/App.tsx` na IIFE → `firstDay, hp, semanal, triagem, priming, recomeco, carga, termos`); a tabela do `03-FLUXO-DE-TELAS.md` §3.2 lista 7 e **omite `carga`** (canvas Atividades D10). Divergência de doc → `STATUS.md`.

### 3.1 Cenário: convidado PT, Android Chrome, PWA, cortesia concedida antes, aceita notificações na 1ª conclusão, não configura Janela de Descanso, nasce à tarde

| Dia | Superfície | Tipo | Conta como interrupção? |
|---|---|---|---|
| **D0** | `IntroScreen` (vídeo, pulável) | tela sequencial | não (é entrada) |
| D0 | `SoulmonOnboarding` — caminho pago/cortesia: `IDENTITY → EMAIL/GOOGLE → GOAL → STRUGGLE → CHOICE → 1..4 (nome, data, hora, cidade) → FAVORITE → quiz 6..11 → REFINE_OFFER → (20 do teste longo, opt-in) → GENERATING → REVEAL → REGISTER` = **~19 telas sem o teste longo, ~39 com** (constantes do §2.3) | telas sequenciais | não — mas é o custo de entrada; `onboarding_step.paid.<n>` mede onde some |
| D0 | `GameTutorialFlow`: 1 conceito + `TASK_STEP` (criação **obrigatória**) | 2 telas | não |
| D0 | `FirstDayCard` (slot, item 0, 3 gestos) | aviso passivo | não (não bloqueia) |
| D0 | popup da 1ª conclusão (`GamePopups` › `showFirstTaskPopup`) | **modal** | **1** |
| D0 | `WelcomePromptModal` (instalar PWA + notificações; `interstitial === 'welcome'` e `jaConcluiuAlgo`) | **modal** com 2 pedidos | **1** (+ 2 diálogos do sistema se aceitar: `beforeinstallprompt` e permissão de Notification) |
| D0 | Push worker 16h e/ou 22h (`pushCopy` com `ageDays=0` → copy PADRÃO; **o "nunca no D0" do comentário não existe em código**) + `eveningCopy` 20h (cliente, só com a página viva e meta em aberto) | push | **1–3** |
| **D1** | `DailyReportModal` (1×/dia, `DAILY_REPORT_SHOWN`) com humor + oferta possível (`ofereceNoRelatorio`, `unlock_view.report`) | **modal** | **1** |
| D1 | `MorningCheckIn` (se `checkInPlan` tem algo — com 1 atividade do tutorial, tem) | **modal** | **1** |
| D1 | `MilestoneCeremony` — não (7 dias) · `ProtectProgressModal` — não (tem `USER_EMAIL`) · priming 2º — não (`PRIMING_MIN_DAYS=2`) | — | 0 |
| D1 | Push 10h `pet-newborn` ("Primeiro dia inteiro por aqui") + 16h + 22h (worker, incondicionais) + 20h cliente se meta aberta | push | **3–4** |
| **D2** | `DailyReportModal` + `MorningCheckIn` | 2 modais | **2** |
| D2 | slot: `priming` (só se recusou notificação no D0 e `firstDismissedAt` ≥ 24h) — aviso passivo | aviso | 0 |
| D2 | Push 10h `pet-newborn` D2 + 16h + 22h + 20h | push | **3–4** |
| D3 | igual a D2; a partir do D3 a copy das 10h volta à padrão | | |

**Total D0–D2, com push aceito: 6 modais + 2 diálogos de sistema + 7–11 pushes ≈ 15–19 interrupções em ~60 h de vida do produto**, sem contar as ~21 telas de entrada. Sem push aceito: 6 modais + 2 diálogos. Se recusar tudo: 6 modais.

**Duplicidade PWA**: no Android com PWA instalada, o worker manda Web Push 10/16/22 **e** o poll do cliente (`checkPetNotifications`) dispara às 10/16 se a página estiver viva — mesma `tag`, a segunda substitui a primeira (ok). Mas o poll do cliente é **condicionado** (`completedSteps < totalRequired`) e o worker **não** — quem já cumpriu a meta recebe "Tem algo do seu dia que você já fez?" às 10h e 16h do worker. O cabeçalho de `_pushCopy.js` sabe disso ("o worker não sabe se a meta foi cumprida") e aceita; para 10 conhecidos em 14 dias é a **primeira** cobrança visível do produto que se declara "nunca um cobrador".

### 3.2 Mecanismo psicológico por interrupção (fonte) e risco de abandono

| Interrupção | Mecanismo explorado / ferido | Fonte | Risco |
|---|---|---|---|
| ~19–39 telas antes da Home | **Fricção de entrada** vs. **compromisso escalonado** (foot-in-the-door: pedidos pequenos antes do grande — Freedman & Fraser 1966). O ritual funciona como "esforço justificado" (Aronson & Mills 1959: quem paga mais para entrar valoriza mais) — mas só para quem termina. | Freedman & Fraser, *JPSP* 1966; Aronson & Mills, *JASP* 1959 | Alto para tráfego frio; **médio para conhecidos** (têm contexto do dono). `onboarding_step.paid.<n>` é a única prova; a tela 6 (`REGISTER`/e-mail) foi apontada pela review 12 como a mais suspeita — **ainda aberto, sem dado**. |
| `FirstDayCard` (3 gestos) | **Progresso dotado** (Nunes & Drèze 2006) + **Zeigarnik** (tarefa incompleta fica na cabeça). Bem desenhado: não bloqueia, não cobra. | Nunes & Drèze, *J. Consumer Research* 2006; Zeigarnik 1927 | Baixo. |
| popup 1ª conclusão + `WelcomePromptModal` no mesmo minuto | **Permission priming contextual** (pedir no momento de valor) — correto em princípio. Mas dois modais em sequência logo após o 1º sucesso **interrompem o pico** de recompensa (peak-end rule: o que fica é o pico e o fim — Fredrickson & Kahneman 1993). Recusa precoce de Notification tem custo técnico: Chrome ativa a **UI silenciosa** de permissão para sites com baixa taxa de aceite (Chrome 80, 2020) — recusas dos 10 primeiros pesam para todos os seguintes. | Fredrickson & Kahneman, *JPSP* 1993; Chromium blog "Introducing quieter permission UI for notifications" (jan/2020) | Médio: o pedido de instalar PWA + o de push no mesmo modal são **duas decisões**; uma recusa arrasta a outra. Separar: PWA no D0 (é infra), push no D1 após o `DailyReportModal` (quando o pet "acordou" e há motivo). |
| `DailyReportModal` + `MorningCheckIn` de manhã (D1+) | **Ritual de abertura** (implementação de intenções — Gollwitzer 1999: "quando X, farei Y" dobra a taxa de execução). Dois modais seguidos em toda abertura da manhã: custo de interrupção acumulado — retomada de tarefa após interrupção custa ~23 min e mais estresse (Mark, Gudith & Klocke 2008). | Gollwitzer, *Am. Psychologist* 1999; Mark et al., *CHI* 2008 | Médio: são dois gates para chegar à Home; quem abre "só para dar comida" atravessa os dois. `checkin_shown`/`checkin_commit` medem o aceite, mas **não há evento de "pulou"** (`handleCheckInSkip` não emite) — a taxa de recusa é inferida por subtração, e a inferência mente se `checkin_shown` for inflado (o próprio `ONCE_PER_DAY` existe por isso). |
| Pushes 10/16/22 + 20h | **Batching**: 3 janelas fixas/dia melhoram bem-estar vs. push contínuo, e zero push aumenta FOMO (Fitz et al. 2019, *Computers in Human Behavior*). A 4ª (20h) quebra o lote; a das 22h explora **peak-end** ("boa noite" como fim). **Habituação**: notificação repetida é a razão nº1 de desligar (Pielot, Church & de Oliveira, *MobileHCI* 2014: ~63/dia, correlação com estresse). | Fitz et al. 2019; Pielot et al. 2014 | **Alto no D0**: a primeira notificação da vida do app chega no dia em que a pessoa já esteve dentro (contradiz o comentário de `pushCopy`). `push_optout` mede o desligamento; **não há evento de "push entregue"** (consolidado `16` já apontou — ainda aberto), então `app_open.push / day_active` tem numerador sem denominador de entrega. |
| `pet-newborn` D1/D2 ("Já está reconhecendo você") | **Reciprocidade + apego** (Cialdini; efeito Tamagotchi — Lawton 2017): a criatura "reconhecer" a pessoa cria dívida social benigna. | Cialdini, *Influence* 1984; Lawton, *New Scientist* 2017 | Baixo; é o push mais alinhado à essência. |
| `welcomeBack` faixas 1–3 | Evita **culpa por balanço** (frases sem contabilidade, revisadas 21/09). Coerente com `ABSENCE_FORGIVENESS_DAYS`. A colapsar-ou-não é decisão do dono (P2) — não reabro. | `welcomeBack.ts` cabeçalho; Lally et al. 2010 (falha isolada não destrói hábito) | Baixo. |
| `ProtectProgressModal` (`jaEngajou` = 5 conclusões, sem `USER_EMAIL`) | **Aversão à perda** (Kahneman & Tversky 1979) usada a favor da pessoa (proteger save). Não atinge os 10 de E0 (entram com e-mail). | Kahneman & Tversky, *Econometrica* 1979 | Nulo em E0. |
| Oferta no `DailyReportModal` (`ofereceNoRelatorio`) | **Momento de pico** para vender — ok, mas o convidado de cortesia já é `paid`: `UnlockNudge` não deve aparecer (`rebirthRefusal`/`accountTier`). **Não verifiquei** se `ofereceNoRelatorio` checa `accountTier === 'paid'` — se não checa, o convidado vê oferta do que já tem. | — | Verificar: `grep -n "ofereceNoRelatorio" src/App.tsx`. |

### 3.3 Orçamento de interrupções proposto (D0–D2), com o que medir

| Dia | Modais (máx.) | Pushes (máx.) | Regra | Como se mede |
|---|---|---|---|---|
| D0 | **1** (WelcomePrompt só com o pedido de PWA; o popup da 1ª conclusão vira toast/fala do pet) | **0** — `pushCopy` devolve `null` para `ageDays === 0` (torna verdadeiro o comentário; `pushCopy.parity.test.js` ganha o caso) | Pessoa já esteve dentro hoje | `push_optout` no D0 = 0 |
| D1 | **2** (relatório + check-in) + pedido de push **depois** do relatório | **2** (10h newborn + 22h) — sem 16h e sem 20h nos D1–D2 | Primeiro dia inteiro: uma manhã, uma noite | `app_open.push` D1 vs `day_active` D1 |
| D2 | **2** | **3** (10h, 16h, 22h) ou 2 se o 20h disparar (hoje o 20h já cede à Janela; passar a ceder também ao 22h) | Volta ao lote padrão | idem |
| Qualquer dia | slot de avisos: renderiza só `avisos[0]` — já é orçamento (ok) | — | — | — |

Guardrails do orçamento: nenhum texto novo sem `alpha-compliance`; nada que mexa em `PUSH_HOURS_BRT` (paridade com `wrangler.toml`); `ageDays === 0 → null` é a única mudança de comportamento e cabe em `_pushCopy.js` sem tocar horário.

---

## 4. Aviso de IA (Sobre) e cláusula §8 — efeito na confiança

Textos lidos: `SettingsPage.tsx` grupo `Sobre` ("A imagem da sua criatura e as falas do chat são geradas por IA (Higgsfield e Gemini…, Groq…)") e `public/termos.html` §8 ("escrita por um modelo de linguagem, na hora, sem revisão humana… pode errar, inventar…"; "O chat não é um serviço de emergência"; CVV 188 / findahelpline).

**Efeito esperado (literatura), com a direção e o limite:**

1. **Transparência calibra expectativa e aumenta confiança — até o ponto em que viola a expectativa.** Kizilcec (*CHI* 2016, "How Much Information? Effects of Transparency on Trust in an Algorithmic Interface"): transparência moderada elevou a confiança; transparência alta *sem* resultado à altura reduziu. O §8 é a versão "alta" (lista o que o modelo pode errar) — ok em termos (ninguém lê antes de decidir), arriscado se copiado para a UI.
2. **Rótulo "gerado por IA" reduz o valor percebido de arte.** Ragot, Martin & Cojean (*CHI EA* 2020): a mesma imagem rotulada como feita por IA foi avaliada como menos bela/criativa. **A criatura única é o diferencial pago** (`accountTier:'paid'`, Oráculo). O aviso em Sobre está longe do reveal — certo; **não levar o rótulo para o `BirthCard`/`REVEAL`**.
3. **Aversão a algoritmo em domínio pessoal** (Longoni, Bonezzi & Morewedge, *J. Consumer Research* 2019 — "uniqueness neglect": as pessoas acham que a IA não capta o que têm de único). O Sobre já desarma parte disso ("O Soulmon não sabe nada sobre a sua vida além do que você escreveu") e o reveal vende exatamente "único" — tensão latente, sem dado.
4. **Honestidade sobre limite = confiança sustentada** (Glikson & Woolley, *Academy of Management Annals* 2020, revisão): confiança em IA cai mais por promessa quebrada do que por limite declarado. A cláusula "sem revisão humana / pode inventar" protege contra o pior caso (o chat dizer besteira a um convidado do dono).
5. **O §8 é o único lugar com a trava de crise em texto** (CVV 188). Decisão #20 (1 h com profissional) — **ainda aberto, depende do dono**. Em E0 os 10 são conhecidos: o risco reputacional é pessoal.

**Efeito em métrica: não medível hoje.** Não existe evento para "abriu Sobre" nem para "abriu a política pelo link" — e não deve existir (cliques em texto legal é dado de comportamento sem decisão pendurada). A única leitura indireta é `first_task_done`/`retained` não caírem — inconclusiva. Rótulo: **hipótese**.

---

## 5. `TermsUpdateBanner` no dia 1 de um convidado

`termsNotice.ts` › `precisaAvisarTermos(consent, TERMS_VERSION, PRIVACY_VERSION, avisoVisto)`: `false` sem `consent`; `true` se `consent.termsVersion < TERMS_VERSION` ou idem privacidade (comparação lexical de datas; versão ilegível conta como anterior).

O convidado grava consentimento em `SoulmonOnboarding.tsx` (`if (!consent) setConsent(buildConsentRecord())` — duas ocorrências, portão Google e e-mail) → `buildConsentRecord` carimba `TERMS_VERSION = PRIVACY_VERSION = '2026-09-21'` (`consent.ts`). Logo, **no dia 1 o banner NÃO aparece** — as versões são iguais.

**Quando aparece, e é um risco real para E0:** qualquer edição em `public/termos.html`/`privacidade.html` durante os 14 dias obriga o bump da constante (`consent.versoes.contract.test.ts` reprova divergência entre "Última atualização" e a constante) → **todos os 10 veem o banner no mesmo dia**, no meio do experimento. Há 3 edições legais na fila da própria sessão (#23 retenção `ord:` — já feita 21/09; #25 US$ — já feita; #27 §8 — já feita), mas a squad "autoaprova" (#27) e a Play (#16) vai pedir ajustes. **Guardrail de E0: congelar `TERMS_VERSION`/`PRIVACY_VERSION` do D0 ao D14.** Se precisar editar, editar sem carimbo (o guard exige carimbo = constante, então é edição adiada, não edição silenciosa).

Caso residual: `normalizeConsent` põe `'desconhecida'` quando falta `termsVersion` — só em save anterior aos Termos; não é o convidado.

---

## 6. Compartilhamento — `BirthCard` sem `navigator.share` (ainda aberto)

`grep -rn "navigator.share\|canShare\|toBlob" src` → 0. `BirthCard` (`src/components/BirthCard.tsx` › `BirthCard`) monta em 3 lugares: `SoulmonOnboarding.tsx` (GENERATING e REVEAL) e `StatsPage.tsx`. Sem saída, o ativo viral morre no aparelho — mesma conclusão de 03/08 e da review 12.

**Evento proposto `share_birthcard`** (nome do pedido; alternativa genérica `share {kind}` da review 12 — escolher UM):

- Schema: `share_birthcard: { where: {min:0,max:1}, result: {min:0,max:2} }` — `where` 0 = reveal, 1 = stats; `result` 0 = compartilhou (promise resolveu), 1 = cancelou (`AbortError`), 2 = sem `navigator.share` (mostrou fallback "copiar link"). Inteiros, sem texto. Paridade nos dois `EVENT_SCHEMA` + `applyAggregate` (`share_birthcard.where_N`, `share_birthcard.result_N`).
- Emissor: no `onClick` do botão dentro de `BirthCard` (é o componente que tem `name`/`spriteUrl`) ou, melhor, handler passado por prop pelos 3 montadores (o `BirthCard` é apresentação). Payload do share: `{ title, text: epíteto, url: APP_URL + '?src=convite' }` — **texto e imagem não vão para telemetria**, só para o `share`. Nome da criatura no `text` é dado do jogador indo para o app de destino por gesto dele — ok para `alpha-compliance` confirmar.
- **Loop fechado**: quem chega pelo link do cartão entra como `app_open.invite` (§2). Sem `?src=` no share, o cartão gera `direct` e o experimento não distingue.
- Não incluir a imagem (`files`) na v1: `spriteUrl` é `https://` de CDN (Higgsfield) e `canShare({files})` exige `File`; baixar e reempacotar é custo e CSP (`img-src https:`). Link + texto primeiro.

**Teste (falseável):**
- Hipótese: ≥3 dos 10 tocam compartilhar ao menos uma vez em 14 dias (30% é meta de trabalho, não previsão; a review 12 usava 15% por evolução).
- Métrica: `share_birthcard.result_0 / install` na janela; secundária `app_open.invite` **acima** dos 10 convites do dono (chegadas de 2º grau).
- Morte: `share_birthcard` total (0+1+2) = 0 em 14 dias → o botão não é visto ou o cartão não é motivo de orgulho; volta para produto antes de qualquer canal.
- Guardrail: o botão só no REVEAL e em Estatísticas — nunca em modal/push ("compartilhe!" é pedido do app, não da criatura — L11).
- Instrumentação: **não existe** (evento novo + 3 arquivos). Pedido ao `alpha-insights`.

---

## 7. Critério de morte de E0 — sustentar ou corrigir

Review 12: morte se `first_task_done < 6/10` **ou** `retained.d7 ≤ 2/10`; efeito mínimo `retained.d7 ≥ 4/10` e `week_active.goal_days ≥ 4` em ≥3/10 na semana 2.

**O que o funil realmente mede (verificado):**

| Termo | O que o agregado devolve | Ajuste |
|---|---|---|
| "10" (denominador) | `install` = 1ª carga do bundle **por storage**. iOS Safari: aba do WhatsApp/Safari e o ícone na tela inicial têm storages separados → **uma pessoa = 2 `install`** e `K_INSTALL_DAY` duplicado (a retenção se divide). Android Chrome compartilha storage entre aba e PWA — 1. | Denominador = **10 (pessoas, contadas pelo dono)**, não `install`. Registrar `install` observado ao lado: se > 10, o excesso é iOS ou reinstalação, não pessoa. |
| `first_task_done < 6/10` | Evento fiel (uma vez na vida, imediato, no dia do gesto). **Não sabe se foi D0/D1** (§1.2). | Manter o número; ler acumulado até D14. Se quiser "D0/D1", precisa do prop `age` (§1.3). |
| `retained.d7 ≤ 2/10` | = "abriu ao menos uma vez entre D7 e D29 desde a 1ª carga" (`retentionBucketFor`, maior marco). Emitido **na abertura** → não depende de fazer nada. Numa janela de 14 dias, cada pessoa tem D7..D13 para emitir. | Manter como está: para E0 a pergunta é exatamente "voltou na 2ª semana". Ler no **D15+** (a pessoa que instalou no D0 do dono pode ter D7 no dia 7, mas quem entrou no D3 tem D7 no dia 10 — ler cedo subestima). |
| efeito mínimo `goal_days ≥ 4` em 3/10 na semana 2 | `week_active` da semana 2 só despacha quando a pessoa fecha um dia na **semana 3** (`flushWeekLedger`). | **Não legível no D14.** Ou (a) ler no D21+, ou (b) substituir por `week_active.goal_days ≥ 4` da **semana 1** (despachado na semana 2 — legível). Recomendo (b) para a leitura de morte e (a) para a leitura de efeito. |
| `day_active` | Perde dias fechados em aba oculta (§1.5); só existe para quem voltou (o dia fecha na próxima abertura). | Usar como tendência, nunca como critério. |

**Critério corrigido (proposta):**

> **Morte** (ler no D15): `first_task_done` acumulado < 6 (de 10 pessoas) **ou** `retained.d7` acumulado ≤ 2.
> **Efeito mínimo** (ler no D21): `retained.d7` ≥ 4 **e** histograma `week_active.goal_days ≥ 4` com ≥ 3 semanas fechadas na janela D8–D21.
> **Guardrails** (não podem piorar): `push_optout` ≤ 2 em 14 dias; `unlock_view.report` para `paid` = 0 (cortesia não vê oferta — verificar §3.2); `TERMS_VERSION` congelada.
> **Pré-condições**: `METRICS_ADMIN_KEY` (dono, #18 — **ainda aberto**); worker de push deployado **ou** explicitamente não (se não, a análise de push sai do experimento e §3 vale só para o poll do cliente); os 10 chegam por `?src=convite`.

Se morrer em `first_task_done`: alvo é o onboarding pago/cortesia (~19 telas) — `onboarding_step.paid.<n>` diz onde. Se morrer em `retained.d7` com `first_task_done` alto: o produto ativa e não segura — hipótese seguinte é a 1ª evolução (`FORM_REQUIREMENTS.required = 4` dias completos para rookie→champion), que **exige `evolve` emitido** (§1.3).

---

## 8. Achados novos desta rodada (não estão no consolidado da manhã)

| # | Achado | Prova |
|---|---|---|
| N1 | `day_active` perdido quando a virada roda com a aba oculta | `telemetry.ts` › `track` (guard `isDocumentHidden`), `useDailyReset.ts` › `checkRollover` sem guard, `App.tsx` efeito `[gameState.lastDayReport]` |
| N2 | Push no D0 não é suprimido; comentário de `pushCopy` afirma o contrário | `_pushCopy.js` › `pushCopy` (`idade === 1 || idade === 2` só troca a copy) |
| N3 | `week_active.active_days` chega ao servidor e não vira chave; `renderRelatorio` só imprime `goal_days` | `metrics.js` › `applyAggregate`; `tools/metricsReport.mjs` › `histogramaGoalDays` |
| N4 | Semana 2 de E0 ilegível no D14 (despacho na semana seguinte) | `telemetry.ts` › `flushWeekLedger` |
| N5 | `03-FLUXO-DE-TELAS.md` §3.2 lista 7 avisos; código tem 8 (`carga`) | `App.tsx` IIFE `avisos` |
| N6 | `retained.d1` não é D1: quem volta só no D10 emite `d7` e nunca `d1` | `telemetry.ts` › `retentionBucketFor` |
| N7 | iOS: `install` dobra por pessoa (storage por contexto); nenhum doc trata iOS em E0 | comportamento de plataforma; `grep -rin "ios\|safari" docs/manual/03-FLUXO-DE-TELAS.md` → conferir (não medi) |
| N8 | `handleCheckInSkip` não emite evento; recusa do ritual só por subtração | `App.tsx` › `handleCheckInSkip` |
| N9 | Bump de `TERMS_VERSION` durante E0 mostra banner aos 10 no mesmo dia | `termsNotice.ts` › `precisaAvisarTermos`; `consent.versoes.contract.test.ts` |
| N10 | Tabela curta do funil imprime `onboarding_step` como "% do topo" (~1400%) | `scripts/metrics-report.mjs` › `LINHAS_DO_FUNIL` |

Ainda abertos da manhã (não repetidos em detalhe): `evolve`/`milestone`/`dungeon_run` sem emissor; UTM ausente; `navigator.share` ausente; `pwa_installed` ausente; `METRICS_ADMIN_KEY`; worker no ar desconhecido; decisão #20 (crise).

---

## 9. Tabela final — achado · severidade · conserto · dono

| Achado | Severidade | Conserto | Dono |
|---|---|---|---|
| N1 `day_active` perdido em aba oculta | **alto** (corrói a linha do funil que o dono lê) | `trackDayClosed` enfileira mesmo oculto (flag `force` em `track`, ou guard só nos eventos de sessão) + teste em `telemetry.test.ts` | `alpha-insights` |
| N4 semana 2 ilegível no D14 | **alto** (o efeito mínimo de E0 não tem leitor na data prevista) | Ler no D21; critério de morte usa semana 1 (§7) | `alpha-growth` (plano) |
| N2 push no D0 | **médio** (1ª notificação da vida do app no dia em que a pessoa já esteve dentro) | `pushCopy`: `if (idade === 0) return null;` + caso em `pushCopy.parity.test.js` | `alpha-growth` → `alpha-compliance` (é comunicação) |
| Emissores `evolve`/`milestone`/`dungeon_run` | **médio** (ainda aberto; hipótese de ativação nº2 não falseável) | §1.3 | `alpha-insights` |
| N3 `active_days` sem chave | **médio** | `applyAggregate` + `renderRelatorio` | `alpha-insights` |
| `?src=convite` | **médio** (sem ele, E0 não distingue convite de direto) | §2 (5 pontos, 3 arquivos + `history.replaceState`) | `alpha-insights` |
| N9 congelar `TERMS_VERSION` em E0 | **médio** | Regra de sessão no `STATUS.md` durante D0–D14 | coordenador |
| `share_birthcard` | **médio** (único ativo viral) | §6 | `alpha-product-manager` + `alpha-insights` |
| Worker push incondicional às 10h/16h para quem já cumpriu a meta | **médio** | Decisão: aceitar (já declarado) ou o worker ler `goalMet` de um campo da subscription atualizado pelo cliente (custo: 1 write/dia) | dono decide |
| Oferta no relatório para `paid`/cortesia (não verificado) | **médio** se real | `grep -n "ofereceNoRelatorio" src/App.tsx`; exigir `accountTier !== 'paid'` | `alpha-product-manager` |
| N7 iOS dobra `install` | **baixo** para 10 pessoas (dono sabe quem é iPhone) | Denominador = pessoas; anotar plataforma dos 10 | dono (lista) |
| N6 `retained.d1` semântica | **baixo** (rotular) | Rótulo "D1–D6" no `renderRelatorio` | `alpha-insights` |
| N5 doc §3.2 com 7 em vez de 8 | **baixo** | Linha `carga` na tabela | `doc-mantenedor` |
| N8 skip do check-in sem evento | **baixo** | `checkin_skip` (sem prop) — ou aceitar a subtração | `alpha-insights` |
| N10 `% do topo` em `onboarding_step` | **baixo** | Trocar a linha por `onboarding_step.demo.35`+`paid.35` (REGISTER) ou imprimir "n/a" | `alpha-insights` |
| Modais D0 (popup 1ª conclusão + WelcomePrompt com 2 pedidos) | **baixo/médio** | Orçamento §3.3: PWA no D0, push no D1 após o relatório | `alpha-product-manager` → `alpha-compliance` |

## 10. O que continua sem dono

- **Entrega de push** (evento "push entregue/exibido" no `sw.js` › `push`): sem ele `app_open.push` não tem denominador — apontado em `16`, ninguém assumiu.
- **iOS como plataforma de E0**: nenhum doc, nenhum guarda (`soulmon-guarda-plataforma` cobre Android/desktop/EN/a11y). Se 1 dos 10 for iPhone, PWA no iOS não recebe Web Push sem instalar na tela inicial (iOS 16.4+), e o storage dobra.
- **Leitura da semana 2** (quem roda o script no D21 e compara com o D15): o "dono lê toda segunda" do cabeçalho do script não tem calendário de E0 anexado.
- **Revisão profissional da trava de crise** (#20) — do dono, antes do D0.
- **`METRICS_ADMIN_KEY` + worker no ar** — do dono; sem os dois, E0 é uso, não experimento.
