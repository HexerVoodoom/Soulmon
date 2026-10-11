/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { GuildSheet } from './GuildSheet';

const vista = (casa: unknown) => ({
  id: 'g1', name: 'Roda', weekKey: '2026-W41', code: 'ABCD2345', isHost: true, size: 2, full: false,
  members: [{ id: 'a'.repeat(16), name: 'Eu', euMesmo: true }, { id: 'b'.repeat(16), name: 'Ele', euMesmo: false }],
  presence: [], threadedToday: null, mine: {}, bosque: { stage: 'clareira', stageIndex: 1, perto: false, tide: { key: null, size: 'petala' }, ornaments: [] },
  gestures: [], gestureReceived: null, raid: null, casa,
});
const casaVista = (slot: string | null = null, capReached = false) => ({
  nivel: 'haste', nivelIndex: 1, perto: true,
  slots: slot ? [{ memberId: 'a'.repeat(16), item: slot, euMesmo: true }] : [],
  mine: { slot, capReached },
});

let calls: Array<{ action: string; body?: any }>;
function mockServer(initial: unknown) {
  let casa = initial;
  calls = [];
  globalThis.fetch = vi.fn(async (url: string, init?: any) => {
    const action = new URL(url, 'https://x.dev').searchParams.get('action')!;
    const body = init?.body ? JSON.parse(init.body) : undefined;
    calls.push({ action, body });
    if (action === 'guildDonate') return new Response(JSON.stringify({ accepted: body.bits, guild: vista(casa) }), { status: 200 });
    if (action === 'guildSlot') { casa = casaVista(body.item); return new Response(JSON.stringify({ guild: vista(casa) }), { status: 200 }); }
    if (action === 'guildRewards') return new Response(JSON.stringify({ rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 });
    return new Response(JSON.stringify({ guild: vista(casa) }), { status: 200 });
  }) as never;
}
beforeEach(() => { try { localStorage.clear(); } catch { /* */ } });
afterEach(cleanup);

const base = { saveId: 'x'.repeat(32), language: 'pt-BR' as const, metaDoDiaCumprida: false };

describe('a Casa da guilda no Salão', () => {
  it('mostra o visor da casa, o estágio e "perto" sem número', async () => {
    mockServer(casaVista());
    const { container } = render(<GuildSheet {...base} casa={{ bits: 500, ownedFurniture: [], equippedDecor: {}, donatedItem: null, onSpend: vi.fn(), onSlot: vi.fn() }} />);
    await waitFor(() => expect(container.querySelector('[data-casa-visor]')).not.toBeNull());
    expect(container.querySelector('[data-casa-nivel]')!.textContent).toBe('Haste');
    expect(container.querySelector('[data-casa-perto]')!.textContent).toMatch(/perto de virar Folhas de latão/);
    // nenhum número de progresso: o texto do estágio e do "perto" não tem dígito (os botões trazem a doação, que é constante).
    for (const sel of ['[data-casa-nivel]', '[data-casa-perto]']) expect(container.querySelector(sel)!.textContent).not.toMatch(/\d/);
  });

  it('doar desconta SÓ o que o servidor aceitou', async () => {
    mockServer(casaVista());
    const onSpend = vi.fn();
    const { container } = render(<GuildSheet {...base} casa={{ bits: 500, ownedFurniture: [], equippedDecor: {}, donatedItem: null, onSpend, onSlot: vi.fn() }} />);
    await waitFor(() => expect(container.querySelector('[data-casa-doar="50"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-casa-doar="50"]')!);
    await waitFor(() => expect(onSpend).toHaveBeenCalledWith(50));
    expect(calls.find(c => c.action === 'guildDonate')!.body.bits).toBe(50);
  });

  it('sem Bits, sem botão; no teto do dia, a frase "é o bastante"', async () => {
    mockServer(casaVista());
    const a = render(<GuildSheet {...base} casa={{ bits: 5, ownedFurniture: [], equippedDecor: {}, donatedItem: null, onSpend: vi.fn(), onSlot: vi.fn() }} />);
    await waitFor(() => expect(a.container.querySelector('[data-casa-sem-bits]')).not.toBeNull());
    expect(a.container.querySelector('[data-casa-doar]')).toBeNull();
    a.unmount();
    mockServer(casaVista(null, true));
    const b = render(<GuildSheet {...base} casa={{ bits: 900, ownedFurniture: [], equippedDecor: {}, donatedItem: null, onSpend: vi.fn(), onSlot: vi.fn() }} />);
    await waitFor(() => expect(b.container.querySelector('[data-casa-teto]')).not.toBeNull());
    expect(b.container.querySelector('[data-casa-doar]')).toBeNull();
  });

  it('pôr um item: só os livres (não equipados) e o save é reconciliado ao slot do servidor', async () => {
    mockServer(casaVista());
    const onSlot = vi.fn();
    const { container } = render(<GuildSheet {...base} casa={{ bits: 0, ownedFurniture: ['furn-lamp', 'furn-rug'], equippedDecor: { rug: 'furn-rug' }, donatedItem: null, onSpend: vi.fn(), onSlot }} />);
    await waitFor(() => expect(container.querySelector('[data-casa-escolher]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-casa-escolher]')!);
    expect(container.querySelector('[data-casa-item="furn-rug"]')).toBeNull(); // equipado no cenário pessoal
    fireEvent.click(container.querySelector('[data-casa-item="furn-lamp"]')!);
    await waitFor(() => expect(onSlot).toHaveBeenCalledWith('furn-lamp'));
    expect(calls.find(c => c.action === 'guildSlot')!.body.item).toBe('furn-lamp');
  });

  it('sem guilda, o item doado volta (onSlot(null))', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ guild: null, rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 })) as never;
    const onSlot = vi.fn();
    render(<GuildSheet {...base} casa={{ bits: 0, ownedFurniture: [], equippedDecor: {}, donatedItem: 'furn-lamp', onSpend: vi.fn(), onSlot }} />);
    await waitFor(() => expect(onSlot).toHaveBeenCalledWith(null));
  });
});

describe('a Missão no Salão', () => {
  const raid = { weekKey: '2026-W41', phenomenon: 'mare', state: 'aberta', ferido: false, lastWeek: null, mine: {} };
  const comRaid = (casa: unknown) => ({ ...vista(casa), raid });
  const subir = (state: { day: string; returnAt: number } | null, onSend = vi.fn()) => ({ state, onSend });

  it('sem ida: botão "Mandar investigar"; tocar chama onSend (e NÃO a rodada de um toque)', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ guild: comRaid(casaVista()), rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 })) as never;
    const onSend = vi.fn();
    const { container } = render(<GuildSheet {...base} missao={subir(null, onSend)} />);
    await waitFor(() => expect(container.querySelector('[data-missao-mandar]')).not.toBeNull());
    expect(container.querySelector('[data-feira-rodada]')).toBeNull();
    fireEvent.click(container.querySelector('[data-missao-mandar]')!);
    expect(onSend).toHaveBeenCalledOnce();
  });

  it('com o Solmon fora: diz a HORA da volta (nunca contagem) e não oferece mandar de novo', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ guild: comRaid(casaVista()), rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 })) as never;
    const { container } = render(<GuildSheet {...base} missao={subir({ day: '2026-10-11', returnAt: Date.now() + 20 * 60_000 })} />);
    await waitFor(() => expect(container.querySelector('[data-missao-fora]')).not.toBeNull());
    expect(container.querySelector('[data-missao-mandar]')).toBeNull();
    expect(container.querySelector('[data-missao-fora]')!.textContent).toMatch(/Volta às \d{1,2}[:h]\d{2}/);
  });
});
