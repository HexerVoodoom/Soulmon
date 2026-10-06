// @vitest-environment jsdom
/**
 * PR1b B2/N1: o MESMO pet tem o MESMO golpe básico nas 4 telas (Arena, Masmorra, Pesadelo, Duelo).
 * Com ficha a escola decide (`fighterStrikeForm`), e o selo do especial leva o nome da skill.
 * As telas PvE são lidas pelas `rules` que entregam ao relógio (`usePveBattle`); o Duelo, pela cena.
 * PR3b: a ARENA roda no relógio do núcleo v3 (`useGroupBattle`) e entrega a mesma pergunta pela `scene()`.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, act, cleanup, fireEvent, screen } from '@testing-library/react';
import type { PveRules } from './games/usePveBattle';
import type { StageSkills } from '../utils/soulProfile/ficha/skills';
import { ArenaGame } from './ArenaGame';
import { DungeonGame } from './DungeonGame';
import { NightmareBattle } from './NightmareBattle';
import { DuelScreen } from './DuelScreen';
import { duelStats } from '../../functions/api/_duel.js';
import { DUNGEON_LINE_SPRITES } from '../utils/sprites';
import { SPECIAL_LABEL } from '../utils/combatFx';

const regras: PveRules[] = [];
const cenas: Array<{ action: { actor: string; kind: string; strike?: string } | null; specialLabel?: string }> = [];
vi.mock('./games/usePveBattle', async (orig) => {
  const m = await orig<typeof import('./games/usePveBattle')>();
  return { ...m, usePveBattle: (o: Parameters<typeof m.usePveBattle>[0]) => { regras.push(o.rules); return m.usePveBattle(o); } };
});
vi.mock('./games/useGroupBattle', async (orig) => {
  const m = await orig<typeof import('./games/useGroupBattle')>();
  return {
    ...m,
    useGroupBattle: (o: Parameters<typeof m.useGroupBattle>[0]) => {
      regras.push({ playerKind: (sp: boolean) => o.scene().playerKind(sp) } as unknown as PveRules);
      return m.useGroupBattle(o);
    },
  };
});
vi.mock('./games/BattleStage', async (orig) => {
  const m = await orig<typeof import('./games/BattleStage')>();
  return { ...m, BattleStage: (p: Parameters<typeof m.BattleStage>[0]) => { cenas.push({ action: p.action ?? null, specialLabel: p.specialLabel }); return m.BattleStage(p); } };
});
vi.mock('../utils/sounds', () => ({ playFeed: vi.fn(), playTaskComplete: vi.fn() }));
vi.mock('../utils/arena', async (orig) => {
  const m = await orig<typeof import('../utils/arena')>();
  return { ...m, loadBestiaryPool: () => new Promise(() => {}) };
});

afterEach(() => { cleanup(); vi.useRealTimers(); regras.length = 0; cenas.length = 0; });

type Ficha = Partial<Record<'rookie', StageSkills>>;
function ficha(basica: string, especial: string, elementoId: string): Ficha {
  const mk = (tipo: 'basica' | 'especial', escolaId: string) => ({
    tipo, nome: tipo === 'especial' ? { pt: 'Lâmina do Crepúsculo', en: 'Dusk Blade' } : { pt: 'Golpe', en: 'Strike' },
    descricao: { pt: 'd', en: 'd' }, elementoId, elementoNome: { pt: 'x', en: 'x' }, escolaId, recursoId: 'furia', custo: 'baixo',
  });
  return { rookie: { basica: mk('basica', basica), especial: mk('especial', especial) } as unknown as StageSkills };
}
const onda = () => [{ name: 'S', stage: 'rookie', sprite: DUNGEON_LINE_SPRITES.lumel.rookie, hp: 5, atk: 1, speed: 1, points: 1, dmgReduction: 0 }];

const PVE: Record<string, (skills: Ficha | undefined, el: string) => void> = {
  Arena: (skills) => { render(<ArenaGame evolutionStage="rookie" language="pt-BR" skills={skills} onExit={() => {}} />); },
  Masmorra: (skills, el) => {
    render(<DungeonGame evolutionStage="rookie" language="pt-BR" petElement={el} skills={skills} onEnter={() => ({ ok: true, level: 1, best: 0 })}
      onLose={() => {}} onEnemyDefeated={() => {}} onHeartDrop={() => false} onGlitchtama={() => {}} onEarnPoints={() => {}} onExit={() => {}} />);
  },
  Pesadelo: (skills, el) => {
    render(<NightmareBattle open wave={onda()} rarity="common" petStage="rookie" petElement={el} skills={skills} language="pt-BR"
      onWin={() => {}} onLose={() => {}} onClose={() => {}} />);
  },
};

/** As formas do SEU pet no Duelo: corre a luta (com torcida, para sair especial) e anota cada golpe seu. */
function duelo(skills: Ficha | undefined, el: string) {
  vi.useFakeTimers();
  const s = duelStats({ stage: 'rookie' });
  const onDone = vi.fn();
  render(<DuelScreen me={s} opp={s} seed={123} petSprite="" oppSprite="" petName="Pet" oppName="Rival" isPt petElement={el}
    petStage="rookie" skills={skills} oppElement="agua" onDone={onDone} onClose={() => {}} />);
  for (let i = 0; i < 400 && !onDone.mock.calls.length; i++) {
    act(() => { vi.advanceTimersByTime(300); });
    const m = document.querySelector('[data-cheer-mascot]');
    if (m) for (let k = 0; k < 6; k++) fireEvent.click(m);
  }
  const meus = cenas.map(c => c.action).filter((a): a is NonNullable<typeof a> => !!a && a.actor === 'me');
  return {
    basica: new Set(meus.filter(a => a.kind !== 'special').map(a => a.kind)),
    especial: new Set(meus.filter(a => a.kind === 'special').map(a => a.strike)),
    selos: new Set(cenas.map(c => c.specialLabel)),
  };
}

describe('B2: o golpe básico é fixo por personagem nas 4 telas', () => {
  for (const [tela, montar] of Object.entries(PVE)) {
    it(`${tela}: combate_fisico+fogo → melee; conjuracao+terra → ranged; maldicao → básica melee, especial ranged`, () => {
      montar(ficha('combate_fisico', 'combate_fisico', 'fogo'), 'fogo');
      expect(regras.at(-1)!.playerKind(false)).toBe('melee');
      cleanup(); regras.length = 0;
      montar(ficha('conjuracao', 'conjuracao', 'terra'), 'terra');
      expect(regras.at(-1)!.playerKind(false)).toBe('ranged');
      cleanup(); regras.length = 0;
      montar(ficha('maldicao', 'maldicao', 'vigor'), 'vigor');
      expect(regras.at(-1)!.playerKind(false)).toBe('melee');
      expect(regras.at(-1)!.playerKind(true)).toBe('ranged');
    });
  }

  it('Duelo: combate_fisico+fogo → melee; conjuracao+terra → ranged; maldicao → especial ranged', () => {
    expect([...duelo(ficha('combate_fisico', 'combate_fisico', 'fogo'), 'fogo').basica]).toEqual(['melee']);
    cleanup(); cenas.length = 0;
    expect([...duelo(ficha('conjuracao', 'conjuracao', 'terra'), 'terra').basica]).toEqual(['ranged']);
    cleanup(); cenas.length = 0;
    const m = duelo(ficha('maldicao', 'maldicao', 'vigor'), 'vigor');
    expect([...m.basica]).toEqual(['melee']);
    expect([...m.especial]).toEqual(['ranged']);
  });
});

describe('N1: o selo do especial do pet leva o nome da skill', () => {
  it('Duelo com ficha: o nome próprio; sem ficha: SPECIAL_LABEL', () => {
    expect(duelo(ficha('maldicao', 'maldicao', 'vigor'), 'vigor').selos).toEqual(new Set(['Lâmina do Crepúsculo']));
    cleanup(); cenas.length = 0;
    expect(duelo(undefined, 'vigor').selos).toEqual(new Set([SPECIAL_LABEL.pt]));
  });

  it('Pesadelo com ficha: o nome próprio na cena; sem ficha: SPECIAL_LABEL', () => {
    PVE.Pesadelo(ficha('maldicao', 'maldicao', 'vigor'), 'vigor');
    fireEvent.click(screen.getByRole('button', { name: 'Ficar na frente dele' }));
    expect(cenas.at(-1)!.specialLabel).toBe('Lâmina do Crepúsculo');
    cleanup(); cenas.length = 0;
    PVE.Pesadelo(undefined, 'vigor');
    fireEvent.click(screen.getByRole('button', { name: 'Ficar na frente dele' }));
    expect(cenas.at(-1)!.specialLabel).toBe(SPECIAL_LABEL.pt);
  });
});
