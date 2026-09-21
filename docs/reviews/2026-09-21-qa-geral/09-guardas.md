# 09 — Auditoria dos 7 guardas do PLANO-MELHORIAS (somente leitura)

Data: 21/09/2026. Repo: `D:\Soulmon\repo` (HEAD `212da7d5`). Método: contagem por comando sobre
`docs/plano-melhorias/ledger/*.md`; para cada WP `VERIFICADO`, 1 grep de símbolo no código.
Convenção pedida: FEITO = `VERIFICADO`; PARCIAL = `IMPLEMENTADO` com fatia declarada em aberto;
DEPENDE DO DONO = `IMPLEMENTADO` esperando chave/APK/deploy; ABERTO = `PROPOSTO`/`EM CURSO`.

## 0. Resumo

- **87 WPs, não 86.** `LEDGER.md` abre com "São 86 pacotes"; a própria tabela consolidada e
  `grep -o 'WP[0-9]\+\.[0-9]\+' docs/PLANO-MELHORIAS.md | sort -u | wc -l` → **87**; as 6 tabelas de
  ledger somam **87** linhas únicas.
- Estado real por comando: **FEITO 78 · IMPLEMENTADO 7 · RECUSADO 2 · ABERTO 0**.
  A tabela "Estado consolidado" do `LEDGER.md` diz 79/5/3 e **não soma nem as próprias linhas**
  (1+1+1+1+2+2 = 8 IMPLEMENTADO, não 5; permanência lá está 18/2 e o arquivo diz 19/1).
- **2 FALSOS POSITIVOS** entre os 78 FEITO: **WP1.14** (a tela do link mágico foi apagada em
  `ff3e48e1`/`2f264307`, 07/09 — o pacote não tem mais onde existir) e **WP3.4** (a parte 3 da spec,
  win-back, nunca foi escrita: zero ocorrências de `winback`/`winbackSentAt` em `workers/`,
  `functions/`, `src/`).
- **8 comandos de aceite apontam para símbolo/arquivo que não existe** (o pacote existe, o
  comando mente): WP2.6, WP2.14, WP3.5, WP4.8, WP4.21, WP1.17, WP4.14 (OR do `grep -q`), WP3.4.
- Linhas vermelhas: o `.md` do guarda e o `vetos.md` dizem "20 proibições / 8 por tese"; o
  manual diz **21 / 9**. Das 9 "por tese", **4 já têm teste** (#13, #14, #16, #21) e a lista não
  foi atualizada. **#20 é violada por um teste do próprio guarda da constância**
  (`widgetSemCobranca.contract.test.ts` exige REMOÇÃO de chave do bridge).
- Cada guarda tem um núcleo do próprio domínio que nunca citou (§3): `petVoice.ts` (vínculo),
  `useDailyReset.ts` (constância), `billing.js`/`_entitlements.js` (sustento),
  `arena.ts`/`RebirthModal.tsx`/`achievements.ts` (permanência), `generate-sprite.js`/
  `GameTutorialFlow.tsx` (nascimento), `_redact.js`/`_aiGuard.js`/`account.js` (medição).
- Fase 4 (Health Connect): **corretamente isolada**, sem código morto — mas a frase do
  `STATUS.md` "nada no código de hoje lê sensor" ficou falsa depois de `src/utils/steps.ts`.

## 1. Ledger — contagem por guarda e checagem de evidência

Comando: `grep -E '^\| WP[0-9]+\.[0-9]+ ' ledger/<g>.md | awk -F'|' '{print $4}' | grep -c '^ *\`<ESTADO>'`

| Guarda | Linhas | FEITO | PARCIAL | DEPENDE DO DONO | RECUSADO | ABERTO | Falso positivo |
|---|---|---|---|---|---|---|---|
| medição | 13 | 12 | 0 | 1 (WP0.1 — `METRICS_ADMIN_KEY`) | 0 | 0 | 0 |
| nascimento | 17 | 16 | 1 (WP1.2 — régua da bio) | 0 | 0 | 0 | **1 (WP1.14)** |
| constância | 15 | 13 | 0 | 1 (WP2.6 — APK) | 1 (WP2.1, D3) | 0 | 0 |
| vínculo | 11 | 10 | 1 (WP3.1 — memória de sessão) | 0 | 0 | 0 | **1 (WP3.4)** |
| permanência | 21 | 19 | 1 (WP4.5 — vitrine sazonal) | 0 | 1 (WP4.4) | 0 | 0 |
| sustento | 10 | 8 | 0 | 2 (WP0.6, WP5.8 — APK) | 0 | 0 | 0 |
| **Total** | **87** | **78** | **3** | **4** | **2** | **0** | **2** |

Observação: a tabela consolidada do `LEDGER.md` conta "3 RECUSADO" somando o Abismo de WP4.6, que
é uma fatia dentro de um WP `VERIFICADO`, não uma linha.

### 1.1 Evidência por WP FEITO (1 símbolo cada; `caminho` + SÍMBOLO)

Legenda: OK = símbolo existe · CMD = existe, mas o comando do ledger aponta para outro
nome/arquivo · FALSO = falso positivo.

**Medição** — todos OK: WP0.2 `functions/api/metrics.js` `bucket` (5); WP0.3 `public/privacidade.html`
"sete eventos" → 0; WP0.4 `CLAUDE.md` "o pet olha" → 0; WP0.5 8 eventos em `src/utils/telemetry.ts`
E `functions/api/metrics.js` (29/29); WP0.7 `src/utils/saveSize.test.ts`; WP0.8 `effort_bucket`;
WP0.9 `purchase: { tier` + `reason` (1/1); WP0.10 `after_bad_day` nos 3 arquivos; WP0.11 `app_open`
+ `src=push` em `public/sw.js`; WP0.12 `duration: { min: 0, max: 3 }` (1/1); WP0.13 `haunted_done`
(incl. `src/App.tsx`); WP0.14 `checkin_shown` + `ONCE_PER_DAY.includes`.

**Nascimento**: WP1.1 OK 2 `<img>` no bloco REVEAL de `src/components/SoulmonOnboarding.tsx`;
WP1.3 OK `FirstDayCard.tsx`; WP1.4 OK `src/utils/goalToCategory.ts`; WP1.5 OK `src/utils/pushPriming.ts`
("nunca no D0/D1" no cabeçalho + `pushPriming.test.ts`); WP1.6 OK `BirthCard` em 2 arquivos;
WP1.7 OK `ORACLE_DRAFT` + `OracleDraft` (6); WP1.8 OK `src/components/RestWindowCard.tsx` bloco
"WP1.8 — O MOMENTO-OURO"; WP1.9 OK "vai lembrar disso" (1); WP1.10 OK "afinam quem" → 0;
WP1.11 OK `src/utils/oracle.test.ts` describe "WP1.11"; WP1.12 OK `demoTint` (1/2); WP1.13 OK
`src/utils/consent*.test.ts`; WP1.15 OK `onb-petname` no REVEAL (2); WP1.16 OK `bornAt` (4/17) +
`anniversary.test.ts`; WP1.17 CMD `ageDays` existe em `functions/api/_pushCopy.js` (3), mas o
comando cita `functions/api/_pushCopy.test.js`, que **não existe** — o teste mora em
`workers/pushCopy.parity.test.js`.

**WP1.14 FALSO POSITIVO.** Comando do ledger `awk '/link de acesso/,/<\/div>/' … | grep -c '<img'`
→ **0**. O bloco `{linkSent ? (` com o comentário "WP1.14 — A CRIATURA FICA PRESENTE NA ESPERA" e o
`<img>` foi **removido em `ff3e48e1`** (07/09, portão de identidade) e o estado `linkSent` inteiro
saiu em `2f264307` (login Google/e-mail+senha). Sobra uma linha órfã de comentário
(`/** Link de acesso enviado — …`) sem código embaixo. O ledger continua `VERIFICADO (06/09/2026)`.
Estado correto: `RECUSADO` (premissa deixou de existir) ou reescrito para o portão novo.

**Constância**: WP2.2 OK `src/utils/habitRhythm.ts` `steadyWindow`; WP2.3 OK "Assumir minha meta";
WP2.4 OK `MilestoneCeremony.tsx` + `vibrate` (2); WP2.5 OK `soulStruggle` em `MorningCheckIn.tsx`
(4) — mas **0 em `src/utils/rituals.ts`**, que o comando também cita; WP2.7 OK `daysAway` (8);
WP2.8 OK `hideMetrics` (13); WP2.9 OK describe "WP2.9" em `dailyList.sm2.render.test.tsx`;
WP2.10 OK `tinyOffer` (3/4); WP2.11 OK `daysTogether` (4); WP2.12 OK `focusComplete` em `App.tsx`
(3); WP2.13 OK `HABIT_CHEER_AT` em `taskModel.ts`; WP2.14 CMD `RARE_CHEER_RATE` existe em
`src/utils/petVoice.ts`, o comando procura em `src/types/taskModel.ts` (→ 0, o aceite escrito
FALHA); WP2.15 OK `shieldsSpent` em `dailyReset.ts` + `welcome_back` em `App.tsx`.
WP2.6 (IMPLEMENTADO) CMD: o comando cita `plugins/DigiWidgetPlugin.kt`, que **não existe**; o arquivo
é `SoulmonWidgetPlugin.kt` (lá: 5 chaves novas, e `constancy_pct`/`shields` aparecem 4× — nos
`editor.remove()`, o que o `grep -c … → 0` do aceite reprovaria).

**Vínculo**: WP3.2 OK `haunted` em `CompanionHUD.tsx` (4); WP3.3 OK `bondTitle` (6); WP3.5 CMD o
som existe como `playPresence` em `src/utils/sounds.ts` (bloco "WP3.5 — O SOM DE PRESENÇA"); o
comando procura `playChirp` → 0; WP3.6 OK `sm2-pet-shadow` (1/1); WP3.7 OK (5 `ele/ela` restantes
em `_pushCopy.js`, nenhum sobre a criatura — conferido); WP3.8 OK `triggerMessage` → `useEffect`;
WP3.9 OK `chatSafety` em `ChatBox.tsx` + `src/utils/chatSafety.ts`; WP3.10 OK `petPassive` (5);
WP3.11 OK `sleepReminderAt` em `NotificationManager.tsx` (3).

**WP3.4 FALSO POSITIVO (parcial carimbado inteiro).** Spec em 3 partes (`PLANO-MELHORIAS.md`
§WP3.4): (1) fonte única de copy OK ("passou pra dizer oi" → 0 em `NotificationManager.tsx`);
(2) dedup PWA×APK OK (commit `41bdefda`); (3) **win-back** — `grep -rn -iE 'win-?back' src
functions workers` (sem testes) → **0**; `refreshedAt` só existe em `functions/api/_pushIdentity.js`,
não em `workers/push-scheduler.js`; o teste do aceite ("`refreshedAt` 3/6/15/40 → 0/1/1/0") não
existe em `workers/push-scheduler.test.js`. O corpo do commit `41bdefda` não menciona win-back.
Estado correto: `IMPLEMENTADO` com a fatia 3 declarada aberta — mesmo padrão do WP3.1.

**Permanência**: WP4.1 OK `daysToEvolve` só em comentários-lápide (`progression.ts`, `GuideModal.tsx`,
`EvolutionPath.tsx`; 0 em `App.tsx`/`dailyReset.ts`); WP4.2 OK `canReachUltra` +
`ULTRA_PATIENCE_DAYS` em `src/types/progression.ts`; WP4.3 OK `bondRewardFor` cai em `BOND_TITLES`
após L13; WP4.4 OK `coversDay`; WP4.6 OK `BestiaryCard.tsx` + render test; WP4.7 OK
`contarMissao(` em `App.tsx` → 12; WP4.8 CMD o comando pede `src/utils/shareCard.ts`, que **não
existe**; a entrega é `src/components/MemoriesCard.tsx` (consumido por `DailyReportModal.tsx`);
WP4.9 OK "60 nomes" → 0 + `sprites.dungeonRoster.test.ts`; WP4.10 OK `formReachedAt`/`dreamDates`
(5/3); WP4.11 OK `rank`/`tasksDone` em `LibraryPage.tsx`/`PlayerDetailModal.tsx` só em
comentários; WP4.12 OK (`0/` em `ShopModal.tsx` só em comentário e `20/24/32` de tamanho);
WP4.13 OK `src/utils/tournamentTiers.test.ts`; WP4.14 CMD `PlayerDetailModal.tsx` bloco "WP4.14 — A
CRIATURA É VISITÁVEL" OK, mas `grep -c visit functions/api/community.js` → **0** — o comando
`grep -q visit LibraryPage.tsx community.js` só passa pelo OR (a mesma falha que o `LEDGER.md`
descreve para WP5.1); WP4.15 OK `unclaimedBondRewards` (3) + `applyBondRewards` em `bond.ts`;
WP4.16 OK `ensureSeasonProgress|applySeasonMedal` em `dailyReset.ts` (4); WP4.17 OK
`.daysToEvolve` → 0/0; WP4.18 OK `closeSeason` em `workers/push-scheduler.js` (6); WP4.19 OK
`redeemed` (4/2); WP4.20 OK 3 frases → 0; WP4.21 CMD a silhueta existe (`silhouette={hidden && …}`
em `EvolutionPath.tsx`), mas o comando `grep -n blur` → **0**.
WP4.5 (IMPLEMENTADO) OK `deepStartCost` em `dungeon.ts` (2); `currentSeason` em `shop.ts` → 0 —
coerente com o estado declarado.

**Sustento**: WP5.1 OK `ofertaDoisCanais.contract.test.ts` + `UnlockNudge` em `ShopModal.tsx` e
`DailyReportModal.tsx` (2/2); WP5.2 OK `handleInstantHealWithCredits` → 0, `'heart-item'` fora de
`shop.ts`, `src/utils/instantHeal.ts` apagado; WP5.3 OK `opId` em `_entitlements.test.js`;
WP5.4 OK `docs/ASSINATURA-SPEC.md`; WP5.5 OK "Agora não" (3); WP5.6 OK "cresce porque você
cresce" (1) — "Reroll liberado" aparece 1× como comentário histórico (o `! grep -q` do aceite
reprovaria; aceite autodestrutivo #3); WP5.7 OK `src/utils/newReading.ts` + `handleNewReading`
(2); WP5.9 OK "mesmo lugar" só em comentário (idem — o `grep -c → 0` do aceite FALHA hoje: → 1).
WP0.6 (IMPLEMENTADO) OK `setObfuscatedAccountId` em `BillingPlugin.kt` (2). WP5.8 OK
`useUnlockPriceLabel` em 3 componentes, `FULL_UNLOCK_PRICE_LABEL` → 0.

### 1.2 Padrão dos aceites que mentem

Comandos que hoje **reprovam um pacote que está feito** (WP2.14, WP3.5, WP4.21, WP4.8, WP5.6,
WP5.9, WP2.6) ou **aprovam um que não está** (WP3.4, WP4.14 por OR). É a terceira rodada em que
o próprio `LEDGER.md` registra "aceite autodestrutivo" — o remédio já está descrito lá e não foi
aplicado: **rodar o comando na auditoria**, não lê-lo. Nenhum dos 78 `VERIFICADO` tem data posterior
a 07/09; o `/guarda-soulmon completa` não roda desde então, e o código mudou (portão de identidade
07/09, bíblia narrativa 21/09).

## 2. Linhas vermelhas travadas só por TESE — régua proposta + violação hoje

Fonte: `docs/manual/01-VISAO.md` §7 (21 proibições; 12 por teste, 9 por tese). Divergência
preliminar: `.claude/agents/soulmon-guarda-linha-vermelha.md` e `ledger/vetos.md` ainda dizem
**"20 proibições… oito por tese"** — a #21 foi inscrita em 02/09 e os dois textos não
acompanharam.

| # | Proibição | Já tem teste? (manual diz que não) | Régua proposta | Código viola hoje? |
|---|---|---|---|---|
| 13 | Nunca vender proteção contra punição | **Sim, parcial**: `src/utils/x6Updaters.contract.test.ts` proíbe `HEART_COST_CREDITS =` voltar; `monetization.fronteira.test.ts` não cobre escudo | `src/utils/shop.protecaoNaoSeVende.contract.test.ts`: (a) nenhum item de `SHOP_ITEMS`/`SPECIAL_ITEMS` com `kind` em {`shield`,`heart`} comprável por Bits ou Créditos; (b) grep de fonte em `src/utils/monetization.ts`, `CreditsModal.tsx`, `ShopModal.tsx` por `/shield|escudo|REST_SHIELD/` em contexto de `price|cost|buy` → 0 | **Não.** `grep -iE 'shield|escudo' src/utils/shop.ts` → só o tipo `'heart'` de uso; `HEART_COST_CREDITS` só como lápide em `monetization.ts` |
| 14 | Nunca percentual cru de constância na UI | **Sim**: `src/components/dailyList.sm2.render.test.tsx` describe "HabitConstancy nunca imprime percentual (WP2.9)" (regex `/\d+\s*%/` no texto visível) + `HabitConstancy.hideMetrics.render.test.tsx` | Mover para a tabela "por teste" do manual; estender a régua a `StatsPage.tsx`, `WeeklyReportCard.tsx`, `BalanceWeekModal.tsx`, `DailyReportModal.tsx` (hoje só `HabitConstancy` é varrido) | **Borda**: `HabitConstancy.tsx` `headlineTitle` "Ninguém começa em 0%." vai para `title` (tooltip), não texto visível — passa no teste, escapa da tese |
| 15 | Nunca "última chance"/FOMO que tira | Não | `src/copy.semFomo.contract.test.ts`: grep de fonte em `src/components/**`, `functions/api/_pushCopy.js`, `public/*.html` por `/última chance|last chance|só hoje|only today|antes que acabe|expira em|ends in|não perca|don't miss/i` fora de comentário → 0; + assert de que nenhum item de `SHOP_ITEMS`/vitrine de estação tem `expiresAt`/countdown renderizado | **Não.** grep → 0 fora de comentários (`UnlockAccountModal.tsx`, `EvolutionPath.tsx` citam a frase para dizer que não usam). `PlayCard.tsx` `buff.expiresAt` é buff consumível, não vitrine |
| 16 | Nunca recompensa por CONTAGEM de tarefas | **Sim, parcial**: `src/utils/weeklyMissions.test.ts` "NENHUMA premia contagem de tarefa" (vocabulário do pool) | Estender a `src/utils/achievements.ts` e `src/utils/bond.ts`: nenhum gate lê `completedTasks.length`/`activityLog.length`/`tasksDone` | **Sim, 1 caso**: `src/utils/achievements.ts` `unlockedAchievements` → `'tasks-100': (completedTasks.length + activityLog.length) >= 100`. É cosmético (cabeçalho: "conquista cosmética, não paga nada"), mas é literalmente uma recompensa por contagem de tarefas. Decisão do guarda: renomear para comportamento ou registrar exceção em `vetos.md` |
| 17 | Nunca um nono perdão sem responder D4 | Não (D4 foi respondida em 06/09: "a aura é o que dói, e só ela") | `src/utils/perdoes.inventario.contract.test.ts`: lista literal dos 8 mecanismos (`ABSENCE_FORGIVENESS_DAYS`, `RETURN_GRACE_DAYS`, `NEW_SAVE_GRACE_DAYS`, `REST_DAYS_PER_WEEK`, `WEEKLY_RELIEF_HEARTS`, `MAX_HEARTS_LOST_PER_DAY`, `heartLossCap`, `REST_SHIELD_MAX`) e um grep em `dailyReset.ts` por `forgiv|grace|relief|shield|perd` que falha se aparecer símbolo fora da lista | **Sem violação encontrada**; mas o inventário dos 8 não está escrito em lugar nenhum de `src/` nem do manual (`grep -n 'oito' docs/manual/02-REGRAS-DE-NEGOCIO.md` não acha os perdões) — sem lista, "nono" é incontável |
| 18 | Nunca texto do usuário em IA/telemetria sem D8 | **Sim, parcial**: `functions/api/_redact.test.js` (`minimizeForAi`), `src/utils/telemetry.test.ts` "allowlist de eventos" (prop desconhecida rejeita o evento) | Falta o lado do **cliente do chat**: `src/components/ChatBox.contexto.contract.test.ts` — o objeto `context` enviado a `/api/chat` só tem enum/inteiro (`typeof v !== 'string'` para toda chave, exceto `petName` = espécie) | **Não** no servidor (`chat.js` cabeçalho "Nada de TEXTO aqui"; `suggest-tasks.js` passa por `minimizeForAi`). Cliente não conferido por teste; `functions/api/transcribe.js` (voz → texto → IA) nunca foi auditado por guarda nenhum |
| 19 | Nunca mecânica cuja resposta seja "querer a notificação" | **Sim, parcial**: `workers/pushCopy.parity.test.js` "não cobra: nenhuma das duas fala de tarefa, meta ou atraso"; `src/utils/petVoice.test.ts` varre cobrança | Régua estrutural, não de copy: `src/notificacao.semRecompensa.contract.test.ts` — nenhum handler de clique de push (`sw.js` `notificationclick`, `NotificationManager.tsx`, `AlarmReceiver.kt`) chama `track(` com XP/Bits nem `setGameState` que conceda item | **Não.** `public/sw.js` só abre a URL com `src=push`; `app_open{source}` é denominador (WP0.11, ressalva #19) |
| 20 | Chaves do bridge do widget e do save: só ACRESCENTAR | Não — e há teste **no sentido contrário** | Snapshot das chaves escritas em `SoulmonWidgetPlugin.kt` (`putString/putInt/putBoolean("…")`) e das `STORAGE_KEYS`; o teste falha se uma chave do snapshot sumir, salvo listada em `REMOVIDAS_POR_VETO` com data e proibição | **Sim, por decisão de guarda**: `src/plugins/widgetSemCobranca.contract.test.ts` it "as chaves antigas são REMOVIDAS, não só deixadas de escrever" exige `editor.remove("constancy_pct"/"shields"/"bond_level")`. O guarda da constância aplicou a #14 quebrando a #20 e não registrou o conflito em `vetos.md`. Precisa de parecer: ou #20 ganha a exceção "chave vetada por outra proibição, com `remove()` e tolerância a ausência provada no widget antigo", ou o teste volta |
| 21 | Nunca métrica de desempenho de outro jogador | **Sim**: `src/components/PlayerDetailModal.semMetrica.render.test.tsx`; `LibraryPage.amigos.render.test.tsx` | Mover para "por teste"; acrescentar guard no **fio**: `functions/api/community.test.js` afirma que `publicProfile` nunca devolve `rankPoints`/`tasksDone`/`daysPlaying` | **Não** na UI; no servidor `community.js` `publicProfile` omite `tasksDone` (comentário de lápide), mas `tasksDone` ainda é **gravado** no perfil (`tasksDone: Number.isFinite(+body.tasksDone)…`) — dado colhido sem consumidor |

## 3. Área declarada × área auditada por guarda

Método: arquivos do domínio declarado no `.claude/agents/soulmon-guarda-*.md` que **nunca** aparecem
no `ledger/<g>.md` (`grep -c <basename>` → 0), conferidos também em `estudo/*.md` e `mobbin/*.md`.

| Guarda | Domínio declarado | Nunca citado no ledger (nem em estudo/mobbin, salvo nota) |
|---|---|---|
| medição | telemetria, **privacidade**, verdade dos números | `functions/api/_redact.js` (privacidade — só o vínculo cita), `functions/api/_rateLimit.js`, `functions/api/_aiGuard.js`, `functions/api/account.js` + `src/utils/accountData.ts` + `AccountDataSection.tsx` (exportar/apagar dados — LGPD), `public/termos.html`, `settingsTelemetry.render.test.tsx` (o opt-out na UI). O guarda audita o que o app **emite**; nunca auditou o que o app **guarda e apaga** |
| nascimento | onboarding, Oráculo, reveal, D0 | `functions/api/generate-sprite.js` + `src/utils/spriteTrigger.ts` (o nascimento do sprite — citado só como fato no cabeçalho), `src/components/IntroScreen.tsx`, `src/components/GameTutorialFlow.tsx` (o tutorial É o D0; só em estudo/mobbin), `src/utils/auth.ts` + o portão de identidade `ff3e48e1` (substituiu o link mágico do WP1.14 e ninguém auditou), `src/components/CityPicker.tsx`, `ProtectProgressModal.tsx` |
| constância | hábitos, escudos, rituais, marcos, widget | `src/hooks/useDailyReset.ts` (a virada — só `dailyReset.ts` é citado), `src/utils/restWindow.ts` (só em estudo), `src/utils/taskTriage.ts` (`MAX_DAILY_FOCUS` — literal que ele diz guardar; só em estudo), `src/utils/playerDay.ts` (`dayKeyOf` — linha vermelha própria, nunca conferida), `DailyRituals.tsx`, `RestWindowCard.tsx`, `WeeklyReportCard.tsx`, `BalanceWeekModal.tsx`, `StepsCard.tsx`, `src/utils/welcomeBack.ts` |
| vínculo | chat, **voz**, presença, push, som | `src/utils/petVoice.ts` (**a voz inteira** — `PET_VOICE_LINES`, mudada em 21/09 pela bíblia sem passar pelo guarda), `src/utils/welcomeBack.ts` (reencontro), `workers/push-scheduler.js` (só como comando), `functions/api/subscribe.js`, `fcm-subscribe.js`, `_pushTargets.js`, `src/utils/audioBus.ts`, `src/utils/chatKeywords.ts`, `functions/api/transcribe.js` (voz do usuário → IA = #18), `CareSystem.tsx` |
| permanência | evolução, economia, masmorra, **torneio**, coleção | `src/utils/arena.ts` + `ArenaGame.tsx` + `TournamentPage.tsx` (torneio — só faixas via `tournamentTiers.test.ts`), `DungeonGame.tsx`, `NightmareBattle.tsx`, `src/utils/adventure.ts`, `src/utils/careCaps.ts`, `src/utils/currencies.ts`, `RebirthModal.tsx` (renascimento = perda de identidade, linha vermelha própria), `EvolutionCeremony.tsx`, `functions/api/_bond.js`, `src/utils/achievements.ts` (onde mora a violação de #16) |
| sustento | monetização, **billing**, créditos, integridade de compra | `functions/api/billing.js`, `functions/api/_billing.js` (Steam refund), `functions/api/entitlements.js`, `functions/api/_entitlements.js` (o "server-authoritative" que ele cita como fato, nunca como aceite), `src/components/CreditsModal.tsx`, `src/utils/currencies.ts`, `functions/api/_aiGuard.js` + `costCeiling.test.js` (o custo de IA que a receita "paga"), `AccountDataSection.tsx`, `ProtectProgressModal.tsx` |
| linha vermelha | as 21 proibições | Não tem WP de propósito; mas `vetos.md` não registra parecer sobre: WP2.6 (remoção de chave × #20), `achievements.ts` `tasks-100` (× #16), e a mudança de `petVoice.ts`/`welcomeBack.ts` de 21/09 tem parecer sobre o **doc** (bíblia), não sobre o **diff** |

## 4. Regras de jogo sem dono ou sem régua

**`docs/manual/02-REGRAS-DE-NEGOCIO.md`** (63 seções): script sobre os blocos `**Dono.**`/`**Régua.**`
de cada `## N.` (60 seções têm ambos):

- **Sem `Dono` e sem `Régua`:** §57-B "Mapas de arte que carregam regra" e §59 "Divergências com o
  `CLAUDE.md`" (§59 é lista, aceitável; §57-B é regra sem dono).
- **`Dono` sem símbolo (só arquivo):** §53 Torneio (`src/utils/tournamentSeason.ts`,
  `tournamentTiers.ts` — sem `→ função`); §57 Estações (`seasons.ts`, `dailyReset.ts`).
- Todos os caminhos citados em `Dono`/`Régua` das 63 seções **existem** (0 inexistentes).

**`docs/manual/00-MAPA.md` §3** (tabela assunto → dono → régua): as faixas de seção cobertas são
§1–§10, §1/§7, §14–§22, §23–§36, §37–§45, §46–§57. **Fora de qualquer linha do §3:**
§11 Relatório diário, §12 Check-in de humor, §13 Brincar, §57-A Conquistas, §57-B Mapas de arte,
§58 Notificações como regra, §58-A Som como regra, §59. Destes, **§58 (push) e §12 (humor) são
linhas vermelhas** (#19 e #2) sem linha de régua no mapa. Todos os 26 caminhos citados no §3
existem.

## 5. Fase 4 — sensores (Health Connect)

**Isolada corretamente. Sem código morto começado.**

- `grep -rn -iE 'health ?connect' src functions workers android/app/src` (ts/tsx/js/kt) → só
  comentários explicando por que NÃO (`src/utils/steps.ts` "POR QUE NÃO HEALTH CONNECT",
  `AndroidManifest.xml` "NÃO é Health Connect").
- `package.json`: só `@capgo/capacitor-pedometer`; **nenhum** `@capgo/capacitor-health`.
- Manifest: só `ACTIVITY_RECOGNITION` (runtime simples); nenhuma permissão `health.*`/`BODY_SENSORS`.
- Registro da decisão: `docs/STATUS.md` "Fase 4 (sensores via Health Connect) NÃO foi implementada,
  e é DECISÃO DO DONO" com os 4 custos pré-código; `docs/manual/10-DISCUSSOES-E-DECISOES.md`
  (19/08/2026); `docs/PLANO-TAREFAS.md` Parte 3b.

Ressalvas de apodrecimento (doc, não código):
1. `STATUS.md`: "**Nada** no código de hoje lê sensor" — falso desde `src/utils/steps.ts`
   (`TYPE_STEP_COUNTER` via pedômetro). A frase certa é "nada lê sensor de **saúde**".
2. A memória do projeto chama a mesma coisa de "Fase 4" e "Fase 4b"; `PLANO-EVOLUCAO.md` tem outra
   "Fase 4 — Ritual e social". Nome ambíguo para uma decisão que é do dono.
3. `StepsCard.tsx`: o ramo "sem sensor" retorna nada (regra 3) — `STATUS.md` (15/09) já anotou
   "ramo morto"; é um `return null` comentado, não código de Health Connect começado.

## 6. O que fazer (ordem sugerida)

1. Corrigir os 2 falsos positivos no ledger (WP1.14 → `RECUSADO`/reescrito; WP3.4 → `IMPLEMENTADO`
   com win-back aberto) e a tabela consolidada (78/7/2; "87" na primeira linha).
2. Reescrever os 8 comandos de aceite que apontam para símbolo inexistente (§1.1 CMD) e trocar todo
   `grep -q A B` por um comando por arquivo (regra já escrita no `LEDGER.md`).
3. `vetos.md` + guarda `.md`: 21/9, não 20/8; mover #14, #21 (e #13, #16 parciais) para "por
   teste"; emitir parecer sobre #20 × `widgetSemCobranca` e sobre `achievements.ts` `tasks-100`.
4. Escrever as 4 réguas sem teste nenhum: #15 (FOMO), #17 (inventário dos 8 perdões), #20
   (snapshot de chaves), #18-cliente (contexto do chat).
5. Cada guarda: uma auditoria sobre a lista do §3 — em especial `petVoice.ts` (vínculo),
   `useDailyReset.ts`/`playerDay.ts` (constância), `billing.js`/`_entitlements.js` (sustento).
