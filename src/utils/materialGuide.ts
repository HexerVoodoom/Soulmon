/**
 * GUIA DOS MATERIAIS (10/11/2026, pedido do dono) — para cada material/recurso da aba Materiais da Mochila: ONDE se consegue e PARA QUE SERVE.
 * Tudo DERIVADO do código real (nada escrito à mão que possa divergir): as receitas do Soulsmith (`FORGE_PIECES`), o cardápio do Restaurante
 * (`DISHES`), as expedições do Foco (`FOCUS_ENVIRONMENTS`), o prédio dono de cada material (`MATERIAL_BUILDING`) e as constantes de custo.
 * Só a Mochila (lazy, aba Materiais) importa este módulo — fora do chunk de entrada.
 *
 * Além dos 16 materiais de prédio (`buildingQuests.materials`), a aba lista os OUTROS recursos que o jogo concede e que antes não tinham
 * lugar no inventário: Fragmento do Soulsmith (`equipment.fragments`), Fragmento de Boss (`bossShards`) e as Essências dos elementos
 * (`essences`). Material sem uso HOJE diz isso com franqueza (`usoAinda`), em vez de inventar um.
 */
import { MATERIAL_BUILDING, type MaterialId } from './buildingQuests';
import { FORGE_PIECES, REDO_BITS, REDO_FRAGMENTS } from './forge';
import { itemName } from './equipmentCopy';
import { FOCUS_ENVIRONMENTS } from './focusExpedition';
import { DISHES } from './restaurant';
import { FRAGMENTS_PER_RUN } from './equipment';
import { DUNGEON_DEPTH_MARKS } from './dungeonIdle';
import { POTION_COSTS } from './elementPotion';
import { ESSENCE_BY_STAGE } from './essences';

export type ExtraMaterialId = 'soulsmith-fragment' | 'boss-shard' | 'essences';

export interface ExtraMaterialDef {
  readonly id: ExtraMaterialId;
  readonly icon: string;
  readonly namePt: string;
  readonly nameEn: string;
}

/** Os recursos que NÃO são material de prédio. A ordem é a da tela. */
export const EXTRA_MATERIALS: readonly ExtraMaterialDef[] = [
  { id: 'soulsmith-fragment', icon: '🔩', namePt: 'Fragmento do Soulsmith', nameEn: 'Soulsmith Fragment' },
  { id: 'boss-shard', icon: '💠', namePt: 'Fragmento de Boss', nameEn: 'Boss Shard' },
  { id: 'essences', icon: '💧', namePt: 'Essências', nameEn: 'Essences' },
];

export interface MaterialGuide {
  /** Onde conseguir (frase completa, sem o nome do prédio — quem chama costura o "Ir lá"). */
  readonly sources: string;
  /** Para que serve: uma linha por uso. Vazio = sem uso hoje (`usoAinda` diz isso). */
  readonly uses: readonly string[];
  /** Frase para quando não há uso hoje. */
  readonly usoAinda: string;
}

const lista = (xs: readonly string[], isPt: boolean): string =>
  xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} ${isPt ? 'e' : 'and'} ${xs[xs.length - 1]}`;

/** Onde cada material de prédio sai pelas EXPEDIÇÕES do Foco (além da missão diária do prédio). */
export function expeditionsOf(id: MaterialId): readonly (typeof FOCUS_ENVIRONMENTS)[number][] {
  return FOCUS_ENVIRONMENTS.filter(e => (e.materials as readonly string[]).includes(id));
}

/** Os usos de um material de prédio: peças do Soulsmith (principal/apoio) e pratos do Restaurante. */
export function usesOfMaterial(id: MaterialId, isPt: boolean): string[] {
  const out: string[] = [];
  const principal = FORGE_PIECES.filter(p => p.mats[0] === id).map(p => itemName(p.slot, p.tier, isPt));
  const apoio = FORGE_PIECES.filter(p => p.mats[1] === id).map(p => itemName(p.slot, p.tier, isPt));
  if (principal.length) {
    out.push(isPt
      ? `Soulsmith: material principal para aprimorar ${lista(principal, true)}.`
      : `Soulsmith: main material to upgrade the ${lista(principal, false)}.`);
  }
  if (apoio.length) {
    out.push(isPt
      ? `Soulsmith: material de apoio (a partir do nível 3) para aprimorar ${lista(apoio, true)}.`
      : `Soulsmith: support material (from level 3) to upgrade the ${lista(apoio, false)}.`);
  }
  const pratos = DISHES.filter(d => d.extra.type === 'material' && d.extra.id === id)
    .map(d => `${isPt ? d.namePt : d.nameEn} (${(d.extra as { qty: number }).qty})`);
  if (pratos.length) {
    out.push(isPt
      ? `Restaurante: ingrediente de ${lista(pratos, true)} — pratos que dão bônus de combate por algumas horas.`
      : `Restaurant: ingredient of ${lista(pratos, false)} — dishes that give a combat bonus for a few hours.`);
  }
  return out;
}

/** O guia de um material de prédio. `buildingName` é o nome do prédio dono (o mesmo que o Mapa mostra). */
export function guideOfMaterial(id: MaterialId, isPt: boolean, buildingName: string): MaterialGuide {
  const exp = expeditionsOf(id).map(e => (isPt ? e.pt : e.en));
  const sources = isPt
    ? `Missão diária de ${buildingName} (1 por dia, só por entrar no prédio)${exp.length ? ` e expedições do Foco: ${lista(exp, true)}` : ''}.`
    : `The daily mission at ${buildingName} (1 a day, just by stepping in)${exp.length ? ` and Focus expeditions: ${lista(exp, false)}` : ''}.`;
  return {
    sources,
    uses: usesOfMaterial(id, isPt),
    usoAinda: isPt ? 'Ainda não tem uso: por enquanto só coleciona.' : 'No use yet: for now it is just collected.',
  };
}

/** O guia dos outros recursos. */
export function guideOfExtra(id: ExtraMaterialId, isPt: boolean): MaterialGuide {
  const noUse = isPt ? 'Ainda não tem uso: por enquanto só coleciona.' : 'No use yet: for now it is just collected.';
  switch (id) {
    case 'soulsmith-fragment': {
      const marcos = DUNGEON_DEPTH_MARKS.map(m => m.layer).join(', ');
      return {
        sources: isPt
          ? `Descer na Fenda: ${FRAGMENTS_PER_RUN} ao completar uma descida, mais os marcos de profundidade (camadas ${marcos}, uma vez cada) e a faixa de 25 camadas do Rift Sem Fim.`
          : `Descending the Rift: ${FRAGMENTS_PER_RUN} for a completed run, plus the depth marks (layers ${marcos}, once each) and the 25-layer tier of the Endless Rift.`,
        uses: [isPt
          ? `Soulsmith: refazer a escolha de um nível do aprimoramento custa ${REDO_FRAGMENTS} fragmentos (ou ${REDO_BITS} Bits ganhos jogando).`
          : `Soulsmith: redoing the choice of an upgrade level costs ${REDO_FRAGMENTS} fragments (or ${REDO_BITS} Bits earned by playing).`],
        usoAinda: noUse,
      };
    }
    case 'boss-shard':
      return {
        sources: isPt
          ? 'Vencer o Boss do Elemental Fusion: 1 fragmento por vitória.'
          : 'Beating the Boss in Elemental Fusion: 1 shard per win.',
        uses: [],
        usoAinda: noUse,
      };
    case 'essences': {
      const est = `${ESSENCE_BY_STAGE.rookie}/${ESSENCE_BY_STAGE.champion}/${ESSENCE_BY_STAGE.ultimate}`;
      return {
        sources: isPt
          ? `Todo inimigo derrotado deixa a essência do próprio elemento (${est} conforme o estágio) e os chefes da Feira deixam mais; o Cambista, no Mercado, também as vende.`
          : `Every defeated enemy drops the essence of its own element (${est} by stage) and the Fair bosses drop more; the Money Changer at the Market also sells them.`,
        uses: [
          isPt
            ? `Laboratório › Centro de Evolução: viram uma Poção de Elemento (elemento base: ${POTION_COSTS.baseOwn} da própria essência; composto: 1 poção de cada base + ${POTION_COSTS.compositeFinal} do composto). Na próxima evolução, o elemento da poção vira o do Soulmon.`
            : `Laboratory › Evolution Center: they become an Element Potion (base element: ${POTION_COSTS.baseOwn} of its own essence; compound: 1 potion of each base + ${POTION_COSTS.compositeFinal} of the compound). On the next evolution, the potion element becomes the Soulmon's.`,
          isPt
            ? 'Restaurante: 2 a 3 essências de um elemento por prato de energia ou de regeneração.'
            : 'Restaurant: 2 to 3 essences of one element per energy or regeneration dish.',
        ],
        usoAinda: noUse,
      };
    }
  }
}

/** O prédio dono de um material (reexporta a tabela, para a Mochila não importar `buildingQuests` inteiro de novo). */
export const buildingOfMaterial = (id: MaterialId) => MATERIAL_BUILDING[id];
