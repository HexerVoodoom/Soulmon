/**
 * 💠 FRAGMENTO DE ALMA — o NOME visível do gauge de evolução (decisão do dono,
 * 20/10/2026, REGISTRO §153). Dono único do VOCABULÁRIO; a regra continua em
 * `utils/evolutionGauge.ts`.
 *
 * O que NÃO mudou (e o teste `soulFragment.test.ts` trava):
 *  - o estado salvo é `evolutionPoints`, com o MESMO significado — 1 ponto do
 *    gauge antigo = 1 Fragmento de Alma, sem migração e sem perder nada;
 *  - o fragmento é ganho por ESFORÇO (tarefa 1–3, hábito `HABIT_WEIGHT`), com o
 *    mesmo teto diário e o crédito na virada: nunca "1 por ação" (recompensa por
 *    contagem de tarefas é linha vermelha);
 *  - nunca decresce por dia ruim; só é CONSUMIDO ao evoluir.
 *
 * Funções PURAS. Texto sem cobrança: só descreve o que já se juntou e o que a
 * evolução usou — nenhum "faltam N".
 */
import type { Language } from './i18n';

/** Campo do save que guarda os fragmentos juntos. NÃO renomear (compat. de save). */
export const SOUL_FRAGMENT_SAVE_FIELD = 'evolutionPoints' as const;

const isPt = (l: Language | string) => l === 'pt-BR';

/** "Fragmento de Alma" / "Soul Fragment" (singular quando n === 1). Capitalizado. */
export function soulFragmentName(n: number, language: Language | string): string {
  if (isPt(language)) return n === 1 ? 'Fragmento de Alma' : 'Fragmentos de Alma';
  return n === 1 ? 'Soul Fragment' : 'Soul Fragments';
}

/** Mesma palavra, em minúsculas — para o meio de uma frase. */
export function soulFragmentWord(n: number, language: Language | string): string {
  return soulFragmentName(n, language).toLowerCase();
}

/** "3 fragmentos de alma" / "1 soul fragment". */
export function soulFragmentCount(n: number, language: Language | string): string {
  const k = Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
  return `${k} ${soulFragmentWord(k, language)}`;
}

/** Rótulo da barra da evolução (pt/en). */
export function fragmentBarLabel(full: boolean, language: Language | string): string {
  if (full) return isPt(language) ? 'A próxima forma está pronta' : 'The next form is ready';
  return isPt(language) ? 'Fragmentos de Alma juntos' : 'Soul Fragments gathered';
}

/** "+3 de hoje entram amanhã" — a prévia (que ainda não foi creditada). */
export function fragmentTodayHint(today: number, language: Language | string): string {
  return isPt(language)
    ? ` · +${today} de hoje entram amanhã`
    : ` · +${today} from today join tomorrow`;
}

/** Como se ganha (texto de ajuda da página de Evolução). */
export function fragmentHowText(language: Language | string): string {
  return isPt(language)
    ? 'Cada hábito ou tarefa concluída rende Fragmentos de Alma (tarefas maiores rendem mais, até a meta do dia). Quando juntar o bastante, eles são usados e a próxima forma abre — e nada aqui volta para trás.'
    : 'Every habit or task you finish earns Soul Fragments (bigger tasks earn more, up to the day’s goal). When you have gathered enough, they are used and the next form opens — and nothing here ever goes back.';
}

/** Linha da cerimônia: o que a evolução consumiu (dita uma vez, no ato). */
export function fragmentsSpentLine(spent: number, language: Language | string): string {
  const k = Math.max(0, Math.floor(Number.isFinite(spent) ? spent : 0));
  if (k <= 0) return '';
  return isPt(language)
    ? `${soulFragmentCount(k, language)} deram forma a esta evolução.`
    : `${soulFragmentCount(k, language)} gave shape to this evolution.`;
}

/** Linha durante o ritual (antes de terminar). */
export function fragmentsGatherLine(language: Language | string): string {
  return isPt(language) ? 'Seus Fragmentos de Alma se reúnem…' : 'Your Soul Fragments come together…';
}

/** A frase da página de Evolução: descreve o que JÁ se juntou — nunca o que falta. */
export function fragmentsGatheredLine(gathered: number, language: Language | string): string {
  const k = Math.max(0, Math.floor(Number.isFinite(gathered) ? gathered : 0));
  if (k <= 0) {
    return isPt(language)
      ? 'Cada tarefa ou hábito concluído começa a juntar Fragmentos de Alma.'
      : 'Every task or habit you finish starts gathering Soul Fragments.';
  }
  return isPt(language)
    ? `Você já juntou ${soulFragmentCount(k, language)} a caminho da próxima forma.`
    : `You have gathered ${soulFragmentCount(k, language)} on the way to the next form.`;
}
