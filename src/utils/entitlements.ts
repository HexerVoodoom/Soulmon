import { STORAGE_KEYS } from './storageKeys';
import { authHeaders } from './auth';
import { readLocal } from './safeStorage';

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
  return readLocal(STORAGE_KEYS.SAVE_ID);
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
 * WP5.3 — um id por GESTO. `crypto.randomUUID` quando existe; senão, uma
 * composição de tempo + aleatório, que basta: o id só precisa ser único
 * dentro da janela de retry de um aparelho, não no universo.
 */
function newOpId(): string {
  try {
    const uuid = globalThis.crypto?.randomUUID?.();
    if (uuid) return uuid.replace(/-/g, '');
  } catch { /* segue para o fallback */ }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Gasta créditos NO SERVIDOR. Só aplique o efeito no jogo se isto devolver o
 * novo saldo — null significa recusado (sem saldo, offline) e o efeito não
 * pode acontecer.
 */
export async function spendCredits(
  amount: number,
  reason: string,
  /** WP5.3 — id do GESTO. Repetir o mesmo gesto (retry de rede, dois toques,
   *  aba duplicada) devolve o mesmo resultado em vez de cobrar de novo. Quem
   *  não passa continua funcionando como antes: o id é opcional para não
   *  quebrar o APK já instalado. */
  opId: string = newOpId(),
): Promise<Entitlement | null> {
  const id = currentSaveId();
  if (!id) return null;
  try {
    const res = await fetch('/api/entitlements?action=spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ id, amount, reason, opId }),
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
 * 🥚 #62 — ZERA O TETO VITALÍCIO DE SPRITE NO RENASCIMENTO.
 *
 * DECISÃO DO DONO #62 (22/09/2026, `docs/PERGUNTAS-DO-DONO.md`):
 * *"Rebirth: **zerar `aiLifetime.sprite`** no renascimento"*.
 *
 * O contador vitalício mora no SERVIDOR (`ent:<saveId>.aiLifetime.sprite`,
 * `functions/api/_aiGuard.js`) e não pode morar em outro lugar: o cliente é
 * editável, e um teto de geração de imagem no save do jogador é um teto que
 * não existe. Por isso o renascimento — que é do cliente — precisa PEDIR.
 *
 * A rota confere sozinha que o renascimento aconteceu (lê `state.rebirth` do
 * save do titular) e é idempotente (`rebirthSpriteResetAt`), então esta
 * chamada não carrega autoridade nenhuma: ela só avisa.
 *
 * ⚠️ Falha aqui **não pode bloquear o renascimento**. O renascimento é uma vez
 * só na vida do save; perdê-lo por um 500 de rede seria trocar um teto de
 * custo por um dano irreversível ao jogador. Devolve `false` em silêncio e o
 * jogador segue — o pior caso é ele gerar menos sprites do que a decisão
 * concede, e a rota continua idempotente para um retry futuro.
 */
export async function resetSpriteLifetimeAfterRebirth(): Promise<boolean> {
  const id = currentSaveId();
  if (!id) return false;
  try {
    const res = await fetch('/api/entitlements?action=rebirth-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.ok;
  } catch {
    return false;
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
