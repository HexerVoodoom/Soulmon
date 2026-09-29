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
 *  - (`CORVO_STAGES`, nomes e `adoptCorvo` moraram aqui até a divisão da G1 — hoje estão em
 *    `corvoAdocao.ts`, fora do chunk de entrada: só o painel de GM e o clique de adotar os usam.)
 *    `CORVO_STAGES`: as 11 `CreatureStage` com nome e descrição PT+EN. Os
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
 * O que `adoptCorvo` PRESERVA e o que SUBSTITUI (C1, L2 de 29/09/2026 — o texto
 * antigo dizia "o corvo não apaga nada", e isso era falso):
 *  - PRESERVA: estágio, HP, energia, atributos, atividades, moedas, `perfectDays`,
 *    o `spriteLibrary` (acervo gerado; só deixa de ser desenhado enquanto a marca
 *    existir) e as demais chaves de `soulmonMeta` (ex.: `petName`).
 *  - SUBSTITUI: `soulmonStages` inteiro (nome, descrição e prompts das 11 formas da
 *    criatura do oráculo), `soulmonMeta.baseName` e `soulmonMeta.creature`; e ZERA
 *    `demoCharacterId`. A criatura anterior NÃO volta.
 *
 * Por que não existe "voltar ao pet anterior": um botão de volta exigiria guardar
 * a criatura anterior inteira (stages + meta) num segundo lugar, que é exatamente
 * o estado duplicado que o footgun 9 proíbe; o dono pediu o corvo como pet
 * definitivo, então a volta ficou fora do escopo — e o painel de GM avisa.
 */

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
