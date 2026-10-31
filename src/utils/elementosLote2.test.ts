/**
 * LOTE 1 dos 50 elementos curados do class-system (17 trios): registrado em roster, cor, sprite->elemento e arte de reserva.
 * Sem PNG próprio ainda: a arte cai no rookie da criatura base do elemento dominante (1º componente).
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { COMBINADOS_LOTE2_DATA } from './elementosLote2.data';
import { ENEMY_ROSTER } from './enemyRoster';
import { COMBINADOS_ART } from './enemyRosterArt';
import { rosterSpriteOf } from './novosSoulmon';
import { ELEMENT_VISUAL } from './elementVisual.data';
import { SPRITE_ELEMENT, rosterEntryElement } from './spriteElement';
import { combatGlowColor } from './combatArt';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import * as cs from '../../vendor/class-system/index.js';

const IDS = COMBINADOS_LOTE2_DATA.map(r => r[1]);

describe('lote 2 dos elementos curados (17 trios)', () => {
  it('são 17 ids únicos, números 229-245, componentes válidos e iguais aos do class-system', () => {
    expect(IDS).toHaveLength(17);
    expect(new Set(IDS).size).toBe(17);
    COMBINADOS_LOTE2_DATA.forEach(([num, id, , a, b, c], i) => {
      expect(num).toBe(String(229 + i));
      for (const el of [a, b, c]) expect((CLASS_ELEMENT_ORDER as readonly string[]).includes(el), `${id} ${el}`).toBe(true);
      const cur = [...(cs as any).CURADAS, ...(cs as any).TRIPLAS].find((x: any) => x.id === id);
      expect(cur, `${id} em CURADAS`).toBeDefined();
      expect([...cur.componentes].sort()).toEqual([a, b, c].sort());
    });
  });
  it('estão no roster (combinado rookie, elemento = id fundido, 2 primeiros componentes)', () => {
    for (const [num, id, name, a, b] of COMBINADOS_LOTE2_DATA) {
      const e = ENEMY_ROSTER.find(x => x.artFile === `${num}-${id}`);
      expect(e, id).toBeDefined();
      expect(e!.kind).toBe('combinado');
      expect(e!.stage).toBe('rookie');
      expect(e!.element).toBe(id);
      expect([...e!.elements]).toEqual([a, b]);
      expect(e!.name).toBe(name);
      expect(SPRITE_ELEMENT[`cmb:${num}`]).toBe(id);
      expect(rosterEntryElement(e!)).toBe(id);
    }
  });
  it('arte de reserva: toda entrada resolve um sprite (rookie do elemento dominante) e um PNG próprio, se entrar, vence', () => {
    for (const [num, id, , dom] of COMBINADOS_LOTE2_DATA) {
      const e = ENEMY_ROSTER.find(x => x.artFile === `${num}-${id}`)!;
      expect(COMBINADOS_ART[`${num}-${id}`], id).toBeTruthy();
      expect(rosterSpriteOf(e), id).toBeTruthy();
      expect(rosterSpriteOf(e)).toBe(rosterSpriteOf(ENEMY_ROSTER.find(x => x.kind === 'base' && x.element === dom && x.stage === 'rookie')!));
    }
  });
  it('têm cor (Lab) própria e o brilho do combate resolve', () => {
    for (const id of IDS) {
      expect(ELEMENT_VISUAL[id], id).toBeDefined();
      expect(combatGlowColor(id), id).toMatch(/^#/);
    }
  });
  it('os prompts de arte do lote existem (68 sprites, 34 icone+fx, 17 cenarios) ou o lote é só código', () => {
    const dir = 'E:/Soulmon-assets/elementos-novos/lote2';
    if (!fs.existsSync(dir)) return; // CI não tem E:
    const j = (f: string) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as { prompt: string }[];
    expect(j('prompts-soulmon.json')).toHaveLength(17 * 4);
    expect(j('prompts-icone-fx.json')).toHaveLength(17 * 2);
    expect(j('prompts-cenario.json')).toHaveLength(17);
    for (const p of [...j('prompts-soulmon.json'), ...j('prompts-icone-fx.json'), ...j('prompts-cenario.json')]) expect(p.prompt.replace(/no (purple|magenta)/gi, '')).not.toMatch(/purple|magenta/i);
  });
});
