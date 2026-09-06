/**
 * WP4.15 — a escada do Vínculo passa a ENTREGAR.
 *
 * `BOND_REWARDS` (12 itens, níveis 2 a 13) e `unclaimedBondRewards` estavam
 * escritos, testados e sem consumidor: `bondRewardsClaimed` nunca era escrito
 * por ninguém. Um jogador no nível 11 tinha três decorações, dois cenários e
 * três sonhos esperando desde sempre, e não sabia. Só o título chegava — porque
 * é derivado (`bondTitle`) e por isso funcionava sem ninguém ligar nada.
 *
 * Este teste guarda as três propriedades que fazem a entrega ser segura:
 * idempotência (o chamador é um `setGameState`, e o StrictMode roda updater
 * duas vezes), identidade quando não há nada (senão vira objeto novo por
 * render, e o save é gravado com debounce a cada mudança) e a ressalva da linha
 * vermelha — item já possuído NÃO devolve Bits.
 */
import { describe, it, expect } from 'vitest';
import { applyBondRewards, unclaimedBondRewards, bondLevelFor, bondRewardLadder, xpForLevel } from './bond';

/** XP suficiente para o nível pedido. */
const xpDe = (nivel: number) => xpForLevel(nivel);

const estado = (over: Record<string, unknown> = {}) => ({
  totalXP: 0,
  bondRewardsClaimed: [] as string[],
  ownedFurniture: [] as string[],
  ownedBackgrounds: [] as string[],
  rest: { dreams: [] as string[] },
  ...over,
});

describe('entrega da escada do Vínculo (WP4.15)', () => {
  it('nível 1 não entrega nada, e devolve o MESMO objeto', () => {
    const s = estado();
    const { state, delivered } = applyBondRewards(s);
    expect(delivered).toHaveLength(0);
    expect(state, 'objeto novo por render grava save à toa').toBe(s);
  });

  it('nível 4 entrega o que os degraus 2, 3 e 4 garantiram', () => {
    const { state, delivered } = applyBondRewards(estado({ totalXP: xpDe(4) }));
    expect(delivered.map(r => r.id)).toEqual(['bond-2-title', 'bond-3-plant', 'bond-4-forest']);
    expect(state.ownedFurniture).toContain('furn-plant');
    expect(state.ownedBackgrounds).toContain('bg-forest');
    expect(state.bondRewardsClaimed).toEqual(['bond-2-title', 'bond-3-plant', 'bond-4-forest']);
  });

  it('o sonho vai para `rest.dreams`, que é o dono da coleção', () => {
    const { state } = applyBondRewards(estado({ totalXP: xpDe(5) }));
    expect(state.rest.dreams).toContain('dream-little-boat');
  });

  it('IDEMPOTENTE: rodar de novo não duplica nem entrega duas vezes', () => {
    const uma = applyBondRewards(estado({ totalXP: xpDe(8) }));
    const duas = applyBondRewards(uma.state);
    expect(duas.delivered).toHaveLength(0);
    expect(duas.state, 'a segunda passada devia ser identidade').toBe(uma.state);
    expect(uma.state.ownedFurniture.filter(x => x === 'furn-plant')).toHaveLength(1);
  });

  it('item JÁ POSSUÍDO marca o degrau como cumprido e não devolve Bits', () => {
    // A ressalva da linha vermelha: reembolso transformaria a escada num
    // gerador de moeda, e quem comprou a plantinha antes não é credor.
    const antes = estado({ totalXP: xpDe(3), ownedFurniture: ['furn-plant'], gamePoints: 500 });
    const { state } = applyBondRewards(antes);
    expect(state.bondRewardsClaimed).toContain('bond-3-plant');
    expect(state.ownedFurniture.filter(x => x === 'furn-plant')).toHaveLength(1);
    expect((state as { gamePoints?: number }).gamePoints, 'a escada virou fonte de Bits').toBe(500);
  });

  it('`title` não entrega item nenhum — o título é derivado', () => {
    const { state, delivered } = applyBondRewards(estado({ totalXP: xpDe(2) }));
    expect(delivered.map(r => r.id)).toEqual(['bond-2-title']);
    expect(state.ownedFurniture).toHaveLength(0);
    expect(state.ownedBackgrounds).toHaveLength(0);
    expect(state.rest.dreams).toHaveLength(0);
  });

  it('save antigo SEM `rest` não ganha um `rest` inventado, e o degrau conta', () => {
    const semRest: { totalXP: number; bondRewardsClaimed: string[] } = {
      totalXP: xpDe(5), bondRewardsClaimed: [],
    };
    const { state } = applyBondRewards(semRest);
    expect((state as { rest?: unknown }).rest).toBeUndefined();
    // Conta como cumprido: ficar tentando entregar para sempre seria pior.
    expect(state.bondRewardsClaimed).toContain('bond-5-boat');
  });

  it('a escada inteira é entregável — nenhum degrau aponta para item inexistente', () => {
    const { state, delivered } = applyBondRewards(estado({ totalXP: xpDe(30) }));
    expect(delivered.length).toBe(bondRewardLadder().length);
    // Todo `refId` foi parar em alguma das três coleções.
    for (const r of bondRewardLadder()) {
      if (!r.refId) continue;
      const foi = state.ownedFurniture.includes(r.refId)
        || state.ownedBackgrounds.includes(r.refId)
        || state.rest.dreams.includes(r.refId);
      expect(foi, `${r.id} (${r.kind}) não chegou a lugar nenhum`).toBe(true);
    }
  });

  it('nada aqui mexe em nível: ele continua derivado de `totalXP`', () => {
    const { state } = applyBondRewards(estado({ totalXP: xpDe(7) }));
    expect(state).not.toHaveProperty('bondLevel');
    expect(bondLevelFor(state.totalXP)).toBe(7);
    expect(unclaimedBondRewards(state.totalXP, state.bondRewardsClaimed)).toHaveLength(0);
  });
});
