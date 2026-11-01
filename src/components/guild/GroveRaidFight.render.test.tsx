/** @vitest-environment jsdom */
/** §204: a luta do Bosque monta na BattleStage com os 3 inimigos e sair conta como derrota (sem custo). */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { combatantAt, REFERENCE_BUILDS } from '../../utils/combate/level';

const seen: { props: Record<string, any> | null } = { props: null };
vi.mock('../games/BattleStage', async importOriginal => {
  const mod = await importOriginal<typeof import('../games/BattleStage')>();
  return { ...mod, BattleStage: (p: Record<string, any>) => { seen.props = p; return mod.BattleStage(p as never); } };
});
import { GroveRaidFight, GROVE_RAID_SCENE } from './GroveRaidFight';
import { PANORAMA_SRC } from '../../assets/bosque';

const cb = combatantAt(10, REFERENCE_BUILDS.balanced);

describe('GroveRaidFight', () => {
  afterEach(() => cleanup()); // sem desmontar, os efeitos assíncronos da BattleStage estouram depois do teste (Unhandled Error no CI)

  it('monta a cena da luta', () => {
    const onResult = vi.fn();
    const { container } = render(<GroveRaidFight isPt={false} seed={42} combatant={cb} onResult={onResult} />);
    expect(container.querySelector('[data-grove-raid]')).not.toBeNull();
    expect(onResult).not.toHaveBeenCalled();
  });

  it('o summon luta com o ELEMENTO real do Soulmon (não neutro) e com o sprite ATUAL (forma evoluída)', () => {
    render(<GroveRaidFight isPt seed={42} combatant={cb} petElement="fogo" evolutionStage="champion" mySprite="/forma-evoluida.webp" onResult={vi.fn()} />);
    expect(seen.props?.me.element).toBe('fogo');
    expect(seen.props?.me.sprite).toBe('/forma-evoluida.webp');
  });

  it('o fundo é o PANORAMA do Plantio (CSS url(), mesmo enquadramento do visor), não um bg-guild', () => {
    render(<GroveRaidFight isPt={false} seed={42} combatant={cb} onResult={vi.fn()} />);
    expect(seen.props?.scene).toBe(GROVE_RAID_SCENE);
    expect(GROVE_RAID_SCENE).toMatch(/^url\(.+\) 40% 88% \/ auto 230% no-repeat/);
    expect(GROVE_RAID_SCENE).toContain(PANORAMA_SRC);
  });

  it('desenha as plantas plantadas no nível certo; sem plantas, nenhuma', () => {
    const { container, rerender } = render(<GroveRaidFight isPt seed={42} combatant={cb} niveis={{ outono: 2, verao: 5, inverno: 0 }} onResult={vi.fn()} />);
    const pl = [...container.querySelectorAll('[data-grove-raid-planta]')].map(x => [x.getAttribute('data-grove-raid-planta'), x.getAttribute('data-nivel')]);
    expect(pl).toEqual([['outono', '2'], ['verao', '5']]);
    rerender(<GroveRaidFight isPt seed={42} combatant={cb} onResult={vi.fn()} />);
    expect(container.querySelector('[data-grove-raid-planta]')).toBeNull();
    expect(container.querySelector('[data-grove-raid-plantas]')).toBeNull();
  });
});
