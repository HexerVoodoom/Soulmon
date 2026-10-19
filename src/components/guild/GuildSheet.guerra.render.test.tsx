/** @vitest-environment jsdom */
/** D-73: o lote "guerra" da Arena abre a GUERRA direto (sala própria), sem "Go to the Clan Hall". */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { GuildSheet } from './GuildSheet';

const vista = () => ({
  id: 'g1', name: 'Roda', weekKey: '2026-W41', code: 'ABCD2345', isHost: true, size: 3, full: false,
  members: [{ id: 'a'.repeat(16), name: 'Eu', euMesmo: true }, { id: 'b'.repeat(16), name: 'Ele', euMesmo: false }, { id: 'c'.repeat(16), name: 'Ela', euMesmo: false }],
  presence: [], threadedToday: null, mine: {}, bosque: { stage: 'clareira', stageIndex: 1, perto: false, tide: { key: null, size: 'petala' }, ornaments: [] },
  gestures: [], gestureReceived: null, raid: null, casa: null,
});
const server = (guild: unknown) => {
  globalThis.fetch = vi.fn(async (url: string) => {
    const action = new URL(url, 'https://x.dev').searchParams.get('action')!;
    if (action === 'guildWar') return new Response(JSON.stringify({ war: { waiting: null, last: null } }), { status: 200 });
    if (action === 'guildRewards') return new Response(JSON.stringify({ rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 });
    return new Response(JSON.stringify({ guild }), { status: 200 });
  }) as never;
};
beforeEach(() => { try { localStorage.clear(); } catch { /* */ } });
afterEach(cleanup);
const base = { saveId: 'x'.repeat(32), language: 'en-US' as const, metaDoDiaCumprida: false };

describe('GuildSheet room="guerra" (lote Guerra da Arena)', () => {
  it('com clã: só a sala da guerra, com o botão de procurar rival, e nenhum "Clan Hall"', async () => {
    server(vista());
    const { container } = render(<GuildSheet {...base} room="guerra" />);
    await waitFor(() => expect(container.querySelector('[data-guerra-buscar]')).not.toBeNull());
    expect(container.querySelector('[data-guerra-visor]')).not.toBeNull();
    expect(container.querySelector('[data-guild-room="roda"]')).toBeNull(); // nada do Salão
    expect(container.querySelector('[data-guild-room="casa"]')).toBeNull();
    expect(container.textContent).not.toMatch(/Clan Hall/);
    expect(screen.queryByRole('button', { name: /Go to the Clan Hall/ })).toBeNull();
  });

  it('procurar chama o servidor da guerra (guildWarSeek)', async () => {
    server(vista());
    const { container } = render(<GuildSheet {...base} room="guerra" />);
    await waitFor(() => expect(container.querySelector('[data-guerra-buscar]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-guerra-buscar]')!);
    await waitFor(() => expect((globalThis.fetch as any).mock.calls.some((c: any[]) => String(c[0]).includes('guildWarSeek'))).toBe(true));
  });

  it('sem clã: uma frase, sem formulário de criar e sem botão de ir ao Salão', async () => {
    server(null);
    const { container } = render(<GuildSheet {...base} room="guerra" />);
    await waitFor(() => expect(container.querySelector('[data-guerra-semcla]')).not.toBeNull());
    expect(container.querySelector('input')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
  });
});
