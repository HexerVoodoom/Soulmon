# Ledger — guarda-plataforma (paridade web × APK/widget × overlay × EN × a11y)

Dono: `soulmon-guarda-plataforma` (criado em 21/09/2026 — governança N2,
`docs/reviews/2026-09-21-qa-geral/13-governanca-agentes.md` §8.5). Evidência: `CLAUDE.md`
› footguns 2/3/9 e › "Idioma: inglês é a base"; `docs/reviews/2026-09-21-qa-geral/`
(desktop/Android/workers/CI · i18n · a11y). Regra: só este guarda escreve aqui;
`VERIFICADO` exige a saída do comando colada. Vocabulário de estado: `../LEDGER.md`.

Este ledger não custodia WPs do `PLANO-MELHORIAS.md` (nenhum pacote de lá é de plataforma);
custodia **paridades** — cada linha é uma pergunta "chega igual em X?" com régua executável.

| Id | O quê | Estado | Comando de verificação | Evidência |
|---|---|---|---|---|
| PL-1 | Regras de cuidado do overlay são **import**, não cópia | `VERIFICADO` (22/09/2026, branch `qa/rodada-a`) — lote abaixo: `Test Files 12 passed (12) · Tests 143 passed (143)`; 3 arquivos `care*.parity` verdes | `npx vitest run desktop/renderer/src/care.parity.test.ts desktop/renderer/src/care.feed.parity.test.ts desktop/renderer/src/care.banhoSono.parity.test.ts` | `desktop/renderer/src/care.ts` importa de `src/utils/` (footgun 9) |
| PL-2 | `saveId` igual em app, overlay e servidor | `VERIFICADO` (22/09/2026) — `saveId.parity.test.js` + `cloudSync.test.ts` verdes no mesmo lote | `npx vitest run functions/api/saveId.parity.test.js desktop/renderer/src/cloudSync.test.ts` | três implementações, salt `soulmon:` |
| PL-3 | Widget Android não cobra, não sente saudade em EN e não grava chave vetada | `VERIFICADO` (22/09/2026) — guard estendido: veta `miss(ed\|ing)? you` e `✨` (QA rodada 1 §4.2); frases trocadas em `WidgetRenderer.kt`. `petName` do bridge = `widgetPetName(soulmonMeta)` (era o estágio) — `widgetNome.contract.test.ts` | `npx vitest run src/plugins/widgetSemCobranca.contract.test.ts` | guard lê o fonte Kotlin |
| PL-4 | Copy de push igual em cliente e worker; crons derivados de `PUSH_HOURS_BRT` | `VERIFICADO` (22/09/2026) — `pushCopy.parity` + `vapid.parity` verdes no mesmo lote | `npx vitest run workers/pushCopy.parity.test.js workers/vapid.parity.test.js` | footgun 9 no `NotificationManager.tsx` (WP3.4, guarda-vínculo) |
| PL-5 | Nenhuma string de UI só em PT (aria, push, toast) — e nenhuma só em EN | `IMPLEMENTADO` parcial — greps de PT-only → 0 (21/09/2026). **Divergência em curso**: `CompanionHUD.tsx` › `aria-label` usa `FOOD_NAME_BY_EMOJI` (só EN) onde `ItemsWindow.tsx` usa `getFoodName(emoji, language)`; `grep -rn FOOD_NAME_BY_EMOJI src` = 3 em 22/09/2026, o `staff-frontend` está corrigindo (alvo: 0) | `grep -rn "aria-label=\"[^\"]*[ãõçáéíóú]" src` → 0; ternário `'pt-BR' ?` sempre com par EN | já houve `aria-label` e título de push só em PT |
| PL-6 | `android/` e `desktop/electron/*` com zero teste | `PROPOSTO` — depende de decidir o que é testável sem emulador (Gradle/Electron) | `find android/app/src -name "*Test*.kt" \| wc -l`; `ls desktop/electron/*.test.* 2>/dev/null \| wc -l` | QA geral 21/09/2026 |
| PL-7 | a11y de código: rótulo em toda ação, foco conferível, reduced-motion reduz movimento e não pausa, fonte ≥ 12px, ícone nunca em box | `IMPLEMENTADO` parcial — `iconScale.contract.test.ts` e piso `.sm2-chat-support` 12px (21/09/2026); leitor de tela **nunca medido** (→ `alpha-perf-a11y`) | `npx vitest run src/styles/iconScale.contract.test.ts` + `grep -rn "prefers-reduced-motion" src/index.css` | `04` §4.3, `CLAUDE.md` › UI |
| PL-8 | Play Billing Library ≥ 8 (Play recusa < 8 desde 31/08/2026) e `BillingPlugin.kt` na API da 8 | `IMPLEMENTADO` (22/09/2026): `billing-ktx` 6.2.1 → **8.3.0** (última 8.x nas release notes, 2025-12-23), `enablePendingPurchases(PendingPurchasesParams…enableOneTimeProducts())`, lambdas com `QueryProductDetailsResult.productDetailsList`, `enableAutoServiceReconnection()`. Guard verde no lote acima. **Compile só o CI prova** (`android-build.yml`), e o CI está parado por cobrança — até rodar, é `IMPLEMENTADO`, não `VERIFICADO` | `npx vitest run src/plugins/billingPbl8.contract.test.ts` | `05-plataforma-r1.md` §1, `00-skeptic-a.md` #10 |
| PL-9 | Alarme exato com gate `canScheduleExactAlarms()` + fallback `setAndAllowWhileIdle` + receiver de `SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED` | `IMPLEMENTADO` (22/09/2026) — mesma ressalva de compile do PL-8; JS ganhou `canScheduleExact()`/`openExactAlarmSettings()` (convite na UI opcional, por gesto, ainda não desenhado) | mesmo teste do PL-8 (`describe` PL-9) | `05-plataforma-r1.md` §2 |
| PL-10 | Desktop: validade de token desconhecida = **1h**, nunca eterna (`exp: 0`) | `VERIFICADO` (22/09/2026) — `authBridge.test.ts` fecha o buraco nos dois arquivos (guard textual em `main.js`); `npx tsc -p desktop/tsconfig.json --noEmit` exit 0; `npx vitest run desktop` → `Test Files 11 passed · Tests 165 passed` | `npx vitest run desktop/renderer/src/authBridge.test.ts` | `05-plataforma-r1.md` §5 |

## Lote de verificação de 22/09/2026 (saída colada)
```
npx vitest run desktop/renderer/src/care.parity.test.ts desktop/renderer/src/care.feed.parity.test.ts   desktop/renderer/src/care.banhoSono.parity.test.ts functions/api/saveId.parity.test.js   desktop/renderer/src/cloudSync.test.ts src/plugins workers/pushCopy.parity.test.js   workers/vapid.parity.test.js desktop/renderer/src/authBridge.test.ts
 Test Files  12 passed (12)
      Tests  143 passed (143)
```

## Verdades deste domínio que o guarda defende
- Regra copiada diverge em silêncio; o precedente é **importar** (`care.ts`). Onde importar é
  impossível (Kotlin), o teste de paridade lê o fonte e entra no mesmo commit.
- Chaves do bridge Android são congeladas — só se acrescenta; o plugin **remove** a vetada.
- O widget é a superfície mais vista do telefone e **nunca cobra**.
- Todo texto de UI nasce em EN com o par PT; `resolveLanguage` é o ponto único.
- Movimento reduzido reduz o MOVIMENTO, nunca a cerimônia.
- Publicar o desktop só por tag `v*` (`desktop-release.yml`); o APK carrega a URL de produção.
