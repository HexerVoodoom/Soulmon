/**
 * A MISSÃO DA GUILDA (guilda-lancamento PR3) — o antigo "circo" (a Feira) virou uma investigação:
 * acontece algo misterioso, o jogador MANDA o Solmon, ele some da Home enquanto "investiga" (tempo,
 * como o Passeio) e volta. Ao voltar, o servidor soma a rodada ao fenômeno da roda e rega a casa
 * (`guildRaidHit`: o servidor sorteia o valor — o cliente nunca manda pontos).
 *
 * Este módulo é a parte PURA e do aparelho: o relógio da ida (como o `STROLL_MIN_MINUTES`, é cerimônia
 * do cliente — a trava de verdade é 1 volta por dia do jogador no servidor, que dá 429), e quando o
 * pet fica fora da Home. Nunca cobra: se a volta não puder ser registrada (sem rede), o pet VOLTA PARA
 * CASA na Home do mesmo jeito — o registro é que espera.
 */

/** Quanto o Solmon passa fora, em minutos (a mesma ordem do Passeio). */
export const GUILD_MISSION_MINUTES = 30;

export interface GuildMissionState {
  /** DIA DO JOGADOR em que partiu (`playerDayKey`). */
  day: string;
  /** Quando volta (epoch ms). */
  returnAt: number;
}

export function startGuildMission(day: string, now: number): GuildMissionState {
  return { day, returnAt: now + GUILD_MISSION_MINUTES * 60_000 };
}

/** Lixo no save vira "sem missão". */
export function normalizeGuildMission(raw: unknown): GuildMissionState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const day = typeof r.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.day) ? r.day : null;
  const returnAt = typeof r.returnAt === 'number' && Number.isFinite(r.returnAt) && r.returnAt > 0 ? Math.floor(r.returnAt) : null;
  return day && returnAt ? { day, returnAt } : null;
}

/** O Solmon está FORA da Home agora? (só entre a ida e o horário de volta). */
export const isMissionAway = (m: GuildMissionState | null | undefined, now: number): boolean => !!m && now < m.returnAt;

/** Já deu a hora de voltar (e a volta ainda não foi registrada)? */
export const isMissionDue = (m: GuildMissionState | null | undefined, now: number): boolean => !!m && now >= m.returnAt;

/** Milissegundos até a volta (0 se já passou) — para o timer do App. */
export const msUntilReturn = (m: GuildMissionState | null | undefined, now: number): number => (m ? Math.max(0, m.returnAt - now) : 0);
