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
    /**
     * O que cada compra concedeu, para poder ser DESFEITO num reembolso.
     * `consumedOrders` guarda só o id: sem estes detalhes o servidor sabe que
     * a compra existiu, mas não quanto devolver. Ver auditRefunds.
     * `{ orderId, provider, productId, purchaseToken, grantTier, grantCredits, voided? }`
     */
    orderDetails: [],
    /** Epoch ms da última conferência de reembolso (0 = nunca). */
    auditedAt: 0,
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
 * Aplica uma compra JÁ VERIFICADA na loja. `orderId` é único por transação —
 * se já foi consumido, a chamada é ignorada (o cliente pode reenviar o mesmo
 * token em retries/restore sem duplicar crédito).
 *
 * `provider`/`productId`/`purchaseToken` são guardados só para o reembolso
 * saber o que desfazer depois (ver auditRefunds).
 */
export async function applyVerifiedPurchase(env, saveId, {
  orderId, grantTier, grantCredits, provider, productId, purchaseToken,
}) {
  const ent = await readEntitlement(env, saveId);
  if (orderId && ent.consumedOrders.includes(orderId)) {
    return { ent, duplicate: true };
  }
  if (grantTier === 'paid') ent.tier = 'paid';
  if (grantCredits > 0) ent.credits += grantCredits;
  if (orderId) {
    ent.consumedOrders.push(orderId);
    ent.orderDetails.push({
      orderId, provider, productId, purchaseToken,
      grantTier: grantTier ?? null,
      grantCredits: grantCredits ?? 0,
    });
    // Mantém as listas limitadas — só precisamos do histórico recente.
    if (ent.consumedOrders.length > 200) ent.consumedOrders = ent.consumedOrders.slice(-200);
    if (ent.orderDetails.length > 200) ent.orderDetails = ent.orderDetails.slice(-200);
  }
  await writeEntitlement(env, saveId, ent);
  return { ent, duplicate: false };
}

/** Quanto tempo entre duas conferências de reembolso da mesma conta. */
export const AUDIT_INTERVAL_MS = 24 * 60 * 60 * 1000;
/** Teto de compras conferidas por rodada — evita estourar a quota da loja. */
const AUDIT_MAX_ORDERS = 20;

/**
 * Desfaz as compras que a loja passou a reportar como reembolsadas.
 *
 * ## Por que é preguiçoso (sem cron)
 *
 * A alternativa clássica é um job periódico lendo a Voided Purchases API. Isso
 * exigiria um worker novo, com deploy e secrets próprios. Para a escala deste
 * app, conferir na leitura do saldo — no máximo 1× por dia por conta — chega no
 * mesmo lugar sem nada disso, e se auto-corrige: a conta reembolsada perde o
 * benefício na primeira vez que abrir o app.
 *
 * O preço: quem reembolsa e nunca mais abre o app fica marcado como pago no
 * banco. Como ele não abre o app, isso não vale nada para ele.
 *
 * @param {(order) => Promise<boolean|null>} isVoided Consulta a loja. `true` =
 *   reembolsada/cancelada, `false` = válida, `null` = não deu para saber (a
 *   compra é MANTIDA — na dúvida nunca se tira o que o jogador pagou).
 * @returns {Promise<{ ent: object, revoked: string[] }>}
 */
export async function auditRefunds(env, saveId, isVoided, now = Date.now()) {
  const ent = await readEntitlement(env, saveId);
  if (now - (ent.auditedAt || 0) < AUDIT_INTERVAL_MS) return { ent, revoked: [] };

  const pending = ent.orderDetails.filter(o => !o.voided).slice(-AUDIT_MAX_ORDERS);
  // Nada a conferir: sai SEM gravar. Senão toda leitura de uma conta que nunca
  // comprou criaria um registro no KV só para anotar a data da conferência.
  if (pending.length === 0) return { ent, revoked: [] };

  const revoked = [];

  for (const order of pending) {
    let voided;
    try {
      voided = await isVoided(order);
    } catch {
      voided = null;
    }
    if (voided !== true) continue;

    order.voided = true;
    revoked.push(order.orderId);
    if (order.grantTier === 'paid') ent.tier = 'demo';
    // Créditos já gastos não voltam do nada: o saldo nunca fica negativo.
    // O jogador que reembolsa depois de gastar sai no lucro dessa diferença —
    // cobrar dele um saldo que não existe mais só criaria uma conta travada.
    if (order.grantCredits > 0) ent.credits = Math.max(0, ent.credits - order.grantCredits);
  }

  ent.auditedAt = now;
  await writeEntitlement(env, saveId, ent);
  return { ent, revoked };
}
