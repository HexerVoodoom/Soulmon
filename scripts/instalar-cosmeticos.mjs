// Instala os COSMÉTICOS gerados (cenários, molduras, decorações) no repo. Idempotente: roda de novo
// quando chegarem as peças que faltam — a fonte é SEMPRE o arquivo canônico atual da pasta de origem
// (nunca um backup), então a segunda execução seguida não muda nada.
//
//   node scripts/instalar-cosmeticos.mjs [pasta-de-origem]      (padrão: E:/Soulmon-assets/cosmeticos)
//
// Origem esperada: cenarios/bg-*.png (1200×648 opacos), molduras/frame-*.png (alfa real, buraco central),
// decoracoes/furn-*.png (alfa real, caixa do slot × 8).
// Destino (o catálogo `src/utils/cosmeticosNovos.ts` só enxerga a peça quando o arquivo existe):
//   cenário   → src/assets/backgrounds/<id>.webp  + backgrounds/thumbs/<id>.png (96×52)
//   moldura   → src/assets/soulmon/molduras/<id>.png (192², alfa binário, miolo 64² vazio — contrato de teste)
//   decoração → src/assets/decor/<id>.webp (caixa do slot × 3; tapete × 2, como as 33 peças anteriores)
//   + android/app/src/main/res/drawable-nodpi/vpet_bg_<id>.webp (360×194, miniatura do widget V-Pet)
// Também regrava src/utils/cosmeticosNovosCores.ts (baseColor de cada cenário).
import { readdir, readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEM = process.argv[2] ?? 'E:/Soulmon-assets/cosmeticos';
const A = join(RAIZ, 'src/assets');

async function pngs(sub, prefixo) {
  try { return (await readdir(join(ORIGEM, sub))).filter(f => f.startsWith(prefixo) && f.endsWith('.png')).sort(); }
  catch { return []; }
}
const kb = async p => Math.round((await stat(p)).size / 1024);
let total = 0;

// ── cenários ────────────────────────────────────────────────────────────────
await mkdir(join(A, 'backgrounds/thumbs'), { recursive: true });
const cores = {};
// instalar só alguns cenários (ex.: troca de arte de um id) não pode apagar o baseColor dos demais: parte do arquivo atual
try {
  const atual = await readFile(join(RAIZ, 'src/utils/cosmeticosNovosCores.ts'), 'utf8');
  for (const m of atual.matchAll(/'(bg-[^']+)': '(#[0-9a-f]{6})'/g)) cores[m[1]] = m[2];
} catch { /* primeira execução */ }
const instalados = [];
for (const f of await pngs('cenarios', 'bg-')) {
  const id = f.replace(/\.png$/, '');
  const src = join(ORIGEM, 'cenarios', f);
  const meta = await sharp(src).metadata();
  if (meta.width !== 1200 || meta.height !== 648) throw new Error(`${f}: esperado 1200×648, veio ${meta.width}×${meta.height}`);
  const out = join(A, 'backgrounds', `${id}.webp`);
  await sharp(src).removeAlpha().webp({ quality: 78, effort: 6 }).toFile(out);
  await sharp(src).removeAlpha().resize(96, 52, { fit: 'cover', kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(join(A, 'backgrounds/thumbs', `${id}.png`));
  // miniatura do widget V-Pet (Android procura `vpet_bg_<id com _>.webp`; contrato em widgetVpetSonoFundo.contract.test.ts)
  await sharp(src).removeAlpha().resize(360, 194, { fit: 'cover', kernel: 'lanczos3' }).webp({ quality: 80 }).toFile(join(RAIZ, 'android/app/src/main/res/drawable-nodpi', `vpet_bg_${id.replace(/-/g, '_')}.webp`));
  // baseColor = média dos 32 px de baixo (mesma convenção dos outros pintados)
  const { data, info } = await sharp(src).removeAlpha().extract({ left: 0, top: 648 - 32, width: 1200, height: 32 }).raw().toBuffer({ resolveWithObject: true });
  const s = [0, 0, 0]; const n = info.width * info.height;
  for (let i = 0; i < data.length; i += 3) { s[0] += data[i]; s[1] += data[i + 1]; s[2] += data[i + 2]; }
  cores[id] = '#' + s.map(v => Math.round(v / n).toString(16).padStart(2, '0')).join('');
  instalados.push(id);
  total += await kb(out);
}
const linhas = Object.keys(cores).sort().map(id => `  '${id}': '${cores[id]}',`).join('\n');
await writeFile(join(RAIZ, 'src/utils/cosmeticosNovosCores.ts'),
  `// GERADO por \`node scripts/instalar-cosmeticos.mjs\` — não editar. baseColor (média dos 32 px de baixo) de cada cenário novo.\nexport const COSMETICOS_NOVOS_CORES: Readonly<Record<string, string>> = {\n${linhas}\n};\n`);

// ── molduras ────────────────────────────────────────────────────────────────
await mkdir(join(A, 'soulmon/molduras'), { recursive: true });
const CANVAS = 192, MIOLO = 64;
for (const f of await pngs('molduras', 'frame-')) {
  const id = f.replace(/\.png$/, '');
  const { data } = await sharp(join(ORIGEM, 'molduras', f)).ensureAlpha().resize(CANVAS, CANVAS, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  const c0 = CANVAS / 2 - MIOLO / 2;
  for (let p = 0; p < CANVAS * CANVAS; p++) {
    const y = Math.floor(p / CANVAS), x = p % CANVAS, i = p * 4;
    const dentro = x >= c0 && x < c0 + MIOLO && y >= c0 && y < c0 + MIOLO;
    data[i + 3] = !dentro && data[i + 3] >= 128 ? 255 : 0; // alfa BINÁRIO + miolo vazio (contrato: arteDono20261004.contract.test.ts)
    if (!data[i + 3]) data[i] = data[i + 1] = data[i + 2] = 0;
  }
  const out = join(A, 'soulmon/molduras', `${id}.png`);
  await sharp(data, { raw: { width: CANVAS, height: CANVAS, channels: 4 } }).png({ compressionLevel: 9, palette: false }).toFile(out);
  total += await kb(out);
}

// ── decorações ──────────────────────────────────────────────────────────────
await mkdir(join(A, 'decor'), { recursive: true });
// origem (caixa × 8, tapete × 8) → destino (caixa × 3, tapete × 2)
const DEST = { '448x448': [168, 168], '384x416': [144, 156], '448x320': [168, 120], '832x128': [208, 32] };
for (const f of await pngs('decoracoes', 'furn-')) {
  const id = f.replace(/\.png$/, '');
  const src = join(ORIGEM, 'decoracoes', f);
  const m = await sharp(src).metadata();
  const d = DEST[`${m.width}x${m.height}`];
  if (!d) throw new Error(`${f}: tamanho de origem ${m.width}×${m.height} sem destino conhecido (acrescente em DEST)`);
  const out = join(A, 'decor', `${id}.webp`);
  await sharp(src).ensureAlpha().resize(d[0], d[1], { kernel: 'lanczos3' }).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(out);
  total += await kb(out);
}
console.log(`instalado: ${instalados.length} cenários, ${(await pngs('molduras', 'frame-')).length} molduras, ${(await pngs('decoracoes', 'furn-')).length} decorações — ${total} KB (sem as miniaturas)`);
