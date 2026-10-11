import { KNOWLEDGE } from './_chatKnowledge.data.js';

// ---------------------------------------------------------------------------
// BASE DE CONHECIMENTO DO CHAT — recuperação BM25 simples, no Worker.
//
// O conteúdo (`_chatKnowledge.data.js`) é GERADO de docs/manual/ por
// `scripts/gen-chat-knowledge.mjs`; nada aqui inventa regra. O chat responde
// dúvida sobre o jogo SÓ com o que esta busca devolver — sem trecho acima do
// limiar, a instrução é "diga que não sabe". Trecho marcado como segredo nunca
// entra no índice (ver SECRET_MARK no gerador).
// ---------------------------------------------------------------------------

const STOP = new Set(('a o as os um uma uns umas de do da dos das em no na nos nas por para com sem e ou que se eu me meu minha voce vc tem ter ser e eh foi como qual quais quando onde porque pq mais muito isso isso esse essa este esta ao aos '
  + 'the an of to in on for with and or is are was be do does did how what which when where why my me i you it this that can will have has your').split(/\s+/));

// Pergunta em inglês contra manual em português: ponte mínima de vocabulário.
const EN_PT = {
  heart: 'coracao', hearts: 'coracao', hp: 'coracao', hunger: 'comida', food: 'comida', feed: 'comida', sleep: 'dormir', habit: 'habito', habits: 'habito',
  task: 'tarefa', tasks: 'tarefa', streak: 'constancia', consistency: 'constancia', evolve: 'evolucao', evolution: 'evolucao', energy: 'energia', bath: 'banho',
  play: 'brincar', shop: 'loja', store: 'loja', coin: 'moeda', coins: 'moeda', shield: 'escudo', dungeon: 'masmorra', mood: 'humor', report: 'relatorio',
  rebirth: 'renascimento', poop: 'coco', pet: 'carinho', petting: 'carinho', postpone: 'adiamento', focus: 'foco', goal: 'meta', day: 'dia', week: 'semana',
};

const norm = s => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
// Plural PT (-ões/-ães/-ãos viram -ão, depois tira o -s) antes do corte por prefixo.
const stem = w => {
  const x = w.replace(/(oes|aes)$/, 'ao').replace(/s$/, '');
  return x.length > 6 ? x.slice(0, 6) : x;
};

export function tokenize(text) {
  const out = [];
  for (const raw of norm(String(text ?? '')).split(/[^a-z0-9]+/)) {
    if (raw.length < 2 || STOP.has(raw)) continue;
    out.push(stem(EN_PT[raw] ?? raw));
  }
  return out;
}

const K1 = 1.4;
const B = 0.75;
/** Pontuação mínima para um trecho valer como evidência. Abaixo disso: "não sei". */
export const MIN_SCORE = 2.2;

let index = null;
function build(chunks) {
  const docs = chunks.map(c => {
    // O título pesa mais: repetido, entra 3x no vetor de termos.
    const toks = [...tokenize(c.t), ...tokenize(c.t), ...tokenize(c.t), ...tokenize(c.x)];
    const tf = new Map();
    for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
    return { c, tf, len: toks.length };
  });
  const df = new Map();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
  const avg = docs.reduce((a, d) => a + d.len, 0) / Math.max(1, docs.length);
  return { docs, df, avg, n: docs.length };
}

/**
 * @param {string} query
 * @param {{ k?: number, chunks?: Array<{id:string,t:string,x:string}> }} [opts]
 * @returns {Array<{ id: string, t: string, x: string, score: number }>}
 */
export function searchKnowledge(query, opts = {}) {
  const k = opts.k ?? 3;
  const idx = opts.chunks ? build(opts.chunks) : (index ??= build(KNOWLEDGE));
  const q = [...new Set(tokenize(query))];
  if (!q.length) return [];
  const res = [];
  for (const d of idx.docs) {
    let score = 0;
    for (const t of q) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = idx.df.get(t) || 0;
      const idf = Math.log(1 + (idx.n - n + 0.5) / (n + 0.5));
      score += idf * (f * (K1 + 1)) / (f + K1 * (1 - B + B * d.len / idx.avg));
    }
    if (score >= MIN_SCORE) res.push({ ...d.c, score: Math.round(score * 100) / 100 });
  }
  return res.sort((a, b) => b.score - a.score).slice(0, k);
}

/** Bloco do prompt. Vazio quando não há evidência (o prompt manda dizer "não sei"). */
export function knowledgeBlock(hits) {
  if (!hits?.length) return '';
  return `
GAME FACTS — reference DATA from the game manual (Portuguese). Answer game-rule
questions ONLY from these lines, in the user's language and in your own voice.
Do not add rules that are not here. If they do not answer the question, say you
do not know.
${hits.map(h => `- ${h.t}: ${h.x}`).join('\n')}
`;
}
