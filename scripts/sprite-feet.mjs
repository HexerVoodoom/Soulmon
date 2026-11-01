// ONDE FICA O PÉ DE CADA SPRITE — medido do PNG, nunca à mão.
//   node scripts/sprite-feet.mjs          → regrava src/utils/spriteFeetTable.ts
// Causa do "Soulmon flutuando em cima da sombra": os PNGs têm linhas transparentes embaixo (0–25% da altura) e o layout
// ancorava a SOMBRA na borda da caixa do PNG, não no último pixel opaco. Esta tabela dá o pé exato (síncrono, sem esperar
// o canvas) para toda a arte empacotada; a arte que chega por URL (sprites dos jogadores) é medida em runtime
// (`utils/spriteScale.ts → measureVisibleFill`), com o mesmo critério (alfa > 16).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..');
const BASE = path.join(ROOT, 'src/assets/soulmon');
/** Pastas de CRIATURA (as que o palco/visor ancora num chão). `lines/icons` é miniatura de UI, fica fora. */
export const FEET_DIRS = ['lines', 'inimigos-api', 'inimigos-tema', 'bosses', 'desafiantes', 'dino', 'dreams', 'dungeon-rogue', 'arena', 'duelo'];
export const ALPHA_MIN = 16;

export function listFeetFiles() {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'icons') walk(p); }
      else if (/\.png$/i.test(e.name)) out.push(p);
    }
  };
  for (const dir of FEET_DIRS) if (fs.existsSync(path.join(BASE, dir))) walk(path.join(BASE, dir));
  return out.sort();
}

/** Base da caixa visível em milésimos da altura (1000 = o pé toca a borda de baixo). */
export async function measureFeet(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = info.height - 1; y >= 0; y--) {
    for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > ALPHA_MIN) return Math.round(((y + 1) / info.height) * 1000);
  }
  return null; // PNG vazio
}

export async function measureAll() {
  const table = {};
  const ambiguos = new Set();
  for (const f of listFeetFiles()) {
    const key = path.basename(f, path.extname(f));
    const v = await measureFeet(f);
    if (v === null) continue;
    // Mesmo nome em duas pastas com pés diferentes: a tabela não sabe qual é qual (o build tira a pasta da URL) → não afirma
    // nada; essa arte cai na medição de runtime. `ambiguos` lista quem ficou de fora (o teste de contrato os conhece).
    if (key in table && Math.abs(table[key] - v) > 10) { ambiguos.add(key); continue; }
    table[key] = Math.min(table[key] ?? v, v);
  }
  for (const k of ambiguos) delete table[k];
  console.log(`ambíguos (medidos em runtime): ${[...ambiguos].join(', ') || 'nenhum'}`);
  return table;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const t = await measureAll();
  const rows = Object.keys(t).sort().map((k) => `  ${/^[a-z][a-z0-9]*$/i.test(k) ? k : `'${k}'`}: ${t[k]},`);
  const body = `// GERADO por \`node scripts/sprite-feet.mjs\` — NÃO edite à mão (o teste \`spriteFeet.contract.test.ts\` remede os PNG).
// Chave = nome do arquivo sem extensão e sem hash do build. Valor = onde está o último pixel opaco (alfa > 16), em milésimos
// da altura do PNG: 1000 = o pé toca a borda de baixo; 800 = 20% de linhas transparentes embaixo (o bicho "flutua" se o layout
// alinhar pela caixa). Quem ancora o pé na sombra lê isto via \`visibleBottomOf\` (utils/spriteScale.ts).
export const SPRITE_FEET_TABLE: Readonly<Record<string, number>> = {
${rows.join('\n')}
};
`;
  fs.writeFileSync(path.join(ROOT, 'src/utils/spriteFeetTable.ts'), body);
  console.log(`${rows.length} sprites → src/utils/spriteFeetTable.ts`);
}
