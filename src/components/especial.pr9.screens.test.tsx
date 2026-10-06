// @vitest-environment jsdom
/**
 * PR9: o selo do especial das 4 telas mostra o NOME PRÓPRIO — o do pet (da ficha) e o do inimigo
 * (por regra do elemento dele) — e nunca o genérico "SPECIAL!/ESPECIAL!" quando há nome.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import type { StageSkills } from '../utils/soulProfile/ficha/skills';
import { ArenaGame } from './ArenaGame';
import { DungeonGame } from './DungeonGame';
import { NightmareBattle } from './NightmareBattle';
import { DuelScreen } from './DuelScreen';
import { BattleStage } from './games/BattleStage';
import { duelStats } from '../../functions/api/_duel.js';
import { DUNGEON_LINE_SPRITES } from '../utils/sprites';
import { dungeonFoe, type DungeonEnemy } from '../utils/dungeon';
import { SPECIAL_LABEL, foeSpecialLabel } from '../utils/combatFx';

type Cena = { specialLabel?: string; foe?: string; foeName?: string };
const cenas: Cena[] = [];
vi.mock('./games/BattleStage', async (orig) => {
  const m = await orig<typeof import('./games/BattleStage')>();
  return {
    ...m,
    BattleStage: (p: Parameters<typeof m.BattleStage>[0]) => {
      const f = p.foes[0];
      cenas.push({ specialLabel: p.specialLabel, foe: p.foeSpecialLabel?.(f), foeName: f?.name });
      return m.BattleStage(p);
    },
  };
});
vi.mock('../utils/sounds', () => ({ playFeed: vi.fn(), playTaskComplete: vi.fn() }));
vi.mock('../utils/arena', async (orig) => {
  const m = await orig<typeof import('../utils/arena')>();
  return { ...m, loadBestiaryPool: async () => [{ nome: 'x', elementos: ['fogo'], atributos: { forca: 5, inteligencia: 5, velocidade: 5, magia: 5 }, tamanho: 'medio', hostilidade: 5 }] };
});
afterEach(() => { cleanup(); cenas.length = 0; });

const NOME = { pt: 'Zelo de Fogo', en: 'Fire Zeal' };
function ficha() {
  const mk = (tipo: 'basica' | 'especial') => ({
    tipo, nome: tipo === 'especial' ? NOME : { pt: 'Golpe', en: 'Strike' }, descricao: { pt: 'd', en: 'd' },
    elementoId: 'fogo', elementoNome: { pt: 'Fogo', en: 'Fire' }, escolaId: 'combate_fisico', recursoId: 'furia', custo: 'baixo', familia: 'atkBuff',
  });
  return { rookie: { basica: mk('basica'), especial: mk('especial') } as unknown as StageSkills };
}
const onda = (): DungeonEnemy[] => [{ name: 'S', stage: 'rookie', sprite: DUNGEON_LINE_SPRITES.lumel.rookie, points: 1, slot: 0, floor: 1, foe: dungeonFoe(1, 0, 1) }];
const GENERICOS = [SPECIAL_LABEL.pt, SPECIAL_LABEL.en];

const TELAS: Record<string, () => void | Promise<void>> = {
  Arena: async () => {
    render(<ArenaGame evolutionStage="rookie" language="pt-BR" skills={ficha()} onExit={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: /Entrar na Arena/i }));
  },
  Masmorra: () => {
    render(<DungeonGame evolutionStage="rookie" language="pt-BR" petElement="fogo" skills={ficha()} onEnter={() => ({ ok: true, level: 1, best: 0 })}
      onLose={() => {}} onEnemyDefeated={() => {}} onHeartDrop={() => false} onGlitchtama={() => {}} onEarnPoints={() => {}} onExit={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Descer' }));
  },
  Pesadelo: () => {
    render(<NightmareBattle open wave={onda()} rarity="common" petStage="rookie" petElement="fogo" skills={ficha()} language="pt-BR"
      onWin={() => {}} onLose={() => {}} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ficar na frente dele' }));
  },
  Duelo: () => {
    const s = duelStats({ stage: 'rookie' });
    render(<DuelScreen me={s} opp={s} seed={1} petSprite="" oppSprite="" petName="Pet" oppName="Rival" isPt petElement="fogo"
      petStage="rookie" skills={ficha()} oppElement="agua" onDone={() => {}} onClose={() => {}} />);
  },
};

describe('o selo mostra o nome próprio nas 4 telas', () => {
  for (const [tela, montar] of Object.entries(TELAS)) {
    it(`${tela}: o selo do pet é o nome da skill e o do inimigo sai por regra (não é o genérico)`, async () => {
      await montar();
      const c = cenas.at(-1);
      expect(c, 'a cena montou').toBeTruthy();
      expect(c!.specialLabel).toBe(NOME.pt);
      expect(GENERICOS).not.toContain(c!.specialLabel);
      expect(c!.foe, 'a tela passa o rótulo do inimigo').toBeTruthy();
      expect(GENERICOS).not.toContain(c!.foe);
      expect(c!.foe!.trim().length).toBeGreaterThan(3);
    });
  }

  it('Duelo: o nome do oponente vindo do servidor (oppSpecial) vence a regra; sem ele, a regra', () => {
    const s = duelStats({ stage: 'rookie' });
    const props = { me: s, opp: s, seed: 1, petSprite: '', oppSprite: '', petName: 'Pet', oppName: 'Rival', isPt: true, petElement: 'fogo', petStage: 'rookie', skills: ficha(), oppElement: 'agua', onDone: () => {}, onClose: () => {} };
    render(<DuelScreen {...props} oppSpecial={{ pt: 'Véu de Água', en: 'Water Veil' }} />);
    expect(cenas.at(-1)!.foe).toBe('Véu de Água');
    cleanup(); cenas.length = 0;
    render(<DuelScreen {...props} />);
    expect(cenas.at(-1)!.foe).toBe(foeSpecialLabel(true, 'agua', 'Rival'));
  });
});

describe('BattleStage: o selo do inimigo', () => {
  const baseProps: Pick<ComponentProps<typeof BattleStage>, 'me' | 'foes' | 'title' | 'closeLabel' | 'onClose'> = {
    me: { key: 'me', sprite: '', name: 'Eu', hp: 10, maxHp: 10, element: 'fogo' },
    foes: [{ key: 'f', sprite: '', name: 'Fera', hp: 10, maxHp: 10, element: 'agua' }],
    title: 't', closeLabel: 'x', onClose: () => {},
  };
  it('quando o INIMIGO conjura, o selo é o nome dele; quando é o pet, o nome do pet', () => {
    const r = render(<BattleStage {...baseProps} specialLabel="Zelo de Fogo" foeSpecialLabel={(f: { name: string }) => `Dele: ${f.name}`}
      action={{ id: 1, actor: 'foe', foe: 0, kind: 'special', element: 'agua' }} />);
    expect(document.querySelector('[data-stage-special]')?.textContent).toBe('Dele: Fera');
    r.rerender(<BattleStage {...baseProps} specialLabel="Zelo de Fogo" foeSpecialLabel={(f: { name: string }) => `Dele: ${f.name}`}
      action={{ id: 2, actor: 'me', foe: 0, kind: 'special', element: 'fogo' }} />);
    expect(document.querySelector('[data-stage-special]')?.textContent).toBe('Zelo de Fogo');
  });
});

describe('foeSpecialLabel', () => {
  it('determinístico, EN e PT, e muda com a identidade do inimigo', () => {
    expect(foeSpecialLabel(false, 'fogo', 'Fera A')).toBe(foeSpecialLabel(false, 'fogo', 'Fera A'));
    expect(foeSpecialLabel(true, 'fogo', 'Fera A')).toMatch(/Fogo/);
    expect(foeSpecialLabel(false, 'fogo', 'Fera A')).toMatch(/Fire/);
    expect(new Set(Array.from({ length: 30 }, (_, i) => foeSpecialLabel(true, 'agua', `F${i}`))).size).toBeGreaterThan(5);
    expect(foeSpecialLabel(true, undefined, 'x').length).toBeGreaterThan(3);
  });
});
