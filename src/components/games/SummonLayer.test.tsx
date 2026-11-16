// @vitest-environment jsdom
/** COMPANHEIRO INVOCADO na cena (PR 2): com sprite de teste, sem sprite, movimento reduzido, posicao a frente do invocador. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';

vi.mock('../../assets/soulmon/companheiros', () => ({
  spriteDoCompanheiro: (id: string | null | undefined) => (id === 'lobo' ? 'lobo-teste.png' : undefined),
}));

import { SummonLayer, summonPlace, summonsDoGrupo, SUMMON_SIZE } from './SummonLayer';
import { BattleStage, type StageFighter } from './BattleStage';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const me = { x: 100, y: 300, size: 100 };
const foes = [{ x: 220, y: 120, size: 90 }];
const reduzir = () => vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }));

describe('posicao e lista', () => {
  it('fica a frente do invocador, na direcao do oponente, menor que ele', () => {
    const p = summonPlace(me, foes[0]);
    expect(p.size).toBe(Math.round(me.size * SUMMON_SIZE));
    expect(p.x).toBeGreaterThan(me.x);
    expect(p.y).toBeLessThan(me.y);
    expect(summonPlace(foes[0], me).flip).toBe(true);
  });
  it('summonsDoGrupo: so quem tem turnos; vazio sem companheiro', () => {
    expect(summonsDoGrupo([], 'lobo')).toEqual([]);
    expect(summonsDoGrupo([0, 0], 'lobo', ['lobo'])).toEqual([]);
    expect(summonsDoGrupo([2, 0, 3], 'lobo', ['lobo', 'urso'])).toEqual([
      { side: 'me', creature: 'lobo', turns: 2 }, { side: 1, creature: 'urso', turns: 3 },
    ]);
  });
});

describe('render', () => {
  it('com sprite: desenha 1 imagem, lazy, e some quando o contador chega a 0 (movimento reduzido: na hora)', async () => {
    reduzir();
    const { container, rerender } = render(<SummonLayer summons={[{ side: 'me', creature: 'lobo', turns: 2 }]} me={me} foes={foes} reduced />);
    const img = container.querySelector('[data-stage-summon="me"]') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('lobo-teste.png');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.style.transition).toBe('none');
    await act(async () => { rerender(<SummonLayer summons={[{ side: 'me', creature: 'lobo', turns: 0 }]} me={me} foes={foes} reduced />); });
    expect(container.querySelector('[data-stage-summon]')).toBeNull();
  });
  it('sem sprite para a criatura: nao desenha nada e nao quebra', () => {
    const { container } = render(<SummonLayer summons={[{ side: 'me', creature: 'urso', turns: 3 }, { side: 0, creature: undefined, turns: 3 }]} me={me} foes={foes} reduced={false} />);
    expect(container.querySelector('[data-stage-summon]')).toBeNull();
  });
  it('dentro do BattleStage: a prop aditiva summon desenha; sem a prop nada muda', async () => {
    const eu: StageFighter = { key: 'me', sprite: 'me.png', name: 'Eu', hp: 40, maxHp: 80, element: 'fogo' };
    const rival: StageFighter = { key: 0, sprite: 'foe.png', name: 'Rival', hp: 30, maxHp: 60, element: 'agua' };
    const base = { scene: 'url(x.png) center/cover #123', title: 'Duelo', closeLabel: 'Sair', onClose: () => {} };
    reduzir();
    const sem = render(<BattleStage {...base} me={eu} foes={[rival]} />);
    expect(sem.container.querySelector('[data-stage-summon]')).toBeNull();
    sem.unmount();
    const com = render(<BattleStage {...base} me={eu} foes={[rival]} summon={[{ side: 'me', creature: 'lobo', turns: 3 }]} />);
    await act(async () => {});
    expect(com.container.querySelector('[data-stage-summon="me"]')).not.toBeNull();
  });
});
