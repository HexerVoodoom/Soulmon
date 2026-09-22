# QA rodada 2 — 02 · Discovery + Requisitos do E0 ("10 conhecidos, PWA, cortesia, 14 dias")

Data: 21/09/2026 (noite) · Papéis: `alpha-discovery` + `alpha-requisitos` · Base: `qa/rodada-a` @ `5228145e` · Somente leitura.
Fontes lidas: `docs/manual/01-VISAO.md` §3/§10, `03-FLUXO-DE-TELAS.md` §2–§4, `06-REFERENCIA/api-workers.md` › `entitlements.js`, `docs/PLAY-LANCAMENTO.md` §E, `docs/REGISTRO-DE-DECISOES.md` (linha "Camada 3 CONGELADA"), `docs/PERGUNTAS-DO-DONO.md` "Respostas QA GERAL", `docs/STATUS.md` (3 blocos de 21/09), `docs/reviews/2026-09-21-qa-geral/{00,12}`, `src/utils/telemetry.ts`, `functions/api/metrics.js`, `functions/api/entitlements.js`, `scripts/metrics-report.mjs`, `tools/metricsReport.mjs`, `src/App.tsx` (por símbolo), `src/components/{SoulmonOnboarding,FeedbackLink}.tsx`, `src/utils/{entitlements,cloudSave,pushPriming}.ts`.
Limite desta frente: sem shell nesta sessão — não rodei `git log 11e9b237..HEAD`; "o que mudou hoje" foi lido pelos blocos datados do `STATUS.md`. Nenhum número abaixo é medido em usuário (não existe usuário); os números são contagens de código/doc, com o comando ou o símbolo ao lado.

Regra da rodada respeitada: o que a review 12 e o consolidado já listaram só reaparece como "ainda aberto".

---

## 0. Veredito em cinco linhas

1. **O E0 não está pronto para rodar.** Está pronto para *gravar*; não está pronto para *ser lido*, *ser operado* nem para *testar a hipótese certa*.
2. **A hipótese que o E0 diz testar ("o produto retém quem chega com contexto") não é a que o desenho atual testa.** Pelo caminho que existe hoje, os 10 convidados atravessam o funil **demo**, ganham cortesia em silêncio, e a única porta para o Oráculo (o diferencial que justifica a cortesia, decisão #12) é uma linha discreta na página Evolução (`App.tsx` › `currentView === 'evolution' && gameState.demoCharacterId` → `UnlockNudge variant='reveal'`). Sem convite explícito, o E0 mede o **demo**, não o Soulmon.
3. **O critério de morte da review 12 sustenta-se pela metade.** `first_task_done < 6/10` é legível no dia 1 do experimento. `retained.d7 ≤ 2/10` é legível, mas só ≥7 dias após o **último** convite, com `--days` maior que o padrão 7 do script, e o servidor **declara na própria resposta** que D7 não é calculável (`metrics.js` › `onRequestGet` › `notes.unreadable: ['retencao','D7',…]`) enquanto grava `retained.d7` (`applyAggregate`). Quem ler vai desconfiar do número que decide.
4. **Não existe o experimento como procedimento.** `grep -rn "\bE0\b" docs --glob '!reviews/**'` devolve só a S13 do som, `PLAY-LANCAMENTO.md` §E.1 (3 secrets) e §D (lista de testadores da Play). Convite, concessão, leitura semanal, suporte e o que fazer quando alguém trava: **zero linhas**.
5. **Três coisas dependem do dono e nenhuma foi feita** (STATUS 21/09, bloco "EXECUÇÃO etapas 1–3"): `METRICS_ADMIN_KEY`, `ENTITLEMENTS_ADMIN_KEY`/`COURTESY_MAX_ACCOUNTS`, e o `wrangler deploy` do worker de push. Sem a terceira, o E0 roda **sem nenhum push** — e a hipótese de retenção fica confundida com "sem reengajamento".

---

## 1. Enquadramento — o problema, não a solução

### 1.1 O pedido veio como solução

"Rodar o E0" é solução. O problema por baixo: **o projeto tem 7 semanas de produto e zero observação de uso** (`01-VISAO.md` §10: "ninguém nunca usou o app em produção"). Toda regra do `CLAUDE.md` decide sobre retenção **imaginada**. A Camada 3 está congelada até "10 usuários × 14 dias de dado" (`REGISTRO-DE-DECISOES.md`, linha "Camada 3 CONGELADA") — logo o E0 é também o **gatilho de descongelamento**, o que dá a ele um segundo dono de expectativa (a squad que quer voltar a construir) e um viés declarável: pressão para ler "passou".

### 1.2 JTBD do experimento

> Quando **um app v-pet de hábitos está completo e nunca foi usado**, quero **saber se uma pessoa real adulta com contexto (amigo do dono) volta por 7 dias e conclui coisas reais**, para **decidir se o próximo mês é distribuição (Play, canal) ou produto (onboarding, núcleo)**.

Dor mensurável: cada semana sem essa resposta é uma semana de Camada 1–3 construída sobre suposição — o `08-produto-maestro.md` já mediu 1 rodada de produto em 7 semanas.

### 1.3 O que precisamos aprender em 14 dias (em ordem de custo de estar errado)

| # | Pergunta | Evento que responde | Legível em |
|---|---|---|---|
| A1 | O onboarding de 16 telas perde alguém antes de existir um save? | `onboarding_step.demo.<n>` por passo (`applyAggregate`); o passo `REGISTER` = 35, negativos codificados por `onboardingStepCode` (`NEGATIVE_STEP_BASE = 45`) | D+1 |
| A2 | Quem chega à Home conclui algo real no D0/D1? | `first_task_done` (`ONCE_EVER`, emitido em `App.tsx` no efeito de `showFirstTaskPopup`) | D+2 |
| A3 | A cortesia foi **encontrada e usada**? (= o E0 testa o Soulmon, não o demo) | `reveal_seen.paid.*` — o reveal do `mode='upgrade'` emite `funnel: TELEMETRY_FUNNEL.paid` (`SoulmonOnboarding.tsx` › `track('reveal_seen'`) | D+3 |
| A4 | Quem volta depois de D7? | `retained.d7` (`trackRetentionOnOpen` na abertura; bucket = **maior** marco cruzado; `seenKeyFor` = 1× na vida) | **D7 após o ÚLTIMO convite** |
| A5 | O ativo bate a própria meta em ≥4/7 na semana 2? (métrica-norte) | `week_active.goal_days.N` — despachado só no **primeiro fechamento de dia da semana seguinte** (`flushWeekLedger` ← `trackDayClosed`) | **semana 3**, e só de quem voltou |
| A6 | Push traz gente que faz algo? | `app_open.push / day_active` | só se o worker estiver no ar |

### 1.4 Hipóteses falseáveis (mecanismo declarado)

- **H1 (retenção por contexto):** quem chega por convite pessoal de adulto conhecido volta ≥1× entre D7 e D14 porque o vínculo social substitui o push como lembrete. Falseia: `retained.d7 ≤ 2` de 10 **com** worker de push desligado *e* interview dizendo "esqueci" (sem o qualitativo, "esqueci" e "não gostei" caem no mesmo zero).
- **H2 (a 1ª tarefa é ativação):** quem conclui algo no D0/D1 volta em D7 mais que quem não conclui. Falseia: `first_task_done ≥ 7/10` e `retained.d7 ≤ 2/10` (a 1ª tarefa acontece e não segura ninguém — o candidato seguinte é a 1ª evolução, que **não tem emissor**, §3).
- **H3 (a cortesia é o diferencial):** quem faz o ritual do Oráculo (`reveal_seen.paid`) retém mais que quem fica no demo. Falseia: `reveal_seen.paid < 5/10` (metade não achou a porta — então o E0 não testou H3, testou o demo) **ou** `reveal_seen.paid ≥ 8` e `retained.d7 ≤ 2` (achou, viu, e foi embora — o diferencial não segura).

### 1.5 Critério de morte — sustento ou refuto

| Critério da review 12 | Veredito | Por quê (código) |
|---|---|---|
| `first_task_done < 6/10` | **Sustento, com denominador trocado.** Use **10 = pessoas convidadas**, nunca `install`. | `install` conta **aparelhos**, não pessoas (`ONCE_EVER` por `localStorage`, `K_SEEN`): amigo que abre no celular e no notebook = 2; o próprio dono testando a URL de produção = +1. Com n=10, um `install` a mais muda o veredito. |
| `retained.d7 ≤ 2/10` | **Sustento como regra de decisão, refuto como "D7".** O contador é "abriu ao menos uma vez entre D7 e D29 após a instalação daquele aparelho". | `retentionBucketFor(dias)` devolve o **maior** marco cruzado; quem some 6 dias e volta no 8º emite `d7` (nunca `d1`). Leitura só faz sentido **≥7 dias após o último convite** e com `--days ≥ 21` (`scripts/metrics-report.mjs` › `DIAS_PADRAO = 7`; teto `MAX_READ_DAYS = 92`). E a resposta do servidor diz `unreadable: ['retencao','D7',…]` — texto anterior ao conserto de 06/09 que criou `retained.d7`; o `--full` imprime a lista no topo e a tabela de retenção embaixo. **Contradição na mesma tela.** |
| "≥3/10 com `week_active.goal_days ≥ 4` na semana 2" (efeito mínimo) | **Refuto como leitura de D14.** | Só despacha na semana 3 e só para quem abriu o app na semana 3 (`flushWeekLedger` chamado dentro de `trackDayClosed` quando `ledger.w !== week`); enviesado a favor de quem ficou — o próprio cabeçalho de `telemetry.ts` ("LIMITE, declarado") diz isso. Fica como leitura **secundária em D21**. |
| (faltava) | **Acrescento um sinal de morte precoce:** `onboarding_step.demo.35` (REGISTER) `< 7/10` até D+3. | Se 3+ dos 10 não criam save, morreu no onboarding — e não vale esperar 14 dias para saber. |
| (faltava) | **Acrescento a condição de validade:** `reveal_seen.paid ≥ 6/10` até D+7. Abaixo disso o E0 **não testou H3** e o resultado de retenção é do demo. | Ver §4.3. |

Honestidade estatística: com n=10, 6/10 vs 5/10 é **uma pessoa**. Estes números são **regras de decisão combinadas**, não estatística — por isso o requisito R9 (entrevista curta em D7 e D14) é OBRIGATÓRIO e não "desejável".

### 1.6 Ligação ao negócio

Move a métrica-norte (peso de esforço por ativo/semana, `summarizeNorthStar`) **indiretamente**: o E0 não muda o número; ele **cria o primeiro número**. Mecanismo: sem `week_active` real, `NORTH_STAR_GOAL_DAYS = 4` é um alvo sem baseline. Prioridade não se questiona — é o que destrava #13.

### 1.7 Menor experimento

Ordem de custo: **análise de dado existente** — não há dado. **Estudo com painel** — são os 10 conhecidos; é o próprio E0. Portanto o E0 já é o menor experimento *possível*; o que o torna caro hoje não é o desenho, é a **operação** (§2). O que ele **não responde**: canal (sem UTM), conversão (todos cortesia), retenção de estranho (todos têm contexto), iOS (ver §5).

---

## 2. Requisitos para o E0 rodar — OBRIGATÓRIO / DESEJÁVEL / OPCIONAL

Critério de aceite sempre testável por comando, contador ou artefato.

### 2.1 OBRIGATÓRIO (sem isto o E0 não é experimento)

| # | Requisito | Aceite | Dono | Fonte |
|---|---|---|---|---|
| R1 | Os 3 secrets no Worker: `METRICS_ADMIN_KEY`, `ENTITLEMENTS_ADMIN_KEY`, `COURTESY_MAX_ACCOUNTS=10` | `npx wrangler secret list` lista os 3; `METRICS_ADMIN_KEY=… node scripts/metrics-report.mjs` sai com código **0** (não 2/3) | **Dono** | `PLAY-LANCAMENTO.md` §E.1; `metrics.js` › `onRequestGet` 404 fail-closed; `entitlements.js` › `handleGrant` |
| R2 | **Baseline antes do convite**: o dono desliga "Enviar estatísticas de uso" nos próprios aparelhos (`SettingsPage` › `setTelemetryEnabled(false)`) **ou** anota o `install` acumulado no dia −1 | Relatório do dia −1 arquivado; denominador do E0 = **10 pessoas**, nunca `totals.install` | Dono + squad | `telemetry.ts` › `ONCE_EVER`, `isTelemetryEnabled` |
| R3 | **Runbook da cortesia** (humano): e-mail do convidado → `saveId` = `SHA-256("soulmon:" + email.trim().toLowerCase())` cortado em 32 hex (`cloudSave.ts` › `emailToSaveId`) → `curl -X POST "$APP_URL/api/entitlements?action=grant" -H "Authorization: Bearer $ENTITLEMENTS_ADMIN_KEY" -d '{"saveId":"…"}'` → conferir `GET /api/entitlements?id=…` devolve `tier:'paid'`, `provider:'courtesy'`. **Não existe script para o passo 2** (`grep -l emailToSaveId scripts/` → só `mutation-sweep.mjs`) — o dono calcularia SHA-256 à mão | `scripts/save-id.mjs <email>` existe e devolve os 32 hex iguais aos de `emailToSaveId` (teste de paridade com `functions/api/saveId.parity.test.js`); runbook em `docs/` com os 4 passos e o "feito quando" | Squad (script + doc), dono (executa) | `api-workers.md` › `entitlements.js` "Uso: curl…" |
| R4 | **A cortesia tem de ser encontrável** — hoje o tier vira `paid` em silêncio (`App.tsx` › `fetchEntitlement().then(… accountTier: ent.tier)`) e a única porta é `UnlockNudge variant='reveal'` na Evolução. Mínimo aceitável para E0: o **texto do convite** diz literalmente "depois de escolher o personagem, abra Evolução e toque em *[texto da linha reveal]*". Ideal (R-D1): aviso in-app | `reveal_seen.paid ≥ 6/10` até D+7 (contador `reveal_seen.paid.sprite_yes + sprite_no`) | Squad (texto) + `alpha-compliance` (bíblia) | `App.tsx` linha do `UnlockNudge` em `currentView === 'evolution'`; `SoulmonOnboarding.tsx` › `handleUnlockFull` › `!isBillingAvailable()` |
| R5 | **O convite avisa a contradição do botão pago**: no PWA, "Quero o completo — R$…" (CHOICE_STEP e REVEAL_DEMO) responde "A compra está disponível no app Android (Google Play). Enquanto isso, experimente o modo demo." Um convidado que recebeu "você tem a versão completa" lê isto como erro | Frase no convite: "escolha *Começar agora — é grátis*; a versão completa chega por dentro" | Squad | `SoulmonOnboarding.tsx` › `handleUnlockFull` saída 1 |
| R6 | **Leitura semanal com dono e hora**: quem = dono; quando = segunda 09:00 BRT (D+7, D+14, D+21); comando = `METRICS_ADMIN_KEY=… node scripts/metrics-report.mjs --days 21 --full`; onde = saída colada em `docs/E0-DIARIO.md` (ou nome que o `doc-bibliotecario` indexar) | 3 leituras arquivadas com data; a de D+21 contém `week_active.goal_days.*` | Dono (roda), squad (lê e escreve o veredito) | `scripts/metrics-report.mjs` › `DIAS_PADRAO`, saídas 0/2/3/4 |
| R7 | **Runbook de suporte** — não existe (`Glob docs/**/*{RUNBOOK,SUPORTE}*` → vazio). Cinco estados conhecidos que travam um convidado: (a) link de e-mail abre fora do PWA e perde o rascunho (`gateDraft.ts` cobre — confirmar); (b) 403 no save por `saveId` divergente (`cloudSave.ts` B-R1); (c) WebView/Safari velho → "Precisamos de uma atualização" (`index.html` › `selector(&)`); (d) "compra só no Android" (R5); (e) instalar PWA no iPhone (Compartilhar → Adicionar à Tela de Início; sem `beforeinstallprompt`) | Doc com os 5 sintomas → causa → resposta pronta; canal de resposta = `FEEDBACK_EMAIL` + grupo direto com o dono; SLA declarado (≤24 h) | Squad + dono | `FeedbackLink.tsx` › `feedbackMailto` |
| R8 | **Worker de push: no ar ou declarado desligado.** Sem `wrangler deploy` em `workers/`, zero push chega (cron 10/16/22 BRT). Rodar sem push é aceitável **se registrado** como condição do E0 — senão H1 fica confundida | `cd workers && npx wrangler deployments list` com data ≥ `git log -1 --format=%ci -- workers/`, **ou** linha "E0 rodou sem push" no diário | **Dono** | `PLAY-LANCAMENTO.md` §E.2; consolidado A1 |
| R9 | **Entrevista curta em D7 e D14** (5 perguntas, 10 min, `alpha-gestor-pesquisa`) — com n=10, o contador sem a fala é ambíguo ("esqueci" ≠ "não gostei" ≠ "travou") | 10 respostas em D7, ≥7 em D14, codificadas em 3 baldes (esqueci / não vi valor / travou) | `alpha-gestor-pesquisa` + dono | §1.5 |
| R10 | **Data de início única ou janela ≤3 dias** de convites; a leitura D7/D14 conta a partir do **último** convite | Diário registra data de cada convite; leitura D7 = último + 7 | Dono | `trackRetentionOnOpen` › `K_INSTALL_DAY` por aparelho |

### 2.2 DESEJÁVEL (melhora a leitura; não bloqueia)

| # | Requisito | Aceite | Dono |
|---|---|---|---|
| R-D1 | Aviso in-app quando `accountTier` vira `paid` com `demoCharacterId` presente ("Sua leitura completa está liberada") — entra na **Fila 2** com posição declarada (`filaDeAvisos.contract.test.ts`) | `reveal_seen.paid ≥ 9/10` sem instrução no convite | `alpha-product-manager` → squad |
| R-D2 | Corrigir `notes.unreadable` em `metrics.js` › `onRequestGet` para não listar `D7` (existe `retained.d7` desde `applyAggregate` de 06/09); manter "coorte" | `--full` não diz "D7 não calculável" e imprime RETENÇÃO | squad (`alpha-insights`) |
| R-D3 | `scripts/metrics-report.mjs --e0 <data-do-último-convite>`: janela automática convite−1 … hoje, e linha "n convidados = 10" como denominador declarado | Saída com `first_task_done ÷ 10`, `retained.d7 ÷ 10`, `reveal_seen.paid ÷ 10` | squad |
| R-D4 | Emissor de `evolve {level}` em `handleEvolve` (schema existe nos dois lados; **ainda aberto** — `grep -rn "track('evolve'" src` → 0) | contador `evolve.level_1` aparece | `alpha-insights` |
| R-D5 | Evento `pwa_installed` do `appinstalled` (`InstallPrompt.tsx`/`WelcomePromptModal.tsx` só fazem `setInstalled`) — separa "usa no navegador" de "instalou" | schema nos dois arquivos + paridade | `alpha-insights` |
| R-D6 | Teste no iPhone antes do convite (Safari ≥17.2 para `selector(&)`; PWA iOS tem storage separado do Safari → `install` duplo) | 1 passada gravada: onboarding → 1ª tarefa → fechar/reabrir | `soulmon-guarda-plataforma` |

### 2.3 OPCIONAL

`?c=` campanha inteira (E1/E2, não E0) · cartão compartilhável (E3) · `milestone`/`dungeon_run` emissores (ainda abertos, não decidem E0) · coorte por semana de instalação (trade-off do dono, `metrics.js` cabeçalho — **não** abrir agora).

---

## 3. Lacunas de instrumentação para as hipóteses (sem inventar número)

| Hipótese | O que falta | Estado |
|---|---|---|
| H1 | Nada falta para o contador; falta o **qualitativo** (R9) para separar "esqueci" de "não gostei" | lacuna de método, não de código |
| H2 | `evolve` sem emissor — se a 1ª tarefa não for ativação, o candidato seguinte é ilegível | **ainda aberto** (review 12 §2.1) |
| H3 | `reveal_seen.paid` **existe** e basta para "fez o ritual"; falta `first_task_done`/`day_active` por **funil de origem** (demo→cortesia vs demo puro): o `tier` carimbado em `track` é o **vigente** (`telemetryTier()`), então uma pessoa que concluiu a 1ª tarefa antes do grant sai como `first_task_done.demo` e depois vive como `paid`. Com cortesia concedida **antes** do 1º login (owner calcula `saveId` do e-mail — R3) o tier já nasce `paid` na 1ª sincronização e o problema some | lacuna de **ordem operacional**, resolvida por R3 (grant antes do convite) |
| A1 | Nada — `onboarding_step.demo.<n>` cobre passo a passo | ok |
| A6 | `app_open.push` só existe se o worker estiver no ar (R8) | depende do dono |
| Todas | `install` ≠ pessoa; `day_active` ≠ pessoa (o próprio `tools/metricsReport.mjs` avisa). Sem coorte por desenho. Denominador **tem** que vir de fora (R2/R10) | por desenho |
| Todas | Eventos com o app em segundo plano são descartados (`track` › `isDocumentHidden()`); `MAX_DAY_SKEW_DAYS = 7` no servidor descarta fila que ficou >7 dias sem flush — quem some 8 dias e volta perde o que estava na fila (não o `retained`, que é emitido na hora) | por desenho; declarar |

---

## 4. O que no produto HOJE impede um convidado de chegar ao D7

### 4.1 Telas antes da Home (D0) — contagem pelo `03-FLUXO-DE-TELAS.md` §2.3–§2.4

Caminho grátis (o único possível no PWA, §2.2 acima): `IDENTITY_STEP` → `GOOGLE_STEP`/`EMAIL_STEP` (Termos + 18+) → `GOAL_STEP` → `STRUGGLE_STEP` → `CHOICE_STEP` → 6 × quiz (`QUIZ_START..QUIZ_END−1`) → `REVEAL_DEMO` (com `UnlockNudge reason="reveal-demo"`) → `DEMO_PICK` → `REGISTER` = **14 telas**, mais `GameTutorialFlow` (`PAGES.length = 1` + `TASK_STEP` obrigatório) = **16 telas até a Home**, sem contar splash e vídeo de intro (pulável). Dois passos puláveis (GOAL/STRUGGLE); um pedido de conta **antes** de ver o app (é a tela que a review 12 §7 apontou como a que mais mata frio — aqui é "morno", e a pergunta A1 mede exatamente isso).

### 4.2 Avisos e modais nos 3 primeiros dias (do código, via `03` §3–§4)

| Dia | Superfície | Fila | Obrigatória? |
|---|---|---|---|
| D0 | `FirstDayCard` (3 gestos) | Fila 2, posição 0 | não (card, sem fechar) |
| D0 | popup da 1ª conclusão (`showFirstTaskPopup`) | fora das filas | 1 toque |
| D0 | `WelcomePromptModal` — instalar PWA (se `beforeinstallprompt`) + notificações (após `jaConcluiuAlgo`) | Fila 1, último | até 2 pedidos |
| D0 | `UnlockNudge` do `REVEAL_DEMO` (já no onboarding) → se tocado, mensagem "só no Android" | onboarding | R5 |
| D1, D2, D3 | `DailyReportModal` (1×/dia, `DAILY_REPORT_SHOWN`) | Fila 1 | **sim** (abre sozinho) |
| D1, D2, D3 | `MorningCheckIn` (`needsCheckIn`; há hábitos porque o tutorial criou) | Fila 1 | **sim**; `onSkip` marca o dia (não volta) |
| D1–D3 | `MorningDream` — só se pôs o pet para dormir na janela | Fila 1 | condicional |
| D2–D3 | priming de push (2º pedido) — só se dispensou o 1º há ≥24 h (`shouldPrimePush`, `PRIMING_MIN_DAYS = 2`, `MAX = 3`) | Fila 2, posição 4 | não |
| D1+ | `TermsUpdateBanner` — **não** aparece para conta nova (`precisaAvisarTermos` exige consentimento a versão anterior) | — | — |
| D1+ | `ProtectProgressModal` — **não** aparece (exige `!USER_EMAIL`; no PWA com Firebase todo mundo tem e-mail) | — | — |

Total: **2 intersticiais obrigatórios por manhã** (relatório + check-in) a partir de D1, **até 3 pedidos no D0** (popup, instalar, notificar) — tudo dentro das duas filas, um por vez. Não é "muro de modais"; é ritual matinal de 2 passos. O risco não é volume, é **ordem**: o convidado que abre à noite do D1 recebe o relatório de ontem e o check-in de hoje de uma vez, antes de tocar no pet.

### 4.3 A cortesia invisível (o bloqueador real do D7 **do Soulmon**)

Sequência do código: (1) convidado atravessa o funil demo e escolhe 1 de 6 prontos; (2) dono concede; (3) na próxima abertura, `fetchEntitlement` grava `accountTier:'paid'` sem toast, sem aviso, sem fila; (4) o pet continua o demo; (5) a **única** porta é Evolução → linha `variant='reveal'` ("já pagou e saiu do ritual pela metade", `UnlockAccountModal.tsx`). Ninguém disse a ele que há um ritual a fazer. Quem não abre Evolução em 14 dias **nunca vê o Oráculo** — e a hipótese H3 morre sem ter sido testada. R4 (mínimo) / R-D1 (certo).

### 4.4 Sem push (R8)

Com o worker fora do ar, nenhum lembrete externo existe nos 14 dias; o único reengajamento é o convite social. Aceitável como **condição declarada**; inaceitável como surpresa na leitura.

### 4.5 Aparelho

`[suposição a validar]`: quantos dos 10 usam iPhone. iOS: sem `beforeinstallprompt` (o pedido de instalar do `WelcomePromptModal` nunca monta), instalação manual, storage do PWA separado do Safari (2 `install`, `K_INSTALL_DAY` duplicado), `selector(&)` exige Safari 17.2+. Não há uma linha sobre iOS no manual (`grep -rn "iOS\|Safari" docs/manual/03-FLUXO-DE-TELAS.md` → conferir; não medi).

---

## 5. Caminhos alternativos (obrigatório)

| Estado | O que acontece hoje | Cobre E0? |
|---|---|---|
| Link de e-mail abre em outro navegador | `readGateDraft()` devolve objetivo/dificuldade/aceite (`03` §2.3) | sim, mas R7(a) confirma na prática |
| Convidado sem Google, sem querer criar senha | `EMAIL_STEP` exige e-mail + senha; sem terceira via | limitação declarada no convite |
| `saveId` do grant digitado errado | `handleGrant` concede a um `saveId` inexistente (ent: criado) — sem validação de existência; vaga do teto consumida | R3: conferir `GET` depois |
| Grant repetido | idempotente (`courtesyOrderId`, `duplicate:true`) | ok |
| Teto `COURTESY_MAX_ACCOUNTS` estourado (11º) | 429 `courtesy-cap` | ok |
| Convidado desliga telemetria | soma no denominador e some do numerador → parece churn | R9 pergunta; declarar |
| Convidado abre em 2 aparelhos | 2 `install`, 2 `first_task_done` possíveis, `retained` duplicado; save único (cloud) | R2/R10: denominador externo |
| Dado parcial (fila >7 dias) | eventos descartados por `MAX_DAY_SKEW_DAYS` | declarar |
| Tela de erro | `ErrorBoundary` + `FeedbackLink` (mailto, versão + 8 chars do `saveId`) | ok; SLA em R7 |
| `mailto:` em PWA sem cliente de e-mail configurado (desktop) | nada abre; sem fallback de copiar endereço | R7 canal alternativo |
| Servidor sem `METRICS_ADMIN_KEY` na hora da leitura | script sai **3** e diz "sem permissão, não sem dados" | ok |
| KV escrita concorrente | pode perder contagem (read-modify-write) — com 10 pessoas, desprezível | declarar |

---

## 6. Premissa mais arriscada

**"10 conhecidos do dono, adultos, com PWA, medem o produto."** O que a falseia: (a) `reveal_seen.paid < 6/10` — mediram o demo; (b) `onboarding_step.demo.35 < 7/10` — mediram o portão de conta; (c) ≥3 dos 10 em iPhone sem passada de teste — mediram Safari; (d) o dono é o suporte, o leitor e o dono da expectativa de descongelar a Camada 3 — mediram a paciência dele. Todas as quatro são evitáveis **antes** do convite, e é por isso que o veredito é "não pronto", não "não vale".

---

## 7. Tabela final — achado · severidade · conserto · dono

| # | Achado | Sev. | Conserto | Dono |
|---|---|---|---|---|
| 1 | Cortesia concedida vira `paid` **em silêncio**; única porta para o Oráculo é `UnlockNudge variant='reveal'` em Evolução (`App.tsx` › `currentView === 'evolution' && gameState.demoCharacterId`) — E0 mede o demo | **fatal** para H3 | R4 (texto do convite) agora; R-D1 (aviso na Fila 2) antes do convite se couber | `alpha-product-manager` → squad; compliance no texto |
| 2 | Não existe procedimento do E0 (convite, grant, leitura, suporte) — `grep -rn "\bE0\b" docs --glob '!reviews/**'` só acha som e secrets | **alto** | R3 + R6 + R7 num doc indexado no MAPA | squad (`soulmon-operador` para a parte "ar") |
| 3 | Sem script para `saveId ← e-mail` (`emailToSaveId` só em `src/utils/cloudSave.ts`); o grant pede 32 hex | **alto** | `scripts/save-id.mjs` + paridade com `saveId.parity.test.js` | squad |
| 4 | `metrics.js` › `onRequestGet` › `notes.unreadable` lista `D7` enquanto `applyAggregate` grava `retained.d7`; o `--full` imprime a contradição | **médio** | R-D2 | `alpha-insights` |
| 5 | Critério `retained.d7 ≤ 2/10` só é legível ≥7 dias após o **último** convite e com `--days ≥ 21` (`DIAS_PADRAO = 7`) | **médio** | R6/R10; R-D3 `--e0` | squad + dono |
| 6 | "`week_active.goal_days ≥ 4` na semana 2" não é legível em D14 (`flushWeekLedger` só na semana seguinte, só de quem voltou) | **médio** | rebaixar a leitura secundária de D21 | squad (doc) |
| 7 | `install` conta aparelhos e inclui o dono; denominador do E0 não pode ser `totals.install` | **médio** | R2 (opt-out nos aparelhos do dono / baseline dia −1) | dono |
| 8 | Botão "Quero o completo" no PWA responde "só no Android"; para convidado com cortesia lê como erro (`handleUnlockFull` saída 1) | **médio** | R5 no convite; opcional: texto alternativo quando `accountTier === 'paid'` | squad |
| 9 | Worker de push não deployado → E0 sem reengajamento; confunde H1 | **médio** | R8: deploy **ou** registrar "sem push" | **dono** |
| 10 | Sem entrevista, n=10 é ambíguo (esqueci / não vi valor / travou) | **médio** | R9 | `alpha-gestor-pesquisa` |
| 11 | `evolve` sem emissor — candidato seguinte a ativação ilegível (**ainda aberto**, review 12 §2.1) | baixo p/ E0 | R-D4 | `alpha-insights` |
| 12 | iOS nunca passado; PWA iOS = storage separado, sem `beforeinstallprompt`, `selector(&)` ≥ 17.2 `[suposição: há iPhone entre os 10]` | baixo/alto conforme a suposição | R-D6 | `soulmon-guarda-plataforma` |
| 13 | Os 3 secrets (#12/#18) continuam por definir (STATUS "Depende do dono") — **ainda aberto** | **fatal** para leitura | R1 | **dono** |

## 8. O que continua sem dono

- **O experimento E0 como um todo** — quem convida, quem concede, quem lê, quem responde. Hoje é "o dono" nos quatro papéis, e nenhum doc diz isso. Proposta: dono = convite + secrets + grant; `soulmon-operador` = worker/secret list; `alpha-insights` = leitura D7/D14/D21 e veredito escrito contra §1.5; `alpha-gestor-pesquisa` = R9.
- **Suporte ao usuário real** (R7): não há agente nem doc com essa responsabilidade; o consolidado §2.1 A1 fala de incidente em produção, não de pessoa travada.
- **A decisão de rodar sem push** (R8): ninguém pode tomá-la além do dono, e ninguém a pediu ainda.
- **iOS** como superfície: `soulmon-guarda-plataforma` cobre Android/desktop/EN/a11y; Safari/iOS não está no ledger `plataforma.md` (não conferi o ledger — afirmação a validar pelo guarda).
