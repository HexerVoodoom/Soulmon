/**
 * Calibração dos 3 sons da revelação de recompensa: renderiza os parciais de `sonsRecompensa.ts` em Node (48 kHz) e mede
 * com `src/test/lufsM.ts`. O offset de `loudness.ts` TEM de estar dentro de `TOLERANCIA_LU` do que a medição pede; o pico fica abaixo do teto S3.
 * ⚠️ É medição de SINAL NOMINAL (a mesma abordagem do combate): não é escuta. O gate humano (S8) continua pendente.
 */
import { describe, it, expect } from 'vitest';
import { lufsMMax, truePeakDbtp } from '../test/lufsM';
import { ALVO_LUFS_M, CATEGORIA_DO_SOM, OFFSET_POR_SOM_DB, TOLERANCIA_LU, TETO_DBTP, db2lin } from './loudness';
import { ATAQUE_S, PISO, duracaoDe, parciaisDing, parciaisPop, parciaisTique, type Parcial } from './sonsRecompensa';

const SR = 48000;

export function renderizar(ps: readonly Parcial[], sobra = 0.05): Float32Array {
  const n = Math.ceil((duracaoDe(ps) + sobra) * SR);
  const out = new Float32Array(n);
  for (const p of ps) {
    const i0 = Math.floor(p.t * SR);
    const len = Math.floor(p.dur * SR);
    let fase = 0;
    for (let k = 0; k < len && i0 + k < n; k++) {
      const tau = k / SR;
      const f = p.f0 === p.f1 ? p.f0 : p.f0 * Math.pow(p.f1 / p.f0, tau / p.dur);
      fase += (2 * Math.PI * f) / SR;
      const osc = p.type === 'sine' ? Math.sin(fase) : (2 / Math.PI) * Math.asin(Math.sin(fase));
      const env = tau < ATAQUE_S ? (tau / ATAQUE_S) * p.gain : p.gain * Math.pow(PISO, (tau - ATAQUE_S) / (p.dur - ATAQUE_S));
      out[i0 + k] += osc * env;
    }
  }
  return out;
}

const casos: Array<[string, Parcial[]]> = [
  ['playRewardPop', parciaisPop(0)],
  ['playRewardPop (pitch 4)', parciaisPop(4)],
  ['playRewardPop (pitch 8)', parciaisPop(8)],
  ['playCoinRoll', parciaisTique()],
  ['playCoinLand', parciaisDing()],
];

describe('loudness dos sons da revelação de recompensa', () => {
  it('todos são `arcade`', () => {
    for (const n of ['playRewardPop', 'playCoinRoll', 'playCoinLand']) expect(CATEGORIA_DO_SOM[n]).toBe('arcade');
  });
  it.each(casos)('%s: o offset de loudness.ts leva ao alvo da categoria (± tolerância) e respeita o teto de pico', (nome, ps) => {
    const chave = nome.split(' ')[0];
    const alvo = ALVO_LUFS_M[CATEGORIA_DO_SOM[chave]];
    const nominal = renderizar(ps);
    const medido = lufsMMax(nominal);
    const pedido = alvo - medido;
    expect(Math.abs(OFFSET_POR_SOM_DB[chave] - pedido), `${nome}: LUFS-M nominal ${medido.toFixed(2)}, pede ${pedido.toFixed(2)} dB, offset em loudness.ts ${OFFSET_POR_SOM_DB[chave]}`).toBeLessThanOrEqual(TOLERANCIA_LU);
    const aplicado = new Float32Array(nominal.length);
    const g = db2lin(OFFSET_POR_SOM_DB[chave]);
    for (let i = 0; i < nominal.length; i++) aplicado[i] = nominal[i] * g;
    expect(truePeakDbtp(aplicado)).toBeLessThanOrEqual(TETO_DBTP);
  });
});
