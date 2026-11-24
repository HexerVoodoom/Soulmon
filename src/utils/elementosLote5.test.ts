import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { COMBINADOS_LOTE5_DATA } from './elementosLote5.data';
import { ENEMY_ROSTER, rosterEntryOfKey } from './enemyRoster';
import { rosterSpriteOf } from './novosSoulmon';
import { COMBINADOS_ART } from './enemyRosterArt';
import { SPRITE_ELEMENT, rosterEntryElement } from './spriteElement';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import { CURATED_ELEMENT_NAMES, ELEMENTOS_CURADOS, curatedComponents, curatedElementName } from './elementosCurados';
import { IDS_DOS_CURADOS } from './soulProfile/ficha/elementoIds';
import { elementIcon } from './elementIconArt';
import { elementAdvantage } from './arena';
import { baseDominanteDoElemento } from './soulProfile/ficha/elementoNome';
import { essenceComposition } from './elementDex';
// @ts-ignore JS das Pages Functions, sem tipos
import { ELEMENTOS_FICHA } from '../../functions/api/_duel.js';
// @ts-ignore JS das Pages Functions, sem tipos
import { BASE_DO_PAR, vantagemElemental } from '../../functions/api/_elementoBase.js';
// @ts-ignore JS das Pages Functions, sem tipos
import { essenceBaseCount } from '../../functions/api/_essenceShop.js';

const RECEITAS: Readonly<Record<string, readonly string[]>> = {
  fantasma: ['vida', 'morte', 'tempo'], morto_vivo: ['vida', 'morte', 'vileza'], sangue: ['vida', 'vileza', 'agua'], furia: ['fogo', 'vigor', 'vileza'],
};
const DOMINANTE: Readonly<Record<string, string>> = { fantasma: 'morte', morto_vivo: 'morte', sangue: 'vida', furia: 'fogo' };

describe('lote 5 dos elementos curados: 4 trios (nº 268-271, P5)', () => {
  it('4 ids únicos, números 268-271, trios de componentes distintos e válidos, com as receitas pedidas e o dominante em 1º', () => {
    expect(COMBINADOS_LOTE5_DATA).toHaveLength(4);
    expect(new Set(COMBINADOS_LOTE5_DATA.map(r => r[1])).size).toBe(4);
    COMBINADOS_LOTE5_DATA.forEach((r, i) => {
      expect(Number(r[0])).toBe(268 + i);
      const comps = r.slice(3) as string[];
      expect(comps).toHaveLength(3);
      expect(new Set(comps).size, r[1]).toBe(3);
      for (const c of comps) expect(CLASS_ELEMENT_ORDER as readonly string[], `${r[1]}:${c}`).toContain(c);
      expect([...comps].sort(), r[1]).toEqual([...RECEITAS[r[1]]].sort());
      expect(comps[0], r[1]).toBe(DOMINANTE[r[1]]);
    });
  });
  it('a receita é livre: nenhum outro curado ou par existente tem o mesmo conjunto de componentes', () => {
    for (const [, slug, , ...comps] of COMBINADOS_LOTE5_DATA) {
      const iguais = ELEMENTOS_CURADOS.filter(e => e.id !== slug && e.componentes.length === 3 && comps.every(c => e.componentes.includes(c)));
      expect(iguais.map(e => e.id), slug).toEqual([]);
    }
  });
  it('roster, elemento do sprite, arte de reserva do dominante, nome PT/EN, ícone provisório e listas fechadas resolvem', () => {
    for (const [num, slug, name, e1, e2, ...resto] of COMBINADOS_LOTE5_DATA) {
      const e = rosterEntryOfKey(`cmb${num}-rookie`);
      expect(e, slug).toBeDefined();
      expect(e!.name).toBe(name);
      expect(e!.element).toBe(slug);
      expect([...e!.elements]).toEqual([e1, e2]);
      expect(ENEMY_ROSTER.filter(x => x.id === `cmb${num}` && x.stage === 'rookie')).toHaveLength(1);
      expect(SPRITE_ELEMENT[`cmb:${num}`]).toBe(slug);
      expect(rosterEntryElement(e!)).toBe(slug);
      expect(COMBINADOS_ART[`${num}-${slug}`], slug).toBeTruthy();
      expect(rosterSpriteOf(e!), slug).toBeTruthy();
      expect(curatedComponents(slug)).toEqual([e1, e2, ...resto]);
      expect(CURATED_ELEMENT_NAMES[slug].pt.length).toBeGreaterThan(2);
      expect(CURATED_ELEMENT_NAMES[slug].en.length).toBeGreaterThan(2);
      expect(curatedElementName(slug, true)).toBe(CURATED_ELEMENT_NAMES[slug].pt);
      expect(elementIcon(slug), slug).toContain(`el-${slug}`); // 24/11/2026: ícone próprio instalado (P6); antes era o do 1º componente
      expect(IDS_DOS_CURADOS).toContain(slug);
      expect(ELEMENTOS_FICHA.has(slug)).toBe(true);
      expect(BASE_DO_PAR[slug]).toBe(e1);
      expect(essenceComposition(slug), slug).toEqual([e1, e2, ...resto]);
      expect(essenceBaseCount(slug), slug).toBe(3);
    }
  });
  it('nomes de exibição pedidos (PT/EN)', () => {
    expect(CURATED_ELEMENT_NAMES.fantasma).toEqual({ pt: 'Fantasma', en: 'Ghost' });
    expect(CURATED_ELEMENT_NAMES.morto_vivo).toEqual({ pt: 'Morto-Vivo', en: 'Undead' });
    expect(CURATED_ELEMENT_NAMES.sangue).toEqual({ pt: 'Sangue', en: 'Blood' });
    expect(CURATED_ELEMENT_NAMES.furia).toEqual({ pt: 'Fúria', en: 'Fury' });
  });
  it('vantagem/fraqueza vem do dominante, igual no cliente e no servidor, para atacar e para defender', () => {
    for (const [, slug] of COMBINADOS_LOTE5_DATA) {
      const dom = DOMINANTE[slug];
      expect(baseDominanteDoElemento(slug), slug).toBe(dom);
      for (const alvo of CLASS_ELEMENT_ORDER as readonly string[]) {
        expect(elementAdvantage(slug, [alvo]), `${slug}→${alvo}`).toBe(elementAdvantage(dom, [alvo]));
        expect(elementAdvantage(alvo, [slug]), `${alvo}→${slug}`).toBe(elementAdvantage(alvo, [dom]));
        expect(vantagemElemental(slug, alvo), `srv ${slug}→${alvo}`).toBe(elementAdvantage(slug, [alvo]));
        expect(vantagemElemental(alvo, slug), `srv ${alvo}→${slug}`).toBe(elementAdvantage(alvo, [slug]));
      }
    }
  });
  it('arte própria ainda por gerar está listada em docs/ASSETS-A-GERAR.md (ícone, FX e sprite)', () => {
    const art = path.resolve(__dirname, '../assets/soulmon');
    const doc = fs.readFileSync(path.resolve(__dirname, '../../docs/ASSETS-A-GERAR.md'), 'utf8');
    for (const [num, slug] of COMBINADOS_LOTE5_DATA) {
      const falta = [
        !fs.existsSync(path.join(art, `elementos/el-${slug}.png`)),
        !fs.existsSync(path.join(art, `fx-ataque/fx-${slug}-orb.png`)),
        !fs.existsSync(path.join(art, `novos-${'arquivo'}/combinados/${num}-${slug}.png`)),
      ].some(Boolean);
      if (falta) expect(doc, slug).toContain(slug);
    }
  });
});
