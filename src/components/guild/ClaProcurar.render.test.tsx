/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { GuildSheet } from './GuildSheet';

/** PROCURAR CLÃ (REGISTRO §203): a lista de clãs com vaga, o pedido pendente e a fila do anfitrião. */
const D1 = '1'.repeat(16), D2 = '2'.repeat(16), R1 = 'c'.repeat(16);
const vista = (over: Record<string, unknown> = {}) => ({
  id: 'g1', name: 'Roda', weekKey: '2026-W44', code: 'ABCD2345', isHost: true, size: 2, full: false,
  members: [{ id: 'a'.repeat(16), name: 'Eu', euMesmo: true }, { id: 'b'.repeat(16), name: 'Ele', euMesmo: false }],
  presence: [], threadedToday: null, mine: {}, bosque: { stage: 'clareira', stageIndex: 1, perto: false, tide: { key: null, size: 'petala' }, ornaments: [] },
  gestures: [], gestureReceived: null, raid: null, ...over,
});

let calls: Array<{ action: string; body?: any }>;
function mockServer(r: Record<string, (body: any) => { status?: number; json: unknown }>) {
  calls = [];
  globalThis.fetch = vi.fn(async (url: string, init?: any) => {
    const action = new URL(url, 'https://x.dev').searchParams.get('action')!;
    const body = init?.body ? JSON.parse(init.body) : undefined;
    calls.push({ action, body });
    if (action === 'guildRewards') return new Response(JSON.stringify({ rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 });
    const h = r[action];
    if (h) { const o = h(body); return new Response(JSON.stringify(o.json), { status: o.status ?? 200 }); }
    return new Response(JSON.stringify({ guild: null }), { status: 200 });
  }) as never;
}
afterEach(cleanup);
const base = { saveId: 'x'.repeat(32), language: 'pt-BR' as const, metaDoDiaCumprida: true };

describe('sem clã: procurar um clã', () => {
  it('abre a lista com nome e "n de max" e pede para entrar; o pendente mostra Cancelar', async () => {
    let pending: unknown = null;
    mockServer({
      guild: () => ({ json: { guild: null } }),
      guildDirectory: () => ({ json: { clans: [{ dirId: D1, name: 'Bosque Alto', size: 3, max: 12 }, { dirId: D2, name: 'Roda Lenta', size: 11, max: 12 }], pending } }),
      guildRequest: b => { pending = { dirId: b.dirId, name: 'Bosque Alto' }; return { json: { pending } }; },
      guildRequestCancel: () => { pending = null; return { json: { ok: true } }; },
    });
    const { container, getByText } = render(<GuildSheet {...base} />);
    await waitFor(() => expect(container.querySelector('[data-guild-procurar-abrir]')).not.toBeNull());
    // O código continua valendo, ao lado.
    expect(getByText('Entrar com um código')).toBeTruthy();
    fireEvent.click(container.querySelector('[data-guild-procurar-abrir]')!);
    await waitFor(() => expect(container.querySelectorAll('[data-guild-cla]').length).toBe(2));
    const linha = container.querySelector(`[data-guild-cla="${D1}"]`)!;
    expect(linha.textContent).toMatch(/Bosque Alto/);
    expect(linha.textContent).toMatch(/3 de 12/);
    fireEvent.click(linha.querySelector('[data-guild-pedir]')!);
    await waitFor(() => expect(container.querySelector('[data-guild-pendente]')).not.toBeNull());
    expect(calls.find(c => c.action === 'guildRequest')!.body.dirId).toBe(D1);
    expect(container.querySelector('[data-guild-pendente]')!.textContent).toMatch(/Pedido enviado a Bosque Alto/);
    fireEvent.click(container.querySelector('[data-guild-cancelar-pedido]')!);
    await waitFor(() => expect(container.querySelector('[data-guild-pendente]')).toBeNull());
    expect(calls.some(c => c.action === 'guildRequestCancel')).toBe(true);
  });

  it('lista vazia diz que dá para criar o seu; 409 de outro pedido vira aviso', async () => {
    mockServer({
      guild: () => ({ json: { guild: null } }),
      guildDirectory: () => ({ json: { clans: [], pending: null } }),
    });
    const { container } = render(<GuildSheet {...base} language="en-US" />);
    await waitFor(() => expect(container.querySelector('[data-guild-procurar-abrir]')).not.toBeNull());
    expect(container.querySelector('[data-guild-procurar-abrir]')!.textContent).toMatch(/Find a clan/);
    fireEvent.click(container.querySelector('[data-guild-procurar-abrir]')!);
    await waitFor(() => expect(container.textContent).toMatch(/No clan has room right now/));
  });
});

describe('anfitrião: pedidos para entrar', () => {
  it('Recusar fica à esquerda e Aceitar à direita; aceitar manda approve:true e aplica a vista nova', async () => {
    let fila = [{ requestId: R1, name: 'Bia', at: 1 }];
    mockServer({
      guild: () => ({ json: { guild: vista() } }),
      guildRequests: () => ({ json: { requests: fila } }),
      guildRequestDecide: () => { fila = []; return { json: { result: 'approved', guild: vista({ size: 3 }) } }; },
    });
    const { container } = render(<GuildSheet {...base} />);
    await waitFor(() => expect(container.querySelector(`[data-guild-pedido="${R1}"]`)).not.toBeNull());
    const linha = container.querySelector(`[data-guild-pedido="${R1}"]`)!;
    expect(linha.textContent).toMatch(/Bia/);
    const botoes = [...linha.querySelectorAll('button')];
    expect(botoes[0].hasAttribute('data-guild-recusar')).toBe(true);
    expect(botoes[1].hasAttribute('data-guild-aceitar')).toBe(true);
    fireEvent.click(botoes[1]);
    await waitFor(() => expect(calls.some(c => c.action === 'guildRequestDecide')).toBe(true));
    const dec = calls.find(c => c.action === 'guildRequestDecide')!;
    expect(dec.body).toMatchObject({ requestId: R1, approve: true });
    await waitFor(() => expect(container.querySelector('[data-guild-pedidos]')).toBeNull());
    await waitFor(() => expect(container.querySelector('[data-cla-info-membros]')!.textContent).toMatch(/3/));
  });

  it('sem pedido = silêncio; membro comum nem pergunta a fila', async () => {
    mockServer({
      guild: () => ({ json: { guild: vista({ isHost: false }) } }),
      guildRequests: () => ({ json: { requests: [{ requestId: R1, name: 'Bia', at: 1 }] } }),
    });
    const { container } = render(<GuildSheet {...base} />);
    await waitFor(() => expect(container.querySelector('[data-cla-info]')).not.toBeNull());
    expect(calls.some(c => c.action === 'guildRequests')).toBe(false);
    expect(container.querySelector('[data-guild-pedidos]')).toBeNull();
  });
});
