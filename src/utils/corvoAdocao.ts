/**
 * A ADOÇÃO do corvinho — nomes/descrições das 11 formas, `CORVO_STAGES` e `adoptCorvo`.
 * Separado de `corvoPet.ts` (G1, L2 de 29/09/2026) para ficar FORA do chunk de entrada: a
 * entrada só precisa de `isCorvo`/`spriteLineOf`/arte (em `corvoPet.ts`); isto só é lido
 * pelo painel de GM e pelo clique de adotar (import dinâmico no `App.tsx`).
 * A doc completa do que `adoptCorvo` preserva e substitui está no cabeçalho de `corvoPet.ts`.
 */
import { STAGE_NAMES } from './oracle/base';
import type { AlignmentId, CreatureStage, LText, StageId } from './oracle';
import { CORVO_FORM_IDS, CORVO_LINE, isCorvo, type CorvoCarrier, type CorvoFormId } from './corvoPet';

// ── Nomes e descrições (bíblia: L1..L12; vocabulário §12) ────────────────────
// Descrevem a CRIATURA, nunca a pessoa. Nenhum mérito, nenhuma cobrança.
// Galhos com o nome de MUNDO da §6.6 (Ruptura / Trama / Guarda).

const NOMES: Record<CorvoFormId, { name: LText; description: LText }> = {
  'rookie': {
    name: { pt: 'Corvinho', en: 'Little Raven' },
    description: {
      pt: 'Um corvo pequeno de cartola, com uma lanterna onde a fagulha turquesa fica acesa. Anda devagar e para para olhar tudo.',
      en: 'A small raven in a top hat, carrying a lantern where the turquoise ember stays lit. Walks slowly and stops to look at everything.',
    },
  },
  'champion-power': {
    name: { pt: 'Corvo de Fresta', en: 'Rift Raven' },
    description: {
      pt: 'A plumagem ficou cor de ferrugem e a lanterna abre caminho por onde passa. Cresceu pela Ruptura.',
      en: 'Its plumage turned rust-colored and the lantern opens a path wherever it goes. It grew through the Rupture.',
    },
  },
  'champion-harmony': {
    name: { pt: 'Corvo de Musgo', en: 'Moss Raven' },
    description: {
      pt: 'Penas cor de musgo e uma luz verde-clara na lanterna. Cresceu pela Trama, ligando o que estava solto.',
      en: 'Moss-colored feathers and a pale green light in the lantern. It grew through the Braid, tying what was loose.',
    },
  },
  'champion-benevolence': {
    name: { pt: 'Corvo Cobalto', en: 'Cobalt Raven' },
    description: {
      pt: 'Azul-cobalto da cartola às patas; a lanterna fica sempre à frente do corpo. Cresceu pela Guarda.',
      en: 'Cobalt blue from hat to feet; the lantern is always held in front. It grew through the Ward.',
    },
  },
  'ultimate-power': {
    name: { pt: 'Corvo Rompe-Véu', en: 'Veilbreaker Raven' },
    description: {
      pt: 'A cor ficou mais viva e a fagulha pisca em saltos curtos. Onde a Malha estava fechada, ele passa.',
      en: 'Its color grew brighter and the ember flickers in short bursts. Where the Mesh was closed, it passes through.',
    },
  },
  'ultimate-harmony': {
    name: { pt: 'Corvo da Trama', en: 'Braid Raven' },
    description: {
      pt: 'Verde vivo, correntinhas que tilintam no mesmo compasso. A luz da lanterna se espalha em linhas.',
      en: 'Bright green, little chains that chime in the same rhythm. The lantern light spreads out in lines.',
    },
  },
  'ultimate-benevolence': {
    name: { pt: 'Corvo Vigia', en: 'Warden Raven' },
    description: {
      pt: 'Cobalto claro e postura firme. A fagulha fica guardada lá dentro e aparece pelas frestas da lanterna.',
      en: 'Light cobalt and a steady stance. The ember is kept deep inside and shows through the lantern’s gaps.',
    },
  },
  'mega-power': {
    name: { pt: 'Grão-Corvo da Ruptura', en: 'High Raven of the Rupture' },
    description: {
      pt: 'A forma mais luminosa do galho da Ruptura. A cartola continua a mesma; a lanterna agora abre passagens inteiras.',
      en: 'The brightest form of the Rupture branch. The hat is the same; the lantern now opens whole passages.',
    },
  },
  'mega-harmony': {
    name: { pt: 'Grão-Corvo da Trama', en: 'High Raven of the Braid' },
    description: {
      pt: 'A forma mais luminosa do galho da Trama. Tudo nele anda junto: asas, correntes e a luz da lanterna.',
      en: 'The brightest form of the Braid branch. Everything in it moves together: wings, chains and the lantern light.',
    },
  },
  'mega-benevolence': {
    name: { pt: 'Grão-Corvo da Guarda', en: 'High Raven of the Ward' },
    description: {
      pt: 'A forma mais luminosa do galho da Guarda. A lanterna ilumina em volta e mantém de pé o que ia cair.',
      en: 'The brightest form of the Ward branch. The lantern lights all around and holds up what was about to fall.',
    },
  },
  'ultra': {
    name: { pt: 'Corvo Nanquim', en: 'Inkwing Raven' },
    description: {
      pt: 'Preto e branco como nanquim no papel. A fagulha da lanterna ficou branca, e a cartola ganhou uma faixa de prata.',
      en: 'Black and white like ink on paper. The lantern ember turned white, and the hat gained a silver band.',
    },
  },
};

const LEVEL_TO_STAGE: Record<string, StageId> = {
  rookie: 'rookie', champion: 'champion', ultimate: 'perfeito', mega: 'mega', ultra: 'ultra',
};
const PATH_TO_ALIGNMENT: Record<string, AlignmentId> = {
  power: 'poder', harmony: 'harmonia', benevolence: 'benevolencia',
};

function toCreatureStage(id: CorvoFormId): CreatureStage {
  const [level, path] = id.split('-');
  const stage = LEVEL_TO_STAGE[level];
  const n = NOMES[id];
  return {
    stage,
    ...(path ? { branch: PATH_TO_ALIGNMENT[path] } : {}),
    stageName: STAGE_NAMES[stage],
    // O nome exibido é o PT; a descrição carrega os dois idiomas.
    name: n.name.pt,
    description: n.description,
    imagePrompt: '',
    imagePromptFallback: '',
  };
}

export const CORVO_STAGES: CreatureStage[] = CORVO_FORM_IDS.map(toCreatureStage);

/** Nome da forma no idioma pedido (a `CreatureStage.name` é monolíngue). */
export function corvoFormName(id: string, language: 'pt-BR' | 'en' | string): string {
  const n = NOMES[id as CorvoFormId] ?? NOMES.rookie;
  return language === 'pt-BR' ? n.name.pt : n.name.en;
}

export const CORVO_BASE_NAME = NOMES.rookie.name.pt;

/**
 * Adota o corvinho. PURA e IDEMPOTENTE: se o save já é corvo, devolve a MESMA
 * referência (o updater pode rodar 2× no StrictMode — footgun 6).
 *
 * DECISÃO DO DONO (29/09/2026): a adoção é AUTOMÁTICA na primeira abertura como
 * administrador (`useAdmin()===true`, no `App.tsx`) e SEM VOLTA.
 * PRESERVA: estágio, HP, energia, atributos, atividades, Bits, Emblemas,
 * `perfectDays`, `unlockedEvolutions`, o acervo (`spriteLibrary`) e o resto de
 * `soulmonMeta` (ex.: `petName`).
 * SUBSTITUI: `soulmonStages` inteiro, `soulmonMeta.baseName`/`creature`, e zera
 * `demoCharacterId` — a criatura anterior NÃO volta.
 */
export function adoptCorvo<T extends CorvoCarrier & { soulmonStages?: CreatureStage[] }>(prev: T): T {
  if (isCorvo(prev)) return prev;
  return {
    ...prev,
    demoCharacterId: undefined,
    soulmonStages: CORVO_STAGES,
    soulmonMeta: {
      ...(prev.soulmonMeta ?? {}),
      baseName: CORVO_BASE_NAME,
      creature: CORVO_LINE,
    },
  };
}
