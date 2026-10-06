// Gera as MINIATURAS e o CATALOGO FECHADO de avatares de perfil (Tarefa C, 06/10/2026).
// Fontes (todas NPCs): ativos (src/assets/soulmon/npcs + desafiantes), banco por dominio
// (src/assets/dominios/<dominio>/npcs) e _npcs-extras. Saida: src/assets/avatares/<id>.webp (128 px, alfa
// preservado), catalogo.json (a lista fechada) e functions/api/_avatares.js (espelho do servidor).
// Fonte e SEMPRE o arquivo atual; rodar duas vezes sem mexer em nada reescreve bytes identicos (idempotente).
import { readdir, writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import sharp from 'sharp';

const SRC = 'src/assets';
const OUT = join(SRC, 'avatares');
const LADO = 128;
const entradas = [];

async function pngs(dir) {
  try { return (await readdir(dir)).filter(f => f.endsWith('.png')).sort(); } catch { return []; }
}
const slug = (arq, tira) => basename(arq, '.png').replace(/^npc-/, '').replace(tira, '');

for (const f of await pngs(join(SRC, 'soulmon/npcs'))) entradas.push({ grupo: 'ativo', arq: join(SRC, 'soulmon/npcs', f), nome: slug(f, '') });
for (const f of await pngs(join(SRC, 'soulmon/desafiantes'))) if (f.startsWith('npc-')) entradas.push({ grupo: 'ativo', arq: join(SRC, 'soulmon/desafiantes', f), nome: slug(f, '') });
for (const d of (await readdir(join(SRC, 'dominios'), { withFileTypes: true })).filter(e => e.isDirectory() && !e.name.startsWith('_')).map(e => e.name).sort()) {
  for (const f of await pngs(join(SRC, 'dominios', d, 'npcs'))) entradas.push({ grupo: d, arq: join(SRC, 'dominios', d, 'npcs', f), nome: slug(f, new RegExp(`^${d}-`)) });
}
for (const f of await pngs(join(SRC, 'dominios/_npcs-extras'))) entradas.push({ grupo: 'extra', arq: join(SRC, 'dominios/_npcs-extras', f), nome: slug(f, /^extra-/) });

await mkdir(OUT, { recursive: true });
const vistos = new Set();
const cat = [];
for (const e of entradas) {
  const id = `${e.grupo}-${e.nome}`.slice(0, 48);
  if (vistos.has(id)) throw new Error(`id repetido: ${id}`);
  vistos.add(id);
  await sharp(e.arq).resize(LADO, LADO, { fit: 'cover' }).webp({ quality: 82, alphaQuality: 90 }).toFile(join(OUT, `${id}.webp`));
  cat.push({ id, g: e.grupo, n: e.nome });
}
await writeFile(join(OUT, 'catalogo.json'), JSON.stringify(cat) + '\n');
await writeFile('functions/api/_avatares.js',
`// GERADO por scripts/gerar-avatares.mjs — NAO editar a mao. A lista FECHADA de avatares de perfil (so ids).
// O servidor guarda/devolve apenas ids desta lista; qualquer outra coisa vira null. Paridade com
// src/assets/avatares/catalogo.json travada em src/utils/avatar.test.ts.
export const AVATAR_IDS = new Set(${JSON.stringify(cat.map(c => c.id))});
`);
console.log(`${cat.length} avatares`);
