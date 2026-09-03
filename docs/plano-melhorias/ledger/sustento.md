# Ledger — guarda-sustento (WP0.6, WP5.1–5.4)

Dono: `soulmon-guarda-sustento`. Anexo: `../D-monetizacao.md`.

| WP | O quê | Estado | Comando de verificação | Evidência |
|---|---|---|---|---|
| WP0.6 | `setObfuscatedAccountId(saveId)` no Play Billing | `PROPOSTO` (**requer APK**) | `grep -rq "setObfuscatedAccountId" android/app/src/main/java/com/hexervoodoom/soulmon/plugins/BillingPlugin.kt` + teste em `billing.play.test.js` cobrindo `PLAY_REQUIRE_ACCOUNT_BINDING='true'` | NÃO EXISTE hoje → trava anti-clonagem não pode ser ligada |
| WP5.1 | Descoberta na Loja e no 1º dia perfeito | `PROPOSTO` | `grep -q "UnlockNudge" src/components/ShopModal.tsx src/components/DailyReportModal.tsx` + teste: nunca no D0, nunca 2×/semana, nunca no modo acolhida | zero pontos hoje nessas duas telas |
| WP5.2 | Cura instantânea por Créditos: remover ou reenquadrar | `BLOQUEADO:D7` | opção (a): `! grep -q "handleInstantHealWithCredits" src/App.tsx`; opção (b): passa por `applySpecialItem` | única peça que vende HP por dinheiro real |
| WP5.3 | Idempotência de `spend` | `PROPOSTO` | teste em `_entitlements.test.js`: mesmo `opId` duas vezes debita uma vez | sem estorno server-side hoje |
| WP5.4 | Spec de assinatura/trial (documento, não código) | `BLOQUEADO:D10` | documento existe e lista as travas de C.3 #3 | — |
| WP5.5 | "Agora não" com peso de primário no `UnlockAccountModal` | `PROPOSTO` | `grep -q "Agora não" src/components/UnlockAccountModal.tsx` + render test dos 3 botões | Mobbin D11 (Character AI) |

## Verdades deste domínio que o guarda defende
- **Dinheiro nunca compra a barra que representa o cuidado que a pessoa teve consigo mesma.** É o "valor sagrado" (C5) e a razão de D7 existir.
- **Não existe Bits→Créditos.** Emblemas nunca compram vantagem.
- O cliente **nunca** decide tier/créditos; um comprovante vale para **uma** conta (`claimOrder`).
- A oferta aparece no **value moment** (1º dia perfeito), nunca no reveal do Oráculo e nunca no D0.
- Promoção **espaçada e imprevisível** — desconto programado ensina a esperar (C5).
- `ADS_ENABLED=false`. Reabrir anúncio é decisão do dono, não efeito colateral.

## Mobbin (02/09/2026) — `../mobbin/sustento.md`
- Dossiê 11 tem **1** padrão positivo (Garmin: `×` no card, botão parcial, container-irmão) e 19 anti-padrões. Valida a arquitetura (nunca abre sozinho) e **reescreve a forma do WP5.1**: canal passivo (Loja, permanente, fora do cap) × canal proativo (1º dia perfeito, 1/semana, `×` permanente via `offerDismissed`); `TELEMETRY_UNLOCK_REASON` precisa de `shop:2`/`report:3` e o allowlist `unlock_view.reason` de `max:3`.
- Candidato sem número: "Agora não" com peso de primário no `UnlockAccountModal` (Character AI). WP5.4 ganha trava "lembrete 2 dias antes do fim do trial" (Meetup).
- Oferta no D0 (Shopify) e no reveal (Replika, "pedágio no clímax") aparecem no dossiê e foram **rejeitadas por C.3 #1**.
- Pontos de descoberta hoje: **3, todos de recusa** (`CreateModal`, `EditModal`, `App.tsx` view `evolution`); último a entrar: `EditModal` (`24870bf7`).
