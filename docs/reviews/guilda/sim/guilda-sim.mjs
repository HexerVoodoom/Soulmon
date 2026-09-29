// Simulação da Guilda: 90 dias × 200 guildas (tamanho 3–12, presença ~ Beta(3,2)).
// Rodar: node docs/reviews/guilda/sim/guilda-sim.mjs [seed]
// Progresso normalizado: cada dia a guilda soma fios/membros ("dias-de-guilda").
let s = Number(process.argv[2] ?? 42);
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const gamma = (k) => { let x = 0; for (let i = 0; i < k; i++) x -= Math.log(rnd()); return x; };
const beta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };
// Os limiares vêm do DONO ÚNICO (`functions/api/_coop.js`, WPG-3a): a sim
// importa, nunca repete o literal (footgun 9).
import { BOSQUE_THRESHOLDS } from '../../../../functions/api/_coop.js';
const BOSQUE = BOSQUE_THRESHOLDS;               // limiares em dias-de-guilda
const K = 45, DMG = (p) => 10 + 2 * p;         // RAID_HP_PER_MEMBER, dano por stagePower
const JITTER = 0.2, MIN_HP_MEMBERS = 3, DAYS = Number(process.argv[3] ?? 90), N = 200;
const out = { m1: [], m3: [], m5: [], raid: [] , byP: [] };
for (let g = 0; g < N; g++) {
  const size = 3 + Math.floor(rnd() * 10);
  const members = Array.from({ length: size }, () => ({ p: beta(3, 2) * 0.95, pow: 1 + Math.floor(rnd() * 5) }));
  let prog = 0, hit = [null, null, null, null, null], raids = 0, weeks = 0, hp = 0;
  for (let d = 0; d < DAYS; d++) {
    if (d % 7 === 0) { hp = Math.max(size, MIN_HP_MEMBERS) * K; weeks++; }
    let fios = 0;
    for (const m of members) if (rnd() < m.p) {
      fios++;
      if (hp > 0) { hp -= DMG(m.pow) * (1 - JITTER + 2 * JITTER * rnd()); if (hp <= 0) raids++; }
    }
    prog += fios / size;
    BOSQUE.forEach((t, i) => { if (hit[i] === null && prog >= t) hit[i] = d + 1; });
  }
  const mean = members.reduce((a, m) => a + m.p, 0) / size;
  out.m1.push(hit[0] ?? 999); out.m3.push(hit[2] ?? 999); out.m5.push(hit[4] ?? 999); out.raid.push(raids / weeks);
  out.byP.push({ size, mean, m5: hit[4] ?? 999 });
}
const pct = (a, q) => { const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(q * b.length))]; };
const f = (v) => (v >= 999 ? '>' + DAYS : typeof v === 'number' && v < 1.001 && v > 0 && !Number.isInteger(v) ? (v * 100).toFixed(0) + '%' : String(v));
console.log('| métrica | p10 | p25 | p50 | p75 | p90 |\n|---|---|---|---|---|---|');
for (const [k, n] of [['m1', 'dia do marco 1 (Clareira)'], ['m3', 'dia do marco 3 (Copa)'], ['m5', 'dia do marco 5 (Bosque antigo)'], ['raid', 'raids concluídas / semana']])
  console.log(`| ${n} | ${[0.1, 0.25, 0.5, 0.75, 0.9].map((q) => (k === 'raid' ? (pct(out[k], q) * 100).toFixed(0) + '%' : f(pct(out[k], q)))).join(' | ')} |`);
const tot = out.raid.reduce((a, b) => a + b, 0) / N;
console.log(`\nmédia raids concluídas: ${(tot * 100).toFixed(1)}%; guildas com marco 5 no horizonte: ${out.m5.filter((x) => x < 999).length}/${N}`);
