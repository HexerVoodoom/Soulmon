/**
 * RÉGUA — "o pé do Soulmon encosta na sombra" (bug do dono: "muito Soulmon flutuando em cima da sombra").
 * Causa: os PNG têm linhas transparentes embaixo (até ~25% da altura) e o layout alinhava a sombra pela CAIXA do PNG, não
 * pelo último pixel opaco. A tabela `spriteFeetTable.ts` é a MEDIDA dos PNG (nunca escrita à mão) e o layout a consome.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, listFeetFiles, measureAll, measureFeet } from '../../scripts/sprite-feet.mjs';
import { SPRITE_FEET_TABLE } from './spriteFeetTable';
import { groundDropPx, knownBottomOf } from './spriteScale';

/** Quanto o pé pode ficar longe da sombra (px, na caixa de 128 do Home) depois da âncora. */
const TOL_PX = 1;
const SIZE = 128;
const roster = listFeetFiles().filter((f: string) => f.split(path.sep).includes('lines'));

describe('a tabela de pés é a MEDIDA dos PNG', () => {
  it('bate com a remedição de toda a arte de criatura', async () => {
    const medido = await measureAll();
    expect(SPRITE_FEET_TABLE, 'rode `node scripts/sprite-feet.mjs` para regerar spriteFeetTable.ts').toEqual(medido);
  }, 120_000);

  it('cobre todo o roster das linhas (a única exceção é nome repetido com pé diferente)', () => {
    const faltando = roster.map((f: string) => path.basename(f, '.png')).filter((k: string) => !(k in SPRITE_FEET_TABLE));
    expect(roster.length).toBeGreaterThan(40);
    expect([...new Set(faltando)]).toEqual(['thalindra-rookie']);
  });
});

describe('nenhum sprite do roster flutua acima da sombra', () => {
  it('com a âncora, o último pixel opaco cai na linha do chão (tolerância de 1 px) em qualquer escala', async () => {
    const flutua: string[] = [];
    for (const f of roster) {
      const key = path.basename(f, '.png');
      if (!(key in SPRITE_FEET_TABLE)) continue; // ambíguo: medido em runtime
      const medido = (await measureFeet(f)) as number;
      for (const scale of [1, 0.8, 0.6]) {
        const drop = groundDropPx(`/assets/${key}-Ab3dE9xZ.png`, scale, SIZE); // com o hash do build
        // pé visível (px desde o topo da caixa) = base × scale-em-torno-do-pé-da-caixa + descida
        const pe = SIZE - (SIZE - (medido / 1000) * SIZE) * scale + drop;
        if (Math.abs(pe - SIZE) > TOL_PX) flutua.push(`${key}@${scale}: pé em ${pe.toFixed(1)} de ${SIZE}`);
      }
    }
    expect(flutua).toEqual([]);
  }, 120_000);

  it('sem a âncora o problema existe de verdade (o teste não é vacuo)', () => {
    const gaps = roster
      .map((f: string) => SPRITE_FEET_TABLE[path.basename(f, '.png')])
      .filter((v: number | undefined): v is number => typeof v === 'number')
      .map((v: number) => ((1000 - v) / 1000) * SIZE);
    expect(Math.max(...gaps)).toBeGreaterThan(10);
  });

  it('o layout usa a âncora: Home (useGroundDrop) e palco de combate (useFeetShift)', () => {
    const hud = fs.readFileSync(path.join(ROOT, 'src/components/CompanionHUD.tsx'), 'utf8');
    const stage = fs.readFileSync(path.join(ROOT, 'src/components/games/BattleStage.tsx'), 'utf8');
    expect(hud).toMatch(/useGroundDrop\(sprite,/);
    expect(hud).toMatch(/top: petGroundDrop/);
    expect(stage).toMatch(/useFeetShift\(f\.sprite,/);
  });
});

describe('knownBottomOf', () => {
  it('acha o pé pelo nome do arquivo, com ou sem hash do Vite, pasta e query', () => {
    const k = Object.keys(SPRITE_FEET_TABLE).find((n) => /-champion$/.test(n))!;
    const v = SPRITE_FEET_TABLE[k] / 1000;
    expect(knownBottomOf(`/src/assets/soulmon/lines/${k}.png`)).toBe(v);
    expect(knownBottomOf(`/assets/${k}-Ab3dE9xZ.png?v=2`)).toBe(v);
  });
  it('arte desconhecida (sprite do jogador) não tem pé até ser medida', () => {
    expect(knownBottomOf('https://x.test/api/sprite-image/abc')).toBeNull();
    expect(knownBottomOf(undefined)).toBeNull();
    expect(groundDropPx('https://x.test/api/sprite-image/abc', 1, 128)).toBe(0);
  });
});
