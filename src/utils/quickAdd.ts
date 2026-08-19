/**
 * QUICK ADD — CAPTURA DE UMA LINHA
 * ================================
 *
 * Uma linha de texto vira tarefa ou hábito. `pagar boleto amanhã 14h !2 #trabalho`.
 *
 * Por que isto existe, e por que é um arquivo de primeira classe e não um
 * "input esperto" enfiado num modal: **fricção de captura é o que determina se
 * o sistema sobrevive à segunda semana** (docs/PLANO-TAREFAS.md § 2.5). Se
 * cadastrar uma coisa custa três telas — nome, categoria, dia, esforço, salvar —
 * a pessoa deixa de cadastrar. E um app de tarefas onde a pessoa parou de
 * cadastrar não é um app que ela usa mal, é um app que ela desinstala. É a
 * queixa mais consistente do mercado inteiro, e é o motivo pelo qual Todoist e
 * Akiflow tratam a caixa de uma linha como o produto, não como um atalho.
 *
 * Três decisões que valem mais que a sintaxe:
 *
 * 1. **NUNCA lançar exceção, nunca devolver vazio.** Um parser que explode (ou
 *    que engole o texto) na captura é PIOR que não ter parser: a pessoa perde a
 *    coisa que ela estava tentando lembrar, no exato instante em que confiou no
 *    app. Lixo entra → `{ kind:'task', name: <o que ela digitou>, tokens: [] }`.
 *    Se a limpeza comer o texto inteiro, devolvemos o input original como nome —
 *    melhor um nome estranho ("3x semana") que uma tarefa sem nome.
 *
 * 2. **`tokens` existe para a UI confirmar, não para o parser se gabar.** Todo
 *    reconhecimento é um palpite. Devolvendo o que foi reconhecido, a tela pode
 *    mostrar chips ("amanhã", "!2", "#trabalho") que a pessoa vê e desfaz num
 *    toque. Parsing invisível que erra é como o app perde a confiança dela.
 *
 * 3. **Determinismo.** Nada de `Date.now()` aqui dentro: `opts.now` entra por
 *    parâmetro. "amanhã" é uma função do relógio do chamador, e é isso que
 *    torna a virada de dia (e o teste) reproduzível.
 *
 * PT-BR **e** EN nos dois sentidos, sempre — regra do projeto (CLAUDE.md,
 * "Idioma"). `language` decide desempates (`03/15` só é mês/dia em EN), nunca
 * bloqueia: quem escreve em inglês num app em português continua sendo
 * entendido, porque a alternativa é o app fingir que não leu.
 *
 * O CASO ESPECIAL QUE MERECE SINTAXE PRÓPRIA: `everyNDays` com
 * `from: 'completion'`
 * ----------------------------------------------------------------------------
 * `a cada 3 dias` e `a cada 3 dias após concluir` parecem a mesma frase e são
 * mecânicas OPOSTAS. A primeira conta da DATA PREVISTA: se você pulou, a
 * próxima instância já nasce atrasada, e a seguinte também, e em duas semanas
 * de vida real a lista tem sete cópias da mesma coisa cobrando por um passado
 * que não dá para consertar. A segunda conta da CONCLUSÃO — o relógio só volta
 * a andar quando você faz —, o que torna **estruturalmente impossível acumular
 * instâncias atrasadas**.
 *
 * É o `every!` do Todoist, e a pilha de atrasadas que ele resolve é a causa nº1
 * documentada de abandono da categoria (ver `types/taskModel.ts`, que chama
 * isso de "o item mais importante deste arquivo"). Uma mecânica com esse peso
 * não pode morar atrás de um checkbox escondido num modal de edição: se ela é a
 * diferença entre o hábito sobreviver e o app ser desinstalado, ela precisa
 * caber na linha de captura. Daí as três grafias — a longa e explícita
 * (`após concluir` / `after completion`) para quem está descobrindo, e o
 * sufixo `!` do Todoist (`a cada 3 dias!`) para quem já sabe e quer velocidade.
 * O `!` é literalmente o mesmo símbolo do Todoist de propósito: memória
 * muscular de usuário migrando vale mais que originalidade de sintaxe.
 *
 * (O `!` de recorrência e o `!2` de esforço convivem porque o de esforço é
 * sempre seguido de dígito — o guard `!(?!\d)` é o que separa os dois.)
 */

import type { ActivityCategory } from '../types/attributes';
import type { Effort, Schedule } from '../types/taskModel';

export interface QuickAddResult {
  kind: 'task' | 'activity';
  /** O texto limpo, sem os tokens, com espaços normalizados. Nunca vazio. */
  name: string;
  category?: ActivityCategory;
  effort?: Effort;
  /** Só quando `kind === 'activity'`. */
  schedule?: Schedule;
  /** YYYY-MM-DD */
  date?: string;
  /** HH:MM */
  time?: string;
  /** O que foi reconhecido, na grafia original — para os chips de confirmação. */
  tokens: string[];
}

export interface QuickAddOptions {
  now: Date;
  language: 'pt-BR' | 'en';
}

// ---------------------------------------------------------------------------
// Vocabulário
// ---------------------------------------------------------------------------

/**
 * `#tag` → `ActivityCategory`.
 *
 * As chaves são a forma NORMALIZADA (minúscula, sem acento, sem hífen) porque
 * ninguém digita "#bem-estar" com hífen na pressa, e "#saúde" com acento exige
 * teclado cooperando. Aceitar só a grafia bonita é a mesma coisa que não
 * aceitar. PT e EN convivem no mesmo mapa: a categoria é um dado interno em
 * inglês (`ActivityCategory`), a digitação é da pessoa.
 */
const CATEGORY_ALIASES: Record<string, ActivityCategory> = {
  // Health
  health: 'Health', saude: 'Health', saudavel: 'Health', medico: 'Health', doctor: 'Health',
  // Creativity
  creativity: 'Creativity', creative: 'Creativity', criatividade: 'Creativity',
  criativo: 'Creativity', arte: 'Creativity', art: 'Creativity',
  // Discipline
  discipline: 'Discipline', disciplina: 'Discipline', rotina: 'Discipline', routine: 'Discipline',
  // Study
  study: 'Study', studies: 'Study', estudo: 'Study', estudos: 'Study',
  estudar: 'Study', faculdade: 'Study', school: 'Study',
  // Work
  work: 'Work', trabalho: 'Work', job: 'Work', escritorio: 'Work', office: 'Work',
  // Social
  social: 'Social', socializar: 'Social', amigos: 'Social', friends: 'Social', family: 'Social', familia: 'Social',
  // Wellness
  wellness: 'Wellness', bemestar: 'Wellness', autocuidado: 'Wellness',
  selfcare: 'Wellness', mente: 'Wellness', mind: 'Wellness',
  // Fitness
  fitness: 'Fitness', treino: 'Fitness', treinar: 'Fitness', academia: 'Fitness',
  gym: 'Fitness', exercicio: 'Fitness', exercise: 'Fitness', workout: 'Fitness',
  corrida: 'Fitness', esporte: 'Fitness', sport: 'Fitness',
};

/** Alternativas de dia da semana, do mais longo para o mais curto (o regex é
 *  guloso na ORDEM, não no tamanho — inverter isso faz "domingo" casar "dom"
 *  e deixar "ingo" no nome). */
const WEEKDAY_PATTERNS: Array<[RegExp, number]> = [
  [/domingos?|sundays?|dom\b|sun\b/i, 0],
  [/segundas?(?:[-\s]?feiras?)?|mondays?|seg\b|mon\b/i, 1],
  [/ter[cç]as?(?:[-\s]?feiras?)?|tuesdays?|ter\b|tues\b|tue\b/i, 2],
  [/quartas?(?:[-\s]?feiras?)?|wednesdays?|qua\b|wed\b/i, 3],
  [/quintas?(?:[-\s]?feiras?)?|thursdays?|qui\b|thurs\b|thur\b|thu\b/i, 4],
  [/sextas?(?:[-\s]?feiras?)?|fridays?|sex\b|fri\b/i, 5],
  [/s[áa]bados?|saturdays?|sab\b|sat\b/i, 6],
];

const WEEKDAY_SCAN = new RegExp(
  '(?<=^|[\\s,/])(?:' + WEEKDAY_PATTERNS.map(([re]) => re.source).join('|') + ')',
  'gi',
);

/** Preposições que sobram pendendo na ponta depois que o token some
 *  ("reunião no |sábado|" → "reunião no"). Só nas PONTAS, e só estas — varrer o
 *  meio da frase mutilaria o nome que a pessoa escreveu. */
const DANGLING = /^(?:em|no|na|nos|nas|de|do|da|para|pra|at[eé]|as|[àa]s|ao|on|at|in|by|the)$/i;

// ---------------------------------------------------------------------------
// Helpers puros
// ---------------------------------------------------------------------------

function stripAccents(s: string): string {
  // ̀-ͯ = marcas combinantes. Escapado (e não o caractere literal)
  // porque combinante solto num arquivo-fonte é invisível em code review.
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalizeTag(s: string): string {
  return stripAccents(s).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** YYYY-MM-DD no fuso LOCAL. `toISOString()` está proibido aqui: ele converte
 *  para UTC e, a oeste de Greenwich, "hoje" às 22h vira amanhã. */
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

// ---------------------------------------------------------------------------
// O parser
// ---------------------------------------------------------------------------

/**
 * Lê uma linha e devolve o que der para entender dela. Não valida, não recusa,
 * não avisa: o que não for reconhecido simplesmente continua fazendo parte do
 * nome. Um token mal escrito custa um chip a menos, nunca a captura inteira.
 */
export function parseQuickAdd(input: string, opts: QuickAddOptions): QuickAddResult {
  const original = typeof input === 'string' ? input : '';
  const fallback: QuickAddResult = { kind: 'task', name: original.trim(), tokens: [] };
  try {
    return parseInner(original, opts);
  } catch {
    // Aqui não se relança nem se loga em erro: a captura é sagrada. Qualquer
    // bug futuro num regex vira "tarefa com o nome que a pessoa digitou".
    return fallback;
  }
}

function parseInner(original: string, opts: QuickAddOptions): QuickAddResult {
  const now = opts.now instanceof Date && !isNaN(opts.now.getTime()) ? opts.now : new Date();
  const pt = opts.language !== 'en';

  let text = original;
  const tokens: string[] = [];

  /** Come a 1ª ocorrência do regex, guarda o token e devolve os grupos. */
  const eat = (re: RegExp): RegExpExecArray | null => {
    const m = re.exec(text);
    if (!m) return null;
    tokens.push(m[0].trim());
    text = text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length);
    return m;
  };

  let category: ActivityCategory | undefined;
  let effort: Effort | undefined;
  let schedule: Schedule | undefined;
  let date: string | undefined;
  let time: string | undefined;

  // -- 1. Categoria (#tag) ---------------------------------------------------
  // Varre TODAS as tags e consome só as conhecidas. Uma `#tag` desconhecida
  // fica no nome de propósito: sumir com um texto que não entendemos é a
  // forma mais rápida de a pessoa perder informação sem perceber.
  {
    const re = /(?<=^|\s)#([\p{L}\p{N}][\p{L}\p{N}_-]*)/gu;
    let m: RegExpExecArray | null;
    const hits: Array<{ index: number; raw: string; cat: ActivityCategory }> = [];
    while ((m = re.exec(text))) {
      const cat = CATEGORY_ALIASES[normalizeTag(m[1])];
      if (cat) hits.push({ index: m.index, raw: m[0], cat });
    }
    if (hits.length) {
      category = hits[0].cat; // uma tarefa tem UMA categoria; a 1ª vence.
      for (let i = hits.length - 1; i >= 0; i--) {
        tokens.push(hits[i].raw);
        text = text.slice(0, hits[i].index) + ' ' + text.slice(hits[i].index + hits[i].raw.length);
      }
    }
  }

  // -- 2. Recorrência (vem ANTES de tudo que envolve número) ------------------
  // "a cada 3 dias" precisa ser lido inteiro antes que "3" vire hora e "dias"
  // vire "dia 15". Ordem aqui é semântica, não estética.

  // 2a. everyNDays — as duas variantes, e a de conclusão é a que importa.
  {
    const m = eat(
      /(?<=^|\s)(?:a\s+cada|cada|every)\s+(\d{1,3})\s*(?:dias?|days?|d)\b\s*(!(?!\d)|(?:ap[oó]s|depois\s+de|depois\s+que)\s+(?:concluir|completar|conclus[ãa]o|fazer|feito)|after\s+(?:completion|completing|done|i\s+finish))?/i,
    );
    if (m) {
      const n = clamp(parseInt(m[1], 10) || 1, 1, 365);
      // `from` é a decisão inteira: 'schedule' acumula atrasadas, 'completion'
      // não pode acumular. O sufixo `!` e a frase longa dizem a mesma coisa.
      const from: 'schedule' | 'completion' = m[2] ? 'completion' : 'schedule';
      schedule = { kind: 'everyNDays', n, from };
    }
  }

  // 2b. timesPerWeek — "3x semana". A palavra semana/week é OBRIGATÓRIA:
  // "comprar 3x leite" é uma compra, não um hábito. Inferir hábito de um "3x"
  // solto transformaria uma lista de compras numa cobrança semanal.
  if (!schedule) {
    const m = eat(/(?<=^|\s)(\d{1,2})\s*x\s*(?:\/\s*)?(?:por|per|na|a|the)?\s*(?:semana|week)\b/i);
    if (m) schedule = { kind: 'timesPerWeek', target: clamp(parseInt(m[1], 10) || 1, 1, 7) };
  }

  // 2c. todo dia / every day → weekdays com os sete.
  if (!schedule) {
    const m = eat(
      /(?<=^|\s)(?:todo\s+(?:o\s+)?dia|todos\s+os\s+dias|diariamente|every\s*day|everyday|daily)\b/i,
    );
    if (m) schedule = { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] };
  }

  // 2d/5c. Dias da semana. DOIS OU MAIS = recorrência ("seg qua sex"); UM SÓ =
  // data ("reunião sexta"). Ninguém escreve "seg qua sex" querendo uma data, e
  // ninguém escreve "sexta" querendo um hábito semanal.
  {
    WEEKDAY_SCAN.lastIndex = 0;
    const hits: Array<{ index: number; raw: string; day: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = WEEKDAY_SCAN.exec(text))) {
      const raw = m[0];
      const day = WEEKDAY_PATTERNS.findIndex(([re]) => new RegExp(`^(?:${re.source})$`, 'i').test(raw));
      if (day >= 0) hits.push({ index: m.index, raw, day });
    }
    const useAsSchedule = hits.length >= 2 && !schedule;
    const useAsDate = hits.length === 1;
    if (useAsSchedule || useAsDate) {
      for (let i = hits.length - 1; i >= 0; i--) {
        tokens.push(hits[i].raw);
        text = text.slice(0, hits[i].index) + ' ' + text.slice(hits[i].index + hits[i].raw.length);
      }
      if (useAsSchedule) {
        schedule = { kind: 'weekdays', days: [...new Set(hits.map((h) => h.day))].sort((a, b) => a - b) };
      } else {
        date = isoDate(nextWeekday(now, hits[0].day));
      }
    }
  }

  // -- 3. Esforço (!1 !2 !3) -------------------------------------------------
  // Depois da recorrência, para não brigar com o `!` do `a cada 3 dias!`.
  {
    const m = eat(/(?<=^|\s)!([1-3])(?=\s|$|[.,;])/);
    if (m) effort = (parseInt(m[1], 10) as Effort);
  }

  // -- 4. Datas --------------------------------------------------------------
  if (!date) {
    // Fim de token por LOOKAHEAD e não por `\b`: "amanhã" termina em `ã`, que
    // não é caractere de palavra em JS — `\b` no fim simplesmente não casa, e a
    // palavra mais digitada do app inteiro deixaria de ser reconhecida.
    const END = '(?=\\s|$|[.,;!])';
    if (eat(new RegExp(`(?<=^|\\s)(?:hoje|today|tonight)${END}`, 'i'))) {
      date = isoDate(now);
    } else if (eat(new RegExp(`(?<=^|\\s)(?:depois\\s+de\\s+amanh[ãa]|day\\s+after\\s+tomorrow)${END}`, 'i'))) {
      const d = startOfDay(now); d.setDate(d.getDate() + 2); date = isoDate(d);
    } else if (eat(new RegExp(`(?<=^|\\s)(?:amanh[ãa]|tomorrow)${END}`, 'i'))) {
      const d = startOfDay(now); d.setDate(d.getDate() + 1); date = isoDate(d);
    }
  }

  // 4b. dd/mm (ou mm/dd em EN). A ordem é AMBÍGUA por natureza — 03/15 só é
  // legível porque não existe mês 15; 03/04 não é legível de jeito nenhum, e
  // aí o idioma decide. Por isso o chip de confirmação existe.
  if (!date) {
    const m = eat(/(?<=^|\s)(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s|$|[.,;])/);
    if (m) {
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      let day: number, month: number;
      if (pt) { day = a; month = b; } else { month = a; day = b; }
      // Salvaguarda: "15/03" em EN não é o mês 15. Um número > 12 no lugar do
      // mês só pode ser dia, e obedecer o idioma cegamente aqui produziria uma
      // data inválida a partir de um texto perfeitamente claro.
      if (month > 12 && day <= 12) { const t = day; day = month; month = t; }
      const y = m[3]
        ? (m[3].length <= 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10))
        : now.getFullYear();
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        let d = new Date(y, month - 1, day);
        // Sem ano explícito e já passou? É do ano que vem. Ninguém agenda para
        // trás numa caixa de captura.
        if (!m[3] && d.getTime() < startOfDay(now).getTime()) d = new Date(y + 1, month - 1, day);
        if (d.getMonth() === (month - 1) % 12) date = isoDate(d);
      }
    }
  }

  // 4c. "dia 15" / "on the 15th" — mesma lógica de "já passou → mês que vem".
  if (!date) {
    const m = eat(/(?<=^|\s)(?:no\s+)?dia\s+(\d{1,2})\b|(?<=^|\s)(?:on\s+)?the\s+(\d{1,2})(?:st|nd|rd|th)\b/i);
    if (m) {
      const dayNum = parseInt(m[1] ?? m[2], 10);
      if (dayNum >= 1 && dayNum <= 31) {
        let d = new Date(now.getFullYear(), now.getMonth(), dayNum);
        if (d.getTime() < startOfDay(now).getTime() || d.getMonth() !== now.getMonth()) {
          d = new Date(now.getFullYear(), now.getMonth() + 1, dayNum);
        }
        date = isoDate(d);
      }
    }
  }

  // -- 5. Hora ---------------------------------------------------------------
  // am/pm primeiro: "2:30pm" tem que ser lido inteiro, senão a regra de `H:MM`
  // leva o "2:30" e deixa um "pm" órfão no nome.
  {
    let m = eat(/(?<=^|\s)(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s?m\.?(?=\s|$|[.,;])/i);
    if (m) {
      let h = parseInt(m[1], 10) % 12;
      if (m[3].toLowerCase() === 'p') h += 12;
      time = fmtTime(h, m[2] ? parseInt(m[2], 10) : 0);
    }
    if (!time) {
      m = eat(/(?<=^|\s)([01]?\d|2[0-3])\s*h(?:oras?)?(?:\s*(\d{2}))?(?=\s|$|[.,;])/i);
      if (m) time = fmtTime(parseInt(m[1], 10), m[2] ? parseInt(m[2], 10) : 0);
    }
    if (!time) {
      m = eat(/(?<=^|\s)([01]?\d|2[0-3]):([0-5]\d)(?=\s|$|[.,;])/);
      if (m) time = fmtTime(parseInt(m[1], 10), parseInt(m[2], 10));
    }
    if (!time) {
      // "às 9" / "at 9" — o marcador é a preposição, não o formato. Sem ela um
      // "9" solto no meio da frase viraria horário ("comprar 9 ovos").
      m = eat(/(?<=^|\s)(?:[àa]s|at)\s+([01]?\d|2[0-3])(?::([0-5]\d))?(?:\s*h)?(?=\s|$|[.,;])/i);
      if (m) time = fmtTime(parseInt(m[1], 10), m[2] ? parseInt(m[2], 10) : 0);
    }
  }

  // -- 6. Nome limpo ---------------------------------------------------------
  let name = text.replace(/\s+/g, ' ').trim();
  // Preposições órfãs nas pontas + pontuação solta.
  let parts = name.split(' ').filter(Boolean);
  while (parts.length && DANGLING.test(parts[parts.length - 1])) parts.pop();
  while (parts.length && DANGLING.test(parts[0])) parts.shift();
  name = parts.join(' ').replace(/^[\s,;:.\-–—]+|[\s,;:.\-–—]+$/g, '').trim();
  // Sobrou nada? Devolve o input inteiro. Uma tarefa chamada "3x semana" é
  // esquisita; uma tarefa sem nome é um item que a pessoa não consegue
  // identificar na lista — e aí ela apaga, e aí ela para de capturar.
  if (!name) name = original.trim();

  const result: QuickAddResult = {
    kind: schedule ? 'activity' : 'task',
    name,
    tokens,
  };
  if (category) result.category = category;
  if (effort) result.effort = effort;
  if (schedule) result.schedule = schedule;
  if (date) result.date = date;
  if (time) result.time = time;
  return result;
}

function fmtTime(h: number, min: number): string | undefined {
  if (!(h >= 0 && h <= 23) || !(min >= 0 && min <= 59)) return undefined;
  return `${pad2(h)}:${pad2(min)}`;
}

/** Próxima ocorrência do dia da semana, INCLUINDO hoje. "reunião segunda"
 *  escrito numa segunda é hoje — empurrar para daqui a 7 dias seria o app
 *  discordando do calendário na cara da pessoa. */
function nextWeekday(now: Date, day: number): Date {
  const d = startOfDay(now);
  d.setDate(d.getDate() + ((day - d.getDay() + 7) % 7));
  return d;
}

/**
 * Exemplo para o placeholder do campo. A sintaxe se ensina sozinha se o
 * exemplo mostrar quatro tokens de uma vez — nenhum usuário abre a ajuda.
 */
export function quickAddHint(language: 'pt-BR' | 'en'): string {
  return language === 'pt-BR'
    ? 'pagar boleto amanhã 14h !2 #trabalho'
    : 'pay the bill tomorrow 2pm !2 #work';
}
