import { aiFetch } from './aiClient';

/**
 * Rookie grátis por e-mail (Onboarding Velado D6/D20): POST /api/free-rookie.
 * Devolve a imagem, ou `null` quando o servidor devolve fallback / falha (o chamador usa o inicial pronto).
 * Nunca lança.
 */
export async function pedirFreeRookie(prompt: string, promptFallback?: string, formId = 'rookie'): Promise<string | null> {
  try {
    const r = await aiFetch('/api/free-rookie', { formId, prompt, promptFallback });
    if (!r.ok) return null;
    const j = (await r.json().catch(() => null)) as { image?: unknown; fallback?: unknown } | null;
    return j && typeof j.image === 'string' && j.image ? j.image : null;
  } catch { return null; }
}
