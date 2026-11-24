/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { GuildSheet } from './GuildSheet';

vi.mock('./GroveRaidFight', () => ({ GroveRaidFight: () => null }));

const EU = 'a'.repeat(16);
const vista = () => ({
  id: 'g1', name: 'Roda', weekKey: '2026-W42', code: 'ABCD2345', isHost: true, size: 1, full: false,
  members: [{ id: EU, name: 'Eu', euMesmo: true }],
  presence: [], threadedToday: null, mine: {}, bosque: { stage: 'clareira', stageIndex: 1, perto: false, tide: { key: null, size: 'petala' }, ornaments: [] },
  gestures: [], gestureReceived: null, raid: null,
  casa: { nivel: 'haste', nivelIndex: 1, perto: true, slots: [], mine: { slot: null, capReached: false } },
});
const plantio = (task: 'water' | 'protect' | null, mine: Record<string, unknown> = {}) => ({
  season: 'primavera', seasonKey: '2026-primavera', species: 'cerejeira', planted: true, canPlant: false,
  stage: 1, progress: 21, progressDays: 3, totalDays: 14, mature: false, level: 1, tier: 1, underAttack: task === 'protect',
  today: { waterOk: false, protectedToday: false }, mine: { wateredToday: false, canHarvest: false, task, canDraw: false, ...mine },
});

function mockServer(atual: () => unknown, extra: Record<string, () => unknown> = {}) {
  globalThis.fetch = vi.fn(async (url: string) => {
    const action = new URL(url, 'https://x.dev').searchParams.get('action')!;
    if (action === 'guildRewards') return new Response(JSON.stringify({ rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 });
    if (action === 'claPlantio') return new Response(JSON.stringify({ plantio: atual() }), { status: 200 });
    if (extra[action]) return new Response(JSON.stringify(extra[action]()), { status: 200 });
    return new Response(JSON.stringify({ guild: vista() }), { status: 200 });
  }) as never;
}
beforeEach(() => { try { localStorage.clear(); } catch { /* */ } });
afterEach(cleanup);

const base = { saveId: 'x'.repeat(32), metaDoDiaCumprida: true, room: 'grove' as const, cla: { onReward: vi.fn() } };

describe.each([
  ['pt-BR', 'Volte amanhã', 'Cuidar do jardim'],
  ['en-US', 'Come back tomorrow', 'Tend the garden'],
] as const)('Bosque, ação já feita hoje (%s)', (language, volte, cuidar) => {
  it('CTA desabilitado (aria-disabled); no toque aparece o aviso e ele some sozinho', async () => {
    mockServer(() => plantio(null, { wateredToday: true }));
    const { container } = render(<GuildSheet {...base} language={language} />);
    await waitFor(() => expect(container.querySelector('[data-plantio-cuidar-feito]')).not.toBeNull());
    const cta = container.querySelector('[data-plantio-cuidar-feito]')!;
    expect(cta.getAttribute('aria-disabled')).toBe('true');
    expect(cta.textContent).toMatch(cuidar);
    expect(container.querySelector('[data-plantio-cuidar]')).toBeNull();
    expect(container.querySelector('[data-plantio-volte-amanha]')).toBeNull();
    fireEvent.click(cta);
    expect(container.querySelector('[data-plantio-volte-amanha]')!.textContent).toBe(volte);
    await waitFor(() => expect(container.querySelector('[data-plantio-volte-amanha]')).toBeNull(), { timeout: 4000 });
  });
});

describe('Bosque, regar mostra o efeito do banho', () => {
  it('toque em Regar: várias gotas na cena, que somem em ~1,5 s', async () => {
    let atual: any = plantio('water');
    mockServer(() => atual, { claRegar: () => { atual = plantio(null, { wateredToday: true }); return { plantio: atual }; } });
    const { container } = render(<GuildSheet {...base} language="en-US" />);
    await waitFor(() => expect(container.querySelector('[data-plantio-cuidar]')).not.toBeNull());
    expect(container.querySelector('[data-plantio-cuidar]')!.textContent).toMatch(/Water/);
    expect(container.querySelector('[data-plantio-chuva]')).toBeNull();
    fireEvent.click(container.querySelector('[data-plantio-cuidar]')!);
    await waitFor(() => expect(container.querySelectorAll('[data-grove-cena] [data-plantio-gota]').length).toBeGreaterThanOrEqual(8));
    await waitFor(() => expect(container.querySelector('[data-plantio-chuva]')).toBeNull(), { timeout: 4000 });
  });
});

describe('Bosque, Defender só no estado certo', () => {
  it('tarefa proteger: o CTA diz Defender / Defend', async () => {
    mockServer(() => plantio('protect'));
    for (const [language, rotulo] of [['pt-BR', /Defender$/], ['en-US', /Defend$/]] as const) {
      const { container, unmount } = render(<GuildSheet {...base} language={language} />);
      await waitFor(() => expect(container.querySelector('[data-plantio-cuidar]')).not.toBeNull());
      expect(container.querySelector('[data-plantio-cuidar]')!.textContent).toMatch(rotulo);
      unmount();
    }
  });
  it('sem tarefa de defesa (regar ou a escolher), nunca diz Defender', async () => {
    mockServer(() => plantio('water'));
    const { container } = render(<GuildSheet {...base} language="pt-BR" />);
    await waitFor(() => expect(container.querySelector('[data-plantio-cuidar]')).not.toBeNull());
    expect(container.querySelector('[data-plantio-cuidar]')!.textContent).not.toMatch(/Defender/);
  });
});

describe('Bosque, a árvore do clã', () => {
  it.each([['pt-BR', 'Haste'], ['en-US', 'Rod']] as const)('mostra o estágio da seiva no Bosque (%s)', async (language, nome) => {
    mockServer(() => plantio('water'));
    const { container } = render(<GuildSheet {...base} language={language} />);
    await waitFor(() => expect(container.querySelector('[data-grove-casa-arvore]')).not.toBeNull());
    expect(container.querySelector('[data-grove-casa-nivel]')!.textContent).toBe(nome);
    expect(container.querySelector('[data-grove-casa-perto]')).not.toBeNull();
  });
});
