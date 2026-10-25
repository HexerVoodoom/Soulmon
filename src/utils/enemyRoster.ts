/**
 * ROSTER DE INIMIGOS — dono único de "quem pode aparecer, em que estágio e a partir de que level" (M10, 25/10/2026).
 *
 * Existe: 17 criaturas base (1 por elemento) × rookie/champion/ultimate/mega (Ultra é só o chefe da Arena, não sorteia aqui)
 * + 138 rookies de elemento COMBINADO (arte em `assets/soulmon/novos-arquivo/combinados`, só a forma rookie). DADOS PUROS, sem
 * asset: a arte entra por `enemyRosterArt.ts`/`novosSoulmon.ts`, e a Arena/testes importam este módulo sem puxar PNG.
 *
 * PROGRESSÃO (arte, nunca força): a força do inimigo continua sendo do SLOT da escada (`dungeonFoe`); o level do jogador só
 * decide até que estágio de ARTE o slot pode mostrar. Level baixo vê só rookie (de qualquer elemento, base ou combinado);
 * champion/ultimate/mega abrem com o avanço. Os limiares são o 1º level de cada estágio do jogador (`STAGE_LEVEL_CAPS`:
 * rookie 1–6, champion 7–13, ultimate 14–21, mega 22–30), para o inimigo "subir de forma" junto com quem o enfrenta.
 *
 * CHAVE DO BESTIÁRIO: `${id}-${estágio}` (ex.: `fogo`→`embrit-champion`, `cmb003-rookie`). É a mesma de `enemyKey` em
 * `dungeon.ts`; o id não tem hífen (`novoDataOfStage` corta no 1º).
 */
import { NOVOS_DATA, novoHasForm, novoFormName, type NovoAttack } from './novosSoulmonData';
import { COMBINADOS_DATA } from './enemyRosterData';

export type EnemyStage = 'rookie' | 'champion' | 'ultimate' | 'mega';
export const ENEMY_STAGES: readonly EnemyStage[] = ['rookie', 'champion', 'ultimate', 'mega'];

/** Primeiro level do jogador em que cada estágio de ARTE de inimigo pode aparecer. Rookie sempre. */
export const ENEMY_STAGE_UNLOCK_LEVEL: Readonly<Record<EnemyStage, number>> = {
  rookie: 1,
  champion: 7,
  ultimate: 14,
  mega: 22,
};

export interface RosterEntry {
  /** `${id}-${stage}` — a chave do bestiário. */
  key: string;
  id: string;
  stage: EnemyStage;
  kind: 'base' | 'combinado';
  /** Elemento de combate (nos combinados, o 1º componente). */
  element: string;
  /** Nos combinados, os dois elementos; nos base, só o próprio. */
  elements: readonly string[];
  name: string;
  basico: NovoAttack;
  especial: NovoAttack;
  /** Nos combinados: o `NNN-slug` do arquivo de arte. */
  artFile?: string;
}

const BASE_BY_ELEMENT = Object.fromEntries(NOVOS_DATA.map(n => [n.element, n]));
export const chaveBestiario = (id: string, stage: string): string => `${id}-${stage}`;

function build(): RosterEntry[] {
  const out: RosterEntry[] = [];
  for (const n of NOVOS_DATA) {
    for (const stage of ENEMY_STAGES) {
      if (!novoHasForm(n.id, stage)) continue;
      out.push({
        key: chaveBestiario(n.id, stage), id: n.id, stage, kind: 'base', element: n.element, elements: [n.element],
        name: novoFormName(n, stage), basico: n.basico, especial: n.especial,
      });
    }
  }
  for (const [num, slug, name, e1, e2] of COMBINADOS_DATA) {
    const base = BASE_BY_ELEMENT[e1];
    const id = `cmb${num}`;
    out.push({
      key: chaveBestiario(id, 'rookie'), id, stage: 'rookie', kind: 'combinado', element: e1, elements: [e1, e2],
      name, basico: base.basico, especial: base.especial, artFile: `${num}-${slug}`,
    });
  }
  return out;
}

/** Tudo que existe (base + combinados). */
export const ENEMY_ROSTER: readonly RosterEntry[] = build();
export const ENEMY_ROSTER_KEYS: ReadonlySet<string> = new Set(ENEMY_ROSTER.map(e => e.key));
const BY_KEY: ReadonlyMap<string, RosterEntry> = new Map(ENEMY_ROSTER.map(e => [e.key, e]));
export const rosterEntryOfKey = (key: string | undefined | null): RosterEntry | undefined => (key ? BY_KEY.get(key) : undefined);

/** O maior estágio de arte liberado para o level (rookie para qualquer level inválido). */
export function maxEnemyStageForLevel(level: number): EnemyStage {
  const lv = Number.isFinite(level) ? level : 1;
  let best: EnemyStage = 'rookie';
  for (const s of ENEMY_STAGES) if (lv >= ENEMY_STAGE_UNLOCK_LEVEL[s]) best = s;
  return best;
}

/** O estágio pedido, rebaixado ao teto do level. */
export function capEnemyStage(requested: EnemyStage, level: number): EnemyStage {
  const max = maxEnemyStageForLevel(level);
  return ENEMY_STAGES.indexOf(requested) > ENEMY_STAGES.indexOf(max) ? max : requested;
}

/**
 * Sorteia UM inimigo respeitando a progressão. `opts.stage` = o estágio que o slot pede (rebaixado ao teto do level); sem ele,
 * sorteia entre os estágios liberados (1 chamada de `rng` a mais). `opts.used` = ids já na onda: saem do sorteio enquanto
 * sobrar alguém. Determinístico dado `rng`.
 */
export function pickEnemy(
  level: number, rng: () => number, opts: { stage?: EnemyStage; used?: ReadonlySet<string> } = {},
): RosterEntry {
  const max = maxEnemyStageForLevel(level);
  let stage: EnemyStage;
  if (opts.stage) stage = capEnemyStage(opts.stage, level);
  else {
    const open = ENEMY_STAGES.slice(0, ENEMY_STAGES.indexOf(max) + 1);
    stage = open[Math.floor(rng() * open.length)];
  }
  const have = ENEMY_ROSTER.filter(e => e.stage === stage);
  const fresh = opts.used ? have.filter(e => !opts.used!.has(e.id)) : have;
  const pool = fresh.length > 0 ? fresh : have;
  return pool[Math.floor(rng() * pool.length)];
}
