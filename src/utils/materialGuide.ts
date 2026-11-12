/**
 * GUIA DOS MATERIAIS (10/11/2026, pedido do dono) — para cada material/recurso da aba Materiais da Mochila: ONDE se consegue e PARA QUE SERVE.
 * Tudo DERIVADO do código real (nada escrito à mão que possa divergir): as receitas do Soulsmith (`FORGE_PIECES`), o cardápio do Restaurante
 * (`DISHES`), as expedições do Foco (`FOCUS_ENVIRONMENTS`), o prédio dono de cada material (`MATERIAL_BUILDING`) e as constantes de custo.
 * Só a Mochila (lazy, aba Materiais) importa este módulo — fora do chunk de entrada.
 *
 * Além dos 16 materiais de prédio (`buildingQuests.materials`), a aba lista os OUTROS recursos que o jogo concede e que antes não tinham
 * lugar no inventário: Fragmento do Soulsmith (`equipment.fragments`) e Fragmento de Boss (`bossShards`). Material sem uso HOJE diz isso com franqueza (`usoAinda`), em vez de inventar um.
 */
import { MATERIAL_BUILDING, type MaterialId } from './buildingQuests';
import { FORGE_PIECES } from './forge';
import { itemName } from './equipmentCopy';
import { FOCUS_ENVIRONMENTS } from './focusExpedition';
import { DISHES } from './restaurant';

export type ExtraMaterialId = 'soulsmith-fragment' | 'boss-shard';

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
];

export interface MaterialGuide {
  /** "Found at …": só os lugares, separados por vírgula (quem chama põe o rótulo em negrito e o "Ir lá"). */
  readonly sources: string;
  /** "Use …": os lugares onde se usa. Vazio = sem uso hoje (`usoAinda` diz isso). */
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

/** ONDE se usa um material (nomes dos lugares, enxuto): Soulsmith (receitas) e Restaurante (pratos). Vazio = sem uso hoje. */
export function usePlacesOfMaterial(id: MaterialId, isPt: boolean): string[] {
  const out: string[] = [];
  if (FORGE_PIECES.some(p => p.mats.includes(id))) out.push('Soulsmith');
  if (DISHES.some(d => d.extra.type === 'material' && d.extra.id === id)) out.push(isPt ? 'Restaurante' : 'Restaurant');
  return out;
}

/** O guia de um material de prédio. `buildingName` é o nome do prédio dono (o mesmo que o Mapa mostra). */
export function guideOfMaterial(id: MaterialId, isPt: boolean, buildingName: string): MaterialGuide {
  const exp = expeditionsOf(id).map(e => (isPt ? e.pt : e.en));
  /* Prédio LISTADO (hoje o Caderno): a missão NÃO conclui ao entrar — pede a ação real (um registro) e o "Resgatar" na Home
     (`applyBuildingEntry`). Os outros pagam na própria entrada. A frase tem que dizer o que de fato acontece. */
  /* ENXUTO (pedido do dono, 12/11/2026): só os LUGARES, "Encontrado em A, B" / "Found at A, B". O "como" detalhado (1 por dia, ao entrar etc.)
     continua no botão "Ir lá" e na própria missão do prédio. */
  const lugares = [buildingName, ...(exp.length ? [isPt ? 'Expedições do Foco' : 'Focus expeditions'] : [])];
  const sources = lugares.join(', ');
  return {
    sources,
    uses: usePlacesOfMaterial(id, isPt),
    usoAinda: isPt ? 'Ainda não tem uso: por enquanto só coleciona.' : 'No use yet: for now it is just collected.',
  };
}

/** O guia dos outros recursos. (As Essências saíram da Bolsa em 12/11/2026: ficam só no Laboratório › Arquivo.) */
export function guideOfExtra(id: ExtraMaterialId, isPt: boolean): MaterialGuide {
  const noUse = isPt ? 'Ainda não tem uso: por enquanto só coleciona.' : 'No use yet: for now it is just collected.';
  switch (id) {
    case 'soulsmith-fragment':
      return {
        sources: isPt ? 'Fenda (descer, marcos de profundidade, Rift Sem Fim)' : 'Rift (runs, depth marks, Endless Rift)',
        uses: ['Soulsmith'],
        usoAinda: noUse,
      };
    case 'boss-shard':
      return {
        sources: isPt ? 'Elemental Fusion (vencer o Boss)' : 'Elemental Fusion (beat the Boss)',
        uses: [],
        usoAinda: noUse,
      };
  }
}

/** O prédio dono de um material (reexporta a tabela, para a Mochila não importar `buildingQuests` inteiro de novo). */
export const buildingOfMaterial = (id: MaterialId) => MATERIAL_BUILDING[id];
