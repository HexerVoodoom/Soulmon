// ---------------------------------------------------------------------------
// ARENA: QUANTOS ELEMENTOS TEM O INIMIGO ULTIMATE/MEGA (dono, 15/11/2026).
//
// Pedido: "aumentar a chance de ver o Ultimate com elemento combinado de dois elementos e o Mega com três; o último inimigo da
// Arena vem sempre de elemento único; ainda com chance de 3, 4 e de elemento base". Dono ÚNICO da tabela de pesos e do relaxamento.
//
//   · `ARENA_COMPONENT_WEIGHTS` é A tabela que o dono ajusta (valores relativos; somam 100 por conveniência).
//   · Rookie e Champion NÃO estão na tabela: seguem como antes (`ARENA_FUSED_FOE_CHANCE`, forma da escada).
//   · A Arena não tem Mega hoje (`ArenaLadderStage` para em Ultimate), então a linha `mega` só vale se a escada ganhar esse degrau;
//     o sorteador já a aceita e o teste a mede.
//   · Sem RNG próprio: a Arena passa UM número do `mulberry32` da run (determinístico, nunca `Math.random`; card = luta).
//   · O pool é o que TEM ARTE (forma `forma`/`paralelo` do roster, que contém o elemento da run). Tamanho sem criatura para o
//     elemento da run relaxa para o tamanho MAIS PRÓXIMO que tenha (empate: o maior, que é a intenção do pedido); nunca trava.
// ---------------------------------------------------------------------------
import { ENEMY_ROSTER, type EnemyStage, type RosterEntry } from './enemyRoster';
import { curatedComponents } from './elementosCurados';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';

export type ArenaComponentCount = 1 | 2 | 3 | 4;
export const ARENA_COMPONENT_COUNTS: readonly ArenaComponentCount[] = [1, 2, 3, 4];

/**
 * PESOS por estágio para o nº de componentes do elemento do inimigo (1 = elemento base). Ajuste AQUI e só aqui.
 * Ultimate: 2 componentes 55% · base 25% · 3 comp. 15% · 4 comp. 5%.  Mega: 3 comp. 50% · 2 comp. 20% · 4 comp. 20% · base 10%.
 */
export const ARENA_COMPONENT_WEIGHTS: Readonly<Partial<Record<EnemyStage, Readonly<Record<ArenaComponentCount, number>>>>> = {
  ultimate: { 1: 25, 2: 55, 3: 15, 4: 5 },
  mega: { 1: 10, 2: 20, 3: 50, 4: 20 },
};

/** Os componentes de verdade de uma entrada do roster (o `elements` dela guarda só os 2 que mandam nos golpes). */
export function entryComponents(e: Pick<RosterEntry, 'element' | 'elements'>): readonly string[] {
  return curatedComponents(e.element) ?? DERIVED_ELEMENT_PAIRS.find(d => d.id === e.element)?.componentes ?? e.elements;
}

/** Sorteia o tamanho desejado com `u` em [0,1): a faixa de cada tamanho é o peso dele sobre a soma. Estágio fora da tabela = `undefined` (nada muda). */
export function drawComponentCount(stage: EnemyStage, u: number): ArenaComponentCount | undefined {
  const w = ARENA_COMPONENT_WEIGHTS[stage];
  if (!w) return undefined;
  const total = ARENA_COMPONENT_COUNTS.reduce((s, n) => s + w[n], 0);
  let acc = 0;
  const x = Math.min(Math.max(u, 0), 1 - 1e-12) * total;
  for (const n of ARENA_COMPONENT_COUNTS) { acc += w[n]; if (x < acc) return n; }
  return 1;
}

/** O tamanho mais próximo de `want` entre os `available` (empate: o maior); `1` (base) é o último recurso e sempre existe. */
export function relaxComponentCount(want: ArenaComponentCount, available: ReadonlySet<ArenaComponentCount>): ArenaComponentCount {
  if (want === 1 || available.has(want)) return want;
  const cands = [...available].sort((a, b) => Math.abs(a - want) - Math.abs(b - want) || b - a);
  return cands[0] ?? 1;
}

/** Os combinados com ARTE no estágio, que contêm o elemento `runElement`, por nº de componentes (>= 2). Memoizado. */
const CACHE = new Map<string, ReadonlyMap<ArenaComponentCount, readonly RosterEntry[]>>();
export function combinedPoolOf(stage: EnemyStage, runElement: string): ReadonlyMap<ArenaComponentCount, readonly RosterEntry[]> {
  const key = `${stage}|${runElement}`;
  const hit = CACHE.get(key);
  if (hit) return hit;
  const out = new Map<ArenaComponentCount, RosterEntry[]>();
  for (const e of ENEMY_ROSTER) {
    if (e.stage !== stage || (e.kind !== 'forma' && e.kind !== 'paralelo')) continue;
    const comps = entryComponents(e);
    if (comps.length < 2 || comps.length > 4 || !comps.includes(runElement)) continue;
    const n = comps.length as ArenaComponentCount;
    out.set(n, [...(out.get(n) ?? []), e]);
  }
  CACHE.set(key, out);
  return out;
}

export interface ArenaComponentPlan {
  /** O tamanho que a tabela sorteou. */
  want: ArenaComponentCount;
  /** O tamanho que o pool entrega (≠ `want` quando relaxou). */
  got: ArenaComponentCount;
  /** A criatura (só quando `got >= 2`); `fresh` tira as já usadas na rodada enquanto sobrar alguma. */
  entry?: RosterEntry;
}

/**
 * O plano de UM inimigo: tamanho sorteado → relaxado → criatura. Usa UM número `v` em [0,1): o tamanho sai da faixa (pesos) e o índice
 * da criatura dos bits baixos do mesmo `v`. Estágio fora da tabela = `undefined` (quem chama segue o sorteio de sempre).
 */
export function planArenaComponents(stage: EnemyStage, runElement: string, v: number, used: ReadonlySet<string> = new Set()): ArenaComponentPlan | undefined {
  const want = drawComponentCount(stage, v);
  if (!want) return undefined;
  const pool = combinedPoolOf(stage, runElement);
  const got = relaxComponentCount(want, new Set(pool.keys()));
  if (got === 1) return { want, got };
  const all = pool.get(got)!;
  const fresh = all.filter(e => !used.has(e.id));
  const list = fresh.length > 0 ? fresh : all;
  const frac = (x: number) => x - Math.floor(x);
  return { want, got, entry: list[Math.min(list.length - 1, Math.floor(frac(v * 1048576) * list.length))] };
}
