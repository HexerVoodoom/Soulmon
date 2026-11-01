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
import { GroveRaidFight, groveRaidScene } from './GroveRaidFight';
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { GROVE_STAGES } from '../../utils/guildRules';

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

  it('o fundo é o cenário do Bosque do estágio do clã; sem estágio, o do nível 1', () => {
    render(<GroveRaidFight isPt={false} seed={42} combatant={cb} bosqueStage="copa" onResult={vi.fn()} />);
    expect(seen.props?.scene).toBe(PET_BACKGROUNDS['bg-guild-copa'].css);
    expect(groveRaidScene(null)).toBe(PET_BACKGROUNDS['bg-guild-clareira'].css);
    expect(groveRaidScene('inventado')).toBe(PET_BACKGROUNDS['bg-guild-clareira'].css);
    for (const st of GROVE_STAGES) expect(groveRaidScene(st)).toBe(PET_BACKGROUNDS[`bg-guild-${st}`].css);
  });
});
