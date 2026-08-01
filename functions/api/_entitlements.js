// Entitlements — FONTE DA VERDADE de tudo que envolve dinheiro real.
//
// Regra de ouro: o cliente NUNCA dita tier nem saldo de créditos. O save do
// jogo (functions/api/save.js) é gravado pelo próprio cliente e portanto é
// dado NÃO CONFIÁVEL — qualquer pessoa consegue editar o localStorage ou
// fazer um POST direto no /api/save. Por isso `accountTier` e `credits` vivem
// num registro separado (`ent:<saveId>`) que só este módulo escreve, a partir
// de eventos verificados no servidor (compra validada na Play, anúncio dentro
// do cap diário).
//
// Limitação conhecida: o KV do Cloudflare não tem transação. Um read-modify-
// write concorrente pode perder uma escrita (ex.: dois gastos simultâneos).
// Para a escala deste app é aceitável; se virar problema, migrar o registro
// de entitlement para Durable Objects (que serializam por chave).

export const ENT_PREFIX = 'ent:';
/** Comprovante de compra → conta Soulmon que o resgatou (ver claimOrder). */
export const ORDER_PREFIX = 'ord:';
export const VALID_ID = /^[a-zA-Z0-9_-]{8,64}$/;

/** Recompensa por anúncio assistido e teto diário — espelham utils/monetization.ts. */
export const AD_REWARD_CREDITS = 5;
export const AD_DAILY_CAP = 3;

const today = () => new Date().toISOString().slice(0, 10);

/** Registro zerado — conta nova começa em demo, sem créditos. */
function emptyEntitlement() {
  return {
    tier: 'demo',
    credits: 0,
    /** orderIds já creditados — impede reprocessar a mesma compra (replay). */
    consumedOrders: [],
    adDate: today(),
    adCount: 0,
    updatedAt: Date.now(),
  };
}

export async function readEntitlement(env, saveId) {
  const raw = await env.DIGIAPP_SAVES.get(ENT_PREFIX + saveId);
  if (!raw) return emptyEntitlement();
  try {
    const parsed = JSON.parse(raw);
    return { ...emptyEntitlement(), ...parsed };
  } catch {
    return emptyEntitlement();
  }
}

export async function writeEntitlement(env, saveId, ent) {
  ent.updatedAt = Date.now();
  await env.DIGIAPP_SAVES.put(ENT_PREFIX + saveId, JSON.stringify(ent));
  return ent;
}

/** Visão pública (o que o cliente pode saber) do entitlement. */
export function publicView(ent) {
  const sameDay = ent.adDate === today();
  const used = sameDay ? ent.adCount : 0;
  return {
    tier: ent.tier,
    credits: ent.credits,
    adsLeft: Math.max(0, AD_DAILY_CAP - used),
  };
}

/**
 * Gasta créditos. Retorna null se não houver saldo — quem chama deve tratar
 * isso como "compra recusada" e NÃO aplicar o efeito no jogo.
 */
export async function spendCredits(env, saveId, amount) {
  const ent = await readEntitlement(env, saveId);
  if (!Number.isInteger(amount) || amount <= 0) return null;
  if (ent.credits < amount) return null;
  ent.credits -= amount;
  await writeEntitlement(env, saveId, ent);
  return ent;
}

/** Credita a recompensa de um anúncio, respeitando o teto diário do servidor. */
export async function grantAdReward(env, saveId) {
  const ent = await readEntitlement(env, saveId);
  if (ent.adDate !== today()) {
    ent.adDate = today();
    ent.adCount = 0;
  }
  if (ent.adCount >= AD_DAILY_CAP) return null;
  ent.adCount += 1;
  ent.credits += AD_REWARD_CREDITS;
  await writeEntitlement(env, saveId, ent);
  return ent;
}

/**
 * Amarra um comprovante de compra a UMA conta Soulmon — globalmente.
 *
 * ## Por que `consumedOrders` não basta
 *
 * A lista `consumedOrders` vive DENTRO de cada entitlement. Ela impede
 * processar a mesma compra duas vezes *na mesma conta*, mas não vê nada fora
 * dela: em toda conta nova o mesmo comprovante é "inédito". Isso abre o mesmo
 * furo nas duas lojas:
 *
 *   • Play — o desbloqueio completo é NÃO consumível, então `getPurchases()`
 *     devolve ele para sempre. Bastava sair, entrar com outro e-mail e tocar em
 *     "Restaurar compras" para clonar a conta paga quantas vezes quisesse.
 *   • Steam — o benefício vem da *posse do app*, um estado permanente e
 *     reconsultável. Mesma história.
 *
 * Este registro é a trava que faltava: um comprovante pertence a exatamente uma
 * conta. O primeiro que resgatar fica com ele; reprocessar na MESMA conta
 * continua permitido (é o que faz o "restaurar compras" funcionar de verdade).
 *
 * Vale a mesma limitação de concorrência do resto do módulo: o KV não tem
 * transação, então dois resgates simultâneos do mesmo comprovante em contas
 * diferentes poderiam, em tese, passar os dois. Exige tempo de propagação na
 * casa dos milissegundos e um atacante coordenando duas contas — se virar
 * problema, é o mesmo caminho de migração para Durable Objects.
 *
 * @returns {Promise<{ ok: true } | { ok: false, reason: 'order-in-use' }>}
 */
export async function claimOrder(env, saveId, orderId) {
  const key = ORDER_PREFIX + orderId;
  const owner = await env.DIGIAPP_SAVES.get(key);
  if (owner && owner !== saveId) return { ok: false, reason: 'order-in-use' };
  if (!owner) await env.DIGIAPP_SAVES.put(key, saveId);
  return { ok: true };
}

/**
 * Aplica uma compra JÁ VERIFICADA na Google Play. `orderId` vem da Play e é
 * único por transação — se já foi consumido, a chamada é ignorada (o cliente
 * pode reenviar o mesmo token em retries/restore sem duplicar crédito).
 */
export async function applyVerifiedPurchase(env, saveId, { orderId, grantTier, grantCredits }) {
  const ent = await readEntitlement(env, saveId);
  if (orderId && ent.consumedOrders.includes(orderId)) {
    return { ent, duplicate: true };
  }
  if (grantTier === 'paid') ent.tier = 'paid';
  if (grantCredits > 0) ent.credits += grantCredits;
  if (orderId) {
    ent.consumedOrders.push(orderId);
    // Mantém a lista limitada — só precisamos do histórico recente pra replay.
    if (ent.consumedOrders.length > 200) ent.consumedOrders = ent.consumedOrders.slice(-200);
  }
  await writeEntitlement(env, saveId, ent);
  return { ent, duplicate: false };
}
