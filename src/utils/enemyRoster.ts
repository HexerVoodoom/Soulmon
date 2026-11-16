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
import { ELEMENTO_FORMA_OVERRIDE } from './soulmonOverrides';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { curatedComponents } from './elementosCurados';
import { COMBINADOS_LOTE4_DATA } from './elementosLote4.data';
import { COMBINADOS_DATA, INIMIGOS_API_DATA, ELENCO_ORACULO_DATA, INIMIGOS_DUO_DATA, PARALELOS_DATA, RAMOS_INIMIGOS_DATA } from './enemyRosterData';
import { ULTIMATES_2COMP_DATA } from './enemyRosterUltimates';
import { COMBINADOS_LOTE1_DATA } from './elementosLote1.data';
import { COMBINADOS_LOTE2_DATA } from './elementosLote2.data';
import { escolherCelula } from './dificuldadeEstagio';
import { FORMAS_PACOTE_A_DATA } from './formasPacoteA.data';
import { LEGADO_DATA } from './enemyRosterLegado.data';

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
  kind: 'base' | 'combinado' | 'api' | 'mascote' | 'ramo' | 'paralelo' | 'forma';
  /** Elemento do SPRITE e dos golpes dele (`spriteElement.ts`): nos combinados, o id FUNDIDO (= slug da arte, ex.: fogo+agua → `vapor`); nos base, o próprio. */
  element: string;
  /** Nos combinados, os dois COMPONENTES (a tabela de vantagem é só das 17 bases); nos base, só o próprio. */
  elements: readonly string[];
  name: string;
  basico: NovoAttack;
  especial: NovoAttack;
  /** Nos combinados: o `NNN-slug` do arquivo de arte; nos `api`: `<id>-<estágio>`; nos `ramo`: `<elemento>/<ramo>-<estágio>`; nos `paralelo`: `<id>-<estágio>`; nos `forma`: `NNN-slug-<estágio>`. */
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
  // lote 4 (05/11/2026: planta/industrial/fada, 3 trios e 3 de 4 componentes): 2 primeiros mandam nos golpes
  for (const [num, slug, name, e1, e2] of COMBINADOS_LOTE4_DATA) {
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

/**
 * AS FORMAS PARALELAS (dono, 09/11/2026): Champion e Ultimate alternativos (derivados do lagarto-dragão de fogo) em 5 elementos. Só saem
 * quando o ELEMENTO é pedido (`pickEnemy({element})`, Arena de run do elemento): ficam fora do sorteio comum, que não muda. Entram no FIM
 * do roster (o `#N` das células do Bestiário que já existiam não muda). Os golpes são os da criatura base do elemento dos golpes.
 */
function buildParalelos(): RosterEntry[] {
  const out: RosterEntry[] = [];
  for (const [id, el, comps, golpesDe, champion, ultimate] of PARALELOS_DATA) {
    const base = BASE_BY_ELEMENT[golpesDe];
    for (const [stage, name] of [['champion', champion], ['ultimate', ultimate]] as const) {
      out.push({
        key: chaveBestiario(id, stage), id, stage, kind: 'paralelo', element: el, elements: [...comps],
        name, basico: base.basico, especial: base.especial, artFile: `${id}-${stage}`,
      });
    }
  }
  return out;
}

/**
 * ULTIMATES SÓ-ULTIMATE de 2 componentes (15/11/2026, REGISTRO §405): kind `paralelo`, sem Champion. Entram no FIM de tudo (o `#N` não muda). Como
 * os paralelos de antes, ficam fora do sorteio comum; a Arena os pega pela tabela de componentes (`combinedPoolOf`).
 */
function buildUltimates2Comp(): RosterEntry[] {
  return ULTIMATES_2COMP_DATA.map(([id, par, comps, golpesDe, name]) => {
    const base = BASE_BY_ELEMENT[golpesDe];
    return {
      key: chaveBestiario(id, 'ultimate'), id, stage: 'ultimate' as const, kind: 'paralelo' as const, element: par, elements: [...comps],
      name, basico: base.basico, especial: base.especial, artFile: `${id}-ultimate`,
    };
  });
}

/**
 * AS FORMAS DOS COMBINADOS 212-261 (dono, 09/11/2026: "usar as formas Champion/Ultimate/Mega já instaladas"): os 50 elementos curados
 * (lotes 1-3) tinham só o rookie; os 150 PNG de `novos-arquivo/combinados-formas/` agora são a forma champion/ultimate/mega DO MESMO elemento.
 * Só saem quando o ELEMENTO é pedido (`pickEnemy({element})`, Fenda): ficam FORA do sorteio comum de estágio, como as paralelas. Mesmas
 * regras de abertura de estágio (champion no Lv 7, ultimate no 14, mega no 22). Golpes e componentes iguais aos do rookie. Entram no FIM
 * do roster (o `#N` do Bestiário não muda).
 */
export const SUFIXO_FORMA: Readonly<Record<'champion' | 'ultimate' | 'mega', string>> = { champion: 'aris', ultimate: 'axion', mega: 'alune' };
/** Nome proposto da forma: o do rookie sem a vogal final + sufixo do estágio (Geyzor → Geyzoraris). O dono pode vetar. */
export const nomeDaForma = (rookie: string, stage: 'champion' | 'ultimate' | 'mega'): string => rookie.replace(/[aeiouy]+$/i, '') + SUFIXO_FORMA[stage];

function buildFormasCombinados(): RosterEntry[] {
  const out: RosterEntry[] = [];
  for (const [num, slug, name, e1, e2] of [...COMBINADOS_LOTE1_DATA, ...COMBINADOS_LOTE2_DATA, ...COMBINADOS_LOTE3_DATA]) {
    const base = BASE_BY_ELEMENT[e1];
    const id = `cmb${num}`;
    for (const stage of ['champion', 'ultimate', 'mega'] as const) {
      out.push({
        key: chaveBestiario(id, stage), id, stage, kind: 'forma', element: slug, elements: [e1, e2],
        name: nomeDaForma(name, stage), basico: base.basico, especial: base.especial, artFile: `${num}-${slug}-${stage}`,
      });
    }
  }
  return out;
}

/** Sufixos de reserva por estágio, usados só quando `nomeDaForma` bate num nome já tomado (rookies com a mesma raiz). */
const SUFIXOS_RESERVA: Readonly<Record<'champion' | 'ultimate' | 'mega', readonly string[]>> = { champion: ['oris', 'uris'], ultimate: ['oxion', 'uxion'], mega: ['olune', 'ulune'] };

/**
 * AS FORMAS DO PACOTE A (dono, 16/11/2026): pelo menos 1 forma por combinação no estágio dela (2 → champion, 3 → ultimate, 4 → mega; 205 PNG
 * em `combinados-formas/`, API alpha). Mesmo molde das formas 212-261: kind `forma`, FORA do sorteio comum, só saem com o elemento pedido; golpes e
 * componentes do rookie. Entram no FIM de tudo (o `#N` do Bestiário não muda). Nome único: `nomeDaForma` e, se já tomado, um sufixo de reserva.
 */
function buildFormasPacoteA(rookies: readonly RosterEntry[], jaTomados: ReadonlySet<string>): RosterEntry[] {
  const porArte = new Map(rookies.filter(r => r.kind === 'combinado').map(r => [r.artFile, r] as const));
  const usados = new Set(jaTomados);
  const out: RosterEntry[] = [];
  for (const [artFile, estagios] of FORMAS_PACOTE_A_DATA) {
    const r = porArte.get(artFile);
    if (!r) throw new Error(`pacote A: rookie ${artFile} não existe`);
    for (const stage of estagios) {
      const raiz = r.name.replace(/[aeiouy]+$/i, '');
      const name = [nomeDaForma(r.name, stage), ...SUFIXOS_RESERVA[stage].map(s => raiz + s)].find(n => !usados.has(n));
      if (!name) throw new Error(`pacote A: sem nome livre para ${artFile}-${stage}`);
      usados.add(name);
      out.push({ key: chaveBestiario(r.id, stage), id: r.id, stage, kind: 'forma', element: r.element, elements: r.elements, name, basico: r.basico, especial: r.especial, artFile: `${artFile}-${stage}` });
    }
  }
  return out;
}

/**
 * OS 5 RAMOS LEGADOS (dono, 16/11/2026, REGISTRO §445): as formas antigas de som/eletricidade/tempo/arcano/marcial como ramo extra de outro elemento
 * (`LEGADO_DATA`). Mesmo molde dos ramos (kind `ramo`, golpes e elemento do hospedeiro), então entram no sorteio comum e no do elemento do hospedeiro
 * como qualquer ramo. Arte: `legado/<id>-<estágio>`. Entram no FIM de tudo (o `#N` do Bestiário não muda).
 */
function buildLegado(): RosterEntry[] {
  const out: RosterEntry[] = [];
  for (const [id, , , el, champion, ultimate, mega] of LEGADO_DATA) {
    const base = BASE_BY_ELEMENT[el];
    for (const [stage, name] of [['champion', champion], ['ultimate', ultimate], ['mega', mega]] as const) {
      out.push({ key: chaveBestiario(id, stage), id, stage, kind: 'ramo', element: el, elements: [el], name, basico: base.basico, especial: base.especial, artFile: `legado/${id}-${stage}` });
    }
  }
  return out;
}

/** As 2 cadeias da API (09/11/2026): kind `api`, entram no sorteio comum e no do elemento; no FIM do roster (o `#N` não muda). */
function buildDuo(): RosterEntry[] {
  const out: RosterEntry[] = [];
  for (const [id, el, comps, golpesDe, rookie, champion, ultimate] of INIMIGOS_DUO_DATA) {
    const base = BASE_BY_ELEMENT[golpesDe];
    for (const [stage, name] of [['rookie', rookie], ['champion', champion], ['ultimate', ultimate]] as const) {
      out.push({
        key: chaveBestiario(id, stage), id, stage, kind: 'api', element: el, elements: [...comps],
        name, basico: base.basico, especial: base.especial, artFile: `${id}-${stage}`,
      });
    }
  }
  return out;
}

/** O ELENCO DO ORÁCULO (10/11/2026): Mareoror e Salsolura, linha completa (rookie + 3 ramos × champion/ultimate/mega), kind `api`, no sorteio comum e no do elemento `vapor`; no FIM do roster. */
function buildElencoOraculo(): RosterEntry[] {
  const out: RosterEntry[] = [];
  for (const [id, el, comps, golpesDe, rookie, ramos] of ELENCO_ORACULO_DATA) {
    const base = BASE_BY_ELEMENT[golpesDe];
    out.push({ key: chaveBestiario(id, 'rookie'), id, stage: 'rookie', kind: 'api', element: el, elements: [...comps], name: rookie, basico: base.basico, especial: base.especial, artFile: `${id}-rookie` });
    for (const [ramo, nomes] of Object.entries(ramos)) {
      const rid = `${id}${ramo}`;
      (['champion', 'ultimate', 'mega'] as const).forEach((stage, i) => out.push({
        key: chaveBestiario(rid, stage), id: rid, stage, kind: 'api', element: el, elements: [...comps], name: nomes[i],
        basico: base.basico, especial: base.especial, artFile: `${id}-${ramo}-${stage}`,
      }));
    }
  }
  return out;
}

/** Tudo que existe (base + combinados + o corvo, que só sai pelo `withRaven` + os ramos + as formas paralelas + as formas dos combinados 212-261). */
/** REGISTRO §333: o elemento que o dono trocou na Tabela de Soulmons (`ELEMENTO_FORMA_OVERRIDE`). Troca `element` e os componentes; golpes, arte e chave ficam. */
function comElementoDoDono(e: RosterEntry): RosterEntry {
  const el = ELEMENTO_FORMA_OVERRIDE[e.key];
  if (!el) return e;
  const comps = DERIVED_ELEMENT_PAIRS.find(d => d.id === el)?.componentes ?? curatedComponents(el);
  return comps ? { ...e, element: el, elements: [...comps] } : e;
}
const ROOKIES_COMBINADOS = build();
const ANTES_DO_PACOTE_A = [...ROOKIES_COMBINADOS, RAVEN_ENTRY, ...buildRamos(), ...buildParalelos(), ...buildFormasCombinados(), ...buildDuo(), ...buildElencoOraculo(), ...buildUltimates2Comp()];
export const ENEMY_ROSTER: readonly RosterEntry[] = [...ANTES_DO_PACOTE_A, ...buildFormasPacoteA(ROOKIES_COMBINADOS, new Set(ANTES_DO_PACOTE_A.map(e => e.name))), ...buildLegado()].map(comElementoDoDono);
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
 * Sorteia UM inimigo respeitando a progressão. `opts.tabela` (REGISTRO §437, `dificuldadeEstagio.ts`): o nº de elementos sai da tabela §232
 * do ESTÁGIO (Champion 60% de 2, Ultimate 50% de 3…), com as formas de arte alta (`forma`/`paralelo`) no pool; célula vazia cai no vizinho
 * mais próximo; continua UMA chamada de `rng`. `opts.stage` = o estágio que o slot pede (rebaixado ao teto do level); sem ele,
 * sorteia entre os estágios liberados (1 chamada de `rng` a mais). `opts.used` = ids já na onda: saem do sorteio enquanto
 * sobrar alguém. `opts.semRamos` = fora os ramos (quem pede arte alta sem olhar o level do jogador, ex.: chefe do Elemental Fusion); level
 * desconhecido (infinito) também não sorteia ramo. Determinístico dado `rng`; continua 1 só chamada de `rng` para escolher a entrada.
 */
export function pickEnemy(
  level: number, rng: () => number, opts: { stage?: EnemyStage; used?: ReadonlySet<string>; semRamos?: boolean; element?: string; tabela?: boolean } = {},
): RosterEntry {
  // Masmorra temática (08/11/2026): com `element`, só criaturas DAQUELE elemento — o corvo (neutro) não entra, é um elemento de fora.
  if (opts.element) {
    const r = pickEnemyDoElemento(level, rng, { ...opts, element: opts.element });
    if (r) return r;
  }
  return withRaven(rng, r => pickEnemyComum(level, r, opts), () => RAVEN_ENTRY);
}

/**
 * O sorteio restrito a UM elemento (o id da criatura: o base, ou o fundido). O estágio pedido vale se o elemento tem criatura nele;
 * senão desce para o estágio mais baixo que tenha (os fundidos só têm `rookie`). Elemento sem criatura no roster → `undefined`
 * (quem chama cai no sorteio comum: nunca trava a escada). Uma só chamada de `rng`, como o sorteio comum.
 */
function pickEnemyDoElemento(
  level: number, rng: () => number, opts: { stage?: EnemyStage; used?: ReadonlySet<string>; semRamos?: boolean; element: string },
): RosterEntry | undefined {
  const pedido = capEnemyStage(opts.stage ?? maxEnemyStageForLevel(level), level);
  const comRamos = Number.isFinite(level) && !opts.semRamos;
  const doElemento = ENEMY_ROSTER.filter(e => e.element === opts.element && e.kind !== 'mascote' && (comRamos || e.kind !== 'ramo'));
  if (doElemento.length === 0) return undefined;
  let have: RosterEntry[] = [];
  for (let i = ENEMY_STAGES.indexOf(pedido); i >= 0 && have.length === 0; i--) have = doElemento.filter(e => e.stage === ENEMY_STAGES[i]);
  if (have.length === 0) {
    const menor = ENEMY_STAGES.find(st => doElemento.some(e => e.stage === st));
    have = doElemento.filter(e => e.stage === menor);
  }
  const fresh = opts.used ? have.filter(e => !opts.used!.has(e.id)) : have;
  const pool = fresh.length > 0 ? fresh : have;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}

function pickEnemyComum(
  level: number, rng: () => number, opts: { stage?: EnemyStage; used?: ReadonlySet<string>; semRamos?: boolean; tabela?: boolean },
): RosterEntry {
  const max = maxEnemyStageForLevel(level);
  let stage: EnemyStage;
  if (opts.stage) stage = capEnemyStage(opts.stage, level);
  else {
    const open = ENEMY_STAGES.slice(0, ENEMY_STAGES.indexOf(max) + 1);
    stage = open[Math.floor(rng() * open.length)];
  }
  const comRamos = Number.isFinite(level) && !opts.semRamos;
  if (opts.tabela) return pickEnemyPorTabela(stage, rng, comRamos, opts.used);
  const have = ENEMY_ROSTER.filter(e => e.stage === stage && e.kind !== 'mascote' && e.kind !== 'paralelo' && e.kind !== 'forma' && (comRamos || e.kind !== 'ramo'));
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

/**
 * O sorteio pela TABELA §232 (REGISTRO §437): o pool do estágio inclui as formas de arte alta (`forma`/`paralelo`: são elas que dão
 * combinados em Champion+). Um só `rng()`: ele escolhe a célula (nº de elementos) pela linha do estágio e, dentro da faixa, a criatura.
 * Célula 1 (elemento único) mantém a fatia dos ramos (`RAMO_CHANCE`). Sem repetir (`used`) enquanto sobrar alguém na célula.
 */
function pickEnemyPorTabela(stage: EnemyStage, rng: () => number, comRamos: boolean, used?: ReadonlySet<string>): RosterEntry {
  const todos = ENEMY_ROSTER.filter(e => e.stage === stage && e.kind !== 'mascote' && (comRamos || e.kind !== 'ramo'));
  const semUsados = used ? todos.filter(e => !used.has(e.id)) : todos;
  const base = semUsados.length > 0 ? semUsados : todos;
  // Células esgotadas pelo `used` ficam de fora enquanto outra tiver alguém novo; só então repete.
  const c = escolherCelula(base, stage, rng())!;
  const lista = c.lista;
  const ramos = lista.filter(e => e.kind === 'ramo');
  const outros = lista.filter(e => e.kind !== 'ramo');
  const f = c.frac;
  if (ramos.length === 0 || outros.length === 0) return lista[Math.min(lista.length - 1, Math.floor(f * lista.length))];
  return f < RAMO_CHANCE
    ? ramos[Math.min(ramos.length - 1, Math.floor((f / RAMO_CHANCE) * ramos.length))]
    : outros[Math.min(outros.length - 1, Math.floor(((f - RAMO_CHANCE) / (1 - RAMO_CHANCE)) * outros.length))];
}
