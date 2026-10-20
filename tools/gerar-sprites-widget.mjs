// Gera os drawables do WIDGET ANDROID a partir dos 5 INICIAIS (decisão do dono, 20/10/2026, §138).
//
// FONTE = SEMPRE o PNG canônico `src/assets/soulmon/starters/<id>.png` (512², alfa real).
// O drawable é DERIVADO e nunca é lido de volta. Idempotente: roda duas vezes seguidas = a
// segunda é no-op (só regrava se os bytes mudarem).
//
//   node tools/gerar-sprites-widget.mjs          # gera/atualiza e apaga os sprite_* genéricos órfãos
//   node tools/gerar-sprites-widget.mjs --check  # só confere (exit 1 se algo diverge); não escreve
//
// Saída: `android/app/src/main/res/drawable-nodpi/sprite_starter_<id>.png`, 256² (o widget mostra
// no máximo 64dp × xxxhdpi = 256px; `WidgetRenderer.spriteBitmap` reescala uma vez), PNG
// paletizado com alfa (~30-50 KB cada). Os `sprite_corvo_*` NÃO são tocados (outro dono: corvoPet).
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src', 'assets', 'soulmon', 'starters');
const OUT = join(ROOT, 'android', 'app', 'src', 'main', 'res', 'drawable-nodpi');
const SIZE = 256;
// Mesma ordem de `STARTER_IDS` (src/utils/sprites.ts): a régua `widgetSprites.contract.test.ts` trava.
const STARTERS = ['industrial', 'nascente', 'alento', 'vida', 'meteoro'];
const check = process.argv.includes('--check');
let divergiu = false;

mkdirSync(OUT, { recursive: true });
for (const id of STARTERS) {
  const src = join(SRC, `${id}.png`);
  if (!existsSync(src)) { console.error(`FALTA a fonte canônica: ${src}`); process.exit(2); }
  const buf = await sharp(src)
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' })
    .png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 })
    .toBuffer();
  const dest = join(OUT, `sprite_starter_${id}.png`);
  const atual = existsSync(dest) ? readFileSync(dest) : null;
  if (atual && atual.equals(buf)) { console.log('ok      ', id, `${buf.length} B`); continue; }
  divergiu = true;
  if (check) { console.log('DIVERGE ', id); continue; }
  writeFileSync(dest, buf);
  console.log('gerado  ', id, `${buf.length} B`);
}

// Os sprite_* da árvore genérica aposentada (D-104) e qualquer outro que não seja inicial/corvo.
const orfaos = readdirSync(OUT).filter(f =>
  /^sprite_.*\.png$/.test(f) && !f.startsWith('sprite_corvo_') && !STARTERS.some(id => f === `sprite_starter_${id}.png`));
for (const f of orfaos) {
  divergiu = true;
  if (check) { console.log('ÓRFÃO  ', f); continue; }
  unlinkSync(join(OUT, f));
  console.log('removido', f);
}
if (check && divergiu) process.exit(1);
