// @vitest-environment jsdom
/**
 * Combate v3 / PR7 — a árvore de talentos na tela: estados (vazia, pontos, todos gastos), pick, respec pago,
 * sem Provider (nada), arte ausente (fallback de texto) e save hostil (o vetor inválido nunca aparece).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from '../contexts/GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { xpForLevel } from '../utils/bond';
import { RESPEC_COST_PER_POINT } from '../utils/talents';
import TalentTree from './TalentTree';
import TalentTreeCard from './TalentTreeCard';

vi.mock('../utils/cloudSave', () => ({
  cloudSave: () => Promise.resolve({ ok: true }),
  cloudSaveComRetry: () => Promise.resolve({ ok: true }),
  emailToSaveId: async () => 'x',
  adoptCloudSave: async () => false,
}));
vi.mock('../utils/community', () => ({ pushProfile: () => Promise.resolve({ ok: true }) }));
vi.mock('sonner', () => ({ toast: { warning: () => {}, error: () => {}, success: () => {}, info: () => {} } }));

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify({ picks: gameState.talentPicks, bits: gameState.gamePoints })}</pre>;
}
const estado = () => JSON.parse(screen.getByTestId('estado').textContent!);

function abrir(save: Record<string, unknown>, language = 'pt-BR') {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], soulmonMeta: { baseName: 'Fagulha' }, ...save }));
  render(<GameStateProvider><TalentTree language={language} /><Espiao /></GameStateProvider>);
}
const estadoTxt = () => document.querySelector('[data-talent-state]')!.textContent!;
/** Seleciona o nó (o painel passa a ser dele) e devolve o botão +1 do painel. */
const mais = (id: string) => {
  act(() => { fireEvent.click(document.querySelector<HTMLButtonElement>(`button[data-talent="${id}"]`)!); });
  return document.querySelector<HTMLButtonElement>(`[data-talent-buy="${id}"]`)!;
};
const painel = () => document.querySelector('[data-talent-panel]')!;

beforeEach(() => { installDomGlobals(); localStorage.clear(); vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('sem rede')))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('TalentTree', () => {
  it('sem Provider não renderiza nada (demo, testes)', () => {
    const { container } = render(<TalentTree language="pt-BR" />);
    expect(container.innerHTML).toBe('');
  });

  it('Vínculo 1, árvore vazia: 1 ponto, a tela diz isso e os 3 caminhos aparecem', () => {
    abrir({ totalXP: 0 });
    expect(estadoTxt()).toMatch(/Vínculo 1 · 0\/1 pontos gastos/);
    expect(estadoTxt()).toMatch(/Árvore vazia/);
    for (const p of ['pvp', 'pve', 'comercio']) expect(document.querySelector(`[data-talent-path="${p}"]`), p).not.toBeNull();
  });

  it('gastar o ponto: o pick vale na hora, o botão trava e a tela diz "todos gastos"', () => {
    abrir({ totalXP: 0 });
    act(() => { fireEvent.click(mais('tal-pvp-01')); });
    expect(estado().picks).toEqual(['tal-pvp-01']);
    expect(estadoTxt()).toMatch(/Todos os pontos estão gastos/);
    expect(mais('tal-pvp-02').disabled).toBe(true);
    expect(mais('tal-pvp-01').disabled).toBe(true);
    expect(painel().textContent).toMatch(/Sem pontos livres/);
  });

  it('nenhum nó é "em breve": os 21 têm efeito ligado e botão de +1 (decisão do dono, Tarefa B)', () => {
    abrir({ totalXP: xpForLevel(10) });
    expect(document.querySelectorAll('button[data-state="soon"]').length).toBe(0);
    mais('tal-pvp-04');
    expect(painel().textContent).not.toMatch(/em breve/);
    expect(document.querySelector('[data-talent-buy="tal-pvp-04"]')).not.toBeNull();
  });

  it('save hostil (picks acima dos pontos do Vínculo) é descartado na carga e a tela mostra a árvore vazia', () => {
    abrir({ totalXP: 0, talentPicks: ['tal-pvp-01', 'tal-pvp-01', 'tal-pvp-01'] });
    expect(estado().picks).toEqual([]);
    expect(estadoTxt()).toMatch(/0\/1 pontos/);
  });

  it('respec é SEMPRE pago: pede confirmação, cobra Bits ganhos e devolve os pontos', () => {
    abrir({ totalXP: xpForLevel(3), gamePoints: 500, talentPicks: ['tal-pvp-01', 'tal-pve-01'] });
    const botao = screen.getByText(/Refazer a árvore \(\d+ Bits\)/);
    expect(botao.textContent).toContain(String(2 * RESPEC_COST_PER_POINT));
    act(() => { fireEvent.click(botao); });
    act(() => { fireEvent.click(screen.getByText('Refazer')); });
    expect(estado().picks).toEqual([]);
    expect(estado().bits).toBe(500 - 2 * RESPEC_COST_PER_POINT);
  });

  it('sem Bits suficientes nada muda e o aviso é neutro (sem cobrança)', () => {
    abrir({ totalXP: xpForLevel(3), gamePoints: 10, talentPicks: ['tal-pvp-01', 'tal-pve-01'] });
    act(() => { fireEvent.click(screen.getByRole('button', { name: /Refazer a árvore/ })); });
    act(() => { fireEvent.click(screen.getByText('Refazer')); });
    expect(estado().picks).toEqual(['tal-pvp-01', 'tal-pve-01']);
    expect(estado().bits).toBe(10);
    expect(document.querySelector('[data-talent-aviso]')!.textContent).toMatch(/Você pode voltar quando tiver juntado/);
  });

  it('sem picks o respec não existe (nada a refazer)', () => {
    abrir({ totalXP: 0 });
    expect((screen.getByRole('button', { name: /Refazer a árvore/ }) as HTMLButtonElement).closest('button')!.disabled).toBe(true);
  });

  it('inglês: texto em EN e "Bond N", nunca "Level"', () => {
    abrir({ totalXP: 0 }, 'en-US');
    expect(estadoTxt()).toMatch(/Bond 1 · 0\/1 points spent/);
    expect(document.querySelector('[data-talent-tree]')!.textContent).not.toMatch(/Level|Nível/);
  });
});

describe('PR7b: os nós redesenhados na tela', () => {
  it('Mão aberta (torcida) e Balança aparecem como compráveis, sem "em breve", e sem a palavra câmbio', () => {
    abrir({ totalXP: xpForLevel(10) });
    for (const id of ['tal-pvp-05', 'tal-com-05']) {
      mais(id);
      expect(painel().textContent).not.toMatch(/em breve/);
      expect(document.querySelector(`[data-talent-buy="${id}"]`)).not.toBeNull();
    }
    mais('tal-pvp-05');
    expect(painel().textContent).toMatch(/Só vale quando você torce/);
    expect(document.querySelector('[data-talent-tree]')!.textContent).not.toMatch(/câmbio|cambio|exchange/i);
  });

  it('Balança: sem o nó não há botão de tirar um ponto; com o nó, tira UM ponto cobrando o preço de um ponto', () => {
    abrir({ totalXP: xpForLevel(6), gamePoints: 100, talentPicks: ['tal-pvp-01', 'tal-pvp-01'] });
    expect(document.querySelector('[data-talent-respec-one]')).toBeNull();
    cleanup();
    abrir({ totalXP: xpForLevel(8), gamePoints: 100, talentPicks: ['tal-pvp-01', 'tal-pvp-01', 'tal-com-01', 'tal-com-01', 'tal-com-03', 'tal-com-03', 'tal-com-05'] });
    mais('tal-pvp-01');
    const tirar = document.querySelector<HTMLButtonElement>('[data-talent-respec-one="tal-pvp-01"]')!;
    expect(tirar.getAttribute('aria-label')).toContain('20 Bits');
    act(() => { fireEvent.click(tirar); });
    expect(estado().picks).toEqual(['tal-pvp-01', 'tal-com-01', 'tal-com-01', 'tal-com-03', 'tal-com-03', 'tal-com-05']);
    expect(estado().bits).toBe(100 - 20); // ampulheta (com-03 x2) = -20%
    expect(document.querySelector('[data-talent-aviso]')!.textContent).toMatch(/voltou para você/);
  });

  it('Balança sem Bits: nada muda e o aviso é neutro', () => {
    abrir({ totalXP: xpForLevel(8), gamePoints: 3, talentPicks: ['tal-pvp-01', 'tal-com-01', 'tal-com-01', 'tal-com-03', 'tal-com-03', 'tal-com-05'] });
    mais('tal-pvp-01');
    act(() => { fireEvent.click(document.querySelector<HTMLButtonElement>('[data-talent-respec-one="tal-pvp-01"]')!); });
    expect(estado().picks).toEqual(['tal-pvp-01', 'tal-com-01', 'tal-com-01', 'tal-com-03', 'tal-com-03', 'tal-com-05']);
    expect(estado().bits).toBe(3);
    expect(document.querySelector('[data-talent-aviso]')!.textContent).toMatch(/Você pode voltar quando tiver juntado/);
  });
});

describe('Tarefa B: a árvore como árvore', () => {
  it('nó trancado diz em TEXTO o que falta; comprar o pré-requisito destranca', () => {
    abrir({ totalXP: xpForLevel(10) });
    mais('tal-pvp-02');
    expect(document.querySelector('[data-talent-buy="tal-pvp-02"]')).toHaveProperty('disabled', true);
    expect(document.querySelector('[data-talent-missing]')!.textContent).toMatch(/Ponta de lança com 2 graus/);
    mais('tal-pvp-01'); act(() => { fireEvent.click(mais('tal-pvp-01')); }); act(() => { fireEvent.click(mais('tal-pvp-01')); });
    expect(document.querySelector('button[data-talent="tal-pvp-02"]')!.getAttribute('data-state')).toBe('available');
    expect(mais('tal-pvp-02').disabled).toBe(false);
  });
  it('convergência (um OU outro) e dois pré-requisitos aparecem no texto, em EN também', () => {
    abrir({ totalXP: xpForLevel(10) }, 'en-US');
    mais('tal-pvp-05');
    expect(document.querySelector('[data-talent-missing]')!.textContent).toMatch(/one of: .* or /);
    mais('tal-pvp-07');
    expect(document.querySelector('[data-talent-missing]')!.textContent).toMatch(/at rank 3 and .* and /);
  });
  it('as ligações existem e o estado delas segue os nós; todo nó é um botão com rótulo', () => {
    abrir({ totalXP: xpForLevel(10), talentPicks: ['tal-pvp-01', 'tal-pvp-01'] });
    expect(document.querySelector('[data-edge="hub>tal-pvp-01"]')!.getAttribute('data-edge-state')).toBe('bought');
    expect(document.querySelector('[data-edge="tal-pvp-01>tal-pvp-02"]')!.getAttribute('data-edge-state')).toBe('open');
    expect(document.querySelector('[data-edge="tal-pvp-02>tal-pvp-05"]')!.getAttribute('data-edge-state')).toBe('locked');
    const nos = document.querySelectorAll('button[data-talent]');
    expect(nos.length).toBe(21);
    nos.forEach((b) => expect(b.getAttribute('aria-label')).toMatch(/\S/));
  });
  it('roving tabindex: um só nó na ordem do Tab, e as setas andam', () => {
    abrir({ totalXP: 0 });
    expect(document.querySelectorAll('button[data-talent][tabindex="0"]').length).toBe(1);
    const a = document.querySelector<HTMLButtonElement>('button[data-talent="tal-pvp-01"]')!;
    act(() => { a.focus(); fireEvent.keyDown(a, { key: 'ArrowUp' }); });
    expect(document.querySelector('button[data-talent][tabindex="0"]')!.getAttribute('data-talent')).not.toBe('tal-pvp-01');
  });
  it('zoom + e −: muda o tamanho e trava nos extremos', () => {
    abrir({ totalXP: 0 });
    const mais_ = document.querySelector<HTMLButtonElement>('[data-talent-zoom="in"]')!;
    for (let i = 0; i < 6; i++) act(() => { fireEvent.click(mais_); });
    expect(mais_.disabled).toBe(true);
  });
  it('o resumo da StatsPage só monta a árvore ao abrir', async () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], totalXP: 0 }));
    render(<GameStateProvider><TalentTreeCard language="pt-BR" /></GameStateProvider>);
    expect(document.querySelector('[data-talent-summary]')).not.toBeNull();
    expect(document.querySelector('[data-talent-tree]')).toBeNull();
    act(() => { fireEvent.click(document.querySelector('[data-talent-toggle]')!); });
    await screen.findByRole('group', { name: 'Árvore de talentos' });
    expect(document.querySelector('[data-talent-tree]')).not.toBeNull();
  });
});
