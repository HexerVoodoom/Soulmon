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
import { bondLevelFor as noServidor, xpForLevel as xpServidor, BOND_PVP_MIN_LEVEL as MIN_SERVIDOR, BOND_MAX_LEVEL as MAX_SERVIDOR } from './_bond.js';
import { bondLevelFor as noApp, xpForLevel as xpApp, BOND_PVP_MIN_LEVEL as MIN_APP, BOND_MAX_LEVEL as MAX_APP, meetsPvpBond } from '../../src/utils/bond';

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

// ═══════════════════════════════════════════════════════════════════════════
/**
 * O CUSTO DA CURVA — achado da sessão de QA de 08/09/2026.
 *
 * `totalXP` mora no save, e o save é escrito pelo cliente. `bondLevelFor` era
 * um laço que chamava `xpForLevel` a cada volta, e `xpForLevel` é O(nível):
 * custo total O(nível²), sem teto. Medido antes da correção:
 *
 *     totalXP 1e4  → nível    15 →   0,2 ms
 *     totalXP 1e6  → nível   142 →   0,8 ms
 *     totalXP 1e8  → nível  1415 →   3,0 ms
 *     totalXP 1e10 → nível 14143 → 183,0 ms      ← numa chamada
 *
 * A curva é quadrática, então 1e12 daria ~18 s. E o caminho não é exótico: é o
 * `action=profile` do `community.js`, que roda a CADA cloud save.
 *
 * O comentário que morava no `bondLevelFor` afirmava que o laço "converge em
 * poucas dezenas de voltas mesmo para um save absurdo". Era falso, e nada
 * media. Agora mede.
 */
describe('a curva não pode custar CPU proporcional ao que o cliente escreveu', () => {
  it('o teto de nível é o MESMO número nos dois lados', () => {
    expect(MAX_SERVIDOR).toBe(MAX_APP);
    // Generoso ao ponto de ser inalcançável: exige ~5e7 de XP.
    expect(MAX_SERVIDOR).toBeGreaterThanOrEqual(1000);
  });

  it('🔴 `totalXP` absurdo é limitado, e nos dois lados igual', () => {
    for (const xp of [1e8, 1e10, 1e15, Number.MAX_SAFE_INTEGER]) {
      expect(noServidor(xp), `servidor com ${xp}`).toBe(MAX_SERVIDOR);
      expect(noApp(xp), `app com ${xp}`).toBe(MAX_APP);
    }
  });

  it('🔴 e o CUSTO fica no chão — se voltar a ser quadrático, isto cai', () => {
    // Teto folgado de propósito: o medido depois da correção é ~0,4 ms, e uma
    // regressão quadrática volta para a casa das centenas de ms ou dos
    // segundos. Um teto apertado seria teste instável; este só acusa a
    // mudança de ORDEM de grandeza, que é o que interessa.
    const t = performance.now();
    for (let i = 0; i < 50; i++) noServidor(1e15);
    const decorrido = performance.now() - t;
    expect(decorrido, `50 chamadas levaram ${decorrido.toFixed(1)}ms`).toBeLessThan(500);
  });

  it('`xpForLevel` também é limitada — ela é exportada e aceita número de fora', () => {
    expect(xpServidor(1e9)).toBe(xpServidor(MAX_SERVIDOR));
    expect(xpApp(1e9)).toBe(xpApp(MAX_APP));
    expect(xpServidor(1e9)).toBe(xpApp(1e9));
  });

  it('nada disso mexeu na faixa que jogador real ocupa', () => {
    // A correção é de custo, não de balanceamento: abaixo do teto o número
    // tem de ser exatamente o de antes, e o gate de PvP não se move.
    for (const [xp, nivel] of [[0, 1], [74, 1], [75, 2], [699, 4], [700, 5], [1e4, 15], [1e6, 142]]) {
      expect(noServidor(xp), `totalXP ${xp}`).toBe(nivel);
      expect(noApp(xp), `totalXP ${xp}`).toBe(nivel);
    }
  });
});
