// @vitest-environment jsdom
/**
 * §488 — Elemental Fusion igual ao Torneio: botões de modo em cima, LISTA DE 3 embaixo (mesma linha do Torneio, `EscolhaLinha`) e
 * "Sortear 3 novos". Aventura mostra ELEMENTO (nunca o inimigo); PvP mostra só jogadores da rota `opponents` (sem demo, sem monstro);
 * Lutar avança para o jogo com a escolha.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, fireEvent, cleanup, act } from '@testing-library/react';

const getOpponents = vi.fn();
vi.mock('../../utils/community', async () => {
  const real = await vi.importActual<typeof import('../../utils/community')>('../../utils/community');
  return { ...real, getOpponents: (...a: unknown[]) => getOpponents(...a) };
});
vi.mock('../RankingPanel', () => ({ RankingPanel: () => <div data-ranking-panel /> }));

import { Match3Escolha } from './Match3Escolha';
import { MinigameModeGate } from './MinigameModeGate';
import { Match3Game } from '../Match3Game';
import { adventureElementPool, type M3Choice } from '../../utils/match3Escolha';
import { isBossMatch } from '../../utils/match3Boss';
import { M3_TILE_ELEMENTS } from '../../utils/match3';

const settle = async () => { await act(async () => { await new Promise(r => setTimeout(r, 0)); }); };
const OPPS = [
  { id: 'p1', name: 'Fulano Real', petName: 'Zeca', stage: 'rookie', duel: { level: 9 } },
  { id: 'demo-x', name: 'Demo', petName: 'Demo', stage: 'rookie', duel: { level: 9 } },
  { id: 'p2', name: 'Sicrana Real', petName: 'Bianca', stage: 'champion', duel: { level: 12 } },
  { id: 'p3', name: 'Beltrano Real', petName: 'Leo', stage: 'rookie', duel: { level: 11 } },
];
const linhas = () => [...document.querySelectorAll('[data-m3-escolha-opcao]')] as HTMLElement[];

beforeEach(() => {
  getOpponents.mockReset();
  // Semente de tela sem boss: o Math.random do componente é fixado (0,5 → 2^30, que não é boss? conferido abaixo).
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Match3Escolha — Aventura', () => {
  it('nome do elemento por extenso e com acento, e o título/recompensa não se encostam (quebra o título, recompensa não encolhe)', () => {
    render(<Match3Escolha language="pt-BR" mode="adventure" playerLevel={10} onFight={vi.fn()} />);
    for (const l of linhas()) {
      const el = l.getAttribute('data-m3-escolha-elemento')!;
      const nome = l.children[1].firstElementChild as HTMLElement;
      expect(nome.textContent).not.toBe(el);
      expect(nome.textContent).toMatch(/^\p{Lu}/u);
      expect(nome.style.overflowWrap).toBe('break-word');
      expect((l.children[2] as HTMLElement).style.flexShrink).toBe('0');
      expect(parseInt(l.style.gap, 10)).toBeGreaterThanOrEqual(8);
    }
  });

  it('3 linhas de ELEMENTO (ícone + nome + Jogar), nenhum inimigo revelado; Jogar devolve a escolha', () => {
    const onFight = vi.fn();
    render(<Match3Escolha language="pt-BR" mode="adventure" playerLevel={10} onFight={onFight} />);
    const ls = linhas();
    expect(ls).toHaveLength(3);
    for (const l of ls) {
      expect(adventureElementPool()).toContain(l.getAttribute('data-m3-escolha-elemento'));
      expect(l.querySelector('img')!.getAttribute('src')).toBeTruthy();
      expect(l.textContent).toContain('Time de 4 da fenda');
      expect(l.textContent).toContain('Jogar');
      expect(l.textContent).not.toContain('Lutar');
      // O botão de ação leva a ARTE do botão (sem o marcador de chip) e é o primary.
      const b = l.querySelector('button')!;
      expect(b.getAttribute('style')).not.toContain('--sm2-btn-chip');
      expect(b.getAttribute('style')).toMatch(/--sm2-btn-kind:\s*primary/);
    }
    expect(document.querySelector('[data-m3-enemy]')).toBeNull();
    fireEvent.click(document.querySelector('[data-m3-escolha-lutar="1"]')!);
    expect(onFight).toHaveBeenCalledWith(expect.objectContaining({ mode: 'adventure', element: ls[1].getAttribute('data-m3-escolha-elemento') }));
    expect(getOpponents).not.toHaveBeenCalled();
  });

  it('Sortear 3 novos: troca a lista UMA vez por visita e some', () => {
    render(<Match3Escolha language="en-US" mode="adventure" onFight={() => {}} />);
    const antes = linhas().map(l => l.getAttribute('data-m3-escolha-elemento')).join();
    (Math.random as unknown as ReturnType<typeof vi.fn>).mockReturnValue(0.123);
    const b = document.querySelector('[data-m3-escolha-sortear]') as HTMLElement;
    expect(b.textContent).toContain('Draw 3 new opponents');
    fireEvent.click(b);
    expect(linhas()).toHaveLength(3);
    expect(linhas().map(l => l.getAttribute('data-m3-escolha-elemento')).join()).not.toBe(antes);
    expect(document.querySelector('[data-m3-escolha-sortear]')).toBeNull();
  });
});

describe('Match3Escolha — PvP', () => {
  it('a semente de tela dos testes não é de boss', () => {
    expect(isBossMatch(Math.floor(0.5 * 2 ** 31))).toBe(false);
  });

  it('só JOGADORES da rota (sem demo), sem nome de pessoa, com Bits + Honra; Jogar devolve o jogador', async () => {
    getOpponents.mockResolvedValue({ opponents: OPPS, matchesLeft: 5 });
    const onFight = vi.fn();
    render(<Match3Escolha language="en-US" mode="pvp" saveId="abc" playerLevel={10} onFight={onFight} />);
    expect(document.querySelector('[data-m3-escolha-carregando]')).toBeTruthy();
    await settle();
    expect(getOpponents).toHaveBeenCalledWith('abc');
    const ls = linhas();
    expect(ls.map(l => l.getAttribute('data-m3-escolha-jogador'))).toEqual(['p1', 'p2', 'p3']);
    expect(ls[1].textContent).toContain('Player Lv 12');
    expect(document.body.textContent).not.toMatch(/Fulano|Sicrana|Beltrano|Demo/);
    expect(ls[0].textContent).toMatch(/Bits/);
    expect(ls[0].textContent).toMatch(/Honor/);
    fireEvent.click(document.querySelector('[data-m3-escolha-lutar="2"]')!);
    const c = onFight.mock.calls[0][0] as M3Choice;
    expect(c.mode).toBe('pvp');
    expect(c.mode === 'pvp' && c.foe).toMatchObject({ kind: 'player', level: 11 });
  });

  it('lista vazia: estado vazio amigável, sem inventar jogador; offline: erro com Tentar de novo', async () => {
    getOpponents.mockResolvedValue({ opponents: [{ id: 'demo-1', stage: 'rookie' }], matchesLeft: 5 });
    render(<Match3Escolha language="pt-BR" mode="pvp" saveId="abc" onFight={() => {}} />);
    await settle();
    expect(linhas()).toHaveLength(0);
    expect(document.querySelector('[data-m3-escolha-vazio]')!.textContent).toContain('Nenhum jogador');
    cleanup();
    getOpponents.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ opponents: OPPS, matchesLeft: 5 });
    render(<Match3Escolha language="pt-BR" mode="pvp" saveId="abc" onFight={() => {}} />);
    await settle();
    expect(document.querySelector('[data-m3-escolha-erro]')).toBeTruthy();
    expect(document.querySelector('[data-m3-escolha-sortear]')).toBeNull();
    fireEvent.click(document.querySelector('[data-m3-escolha-retry]')!);
    await settle();
    expect(linhas()).toHaveLength(3);
  });

  it('sem conta: não chama a rota e diz que o PvP precisa de conta', () => {
    render(<Match3Escolha language="en-US" mode="pvp" onFight={() => {}} />);
    expect(getOpponents).not.toHaveBeenCalled();
    expect(document.querySelector('[data-m3-escolha-vazio]')!.textContent).toContain('signed-in');
  });

  it('boss decidido antes: só a linha "Boss"', () => {
    let s = 1; while (!isBossMatch(s)) s++;
    (Math.random as unknown as ReturnType<typeof vi.fn>).mockReturnValue(s / 2 ** 31);
    render(<Match3Escolha language="en-US" mode="pvp" saveId="abc" onFight={() => {}} />);
    expect(getOpponents).not.toHaveBeenCalled();
    expect(linhas()).toHaveLength(1);
    expect(document.querySelector('[data-m3-escolha-boss-tag]')!.textContent).toBe('Boss');
  });
});

describe('MinigameModeGate com a lista (Salão)', () => {
  it('botões de modo viram seletor (rádio) e a lista do modo aparece embaixo; Lutar → onPick(modo, escolha)', async () => {
    getOpponents.mockResolvedValue({ opponents: OPPS, matchesLeft: 5 });
    const onPick = vi.fn();
    render(
      <MinigameModeGate<M3Choice>
        language="pt-BR" gameName="Fusão Elemental" saveId="abc" withDifficulty={false} pveVsPvp rankings={[{ game: 'match3' }]}
        renderChoices={(level, pick) => <Match3Escolha language="pt-BR" mode={level === 2 ? 'pvp' : 'adventure'} saveId="abc" onFight={pick} />}
        onPick={onPick} onBack={() => {}}
      />,
    );
    expect(document.querySelector('[data-gate-ranking-open]')).toBeTruthy();
    const [ave, pvp] = [...document.querySelectorAll('[data-gate-pick]')] as HTMLElement[];
    expect(ave.getAttribute('aria-checked')).toBe('true');
    expect(document.querySelector('[data-m3-escolha="adventure"]')).toBeTruthy();
    fireEvent.click(pvp);
    expect(onPick).not.toHaveBeenCalled();
    expect(pvp.getAttribute('aria-checked')).toBe('true');
    await settle();
    expect(document.querySelector('[data-m3-escolha="pvp"]')).toBeTruthy();
    fireEvent.click(document.querySelector('[data-m3-escolha-lutar="0"]')!);
    expect(onPick).toHaveBeenCalledWith(2, expect.objectContaining({ mode: 'pvp', opponentId: 'p1' }));
  });
});

describe('Match3Game com a escolha', () => {
  const montar = (c: M3Choice) => render(
    <Match3Game language="en-US" evolutionStage="rookie" rankSaveId="abc" initialMode={c.mode === 'pvp' ? 'pvp' : 'pve'} initialChoice={c} playerLevel={20} onEarnPoints={() => {}} onExit={() => {}} />,
  );

  it('Aventura: o time de 4 cai do elemento escolhido', () => {
    let seed = 5; while (isBossMatch(seed)) seed++;
    montar({ mode: 'adventure', element: 'fogo', seed });
    const enemies = document.querySelectorAll('[data-m3-enemy]');
    expect(enemies.length).toBe(4);
    expect([...enemies].map(e => e.getAttribute('data-m3-element'))).toEqual(['fogo', 'fogo', 'fogo', 'fogo']);
    expect(getOpponents).not.toHaveBeenCalled();
  });

  it('PvP: 1 jogador (o escolhido), os 6 básicos fixos, sem buscar de novo', () => {
    let seed = 5; while (isBossMatch(seed)) seed++;
    montar({ mode: 'pvp', seed, opponentId: 'p2', foe: { kind: 'player', level: 12, sprite: 'x.png' } });
    const e = document.querySelector('[data-m3-enemy="1"]') as HTMLElement;
    expect(document.querySelectorAll('[data-m3-enemy]').length).toBe(1);
    expect(e.getAttribute('data-m3-foe-kind')).toBe('player');
    expect(e.getAttribute('data-m3-pvp-level')).toBe('12');
    expect(document.querySelector('[data-m3-board]')!.getAttribute('data-m3-elements')).toBe(M3_TILE_ELEMENTS.join(','));
    expect(getOpponents).not.toHaveBeenCalled();
  });
});
