/**
 * Flag de versão do besourinho de feedback/bug da Home (dono, 23/11/2026): VISÍVEL no beta,
 * escondido só na versão final. Padrão = visível. Para esconder no build final:
 * `VITE_HIDE_FEEDBACK_BUTTON=1`. Só afeta a renderização; não toca o save.
 */
export function isFeedbackButtonVisible(env: { VITE_HIDE_FEEDBACK_BUTTON?: unknown } | ImportMetaEnv = import.meta.env): boolean {
  const v = String((env as { VITE_HIDE_FEEDBACK_BUTTON?: unknown }).VITE_HIDE_FEEDBACK_BUTTON ?? '').trim().toLowerCase();
  return !(v === '1' || v === 'true');
}
