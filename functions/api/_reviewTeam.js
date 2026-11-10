// "Revisar meu Soulmon" -> ESCALADA PARA PESSOAS (dono, 10/11/2026). O 1º pedido do dia por forma roda a IA; se ela disse `sem-problema`, o 2º e o 3º
// pedidos da MESMA forma no dia NAO rodam a IA de novo: vao por e-mail para a equipe (mesmo mecanismo do `feedback.js`: Resend + `FEEDBACK_TO`,
// padrao soulmon.revisor@gmail.com) e entram na fila /gm/reviews como `aguardando-equipe`. Sem `RESEND_API_KEY` (ou envio falho) a mensagem fica
// guardada na KV (`review-team:<dia>:<reportId>`, TTL 30 dias), como o feedback faz. Nada aqui lanca.
import { kv, kvOrThrow } from './_kv.js';
import { FEEDBACK_TO_DEFAULT } from './feedback.js';

export const TEAM_PREFIX = 'review-team:';
export const TEAM_TTL_SECONDS = 30 * 24 * 60 * 60;
/** Teto diario de e-mails da fila de revisao (alem dele, so guarda na KV). */
export const TEAM_MAX_EMAILS_PER_DAY = 40;

/** Texto do e-mail (PURO, sem HTML). saveId resumido: nunca o e-mail do jogador. */
export function teamEmail(report, primeiro, origin, receivedAt) {
  const url = report.beforeKey ? `${origin}/api/sprite-image?k=${report.beforeKey}` : '(sem sprite)';
  const v = primeiro?.verdict;
  const ia = primeiro
    ? [
      `Resultado da IA no 1o pedido (${primeiro.id}): ${primeiro.status}`,
      v ? `  problema: ${v.problema} | acao: ${v.acao} | detalhe: ${v.detalhe}` : '  (sem veredito)',
      primeiro.buracos ? `  buracos internos medidos: ${(primeiro.buracos.holeFraction * 100).toFixed(1)}% (${primeiro.buracos.components} pedacos)` : '',
      `  avaliador v${primeiro.evalVersion ?? 1}${primeiro.model ? ` (${primeiro.model})` : ''}`,
    ].filter(Boolean).join('\n')
    : 'Resultado da IA: (indisponivel)';
  const subject = `[Soulmon Revisao] ${report.formId} (${report.stage ?? '?'})`.replace(/[\r\n]+/g, ' ');
  const text = [
    'Pedido de revisao de sprite enviado para a equipe (a IA ja tinha dito "sem problema" no 1o pedido do dia).',
    '',
    `Conta: ${String(report.saveId).slice(0, 8)}...`,
    `Forma: ${report.formId}`,
    `Estagio: ${report.stage ?? '?'}`,
    `Elemento: ${report.element ?? '?'}`,
    `Sprite atual: ${url}`,
    `Nota do jogador: ${report.note || '(sem nota)'}`,
    '',
    ia,
    '',
    `Pedido: ${report.id}`,
    `Recebido: ${receivedAt}`,
  ].join('\n');
  return { subject, text };
}

/**
 * Guarda na KV e tenta o e-mail. Nunca lanca.
 * @param {any} env @param {any} report @param {any} primeiro
 * @param {{ origin?: string, fetchImpl?: typeof fetch, now?: number, takeDaily?: ((env: any, scope: string, id: string, limit: number, now?: number) => Promise<boolean>) | null }} [opts]
 * @returns {Promise<'email'|'stored'|'failed'>}
 */
export async function notificarEquipe(env, report, primeiro, { origin = 'https://soulmon.invalid', fetchImpl = fetch, now = Date.now(), takeDaily = null } = {}) {
  const receivedAt = new Date(now).toISOString();
  const { subject, text } = teamEmail(report, primeiro, origin, receivedAt);
  try {
    if (!kv(env)) return 'failed';
    await kvOrThrow(env).put(`${TEAM_PREFIX}${receivedAt.slice(0, 10)}:${report.id}`, JSON.stringify({ subject, text, at: receivedAt, reportId: report.id, formId: report.formId }), { expirationTtl: TEAM_TTL_SECONDS });
  } catch { return 'failed'; }
  if (!env?.RESEND_API_KEY) return 'stored';
  try {
    if (takeDaily && !(await takeDaily(env, 'review-mail', 'global', TEAM_MAX_EMAILS_PER_DAY, now))) return 'stored';
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${String(env.RESEND_API_KEY).trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.FEEDBACK_FROM || 'Soulmon <onboarding@resend.dev>', to: [env.FEEDBACK_TO || FEEDBACK_TO_DEFAULT], subject, text }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? 'email' : 'stored';
  } catch { return 'stored'; }
}
