// Gera tudo que a landing nova serve (feedback §18). Rodar na pasta site-beta:
//   node src/tools/preparar-site-assets.mjs
// Lê o manifesto src/content/assets.json: peça gerada presente em E:/Soulmon-marketing/site-assets
// vira public/site/<nome>.webp e o estado passa a aguarda-revisao. Só o humano marca "final".
import sharp from 'sharp';
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const SOUL = '../src/assets/soulmon';
const GERADOS = 'E:/Soulmon-marketing/site-assets';
const PUB = 'public';
for (const d of ['site', 'npc', 'mapa', 'sprites', 'el', 'lote', 'video', 'provisorio']) mkdirSync(`${PUB}/${d}`, { recursive: true });

// ---------- Provisórios: grade de pixel, trocados pelo manifesto ----------
const C = { esc: '#8A5A2B', anel: '#C68642', med: '#D9A05B', cla: '#EBBE84', fundo: '#0F2A29', pri: '#5FF3E0', pri2: '#29C9B8', folha: '#5FA84A' };
const svg = (w, h, s, corpo) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * s}" height="${h * s}" shape-rendering="crispEdges">${corpo}</svg>\n`;
const r = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const tubo = (miolo) => r(0, 0, 1, 8, C.esc) + r(1, 0, 1, 8, C.cla) + r(2, 0, 2, 8, miolo) + r(4, 0, 1, 8, C.anel) + r(5, 0, 1, 8, C.esc);
writeFileSync(`${PUB}/provisorio/barra-corpo.svg`, svg(6, 8, 4, tubo('#12302F')));
writeFileSync(`${PUB}/provisorio/barra-cheio.svg`, svg(6, 8, 4, tubo(C.pri)));
writeFileSync(`${PUB}/provisorio/barra-capa.svg`, svg(6, 6, 4, r(0, 2, 6, 4, C.anel) + r(1, 3, 4, 1, C.cla) + r(2, 0, 2, 2, C.folha)));
const medalhao = (icone) => svg(24, 24, 8, `<circle cx="12" cy="12" r="11.5" fill="${C.anel}"/><circle cx="12" cy="12" r="9.5" fill="${C.esc}"/><circle cx="12" cy="12" r="8.5" fill="${C.fundo}"/>${icone}`);
writeFileSync(`${PUB}/provisorio/passo-1.svg`, medalhao(r(6, 8, 12, 8, C.pri) + r(7, 9, 10, 1, C.fundo) + r(9, 10, 2, 1, C.fundo) + r(13, 10, 2, 1, C.fundo) + r(11, 11, 2, 1, C.fundo)));
writeFileSync(`${PUB}/provisorio/passo-2.svg`, medalhao(r(7, 6, 10, 12, C.cla) + r(9, 8, 6, 1, C.esc) + r(9, 10, 6, 1, C.esc) + r(11, 13, 3, 3, C.pri2)));
writeFileSync(`${PUB}/provisorio/passo-3.svg`, medalhao(r(8, 5, 8, 14, '#071413') + r(9, 6, 6, 11, C.pri2) + r(11, 9, 2, 3, C.folha) + r(10, 10, 4, 1, C.folha)));
writeFileSync(`${PUB}/provisorio/seta.svg`, svg(12, 12, 4, r(1, 5, 7, 2, C.anel) + r(8, 3, 1, 6, C.med) + r(9, 4, 1, 4, C.med) + r(10, 5, 1, 2, C.cla) + r(2, 5, 4, 1, C.pri2)));

// ---------- Peças geradas, a partir do manifesto ----------
const CAMINHO = 'src/content/assets.json';
const manifesto = JSON.parse(readFileSync(CAMINHO, 'utf8'));
for (const [slot, m] of Object.entries(manifesto)) {
  if (slot.startsWith('_') || !m.gerado) continue;
  const png = `${GERADOS}/${m.gerado}.png`;
  if (!existsSync(png)) continue;
  const base = sharp(await sharp(png).trim({ threshold: 1 }).toBuffer());
  const opcoes = m.altura ? { height: m.altura } : { width: m.largura ?? 192 };
  await base.clone().resize(opcoes).webp({ quality: 88, alphaQuality: 90, effort: 6 }).toFile(`${PUB}/site/${m.gerado}.webp`);
  if (slot === 'logo') await base.clone().resize({ width: 240 }).webp({ quality: 82, effort: 6 }).toFile(`${PUB}/site/logo-240.webp`);
  m.src = `/site/${m.gerado}.webp`;
  if (m.estado !== 'final') m.estado = 'aguarda-revisao';
}
writeFileSync(CAMINHO, JSON.stringify(manifesto, null, 2) + '\n');

// ---------- Arte já instalada no jogo ----------
const MAPAS = ['laboratorio', 'jogos', 'arena', 'forja', 'mercado', 'exploracao'];
for (const m of MAPAS) await sharp(`${SOUL}/areas/bg-${m}.png`).resize({ width: 480 }).webp({ quality: 50, effort: 6 }).toFile(`${PUB}/mapa/${m}-480.webp`);
// O herói disputa o LCP: AVIF agressivo; a arte é escura e fica sob véu.
for (const [w, q] of [[480, 26], [620, 24], [760, 22]]) await sharp(`${SOUL}/areas/bg-laboratorio.png`).resize({ width: w }).avif({ quality: q, effort: 9 }).toFile(`${PUB}/mapa/laboratorio-${w}.avif`);

for (const f of ['rookie', 'champion', 'ultimate', 'mega', 'ultra']) {
  await sharp(`${SOUL}/novos/planta-${f}.png`).webp({ lossless: true, effort: 6 }).toFile(`${PUB}/sprites/planta-${f}.webp`);
  await sharp(`${SOUL}/novos/planta-${f}.png`).resize(128, 128, { kernel: 'nearest' }).webp({ lossless: true, effort: 6 }).toFile(`${PUB}/sprites/planta-${f}-128.webp`);
}

// Sem árvore de NPC (npc-arvores) e sem nada com engrenagem aparente.
export const NPCS = ['hall', 'jogos', 'laboratorio-biblioteca-glifa', 'oraculo', 'exploracao', 'cuidados', 'loja-itens', 'loja-decoracao', 'loja-background', 'onboarding', 'ranking-arauto', 'n-cozinheiro', 'n-broto', 'n-corvo', 'laboratorio-pet', 'n-musa', 'arena', 'f-forja', 'mercado-cambista'];
for (const n of NPCS) await sharp(`${SOUL}/npcs/npc-${n}.png`).resize(256, 256).webp({ quality: 74, alphaQuality: 80, effort: 6 }).toFile(`${PUB}/npc/${n}.webp`);

const ELS = 'agua ar arcano eletricidade espaco fada fogo gravidade industrial luz marcial morte planta som sombra tempo terra vida vigor vileza'.split(' ');
for (const e of ELS) await sharp(`${SOUL}/elementos/el-${e}.png`).webp({ lossless: true, effort: 6 }).toFile(`${PUB}/el/${e}.webp`);

const LOTES = { ppt: 'jogos-ppt', mente: 'jogos-mente', rift: 'exploracao-endless-rift', duelo: 'arena-duelo', torneio: 'arena-torneio', guilda: 'hall-guilda' };
for (const [k, f] of Object.entries(LOTES)) await sharp(`${SOUL}/areas/lote-${f}.png`).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 74, alphaQuality: 80, effort: 6 }).toFile(`${PUB}/lote/${k}.webp`);

copyFileSync('../src/assets/brand/intro.mp4', `${PUB}/video/intro.mp4`);
copyFileSync('../src/assets/brand/intro-poster.webp', `${PUB}/video/intro-poster.webp`);
console.log('ok', Object.entries(manifesto).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `${k}:${v.estado}`).join(' '));
