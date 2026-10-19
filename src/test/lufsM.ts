/**
 * Medidor de loudness para TESTES e para `scripts/render-sfx-combate.mjs` (nunca entra no bundle do app).
 * LUFS-M = janela deslizante de 400 ms, K-weighting (ITU-R BS.1770-4, coeficientes de 48 kHz), SEM gating, com
 * zero-padding nas pontas — a mesma definição de `loudness.ts` ("LUFS-M máx. de janela 400 ms com zero-padding").
 * True peak = pico das amostras sobreamostradas 4× (sinc com janela de Hann).
 */

/** K-weighting a 48 kHz: shelf de agudos + passa-altas (BS.1770-4, tabela 1 e 2). */
function kWeighting(x: Float32Array): Float64Array {
  const y = new Float64Array(x.length);
  const est = (b: number[], a: number[], ent: ArrayLike<number>, sai: Float64Array) => {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < ent.length; i++) {
      const v = b[0] * ent[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
      x2 = x1; x1 = ent[i]; y2 = y1; y1 = v; sai[i] = v;
    }
  };
  const s1 = new Float64Array(x.length);
  est([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585], x, s1);
  est([1, -2, 1], [1, -1.99004745483398, 0.99007225036621], s1, y);
  return y;
}

/** O MÁXIMO do LUFS-M do sinal (a 48 kHz), com passo de 10 ms e zero-padding de 400 ms nas duas pontas. */
export function lufsMMax(x: Float32Array, sr = 48000): number {
  if (sr !== 48000) throw new Error('lufsMMax mede a 48 kHz (coeficientes do K-weighting)');
  const janela = Math.round(0.4 * sr);
  const pad = new Float32Array(x.length + 2 * janela);
  pad.set(x, janela);
  const k = kWeighting(pad);
  const q = new Float64Array(k.length + 1);
  for (let i = 0; i < k.length; i++) q[i + 1] = q[i] + k[i] * k[i];
  let melhor = -Infinity;
  const passo = Math.round(0.01 * sr);
  for (let i = 0; i + janela <= k.length; i += passo) {
    const ms = (q[i + janela] - q[i]) / janela;
    if (ms > 0) melhor = Math.max(melhor, -0.691 + 10 * Math.log10(ms));
  }
  return melhor;
}

/** Pico de amostra, em dBFS. */
export function picoDbfs(x: Float32Array): number {
  let p = 0;
  for (let i = 0; i < x.length; i++) p = Math.max(p, Math.abs(x[i]));
  return p > 0 ? 20 * Math.log10(p) : -Infinity;
}

/** True peak em dBTP: pico após sobreamostrar 4× (interpolação sinc de 24 pontas com janela de Hann). */
export function truePeakDbtp(x: Float32Array): number {
  const L = 4, T = 12;
  let p = 0;
  for (let n = 0; n < x.length; n++) {
    p = Math.max(p, Math.abs(x[n]));
    for (let f = 1; f < L; f++) {
      let s = 0;
      for (let j = -T + 1; j <= T; j++) {
        const i = n + j;
        if (i < 0 || i >= x.length) continue;
        const d = j - f / L;
        const sinc = Math.sin(Math.PI * d) / (Math.PI * d);
        const hann = 0.5 * (1 + Math.cos((Math.PI * d) / T));
        s += x[i] * sinc * hann;
      }
      p = Math.max(p, Math.abs(s));
    }
  }
  return p > 0 ? 20 * Math.log10(p) : -Infinity;
}
