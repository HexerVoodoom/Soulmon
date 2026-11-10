import { authHeaders } from './auth';
import { readLocal } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';

/**
 * Cliente do "Pedir revisao do meu Soulmon" (Ajuda): `functions/api/review-soulmon.js`. O jogador toca UMA vez; o servidor avalia o sprite
 * com o Claude e conserta sozinho (recorte ou regeracao no fundo da cor certa). Este modulo so fala com a rota do PROPRIO jogador (Bearer
 * do proprio save): nao ha rota de admin nem upload de imagem. O estado de cada pedido mora no SERVIDOR (por forma): sobrevive a fechar o app.
 */
export interface ReviewSnapshot {
  /** A chave de acervo da forma EQUIPADA (a alternativa equipada, se houver). */
  formId: string;
  /** URL atual do sprite dessa forma no acervo. */
  spriteUrl: string;
  soulmonId?: string | null;
  stage?: string | null;
  element?: string | null;
  /** Prompt que o app montaria para a forma: reserva do servidor para sprites antigos (sem prompt guardado). */
  prompt?: string | null;
}

export type ReviewStatus =
  | 'pendente' | 'pendente-sem-chave' | 'avaliando' | 'aguardando-regeneracao' | 'regenerando'
  | 'consertado' | 'sem-problema' | 'precisa-manual' | 'falhou' | 'limite-diario' | 'aguardando-equipe';

/** Motivo que o jogador escolhe ao pedir revisao (campo ADITIVO no POST: servidor antigo ignora, cliente antigo nao manda). */
export type ReviewMotivo = 'estilo' | 'recorte';

export interface ReviewReport {
  id: string; formId: string; status: ReviewStatus; createdAt: number; updatedAt?: number;
  afterUrl: string | null; applied: boolean; cooldownUntil?: number;
}

/**
 * Intervalo de checagem (decisao do dono, 10/11/2026): a cada 2 min nos primeiros 10 min (a avaliacao do Claude leva segundos a poucos
 * minutos; a regeneracao ate ~2 min), depois a cada 10 min ate 24 h. Um GET leve por checagem; nada com o app em segundo plano (so ao
 * voltar); aos 24 h o servidor marca `falhou` e o botao volta.
 */
export const REVIEW_POLL = Object.freeze({ fastMs: 2 * 60_000, fastUntilMs: 10 * 60_000, slowMs: 10 * 60_000, giveUpMs: 24 * 60 * 60_000 });

/** Quanto esperar para a proxima checagem de um pedido com `ageMs` de idade; `null` = desistiu (24 h). */
export function reviewPollDelay(ageMs: number): number | null {
  if (ageMs >= REVIEW_POLL.giveUpMs) return null;
  return ageMs < REVIEW_POLL.fastUntilMs ? REVIEW_POLL.fastMs : REVIEW_POLL.slowMs;
}

const ACTIVE: ReviewStatus[] = ['pendente', 'pendente-sem-chave', 'avaliando', 'aguardando-regeneracao', 'regenerando', 'limite-diario', 'aguardando-equipe'];
/** Pedido ainda sem resposta (o botao fica inativo e o texto diz "em revisao"). */
export function isActive(r: Pick<ReviewReport, 'status' | 'createdAt'> | null | undefined, now = Date.now()): boolean {
  return !!r && ACTIVE.includes(r.status) && now - r.createdAt < REVIEW_POLL.giveUpMs;
}

/** O sprite so pode ser revisado quando e o que o NOSSO servidor guardou (`/api/sprite-image?k=<32 hex>`). */
export function isReviewableSpriteUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try {
    const u = new URL(url, 'https://soulmon.invalid');
    return u.pathname === '/api/sprite-image' && /^[0-9a-f]{32}$/.test(u.searchParams.get('k') ?? '');
  } catch { return false; }
}

type Fetch = typeof fetch;
const saveId = () => readLocal(STORAGE_KEYS.SAVE_ID);

async function call(body: Record<string, unknown>, fetchImpl: Fetch): Promise<{ ok: boolean; status: number; error?: string; report?: ReviewReport }> {
  try {
    const res = await fetchImpl('/api/review-soulmon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ ...body, id: saveId() }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, error: data?.error, report: data?.report };
  } catch {
    return { ok: false, status: 0 };
  }
}

export function submitReview(snap: ReviewSnapshot, fetchImpl: Fetch = fetch, motivo?: ReviewMotivo) {
  return call({
    ...(motivo ? { motivo } : {}),
    formId: snap.formId, spriteUrl: snap.spriteUrl,
    ...(snap.soulmonId ? { soulmonId: snap.soulmonId } : {}),
    ...(snap.stage ? { stage: snap.stage } : {}),
    ...(snap.element ? { element: snap.element } : {}),
    ...(snap.prompt ? { prompt: snap.prompt } : {}),
  }, fetchImpl);
}
export const continueReview = (reportId: string, fetchImpl: Fetch = fetch) => call({ action: 'continue', reportId }, fetchImpl);
export const ackReview = (reportId: string, fetchImpl: Fetch = fetch) => call({ action: 'ack', reportId }, fetchImpl);

export async function fetchReviews(fetchImpl: Fetch = fetch): Promise<ReviewReport[] | null> {
  try {
    const res = await fetchImpl(`/api/review-soulmon?id=${encodeURIComponent(saveId() ?? '')}`, { headers: await authHeaders() });
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return Array.isArray(data?.reports) ? data.reports : null;
  } catch { return null; }
}

export interface ReviewCheck {
  /** Os reports como o servidor os tem (mais novo primeiro); `null` = nao deu para ler (nao muda nada na tela). */
  reports: ReviewReport[] | null;
  /** Os que acabaram de ser concluidos (ainda nao avisados): o app avisa UMA vez e eles foram confirmados com `ack`. */
  finished: ReviewReport[];
}

/**
 * UMA checagem: le os reports (1 GET), empurra o que esta parado no servidor (regeneracao longa, chave que chegou depois: `continue`) e,
 * para cada conclusao ainda nao avisada, aplica o conserto no app (so a forma dele) e confirma com `ack` (idempotente).
 */
export async function checkReviews(onApplyFix: (formId: string, url: string) => void, fetchImpl: Fetch = fetch, now = Date.now()): Promise<ReviewCheck> {
  const reports = await fetchReviews(fetchImpl);
  if (!reports) return { reports: null, finished: [] };
  const finished: ReviewReport[] = [];
  for (const r of reports) {
    if (isActive(r, now) && now - r.createdAt > 60_000) void continueReview(r.id, fetchImpl);
    const final = ['consertado', 'sem-problema', 'falhou', 'precisa-manual'].includes(r.status);
    if (final && !r.applied) {
      if (r.status === 'consertado' && r.afterUrl) onApplyFix(r.formId, r.afterUrl);
      finished.push(r);
      await ackReview(r.id, fetchImpl);
    }
  }
  return { reports, finished };
}
