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
 * RETENÇÃO de `ent:` e `ord:` — **5 anos**, decisão do dono (item 3.1 do
 * `GUIA-DO-DONO.md`). Até aqui os dois eram gravados sem TTL nenhum, ou seja:
 * para sempre.
 *
 * O raciocínio dele, registrado aqui porque número de política sem o porquê
 * vira número mágico na primeira refatoração: cinco anos cobrem o prazo do CDC
 * para reclamação de vício/fato do produto e o prazo fiscal usual de guarda —
 * e depois disso o dado some sozinho. É o MENOR prazo que ainda protege numa
 * disputa de compra, e fecha a ponta solta de guardar indefinidamente um
 * identificador derivado de e-mail.
 *
 * ## O prazo é RENOVADO a cada escrita, e isso é a metade que importa
 *
 * A pergunta que este TTL responde é **"essa conta ainda existe?"**, não
 * "quando ela nasceu?". Mesmo precedente já decidido no cloud save
 * (`save.js`), onde até uma escrita recusada renova: o que mantém o registro
 * vivo é o SINAL DE VIDA, não o sucesso da operação.
 *
 * Isso não é detalhe de implementação — é o que impede o TTL de estragar duas
 * coisas que dependem de `ent:` durar:
 *
 *  1. **O tier pago.** Um prazo fixo contado do nascimento tiraria o `paid` de
 *     quem comprou e continua jogando, cinco anos depois, sem nada ter
 *     acontecido. Isso não seria retenção de dados: seria tomar de volta o que
 *     a pessoa pagou.
 *  2. **O teto VITALÍCIO de IA** (`aiLifetime`/`aiForms`, ver `_aiGuard.js`,
 *     que afirma em texto que "teto vitalício que expira não é vitalício").
 *     Com renovação, o teto NÃO reseta para ninguém que jogue: toda geração de
 *     sprite é uma escrita neste registro, e toda leitura de saldo de uma conta
 *     com compra escreve a conferência de reembolso (`auditRefunds`, no máximo
 *     1×/dia). O registro só morre depois de **5 anos de silêncio absoluto** —
 *     e aí ele morre INTEIRO, não só o contador.
 *
 * O que sobra de reset é, então: quem some por cinco anos e volta chega como
 * conta nova, com 26 gerações de novo (R$ 2,63 de custo). É consequência
 * QUERIDA, não efeito colateral — quem apagou o rastro tem que poder recomeçar,
 * e o direito pago volta pelo caminho que já existe (restaurar compra, que
 * reverifica o recibo NA LOJA).
 *
 * O caminho **D1** de `claimOrder` (`order_claims`) obedece à MESMA decisão, por
 * outro mecanismo: banco não expira linha sozinho, então a linha carrega o
 * próprio vencimento na coluna `expires_at` (derivada desta constante) e quem
 * passa por lá apaga o que venceu. Renova do mesmo jeito. Ver `claimOrderAtomic`
 * e `migrations/0002_order_claims_expires_at.sql`.
 */
export const RETENTION_TTL_SECONDS = 5 * 365 * 24 * 60 * 60;

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
    /**
     * Consumo VITALÍCIO de IA cara, por bucket (`{ sprite: 7 }`). Mora aqui, e
     * não numa chave `ai:*` com TTL, porque teto vitalício que expira não é
     * teto vitalício — é um teto diário com nome comprido. Ver `_aiGuard.js`.
     */
    aiLifetime: {},
    /**
     * Consumo VITALÍCIO por FORMA da árvore (`{ 'mega-virus': 3 }`). Mesma casa
     * e mesmo motivo do `aiLifetime`: teto por forma que se perde no reset do
     * dia é teto nenhum. Dicionário fechado nas 11 formas que existem — o
     * `_aiGuard` valida o id antes de escrever (`VALID_FORM_ID`), senão o
     * cliente inflaria este registro com uma chave por requisição.
     */
    aiForms: {},
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
  // O TTL vai em TODA escrita, e não só na primeira: é assim que ele renova.
  // Ver RETENTION_TTL_SECONDS — sem a renovação, o teto vitalício de IA e o
  // tier pago passariam a expirar em 5 anos para quem nunca parou de jogar.
  await env.DIGIAPP_SAVES.put(
    ENT_PREFIX + saveId,
    JSON.stringify(ent),
    { expirationTtl: RETENTION_TTL_SECONDS },
  );
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
 *
 * WP5.3 — IDEMPOTÊNCIA POR `opId`.
 *
 * Créditos são comprados com DINHEIRO REAL, e até aqui a única proteção
 * contra debitar duas vezes era `healInFlightRef`, uma guarda de CLIENTE: dois
 * toques rápidos, um retry de rede ou uma aba duplicada cobravam duas vezes
 * pelo mesmo gesto. Guarda de cliente não protege dinheiro — o cliente é
 * editável e a rede repete sozinha.
 *
 * Agora cada GESTO carrega um `opId`, e o servidor guarda `spend:<saveId>:<opId>`
 * com o resultado. A repetição devolve **o mesmo resultado**, sem debitar de
 * novo — e sem devolver erro, porque para quem chamou duas vezes o correto é
 * "sua compra foi feita", não "falhou".
 *
 * TTL de 24h: a janela de retry de qualquer cliente razoável é de segundos, e
 * guardar para sempre transformaria a chave numa lista infinita de gestos.
 * Sem `opId` (cliente antigo), o comportamento é o de antes — nunca uma recusa
 * por causa de um campo que o app instalado não manda.
 */
const SPEND_TTL_SECONDS = 24 * 60 * 60;

export async function spendCredits(env, saveId, amount, opId) {
  if (!Number.isInteger(amount) || amount <= 0) return null;

  const chave = opId && /^[A-Za-z0-9_-]{8,64}$/.test(opId)
    ? `spend:${saveId}:${opId}`
    : null;
  if (chave) {
    const anterior = await env.DIGIAPP_SAVES.get(chave);
    // Repetição do MESMO gesto: devolve o que já aconteceu. Debitar de novo
    // seria cobrar duas vezes; recusar seria mentir sobre uma compra feita.
    if (anterior) { try { return JSON.parse(anterior); } catch { return null; } }
  }

  const ent = await readEntitlement(env, saveId);
  if (ent.credits < amount) return null;
  ent.credits -= amount;
  await writeEntitlement(env, saveId, ent);
  if (chave) {
    await env.DIGIAPP_SAVES.put(chave, JSON.stringify(ent), { expirationTtl: SPEND_TTL_SECONDS });
  }
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
 * limitação acima. O schema é versionado em `migrations/` (ver o README de lá);
 * `docs/BILLING-SETUP.md` explica quando vale a pena ligar.
 *
 * @returns {Promise<{ ok: true } | { ok: false, reason: 'order-in-use' }>}
 */
export async function claimOrder(env, saveId, orderId) {
  if (env.DB) return claimOrderAtomic(env, saveId, orderId);

  const key = ORDER_PREFIX + orderId;
  const owner = await env.DIGIAPP_SAVES.get(key);
  if (owner && owner !== saveId) return { ok: false, reason: 'order-in-use' };
  // Reivindicação nova OU do MESMO dono: as duas gravam, e a segunda existe só
  // para RENOVAR o prazo. Reprocessar na mesma conta é o "restaurar compras" —
  // um recibo que continua sendo exercido é um recibo vivo, e a pergunta que o
  // TTL faz aqui é essa. Sem a renovação, o vínculo morreria 5 anos depois da
  // COMPRA mesmo com o comprador jogando, e a trava anti-fraude (um recibo, uma
  // conta) cairia junto, de graça, para quem só esperasse.
  //
  // A escrita não muda o dono: `owner === saveId` ou não existe dono. Tentativa
  // alheia recusa ANTES desta linha, e portanto nem renova nem reescreve.
  await env.DIGIAPP_SAVES.put(key, saveId, { expirationTtl: RETENTION_TTL_SECONDS });
  return { ok: true };
}

/**
 * Reivindicação atômica via D1. O `INSERT` é a própria disputa: só um vencedor
 * é possível, porque `order_id` é PRIMARY KEY. Reprocessar na MESMA conta
 * continua valendo (é o que faz o "restaurar compras" funcionar).
 *
 * ## O prazo aqui é COLUNA, e a limpeza é na leitura
 *
 * `RETENTION_TTL_SECONDS` é um recurso do KV: a chave morre sozinha. Banco não
 * apaga linha sozinho, e por um tempo isso deixou os dois backends com
 * políticas DIFERENTES para o mesmo dado — o `ord:` do KV com prazo de 5 anos,
 * a linha equivalente do D1 para sempre.
 *
 * O desenho que fecha a paridade: a linha carrega o próprio vencimento em
 * `expires_at` (o prazo vira DADO, não convenção guardada em código de job), e
 * quem passa por este caminho apaga a linha que venceu ANTES de decidir a
 * disputa. Sem cron, sem infra nova, e a limpeza custa uma busca por PRIMARY
 * KEY — o mesmo índice que a disputa já usa.
 *
 * A ordem não é acidental: se o DELETE viesse depois do INSERT, uma linha
 * vencida ainda estaria lá na hora de decidir, e o recibo ficaria travado para
 * sempre por um vínculo morto — exatamente o problema que o prazo existe para
 * não ter.
 *
 * ## Reivindicar RENOVA — a metade que importa, igual ao KV
 *
 * Chegar aqui pelo mesmo dono é o "restaurar compras", e recibo em uso é recibo
 * vivo: o UPDATE empurra `expires_at`, e só ele. `claimed_at` continua sendo
 * quando a linha nasceu — renovar é sinal de vida, não novo nascimento. A
 * tentativa ALHEIA recusa antes de qualquer escrita: não muda dono e não renova
 * prazo de vínculo que ninguém exerce.
 *
 * ## Vencido e reivindicado de novo: restauração, não fraude
 *
 * A trava anti-fraude (um recibo, uma conta) vale DENTRO do prazo, e continua
 * inteira: linha viva de outra conta recusa. Depois de 5 anos de silêncio
 * absoluto, porém, NENHUMA conta exerceu aquele recibo — e o caminho do KV já
 * se comporta exatamente assim há tempo (a chave `ord:` expira e some, e o
 * recibo volta a ser reivindicável). Divergir aqui seria criar a segunda
 * política. Além disso, quem reivindica ainda precisa de um recibo que a LOJA
 * valide e vincule à conta na origem (`obfuscatedExternalAccountId` na Play,
 * session ticket na Steam — ver `_billing.js`), que é a defesa REAL: recibo
 * alheio não vale em conta nenhuma, vencido ou não. Quem volta depois do prazo
 * é, na prática, o comprador voltando.
 *
 * ## Linha legada (`expires_at` NULL) não é vítima disto
 *
 * A tabela existiu antes da coluna. Num banco onde o backfill da migração não
 * rodou, `expires_at` é NULL — e NULL é prazo DESCONHECIDO, não prazo vencido.
 * Como apagar é irreversível, o desempate é a favor de manter: a linha continua
 * travando, e ganha prazo na primeira renovação do próprio dono.
 *
 * @returns {Promise<{ ok: true } | { ok: false, reason: 'order-in-use' }>}
 */
async function claimOrderAtomic(env, saveId, orderId) {
  const agora = Date.now();
  const vence = agora + RETENTION_TTL_SECONDS * 1000;

  // Limpeza na leitura, ANTES da disputa. `expires_at IS NOT NULL` protege a
  // linha legada; `<=` faz o vencimento valer no instante em que chega.
  await env.DB
    .prepare('DELETE FROM order_claims WHERE order_id = ? AND expires_at IS NOT NULL AND expires_at <= ?')
    .bind(orderId, agora)
    .run();

  try {
    await env.DB
      .prepare('INSERT INTO order_claims (order_id, save_id, claimed_at, expires_at) VALUES (?, ?, ?, ?)')
      .bind(orderId, saveId, agora, vence)
      .run();
    return { ok: true };
  } catch {
    // Violou a PRIMARY KEY: alguém já reivindicou, e a linha não estava vencida
    // (se estivesse, o DELETE acima teria aberto caminho). Quem?
    const row = await env.DB
      .prepare('SELECT save_id FROM order_claims WHERE order_id = ?')
      .bind(orderId)
      .first();
    if (row?.save_id !== saveId) return { ok: false, reason: 'order-in-use' };

    // Mesmo dono: renova o prazo e só ele.
    await env.DB
      .prepare('UPDATE order_claims SET expires_at = ? WHERE order_id = ?')
      .bind(vence, orderId)
      .run();
    return { ok: true };
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
