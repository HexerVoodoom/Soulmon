import { minimizeForAi } from './_redact.js';

// ---------------------------------------------------------------------------
// AÇÕES PROPOSTAS DO CHAT — o contrato entre o modelo e o app.
//
// REGRA DE OURO: o modelo NUNCA escreve no save. Ele devolve, por tool calling,
// uma PROPOSTA; este arquivo a transforma em um objeto fechado e validado; o
// CLIENTE mostra um cartão de confirmação e só então grava, pelas MESMAS portas
// que a UI usa (`commitHabitCreate` / `commitTaskCreate` em `src/App.tsx`, que
// carregam o teto do demo, o teto de estágio e a telemetria).
//
// Tudo que sai do modelo é ENTRADA NÃO CONFIÁVEL (o usuário pode ter induzido o
// texto): nome saneado e cortado, enum fechado, número com faixa, ação
// desconhecida descartada, no máximo `MAX_ACTIONS` por resposta. Argumento a
// mais (`tier`, `saveId`, `delete`, `count`…) é ignorado: a função só lê os
// campos que declara.
//
// Existe uma cópia desta validação no CLIENTE (`src/utils/chatActions.ts`) —
// o servidor é a primeira trava, o cliente é a última (defesa em profundidade).
// `chatActions.parity.test.js` trava as duas contra divergência.
// ---------------------------------------------------------------------------

export const CATEGORIES = ['Health', 'Creativity', 'Discipline', 'Study', 'Work', 'Social', 'Wellness', 'Fitness'];
/** Por resposta. "Crie 500 hábitos" vira, no máximo, estas propostas — e cada
 *  uma ainda exige o toque da pessoa. */
export const MAX_ACTIONS = 2;
export const MAX_NAME = 60;
export const CADENCES = ['daily', 'weekdays', 'times_per_week', 'every_n_days'];

const POSE_TOOLS = new Set(['flip_soulmon', 'fly', 'land']);

/** Definição das ferramentas no formato OpenAI (Groq). Descrições em inglês:
 *  é o idioma em que o modelo as segue melhor; o texto ao usuário segue o idioma dele. */
export const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Propose creating ONE one-off to-do. Only when the user EXPLICITLY asks to add/create a task or reminder. The app asks the user to confirm; you never create anything yourself.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Short task title, max 60 chars, in the user language.' },
          category: { type: 'string', enum: CATEGORIES },
          effort: { type: 'integer', enum: [1, 2, 3], description: '1 quick, 2 medium, 3 project.' },
          date: { type: 'string', description: 'Optional YYYY-MM-DD the user intends to do it.' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_habit',
      description: 'Propose creating ONE recurring habit. Only when the user EXPLICITLY asks for a habit/routine. The app asks the user to confirm.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Short habit title, max 60 chars, in the user language.' },
          category: { type: 'string', enum: CATEGORIES },
          cadence: { type: 'string', enum: CADENCES, description: 'daily = every day.' },
          days: { type: 'array', items: { type: 'integer', minimum: 0, maximum: 6 }, description: 'For cadence=weekdays: 0=Sunday..6=Saturday.' },
          times_per_week: { type: 'integer', minimum: 1, maximum: 7 },
          every_n_days: { type: 'integer', minimum: 2, maximum: 60 },
          time: { type: 'string', description: 'Optional reminder time HH:MM, 24h.' },
        },
        required: ['name', 'cadence'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'flip_soulmon',
      description: 'Cosmetic: mirror the Soulmon sprite to face the other way ("turn around", "vira pro outro lado").',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fly',
      description: 'Cosmetic: make the Soulmon hover in the air ("fly", "voa").',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'land',
      description: 'Cosmetic: put the Soulmon back on the ground ("land", "desce", "aterrissa").',
      parameters: { type: 'object', properties: {} },
    },
  },
];

/** Nome livre do modelo/usuário → uma linha, sem marcação, sem PII, ≤ 60. */
export function cleanName(input) {
  let t = (input ?? '').toString();
  t = t.replace(new RegExp('[\\u0000-\\u001F\\u007F\\u2028\\u2029]+', 'g'), ' ')
    .replace(new RegExp('[\\u200B\\u200E\\u200F\\u202A-\\u202E\\u2060-\\u206F\\uFEFF]', 'g'), '')
    .replace(/[<>{}|\\]/g, ' ').replace(/\x60/g, ' ').replace(/[\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return '';
  return minimizeForAi(t, MAX_NAME).text.trim();
}

function int(v) {
  if (typeof v === 'string' && /^-?\d+$/.test(v.trim())) return Number(v);
  return typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) ? v : null;
}

function cleanTime(v) {
  if (typeof v !== 'string') return undefined;
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(v.trim());
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : undefined;
}

function cleanDate(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return undefined;
  const y = Number(v.slice(0, 4));
  return y >= 2024 && y <= 2100 ? v : undefined;
}

/** @returns {string|undefined} */
function cleanCategory(v) {
  return CATEGORIES.includes(v) ? v : undefined;
}

/**
 * Valida UMA chamada de ferramenta.
 * @param {string} name
 * @param {unknown} rawArgs objeto ou JSON em string (como o Groq devolve)
 * @returns {{ ok: true, action: object } | { ok: false, reason: string }}
 */
export function validateToolCall(name, rawArgs) {
  if (POSE_TOOLS.has(name)) return { ok: true, action: { type: name } };
  if (name !== 'create_task' && name !== 'create_habit') return { ok: false, reason: 'unknown-tool' };

  /** @type {any} */
  let args = rawArgs;
  if (typeof args === 'string') {
    if (args.length > 2000) return { ok: false, reason: 'args-too-long' };
    try { args = JSON.parse(args); } catch { return { ok: false, reason: 'bad-json' }; }
  }
  if (!args || typeof args !== 'object' || Array.isArray(args)) return { ok: false, reason: 'bad-args' };

  const title = cleanName(args.name);
  if (!title) return { ok: false, reason: 'empty-name' };
  const category = cleanCategory(args.category) ?? 'Discipline';

  if (name === 'create_task') {
    const effortRaw = int(args.effort);
    const effort = effortRaw === 1 || effortRaw === 2 || effortRaw === 3 ? effortRaw : 1;
    const date = cleanDate(args.date);
    return { ok: true, action: { type: 'create_task', task: { name: title, category, effort, ...(date ? { date } : {}) } } };
  }

  // create_habit
  let schedule;
  switch (args.cadence) {
    case 'daily':
      schedule = { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] };
      break;
    case 'weekdays': {
      if (!Array.isArray(args.days) || args.days.length === 0 || args.days.length > 14) return { ok: false, reason: 'bad-days' };
      const set = new Set();
      for (const d of args.days) {
        const n = int(d);
        if (n === null || n < 0 || n > 6) return { ok: false, reason: 'bad-days' };
        set.add(n);
      }
      schedule = { kind: 'weekdays', days: [...set].sort((a, b) => a - b) };
      break;
    }
    case 'times_per_week': {
      const n = int(args.times_per_week);
      if (n === null || n < 1 || n > 7) return { ok: false, reason: 'bad-times' };
      schedule = { kind: 'timesPerWeek', target: n };
      break;
    }
    case 'every_n_days': {
      const n = int(args.every_n_days);
      if (n === null || n < 2 || n > 60) return { ok: false, reason: 'bad-interval' };
      schedule = { kind: 'everyNDays', n, from: 'completion' };
      break;
    }
    default:
      return { ok: false, reason: 'bad-cadence' };
  }
  const time = cleanTime(args.time);
  return { ok: true, action: { type: 'create_habit', habit: { name: title, category, schedule, ...(time ? { time } : {}) } } };
}

/**
 * Todas as chamadas da resposta → lista de ações válidas, sem duplicata e com
 * teto. Só devolve o que passou; o resto é contado para log (sem conteúdo).
 * @returns {{ actions: object[], rejected: number }}
 */
export function sanitizeToolCalls(toolCalls) {
  if (!Array.isArray(toolCalls)) return { actions: [], rejected: 0 };
  const actions = [];
  let rejected = 0;
  const seen = new Set();
  for (const call of toolCalls.slice(0, 10)) {
    const r = validateToolCall(call?.function?.name ?? call?.name, call?.function?.arguments ?? call?.args);
    if (!r.ok) { rejected++; continue; }
    const key = JSON.stringify(r.action);
    if (seen.has(key)) continue;
    seen.add(key);
    if (actions.length >= MAX_ACTIONS) { rejected++; continue; }
    actions.push(r.action);
  }
  return { actions, rejected };
}
