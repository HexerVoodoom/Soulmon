// Render offline da trilha de terror do Pesadelo para WAV (o dono ouve fora do app). Node >= 22.18 (strip-types).
// Uso: node scripts/render-trilha-pesadelo.mjs [saida.wav] [semente] [repeticoes]
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { sintetizarTrilhaPesadelo, paraWav16, medirTrilha, TAXA_PESADELO, SEMENTE_PESADELO } from '../src/utils/trilhaPesadeloSintese.ts';

const saida = process.argv[2] ?? 'E:/soulmon-pesadelo-audio/pesadelo-trilha.wav';
const seed = process.argv[3] ? Number(process.argv[3]) : SEMENTE_PESADELO;
const reps = process.argv[4] ? Number(process.argv[4]) : 4; // o loop repetido, para ouvir a emenda (4 x 32 s = 2 min)
const loop = sintetizarTrilhaPesadelo({ seed });
const tudo = new Float32Array(loop.length * reps);
for (let r = 0; r < reps; r++) tudo.set(loop, r * loop.length);
// O buffer do app sai em -14,1 dBFS (o ganho de reproducao do app o sobe); para ouvir fora, sobe o pico a -3 dBFS.
const g = Math.pow(10, (-3 + 14.1) / 20);
for (let i = 0; i < tudo.length; i++) tudo[i] *= g;
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, paraWav16(tudo, TAXA_PESADELO));
const m = medirTrilha(loop);
console.log(`${saida}: ${(tudo.length / TAXA_PESADELO).toFixed(1)} s, ${TAXA_PESADELO} Hz mono, pico ${(20 * Math.log10(m.pico * g)).toFixed(1)} dBFS, rms ${(20 * Math.log10(m.rms * g)).toFixed(1)} dBFS`);
