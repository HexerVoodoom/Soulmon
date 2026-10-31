/**
 * LOTE 1 dos 50 elementos curados do class-system (17 trios): registrado em roster, cor, sprite->elemento e arte de reserva.
 * Arte própria instalada (tools/instalar-elementos-novos.py).
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
  it('arte própria: PNG combinados/NNN-slug.png existe, é o que o roster mostra e o ícone/FX dele existem', () => {
    const art = path.resolve(__dirname, '../assets/soulmon');
    const ARQ = 'novos-' + 'arquivo';
    for (const [num, id] of COMBINADOS_LOTE2_DATA) {
      const e = ENEMY_ROSTER.find(x => x.artFile === `${num}-${id}`)!;
      expect(fs.existsSync(path.join(art, `${ARQ}/combinados/${num}-${id}.png`)), id).toBe(true);
      expect(COMBINADOS_ART[`${num}-${id}`], id).toBeTruthy();
      expect(rosterSpriteOf(e), id).toBe(COMBINADOS_ART[`${num}-${id}`]);
      expect(fs.existsSync(path.join(art, `elementos/el-${id}.png`)), `ícone ${id}`).toBe(true);
      for (const s of ['orb', 'slash', 'impact', 'cast', 'aura', 'aura-96', 'defended']) expect(fs.existsSync(path.join(art, `fx-ataque/fx-${id}-${s}.png`)), `${id} ${s}`).toBe(true);
      expect(fs.existsSync(path.join(art, `combate/elemento/${id}.png`)), `cenário ${id}`).toBe(true);
      for (const st of ['champion', 'ultimate', 'mega']) expect(fs.existsSync(path.join(art, `${ARQ}/combinados-formas/${num}-${id}-${st}.png`)), `${id} ${st}`).toBe(true);
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
