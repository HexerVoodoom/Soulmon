/**
 * O CORVINHO DE LANTERNA E CARTOLA — dono único da criatura do administrador.
 *
 * Pedido do dono (29/09/2026): "minha conta deve ser de adm/gm … meu pet seja o
 * corvinho de lanterna e cartola … pode evoluir pra ele próprio mas em hues
 * diferentes: o turquesa (original) rookie e preto/branco ultra".
 *
 * O que mora aqui, e SÓ aqui (footgun 9 — regra copiada diverge em silêncio):
 *  - `CORVO_SPRITES` / `CORVO_SPRITES_256`: forma → PNG do bundle (recolor
 *    programático do mascote, `scripts/gen-corvo-forms.py`, ver
 *    `docs/reviews/admin-corvo/arte-notas.md`). Imports estáticos: viram URL
 *    relativa do próprio app no build (mesma origem, como toda a arte de
 *    `sprites.ts`) — `isSafeSpriteUrl` é a guarda de URL VINDA DE FORA (acervo)
 *    e não entra no caminho do corvo, que nunca lê URL de rede.
 *  - `CORVO_STAGES`: as 11 `CreatureStage` com nome e descrição PT+EN. Os
 *    prompts ficam VAZIOS de propósito: a arte é fixa, e `useSpriteGeneration`
 *    é desligado para o corvo no `App.tsx` (nada a gerar, nenhum crédito gasto).
 *  - `isCorvo` / `adoptCorvo` / `spriteLineOf`.
 *
 * A marca no save é `soulmonMeta.creature === 'corvo'` — campo OPCIONAL de um
 * objeto que já existe e já vai à nuvem, higienizado no `hydrateSave`
 * (`GameStateContext`). Nenhum campo novo no `GameState`.
 *
 * ⚠️ O corvo não é privilégio de jogo: não mexe em HP, energia, atributo,
 * requisito nem teto. Troca só a PELE, exatamente como `handleUpgradeRevealed`.
 * Quem o recebe é decidido fora daqui (`useAdmin()`, vindo só do servidor);
 * `isCorvo` só vira true por `adoptCorvo`.
 *
 * Por que não existe "voltar ao pet anterior": o corvo não apaga nada — o
 * `spriteLibrary` (acervo gerado) fica intacto no save, só deixa de ser
 * desenhado enquanto a marca existir. Um botão de volta exigiria guardar a
 * criatura anterior inteira (stages + meta) num segundo lugar, que é
 * exatamente o estado duplicado que o footgun 9 proíbe; o dono pediu o corvo
 * como pet definitivo, então a volta ficou fora do escopo.
 */
import { STAGE_NAMES, type AlignmentId, type CreatureStage, type LText, type StageId } from './oracle';

import rookie from '../assets/soulmon/corvo/corvo-rookie.png';
import championPower from '../assets/soulmon/corvo/corvo-champion-power.png';
import championHarmony from '../assets/soulmon/corvo/corvo-champion-harmony.png';
import championBenevolence from '../assets/soulmon/corvo/corvo-champion-benevolence.png';
import ultimatePower from '../assets/soulmon/corvo/corvo-ultimate-power.png';
import ultimateHarmony from '../assets/soulmon/corvo/corvo-ultimate-harmony.png';
import ultimateBenevolence from '../assets/soulmon/corvo/corvo-ultimate-benevolence.png';
import megaPower from '../assets/soulmon/corvo/corvo-mega-power.png';
import megaHarmony from '../assets/soulmon/corvo/corvo-mega-harmony.png';
import megaBenevolence from '../assets/soulmon/corvo/corvo-mega-benevolence.png';
import ultra from '../assets/soulmon/corvo/corvo-ultra.png';
import rookie256 from '../assets/soulmon/corvo/corvo-rookie-256.png';
import championPower256 from '../assets/soulmon/corvo/corvo-champion-power-256.png';
import championHarmony256 from '../assets/soulmon/corvo/corvo-champion-harmony-256.png';
import championBenevolence256 from '../assets/soulmon/corvo/corvo-champion-benevolence-256.png';
import ultimatePower256 from '../assets/soulmon/corvo/corvo-ultimate-power-256.png';
import ultimateHarmony256 from '../assets/soulmon/corvo/corvo-ultimate-harmony-256.png';
import ultimateBenevolence256 from '../assets/soulmon/corvo/corvo-ultimate-benevolence-256.png';
import megaPower256 from '../assets/soulmon/corvo/corvo-mega-power-256.png';
import megaHarmony256 from '../assets/soulmon/corvo/corvo-mega-harmony-256.png';
import megaBenevolence256 from '../assets/soulmon/corvo/corvo-mega-benevolence-256.png';
import ultra256 from '../assets/soulmon/corvo/corvo-ultra-256.png';

/** Identificador da linha do corvo onde o app pede uma "linha" de arte. */
export const CORVO_LINE = 'corvo' as const;

/** As 11 formas da árvore, na ordem da escada. */
export const CORVO_FORM_IDS = [
  'rookie',
  'champion-power', 'champion-harmony', 'champion-benevolence',
  'ultimate-power', 'ultimate-harmony', 'ultimate-benevolence',
  'mega-power', 'mega-harmony', 'mega-benevolence',
  'ultra',
] as const;
export type CorvoFormId = typeof CORVO_FORM_IDS[number];

export const CORVO_SPRITES: Record<CorvoFormId, string> = {
  'rookie': rookie,
  'champion-power': championPower,
  'champion-harmony': championHarmony,
  'champion-benevolence': championBenevolence,
  'ultimate-power': ultimatePower,
  'ultimate-harmony': ultimateHarmony,
  'ultimate-benevolence': ultimateBenevolence,
  'mega-power': megaPower,
  'mega-harmony': megaHarmony,
  'mega-benevolence': megaBenevolence,
  'ultra': ultra,
};

/** 256² — para as superfícies pequenas (masmorra, arena, pesadelo, Dino). */
export const CORVO_SPRITES_256: Record<CorvoFormId, string> = {
  'rookie': rookie256,
  'champion-power': championPower256,
  'champion-harmony': championHarmony256,
  'champion-benevolence': championBenevolence256,
  'ultimate-power': ultimatePower256,
  'ultimate-harmony': ultimateHarmony256,
  'ultimate-benevolence': ultimateBenevolence256,
  'mega-power': megaPower256,
  'mega-harmony': megaHarmony256,
  'mega-benevolence': megaBenevolence256,
  'ultra': ultra256,
};

/** Sprite do corvo para um id de forma. Id desconhecido cai no rookie. */
export function corvoSpriteFor(stage: string, size?: 256): string {
  const table = size === 256 ? CORVO_SPRITES_256 : CORVO_SPRITES;
  return (table as Record<string, string>)[stage.toLowerCase()] ?? table.rookie;
}

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

// ── Estado ──────────────────────────────────────────────────────────────────

export interface CorvoCarrier {
  soulmonMeta?: { creature?: string; baseName?: string; petName?: string; [k: string]: unknown };
  demoCharacterId?: string;
}

/** True só quando o save foi marcado por `adoptCorvo`. */
export function isCorvo(state: CorvoCarrier | null | undefined): boolean {
  return state?.soulmonMeta?.creature === CORVO_LINE;
}

/**
 * A "linha" de arte do pet deste save, no formato que `getSpriteForStage`
 * aceita no 2º parâmetro: o corvo, senão o personagem pronto do demo.
 */
export function spriteLineOf(state: CorvoCarrier): string | undefined {
  if (isCorvo(state)) return CORVO_LINE;
  return typeof state.demoCharacterId === 'string' ? state.demoCharacterId : undefined;
}

/**
 * Adota o corvinho. PURA e IDEMPOTENTE: se o save já é corvo, devolve a MESMA
 * referência (o updater pode rodar 2× no StrictMode — footgun 6).
 *
 * Troca SÓ a criatura, como `handleUpgradeRevealed`: estágio, galho,
 * atividades, Bits, Emblemas, `perfectDays`, `unlockedEvolutions`, acervo de
 * sprites e o nome que o jogador deu (`soulmonMeta.petName`) passam intactos.
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
