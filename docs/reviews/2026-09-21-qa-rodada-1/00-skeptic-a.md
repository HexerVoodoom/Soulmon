(salvo pelo coordenador — texto completo na resposta do agente; tabela final)
| # | Objeção | Classe | Conserto |
|---|---|---|---|
| 1 | `auditRefunds` rebaixa para `demo` ao anular compra Play mesmo com cortesia válida | FIXÁVEL | `ent.tier = paidProviderOf(ent) ? 'paid' : 'demo'` após o loop |
| 2 | `unregisterFromPushNotifications` apaga `FCM_TOKEN` local antes do DELETE | FIXÁVEL | `removeLocal` só após `res.ok`; propagar `!res.ok` |
| 3 | `filaDeAvisos` não trava `termos` como último | FIXÁVEL trivial | assert de ordem |
| 4 | Gate WebView manda iOS/Firefox à Play Store | FIXÁVEL | ramificar por `/Android/.test(navigator.userAgent)` |
| 6 | `regexDeImport` conta import comentado | FIXÁVEL baixo | strip de `//` |
| 9 | 3 ponteiros `.claude/skills/higgsfield-*` → `.agents/` inexistente; `som-produtor-assets` cita skill morta | FIXÁVEL | apagar; apontar CLI |
| 10 | **`billing-ktx:6.2.1` recusada pela Play (v6 desde 31/08/2025, v7 desde 31/08/2026) — precisa 8.x**; `minSdk` 24 (comentário) vs 26 | **FATAL** etapa 6 | `billing-ktx:8.x` + `BillingPlugin.kt` `PendingPurchasesParams` |
| 11 | `chatSafety.ts` › `LEXICO` falha sem acento ("nao quero mais viver") e em EN coloquial | FIXÁVEL | normalizar NFD antes do teste |
Ruído: enumeração/timing do grant, CAS do contador, publicView, convert-to-webp, cacheavel 200, Glitchtama conta dia completo (decisão de produto), save pré-consent do dono.
