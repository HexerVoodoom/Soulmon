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
  render(<GameStateProvider><TalentTreeCard language={language} /><Espiao /></GameStateProvider>);
}
const estadoTxt = () => document.querySelector('[data-talent-state]')!.textContent!;
const mais = (id: string) => document.querySelector<HTMLButtonElement>(`[data-talent="${id}"] button`)!;

beforeEach(() => { installDomGlobals(); localStorage.clear(); vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('sem rede')))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('TalentTreeCard', () => {
  it('sem Provider não renderiza nada (demo, testes)', () => {
    const { container } = render(<TalentTreeCard language="pt-BR" />);
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
  });

  it('nó sem efeito ligado aparece como "em breve" e não tem botão', () => {
    abrir({ totalXP: xpForLevel(10) });
    const n = document.querySelector('[data-talent="tal-pvp-04"]')!;
    expect(n.textContent).toMatch(/em breve/);
    expect(n.querySelector('button')).toBeNull();
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
      const n = document.querySelector(`[data-talent="${id}"]`)!;
      expect(n.textContent).not.toMatch(/em breve/);
      expect(n.querySelector('button')).not.toBeNull();
    }
    expect(document.querySelector('[data-talent="tal-pvp-05"]')!.textContent).toMatch(/Só vale quando você torce/);
    expect(document.querySelector('[data-talent-tree]')!.textContent).not.toMatch(/câmbio|cambio|exchange/i);
  });

  it('Balança: sem o nó não há botão de tirar um ponto; com o nó, tira UM ponto cobrando o preço de um ponto', () => {
    abrir({ totalXP: xpForLevel(6), gamePoints: 100, talentPicks: ['tal-pvp-01', 'tal-pvp-01'] });
    expect(document.querySelector('[data-talent-respec-one]')).toBeNull();
    cleanup();
    abrir({ totalXP: xpForLevel(6), gamePoints: 100, talentPicks: ['tal-pvp-01', 'tal-pvp-01', 'tal-com-05'] });
    const tirar = document.querySelector<HTMLButtonElement>('[data-talent-respec-one="tal-pvp-01"]')!;
    expect(tirar.getAttribute('aria-label')).toContain(`${RESPEC_COST_PER_POINT} Bits`);
    act(() => { fireEvent.click(tirar); });
    expect(estado().picks).toEqual(['tal-pvp-01', 'tal-com-05']);
    expect(estado().bits).toBe(100 - RESPEC_COST_PER_POINT);
    expect(document.querySelector('[data-talent-aviso]')!.textContent).toMatch(/voltou para você/);
  });

  it('Balança sem Bits: nada muda e o aviso é neutro', () => {
    abrir({ totalXP: xpForLevel(6), gamePoints: 3, talentPicks: ['tal-pvp-01', 'tal-com-05'] });
    act(() => { fireEvent.click(document.querySelector<HTMLButtonElement>('[data-talent-respec-one="tal-pvp-01"]')!); });
    expect(estado().picks).toEqual(['tal-pvp-01', 'tal-com-05']);
    expect(estado().bits).toBe(3);
    expect(document.querySelector('[data-talent-aviso]')!.textContent).toMatch(/Você pode voltar quando tiver juntado/);
  });
});
