# C — Presença e voz do pet (fatos)

> Termos renomeados em 29/09/2026: vírus→poder, dado→harmonia, vacina→benevolência.
## Push
workers/push-scheduler.js: só transporte; brtHour=(UTC-3); copy via pushCopy(brtHour, petName, language) de functions/api/_pushCopy.js. PUSH_HOURS_BRT=[10,16,22].
| 10h pet-nudge-10 | "${name} passou pra dizer oi" / "Tem algo do seu dia que você já fez?" |
| 16h pet-nudge-16 | "${name} pensou em você" / "Se sobrar um minuto hoje, ele adora companhia." |
| 22h pet-goodnight | "🌙 ${name} está indo dormir" / "Boa noite. O que ficou pra trás fica pra amanhã. 😴" |
name=petName||'Soulmon' → toda push é em nome do pet. Nudge 21h "está preocupado" removido de propósito.
Cliente src/components/NotificationManager.tsx REIMPLEMENTA a copy (não importa _pushCopy.js — footgun 9): Android DigiAlarm.scheduleAlarm ids pet-nudge-10/16 (só se completedSteps<totalRequired) + pet-goodnight 22h; web checkPetNotifications poll 60s, dedup lastNudge10Date/16/lastGoodnightDate. Exclusiva do cliente: 20h (lastEveningWarnDate) se completedSteps<totalRequired: hp-critical-evening ("${petName} está meio pra baixo"/"Se der, marque o que você já fez hoje. Se não der, amanhã ele ainda vai estar aqui.") ou evening-reminder ("🌙 ${petName} está te esperando"/"Marque o que você fez hoje e dê uma comidinha…"). Lembretes genéricos em src/utils/notifications.ts ("⏰ Lembrete de Atividade!", "⏰ Lembrete de Tarefa!").
Idioma: gravado na inscrição (subscribe.js / fcm-subscribe.js record {petName: petName||digimonName||'Soulmon', language||'en-US'}); pushCopy pt = language==='pt-BR'. Só muda ao reassinar.
**Dedup Web Push × FCM por saveId: NÃO EXISTE.** Chaves push:${hashEndpoint} e fcm:${hashToken}; drainPrefix sequencial; só o tag da notificação colapsa no OS. PWA+APK recebe 2×.
**Win-back por ausência: NÃO ENCONTRADO.** Worker não acessa o save; inscrição guarda só endpoint/keys/token, petName, language, refreshedAt.
## Chat — functions/api/chat.js
buildSystemPrompt({petName, mood, evolutionStage, dominantBranch, language, aiSettings}); llama-3.1-8b-instant, max_tokens 120, temperature clamp (0.85). Prompt: "You are ${petName}, a digital Soulmon companion…" + BRANCH (virus/data/vaccine/balanced: trait/style/emojis) + MOOD (happy/tired/idle só) + MATURITY (nível derivado do stage) + RESPONSE RULES (tone/emojis/motivation/length 2-3 frases/language) + DO NOT + blocoCustom USER_STYLE (dado, não instrução) + NEVER guilt/shame/scold/pressure… "companion who grows alongside them, never a boss keeping score".
ENTRA: petName(≤40), mood(companionMood do HUD), evolutionStage, dominantBranch, language, aiSettings, mensagem (minimizeForAi 500). HP/energia entram como TEXTO na mensagem só no toque ("[TOQUE] … Energia: X%, HP: a/b").
NÃO ENTRA: soulGoal/soulStruggle, Vínculo/totalXP/bondTitle, moodLog do check-in, tarefas/hábitos/constância/dia perfeito/assombradas/foco/perfectDays/sonhos/decoração/passivo/nome do usuário/dias de ausência.
**Memória: NÃO EXISTE** — messages = [system, user]. guardAiRequest só cota. Efeito colateral: regex create_activity com categoria adivinhada.
## HUD — src/components/CompanionHUD.tsx
speak(text, 4000) remove emojis; speakRaw(text, 3000) preserva (só no "+1⚡" de alimentar). handleBubbleClick dispensa.
Idle: setInterval 180000; guards document.hidden e isSleeping; speak(getIdlePhrase(),5000) e, se useAI, aiFetch('/api/chat') "[ALEATÓRIO] Diga algo espontâneo… Máx 12 palavras. Sem emojis." getIdlePhrase cascata: poop → food → hpRatio<=.25 → ratio>=1/.6/.35/.1 → fome; 3 frases PT+EN cada.
Gatilhos: alimentar OK (+1⚡ + showHug), recusa de comida (3 frases), teto de carinho (healCapSignal, 3 frases), 1ª vez ferido (RUB_HINT_SHOWN, 8000ms), toque (handlePetClick: fallback + IA [TOQUE]), chat (handleChatMessage), idle, retorno.
**Rub NÃO fala** (só rubHearts). **Banho NÃO fala.** **Conclusão de tarefa NÃO gera fala** (só playTaskComplete no App.tsx). **haunted: NÃO ENCONTRADO no HUD** apesar do CLAUDE.md dizer "o pet olha".
Retorno: useEffect ultimaSaudacaoRef; saudar() 700ms após montar e em visibilitychange se ≥10 min; falas ['Você voltou!','Oi! Senti sua falta.','Que bom te ver!','Oi oi! Tudo bem?'] + pulo isGreeting 800ms. **Ausência de N dias: NÃO ENCONTRADO** — limiar fixo 10 min, mesmo texto para 11 min e 3 semanas; HUD não lê última visita.
## Vínculo — src/utils/bond.ts
bondLevelFor(totalXP) derivado, nunca persistido (só bondRewardsClaimed[] e ledger bondDaily). BOND_EARLY_STEPS=[75,125,200,300,400], depois 400+100*(level-5). XP acumulado: L1=0, L2=75, L3=200, L4=400, L5=700, L6=1100. bondProgress → {level, into, need, ratio}. bondXP: completion (weight×HABIT_TIER_BONUS), perfectDay 50, restNight 15, dreamNew 25, nightmareCleared 10, dungeonFloor 10, dungeonRun 60, tournamentMatch 15/8, habitMilestone 100/200/400, triageCleared 30, checkIn 10. Teto diário dungeon 120, tournament 60. awardBondXP(state,event,dayKey) chamado em App.tsx.
Desbloqueios: BOND_REWARDS 100% cosméticas (L2 título Companheiro; L3 furn-plant; L4 bg-forest; L5 dream-little-boat; L6 Confidente; L7 furn-picture; L8 bg-sakura; L9 dream-lantern-river; L10 Alma Irmã; L11 furn-rug; L12 dream-night-train; L13 Vínculo de uma Vida). Gate PvP BOND_PVP_MIN_LEVEL=5 (meetsPvpBond; servidor functions/api/_bond.js).
Exibição: StatsPage.tsx (bondProgress/bondTitle, seção sm2-bond-title) e TournamentPage.tsx (gate). **NÃO exibido no CompanionHUD** (comentário de BOND_REWARDS diz "sob o nome do pet" mas bondTitle não é importado no HUD).
## Sons — src/utils/sounds.ts
100% sintetizado (AudioContext), zero arquivos de mídia. play(fn) com mute (SOUND_MUTED). beep(). Catálogo: playTaskComplete, playFeed, playPoopAlert, playPoopClean, playShower, playEvolve, playDegenerate, playMenuOpen, playSleep, playVisorTune. **Nenhum som ligado à voz/presença do pet** (nada em speak, saudação, idle, carinho).
