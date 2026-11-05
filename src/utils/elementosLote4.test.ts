import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { COMBINADOS_LOTE4_DATA } from './elementosLote4.data';
import { ENEMY_ROSTER, rosterEntryOfKey } from './enemyRoster';
import { rosterSpriteOf } from './novosSoulmon';
import { COMBINADOS_ART } from './enemyRosterArt';
import { SPRITE_ELEMENT, rosterEntryElement } from './spriteElement';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import { CURATED_ELEMENT_NAMES, curatedComponents } from './elementosCurados';
import { IDS_DOS_CURADOS } from './soulProfile/ficha/elementoIds';
// @ts-ignore JS das Pages Functions, sem tipos
import { ELEMENTOS_FICHA } from '../../functions/api/_duel.js';
// @ts-ignore JS das Pages Functions, sem tipos
import { BASE_DO_PAR } from '../../functions/api/_elementoBase.js';

describe('lote 4 dos elementos curados: 6 de planta, industrial e fada (nº 262-267)', () => {
  it('6 ids únicos, números 262-267, componentes distintos e válidos, 3 trios e 3 quádruplos', () => {
    expect(COMBINADOS_LOTE4_DATA).toHaveLength(6);
    expect(new Set(COMBINADOS_LOTE4_DATA.map(r => r[1])).size).toBe(6);
    COMBINADOS_LOTE4_DATA.forEach((r, i) => {
      expect(Number(r[0])).toBe(262 + i);
      const comps = r.slice(3) as string[];
      expect(new Set(comps).size, r[1]).toBe(comps.length);
      expect([3, 4]).toContain(comps.length);
      for (const c of comps) expect(CLASS_ELEMENT_ORDER as readonly string[], `${r[1]}:${c}`).toContain(c);
    });
    expect(COMBINADOS_LOTE4_DATA.filter(r => r.length === 6)).toHaveLength(3);
    expect(COMBINADOS_LOTE4_DATA.filter(r => r.length === 7)).toHaveLength(3);
  });
  it('roster, elemento do sprite, arte (própria ou fallback da criatura base), nome PT/EN e listas fechadas resolvem', () => {
    for (const [num, slug, name, e1, e2, ...resto] of COMBINADOS_LOTE4_DATA) {
      const e = rosterEntryOfKey(`cmb${num}-rookie`);
      expect(e, slug).toBeDefined();
      expect(e!.name).toBe(name);
      expect(e!.element).toBe(slug);
      expect([...e!.elements]).toEqual([e1, e2]);
      expect(ENEMY_ROSTER.filter(x => x.id === `cmb${num}`)).toHaveLength(1);
      expect(SPRITE_ELEMENT[`cmb:${num}`]).toBe(slug);
      expect(rosterEntryElement(e!)).toBe(slug);
      expect(COMBINADOS_ART[`${num}-${slug}`], slug).toBeTruthy();
      expect(rosterSpriteOf(e!), slug).toBeTruthy();
      expect(curatedComponents(slug)).toEqual([e1, e2, ...resto]);
      expect(CURATED_ELEMENT_NAMES[slug].pt.length).toBeGreaterThan(2);
      expect(IDS_DOS_CURADOS).toContain(slug);
      expect(ELEMENTOS_FICHA.has(slug)).toBe(true);
      expect(BASE_DO_PAR[slug]).toBe(e1);
    }
  });
  it('arte própria ainda por gerar está listada em docs/ASSETS-A-GERAR.md (ícone, FX e sprite)', () => {
    const art = path.resolve(__dirname, '../assets/soulmon');
    const doc = fs.readFileSync(path.resolve(__dirname, '../../docs/ASSETS-A-GERAR.md'), 'utf8');
    for (const [num, slug] of COMBINADOS_LOTE4_DATA) {
      const falta = [
        !fs.existsSync(path.join(art, `elementos/el-${slug}.png`)),
        !fs.existsSync(path.join(art, `fx-ataque/fx-${slug}-orb.png`)),
        !fs.existsSync(path.join(art, `novos-${'arquivo'}/combinados/${num}-${slug}.png`)),
      ].some(Boolean);
      if (falta) expect(doc, slug).toContain(slug);
    }
  });
});
