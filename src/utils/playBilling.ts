import { verifyPurchase, type Entitlement } from './entitlements';
import { readLocal } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';

// Google Play Billing — ponte com o plugin nativo.
//
// ESTADO ATUAL: nenhum plugin de billing está instalado ainda (ver
// docs/BILLING-SETUP.md para o passo a passo). Este módulo já define o
// contrato e detecta o plugin em tempo de execução, então:
//   - No navegador/PWA: `isBillingAvailable()` é false e a UI mostra
//     "disponível no app Android" em vez de um botão que não faz nada.
//   - No app Android com o plugin instalado: funciona de verdade.
// Em NENHUM caso este arquivo finge uma compra — sem plugin, `purchase()`
// devolve { ok: false, reason: 'unavailable' }.
//
// Fluxo completo de uma compra:
//   1. plugin.purchase(sku)            → abre a UI da Play, devolve purchaseToken
//   2. /api/billing?action=verify      → o SERVIDOR pergunta à Google se é real
//   3. servidor concede no entitlement → devolve o novo saldo/tier
//   4. plugin.consume(token)           → só para consumíveis (pacotes de crédito),
//      senão o jogador não consegue recomprar o mesmo pacote
//
// O passo 2 é o que impede fraude: um purchaseToken inventado é rejeitado pela
// própria Google, então o benefício nunca é concedido.

/** Forma mínima que o plugin nativo precisa expor para esta ponte funcionar. */
interface BillingPlugin {
  /** WP0.6 — `saveId` amarra a compra à conta do jogo (obfuscatedAccountId). */
  purchase(options: { productId: string; saveId?: string }): Promise<{ purchaseToken: string }>;
  /** WP5.8 — preço do Play já formatado na moeda do país da conta. */
  getLocalizedPrice?(options: { productId: string }): Promise<{ formattedPrice: string }>;
  consume(options: { purchaseToken: string }): Promise<void>;
  /** Compras não consumidas/não consumíveis da conta — usado no "restaurar compras". */
  getPurchases?(): Promise<{ purchases: Array<{ productId: string; purchaseToken: string }> }>;
}

/**
 * Procura o plugin registrado no Capacitor. Ao instalar um plugin de billing,
 * registre-o com o nome 'Billing' (ou ajuste a chave aqui) — ver
 * docs/BILLING-SETUP.md.
 */
function getPlugin(): BillingPlugin | null {
  const cap = (globalThis as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean; Plugins?: Record<string, unknown> };
  }).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  const plugin = cap.Plugins?.Billing as BillingPlugin | undefined;
  if (!plugin || typeof plugin.purchase !== 'function') return null;
  return plugin;
}

/**
 * WP5.8 — o preço que o Play VAI cobrar, na moeda de quem está olhando.
 *
 * O app mostrava um rótulo fixo em BRL escrito no cliente; fora do Brasil isso
 * é um número errado numa tela de compra, e número errado ali é lido como
 * promessa. Devolve `null` quando não dá para consultar (web, plugin antigo,
 * Play indisponível) — e aí quem chama CAI NO RÓTULO de sempre, nunca numa
 * tela em branco.
 */
export async function getLocalizedPrice(productId: string): Promise<string | null> {
  const plugin = getPlugin();
  if (!plugin || typeof plugin.getLocalizedPrice !== 'function') return null;
  try {
    const r = await plugin.getLocalizedPrice({ productId });
    const preco = r?.formattedPrice;
    return typeof preco === 'string' && preco.trim() ? preco : null;
  } catch {
    return null;
  }
}

/** true só quando dá para comprar de verdade (app Android + plugin presente). */
export function isBillingAvailable(): boolean {
  return getPlugin() !== null;
}

export type PurchaseResult =
  | { ok: true; ent: Entitlement }
  | { ok: false; reason: 'unavailable' | 'cancelled' | 'invalid-purchase' | 'billing-not-configured' | string };

/**
 * Compra um SKU e só devolve ok:true depois que o SERVIDOR confirmou a compra
 * junto à Google. Nunca conceda benefício sem esse ok.
 */
export async function purchase(productId: string): Promise<PurchaseResult> {
  const plugin = getPlugin();
  if (!plugin) return { ok: false, reason: 'unavailable' };

  let purchaseToken: string;
  try {
    /* WP0.6 — o `saveId` viaja com a compra (`setObfuscatedAccountId`), para
       o servidor poder conferir DE QUEM ela é. `claimOrder` já impedia
       reutilizar um comprovante, mas não sabia dizer a quem ele pertencia.
       Ausente (usuário sem save derivado ainda) não bloqueia nada: o servidor
       só EXIGE o vínculo com `PLAY_REQUIRE_ACCOUNT_BINDING=true`, e ligar isso
       antes do APK com esta linha recusaria toda compra. */
    const result = await plugin.purchase({ productId, saveId: readLocal(STORAGE_KEYS.SAVE_ID) ?? undefined });
    purchaseToken = result?.purchaseToken;
    if (!purchaseToken) return { ok: false, reason: 'cancelled' };
  } catch (err) {
    // O usuário fechar a janela da Play cai aqui — não é erro nosso.
    if (import.meta.env.DEV) console.warn('[billing] purchase aborted:', err);
    return { ok: false, reason: 'cancelled' };
  }

  const verified = await verifyPurchase(productId, purchaseToken);
  if (!verified.ok) return { ok: false, reason: verified.reason };

  // Consumíveis precisam ser consumidos na Play para poderem ser recomprados.
  if (verified.consumeToken) {
    try {
      await plugin.consume({ purchaseToken: verified.consumeToken });
    } catch (err) {
      // O crédito JÁ foi concedido no servidor; falhar aqui só significa que a
      // Play ainda considera o item "em posse". O restore resolve na próxima.
      if (import.meta.env.DEV) console.warn('[billing] consume failed:', err);
    }
  }

  return { ok: true, ent: verified.ent };
}

export type RestoreResult =
  | { ok: true; ent: Entitlement }
  | { ok: false; reason: 'nothing-to-restore' | 'order-in-use' | string };

/**
 * Restaurar compras — reenvia ao servidor tudo que a conta Google possui.
 * Necessário para o usuário que reinstalou o app ou trocou de aparelho
 * recuperar o desbloqueio completo (compra não consumível).
 *
 * `order-in-use` merece tratamento próprio na UI: significa que a compra é
 * real, mas pertence a OUTRA conta Soulmon (o servidor amarra cada comprovante
 * a uma conta — ver claimOrder em functions/api/_entitlements.js). É o caso do
 * usuário que trocou de e-mail; sem uma mensagem específica ele acharia que
 * simplesmente perdeu o que pagou.
 */
export async function restorePurchases(): Promise<RestoreResult> {
  const plugin = getPlugin();
  if (!plugin?.getPurchases) return { ok: false, reason: 'unavailable' };
  try {
    const { purchases } = await plugin.getPurchases();
    let latest: Entitlement | null = null;
    let blocked: string | null = null;
    for (const p of purchases ?? []) {
      const verified = await verifyPurchase(p.productId, p.purchaseToken);
      if (verified.ok) latest = verified.ent;
      else if (verified.reason === 'order-in-use') blocked = verified.reason;
    }
    if (latest) return { ok: true, ent: latest };
    return { ok: false, reason: blocked ?? 'nothing-to-restore' };
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[billing] restore failed:', err);
    return { ok: false, reason: 'error' };
  }
}
