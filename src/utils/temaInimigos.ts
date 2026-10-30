/**
 * INIMIGOS TEMÁTICOS (30/10/2026, pedido do dono) — DADOS PUROS, sem asset. Dois rosters pequenos criados "do jeito da Soul
 * Barrage" (um filtro de roster por tema), mas com criaturas PRÓPRIAS:
 *  · `GROVE_RAIDERS`  — as pragas que atacam o Plantio do clã (Bosque): natureza arcana corrompida + digital, nada de engrenagem;
 *  · `BARRAGE_ROSTER` — o elenco renovado da Soul Barrage (só ESPAÇO, regra N6 da rodada 4: estágio e quantidade dão a dificuldade).
 * Cada criatura tem UM elemento (regra "um sprite = um elemento", `spriteElement.ts`, chave `tema:<id>`), golpes próprios e a
 * forma (estágio). Viram `RosterEntry` com `kind: 'api'` (inimigo "à parte": fora da distribuição por elemento e FORA do
 * `ENEMY_ROSTER` — não aparecem na masmorra). A arte entra por `temaInimigosArt.ts` (import.meta.glob + placeholder).
 * Fila de arte: `E:/tmp/fila-inimigos-novos.json` (prompts ChatGPT). REGISTRO §204.
 */
import type { EnemyStage, RosterEntry } from './enemyRoster';
import type { NovoAttack } from './novosSoulmonData';

type Linha = readonly [id: string, stage: Exclude<EnemyStage, 'mega'>, name: string, element: string, basico: NovoAttack, especial: NovoAttack];

/** As pragas do Bosque: [id, forma, nome, elemento, básico, especial]. */
export const GROVE_RAIDERS_DATA: readonly Linha[] = [
  ['blightmite', 'rookie', 'Blightmite', 'vileza', { pt: 'Mordida Ferrugem-de-Folha', en: 'Leafrust Bite' }, { pt: 'Nuvem de Míldio', en: 'Mildew Cloud' }],
  ['rotwing', 'rookie', 'Rotwing', 'morte', { pt: 'Pó de Asa Murcha', en: 'Wilt Dust' }, { pt: 'Revoada Podre', en: 'Rot Swarm' }],
  ['glitchloc', 'rookie', 'Glitchloc', 'eletricidade', { pt: 'Salto Estático', en: 'Static Hop' }, { pt: 'Praga de Pixels', en: 'Pixel Plague' }],
  ['hexroot', 'champion', 'Hexroot', 'sombra', { pt: 'Raiz Estranguladora', en: 'Choking Root' }, { pt: 'Sombra Sob o Solo', en: 'Underroot Shade' }],
  ['runeblight', 'champion', 'Runeblight', 'arcano', { pt: 'Runa Corroída', en: 'Corroded Rune' }, { pt: 'Selo de Ruína', en: 'Ruin Seal' }],
];

/** O elenco renovado da Soul Barrage (todos ESPAÇO): 3 rookies, 2 champions, 1 ultimate. */
export const BARRAGE_ROSTER_DATA: readonly Linha[] = [
  ['starmite', 'rookie', 'Starmite', 'espaco', { pt: 'Faísca Estelar', en: 'Star Spark' }, { pt: 'Chuva de Poeira', en: 'Dust Shower' }],
  ['cometail', 'rookie', 'Cometail', 'espaco', { pt: 'Rabo de Cometa', en: 'Comet Tail' }, { pt: 'Rasante Orbital', en: 'Orbital Dive' }],
  ['voidwisp', 'rookie', 'Voidwisp', 'espaco', { pt: 'Toque do Vazio', en: 'Void Touch' }, { pt: 'Piscar Sideral', en: 'Sidereal Blink' }],
  ['orbiscale', 'champion', 'Orbiscale', 'espaco', { pt: 'Escama Lunar', en: 'Moon Scale' }, { pt: 'Anéis em Órbita', en: 'Orbit Rings' }],
  ['nebuleech', 'champion', 'Nebuleech', 'espaco', { pt: 'Sucção Nebular', en: 'Nebula Drain' }, { pt: 'Véu de Gás', en: 'Gas Veil' }],
  ['eclipsar', 'ultimate', 'Eclipsar', 'espaco', { pt: 'Coroa de Eclipse', en: 'Eclipse Crown' }, { pt: 'Colapso Estelar', en: 'Stellar Collapse' }],
];

const entry = ([id, stage, name, element, basico, especial]: Linha): RosterEntry => ({
  key: `${id}-${stage}`, id, stage, kind: 'api', element, elements: [element], name, basico, especial, artFile: `${id}-${stage}`,
});

export const GROVE_RAIDERS: readonly RosterEntry[] = GROVE_RAIDERS_DATA.map(entry);
export const BARRAGE_ROSTER: readonly RosterEntry[] = BARRAGE_ROSTER_DATA.map(entry);
/** Todos os temáticos (para o `spriteElement` e a fila de arte). */
export const TEMA_INIMIGOS: readonly RosterEntry[] = [...GROVE_RAIDERS, ...BARRAGE_ROSTER];
