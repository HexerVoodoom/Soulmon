// ---------------------------------------------------------------------------
// O PRIMEIRO DIA (WP1.3) — três gestos, e depois some.
//
// O tutorial ensinava CONCEITO (uma página de texto) e obrigava a criar uma
// atividade. O que ele nunca ensinou foi o que se FAZ com a criatura: dar
// carinho, dar comida, marcar algo. Os três gestos existem no app desde
// sempre, nenhum deles é descobrível, e o carinho é a única forma de curar HP.
//
// Este módulo é PURO e guarda só o essencial: quais dos três já aconteceram e
// se o cartão ainda deve aparecer. A regra que importa está em `firstDayDone`:
//
//   **o cartão morre pelos DOIS lados** — pelos três gestos feitos OU pela
//   virada do dia. Um checklist que sobrevive ao primeiro dia deixa de ser
//   convite e vira lista de pendências, e este produto não cobra.
//
// Não há recompensa por completar. O prêmio é a criatura ter reagido — se
// houvesse item, o cartão viraria tarefa, e a primeira coisa que o app pediria
// no minuto zero seria dever.
// ---------------------------------------------------------------------------

export type FirstDayGesture = 'pet' | 'feed' | 'task';

export const FIRST_DAY_GESTURES: readonly FirstDayGesture[] = ['pet', 'feed', 'task'];

export interface FirstDayProgress {
  /** Dia do JOGADOR em que o cartão nasceu (`playerDayKey`). */
  day: string;
  done: FirstDayGesture[];
}

export function emptyFirstDay(day: string): FirstDayProgress {
  return { day, done: [] };
}

/** Higieniza o que veio do save/localStorage — gesto desconhecido não entra. */
export function normalizeFirstDay(raw: unknown): FirstDayProgress | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as { day?: unknown; done?: unknown };
  if (typeof o.day !== 'string' || !o.day) return null;
  const done = Array.isArray(o.done)
    ? o.done.filter((g): g is FirstDayGesture => FIRST_DAY_GESTURES.includes(g as FirstDayGesture))
    : [];
  return { day: o.day, done: [...new Set(done)] };
}

/** Marca um gesto. IDEMPOTENTE: repetir o mesmo gesto não muda nada, e a
 *  referência devolvida é a MESMA — o updater do React pode rodar 2×. */
export function markGesture(prev: FirstDayProgress, gesture: FirstDayGesture): FirstDayProgress {
  if (prev.done.includes(gesture)) return prev;
  return { ...prev, done: [...prev.done, gesture] };
}

export function allGesturesDone(p: FirstDayProgress): boolean {
  return FIRST_DAY_GESTURES.every(g => p.done.includes(g));
}

/**
 * O cartão ainda aparece?
 *
 * Não aparece quando os três gestos foram feitos (cumpriu) NEM quando o dia
 * virou (passou). O segundo caso é o que impede o convite de virar cobrança:
 * quem abriu o app no primeiro dia e não deu carinho encontra, no dia
 * seguinte, o app normal — não um checklist com dois itens em aberto
 * esperando por ele.
 */
export function shouldShowFirstDay(p: FirstDayProgress | null, today: string): boolean {
  if (!p) return false;
  if (p.day !== today) return false;
  return !allGesturesDone(p);
}
