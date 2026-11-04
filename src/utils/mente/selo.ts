/**
 * SELO FALTANTE (id `selo`, EN "Missing Seal") — a regra pura das matrizes progressivas no estilo Raven.
 * Uma grade 3×3 de selos arcanos; o canto de baixo à direita falta, e o jogador escolhe entre 6 opções.
 * Substitui a Colcha (`patches`) no Ateliê da Mente (04/11/2026, decisão do dono; pesquisa em
 * `docs/pesquisa/2026-11-04-jogo-cognitivo-e-chama.md`, parte A). A copy DESCREVE o que o jogo pede
 * ("exercita raciocínio"); nunca promete efeito.
 *
 * Cada selo tem 5 atributos: forma, quantidade de pontos, posição da gema (8 direções), preenchimento
 * e marcas do anel (4 bits). Cada atributo segue UMA regra por matriz: constante, progressão na linha,
 * distribuição de três (quadrado latino), aritmética da quantidade (nível ≥ 4) ou XOR das marcas (nível ≥ 6).
 *
 * As 6 opções = 3 valores de um atributo regrado × 2 valores de outro (desenho aprovado): todo valor
 * aparece com a mesma frequência, então a resposta NÃO sai por contagem — só pela regra.
 * Tudo puro e determinístico (rng por parâmetro). O componente (`components/mente/SeloGame.tsx`) só aplica.
 */
import { seededRng, type Rng } from './eco';

export { seededRng };
export type { Rng };

/** Matrizes por rodada. */
export const SELO_ROUND = 8;
/** Teto de Bits por rodada (o funil do App ainda aplica o teto diário). */
export const SELO_MAX_BITS = 10;
export const SELO_MIN_LEVEL = 1;
export const SELO_MAX_LEVEL = 7;
/** Sobe depois de 3 acertos seguidos; desce a cada erro (escada 3-acima/1-abaixo ≈ 79% de acerto). */
export const SELO_UP_AFTER = 3;
export const SELO_OPTIONS = 6;

export const SELO_SHAPES = 5; // círculo, triângulo, quadrado, losango, hexágono
export const SELO_MAX_COUNT = 6; // pontos de 1 a 6
export const SELO_DIRS = 8; // a gema em 8 direções (45° cada)
export const SELO_FILLS = 3; // vazio, metade, cheio
export const SELO_MARKS = 16; // 4 marcas no anel (máscara de bits)

export type SeloAttr = 'shape' | 'count' | 'dir' | 'fill' | 'marks';
export const SELO_ATTRS: readonly SeloAttr[] = ['shape', 'count', 'dir', 'fill', 'marks'];
export type SeloRule = 'const' | 'progression' | 'distribution' | 'arith' | 'xor';

export interface SeloPanel { shape: number; count: number; dir: number; fill: number; marks: number }

export interface SeloPuzzle {
  level: number;
  /** As 9 casas, linha a linha; `grid[8]` é a resposta (a tela esconde). */
  grid: SeloPanel[];
  rules: Record<SeloAttr, SeloRule>;
  options: SeloPanel[];
  /** Índice da opção certa em `options`. */
  answer: number;
  /** Os dois atributos que variam entre as opções (A com 3 valores, B com 2). */
  varied: [SeloAttr, SeloAttr];
}

const DOMAIN: Record<SeloAttr, { min: number; max: number }> = {
  shape: { min: 0, max: SELO_SHAPES - 1 },
  count: { min: 1, max: SELO_MAX_COUNT },
  dir: { min: 0, max: SELO_DIRS - 1 },
  fill: { min: 0, max: SELO_FILLS - 1 },
  marks: { min: 1, max: SELO_MARKS - 1 },
};

const int = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const clampLevel = (l: number) => Math.min(SELO_MAX_LEVEL, Math.max(SELO_MIN_LEVEL, Math.floor(Number.isFinite(l) ? l : 1)));

/** Quantas regras ao mesmo tempo (atributos que mudam): 1 → 4 ao longo dos 7 níveis. */
export function seloRuleCount(level: number): number {
  return [1, 2, 2, 3, 3, 4, 4][clampLevel(level) - 1];
}

/** Escada: 3 acertos seguidos sobem um nível; um erro desce um. */
export function seloStep(level: number, streak: number, correct: boolean): { level: number; streak: number } {
  const l = clampLevel(level);
  if (!correct) return { level: Math.max(SELO_MIN_LEVEL, l - 1), streak: 0 };
  const s = streak + 1;
  if (s >= SELO_UP_AFTER) return { level: Math.min(SELO_MAX_LEVEL, l + 1), streak: 0 };
  return { level: l, streak: s };
}

/** Bits da rodada: floor(acertos × 10 / 8), teto 10. */
export function seloBits(correct: number): number {
  const c = Math.max(0, Math.min(SELO_ROUND, Math.floor(Number.isFinite(correct) ? correct : 0)));
  return Math.min(SELO_MAX_BITS, Math.floor((c * SELO_MAX_BITS) / SELO_ROUND));
}

/** Escolhe a regra de cada atributo para o nível. */
function pickRules(level: number, rng: Rng): Record<SeloAttr, SeloRule> {
  const n = seloRuleCount(level);
  const rules: Record<SeloAttr, SeloRule> = { shape: 'const', count: 'const', dir: 'const', fill: 'const', marks: 'const' };
  const pool: SeloAttr[] = ['shape', 'count', 'dir', 'fill'];
  const chosen: SeloAttr[] = [];
  // Nível ≥ 6: o XOR das marcas entra sempre. Nível ≥ 4: a aritmética da quantidade entra sempre.
  if (level >= 6) { rules.marks = 'xor'; chosen.push('marks'); }
  if (level >= 4) { rules.count = 'arith'; chosen.push('count'); }
  for (const a of shuffle(pool.filter(x => !chosen.includes(x)), rng)) {
    if (chosen.length >= n) break;
    chosen.push(a);
    if (a === 'shape' || a === 'fill') rules[a] = 'distribution';
    else if (a === 'dir') rules[a] = rng() < 0.5 ? 'progression' : 'distribution';
    else rules[a] = rng() < 0.5 || level < 3 ? 'progression' : 'distribution';
  }
  return rules;
}

/** Os 9 valores (linha a linha) de um atributo sob a sua regra. */
function fillAttr(attr: SeloAttr, rule: SeloRule, rng: Rng): number[] {
  const { min, max } = DOMAIN[attr];
  const out: number[] = [];
  if (rule === 'const') {
    const v = int(rng, min, max);
    return Array(9).fill(v);
  }
  if (rule === 'distribution') {
    const vals = shuffle(Array.from({ length: max - min + 1 }, (_, i) => min + i), rng).slice(0, 3);
    const k = rng() < 0.5 ? 1 : 2;
    for (let r = 0; r < 3; r += 1) for (let c = 0; c < 3; c += 1) out.push(vals[(c + r * k) % 3]);
    return out;
  }
  if (rule === 'progression') {
    if (attr === 'dir') {
      const d = rng() < 0.5 ? 1 : 2;
      const sign = rng() < 0.5 ? 1 : -1;
      for (let r = 0; r < 3; r += 1) {
        const s = int(rng, 0, SELO_DIRS - 1);
        for (let c = 0; c < 3; c += 1) out.push((((s + sign * c * d) % SELO_DIRS) + SELO_DIRS) % SELO_DIRS);
      }
      return out;
    }
    // count: +1 ou +2 por coluna (às vezes descendo), sem sair de 1..6.
    const d = rng() < 0.6 ? 1 : 2;
    const down = rng() < 0.4;
    for (let r = 0; r < 3; r += 1) {
      const s = int(rng, min, max - 2 * d);
      for (let c = 0; c < 3; c += 1) out.push(down ? s + (2 - c) * d : s + c * d);
    }
    return out;
  }
  if (rule === 'arith') {
    // Terceira coluna = primeira + segunda (ou − segunda), por linha.
    const plus = rng() < 0.5;
    for (let r = 0; r < 3; r += 1) {
      if (plus) {
        const a = int(rng, 1, max - 1);
        const b = int(rng, 1, max - a);
        out.push(a, b, a + b);
      } else {
        const a = int(rng, 2, max);
        const b = int(rng, 1, a - 1);
        out.push(a, b, a - b);
      }
    }
    return out;
  }
  // xor: terceira = primeira XOR segunda; nenhuma casa vazia nem repetida na linha.
  for (let r = 0; r < 3; r += 1) {
    let a = 0; let b = 0;
    do { a = int(rng, 1, SELO_MARKS - 1); b = int(rng, 1, SELO_MARKS - 1); } while (a === b);
    out.push(a, b, a ^ b);
  }
  return out;
}

/** Valores errados plausíveis para um atributo (distintos da resposta e entre si). */
function wrongValues(attr: SeloAttr, right: number, n: number, grid: SeloPanel[], rng: Rng): number[] {
  const { min, max } = DOMAIN[attr];
  // Prefere valores que já aparecem na grade (distrator forte), depois o resto do domínio.
  const seen = [...new Set(grid.slice(0, 8).map(p => p[attr]))].filter(v => v !== right);
  const rest = Array.from({ length: max - min + 1 }, (_, i) => min + i).filter(v => v !== right && !seen.includes(v));
  return [...shuffle(seen, rng), ...shuffle(rest, rng)].slice(0, n);
}

export const samePanel = (a: SeloPanel, b: SeloPanel) => SELO_ATTRS.every(k => a[k] === b[k]);

/** Gera uma matriz do nível. Determinística para o mesmo `rng`. */
export function seloForLevel(level: number, rng: Rng): SeloPuzzle {
  const l = clampLevel(level);
  const rules = pickRules(l, rng);
  const cols = Object.fromEntries(SELO_ATTRS.map(a => [a, fillAttr(a, rules[a], rng)])) as Record<SeloAttr, number[]>;
  const grid: SeloPanel[] = Array.from({ length: 9 }, (_, i) => ({
    shape: cols.shape[i], count: cols.count[i], dir: cols.dir[i], fill: cols.fill[i], marks: cols.marks[i],
  }));
  const right = grid[8];
  // A (3 valores) e B (2 valores): atributos REGRADOS primeiro; com uma regra só, B é um atributo constante.
  const ruled = shuffle(SELO_ATTRS.filter(a => rules[a] !== 'const'), rng);
  const constant = shuffle(SELO_ATTRS.filter(a => rules[a] === 'const'), rng);
  const order = [...ruled, ...constant];
  const A = order[0];
  const B = order[1];
  const aVals = [right[A], ...wrongValues(A, right[A], 2, grid, rng)];
  const bVals = [right[B], ...wrongValues(B, right[B], 1, grid, rng)];
  const opts: SeloPanel[] = [];
  for (const av of aVals) for (const bv of bVals) opts.push({ ...right, [A]: av, [B]: bv });
  const options = shuffle(opts, rng);
  const answer = options.findIndex(o => samePanel(o, right));
  return { level: l, grid, rules, options, answer, varied: [A, B] };
}
