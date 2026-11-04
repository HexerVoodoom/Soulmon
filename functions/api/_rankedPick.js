// ---------------------------------------------------------------------------
// SORTEIO RANQUEADO do Torneio (guilda-lancamento PR1, 11/10/2026)
//
// TORNEIO = ranqueado: o jogador NÃO escolhe — o servidor sorteia os oponentes com base na
// faixa dele. ARENA = o jogador escolhe a própria luta (ver `DueloSheet`). Este módulo é o dono
// único do critério de aproximação do Torneio; `community.js` › `opponents` só o chama.
//
// A medida é `lifetimePoints` (monotônica, a MESMA que desenha a faixa — `tournamentTiers.ts`):
// perto da faixa de quem pede, nunca por "posição" absoluta. O número NÃO sai na resposta
// (o payload público de oponente não leva pontos) — posição/pontos alheios são a leitura de
// comparação tóxica que o `TournamentPage` proíbe.
// ---------------------------------------------------------------------------

/** Quantos candidatos mais próximos entram no sorteio (3 devolvidos entre eles). */
export const RANKED_WINDOW = 4;
export const RANKED_PICKS = 3;

/**
 * `pool`: `[{ score?: number, lifetime?: number, ...resto }]`. Devolve até `n` itens do pool, sorteados
 * dentre os `window` mais próximos de `me`. `score` = pontos da SEASON (a posição que a tela mostra, muda a
 * cada luta); `lifetime` só desempata. `me` aceita número (legado: compara `lifetime`) ou `{ score, lifetime }`.
 * Pura: o `rng` vem de fora (`() => [0,1)`).
 */
export function pickRankedOpponents(pool, me, rng, n = RANKED_PICKS, window = RANKED_WINDOW) {
  const fin = v => (Number.isFinite(v) ? v : 0);
  const legado = typeof me !== 'object' || me === null;
  const alvo = legado ? fin(me) : fin(me.score);
  const alvoLife = legado ? 0 : fin(me.lifetime);
  const tagged = pool.map(item => ({
    item,
    d: Math.abs((legado ? fin(item.lifetime) : fin(item.score)) - alvo),
    d2: legado ? 0 : Math.abs(fin(item.lifetime) - alvoLife),
    tie: rng(),
  }));
  tagged.sort((a, b) => a.d - b.d || a.d2 - b.d2 || a.tie - b.tie);
  const near = tagged.slice(0, Math.max(n, window)).map(t => t.item);
  for (let i = near.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [near[i], near[j]] = [near[j], near[i]];
  }
  return near.slice(0, n);
}
