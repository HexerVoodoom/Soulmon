// Gera sprites placeholder da árvore do Soulmon (estética espiritual-digital
// minimalista) até o Higgsfield ser integrado ao app. 128×128 PNG, um por
// forma jogável + 1 inimigo de masmorra. Rode: node scripts/gen-soulmon-placeholders.mjs
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join } from 'path';

const OUT = join(process.cwd(), 'src', 'assets', 'soulmon');
mkdirSync(OUT, { recursive: true });

const BRANCH_COLORS = {
  virus:   { main: '#3fae5a', dark: '#2c7d41', glow: '#8fe3a5' },
  data:    { main: '#4f8fd9', dark: '#37639b', glow: '#a6ccf5' },
  vaccine: { main: '#d9a441', dark: '#a1762a', glow: '#f2d79b' },
  neutral: { main: '#8f7fe8', dark: '#6d5bd0', glow: '#cfc6f7' },
  ultra:   { main: '#e8c96a', dark: '#b0812c', glow: '#fff3cf' },
  enemy:   { main: '#5a4a7a', dark: '#3a2f52', glow: '#9a86c9' },
};

// Criatura geométrica: corpo redondo + olhos; complexidade cresce com o nível.
function creature({ c, level, spiky = false }) {
  const cx = 64, cy = 70;
  const r = 22 + level * 5; // corpo cresce por nível
  let extras = '';
  // Aura em anéis (nível ≥ 2)
  if (level >= 2) extras += `<circle cx="${cx}" cy="${cy}" r="${r + 12}" fill="none" stroke="${c.glow}" stroke-width="2.5" stroke-dasharray="6 8" opacity="0.8"/>`;
  if (level >= 3) extras += `<circle cx="${cx}" cy="${cy}" r="${r + 22}" fill="none" stroke="${c.glow}" stroke-width="1.8" stroke-dasharray="2 10" opacity="0.6"/>`;
  // Chifres/orelhas (nível ≥ 1)
  if (level >= 1 && !spiky) {
    extras += `<path d="M ${cx - r * 0.6} ${cy - r * 0.7} L ${cx - r * 0.85} ${cy - r - 14} L ${cx - r * 0.25} ${cy - r * 0.9} Z" fill="${c.dark}"/>`;
    extras += `<path d="M ${cx + r * 0.6} ${cy - r * 0.7} L ${cx + r * 0.85} ${cy - r - 14} L ${cx + r * 0.25} ${cy - r * 0.9} Z" fill="${c.dark}"/>`;
  }
  if (spiky) {
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
      const x1 = cx + Math.cos(a) * r * 0.95, y1 = cy + Math.sin(a) * r * 0.95;
      const x2 = cx + Math.cos(a) * (r + 13), y2 = cy + Math.sin(a) * (r + 13);
      extras += `<path d="M ${x1 - 4} ${y1} L ${x2} ${y2} L ${x1 + 4} ${y1} Z" fill="${c.dark}"/>`;
    }
  }
  // Coroa (nível 4 = mega/ultra)
  if (level >= 4) {
    const y = cy - r - 8;
    extras += `<path d="M ${cx - 14} ${y} L ${cx - 10} ${y - 12} L ${cx - 4} ${y - 4} L ${cx} ${y - 14} L ${cx + 4} ${y - 4} L ${cx + 10} ${y - 12} L ${cx + 14} ${y} Z" fill="${c.glow}" stroke="${c.dark}" stroke-width="1.5"/>`;
  }
  // Partículas espirituais
  let dots = '';
  for (let i = 0; i < 3 + level; i++) {
    const a = (Math.PI * 2 * i) / (3 + level) + 0.7;
    const rr = r + 16 + (i % 2) * 6;
    dots += `<circle cx="${cx + Math.cos(a) * rr}" cy="${cy + Math.sin(a) * rr * 0.8}" r="${2 + (i % 2)}" fill="${c.glow}"/>`;
  }
  const eyeY = cy - r * 0.15, eyeDx = r * 0.38;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  ${extras}
  <ellipse cx="${cx}" cy="${cy + r * 0.95}" rx="${r * 0.8}" ry="5" fill="#000" opacity="0.15"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.main}"/>
  <circle cx="${cx - r * 0.3}" cy="${cy - r * 0.35}" r="${r * 0.32}" fill="#ffffff" opacity="0.25"/>
  <circle cx="${cx - eyeDx}" cy="${eyeY}" r="${3.4 + level * 0.4}" fill="#1d1832"/>
  <circle cx="${cx + eyeDx}" cy="${eyeY}" r="${3.4 + level * 0.4}" fill="#1d1832"/>
  <circle cx="${cx - eyeDx + 1.4}" cy="${eyeY - 1.4}" r="1.3" fill="#fff"/>
  <circle cx="${cx + eyeDx + 1.4}" cy="${eyeY - 1.4}" r="1.3" fill="#fff"/>
  <path d="M ${cx - 4} ${cy + r * 0.28} Q ${cx} ${cy + r * 0.42} ${cx + 4} ${cy + r * 0.28}" stroke="#1d1832" stroke-width="2" fill="none" stroke-linecap="round"/>
  ${dots}
</svg>`;
}

const FORMS = [
  { file: 'rookie', c: BRANCH_COLORS.neutral, level: 1 },
  { file: 'champion-virus', c: BRANCH_COLORS.virus, level: 2 },
  { file: 'champion-data', c: BRANCH_COLORS.data, level: 2 },
  { file: 'champion-vaccine', c: BRANCH_COLORS.vaccine, level: 2 },
  { file: 'ultimate-virus', c: BRANCH_COLORS.virus, level: 3 },
  { file: 'ultimate-data', c: BRANCH_COLORS.data, level: 3 },
  { file: 'ultimate-vaccine', c: BRANCH_COLORS.vaccine, level: 3 },
  { file: 'mega-virus', c: BRANCH_COLORS.virus, level: 4 },
  { file: 'mega-data', c: BRANCH_COLORS.data, level: 4 },
  { file: 'mega-vaccine', c: BRANCH_COLORS.vaccine, level: 4 },
  { file: 'ultra', c: BRANCH_COLORS.ultra, level: 4 },
  { file: 'dungeon-spirit', c: BRANCH_COLORS.enemy, level: 2, spiky: true },
];

for (const f of FORMS) {
  const svg = creature(f);
  await sharp(Buffer.from(svg)).png().toFile(join(OUT, `${f.file}.png`));
  console.log('gerado', f.file);
}
