/**
 * BETA FECHADO no cliente (release/beta-1, decisão do dono 11/10/2026). O
 * servidor (`functions/api/_betaAccess.js`) responde `403 { error: 'beta-closed' }`
 * a quem não está em `BETA_EMAILS` quando `BETA_CLOSED` está ligado. Aqui só se
 * GUARDA o veredito da sessão e se avisa quem desenha a tela (`BetaClosedGate`).
 * Nada é persistido: na próxima abertura o servidor decide de novo.
 */
import { useEffect, useState } from 'react';

let fechado = false;
const ouvintes = new Set<(v: boolean) => void>();

export function markBetaClosed(): void {
  if (fechado) return;
  fechado = true;
  for (const f of ouvintes) f(true);
}

export function isBetaClosedNow(): boolean { return fechado; }

/** Só para teste. */
export function _resetBetaClosed(): void { fechado = false; for (const f of ouvintes) f(false); }

/** Lê uma resposta da API: 403 com `error: 'beta-closed'` marca a sessão. Nunca lança. */
export async function detectBetaClosed(res: Response): Promise<boolean> {
  if (res.status !== 403) return false;
  try {
    const corpo = await res.clone().json() as { error?: unknown; reason?: unknown } | null;
    if (corpo?.error === 'beta-closed' || corpo?.reason === 'beta-closed') { markBetaClosed(); return true; }
  } catch { /* corpo não-JSON */ }
  return false;
}

export function useBetaClosed(): boolean {
  const [v, setV] = useState(fechado);
  useEffect(() => { ouvintes.add(setV); setV(fechado); return () => { ouvintes.delete(setV); }; }, []);
  return v;
}

/**
 * "Trocar de conta" na tela do beta fechado (gate adversarial C1): a pessoa
 * entrou com um e-mail que não está na lista (outro Gmail, digitado diferente).
 * Guarda uma CÓPIA do que houver no aparelho (mesmo lugar do suporte que
 * `reagirContaExcluida` usa), limpa o estado local da conta, encerra a sessão e
 * recarrega (tudo em `utils/sessionReset.ts`) — o login volta a aparecer. Nunca grava nada no servidor.
 */
export async function trocarContaBetaFechado(recarregar?: () => void): Promise<void> {
  // Dono único do fim de sessão: cópia local, push, signOut, limpeza completa e reload.
  const { encerrarSessao } = await import('./sessionReset');
  await encerrarSessao({ motivo: 'beta-closed', copiaDeSeguranca: true, recarregar });
}
