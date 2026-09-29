// Gera 3 LINHAS completas de Soulmon placeholder (uma por branch/alinhamento)
// + backgrounds do Tournament e da Dungeon. Usadas na dungeon e como
// placeholder de pets até o Higgsfield gerar os sprites de cada usuário.
// Rode: node scripts/gen-soulmon-lines.mjs
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join } from 'path';

const OUT = join(process.cwd(), 'src', 'assets', 'soulmon');
mkdirSync(join(OUT, 'lines'), { recursive: true });
mkdirSync(join(OUT, 'bg'), { recursive: true });

const LINES = {
  // Poder (power) — "Ignar", criatura raposa/chama
  ignar: { c: { main: '#3fae5a', dark: '#2c7d41', glow: '#8fe3a5' }, shape: 'kit' },
  // Harmonia (data) — "Lumel", orbe geométrico
  lumel: { c: { main: '#4f8fd9', dark: '#37639b', glow: '#a6ccf5' }, shape: 'orb' },
  // Benevolência (benevolence) — "Serah", espírito-água-viva
  serah: { c: { main: '#d9a441', dark: '#a1762a', glow: '#f2d79b' }, shape: 'wisp' },
};
const STAGES = ['rookie', 'champion', 'ultimate', 'mega'];

function body(shape, cx, cy, r, c) {
  if (shape === 'kit') {
    // corpo arredondado + orelhas pontudas grandes + cauda
    return `
      <path d="M ${cx - r * 0.7} ${cy - r * 0.5} L ${cx - r * 0.95} ${cy - r - 20} L ${cx - r * 0.15} ${cy - r * 0.85} Z" fill="${c.dark}"/>
      <path d="M ${cx + r * 0.7} ${cy - r * 0.5} L ${cx + r * 0.95} ${cy - r - 20} L ${cx + r * 0.15} ${cy - r * 0.85} Z" fill="${c.dark}"/>
      <path d="M ${cx + r * 0.8} ${cy + r * 0.4} Q ${cx + r + 18} ${cy + r * 0.2} ${cx + r + 10} ${cy - r * 0.5} Q ${cx + r + 2} ${cy} ${cx + r * 0.7} ${cy + r * 0.1} Z" fill="${c.glow}"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.92}" fill="${c.main}"/>`;
  }
  if (shape === 'wisp') {
    // sino de água-viva + tentáculos
    let tent = '';
    for (let i = -2; i <= 2; i++) {
      tent += `<path d="M ${cx + i * r * 0.35} ${cy + r * 0.55} q ${i * 4} ${r * 0.5} 0 ${r * 0.85}" stroke="${c.glow}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    }
    return `${tent}<path d="M ${cx - r} ${cy + r * 0.35} A ${r} ${r} 0 1 1 ${cx + r} ${cy + r * 0.35} Q ${cx} ${cy + r * 0.75} ${cx - r} ${cy + r * 0.35} Z" fill="${c.main}"/>`;
  }
  // orb: círculo com anel de facetas
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.main}"/>
    <path d="M ${cx - r * 0.85} ${cy} L ${cx} ${cy - r * 0.85} L ${cx + r * 0.85} ${cy} L ${cx} ${cy + r * 0.85} Z" fill="none" stroke="${c.glow}" stroke-width="2.5" opacity="0.75"/>`;
}

function creature(shape, c, level) {
  const cx = 64, cy = 70;
  const r = 20 + level * 6;
  let extras = '';
  if (level >= 2) extras += `<circle cx="${cx}" cy="${cy}" r="${r + 12}" fill="none" stroke="${c.glow}" stroke-width="2.5" stroke-dasharray="6 8" opacity="0.8"/>`;
  if (level >= 3) extras += `<circle cx="${cx}" cy="${cy}" r="${r + 21}" fill="none" stroke="${c.glow}" stroke-width="1.8" stroke-dasharray="2 10" opacity="0.6"/>`;
  if (level >= 4) {
    const y = cy - r - 10;
    extras += `<path d="M ${cx - 14} ${y} L ${cx - 10} ${y - 12} L ${cx - 4} ${y - 4} L ${cx} ${y - 14} L ${cx + 4} ${y - 4} L ${cx + 10} ${y - 12} L ${cx + 14} ${y} Z" fill="${c.glow}" stroke="${c.dark}" stroke-width="1.5"/>`;
  }
  let dots = '';
  for (let i = 0; i < 3 + level; i++) {
    const a = (Math.PI * 2 * i) / (3 + level) + 0.7;
    const rr = r + 15 + (i % 2) * 6;
    dots += `<circle cx="${cx + Math.cos(a) * rr}" cy="${cy + Math.sin(a) * rr * 0.8}" r="${2 + (i % 2)}" fill="${c.glow}"/>`;
  }
  const eyeY = cy - r * 0.12, eyeDx = r * 0.36;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  ${extras}
  <ellipse cx="${cx}" cy="${cy + r}" rx="${r * 0.8}" ry="5" fill="#000" opacity="0.15"/>
  ${body(shape, cx, cy, r, c)}
  <circle cx="${cx - r * 0.3}" cy="${cy - r * 0.35}" r="${r * 0.3}" fill="#ffffff" opacity="0.25"/>
  <circle cx="${cx - eyeDx}" cy="${eyeY}" r="${3.2 + level * 0.4}" fill="#1d1832"/>
  <circle cx="${cx + eyeDx}" cy="${eyeY}" r="${3.2 + level * 0.4}" fill="#1d1832"/>
  <circle cx="${cx - eyeDx + 1.3}" cy="${eyeY - 1.3}" r="1.2" fill="#fff"/>
  <circle cx="${cx + eyeDx + 1.3}" cy="${eyeY - 1.3}" r="1.2" fill="#fff"/>
  <path d="M ${cx - 4} ${cy + r * 0.26} Q ${cx} ${cy + r * 0.4} ${cx + 4} ${cy + r * 0.26}" stroke="#1d1832" stroke-width="2" fill="none" stroke-linecap="round"/>
  ${dots}
</svg>`;
}

for (const [name, { c, shape }] of Object.entries(LINES)) {
  for (let i = 0; i < STAGES.length; i++) {
    const svg = creature(shape, c, i + 1);
    await sharp(Buffer.from(svg)).png().toFile(join(OUT, 'lines', `${name}-${STAGES[i]}.png`));
    console.log('gerado', `${name}-${STAGES[i]}`);
  }
}

// ── Backgrounds (960×540) ────────────────────────────────────────────────────
function bgSvg(kind) {
  const W = 960, H = 540;
  if (kind === 'tournament') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs><radialGradient id="g" cx="50%" cy="30%"><stop offset="0%" stop-color="#4a3b8f"/><stop offset="60%" stop-color="#2b2352"/><stop offset="100%" stop-color="#171233"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      ${Array.from({ length: 60 }, () => `<circle cx="${Math.random() * W}" cy="${Math.random() * H * 0.7}" r="${Math.random() * 1.8 + 0.4}" fill="#cfc6f7" opacity="${0.3 + Math.random() * 0.5}"/>`).join('')}
      <ellipse cx="${W / 2}" cy="${H * 0.86}" rx="${W * 0.36}" ry="34" fill="#1c1638" stroke="#6d5bd0" stroke-width="3"/>
      <ellipse cx="${W / 2}" cy="${H * 0.84}" rx="${W * 0.3}" ry="26" fill="#241c46" stroke="#8f7fe8" stroke-width="2"/>
      <path d="M ${W / 2 - 40} 90 h80 v14 h-14 a26 26 0 0 1 -52 0 h-14 Z" fill="none" stroke="#d9a441" stroke-width="4"/>
      <circle cx="${W / 2}" cy="70" r="26" fill="none" stroke="#d9a441" stroke-width="4"/>
    </svg>`;
  }
  // dungeon-N: cavernas espirituais com paleta variável
  const palettes = [
    ['#233b53', '#14243a', '#4f8fd9'], ['#2c4a33', '#152a1c', '#3fae5a'],
    ['#4a3b2a', '#2a2013', '#d9a441'], ['#3a2a4a', '#1f1430', '#8f7fe8'],
    ['#4a2a35', '#2a1420', '#d96a8a'],
  ];
  const [mid, darkc, accent] = palettes[(+kind.split('-')[1] - 1) % palettes.length];
  let stal = '';
  for (let i = 0; i < 10; i++) {
    const x = (i + 0.5) * (W / 10) + (Math.random() * 40 - 20);
    const h = 50 + Math.random() * 90;
    stal += `<path d="M ${x - 26} 0 L ${x} ${h} L ${x + 26} 0 Z" fill="${darkc}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${mid}"/><stop offset="100%" stop-color="${darkc}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    ${stal}
    ${Array.from({ length: 26 }, () => `<circle cx="${Math.random() * W}" cy="${Math.random() * H}" r="${Math.random() * 2.2 + 0.6}" fill="${accent}" opacity="${0.25 + Math.random() * 0.4}"/>`).join('')}
    <ellipse cx="${W / 2}" cy="${H * 0.94}" rx="${W * 0.46}" ry="30" fill="${darkc}"/>
    <ellipse cx="${W / 2}" cy="${H * 0.92}" rx="${W * 0.4}" ry="22" fill="${mid}" opacity="0.7"/>
  </svg>`;
}

const bgs = ['tournament', 'dungeon-1', 'dungeon-2', 'dungeon-3', 'dungeon-4', 'dungeon-5'];
for (const b of bgs) {
  await sharp(Buffer.from(bgSvg(b))).png().toFile(join(OUT, 'bg', `${b}.png`));
  console.log('gerado bg', b);
}
