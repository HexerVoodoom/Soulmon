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
  namePt: string;
  nameEn: string;
  /**
   * Faixas de PONTOS: mínimo de pontos lifetime para entrar. Faixas de POSIÇÃO (Mestre, Grão-Mestre):
   * o mínimo lifetime para ser ELEGÍVEL ao lugar (`SEAT_MIN_LIFETIME`) — sozinho não promove ninguém.
   */
  min: number;
  /** Só nas faixas de POSIÇÃO: o último lugar da season que ainda a ocupa (Mestre 100, Grão-Mestre 20). */
  maxPlace?: number;
}

/**
 * As faixas de PONTOS (lifetime — só sobem): Madeira 0, Bronze 100, Prata 300, Ouro 700, Platina 1100,
 * Diamante 1500 (decisão do dono, 04/10/2026). Mestre e Grão-Mestre NÃO são faixas de pontos: ver
 * `TOURNAMENT_SEATS`. A regra destas seis não mudou: é função só dos pontos do próprio jogador.
 */
export const TOURNAMENT_TIERS: readonly TournamentTier[] = [
  { id: 'madeira', namePt: 'Madeira', nameEn: 'Wood', min: 0 },
  { id: 'bronze', namePt: 'Bronze', nameEn: 'Bronze', min: 100 },
  { id: 'prata', namePt: 'Prata', nameEn: 'Silver', min: 300 },
  { id: 'ouro', namePt: 'Ouro', nameEn: 'Gold', min: 700 },
  { id: 'platina', namePt: 'Platina', nameEn: 'Platinum', min: 1100 },
  { id: 'diamante', namePt: 'Diamante', nameEn: 'Diamond', min: 1500 },
] as const;

/** Lifetime mínimo para disputar um lugar de Mestre/Grão-Mestre: a faixa Diamante já alcançada. */
export const SEAT_MIN_LIFETIME = 1500;

/**
 * Os dois LUGARES de topo (R8, 04/10/2026, decisão do dono): **Mestre = top 100** e **Grão-Mestre
 * (Grandmaster) = top 20** do ranking da season. O ícone dos dois mostra "#N" — a posição; no
 * Grão-Mestre o #N indica o nível. Diferente das outras faixas, um LUGAR é da season e é VIVO: quem sai
 * do top volta à faixa de pontos que já tem (nunca abaixo dela), e o lugar volta a quem subir de novo.
 * A ordem do array é a ordem de prestígio (o último é o mais alto).
 */
export const TOURNAMENT_SEATS: readonly TournamentTier[] = [
  { id: 'mestre', namePt: 'Mestre', nameEn: 'Master', min: SEAT_MIN_LIFETIME, maxPlace: 100 },
  { id: 'grao-mestre', namePt: 'Grão-Mestre', nameEn: 'Grandmaster', min: SEAT_MIN_LIFETIME, maxPlace: 20 },
] as const;

/** A escada inteira, da Madeira ao Grão-Mestre — o que a folha das faixas desenha. */
export const TOURNAMENT_LADDER: readonly TournamentTier[] = [...TOURNAMENT_TIERS, ...TOURNAMENT_SEATS];

export interface TierStanding {
  tier: TournamentTier;
  /** Próxima faixa de PONTOS, ou `null` se já está na última (Diamante ou um lugar de topo). */
  next: TournamentTier | null;
  /** Pontos que faltam para a próxima faixa (0 na última). */
  pointsToNext: number;
  /** Progresso dentro da faixa atual, de 0 a 1 (1 na última). */
  progress: number;
  /** `true` quando a faixa é um LUGAR de topo (Mestre/Grão-Mestre), ocupado agora pela posição. */
  seat: boolean;
  /** A posição na season que o ícone mostra como "#N" — só quando `seat`; senão `null`. */
  place: number | null;
}

/** Posição válida (inteiro ≥ 1) ou `null`. */
function validPlace(place: unknown): number | null {
  return typeof place === 'number' && Number.isInteger(place) && place >= 1 ? place : null;
}

/**
 * A posição do jogador na season: a do servidor (`myPlace`, real e completa) ou, em servidor antigo,
 * a derivada da lista pública (só os 50 primeiros — serve ao Grão-Mestre, não ao Mestre inteiro).
 */
export function resolveSeasonPlace(serverPlace: unknown, rankIndex: number): number | null {
  return validPlace(serverPlace) ?? (rankIndex >= 0 ? rankIndex + 1 : null);
}

/**
 * Faixa de um jogador a partir dos pontos lifetime e, opcionalmente, da posição na season. Pontos
 * negativos ou inválidos caem na primeira faixa — nunca lança, porque isto alimenta UI. Sem `place`
 * (ou com lifetime abaixo de `SEAT_MIN_LIFETIME`) o resultado é o de sempre: só sobe.
 */
export function getTierStanding(points: number, place?: number | null): TierStanding {
  const p = Number.isFinite(points) ? Math.max(0, points) : 0;

  const pl = validPlace(place);
  if (pl !== null && p >= SEAT_MIN_LIFETIME) {
    // do lugar mais alto para o mais baixo
    for (let i = TOURNAMENT_SEATS.length - 1; i >= 0; i--) {
      const seat = TOURNAMENT_SEATS[i];
      if (pl <= (seat.maxPlace ?? 0)) {
        return { tier: seat, next: null, pointsToNext: 0, progress: 1, seat: true, place: pl };
      }
    }
  }

  let index = 0;
  for (let i = TOURNAMENT_TIERS.length - 1; i >= 0; i--) {
    if (p >= TOURNAMENT_TIERS[i].min) { index = i; break; }
  }

  const tier = TOURNAMENT_TIERS[index];
  const next = TOURNAMENT_TIERS[index + 1] ?? null;
  if (!next) return { tier, next: null, pointsToNext: 0, progress: 1, seat: false, place: null };

  const span = next.min - tier.min;
  return {
    tier,
    next,
    pointsToNext: next.min - p,
    progress: span > 0 ? Math.min(1, (p - tier.min) / span) : 1,
    seat: false,
    place: null,
  };
}
