import { authHeaders } from './auth';
import { APP_VERSION, BUILD_ID } from '../components/FeedbackLink';
import type { Language } from './i18n';

/**
 * Cliente de `POST /api/feedback` (dono, 04/11/2026). Só o tipo, o texto e o
 * diagnóstico NÃO pessoal (versão, build, plataforma, idioma) viajam. O
 * `Authorization`, quando há login, serve só ao limite por conta no servidor.
 */
export type FeedbackType = 'feedback' | 'suggestion' | 'bug';
export const FEEDBACK_TYPES: FeedbackType[] = ['feedback', 'suggestion', 'bug'];
export const FEEDBACK_MAX = 2000;

export type FeedbackResult =
  | { ok: true; delivered: 'email' | 'stored' }
  | { ok: false; reason: 'invalid' | 'rate' | 'server' | 'network'; retryAfter?: number };

function platform(): 'apk' | 'web' {
  try {
    const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    return cap?.isNativePlatform?.() ? 'apk' : 'web';
  } catch { return 'web'; }
}

export function buildFeedbackPayload(type: FeedbackType, message: string, language: Language) {
  return {
    type,
    message: message.trim(),
    ver: APP_VERSION,
    build: BUILD_ID,
    plat: platform(),
    lang: language === 'pt-BR' ? 'pt-BR' : 'en',
  };
}

export async function sendFeedback(
  type: FeedbackType, message: string, language: Language, fetchImpl: typeof fetch = fetch,
): Promise<FeedbackResult> {
  try {
    let auth: Record<string, string> = {};
    try { auth = await authHeaders(); } catch { /* sem login: segue anônimo */ }
    const res = await fetchImpl('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify(buildFeedbackPayload(type, message, language)),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: true, delivered: data?.delivered === 'email' ? 'email' : 'stored' };
    }
    if (res.status === 429) return { ok: false, reason: 'rate', retryAfter: Number(res.headers.get('Retry-After')) || undefined };
    if (res.status === 400) return { ok: false, reason: 'invalid' };
    return { ok: false, reason: 'server' };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
