import { simulateDungeonRunV3, type DungeonSkill } from '../src/utils/dungeonFight';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS } from '../src/utils/combate/level';
import { SPECIAL_FAMILIES } from '../src/utils/combate/specials';
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const cell = (s: number) => ({ level: RULER_LEVELS[s % 15], build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]], family: SPECIAL_FAMILIES[(s >> 4) % 7] });
const N = 1200;
const OLD = { ring: { ruim: 0.75, bom: 1, otimo: 1.35 }, dodge: { nada: 0, bom: 0.5, otimo: 0.85 } };
for (const [name, knobs] of [['novas', undefined], ['antigas', OLD]] as const) {
  { const o: string[] = []; for (const sk of ['nenhuma','media','boa'] as DungeonSkill[]) { let c = 0; for (let s = 0; s < N; s++) c += +(simulateDungeonRunV3({ ...cell(s), knobs: knobs as any }, s, sk, 5).floorsCleared >= 5); o.push(sk + ' ' + (100*c/N).toFixed(1)+'%'); } console.log(name, 'completa 5 andares:', o.join(' · ')); }
  for (const floors of [3, 5, 6]) {
    const out: string[] = [];
    const m: Record<string, number> = {};
    for (const sk of ['nenhuma', 'media', 'boa'] as DungeonSkill[]) {
      const f: number[] = [];
      for (let s = 0; s < N; s++) f.push(simulateDungeonRunV3({ ...cell(s), knobs: knobs as any }, s, sk, floors).floorsCleared / floors);
      m[sk] = mean(f); out.push(`${sk} ${(100 * m[sk]).toFixed(1)}%`);
    }
    console.log(`${name} ${floors} andares: ${out.join(' · ')} → gap ${(100 * (m.boa - m.nenhuma)).toFixed(1)}pp`);
  }
}
// growth power RED
for (const gp of [1, 2, 3, 5]) { let c = 0; for (let s = 0; s < 400; s++) c += +(simulateDungeonRunV3({ ...cell(s), knobs: { foe: { growth: { hp: 0.14, power: gp } } } }, s, 'media', 3).floorsCleared >= 2); console.log('growth.power', gp, 'andar 2:', (100 * c / 400).toFixed(1) + '%'); }
