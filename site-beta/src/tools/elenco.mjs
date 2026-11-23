// Elenco elegível do site: todo soulmon/novos menos as exclusões abaixo (cada uma com motivo). Gera src/content/elenco.json e os sprites 256 em public/sprites.
// Rodar: node src/tools/elenco.mjs   (NOVOS = D:/Soulmon/repo/src/assets/soulmon/novos)
import sharp from 'sharp';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
const NOVOS = 'D:/Soulmon/repo/src/assets/soulmon/novos';
const ELS = 'agua ar arcano eletricidade espaco fada fogo gravidade industrial luz marcial morte planta som sombra tempo terra vida vigor vileza'.split(' ');
const FM = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];
const EXCL = {
  'agua-mega': 'lontra com escudo (pedido do dono)', 'agua-ultra': 'mesma lontra com escudo, outra forma',
  'terra-mega': 'auréola dourada',
  'ar-mega': 'anel de auréola na cabeça', 'eletricidade-mega': 'anel de auréola',
  'tempo-ultimate': 'cara de máquina (robô)', 'tempo-ultra': 'cara de máquina (robô)',
  'eletricidade-ultimate': 'cara de máquina (robô)', 'eletricidade-ultra': 'cara de máquina (mecha)',
  'gravidade-ultimate': 'pernas mecânicas', 'vida-mega': 'pernas mecânicas',
  'eletricidade-rookie': 'lembra personagem de franquia famosa',
  'marcial-champion': 'lembra personagem de franquia famosa', 'marcial-ultimate': 'figura divina de vários braços (sensível)',
};
for (const f of FM) { EXCL[`luz-${f}`] = 'criatura de luz dourada com auréola (pedido do dono)'; EXCL[`industrial-${f}`] = 'canos e vapor: leitura steampunk'; }
const incl = [];
for (const e of ELS) FM.forEach((f, i) => { if (!EXCL[`${e}-${f}`]) incl.push({ id: `${e}-${f}`, src: `${NOVOS}/${e}-${f}.png`, el: e, forma: i + 1 }); });
// Extras do banco (E:/Soulmon-marketing/site-assets/elenco-resolvido.json, "elenco_sorteio"): os que não estão em novos/. Elementos vêm do manifest.json de novos-arquivo.
const R = JSON.parse(readFileSync('E:/Soulmon-marketing/site-assets/elenco-resolvido.json', 'utf8')).elenco_sorteio;
const MAN = JSON.parse(readFileSync('D:/Soulmon/repo/src/assets/soulmon/novos-arquivo/manifest.json', 'utf8')).combined;
const EXTRA_EXCL = { L113: 'golem dourado com auréola (o dono mandou remover)' };
const FORMA = { rookie: 1, champion: 2, ultimate: 3, mega: 4, ultra: 5 };
for (const [cod, path] of Object.entries(R)) {
  if (path.includes('/novos/')) continue; // já entra pelo conjunto de novos/
  if (EXTRA_EXCL[cod]) { EXCL[cod] = EXTRA_EXCL[cod]; continue; }
  const nome = path.split('/').pop().replace('.png', '');
  const m = MAN.find((x) => x.file.split('/').pop().replace('.png', '') === nome.replace(/-(champion|ultimate|mega|rookie|ultra)$/, ''));
  const st = (nome.match(/(rookie|champion|ultimate|mega|ultra)$/) || [])[1];
  const ramo = path.match(/ramos\/([a-z]+)\//);
  incl.push({ id: `x-${cod.toLowerCase()}`, src: path, el: ramo ? ramo[1] : cod === 'V1' ? 'agua' : cod === 'BB45' ? 'agua,vileza,morte' : (m ? m.components.join(',') : ''), forma: st ? FORMA[st] : 0 });
}
writeFileSync('src/content/elenco.json', JSON.stringify({ _nota: 'Gerado por src/tools/elenco.mjs. forma 0 = estágio desconhecido (não mostra "Forma N"). el com vírgula = elemento combinado.', elegiveis: incl.map(({ id, el, forma }) => ({ id, el, forma })), excluidos: EXCL }, null, 1));
for (const { id, src } of incl) {
  const dst = `public/sprites/${id}.webp`; if (existsSync(dst)) continue;
  const pal = await sharp(src).png({ palette: true, colors: 256, dither: 0, effort: 10 }).toBuffer();
  await sharp(pal).webp({ lossless: true, effort: 6 }).toFile(dst);
}
console.log(incl.length, 'elegíveis;', Object.keys(EXCL).length, 'excluídos');
