#!/usr/bin/env node
/**
 * Renderiza os 7 efeitos de combate (D-86..D-92) para WAV, para o dono OUVIR (gate humano S8), e imprime a medição.
 *   node scripts/render-sfx-combate.mjs                  → WAVs em D:/Soulmon/_gemini_out/w6-sfx/ (ou o 1º argumento)
 *   node scripts/render-sfx-combate.mjs --medir          → só imprime LUFS-M/true peak/offset (sem gravar)
 * `para-ouvir/` tem as mesmas cópias normalizadas a −3 dBFS (mais altas, só para a escuta). Os WAVs da raiz saem JÁ no nível de produção (o offset de `src/utils/loudness.ts` aplicado), 48 kHz, 16 bits mono: é o que o
 * app toca. Usa o esbuild do projeto para compilar `sfxCombate.ts` + o medidor; nada vai para o bundle do app.
 */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const raiz = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const soMedir = args.includes('--medir');
const destino = args.find(a => !a.startsWith('--')) ?? 'D:/Soulmon/_gemini_out/w6-sfx';

const caminho = rel => join(raiz, rel).split(String.fromCharCode(92)).join('/');
const tmp = mkdtempSync(join(tmpdir(), 'sfx-'));
const entrada = join(tmp, 'entrada.ts');
writeFileSync(entrada, `
export * from ${JSON.stringify(caminho('src/utils/sfxCombate.ts'))};
export * from ${JSON.stringify(caminho('src/test/lufsM.ts'))};
export { OFFSET_POR_SOM_DB, ALVO_LUFS_M, CATEGORIA_DO_SOM } from ${JSON.stringify(caminho('src/utils/loudness.ts'))};
`);
const saida = join(tmp, 'saida.mjs');
await build({ entryPoints: [entrada], outfile: saida, bundle: true, format: 'esm', platform: 'node', logLevel: 'error' });
const m = await import(pathToFileURL(saida).href);

function wav16(x, sr) {
  const b = Buffer.alloc(44 + x.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(x.length * 2, 40);
  for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
  return b;
}

const SR = 48000;
if (!soMedir) mkdirSync(join(destino, 'para-ouvir'), { recursive: true });
for (const nome of m.NOMES_SFX_DE_COMBATE) {
  const nominal = m.renderizarSfx(nome, SR);
  const lufs = m.lufsMMax(nominal, SR);
  const alvo = m.ALVO_LUFS_M[m.CATEGORIA_DO_SOM[nome]];
  const offsetMedido = Math.round((alvo - lufs) * 1000) / 1000;
  const offset = m.OFFSET_POR_SOM_DB[nome];
  const no = m.sfxNoAlvo(nome, SR, offset ?? offsetMedido);
  const meta = m.SFX_DE_COMBATE[nome];
  console.log(`${meta.id} ${nome.padEnd(17)} ${(nominal.length / SR).toFixed(2)}s  LUFS-M nominal ${lufs.toFixed(3)}  offset medido ${offsetMedido}  (no repo: ${offset})  pico ${m.picoDbfs(no).toFixed(2)} dBFS  TP ${m.truePeakDbtp(no).toFixed(2)} dBTP`);
  if (!soMedir) {
    writeFileSync(join(destino, `${meta.id}-${nome}.wav`), wav16(no, SR));
    // Cópia para OUVIR no fone/caixa: pico em −3 dBFS (o de produção é ~−25 LUFS-M, o degrau mais baixo da escada).
    const g = Math.pow(10, -3 / 20) / Math.pow(10, m.picoDbfs(no) / 20);
    writeFileSync(join(destino, 'para-ouvir', `${meta.id}-${nome}.wav`), wav16(no.map(v => v * g), SR));
  }
}
if (!soMedir) console.log(`\nWAVs em ${destino}`);
