/**
 * AS SOMBRAS DO PESADELO (guilda-lancamento PR5, 11/10/2026; pedido do dono).
 *
 * No Pesadelo da Corrida com obstáculos, os obstáculos deixam de ser ossos/cristais e passam a ser
 * SOMBRAS DE SOLMONS ESPECÍFICOS: a silhueta preta da criatura com SÓ OS OLHOS DE LUZ. Visual apenas — a
 * física, a caixa de colisão (`hit`/`top` de `OBSTACLE_TIERS`), o placar e as recompensas NÃO mudam.
 *
 * Até a arte chegar (pedido em `docs/ASSETS-A-GERAR.md` §17, ids `dino-shadow-{1..4}{,b,c}`), a sombra é um
 * PLACEHOLDER: o sprite da própria linha, pintado de preto em tempo de desenho e com dois olhos acesos.
 * `SHADOW_ART` é o encaixe da arte real: quando um id aparece ali, ele vence o placeholder, sem tocar no jogo.
 *
 * Este módulo é PURO (sem canvas, sem React): a tabela slot → criatura e a geometria que prende a sombra
 * dentro da caixa de colisão — o que se vê é, no máximo, o que acerta.
 */
import { DUNGEON_LINE_SPRITES } from './sprites';
import shadow1 from '../assets/soulmon/dino/dino-shadow-1.png';
import shadow1c from '../assets/soulmon/dino/dino-shadow-1c.png';
import shadow2 from '../assets/soulmon/dino/dino-shadow-2.png';
import shadow2b from '../assets/soulmon/dino/dino-shadow-2b.png';
import shadow3b from '../assets/soulmon/dino/dino-shadow-3b.png';
import shadow3c from '../assets/soulmon/dino/dino-shadow-3c.png';
import shadow4 from '../assets/soulmon/dino/dino-shadow-4.png';
import shadow4c from '../assets/soulmon/dino/dino-shadow-4c.png';

export type ShadowStage = 'rookie' | 'champion' | 'ultimate' | 'mega';
export interface ShadowSlot { id: string; line: string; stage: ShadowStage }

/**
 * Doze sombras (4 degraus × 3 variantes, mesma ordem de `OBSTACLE_TIERS`), uma criatura por slot.
 * Degrau 1/2 = chão baixo e médio (formas pequenas), 3 = coluna alta e estreita (formas esguias),
 * 4 = voadores. As linhas são os 6 Solmons próprios ATIVOS (`DUNGEON_LINE_NAMES`) — nenhuma de terceiros.
 */
export const SHADOW_SLOTS: ReadonlyArray<ReadonlyArray<ShadowSlot>> = [
  [{ id: '1', line: 'lumel', stage: 'rookie' }, { id: '1b', line: 'thalindra', stage: 'rookie' }, { id: '1c', line: 'igni', stage: 'rookie' }],
  [{ id: '2', line: 'ignar', stage: 'champion' }, { id: '2b', line: 'kaelen', stage: 'champion' }, { id: '2c', line: 'astrase', stage: 'champion' }],
  [{ id: '3', line: 'kaelen', stage: 'ultimate' }, { id: '3b', line: 'thalindra', stage: 'ultimate' }, { id: '3c', line: 'astrase', stage: 'ultimate' }],
  [{ id: '4', line: 'lumel', stage: 'mega' }, { id: '4b', line: 'ignar', stage: 'mega' }, { id: '4c', line: 'astrase', stage: 'mega' }],
];

/** A arte real, por id (`dino-shadow-<id>.png`, 128², alfa). Instalada em 13/10/2026 (leva low do Higgsfield). */
/**
 * D-78 (19/10/2026): as silhuetas de Serah (`1b`, `4b`), Nautil (`2c`) e Akashai (`3`) foram removidas — o dono
 * aposentou essas linhas de todo lugar visível. Os 4 slots reaproveitam, ENQUANTO a arte nova não vem, a silhueta
 * de outro slot do MESMO degrau (caixa de colisão compatível). Pedir 4 silhuetas novas ao squad-arte.
 */
export const SHADOW_ART: Readonly<Record<string, string>> = { '1': shadow1, '1b': shadow1c, '1c': shadow1c, '2': shadow2, '2b': shadow2b, '2c': shadow2b, '3': shadow3b, '3b': shadow3b, '3c': shadow3c, '4': shadow4, '4b': shadow4c, '4c': shadow4c };

export interface ShadowSource { id: string; src: string; /** `true` = arte real; `false` = placeholder pintado de preto em tempo de desenho. */ art: boolean }

/** A fonte da sombra do degrau `tier` (0..3), variante `variant` (0..2). Índice fora cai no primeiro slot do degrau. */
export function shadowSource(tier: number, variant: number): ShadowSource {
  const row = SHADOW_SLOTS[Math.min(SHADOW_SLOTS.length - 1, Math.max(0, Math.floor(tier) || 0))];
  const slot = row[Math.min(row.length - 1, Math.max(0, Math.floor(variant) || 0))];
  const art = SHADOW_ART[slot.id];
  return art ? { id: slot.id, src: art, art: true } : { id: slot.id, src: DUNGEON_LINE_SPRITES[slot.line][slot.stage], art: false };
}

export interface ShadowRect { x: number; y: number; w: number; h: number }

/**
 * Onde desenhar o placeholder dentro da célula `size`×`size` do obstáculo: DENTRO da caixa opaca (`hit` na
 * horizontal, de `top` até o chão na vertical), proporção da criatura preservada, encostado no chão e centrado.
 * (Só o placeholder: a arte real já vem recortada para a célula inteira.)
 */
export function shadowRect(size: number, hit: readonly [number, number], top: number, aspect = 1): ShadowRect {
  const boxW = Math.max(1, (hit[1] - hit[0]) * size);
  const boxH = Math.max(1, (1 - top) * size);
  const a = aspect > 0 ? aspect : 1;
  const w = Math.min(boxW, boxH * a);
  const h = w / a;
  return { x: hit[0] * size + (boxW - w) / 2, y: size - h, w, h };
}

/** Os dois olhos de luz, em coordenadas da célula: na parte alta da silhueta, juntos, da esquerda para a direita. */
export function shadowEyes(r: ShadowRect): Array<{ x: number; y: number }> {
  const y = r.y + r.h * 0.3;
  const cx = r.x + r.w / 2;
  const d = Math.max(2, r.w * 0.12);
  return [{ x: cx - d - 1, y }, { x: cx + d - 1, y }];
}

/**
 * O SPRITE DO PESADELO NA LUTA (15/10/2026): o monstro-pesadelo é a mesma sombra da Corrida (`dino-shadow-*`:
 * silhueta preta, só os olhos de luz), não um Soulmon comum. O degrau acompanha o tier do inimigo (slot da escada
 * 0..5: baby-i/baby-ii/rookie → degrau 0; champion → 1; ultimate → 2; mega → 3) e a variante vem do hash da noite
 * (a mesma noite, a mesma sombra). Sem arte instalada para o id, cai no placeholder (`art: false`).
 */
export function nightmareShadowSprite(slot: number, dayHash: number): ShadowSource {
  const s = Math.max(0, Math.floor(slot) || 0);
  const tier = s <= 2 ? 0 : s - 2;
  return shadowSource(tier, Math.abs(Math.floor(dayHash) || 0) % 3);
}
