// ---------------------------------------------------------------------------
// PADRÃO DE CUIDADO
//
// A ideia vem direto do v-pet de 1997: lá, os "care mistakes" não eram uma
// punição — eram um SELETOR. Zero erros levava a Agumon; três levavam a
// Betamon. Nenhum dos dois é melhor que o outro; o aparelho estava dizendo
// *o jeito como você cuidou define quem seu bicho vira*. É um retrato, não uma
// nota de prova.
//
// Aqui a mesma ideia entra sem inventar formas novas na árvore: o padrão de
// cuidado é o CRITÉRIO DE DESEMPATE do galho de evolução. Antes o empate entre
// atributos era resolvido por uma ordem arbitrária no código (poder, depois
// benevolência, depois harmonia); agora ele é resolvido por algo que diz respeito ao
// jogador.
//
// Nenhum padrão é melhor que outro, e nenhum deles muda força, HP ou
// velocidade — só o RUMO, e só quando os atributos não decidem sozinhos.
//
// Limitação conhecida: a leitura usa o histórico de tarefas concluídas
// (`completedTasks`), que é o único registro com data no save. Atividades
// recorrentes guardam contagem, não datas, então não entram na conta. É sinal
// parcial, e é por isso que ele desempata em vez de decidir.
// ---------------------------------------------------------------------------

export type CarePatternId = 'constante' | 'explosivo' | 'equilibrado';

export interface CarePattern {
  id: CarePatternId;
  emoji: string;
  namePt: string;
  nameEn: string;
  descPt: string;
  descEn: string;
}

export const CARE_PATTERNS: Record<CarePatternId, CarePattern> = {
  constante: {
    id: 'constante',
    emoji: '🌿',
    namePt: 'Constante',
    nameEn: 'Steady',
    descPt: 'Você aparece quase todo dia, um pouco de cada vez.',
    descEn: 'You show up almost every day, a little at a time.',
  },
  explosivo: {
    id: 'explosivo',
    emoji: '🔥',
    namePt: 'Explosivo',
    nameEn: 'Burst',
    descPt: 'Você junta energia e resolve tudo de uma vez.',
    descEn: 'You gather energy and get it all done in one go.',
  },
  equilibrado: {
    id: 'equilibrado',
    emoji: '⚖️',
    namePt: 'Equilibrado',
    nameEn: 'Balanced',
    descPt: 'Você mistura os dois jeitos conforme a semana pede.',
    descEn: 'You mix both rhythms depending on the week.',
  },
};

export interface CareReading {
  pattern: CarePattern;
  /** Dias com pelo menos uma conclusão, dentro da janela. */
  activeDays: number;
  /** Conclusões no total, dentro da janela. */
  total: number;
  /** Fração das conclusões que caiu no dia mais cheio (0 a 1). */
  concentration: number;
  /** `false` quando há pouco histórico — a leitura é um chute e não deve mandar. */
  confident: boolean;
}

interface CompletedLike { completedAt: string }

/** Janela de leitura, em dias. Duas semanas pega ritmo sem virar arqueologia. */
export const CARE_WINDOW_DAYS = 14;
/** Abaixo disso a leitura não é confiável e não desempata nada. */
const MIN_TASKS_FOR_CONFIDENCE = 5;

export function computeCarePattern(
  completed: CompletedLike[] | undefined,
  now: Date = new Date(),
  windowDays: number = CARE_WINDOW_DAYS,
): CareReading {
  const cutoff = now.getTime() - windowDays * 86400000;
  const perDay = new Map<string, number>();
  let total = 0;

  for (const c of completed ?? []) {
    const t = new Date(c.completedAt).getTime();
    if (!Number.isFinite(t) || t < cutoff || t > now.getTime()) continue;
    const key = new Date(t).toDateString();
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
    total++;
  }

  const activeDays = perDay.size;
  const busiest = perDay.size ? Math.max(...perDay.values()) : 0;
  const concentration = total > 0 ? busiest / total : 0;
  const confident = total >= MIN_TASKS_FOR_CONFIDENCE;

  let id: CarePatternId = 'equilibrado';
  if (confident) {
    const spread = activeDays / windowDays;
    // Aparece na maior parte dos dias e não empilha tudo num só → constante.
    if (spread >= 0.5 && concentration <= 0.4) id = 'constante';
    // Concentra o esforço em poucos dias → explosivo.
    else if (concentration >= 0.5 || spread <= 0.25) id = 'explosivo';
  }

  return { pattern: CARE_PATTERNS[id], activeDays, total, concentration, confident };
}

/**
 * Histórico COMPLETO de cuidado de um save: tarefas avulsas (`completedTasks`)
 * **mais** atividades recorrentes (`activityLog`).
 *
 * Existe como função única porque a lista já foi montada em dois lugares e eles
 * divergiram: a página de Evolução previa o galho com o log de atividades e a
 * cerimônia decidia sem ele, então o app prometia um galho e entregava outro
 * para quem cumpre hábito por atividade recorrente — o mecanismo principal.
 * Footgun nº 9 (`CLAUDE.md`): regra copiada é regra que diverge em silêncio.
 */
export function careHistory(state: {
  completedTasks?: Array<{ completedAt: string }>;
  activityLog?: string[];
}): Array<{ completedAt: string }> {
  return [
    ...(state.completedTasks ?? []),
    ...(state.activityLog ?? []).map(completedAt => ({ completedAt })),
  ];
}

/** O galho que cada padrão puxa. Nenhum é mais forte — são rumos diferentes. */
export function patternBranch(id: CarePatternId): 'power' | 'harmony' | 'benevolence' {
  if (id === 'constante') return 'benevolence';
  if (id === 'explosivo') return 'power';
  return 'harmony';
}

export interface AttrPoints { power: number; harmony: number; benevolence: number }

/**
 * Escolhe o galho da próxima evolução.
 *
 * Os atributos (que vêm da comida, e portanto da CATEGORIA das tarefas)
 * continuam mandando. O padrão de cuidado entra só quando eles empatam — que
 * antes era resolvido por uma ordem fixa no código, sem significado nenhum.
 */
/**
 * Os galhos EMPATADOS no topo dos atributos — a lista que `resolveBranch` já
 * calculava internamente e descartava ao devolver um só.
 *
 * Existe porque a geração incremental de sprite precisa gerar TODOS os líderes
 * na véspera (`spec-geracao-incremental.md` §4): o galho de fato só é decidido
 * no toque da cerimônia, com o ritmo daquele momento, e gerar só o preferido
 * reintroduz o risco que a geração antecipada existe para eliminar. **Não é
 * critério novo** — é a mesma aritmética, exposta aqui, no dono da regra, para
 * não virar a segunda cópia (footgun 9 do `CLAUDE.md`).
 *
 * Devolve **lista vazia** quando ninguém pontuou (`max <= 0`): aí não há
 * disputa de atributo nenhuma, e quem responde é o ritmo/fallback de
 * `resolveBranch`.
 */
export function branchLeaders(points: AttrPoints): Array<'power' | 'harmony' | 'benevolence'> {
  const safe = safeAttrPoints(points);
  const max = Math.max(safe.power, safe.harmony, safe.benevolence);
  if (max <= 0) return [];
  return (['power', 'harmony', 'benevolence'] as const).filter(k => safe[k] === max);
}

/** Ponto não-finito vira 0 — ver o comentário dentro de `resolveBranch`. */
function safeAttrPoints(points: AttrPoints): AttrPoints {
  return {
    power: Number.isFinite(points?.power) ? points.power : 0,
    harmony: Number.isFinite(points?.harmony) ? points.harmony : 0,
    benevolence: Number.isFinite(points?.benevolence) ? points.benevolence : 0,
  };
}

export function resolveBranch(
  points: AttrPoints,
  reading: CareReading,
  fallback: 'power' | 'harmony' | 'benevolence' = 'harmony',
): 'power' | 'harmony' | 'benevolence' {
  // Ponto NÃO-FINITO vira 0 (saneado dentro de `branchLeaders`). Sem isto, um
  // `powerPoints` ausente/NaN no save
  // fazia `Math.max` dar NaN, `NaN <= 0` ser false, a lista de líderes ficar
  // VAZIA (nada é === NaN) e a função devolver `leaders[0]` — ou seja,
  // **`undefined`**, um valor fora do próprio tipo de retorno. O galho previsto
  // na página de Evolução ficava indefinido e `currentBranch: undefined` era
  // gravado no save. Achado por fuzzing na rodada 6.
  const leaders = branchLeaders(points);
  if (leaders.length === 0) return reading.confident ? patternBranch(reading.pattern.id) : fallback;
  if (leaders.length === 1) return leaders[0];

  // Empate: o jeito como a pessoa cuidou decide, se houver leitura confiável.
  if (reading.confident) {
    const preferred = patternBranch(reading.pattern.id);
    if (leaders.includes(preferred)) return preferred;
  }
  return leaders.includes(fallback) ? fallback : leaders[0];
}
