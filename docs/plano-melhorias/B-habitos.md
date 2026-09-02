# B — Motor de hábitos/rituais (fatos)
## Constantes (src/types/taskModel.ts)
MAX_DAILY_FOCUS=3 · HABIT_MILESTONES=[7,21,66] · CONSTANCY_WINDOW_DAYS=7 · REST_SHIELD_MAX=3 · REST_SHIELD_EARN_EVERY_DAYS=7 · MISS_INTERVENTION_AT=2 · HABIT_WEIGHT=1 · HABIT_TIER_BONUS seed0/sprout.1/sapling.2/tree.3 · HABIT_TIER_ICONS 🌱🌿🪴🌳 · HAUNTED_AFTER_DAYS=7 · OVERCOMMIT_EFFORT=7.
GOOD_CONSTANCY_RATIO vive em src/utils/habitRhythm.ts = 5/CONSTANCY_WINDOW_DAYS.
## Testes travando
habitRhythm.test.ts usa DERIVADO (loop REST_SHIELD_MAX+2, expect(shields).toBe(REST_SHIELD_MAX)); habitEligibility.regression.test.ts espera shields===2 após 8 viradas; rituals.test.ts:95-96 e taskTriage.test.ts:226-227 travam MAX_DAILY_FOCUS===3 LITERAL; ABSENCE_FORGIVENESS_DAYS literal 2 em useDailyReset.test.ts:525 e poopDrain.regression.test.ts:61.
**REST_SHIELD_MAX 3→2: NENHUM teste quebra.** UI derivada: GuideModal.tsx:150-151, HelpModal.tsx:99-100, HabitConstancy.tsx:141 (Math.min(REST_SHIELD_MAX, shields)). Efeito real: saves com shields:3 continuam 3 (GameStateContext.tsx:653 só Math.max(0,floor)); só exibição clampa → precisa clamp na hidratação/earnShield.
## habitRhythm.ts
applyMissedDay(rhythm, dayKey) consome escudo automático, dia vai a `shielded`, idempotente. earnShield(rhythm, now) usa lastShieldAt; barra se shields>=REST_SHIELD_MAX, <EARN_EVERY_DAYS desde lastShieldAt, ou ratio<GOOD_CONSTANCY_RATIO. habitTier(totalDone). Outros: emptyRhythm, dayKeyOf, isDueOn, weeklyProgress, habitCountsOn (dono da elegibilidade), constancy, milestoneReached(before,after), attributeMultiplier, consecutiveMisses, needsIntervention, completeHabit, HISTORY_CAP=120.
HabitRhythm: done[], missed[], shields, shielded[], totalDone, lastCompletedDate?, lastShieldAt?.
**shielded[] EXISTE** → "sem escudo gasto" = rhythm.shielded.length===0 (ou por janela). Leitores hoje: constancy, consecutiveMisses, HabitConstancy.tsx:87,107,149 (ponto dourado). Nenhum consumidor de prestígio. Campo `streak` proibido por teste.
## Check-in
rituals.ts: needsCheckIn(state,now) (sem janela de hora); checkInPlan → {habitsToday, suggestedFocus, carryOver, overcommitted, plannedEffort}; completeCheckIn(state, focusIds, dayKey) → setFocus + lastCheckInDate.
App.tsx: checkInPromptedRef (~2864-2876), handleCheckInConfirm (completeCheckIn + awardBondXP({kind:'checkIn'})), handleCheckInSkip, render interstitial==='checkIn' (~4897).
UI: src/components/MorningCheckIn.tsx. **Botão de conclusão (~408): 'Começar o dia' / 'Start the day'.** Secundário (~411): 'Hoje não, obrigado' / 'Not today, thanks'.
## Marco
milestoneReached → App.tsx habitMilestoneOf (~527-532) + celebrateHabitMilestone (~1463-1471) = playEvolve() + setMessageTrigger + toast.success. MILESTONE_TEXT (~534-538): sprout "🌿 7 dias! Este hábito virou broto." · sapling "🪴 21 dias! Este hábito está criando tronco." · tree "🌳 66 dias! Este hábito virou parte de quem você é." (+EN).
**Animação dedicada: NÃO ENCONTRADO. Háptico no marco: NÃO ENCONTRADO.** navigator.vibrate só em DinoGame, NightmareBattle, RPSGame, ShopModal:130, CompanionHUD:781, DungeonGame. @capacitor/haptics NÃO instalado.
## welcomeBack
ABSENCE_FORGIVENESS_DAYS=2 em src/utils/dailyReset.ts (~131). computeDailyReset (~571): daysAway=daysSinceLastReset; wasAway=daysAway>=ABSENCE_FORGIVENESS_DAYS; forgivesHP = wasAway||newSaveGrace||returnRamp (NEW_SAVE_GRACE_DAYS, RETURN_GRACE_DAYS/returnGraceLeft). Relatório grava welcomeBack, daysAway (~792). Tipo GameStateContext.tsx:295-296. UI DailyReportModal.tsx: welcome=!!report.welcomeBack (:45); modo acolhida linhas "Corações: intactos"/"Dias perfeitos guardados" (~60-64), canRecover off (:47), ícone volunteer_activism (:78), headline própria (81-100), soulGoal devolvido se wasPerfect||welcome (:130). Testes useDailyReset.test.ts:452-540, gameRules.fuzz.test.ts:269.
## Widget Android
DigiWidgetPlugin.kt updateWidgetData → SharedPreferences(WidgetRenderer.PREFS_NAME): digimon_name, current_stage, egg_type, branch_type, completed_tasks, total_tasks, hp, health_points, max_health_points, energy_points, has_poop. Ponte src/plugins/DigiWidgetPlugin.ts; payload App.tsx ~1339 (digimonName, currentStage, eggType??'tapirmon', branchType, completedTasks: dailyDone, totalTasks: dailyTotal, hp %, healthPoints, maxHealthPoints, energyPoints, hasPoop).
WidgetRenderer.kt: renderFull (nome, stage, done/total, hp, sprite, contextualMessage), renderPet (sprite+poop), renderChat (buildChatPhrases), renderScreen (corações/energia). Providers: DigiAppWidgetProvider/PetProvider/ChatProvider/ScreenProvider/VerticalProvider; WidgetRefreshWorker.kt.
**Dado de HÁBITO no widget: NÃO ENCONTRADO** (sem constância, shields, tier, needsIntervention). Chaves do bridge congeladas (App.tsx ~1340-1343). taskModel.ts ~281: weekDays só existe para o widget.
