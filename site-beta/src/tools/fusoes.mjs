// Ícones de elemento fundido para o sorteio (dono, 09/11): par de elementos -> ícone do elemento derivado.
// Fonte: D:/Soulmon/repo (derivedElements.ts + assets/soulmon/combate/elemento). Saída: public/el/fusao/<id>.webp + src/content/fusoes.json
import fs from 'node:fs'; import sharp from 'sharp';
const R = 'D:/Soulmon/repo/src';
const der = fs.readFileSync(`${R}/utils/soulProfile/derivedElements.ts`, 'utf8');
const cur = fs.readFileSync(`${R}/utils/elementosCurados.ts`, 'utf8');
const out = {}; fs.mkdirSync('public/el/fusao', { recursive: true });
for (const m of der.matchAll(/\{ id: "(\w+)", nome: "([^"]+)", componentes: \["(\w+)", "(\w+)"\] \}/g)) {
  const [, id, nome, a, b] = m; const png = `${R}/assets/soulmon/combate/elemento/${id}.png`;
  if (!fs.existsSync(png)) continue;
  const en = cur.match(new RegExp(`${id}: \{ pt: '[^']*', en: '([^']*)'`))?.[1] ?? nome;
  await sharp(png).resize(64, 64, { kernel: 'nearest', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ lossless: true }).toFile(`public/el/fusao/${id}.webp`);
  out[[a, b].sort().join(',')] = [id, nome, en];
}
fs.writeFileSync('src/content/fusoes.json', JSON.stringify(out));
console.log(Object.keys(out).length);
