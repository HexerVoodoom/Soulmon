/**
 * Pedido de avaliação na Play depois de CADA evolução (decisão do dono, 09/11/2026): pergunta toda vez que o Soulmon
 * evolui de estágio, depois da cerimônia e do modal de atributos, e NUNCA mais depois que a pessoa aceitou avaliar.
 * "Agora não" só fecha — a próxima evolução pergunta de novo. Estado só no aparelho (localStorage).
 * Pura (sem DOM) para teste; a leitura/gravação fica em quem chama.
 */
export interface PlayReviewState { accepted?: true; lastAskedAt?: number }

export const PLAY_PACKAGE = 'com.soulmon';
/** Abaixo disto a "tela" do Google não apareceu (cota/ausência): cai no link da loja. */
export const REVIEW_MIN_VISIBLE_MS = 800;

export function parsePlayReview(raw: string | null | undefined): PlayReviewState {
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== 'object') return {};
    const r = o as Record<string, unknown>;
    return {
      ...(r.accepted === true ? { accepted: true as const } : {}),
      ...(typeof r.lastAskedAt === 'number' && Number.isFinite(r.lastAskedAt) ? { lastAskedAt: r.lastAskedAt } : {}),
    };
  } catch { return {}; }
}

/** Perguntar agora? Só em evolução de estágio PARA CIMA, e nunca para quem já aceitou. */
export function shouldAskReview(state: PlayReviewState, prevLevelIndex: number, nextLevelIndex: number): boolean {
  if (state.accepted) return false;
  return nextLevelIndex > prevLevelIndex && prevLevelIndex >= 0;
}

export const markAsked = (s: PlayReviewState, now: number): PlayReviewState => ({ ...s, lastAskedAt: now });
export const markAccepted = (s: PlayReviewState, now: number): PlayReviewState => ({ ...s, accepted: true, lastAskedAt: now });

export const storeUrl = (): string => `market://details?id=${PLAY_PACKAGE}`;
