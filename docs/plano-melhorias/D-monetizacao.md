# D — Monetização (fatos)
## Catálogo/provedor
Google Play Billing (Android) + Steam (código pronto, sem App ID). Stripe/Mercado Pago: NÃO EXISTE.
functions/api/_billing.js PRODUCTS: soulmon.unlock.full {grantTier:'paid', grantCredits:0}; soulmon.credits.60/150/400 consumíveis. STEAM_ITEMS {101,102,103}=créditos; unlock full na Steam = posse do app (verifySteamOwnership).
src/utils/monetization.ts: CREDIT_PACKS 60→R$4,90, 150→R$9,90, 400→R$19,90; FULL_UNLOCK_SKU, FULL_UNLOCK_PRICE_LABEL='R$ 29,90' (travado com public/termos.html por publishedPrice.test.ts).
Unlock concede accountTier:'paid' em ent:<saveId> (_entitlements.js applyVerifiedPurchase) → requirePaidTier (sprite IA), teto de hábitos do estágio, reroll. Verificação verifyPlayPurchase, isPlayPurchaseBoundTo (só com PLAY_REQUIRE_ACCOUNT_BINDING==='true'), verifySteamPurchase/Ownership. Sem credencial → 503.
Ads: ADS_ENABLED=false (D-13); servidor 501 sem ADMOB_SSV_ENABLED. AD_REWARD_CREDITS=5, AD_DAILY_CAP=3.
## Gastos de Créditos
Tudo via POST /api/entitlements?action=spend → spendCredits(env,saveId,amount) (_entitlements.js; null=recusado). Cliente spendCredits(amount, reason) em src/utils/entitlements.ts.
- Reroll 50 (REROLL_COST_CREDITS): App.tsx handleRerollCharacter (~2668) — gera ANTES de cobrar.
- Cura instantânea 10 (HEART_COST_CREDITS): App.tsx handleInstantHealWithCredits (~2628) + healInFlightRef; updater puro src/utils/instantHeal.ts applyInstantHeal/instantHealRefusal. Botão: src/components/CreditsModal.tsx seção "Gastar", Row icon favorite "Curar 1 coração agora"/"Heal 1 heart now", canHeal = credits>=10 && hp<max. Sem estorno (dívida declarada em instantHeal.ts). Teste: instantHeal.test.ts (4 casos, unidade); sem teste de render do botão.
- Créditos→Bits: BITS_EXCHANGE (currencies.ts:141, CREDIT_TO_BITS=10), App.tsx handleExchangeCredits (~2535), UI ShopModal.tsx:302. Bits→Créditos não existe.
**CreditsModal só abre pelo menu sanduíche da BottomNav** (App.tsx:1705 openCredits → BottomNav.tsx:346-350 → App.tsx:3680).
## UnlockNudge — src/components/UnlockAccountModal.tsx
UnlockNudge({language, reason:'task-limit'|'evolution', variant:'buy'|'reveal', onOpen}). Textos (~186-200): reveal "Falta revelar a sua criatura"/"Você já desbloqueou o completo — responda o ritual quando quiser."; task-limit "Quer criar sem limite?"; evolution "Quer a SUA árvore de evoluções?"; sub "Desbloqueie o Soulmon completo por R$ 29,90 — seu progresso continua."
3 pontos: CreateModal.tsx:475 (isAtCap && capIsDemoBoundary && onUnlock; demoCapHint "Modo grátis: até ${activitiesCap} hábitos ativos. Tarefas avulsas continuam sem limite; evoluir com seu próprio Soulmon é o que aumenta esse teto."); EditModal.tsx:123 (blocked && capIsDemoBoundary); App.tsx:4378 (view evolution && demoCharacterId, variant reveal se paid).
Modal completo: corpo task-limit "No modo grátis cabem 6 hábitos ativos — a rotina inteira do Rookie…"; evolution "Esta é a árvore de um personagem de demonstração — os três caminhos levam ao mesmo lugar."; perks (Sua criatura, só sua / Atividades sem limite / Reroll liberado); botões "Desbloquear — R$ 29,90" e "Já comprei — restaurar"; fora do Android: "A compra acontece pela Google Play, dentro do app Android."
**ShopModal: UnlockNudge NÃO ENCONTRADO** (só câmbio Bits :296-330). **DailyReportModal: NÃO ENCONTRADO.** CreditsModal rodapé demo: "Reroll é exclusivo de contas completas — desbloqueie por R$ 29,90." sem botão.
Telemetria: unlock_view (reason,tier), demo_cap_hit, purchase (App.tsx:1217/1222/1234/2721).
## Cap demo
DEMO_ACTIVITY_TOTAL_CAP = FORM_REQUIREMENTS.rookie.cap = 6 (progression.ts:15 rookie {required:4, cap:6, daysToEvolve:10}). Teto TOTAL de hábitos ativos (teto diário removido em D-12). Tarefas avulsas ilimitadas (canCreateActivity true para task). activityCapFor(tier, stageCap). Portão canCreateActivity → fitHabitCreates (habitCreate.ts:47) → App.tsx commitHabitCreate (~1131, ponto único) / commitTaskCreate (~1180); activityCap App.tsx:1105. 100% cliente; servidor só trava COGS de IA (requirePaidTier). Testes: monetization.fronteira.test.ts, habitCreate.test.ts, activityCreate.contract.test.ts.
## Trial/assinatura/presente/Play Billing
Trial: NÃO ENCONTRADO. Assinatura: NÃO ENCONTRADO (só INAPP; BillingPlugin.kt ProductType.INAPP). Presente monetizado: NÃO — só gift social 20 Bits 1×/dia/amigo (community.js:617, LibraryPage.tsx:189).
Play Billing: SIM — android/app/build.gradle:62 billing-ktx 6.2.1; BillingPlugin.kt (acknowledgeIfNeeded :94, consume :148, restore :177), registrado em MainActivity.java; ponte src/utils/playBilling.ts (isBillingAvailable, purchase, restorePurchases).
**LACUNA: setObfuscatedAccountId(saveId) NÃO ENCONTRADO** em BillingPlugin.kt nem playBilling.ts → PLAY_REQUIRE_ACCOUNT_BINDING=true recusaria toda compra; sobra claimOrder best-effort. Package com.hexervoodoom.soulmon pendente de google-services.json.
