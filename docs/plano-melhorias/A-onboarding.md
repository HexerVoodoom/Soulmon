# A — Onboarding (levantamento factual)

## Steps (SoulmonOnboarding.tsx:174-199)
FAVORITE_STEP=5 · QUIZ_START=6 · QUIZ_END=QUIZ_START+ORACLE_QUESTIONS.length · REFINE_OFFER=QUIZ_END · DEEP_START..DEEP_END (SOUL_TEST_ITEMS) · GENERATING=DEEP_END · REVEAL=GENERATING+1 · REGISTER=REVEAL+1 · DEMO_PICK=-1 · GOAL_STEP=-2 · STRUGGLE_STEP=-3 · CONSENT_STEP=-4 · AGE_BLOCK=-5.
Navegação (next() :412, back() :451): 0 intro → GOAL → STRUGGLE → CONSENT → demo: DEMO_PICK→REGISTER | oracle: 1..5 → quiz → REFINE_OFFER → (DEEP) → GENERATING → REVEAL → REGISTER. Upgrade: lastStep=REVEAL, onRevealed (:279-282, :1146).

## REVEAL (:1114-1158) — SEM <img> de sprite
Renderiza: kicker, <h1>{result.creature.baseName}</h1>, essence (essenceLabel/CLASS_DATA, estado :247), caixa L(result.creature.bio), botão "Continuar"/"Nascer {baseName}". Única <img> do trecho é ravenMascot em GENERATING (:1103). NÃO ENCONTRADO spriteUrl/displaySprite/spriteLibrary no arquivo.

## Geração de sprite
Cliente requestSprite/generateSprite (src/utils/spriteGen.ts:155,257) → POST /api/generate-sprite. Agendador: useSpriteGeneration (src/hooks/useSpriteGeneration.ts:89), montado SÓ em App.tsx:644 (após onboarding). Só depois do 1º paint, whenIdle (requestIdleCallback 5000 / setTimeout 2000), nunca durante virada/relatório/cerimônia (busy App.tsx:665), 1 lote por vez. birthBatch (src/utils/spriteTrigger.ts:123) acionado por newborn:isNewbornLibrary(spriteAcervo) (App.tsx:676), consumido em useSpriteGeneration.ts:221. Comentário App.tsx:670-675 (F-1): birthBatch não tinha chamador; quem paga chegava ao reveal vendo a arte de reserva do demo. enabled: !demoCharacterId && soulmonStages.length>0 (App.tsx:668) — demo nunca gera sprite.

## Push
registerForPushNotifications (src/utils/notifications.ts:196) — Android nativo apenas (:202). Único chamador: src/components/NotificationManager.tsx:62 (useEffect if enabled; web: subscribeToPush :66). enabled = notificationsEnabled (App.tsx:4863) ← readFlag(STORAGE_KEYS.NOTIFICATIONS_ENABLED) (App.tsx:776) — FALSO por padrão. Liga: handleToggleNotifications (App.tsx:3522) via WelcomePromptModal (App.tsx:4954-4963) ou Settings (App.tsx:4493). Gate: notificationsUnlocked={jaConcluiuAlgo} (App.tsx:4961; jaConcluiuAlgo App.tsx:1311) — só depois da 1ª conclusão real. Regra em App.tsx:1283-1286 e WelcomePromptModal.tsx:71-80.

## soulGoal / soulStruggle
Coleta: estados :221-222, textarea 280 chars (:774), pular zera (:788). finish() envia :543-544 (demo) / :555-556 (oracle). Gravação: App.tsx:3440-3441 e :3483-3484; schema GameStateContext.tsx:309-310; hidratação :879-880; inicial :1030-1031.
Leituras de soulGoal: DailyReportModal.tsx (:15,:39,:130-133 — só wasPerfect||welcome, "Lembra por que você começou"), ligado App.tsx:4891; StatsPage.tsx (:86, :322-324 "Começou por:"), ligado App.tsx:4473; account.js:7 (export DSAR).
soulStruggle: NÃO ENCONTRADO nenhum ponto de leitura no app.
Chat: NÃO ENCONTRADO em chat.js/aiClient.ts/ChatModal.tsx; _redact.js:15 afirma que não passam por essas rotas.

## Pós-reveal
App.tsx:4465-4467 (!hasCompletedOnboarding → SoulmonOnboarding) → App.tsx:3561-3572 (!hasCompletedTutorial → GameTutorialFlow, flag TUTORIAL_COMPLETE App.tsx:747-755) → currentView 'main' (App.tsx:562).
GameTutorialFlow.tsx: PAGES (:51-63) tem UMA página {icon:'pets', titlePt:'Seu Soulmon nasceu!'} (5 removidas, :44-50, :266). TASK_STEP=PAGES.length (:117): categorias + sugestões (taskSuggestions.ts; FALLBACK_BY_CATEGORY :85-94) + ≥1 atividade obrigatória. handleCompleteTutorial (App.tsx:3493) → commitHabitCreate(..., TELEMETRY_CREATE_PATH.tutorial) (App.tsx:3508). Barra de progresso inclui tutorial (:279-282, :659).
Checklist D0: NÃO ENCONTRADO. Existe fila de intersticiais triage→dailyReport→checkIn→dream→nightmare→welcome (App.tsx:1290-1296), MorningCheckIn.tsx:99 (checkInPlan), FirstTaskCompletedPopup.tsx:17 (showFirstTaskPopup App.tsx:763).

## Telemetria de funil
Existe (própria, sem SDK): telemetry.ts + functions/api/metrics.js. TELEMETRY_FUNNEL {unknown,demo,paid} (:133); onboarding_step emitido em SoulmonOnboarding.tsx:322-331 por mudança de step; onboardingStepCode + NEGATIVE_STEP_BASE=45 (:199-204). Call sites: SoulmonOnboarding :579 purchase, :913 demo_pick; App.tsx :1033 install, :1042 first_task_done, :1143/:1217/:1222 demo_cap_hit, :1158/:1193 activity_create, :1234 unlock_view, :2721 purchase; telemetry.ts :727 week_active, :762 day_active. Opt-out: setTelemetryEnabled/telemetryConsentCopy; teste settingsTelemetry.render.test.tsx.
