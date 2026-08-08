// ---------------------------------------------------------------------------
// FAIXAS DO TORNEIO
//
// Por que existem: em ambientes só-de-leaderboard, os estudos levantados no
// benchmark encontraram ~31% de participantes relatando efeito psicológico
// negativo da comparação de ranking, e ~44% fazendo comparação "pra cima" com
// quem está acima — o que amplifica sensação de inadequação e mina justamente
// o "pertencimento" que deveria ser o ganho do social.
//
// A resposta não é tirar o ranking: é deixar de fazer da POSIÇÃO ABSOLUTA a
// medida do jogador. A faixa é uma medida do progresso dele contra ele mesmo —
// sobe com o que ele acumulou, nunca desce porque outra pessoa jogou mais.
//
// Nada aqui dá vantagem de jogo: faixa é leitura, não poder. Os Emblemas
// continuam comprando só cosmético (regra travada por teste em currencies).
// ---------------------------------------------------------------------------

export interface TournamentTier {
  id: string;
  emoji: string;
  namePt: string;
  nameEn: string;
  /** Pontos mínimos para entrar nesta faixa. */
  min: number;
}

export const TOURNAMENT_TIERS: readonly TournamentTier[] = [
  { id: 'semente', emoji: '🌱', namePt: 'Semente', nameEn: 'Seedling', min: 0 },
  { id: 'broto', emoji: '🍀', namePt: 'Broto', nameEn: 'Sprout', min: 100 },
  { id: 'guardiao', emoji: '🛡️', namePt: 'Guardião', nameEn: 'Guardian', min: 300 },
  { id: 'anciao', emoji: '🌟', namePt: 'Ancião', nameEn: 'Elder', min: 700 },
  { id: 'lendario', emoji: '👑', namePt: 'Lendário', nameEn: 'Legend', min: 1500 },
] as const;

export interface TierStanding {
  tier: TournamentTier;
  /** Próxima faixa, ou `null` se já está na última. */
  next: TournamentTier | null;
  /** Pontos que faltam para a próxima faixa (0 na última). */
  pointsToNext: number;
  /** Progresso dentro da faixa atual, de 0 a 1 (1 na última). */
  progress: number;
}

/**
 * Faixa de um jogador a partir dos pontos. Pontos negativos ou inválidos caem
 * na primeira faixa — nunca lança, porque isto alimenta UI.
 */
export function getTierStanding(points: number): TierStanding {
  const p = Number.isFinite(points) ? Math.max(0, points) : 0;

  let index = 0;
  for (let i = TOURNAMENT_TIERS.length - 1; i >= 0; i--) {
    if (p >= TOURNAMENT_TIERS[i].min) { index = i; break; }
  }

  const tier = TOURNAMENT_TIERS[index];
  const next = TOURNAMENT_TIERS[index + 1] ?? null;
  if (!next) return { tier, next: null, pointsToNext: 0, progress: 1 };

  const span = next.min - tier.min;
  return {
    tier,
    next,
    pointsToNext: next.min - p,
    progress: span > 0 ? Math.min(1, (p - tier.min) / span) : 1,
  };
}
