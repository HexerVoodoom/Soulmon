// ---------------------------------------------------------------------------
// TETO DE REQUISIÇÃO POR IP — motivo é CUSTO, não segurança.
//
// `/api/community?action=players` faz até 300 `list` + 300 `get` de KV por
// chamada, e `/api/subscribe` grava sem teto. Sem limite, quem define a nossa
// conta de KV é um estranho com um `for` de shell (objeção O-8 do skeptic:
// "unit economics definida por um estranho").
//
// COMO ISTO FUNCIONA, e o que ele NÃO é:
//
//   - O contador vive na MEMÓRIA DO ISOLATE (um `Map`), não em KV. Um contador
//     em KV custaria uma escrita por requisição — multiplicaria exatamente o
//     problema que estamos tentando resolver (e KV é eventualmente consistente,
//     então nem contaria direito).
//   - A Cloudflare roda N isolates em M colos. O teto real é, no pior caso,
//     `limit × (isolates vivos)`. Isso derruba a ordem de grandeza de um abuso
//     de uma máquina só — que é o cenário de custo — e **não** para um
//     distribuído.
//   - Portanto isto é um AMORTECEDOR DE CUSTO, não um controle de segurança.
//     Não conte com ele para nada que dependa de exatidão. O controle exato
//     precisa de Durable Object ou do binding de Rate Limiting, nenhum dos dois
//     provisionado neste projeto hoje (ver o relatório da rodada).
//
// O IP vem de `CF-Connecting-IP`, que a Cloudflare **reescreve** na borda: não
// é um header que o cliente consiga forjar por trás do proxy. Sem ele
// (execução local/teste), a requisição passa — falhar fechado aqui derrubaria o
// app inteiro por um header ausente, e o risco tratado é conta, não invasão.
// ---------------------------------------------------------------------------

/** Um balde por (bucket, chave). Limpo por varredura preguiçosa. */
const buckets = new Map();

/** Teto de chaves distintas guardadas. Impede que o próprio limitador vire o
 *  vazamento de memória: um atacante com IPs rotativos encheria o Map. */
const MAX_TRACKED = 5000;

export function clientKey(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    null
  );
}

/**
 * Consome um token da janela deslizante.
 *
 * @returns {{ ok: boolean, remaining: number, retryAfter: number }}
 */
export function takeToken(bucket, key, { limit, windowMs }, now = Date.now()) {
  if (!key) return { ok: true, remaining: limit, retryAfter: 0 };

  const id = `${bucket}|${key}`;
  let hits = buckets.get(id);
  if (!hits) {
    if (buckets.size >= MAX_TRACKED) sweep(now, windowMs);
    if (buckets.size >= MAX_TRACKED) return { ok: true, remaining: limit, retryAfter: 0 };
    hits = [];
    buckets.set(id, hits);
  }

  const cutoff = now - windowMs;
  while (hits.length && hits[0] <= cutoff) hits.shift();

  if (hits.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
    return { ok: false, remaining: 0, retryAfter };
  }
  hits.push(now);
  return { ok: true, remaining: limit - hits.length, retryAfter: 0 };
}

/** Descarta baldes cujas marcas já saíram da janela. */
function sweep(now, windowMs) {
  const cutoff = now - windowMs;
  for (const [id, hits] of buckets) {
    while (hits.length && hits[0] <= cutoff) hits.shift();
    if (hits.length === 0) buckets.delete(id);
  }
}

/**
 * Resposta 429 padrão. Sempre com `Retry-After` — 429 sem ele é um cliente que
 * vai tentar de novo imediatamente e dobrar o custo que estamos cortando.
 */
export function tooManyRequests(retryAfter, cors = {}) {
  return new Response(JSON.stringify({ error: 'rate limited', retryAfter }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
      ...cors,
    },
  });
}

/** Só para teste — o `Map` é global por isolate de propósito. */
export function resetRateLimits() {
  buckets.clear();
}
