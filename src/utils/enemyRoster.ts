/**
 * ROSTER DE INIMIGOS — dono único de "quem pode aparecer, em que estágio e a partir de que level" (M10, 25/10/2026).
 *
 * Existe: 20 criaturas base (1 por elemento; contrato em enemyRoster.test.ts) × rookie/champion/ultimate/mega (Ultra é só o chefe da Arena, não sorteia aqui)
 * + 40 ramos evoluídos × champion/ultimate/mega (`RAMOS_INIMIGOS_DATA`, REGISTRO §220) + 5 inimigos da API "à parte" (27/10/2026, `INIMIGOS_API_DATA`: não contam na distribuição por elemento, podem repetir elemento) + 138 rookies de elemento COMBINADO (arte em `assets/soulmon/novos-arquivo/combinados`, só a forma rookie). DADOS PUROS, sem
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
import { COMBINADOS_LOTE3_DATA } from './elementosLote3.data';
import { COMBINADOS_DATA, INIMIGOS_API_DATA, RAMOS_INIMIGOS_DATA } from './enemyRosterData';
import { COMBINADOS_LOTE1_DATA } from './elementosLote1.data';
import { COMBINADOS_LOTE2_DATA } from './elementosLote2.data';

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
  kind: 'base' | 'combinado' | 'api' | 'mascote' | 'ramo';
  /** Elemento do SPRITE e dos golpes dele (`spriteElement.ts`): nos combinados, o id FUNDIDO (= slug da arte, ex.: fogo+agua → `vapor`); nos base, o próprio. */
  element: string;
  /** Nos combinados, os dois COMPONENTES (a tabela de vantagem é só das 17 bases); nos base, só o próprio. */
  elements: readonly string[];
  name: string;
  basico: NovoAttack;
  especial: NovoAttack;
  /** Nos combinados: o `NNN-slug` do arquivo de arte; nos `api`: `<id>-<estágio>`; nos `ramo`: `<elemento>/<ramo>-<estágio>`. */
  artFile?: string;
  /** Nos `api`: o nº do sprite no banco Higgsfield (rastreio). */
  bancoN?: number;
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
      key: chaveBestiario(id, 'rookie'), id, stage: 'rookie', kind: 'combinado', element: slug, elements: [e1, e2],
      name, basico: base.basico, especial: base.especial, artFile: `${num}-${slug}`,
    });
  }
  // lote 1 dos elementos curados (trios): 2 primeiros componentes mandam nos golpes, como os outros trios
  for (const [num, slug, name, e1, e2] of COMBINADOS_LOTE1_DATA) {
    const base = BASE_BY_ELEMENT[e1];
    const id = `cmb${num}`;
    out.push({
      key: chaveBestiario(id, 'rookie'), id, stage: 'rookie', kind: 'combinado', element: slug, elements: [e1, e2],
      name, basico: base.basico, especial: base.especial, artFile: `${num}-${slug}`,
    });
  }
  // lote 2 dos elementos curados (trios): 2 primeiros componentes mandam nos golpes, como os outros trios
  for (const [num, slug, name, e1, e2] of COMBINADOS_LOTE2_DATA) {
    const base = BASE_BY_ELEMENT[e1];
    const id = `cmb${num}`;
    out.push({
      key: chaveBestiario(id, 'rookie'), id, stage: 'rookie', kind: 'combinado', element: slug, elements: [e1, e2],
      name, basico: base.basico, especial: base.especial, artFile: `${num}-${slug}`,
    });
  }
  for (const [id, stage, name, el, num] of INIMIGOS_API_DATA) {
    const base = BASE_BY_ELEMENT[el];
    out.push({
      key: chaveBestiario(id, stage), id, stage, kind: 'api', element: el, elements: [el],
      name, basico: base.basico, especial: base.especial, artFile: `${id}-${stage}`, bancoN: num,
    });
  }
  // lote 3 dos elementos curados (4 componentes): 2 primeiros mandam nos golpes
  for (const [num, slug, name, e1, e2] of COMBINADOS_LOTE3_DATA) {
    const base = BASE_BY_ELEMENT[e1];
    const id = `cmb${num}`;
    out.push({
      key: chaveBestiario(id, 'rookie'), id, stage: 'rookie', kind: 'combinado', element: slug, elements: [e1, e2],
      name, basico: base.basico, especial: base.especial, artFile: `${num}-${slug}`,
    });
  }
  return out;
}

/**
 * O CORVO NEUTRO (dono, 31/10/2026, REGISTRO §206): o mascote é a ÚNICA criatura de elemento `neutro`. Forma única (sem evolução),
 * fora de todo pool comum: aparece só pelo `withRaven` (1 em `RAVEN_SPAWN_CHANCE⁻¹` por sorteio de inimigo, em todo evento que gera criatura).
 */
export const RAVEN_ID = 'corvo';
export const RAVEN_ENTRY: RosterEntry = {
  key: chaveBestiario(RAVEN_ID, 'rookie'), id: RAVEN_ID, stage: 'rookie', kind: 'mascote', element: 'neutro', elements: ['neutro'],
  name: 'Corvinho', basico: { pt: 'Bicada de Lanterna', en: 'Lantern Peck' }, especial: { pt: 'Fagulha Turquesa', en: 'Turquoise Ember' },
  artFile: 'corvo-neutro',
};
/** Chance por SORTEIO de inimigo de o corvo aparecer no lugar do sorteado: 1/1000 (dono). */
export const RAVEN_SPAWN_CHANCE = 1 / 1000;

/**
 * O PORTÃO CENTRAL do corvo: roda `pick` com o `rng` do chamador (a sequência de sorteios NÃO muda) e, se o PRIMEIRO número que o
 * sorteio consumiu for < `RAVEN_SPAWN_CHANCE`, troca o resultado pelo corvo (`raven()`). Probabilidade exata = 1/1000 por chamada
 * (o 1º número é uniforme) e nenhum `rng()` a mais: card e luta da Arena, ondas da masmorra e replays seguem determinísticos.
 */
export function withRaven<T>(rng: () => number, pick: (r: () => number) => T, raven: () => T): T {
  let first: number | undefined;
  const r = () => { const v = rng(); if (first === undefined) first = v; return v; };
  const out = pick(r);
  return first !== undefined && first < RAVEN_SPAWN_CHANCE ? raven() : out;
}

/**
 * OS RAMOS EVOLUÍDOS (dono, 04/11/2026, REGISTRO §220): só existem em champion/ultimate/mega e só saem de `pickEnemy` com level FINITO, dentro do
 * teto de `ENEMY_STAGE_UNLOCK_LEVEL`. Entram no FIM do roster: o número `#N` das células do Bestiário dos que já existiam não muda.
 */
function buildRamos(): RosterEntry[] {
  const out: RosterEntry[] = [];
  for (const [creature, el, ramo, champion, ultimate, mega] of RAMOS_INIMIGOS_DATA) {
    const base = BASE_BY_ELEMENT[el];
    const id = `${creature}${ramo}`;
    for (const [stage, name] of [['champion', champion], ['ultimate', ultimate], ['mega', mega]] as const) {
      out.push({
        key: chaveBestiario(id, stage), id, stage, kind: 'ramo', element: el, elements: [el],
        name, basico: base.basico, especial: base.especial, artFile: `${el}/${ramo}-${stage}`,
      });
    }
  }
  return out;
}

/**
 * Fatia do sorteio de um estágio que vai para os ramos (pedido: não afogar os atuais): 1 em 3, repartida entre os 40 do estágio.
 * Sem isto, o sorteio uniforme daria 40/62 (65%) em champion. Ajuste aqui; o guarda em `enemyRoster.test.ts` mede a fatia.
 */
export const RAMO_CHANCE = 1 / 3;

/**
 * RAMO SEM RNG A MAIS (Arena e Desgarrado do Torneio, §221): quem já gasta UM número `u` do `rng` para escolher a criatura decide o ramo
 * com os bits BAIXOS do mesmo `u` (mulberry32 dá 32 bits; o índice da criatura usa os altos), então a CONTAGEM de chamadas de `rng`
 * não muda e card = luta segue valendo. `hit` = 1 em `RAMO_CHANCE`; `pick` = índice em `n` ramos.
 */
export function ramoFromRoll(u: number, n: number): { hit: boolean; pick: number } {
  const frac = (x: number) => x - Math.floor(x);
  return { hit: n > 0 && frac(u * 4096) < RAMO_CHANCE, pick: n > 0 ? Math.min(n - 1, Math.floor(frac(u * 16777216) * n)) : 0 };
}

/** Tudo que existe (base + combinados + o corvo, que só sai pelo `withRaven` + os ramos). */
export const ENEMY_ROSTER: readonly RosterEntry[] = [...build(), RAVEN_ENTRY, ...buildRamos()];
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
 * sobrar alguém. `opts.semRamos` = fora os ramos (quem pede arte alta sem olhar o level do jogador, ex.: chefe do Elemental Fusion); level
 * desconhecido (infinito) também não sorteia ramo. Determinístico dado `rng`; continua 1 só chamada de `rng` para escolher a entrada.
 */
export function pickEnemy(
  level: number, rng: () => number, opts: { stage?: EnemyStage; used?: ReadonlySet<string>; semRamos?: boolean } = {},
): RosterEntry {
  return withRaven(rng, r => pickEnemyComum(level, r, opts), () => RAVEN_ENTRY);
}

function pickEnemyComum(
  level: number, rng: () => number, opts: { stage?: EnemyStage; used?: ReadonlySet<string>; semRamos?: boolean },
): RosterEntry {
  const max = maxEnemyStageForLevel(level);
  let stage: EnemyStage;
  if (opts.stage) stage = capEnemyStage(opts.stage, level);
  else {
    const open = ENEMY_STAGES.slice(0, ENEMY_STAGES.indexOf(max) + 1);
    stage = open[Math.floor(rng() * open.length)];
  }
  const comRamos = Number.isFinite(level) && !opts.semRamos;
  const have = ENEMY_ROSTER.filter(e => e.stage === stage && e.kind !== 'mascote' && (comRamos || e.kind !== 'ramo'));
  const fresh = opts.used ? have.filter(e => !opts.used!.has(e.id)) : have;
  const pool = fresh.length > 0 ? fresh : have;
  const ramos = pool.filter(e => e.kind === 'ramo');
  const outros = pool.filter(e => e.kind !== 'ramo');
  const u = rng();
  if (ramos.length === 0 || outros.length === 0) return pool[Math.floor(u * pool.length)];
  return u < RAMO_CHANCE
    ? ramos[Math.floor((u / RAMO_CHANCE) * ramos.length)]
    : outros[Math.min(outros.length - 1, Math.floor(((u - RAMO_CHANCE) / (1 - RAMO_CHANCE)) * outros.length))];
}
