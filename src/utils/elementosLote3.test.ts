import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { COMBINADOS_LOTE3_DATA } from './elementosLote3.data';
import { ELEMENT_VISUAL } from './elementVisual.data';
import { ENEMY_ROSTER, rosterEntryOfKey } from './enemyRoster';
import { rosterSpriteOf } from './novosSoulmon';
import { COMBINADOS_ART } from './enemyRosterArt';
import { SPRITE_ELEMENT, rosterEntryElement } from './spriteElement';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';

describe('lote 3 dos elementos curados: 16 de 4 componentes', () => {
  it('16 ids únicos, números 246-261, 4 componentes base distintos', () => {
    expect(COMBINADOS_LOTE3_DATA).toHaveLength(16);
    expect(new Set(COMBINADOS_LOTE3_DATA.map(r => r[1])).size).toBe(16);
    COMBINADOS_LOTE3_DATA.forEach((r, i) => {
      expect(Number(r[0])).toBe(246 + i);
      const comps = r.slice(3) as string[];
      expect(new Set(comps).size, r[1]).toBe(4);
      for (const c of comps) expect(CLASS_ELEMENT_ORDER as readonly string[], `${r[1]}:${c}`).toContain(c);
    });
  });

  it('bate com o class-system vendorizado (curada, aridade 4, componentes e dominante)', async () => {
    // @ts-ignore JS vendorizado sem tipos
    const cs = await import('../../vendor/class-system/index.js');
    for (const r of COMBINADOS_LOTE3_DATA) {
      const info = cs.combinacaoInfo(r[1]) as { curada: boolean; aridade: number; componentes: string[] };
      expect(info, r[1]).toBeDefined();
      expect(info.curada).toBe(true);
      expect(info.aridade).toBe(4);
      expect([...info.componentes]).toEqual(r.slice(3));
      expect(cs.baseDominanteDe(r[1])).toBe(r[3]);
    }
  });

  it('visual, roster, elemento do sprite e arte própria resolvem', () => {
    for (const [num, slug, name, e1, e2] of COMBINADOS_LOTE3_DATA) {
      expect(ELEMENT_VISUAL[slug], slug).toHaveLength(4);
      const e = rosterEntryOfKey(`cmb${num}-rookie`);
      expect(e, slug).toBeDefined();
      expect(e!.name).toBe(name);
      expect(e!.element).toBe(slug);
      expect([...e!.elements]).toEqual([e1, e2]);
      expect(SPRITE_ELEMENT[`cmb:${num}`]).toBe(slug);
      expect(rosterEntryElement(e!)).toBe(slug);
      expect(rosterSpriteOf(e!), slug).toBeTruthy();
      expect(COMBINADOS_ART[`${num}-${slug}`], slug).toBeTruthy();
      expect(rosterSpriteOf(e!), slug).toBe(COMBINADOS_ART[`${num}-${slug}`]);
      const art = path.resolve(__dirname, '../assets/soulmon');
      const ARQ = 'novos-' + 'arquivo';
      expect(fs.existsSync(path.join(art, `${ARQ}/combinados/${num}-${slug}.png`)), slug).toBe(true);
      expect(fs.existsSync(path.join(art, `elementos/el-${slug}.png`)), `ícone ${slug}`).toBe(true);
      for (const s of ['orb', 'slash', 'impact', 'cast', 'aura', 'aura-96', 'defended']) expect(fs.existsSync(path.join(art, `fx-ataque/fx-${slug}-${s}.png`)), `${slug} ${s}`).toBe(true);
      expect(fs.existsSync(path.join(art, `combate/elemento/${slug}.png`)), `cenário ${slug}`).toBe(true);
      for (const st of ['champion', 'ultimate', 'mega']) expect(fs.existsSync(path.join(art, `${ARQ}/combinados-formas/${num}-${slug}-${st}.png`)), `${slug} ${st}`).toBe(true);
    }
    const keys = ENEMY_ROSTER.map(x => x.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
