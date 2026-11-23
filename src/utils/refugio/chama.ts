/**
 * CHAMA (trataka) — o relógio da sessão e a regra do prêmio
 * (`docs/pesquisa/2026-11-04-jogo-cognitivo-e-chama.md`, Parte B).
 *
 * PURO: recebe o tempo decorrido e devolve a fase. Não mede a pessoa; a
 * contagem de "voltei" (toque duplo) é privada e nunca vira nota.
 *
 * Fases: chegada (20 s) → N ciclos de [olhar 60 s + olhos fechados 40 s]
 * → repouso com as mãos nos olhos (palming) → fecho (10 s).
 * N = quantos ciclos de 100 s cabem na duração escolhida; a sobra vai para o
 * repouso, para a sessão bater exatamente 3/5/10 min.
 */

export type ChamaFase = 'chegada' | 'olhar' | 'fechar' | 'repouso' | 'fecho';

export const CHAMA_DURACOES_MIN: readonly number[] = Object.freeze([3, 5, 10]);
export const CHAMA_DURACAO_PADRAO = 5;

export const CHEGADA_S = 20;
export const OLHAR_S = 60;
export const FECHAR_S = 40;
export const REPOUSO_MIN_S = 30;
export const FECHO_S = 10;

/** Bits fixos por sessão concluída, 1×/dia (mesmo modelo da Revisão). Nunca por "tempo sem distração". */
export const CHAMA_BITS = 5;

export interface ChamaSegmento { fase: ChamaFase; inicioMs: number; duracaoMs: number; ciclo: number }

export function ciclosPara(minutos: number): number {
  const total = Math.max(1, minutos) * 60;
  const livre = total - CHEGADA_S - REPOUSO_MIN_S - FECHO_S;
  return Math.max(1, Math.floor(livre / (OLHAR_S + FECHAR_S)));
}

/** O roteiro inteiro da sessão, em ordem. */
export function roteiro(minutos: number): ChamaSegmento[] {
  const total = Math.max(1, minutos) * 60;
  const n = ciclosPara(minutos);
  const repouso = Math.max(REPOUSO_MIN_S, total - CHEGADA_S - FECHO_S - n * (OLHAR_S + FECHAR_S));
  const out: ChamaSegmento[] = [];
  let t = 0;
  const push = (fase: ChamaFase, s: number, ciclo: number) => { out.push({ fase, inicioMs: t, duracaoMs: s * 1000, ciclo }); t += s * 1000; };
  push('chegada', CHEGADA_S, 0);
  for (let i = 1; i <= n; i++) { push('olhar', OLHAR_S, i); push('fechar', FECHAR_S, i); }
  push('repouso', repouso, 0);
  push('fecho', FECHO_S, 0);
  return out;
}

export function sessaoMs(minutos: number): number {
  const r = roteiro(minutos);
  const u = r[r.length - 1];
  return u.inicioMs + u.duracaoMs;
}

export interface ChamaMomento { fase: ChamaFase | 'fim'; indice: number; ciclo: number; progresso: number }

/** Em que ponto da sessão se está aos `decorridoMs`. */
export function faseEm(minutos: number, decorridoMs: number): ChamaMomento {
  const r = roteiro(minutos);
  const e = Math.max(0, Number.isFinite(decorridoMs) ? decorridoMs : 0);
  for (let i = 0; i < r.length; i++) {
    const s = r[i];
    if (e < s.inicioMs + s.duracaoMs) return { fase: s.fase, indice: i, ciclo: s.ciclo, progresso: (e - s.inicioMs) / s.duracaoMs };
  }
  return { fase: 'fim', indice: r.length, ciclo: 0, progresso: 1 };
}

/** A chama fica visível só nas fases de olhar (e, discreta, na chegada). Olhos fechados: tela quase preta. */
export function chamaVisivel(fase: ChamaFase | 'fim', olhosFechados: boolean): boolean {
  if (olhosFechados) return false;
  return fase === 'chegada' || fase === 'olhar';
}

/** Paga só se a sessão foi até o fim e ainda não pagou hoje. Sair antes não pune: só não paga. */
export function premioDevido(concluiu: boolean, ultimoDiaPago: string | null, hoje: string): number {
  if (!concluiu) return 0;
  return ultimoDiaPago === hoje ? 0 : CHAMA_BITS;
}

/** Chave do dia local `AAAA-MM-DD`. */
export function diaLocal(agora: number): string {
  const d = new Date(agora);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Texto das fases (PT/EN), do desenho da pesquisa. */
export function textoFase(fase: ChamaFase | 'fim', isPt: boolean, olhosFechados: boolean): string {
  switch (fase) {
    case 'chegada': return isPt ? 'Apoie o celular na altura dos olhos. Ombros soltos. Respire devagar.' : 'Rest the phone at eye level. Loosen your shoulders. Breathe slowly.';
    case 'olhar': return olhosFechados
      ? (isPt ? 'De olhos fechados, imagine uma chama pequena e quente à sua frente.' : 'With your eyes closed, picture a small warm flame in front of you.')
      : (isPt ? 'Olhe para a chama. Pisque quando precisar, sem esforço.' : 'Gaze at the flame. Blink whenever you need — no strain.');
    case 'fechar': return isPt ? 'Feche os olhos. Guarde a chama por dentro, entre as sobrancelhas.' : 'Close your eyes. Hold the flame inside, between your brows.';
    case 'repouso': return isPt ? 'Esfregue as mãos e cubra os olhos. Descanse.' : 'Rub your palms and cover your eyes. Rest.';
    case 'fecho': return isPt ? 'Abra os olhos devagar. Pronto.' : 'Open your eyes slowly. Done.';
    default: return isPt ? 'A chama do seu Soulmon ficou um pouco mais quente.' : "Your Soulmon's flame grew a little warmer.";
  }
}
