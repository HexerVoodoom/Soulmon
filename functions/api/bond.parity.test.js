/**
 * PARIDADE da curva do Vínculo entre o app e o servidor.
 *
 * O gate de PvP existe nos dois lados: no cliente para não OFERECER o que não
 * está disponível, no servidor para TRAVAR de verdade. Se as duas curvas
 * divergirem, o app mostra o botão e o servidor recusa em silêncio — ou pior, o
 * contrário. Divergir aqui não dá erro nenhum; por isso o encontro é
 * comportamental, exatamente como em `saveId.parity.test.js`.
 */
import { describe, it, expect } from 'vitest';
import { bondLevelFor as noServidor, xpForLevel as xpServidor, BOND_PVP_MIN_LEVEL as MIN_SERVIDOR } from './_bond.js';
import { bondLevelFor as noApp, xpForLevel as xpApp, BOND_PVP_MIN_LEVEL as MIN_APP, meetsPvpBond } from '../../src/utils/bond';

describe('a curva do Vínculo é a MESMA nos dois lados', () => {
  it('o nível bate para todo totalXP até bem depois do fim do funil', () => {
    for (let xp = 0; xp <= 40000; xp += 13) {
      expect(noServidor(xp)).toBe(noApp(xp));
    }
  });

  it('os degraus batem nível a nível', () => {
    for (let n = 1; n <= 40; n++) expect(xpServidor(n)).toBe(xpApp(n));
  });

  it('o nível mínimo de PvP é o mesmo número dos dois lados', () => {
    expect(MIN_SERVIDOR).toBe(MIN_APP);
  });

  it('a decisão do gate bate na fronteira exata (699/700)', () => {
    const limiar = xpApp(MIN_APP);
    expect(noServidor(limiar - 1) >= MIN_SERVIDOR).toBe(meetsPvpBond(limiar - 1));
    expect(noServidor(limiar) >= MIN_SERVIDOR).toBe(meetsPvpBond(limiar));
  });

  it('lixo no save cai no mesmo lado nos dois (nível 1 / não libera)', () => {
    for (const lixo of [null, undefined, NaN, -5, 'muito', {}, []]) {
      expect(noServidor(lixo)).toBe(1);
      expect(meetsPvpBond(/** @type {number} */(lixo))).toBe(false);
    }
  });
});
