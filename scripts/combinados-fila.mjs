/**
 * FILA DO PACOTE A (16/11/2026) — formas de combinados por combinação de elementos (2→champion, 3→ultimate, 4→mega).
 * Mesmo processo do summon real: prompt do Oráculo (`generateOracleWithFamilies`) + `stagesComElemento` (tema e pistas do elemento, chroma
 * coerente) + a linha "Important: use the exact same style as the references."; 1 chamada alpha por forma, forma anterior como referência.
 * NUNCA grava no KV, nunca roda em CI, nunca gera sozinho: a chamada à API sai da aba logada do playground.
 *
 *   node scripts/combinados-fila.mjs --prompts [--pilot]      # gera prompts.json (pilot = 6 combinações)
 *   node scripts/combinados-fila.mjs --lote <arq.json>        # pedidos pendentes (cache por arquivo|sha), em ordem de cadeia
 *   node scripts/combinados-fila.mjs --instalar <urls.json>   # { arquivo: url }: baixa, recorta, confere, 256², meta+registro
 */
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { carregar, alvos } from './combinados-alvos.mjs';
import { chromaKeyPngChecked, chromaKeyOfPrompt } from '../functions/api/_chroma.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SAIDA = 'E:/Soulmon-assets/_lote-16-11/combinados';
export const PILOTOS = 'E:/Soulmon-assets/_lote-16-11/combinados-pilotos';
const REGISTRO = 'E:/Soulmon-assets/_banco/registro.jsonl';
const ESTILO = ' Important: use the exact same style as the references.';
const LINHAS = ['poder', 'harmonia', 'benevolencia'];
// Elemento do Oráculo (só 8) que dá corpo/paleta quando nenhum componente é um deles; tema e pistas vêm do elemento combinado.
const ORACULO = ['agua', 'fogo', 'terra', 'ar', 'sombra', 'luz', 'planta', 'industrial'];
const PROXIMO = { vigor: 'terra', marcial: 'industrial', tempo: 'ar', som: 'ar', gravidade: 'terra', espaco: 'luz', arcano: 'luz', eletricidade: 'ar', vileza: 'sombra', morte: 'sombra', vida: 'planta', fada: 'luz' };
const PILOTO_IDS = ['lava', 'tempestade', 'pestilencia', 'cyber', 'floresta_ancestral', 'colosso_blindado'];
const ORDEM = ['rookie', 'champion', 'ultimate', 'mega'];
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
export const shaDe = (t) => createHash('sha256').update(t).digest('hex');
export const arquivoDe = (rookieArt, stage) => `${rookieArt}-${stage}`;

const oraculoDe = (comps) => comps.find((c) => ORACULO.includes(c)) ?? PROXIMO[comps[0]] ?? 'luz';

export async function montar(m, pilot) {
  let a = await alvos(m);
  if (pilot) a = a.filter((x) => PILOTO_IDS.includes(x.elementId));
  const itens = [];
  for (const x of a) {
    const base = oraculoDe(x.comps);
    const linha = LINHAS[hash(x.elementId) % 3];
    const input = { fullName: x.rookie.name, birthDate: '2026-11-16', birthTime: '12:00', birthPlace: `soulmon:${x.elementId}` };
    const r = m.generateOracleWithFamilies(input, m.familias, hash(`${x.elementId}|pacote-a`), { dominantElement: base, dominantAlignment: linha, secondaryElement: null });
    const estagios = {};
    for (const st of x.faltam) estagios[st] = { id: x.elementId, base };
    const stages = m.stagesComElemento(r.creature.stages, { v: 1, u: 0.5, estagios });
    x.faltam.forEach((st, i) => {
      const alvoStage = st === 'ultimate' ? 'perfeito' : st;
      const s = stages.find((q) => q.stage === alvoStage && (!q.branch || q.branch === linha)) ?? stages.find((q) => q.stage === alvoStage);
      if (!s?.imagePrompt) throw new Error(`${x.elementId}/${st}: Oráculo sem prompt`);
      const prompt = s.imagePrompt + ESTILO;
      const ant = ORDEM[ORDEM.indexOf(st) - 1];
      itens.push({
        arquivo: arquivoDe(x.rookie.artFile, st), elementId: x.elementId, comps: x.comps, stage: st, linha, baseOraculo: base,
        // refDe: o rookie do repo (1º degrau) ou o arquivo anterior da cadeia (gerado antes)
        refDe: i === 0 ? { rookie: `src/assets/soulmon/novos-arquivo/combinados/${x.rookie.artFile}.png` } : { arquivo: arquivoDe(x.rookie.artFile, ant) },
        prompt, sha: shaDe(prompt), chroma: chromaKeyOfPrompt(prompt), semChromaSeguro: m.semChromaSeguro(prompt),
      });
    });
  }
  return itens;
}

const CHAVE_RGB = { green: [0, 255, 0], magenta: [255, 0, 255], blue: [0, 0, 255] };
/** Verde/magenta/azul que sobrou ENCLAUSURADO (fundo visto por dentro de halo, argola, asa): o modo conectado o preserva. A criatura não tem a cor da chave (o prompt garante), então tudo muito perto dela some. */
export async function limparChave(png, chave) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [kr, kg, kb] = CHAVE_RGB[chave];
  let tirados = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const d = Math.hypot(data[i] - kr, data[i + 1] - kg, data[i + 2] - kb);
    if (d < 90) { data[i + 3] = 0; tirados++; }
  }
  const out = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  return { png: out, tirados };
}

const pngTemAlfa = (b) => b.length > 26 && b[0] === 0x89 && (b[25] === 6 || b[25] === 4);
const arg = (n) => { const i = process.argv.indexOf(n); return i < 0 ? null : (process.argv[i + 1] ?? true); };

async function main() {
  const pilot = process.argv.includes('--pilot');
  const out = pilot ? PILOTOS : SAIDA;
  mkdirSync(join(out, 'raw'), { recursive: true });
  const pp = join(out, 'prompts.json'), manPath = join(out, 'manifesto.json');
  const manifesto = existsSync(manPath) ? JSON.parse(readFileSync(manPath, 'utf8')) : {};
  if (process.argv.includes('--prompts')) {
    const m = await carregar(join(ROOT, 'node_modules/.cache/combinados/b.mjs'));
    const itens = await montar(m, pilot);
    writeFileSync(pp, JSON.stringify(itens, null, 1));
    console.log(`${itens.length} prompts em ${pp}. Sem chroma seguro: ${itens.filter((i) => i.semChromaSeguro).length}. Custo ~US$ ${(itens.length * 0.024).toFixed(2)}.`);
    return;
  }
  const itens = JSON.parse(readFileSync(pp, 'utf8'));
  const pend = itens.filter((i) => !(manifesto[`${i.arquivo}|${i.sha}`] && existsSync(join(out, 'raw', `${i.arquivo}.png`))));
  if (arg('--lote')) { writeFileSync(arg('--lote'), JSON.stringify(pend, null, 1)); console.log(`${pend.length} pendentes em ${arg('--lote')}. Nada gerado.`); return; }
  if (process.argv.includes('--promover')) {
    // Copia o PNG aprovado para o repo (256², paleta de 256 cores, alfa binário). Nada é sobrescrito sem existir no manifesto.
    const dest = join(ROOT, 'src/assets/soulmon/novos-arquivo/combinados-formas');
    let n = 0, bytes = 0;
    for (const it of itens) {
      if (!manifesto[`${it.arquivo}|${it.sha}`]) { console.error(`sem imagem aprovada: ${it.arquivo}`); continue; }
      const b = await sharp(join(out, 'raw', `${it.arquivo}.png`)).png({ palette: true, colours: 256, quality: 100, dither: 0, effort: 10 }).toBuffer();
      writeFileSync(join(dest, `${it.arquivo}.png`), b); n++; bytes += b.length;
    }
    console.log(`${n} PNG em ${dest}, ${(bytes / 1048576).toFixed(1)} MB`);
    return;
  }
  if (process.argv.includes('--reprocessar')) {
    const { readdirSync } = await import('node:fs');
    for (const it of itens) {
      const bp = join(out, 'raw', `${it.arquivo}--bruto.png`);
      if (!existsSync(bp)) continue;
      const { png: rec, quality } = chromaKeyPngChecked(new Uint8Array(readFileSync(bp)), it.chroma);
      const { png, tirados } = await limparChave(rec, it.chroma);
      const p256 = await sharp(png).resize(256, 256, { fit: 'contain', kernel: 'nearest', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      writeFileSync(join(out, 'raw', `${it.arquivo}.png`), p256);
      const k = `${it.arquivo}|${it.sha}`;
      if (manifesto[k]) manifesto[k] = { ...manifesto[k], hash: shaDe(p256.toString('base64')), quality: { ...(quality ?? {}), limpeza: tirados } };
      if (tirados > 200) console.log(`${it.arquivo}: limpeza tirou ${tirados} px`);
    }
    writeFileSync(manPath, JSON.stringify(manifesto, null, 1));
    return;
  }
  if (arg('--instalar')) {
    const urls = JSON.parse(readFileSync(arg('--instalar'), 'utf8'));
    let falhas = 0;
    for (const it of pend) {
      if (!urls[it.arquivo]) continue;
      try {
        const res = await fetch(urls[it.arquivo]);
        if (!res.ok) throw new Error(`download ${res.status}`);
        const bruto = new Uint8Array(await res.arrayBuffer());
        const { png: recorte, quality } = chromaKeyPngChecked(bruto, it.chroma);
        const { png, tirados } = await limparChave(recorte, it.chroma);
        if (!pngTemAlfa(png)) throw new Error('recorte sem alfa');
        const p256 = await sharp(png).resize(256, 256, { fit: 'contain', kernel: 'nearest', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
        const hashImg = shaDe(p256.toString('base64'));
        for (const v of Object.values(manifesto)) if (v.hash === hashImg && v.arquivo !== it.arquivo) throw new Error(`imagem repetida de ${v.arquivo}`);
        writeFileSync(join(out, 'raw', `${it.arquivo}--bruto.png`), bruto);
        writeFileSync(join(out, 'raw', `${it.arquivo}.png`), p256);
        manifesto[`${it.arquivo}|${it.sha}`] = { hash: hashImg, arquivo: it.arquivo, elementId: it.elementId, stage: it.stage, quality: { ...(quality ?? {}), limpeza: tirados } };
        writeFileSync(manPath, JSON.stringify(manifesto, null, 1));
        const tags = ['tipo:criatura', 'origem:higgsfield-api', 'modelo:higgsfield-marketing-studio-alpha', 'processo:oraculo-real', 'lote:2026-11-16', 'pacote:combinados-a',
          `estagio:${it.stage}`, `ramo:${it.linha}`, `elemento:${it.elementId}`, ...it.comps.map((c) => `componente:${c}`), `uso:${pilot ? 'piloto' : 'candidato'}`];
        const meta = { prompt: it.prompt, tags, modelo: 'Higgsfield marketing-studio/image (alpha), low 1k 1:1, enhance_prompt false', referencias: [it.refDe], data: '2026-11-16', chroma: it.chroma, uso: pilot ? 'piloto' : 'candidato' };
        writeFileSync(join(out, 'raw', `${it.arquivo}.meta.json`), JSON.stringify(meta, null, 1));
        appendFileSync(REGISTRO, JSON.stringify({ n: `cmb-${it.arquivo}`, file: join(out, 'raw', `${it.arquivo}.png`).replace(/\\/g, '/'), prompt: it.prompt, tags, modelo: 'Higgsfield alpha', data: '2026-11-16', uso: meta.uso }) + '\n');
      } catch (e) { console.error(`${it.arquivo}: ${e.message}`); falhas++; }
    }
    console.log(`Fim: ${falhas} falha(s). Nada no KV.`);
    if (falhas) process.exit(1);
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
