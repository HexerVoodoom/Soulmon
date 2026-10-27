/**
 * RÉGUA — "para onde a arte de cada FX olha e o espelho que cada caso recebe" (REGISTRO §151).
 * Bug do dono (pedido repetido): os poderzinhos do combate saíam virados ao contrário (espaço do inimigo, luz do jogador,
 * físico do Nocterix/sombra do inimigo). Causa: o palco assumia arte "para a direita" e espelhava por LADO.
 * Aqui a tabela inteira (todo elemento × básico/especial/físico × jogador/inimigo) é provada.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { listFxFiles, measureFacing, SYM_MAX_PX, ORB_OVERRIDE } from '../../scripts/fx-facing.mjs';
import { FX_FACING_TABLE } from './fxFacingTable';
import { fxFacing, fxMirror, orbPose, travelOf, DIRECTIONAL_FX_STATES } from './fxFacing';
import { VISUAL_ELEMENTS, ELEMENT_STRIKE_FORM } from './combatFx';

const files = listFxFiles() as Record<string, Record<string, string>>;
const ids = Object.keys(files).sort();

describe('a tabela de direção da arte é a MEDIDA dos PNG (nunca escrita à mão)', () => {
  it('cobre todo elemento com arte de FX (230 + pesadelo), nem um a mais', () => {
    expect(ids.length).toBe(231);
    expect(Object.keys(FX_FACING_TABLE).sort()).toEqual(ids);
  });

  it('cada linha bate com a remedição do orb, do slash e do defended', async () => {
    const bad: string[] = [];
    for (const id of ids) {
      let row = '';
      for (const e of ['orb', 'slash', 'defended']) {
        let d = (await measureFacing(files[id][e], e)).dir as string;
        if (e === 'orb' && d === 'S') d = ORB_OVERRIDE[id] ?? 'S';
        row += d;
      }
      if (row !== FX_FACING_TABLE[id]) bad.push(`${id}: tabela ${FX_FACING_TABLE[id]} ≠ medido ${row}`);
    }
    expect(bad, 'rode `node scripts/fx-facing.mjs` para regerar fxFacingTable.ts').toEqual([]);
  }, 120_000);

  it('projétil sempre tem direção (nunca S) e cast/aura/impact são simétricos de verdade', async () => {
    for (const id of ids) {
      expect(FX_FACING_TABLE[id][0], `${id}:orb`).not.toBe('S');
      for (const e of ['cast', 'aura', 'impact']) {
        const m = await measureFacing(files[id][e], e);
        expect(Math.abs(m.v), `${id}:${e} deveria ser simétrico (deslocamento ${m.v.toFixed(1)}px)`).toBeLessThanOrEqual(SYM_MAX_PX);
      }
    }
  }, 120_000);
});

describe('o espelho: sempre (para onde a arte olha) × (para onde o golpe vai)', () => {
  const casos = ids.flatMap((id) => (['orb', 'slash', 'defended'] as const).map((st) => [id, st] as const));

  it.each(['me', 'foe'] as const)('o %s: depois do espelho, a arte aponta no sentido do golpe (todos os elementos × estados)', (actor) => {
    const travel = travelOf(actor);
    const want = travel === 'right' ? 'R' : 'L';
    for (const [id, st] of casos) {
      const f = fxFacing(id, st);
      if (f === 'S') { expect(fxMirror(id, st, travel), `${id}:${st} simétrico nunca espelha`).toBe(false); continue; }
      const final = fxMirror(id, st, travel) ? (f === 'R' ? 'L' : 'R') : f;
      expect(final, `${id}:${st} (${actor})`).toBe(want);
    }
  });

  it('o espelho do inimigo é SEMPRE o inverso do do jogador, em toda arte com direção (o defeito era "inimigo = espelha" fixo)', () => {
    for (const [id, st] of casos) {
      if (fxFacing(id, st) === 'S') continue;
      expect(fxMirror(id, st, 'left'), `${id}:${st}`).toBe(!fxMirror(id, st, 'right'));
    }
  });

  it('os casos do dono: espaço (inimigo), luz (jogador) e sombra física (inimigo)', () => {
    // projétil que olha à ESQUERDA: o jogador (vai à direita) espelha, o inimigo não
    for (const el of ['espaco', 'alma']) {
      expect(fxFacing(el, 'orb')).toBe('L');
      expect(fxMirror(el, 'orb', 'right')).toBe(true);
      expect(fxMirror(el, 'orb', 'left')).toBe(false);
    }
    // corte de sombra (bojo à esquerda): o inimigo, que corta para a esquerda, NÃO espelha mais
    expect(fxFacing('sombra', 'slash')).toBe('L');
    expect(fxMirror('sombra', 'slash', 'left')).toBe(false);
    expect(fxMirror('sombra', 'slash', 'right')).toBe(true);
  });

  it('elemento sem arte própria usa a direção da arte que de fato é desenhada (o neutro), não a do id pedido', () => {
    expect(fxFacing('elemento-que-nao-existe', 'orb')).toBe(fxFacing('neutro', 'orb'));
    expect(fxFacing('fogo', 'impact')).toBe('S');
    expect(fxFacing('fogo', 'cast')).toBe('S');
  });

  it('o projétil nunca fica de cabeça para baixo: gira no máximo ±90° nos dois sentidos', () => {
    for (const id of ids) {
      for (const ang of [-35, 0, 35]) {
        const me = orbPose(id, 'right', ang);
        expect(Math.abs(me.rot)).toBeLessThanOrEqual(90);
        const foe = orbPose(id, 'left', ang + 180 > 180 ? ang - 180 : ang + 180);
        expect(Math.abs(foe.rot), `${id}`).toBeLessThanOrEqual(90);
      }
    }
  });

  it('as formas de golpe da tabela do elemento (físico/à distância) apontam para estados que têm direção', () => {
    for (const el of VISUAL_ELEMENTS) {
      expect(ELEMENT_STRIKE_FORM[el]).toBeTruthy();
      expect(DIRECTIONAL_FX_STATES).toContain('orb');
    }
  });
});

describe('fiação: o palco não decide espelho por lado', () => {
  const src = (f: string) => fs.readFileSync(path.resolve(__dirname, f), 'utf8');
  it('BattleStage usa fxMirror/orbPose e não tem mais "inimigo = espelha"', () => {
    const s = src('../components/games/BattleStage.tsx');
    expect(s).toContain('fxMirror(el, \'slash\'');
    expect(s).toContain('orbPose(');
    expect(s).not.toMatch(/flipX\s*=\s*action\.actor\s*===\s*'foe'/);
    expect(s).not.toMatch(/flipX=\{flipX/);
  });
  it('Match3Game espelha o projétil pela mesma conta', () => {
    expect(src('../components/Match3Game.tsx')).toContain("fxMirror(shot.element, 'orb'");
  });
});
