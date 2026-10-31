/**
 * O ELEMENTO DE CADA SPRITE — dono único (30/10/2026, decisão do dono: "um sprite tem UM elemento e ele vale em TODO lugar").
 *
 * O elemento da criatura E os dos golpes dela (básico e especial) são este. Nada de hash/sorteio para criatura com arte conhecida.
 * DADOS PUROS (sem import de PNG): a Arena, o servidor-espelho e os testes importam sem puxar asset.
 * Tabela completa + evidência por sprite: `docs/ELEMENTO-POR-SPRITE.md`. Contrato: `spriteElement.contract.test.ts`.
 *
 * Chaves (`SPRITE_ELEMENT`):
 *  · `novo:<elemento>`   — as 20 criaturas base (`novos/<elemento>-<estágio>.png`, o prefixo do arquivo É o elemento);
 *  · `cmb:<NNN>`         — os 211 rookies combinados: o elemento é o id FUNDIDO (slug do arquivo = `combination` do manifest);
 *  · `api:<id>`          — inimigos da API (`inimigos-api/`);
 *  · `starter:<id>`      — os 5 iniciais (`STARTER_ELEMENT`);
 *  · `line:<id>`         — as 4 linhas de `lines/` (kaelen/thalindra/igni/astrase);
 *  · `boss:<id>`         — os 25 chefes de `bosses/` (1º elemento do roster de chefes);
 *  · `desafiante:<id>`   — os 3 desafiantes do Torneio;
 *  · `tema:<id>`         — inimigos temáticos (pragas do Bosque + elenco da Soul Barrage, `temaInimigos.ts`).
 */
import { NOVOS_DATA } from './novosSoulmonData';
import { COMBINADOS_LOTE3_DATA } from './elementosLote3.data';
import { COMBINADOS_DATA, INIMIGOS_API_DATA } from './enemyRosterData';
import { STARTER_ELEMENT } from './starterElements';
import { TEMA_INIMIGOS } from './temaInimigos';

/** As linhas de `lines/`: elemento pelo texto de apresentação delas (bio PT/EN em `PREMADE_CHARACTERS`, c11dc49d). */
export const LINE_ELEMENT: Readonly<Record<string, string>> = {
  kaelen: 'fogo',     // "espírito de chamas contidas, forjado em brasa"
  thalindra: 'luz',   // "presença dourada e serena, tecida a partir de luz calma"
  igni: 'fogo',       // "lagarto de brasa que carrega a fornalha nas costas"
  astrase: 'luz',     // "coruja rosada que guarda uma luz mansa sob as asas"
};

/** Linha antiga da masmorra → o chefe cuja arte ela mostra hoje (`DUNGEON_LINE_SPRITES`, 21/10/2026). */
export const LINE_BOSS_ART: Readonly<Record<string, string>> = {
  kaelen: 'cinderhorn', thalindra: 'corallume', igni: 'obsidarch', astrase: 'glimmerswarm',
};

/** Desafiantes do Torneio (comentário de `tournamentNpcs.ts`: planta espinhosa, cristal, aquática). */
export const DESAFIANTE_ELEMENT: Readonly<Record<string, string>> = {
  'npc-espina': 'planta', 'npc-quartzo': 'cristal', 'npc-mare': 'agua',
};

/** Chefes de `bosses/`: 1º elemento listado em `BOSS_ROSTER` (o roster dá 2 a 4 ids por chefe; o 1º é o de nascimento do prompt). Teste de contrato compara com o roster. */
export const BOSS_ELEMENT: Readonly<Record<string, string>> = {
  'arauto-do-fim': 'juizo_final',
  'cinderhorn': 'fervor',
  'thrummer': 'tempestade',
  'squallstride': 'trovao',
  'orbitant': 'peso_descomunal',
  'mycelar': 'miasma',
  'obsidarch': 'obsidiana',
  'bladeveil': 'lamina_viva',
  'sabrefin': 'lamina_oculta',
  'glimmerswarm': 'alento',
  'corallume': 'mare',
  'halorune': 'runa',
  'chorale': 'cristal',
  'drifela': 'nascente',
  'hollowmere': 'florescer',
  'astrawing': 'estratosfera',
  'nebulara': 'nebulosa',
  'voltbloom': 'sinapse',
  'graftfang': 'mutacao',
  'duskveil': 'crepusculo',
  'dawnloom': 'aurora',
  'aeonyx': 'eon',
  'tallyjack': 'ouro_vivo',
  'cuprex': 'aco',
};

function build(): Record<string, string> {
  const t: Record<string, string> = {};
  for (const n of NOVOS_DATA) t[`novo:${n.element}`] = n.element;
  for (const [num, slug] of COMBINADOS_DATA) t[`cmb:${num}`] = slug; // slug do arquivo = id fundido (manifest.combination)
  for (const [num, slug] of COMBINADOS_LOTE3_DATA) t[`cmb:${num}`] = slug; // lote 3
  for (const [id, , , el] of INIMIGOS_API_DATA) t[`api:${id}`] = el;
  for (const [id, el] of Object.entries(STARTER_ELEMENT)) t[`starter:${id}`] = el;
  for (const [id, el] of Object.entries(LINE_ELEMENT)) t[`line:${id}`] = el;
  for (const [id, el] of Object.entries(BOSS_ELEMENT)) t[`boss:${id}`] = el;
  for (const [id, el] of Object.entries(DESAFIANTE_ELEMENT)) t[`desafiante:${id}`] = el;
  for (const e of TEMA_INIMIGOS) t[`tema:${e.id}`] = e.element;
  return t;
}
export const SPRITE_ELEMENT: Readonly<Record<string, string>> = build();

/** Elemento de um sprite pela chave canônica (`novo:fogo`, `cmb:001`…); `undefined` se não houver arte conhecida. */
export function spriteElementOf(key: string | null | undefined): string | undefined {
  return key ? SPRITE_ELEMENT[key] : undefined;
}

/** Elemento de uma linha antiga (a arte exibida é a do chefe correspondente). */
export function lineElementOf(line: string | null | undefined): string | undefined {
  const boss = line ? LINE_BOSS_ART[line] : undefined;
  return boss ? SPRITE_ELEMENT[`boss:${boss}`] : undefined;
}

/** Elemento de uma entrada do roster (`RosterEntry`): base = o próprio; combinado = o id FUNDIDO (não o 1º componente); api = o escolhido. */
export function rosterEntryElement(e: { kind: 'base' | 'combinado' | 'api'; id: string; element: string; artFile?: string }): string {
  if (e.kind === 'combinado' && e.artFile) return SPRITE_ELEMENT[`cmb:${e.artFile.split('-')[0]}`] ?? e.element;
  return e.element;
}
