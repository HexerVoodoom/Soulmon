# Ledger — guarda-sustento (WP0.6, WP5.1–5.4)

Dono: `soulmon-guarda-sustento`. Anexo: `../D-monetizacao.md`.

| WP | O quê | Estado | Comando de verificação | Evidência |
|---|---|---|---|---|
| WP0.6 | `setObfuscatedAccountId(saveId)` no Play Billing | `PROPOSTO` (**requer APK**) | `grep -rq "setObfuscatedAccountId" android/app/src/main/java/com/hexervoodoom/soulmon/plugins/BillingPlugin.kt` + teste em `billing.play.test.js` cobrindo `PLAY_REQUIRE_ACCOUNT_BINDING='true'` | NÃO EXISTE hoje → trava anti-clonagem não pode ser ligada |
| WP5.1 | Descoberta na Loja e no 1º dia perfeito | `PROPOSTO` | `grep -q "UnlockNudge" src/components/ShopModal.tsx src/components/DailyReportModal.tsx` + teste: nunca no D0, nunca 2×/semana, nunca no modo acolhida | zero pontos hoje nessas duas telas |
| WP5.2 | Cura instantânea por Créditos: remover ou reenquadrar | `BLOQUEADO:D7` | opção (a): `! grep -q "handleInstantHealWithCredits" src/App.tsx`; opção (b): passa por `applySpecialItem` | única peça que vende HP por dinheiro real |
| WP5.3 | Idempotência de `spend` | `PROPOSTO` | teste em `_entitlements.test.js`: mesmo `opId` duas vezes debita uma vez | sem estorno server-side hoje |
| WP5.4 | Spec de assinatura/trial (documento, não código) | `BLOQUEADO:D10` | documento existe e lista as travas de C.3 #3 | — |

## Verdades deste domínio que o guarda defende
- **Dinheiro nunca compra a barra que representa o cuidado que a pessoa teve consigo mesma.** É o "valor sagrado" (C5) e a razão de D7 existir.
- **Não existe Bits→Créditos.** Emblemas nunca compram vantagem.
- O cliente **nunca** decide tier/créditos; um comprovante vale para **uma** conta (`claimOrder`).
- A oferta aparece no **value moment** (1º dia perfeito), nunca no reveal do Oráculo e nunca no D0.
- Promoção **espaçada e imprevisível** — desconto programado ensina a esperar (C5).
- `ADS_ENABLED=false`. Reabrir anúncio é decisão do dono, não efeito colateral.
