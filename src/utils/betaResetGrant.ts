/**
 * 🔄 ZERADOR DE PONTOS — item consumível + concessão única do beta (31/10/2026, dono).
 *
 * Dono: "Dá para todo mundo um único item que reseta os 3 tipos pra zero. Isso é só agora, no beta,
 * pra quem já está jogando. Não precisa notificação, só coloca no inventário." (REGISTRO §209)
 *
 * - Usar o item zera Benevolência, Harmonia e Poder (`powerPoints`/`harmonyPoints`/`benevolencePoints`).
 *   NÃO mexe no elemento, na forma, na poção pendente nem em `attributesSinceLastEvolution` (log do estágio
 *   que vira `fichaJornada` na evolução — histórico, não pontuação).
 * - Concessão: no load (`hydrateSave`), UMA vez, gravando `grants[BETA_RESET_GRANT]` no save (que sobe para a nuvem).
 *   Critério de "já jogava": onboarding concluído (árvore do oráculo, personagem demo ou `bornAt`) E nascido antes de
 *   `BETA_RESET_CUTOFF` (save sem `bornAt` = anterior a 06/09/2026 = jogador antigo). Quem nasce depois recebe a
 *   flag SEM o item, para nunca receber depois.
 * - Só cliente: o servidor não valida `foodInventory`. A idempotência vem da flag no save em nuvem.
 */
export const RESET_POINTS_EMOJI = '🔄';
export const BETA_RESET_GRANT = 'resetBHP_beta_2026_10';
/** Nascidos (dia do jogador) a partir desta data são jogadores novos — não recebem. */
export const BETA_RESET_CUTOFF = new Date('2026-11-01T00:00:00');

export type Grants = Record<string, true>;

/** Leitura tolerante: só chaves com `true` literal sobrevivem; ausente/lixo = undefined. */
export function sanitizeGrants(v: unknown): Grants | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out: Grants = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) if (val === true && k.length <= 64) out[k] = true;
  return Object.keys(out).length ? out : undefined;
}

interface GrantState {
  grants?: Grants;
  foodInventory: Record<string, number>;
  bornAt?: string;
  soulmonStages?: unknown;
  demoCharacterId?: string;
}

function onboarded(s: GrantState): boolean {
  return (Array.isArray(s.soulmonStages) && s.soulmonStages.length > 0)
    || (typeof s.demoCharacterId === 'string' && s.demoCharacterId.length > 0)
    || (typeof s.bornAt === 'string' && s.bornAt.length > 0);
}

function bornBeforeCutoff(bornAt: string | undefined): boolean {
  if (!bornAt) return true; // sem bornAt = save anterior a 06/09/2026
  const t = new Date(bornAt).getTime();
  return Number.isFinite(t) ? t < BETA_RESET_CUTOFF.getTime() : true;
}

/** Idempotente. Onboarding não concluído = nada (nem flag): decide-se quando ele terminar. */
export function applyBetaResetGrant<T extends GrantState>(s: T): T {
  if (s.grants?.[BETA_RESET_GRANT]) return s;
  if (!onboarded(s)) return s;
  const grants = { ...(s.grants ?? {}), [BETA_RESET_GRANT]: true as const };
  if (!bornBeforeCutoff(s.bornAt)) return { ...s, grants };
  const inv = s.foodInventory ?? {};
  return { ...s, grants, foodInventory: { ...inv, [RESET_POINTS_EMOJI]: (inv[RESET_POINTS_EMOJI] ?? 0) + 1 } };
}

/** O efeito do item: os 3 pontos voltam a zero. */
export function resetAlignmentPoints<T extends { powerPoints: number; harmonyPoints: number; benevolencePoints: number }>(s: T): T {
  return { ...s, powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0 };
}

/** §209 — a linha do recap da evolução (e da Ajuda): a evolução zera os 3 pontos. */
export const POINTS_RESET_LINE = {
  pt: 'Os pontos de Benevolência, Harmonia e Poder recomeçam do zero para a próxima forma.',
  en: 'Benevolence, Harmony and Power points start again from zero for the next form.',
} as const;
export function pointsResetLine(language: string): string {
  return language === 'pt-BR' ? POINTS_RESET_LINE.pt : POINTS_RESET_LINE.en;
}
