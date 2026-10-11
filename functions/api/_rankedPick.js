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
export const RANKED_WINDOW = 6;
export const RANKED_PICKS = 3;

/**
 * `pool`: `[{ lifetime?: number, ...resto }]`. Devolve até `n` itens do pool, sorteados dentre os
 * `window` mais próximos de `myPoints`. Pura: o `rng` vem de fora (`() => [0,1)`).
 */
export function pickRankedOpponents(pool, myPoints, rng, n = RANKED_PICKS, window = RANKED_WINDOW) {
  const me = Number.isFinite(myPoints) ? myPoints : 0;
  const tagged = pool.map(item => ({
    item,
    d: Math.abs((Number.isFinite(item.lifetime) ? item.lifetime : 0) - me),
    tie: rng(),
  }));
  tagged.sort((a, b) => a.d - b.d || a.tie - b.tie);
  const near = tagged.slice(0, Math.max(n, window)).map(t => t.item);
  for (let i = near.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [near[i], near[j]] = [near[j], near[i]];
  }
  return near.slice(0, n);
}
