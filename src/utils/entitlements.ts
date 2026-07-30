import { STORAGE_KEYS } from './storageKeys';
import { authHeaders } from './auth';

// Entitlements no CLIENTE — espelho somente-leitura do que o servidor decidiu.
//
// Nada aqui é autoritativo: `credits` e `accountTier` no GameState existem só
// para a UI ter o que desenhar. Quem manda é functions/api/_entitlements.js.
// Toda operação que MEXE em saldo (gastar, ganhar por anúncio, comprar) passa
// pelo servidor e a resposta dele é que atualiza a tela.

export interface Entitlement {
  tier: 'demo' | 'paid';
  credits: number;
  adsLeft: number;
  /** Anúncio recompensado só existe quando o servidor confirma que a
   *  verificação do AdMob está configurada — ver functions/api/entitlements.js. */
  adsEnabled?: boolean;
}

function currentSaveId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.SAVE_ID);
}

/** Lê o saldo real do servidor. Retorna null se não der (offline, sem saveId). */
export async function fetchEntitlement(): Promise<Entitlement | null> {
  const id = currentSaveId();
  if (!id) return null;
  try {
    const res = await fetch(`/api/entitlements?id=${encodeURIComponent(id)}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Gasta créditos NO SERVIDOR. Só aplique o efeito no jogo se isto devolver o
 * novo saldo — null significa recusado (sem saldo, offline) e o efeito não
 * pode acontecer.
 */
export async function spendCredits(amount: number, reason: string): Promise<Entitlement | null> {
  const id = currentSaveId();
  if (!id) return null;
  try {
    const res = await fetch('/api/entitlements?action=spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ id, amount, reason }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.ok ? { tier: data.tier, credits: data.credits, adsLeft: data.adsLeft } : null;
  } catch {
    return null;
  }
}

/** Credita a recompensa do anúncio (o teto diário é aplicado no servidor). */
export async function claimAdReward(): Promise<Entitlement | null> {
  const id = currentSaveId();
  if (!id) return null;
  try {
    const res = await fetch('/api/entitlements?action=ad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.ok ? { tier: data.tier, credits: data.credits, adsLeft: data.adsLeft } : null;
  } catch {
    return null;
  }
}

/**
 * Manda um purchaseToken da Google Play para o servidor verificar. Só o
 * servidor decide se a compra vale — aqui só repassamos e lemos o resultado.
 */
export async function verifyPurchase(productId: string, purchaseToken: string): Promise<
  { ok: true; ent: Entitlement; consumeToken?: string } | { ok: false; reason: string }
> {
  const id = currentSaveId();
  if (!id) return { ok: false, reason: 'no-save-id' };
  try {
    const res = await fetch('/api/billing?action=verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ id, productId, purchaseToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { ok: false, reason: data.reason || `http-${res.status}` };
    }
    return {
      ok: true,
      ent: { tier: data.tier, credits: data.credits, adsLeft: data.adsLeft },
      consumeToken: data.consumeToken,
    };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
