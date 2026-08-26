// ---------------------------------------------------------------------------
// CHECK-IN DE HUMOR
//
// O elemento de menor custo e maior retorno emocional de todo o benchmark: o
// Finch pergunta como a pessoa está e devolve isso em forma de acompanhamento,
// e é o motivo mais citado de as pessoas dizerem que o app "se importa".
//
// TRÊS REGRAS QUE NÃO PODEM SER QUEBRADAS:
//
// 1. É OPCIONAL. Nunca bloqueia nada, nunca é cobrado, nunca gera lembrete.
// 2. NUNCA ALIMENTA PONTUAÇÃO. Humor não entra em dia perfeito, HP, evolução
//    nem em nada que o jogador possa "otimizar". No instante em que virar
//    insumo de score, a pessoa passa a responder o que dá mais ponto em vez do
//    que sente — e aí o dado deixa de existir, junto com o cuidado.
// 3. O APP DEVOLVE ALGO. Coletar humor e não devolver nada é pior do que não
//    perguntar: vira extração. Por isso existe o resumo dos últimos dias.
//
// Onde entra: dentro do relatório diário, que já aparece uma vez por dia. Não
// custa uma abertura a mais do app (ver a auditoria de carga em
// docs/PLANO-EVOLUCAO.md).
// ---------------------------------------------------------------------------

export type MoodValue = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  /**
   * Chave do DIA DO JOGADOR (`utils/playerDay.ts`), na forma de
   * `toDateString()`.
   *
   * ⚠️ Já foi `new Date().toDateString()` — o dia do APARELHO — e `moodLog`
   * mora no SAVE. Com dois aparelhos em fusos diferentes, o mesmo dia rendia
   * DUAS entradas de humor (uma por nome de dia), e a de baixo era a que o
   * `recordMood` deixava de substituir: o "responder de novo SUBSTITUI" logo
   * abaixo virava "acumula", e a média de `moodSummary` passava a ser puxada
   * por um dia contado duas vezes. Num registro que a regra 2 deste arquivo
   * proíbe de virar score, o único valor é a fidelidade — e ela era o que se
   * perdia.
   *
   * Este módulo continua sem olhar relógio: a chave vem SEMPRE por parâmetro,
   * de quem tem acesso à âncora do save.
   */
  date: string;
  mood: MoodValue;
}

export interface MoodOption {
  value: MoodValue;
  emoji: string;
  labelPt: string;
  labelEn: string;
}

export const MOOD_OPTIONS: readonly MoodOption[] = [
  { value: 1, emoji: '😔', labelPt: 'Difícil', labelEn: 'Rough' },
  { value: 2, emoji: '😕', labelPt: 'Meio pra baixo', labelEn: 'Low' },
  { value: 3, emoji: '😐', labelPt: 'Normal', labelEn: 'Okay' },
  { value: 4, emoji: '🙂', labelPt: 'Bem', labelEn: 'Good' },
  { value: 5, emoji: '😄', labelPt: 'Ótimo', labelEn: 'Great' },
] as const;

/** Quantos dias o histórico guarda. Registro de acompanhamento, não arquivo. */
export const MOOD_LOG_CAP = 30;

export function getMoodOption(value: MoodValue): MoodOption {
  return MOOD_OPTIONS.find(m => m.value === value) ?? MOOD_OPTIONS[2];
}

/**
 * Registra o humor do dia. Responder de novo no mesmo dia SUBSTITUI — humor
 * muda, e a pessoa tem direito de corrigir sem que o app guarde as duas coisas.
 */
export function recordMood(log: MoodEntry[] | undefined, date: string, mood: MoodValue): MoodEntry[] {
  const rest = (log ?? []).filter(e => e.date !== date);
  return [...rest, { date, mood }].slice(-MOOD_LOG_CAP);
}

export function moodFor(log: MoodEntry[] | undefined, date: string): MoodValue | null {
  return (log ?? []).find(e => e.date === date)?.mood ?? null;
}

/** As últimas N entradas, da mais antiga para a mais recente. */
export function recentMoods(log: MoodEntry[] | undefined, days = 7): MoodEntry[] {
  return (log ?? []).slice(-days);
}

/**
 * Uma leitura curta dos últimos dias, para o app devolver algo em vez de só
 * coletar. Devolve `null` com menos de 3 registros — três pontos é o mínimo
 * para dizer qualquer coisa sem inventar padrão.
 *
 * Importante: nenhuma das leituras julga. "Semana pesada" reconhece, não cobra.
 */
export function moodSummary(
  log: MoodEntry[] | undefined,
  language: 'pt-BR' | 'en-US',
): string | null {
  const recent = recentMoods(log, 7);
  if (recent.length < 3) return null;

  const avg = recent.reduce((sum, e) => sum + e.mood, 0) / recent.length;
  const isPt = language === 'pt-BR';

  if (avg <= 2) {
    return isPt
      ? 'Seus últimos dias têm sido pesados. Seu Soulmon está aqui, e não precisa de nada de você hoje.'
      : 'Your last few days have been heavy. Your Soulmon is here, and needs nothing from you today.';
  }
  if (avg >= 4) {
    return isPt
      ? 'Seus últimos dias têm sido bons. Vale reparar no que anda funcionando.'
      : 'Your last few days have been good. Worth noticing what’s been working.';
  }
  return isPt
    ? 'Seus últimos dias têm sido de altos e baixos — e tudo bem que seja assim.'
    : 'Your last few days have had ups and downs — and that’s allowed.';
}
