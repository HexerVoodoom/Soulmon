/**
 * Combate v3, PR6 — chips só dão PONTOS DE TIPO: inclinam o caminho/distribuição,
 * nunca o total de combate nem o level. O save antigo (chip comprado com +3 já
 * somado em `powerPoints`) é neutralizado porque o combate lê o LEVEL e só
 * normaliza os pontos de tipo em fatias [15%, 45%].
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { applySpecialItem } from './specialItemUse';
import { CHIP_EMOJI, SHOP_ITEMS, SPECIAL_ITEMS, CHIP_BOOST } from './shop';
import { soulCombatant, soulLevel, statPoints, soulXP } from './soulXP';
import { distributePoints, MAX_SHARE, MIN_SHARE, clampLevel } from './combate/level';

const AGORA = new Date('2026-10-06T12:00:00Z');
const base: any = {
  evolutionStage: 'champion', perfectDays: 12, totalPerfectDays: 12, totalXP: 500,
  powerPoints: 4, harmonyPoints: 5, benevolencePoints: 6, healthPoints: 5, maxHealthPoints: 10,
  foodInventory: {}, attributesSinceLastEvolution: { power: 0, harmony: 0, benevolence: 0 },
};

describe('PR6: chip nao muda total de combate nem level', () => {
  for (const emoji of Object.values(CHIP_EMOJI)) {
    it(`usar ${emoji}: level, XP e total de pontos iguais`, () => {
      const prev = { ...base, foodInventory: { [emoji]: 1 } };
      const { state } = applySpecialItem(prev, emoji, AGORA);
      expect(soulLevel(state)).toBe(soulLevel(prev));
      expect(soulXP(state)).toBe(soulXP(prev));
      expect(state.totalXP).toBe(prev.totalXP);
      const a = soulCombatant(prev), b = soulCombatant(state);
      expect(b.atk + b.def + b.spd).toBe(a.atk + a.def + a.spd);
      expect(b.hp).toBe(a.hp);
    });
  }
  it('qualquer quantidade de pontos de tipo (ate o legado de 40 chips) mantem total=level', () => {
    const L = soulLevel(base);
    for (const boost of [0, CHIP_BOOST, 30, 120, 3000]) {
      const pts = distributePoints(L, { atk: 4 + boost, spd: 5, def: 6 });
      expect(pts.atk + pts.def + pts.spd).toBe(statPoints(L));
      const c = soulCombatant({ ...base, powerPoints: 4 + boost });
      expect(c.level).toBe(L);
    }
  });
});

describe('PR6: varredura de chips (legado +3 incluso) — total=L, fatias 15–45%', () => {
  it('>= 455 combinacoes, todas dentro das regras', () => {
    let n = 0;
    for (const L of [1, 6, 7, 13, 14, 21, 22, 30, 31, 40]) {
      const Lc = clampLevel(L);
      for (let p = 0; p <= 7; p++) for (let h = 0; h <= 7; h++) for (let b = 0; b <= 7; b++) {
        // cada "chip legado" soma +3 no tipo
        const pts = distributePoints(Lc, { atk: p * 3 + 1, spd: h * 3 + 1, def: b * 3 + 1 });
        expect(pts.atk + pts.def + pts.spd).toBe(Lc);
        for (const v of [pts.atk, pts.def, pts.spd]) {
          expect(v).toBeGreaterThanOrEqual(Math.floor(MIN_SHARE * Lc));
          expect(v).toBeLessThanOrEqual(Math.max(Math.ceil(Lc / 3), Math.floor(MAX_SHARE * Lc)));
        }
        n++;
      }
    }
    expect(n).toBeGreaterThanOrEqual(455);
  });
  it('save antigo com +3 acumulado: total identico ao do save sem o legado', () => {
    const L = soulLevel(base);
    const limpo = soulCombatant(base), legado = soulCombatant({ ...base, powerPoints: base.powerPoints + 3 * 40 });
    expect(legado.atk + legado.def + legado.spd).toBe(limpo.atk + limpo.def + limpo.spd);
    const teto = Math.max(Math.ceil(L / 3), Math.floor(MAX_SHARE * L));
    const p = distributePoints(L, { atk: 4 + 120, spd: 5, def: 6 });
    expect(p.atk).toBeLessThanOrEqual(teto);
    expect(p.atk + p.def + p.spd).toBe(L);
  });
});

describe('PR6: nenhum caminho de combate le chip, inventario ou XP', () => {
  const raiz = join(__dirname, '..', '..');
  const arquivos = [
    join(raiz, 'src/utils/soulXP.ts'), join(raiz, 'functions/api/_soulXP.js'),
    ...readdirSync(join(raiz, 'src/utils/combate')).filter(f => f.endsWith('.ts') && !f.includes('.test.')).map(f => join(raiz, 'src/utils/combate', f)),
  ];
  for (const f of arquivos) {
    it(`${f.split(/[\/]/).slice(-2).join('/')} nao le chip/CHIP_BOOST/foodInventory/totalXP`, () => {
      const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      expect(src).not.toMatch(/CHIP_|chip-|foodInventory|totalXP|shop/);
    });
  }
});

describe('PR6: copy dos chips (EN primeiro, PT-BR) sem promessa de forca', () => {
  const textos = [...SHOP_ITEMS.filter(i => i.kind === 'chip'), ...Object.values(SPECIAL_ITEMS).filter(i => i.kind === 'chip')]
    .flatMap(i => [i.descEn, i.descPt]);
  it('descreve caminho e nao "+N de atributo"', () => {
    expect(textos.length).toBe(12 / 2 * 2);
    for (const t of textos) expect(t).toMatch(/path|caminho/);
    for (const t of textos) expect(t).not.toMatch(/(Use|Usar|use|usar) (for|dá) \+\d/);
  });
});
