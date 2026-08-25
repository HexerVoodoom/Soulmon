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

/**
 * Portão de TIER para as rotas que gastam COGS de IA (hoje só a geração de
 * sprite, a mais cara do app).
 *
 * `docs/PLANO-PRODUTO.md` sempre afirmou que o custo de IA está "travado atrás
 * de `accountTier:'paid'`, então só quem paga gera" — mas o servidor nunca
 * implementou isso: `generate-sprite` passava só pelo `_aiGuard`, que mede
 * VOLUME, não DIREITO. Qualquer um gerava sprite pago, e o denominador da tese
 * ("custo de IA por usuário pago ≤ R$ 8") media uma população que não era a
 * pagante.
 *
 * Aqui não se inventa mecanismo novo: o tier é lido de `ent:<saveId>`, o mesmo
 * registro que só `applyVerifiedPurchase` escreve. O cliente segue sem voto.
 *
 * **FAIL-CLOSED, e isso é a regra.** Tier indeterminável (KV não ligado, leitura
 * que explode, saveId inválido) RECUSA. O fail-open do `_auth.js`
 * (`if (!projectId) return { ok: true }`) é exatamente o defeito que a auditoria
 * encontrou: uma variável desligada virou porta aberta. Numa rota que queima
 * dinheiro real, a dúvida custa a fatura — então a dúvida nega.
 *
 * @returns {Promise<{ ok: true, tier: 'paid' } | { ok: false, status: number, reason: string }>}
 */
export async function requirePaidTier(env, saveId) {
  if (!saveId || !VALID_ID.test(saveId)) {
    return { ok: false, status: 400, reason: 'missing-save-id' };
  }
  if (!env?.DIGIAPP_SAVES) {
    return { ok: false, status: 503, reason: 'tier-unavailable' };
  }
  let ent;
  try {
    ent = await readEntitlement(env, saveId);
  } catch {
    // Não deu para saber o tier → não gasta. Ver o parágrafo FAIL-CLOSED acima.
    return { ok: false, status: 503, reason: 'tier-unavailable' };
  }
  if (ent?.tier !== 'paid') {
    return { ok: false, status: 402, reason: 'paid-tier-required' };
  }
  return { ok: true, tier: 'paid' };
}

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
 * ## Sobre a atomicidade — leia antes de confiar nisto sozinho
 *
 * O caminho do KV é **best-effort, não uma trava**. Uma versão anterior deste
 * comentário dizia que a corrida "exige tempo de propagação na casa dos
 * milissegundos". Está errado: o Workers KV é eventualmente consistente, com
 * janela de propagação de até ~60 segundos, e o `get()` mantém cache de borda
 * por 60s **inclusive para chave inexistente**. Não é preciso simultaneidade
 * nenhuma — basta as requisições caírem em colos que ainda não viram a
 * escrita. Um recibo vira N contas pagas com um laço de `curl` por N proxies
 * regionais.
 *
 * Por isso a defesa REAL é o vínculo do recibo com a conta na origem
 * (`obfuscatedExternalAccountId` na Play, session ticket na Steam — ver
 * `_billing.js`): lá a própria loja diz de quem é a compra, e recibo alheio
 * não vale em conta nenhuma.
 *
 * Aqui, quando existe um binding **D1** (`env.DB`), a reivindicação passa a ser
 * de verdade atômica: `INSERT` com `order_id` como PRIMARY KEY falha se outra
 * conta chegou primeiro, e o banco resolve a corrida. Sem D1, cai no KV com a
 * limitação acima. Ver `docs/BILLING-SETUP.md` para criar a tabela.
 *
 * @returns {Promise<{ ok: true } | { ok: false, reason: 'order-in-use' }>}
 */
export async function claimOrder(env, saveId, orderId) {
  if (env.DB) return claimOrderAtomic(env, saveId, orderId);

  const key = ORDER_PREFIX + orderId;
  const owner = await env.DIGIAPP_SAVES.get(key);
  if (owner && owner !== saveId) return { ok: false, reason: 'order-in-use' };
  if (!owner) await env.DIGIAPP_SAVES.put(key, saveId);
  return { ok: true };
}

/**
 * Reivindicação atômica via D1. O `INSERT` é a própria disputa: só um vencedor
 * é possível, porque `order_id` é PRIMARY KEY. Reprocessar na MESMA conta
 * continua valendo (é o que faz o "restaurar compras" funcionar).
 */
async function claimOrderAtomic(env, saveId, orderId) {
  try {
    await env.DB
      .prepare('INSERT INTO order_claims (order_id, save_id, claimed_at) VALUES (?, ?, ?)')
      .bind(orderId, saveId, Date.now())
      .run();
    return { ok: true };
  } catch {
    // Violou a PRIMARY KEY: alguém já reivindicou. Quem?
    const row = await env.DB
      .prepare('SELECT save_id FROM order_claims WHERE order_id = ?')
      .bind(orderId)
      .first();
    if (row?.save_id === saveId) return { ok: true };
    return { ok: false, reason: 'order-in-use' };
  }
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
