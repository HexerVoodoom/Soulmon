/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { GuildSheet } from './GuildSheet';
import { playerDayKey } from '../../utils/playerDay';

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
  it('mostra o estágio da Casa e "perto" sem número (a cena do Bosque mora no prédio Grove, não no Clan Hall)', async () => {
    mockServer(casaVista());
    const { container } = render(<GuildSheet {...base} casa={{ bits: 500, ownedFurniture: [], equippedDecor: {}, donatedItem: null, onSpend: vi.fn(), onSlot: vi.fn() }} />);
    await waitFor(() => expect(container.querySelector('[data-casa-nivel]')).not.toBeNull());
    expect(container.querySelector('[data-grove-cena]')).toBeNull();
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

  it('L5-D1: "Place an Item" está oculto no Clan Hall (nada de escolher item, nem porta da Praça)', async () => {
    mockServer(casaVista());
    const { container } = render(<GuildSheet {...base} casa={{ bits: 0, ownedFurniture: ['furn-lamp', 'furn-rug'], equippedDecor: { rug: 'furn-rug' }, donatedItem: null, onSpend: vi.fn(), onSlot: vi.fn() }} />);
    await waitFor(() => expect(container.querySelector('[data-guild-card="casa"]')).not.toBeNull());
    expect(container.querySelector('[data-casa-escolher]')).toBeNull();
    expect(container.querySelector('[data-casa-item]')).toBeNull();
    expect(container.querySelector('[data-predio="praca"]')).toBeNull();
    expect(calls.some(c => c.action === 'guildSlot')).toBe(false);
  });

  it('sem guilda, o item doado volta (onSlot(null))', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ guild: null, rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 })) as never;
    const onSlot = vi.fn();
    render(<GuildSheet {...base} casa={{ bits: 0, ownedFurniture: [], equippedDecor: {}, donatedItem: 'furn-lamp', onSpend: vi.fn(), onSlot }} />);
    await waitFor(() => expect(onSlot).toHaveBeenCalledWith(null));
  });
});

describe('a Missão na Feira (prédio da Feira do Hall)', () => {
  const raid = { weekKey: '2026-W41', phenomenon: 'mare', state: 'aberta', ferido: false, lastWeek: null, mine: {} };
  const comRaid = (casa: unknown) => ({ ...vista(casa), raid });
  const subir = (state: { day: string; returnAt: number } | null, onSend = vi.fn()) => ({ state, onSend });

  it('sem ida: botão "Mandar investigar"; tocar chama onSend (e NÃO a rodada de um toque)', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ guild: comRaid(casaVista()), rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 })) as never;
    const onSend = vi.fn();
    const { container } = render(<GuildSheet {...base} room="feira" missao={subir(null, onSend)} />);
    await waitFor(() => expect(container.querySelector('[data-missao-mandar]')).not.toBeNull());
    expect(container.querySelector('[data-feira-rodada]')).toBeNull();
    fireEvent.click(container.querySelector('[data-missao-mandar]')!);
    expect(onSend).toHaveBeenCalledOnce();
  });

  it('com o Soulmon fora: diz a HORA da volta (nunca contagem) e não oferece mandar de novo', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ guild: comRaid(casaVista()), rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 })) as never;
    const { container } = render(<GuildSheet {...base} room="feira" missao={subir({ day: '2026-10-11', returnAt: Date.now() + 20 * 60_000 })} />);
    await waitFor(() => expect(container.querySelector('[data-missao-fora]')).not.toBeNull());
    expect(container.querySelector('[data-missao-mandar]')).toBeNull();
    expect(container.querySelector('[data-missao-fora]')!.textContent).toMatch(/Volta às \d{1,2}[:h]\d{2}, em \d+ min/);
  });

  it('UM card, UMA ação: a história aparece, o Mistério não, e há um só botão de investigar', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ guild: comRaid(casaVista()), rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 })) as never;
    const { container } = render(<GuildSheet {...base} room="feira" missao={subir(null)} />);
    await waitFor(() => expect(container.querySelector('[data-missao-historia]')).not.toBeNull());
    expect(container.querySelector('[data-guild-card="misterio"]')).toBeNull();
    expect(container.querySelectorAll('button[data-missao-mandar], button[data-misterio-mandar]').length).toBe(1);
  });

  it('na volta (rodada de hoje feita): diz a contribuição ao clã e ao jogador, sem número nem botão', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ guild: { ...vista(casaVista()), raid: { ...raid, mine: { hitToday: true } } }, rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 })) as never;
    const { container } = render(<GuildSheet {...base} room="feira" missao={subir(null)} />);
    await waitFor(() => expect(container.querySelector('[data-missao-feita]')).not.toBeNull());
    expect(container.querySelector('[data-missao-volta-cla]')).not.toBeNull();
    expect(container.querySelector('[data-missao-volta-eu]')).not.toBeNull();
    expect(container.querySelector('[data-missao-mandar]')).toBeNull();
    expect(container.querySelector('[data-missao-feita]')!.textContent).not.toMatch(/\d/);
    // sem ação disponível: diz QUANDO a próxima libera (e nenhum botão)
    expect(container.querySelector('[data-feira-proxima]')!.textContent).toMatch(/\d/);
  });
});

describe('o Mistério encerrado (conversão da recompensa pendente)', () => {
  const raid = { weekKey: '2026-W41', phenomenon: 'mare', state: 'aberta', ferido: false, lastWeek: null, mine: {} };
  const servir = (misterio: unknown) => {
    globalThis.fetch = vi.fn(async (url: string) => {
      const action = new URL(url, 'https://x.dev').searchParams.get('action');
      if (action === 'guildRewards') return new Response(JSON.stringify({ rewards: { pending: [], scenes: [], trophyOwned: false, misterio } }), { status: 200 });
      return new Response(JSON.stringify({ guild: { ...vista(casaVista()), raid } }), { status: 200 });
    }) as never;
  };

  it('Honra: credita UMA vez por recibo e diz a linha na Feira (sem culpa, sem botão)', async () => {
    try { localStorage.clear(); } catch { /* */ }
    servir({ kind: 'honra', amount: 2, receipt: 'g1|misc|0|saveA' });
    const onClaimed = vi.fn();
    const a = render(<GuildSheet {...base} room="feira" onClaimed={onClaimed} cla={{ onReward: vi.fn() }} missao={{ state: null, onSend: vi.fn() }} />);
    await waitFor(() => expect(a.container.querySelector('[data-misterio-fim]')).not.toBeNull());
    expect(a.container.querySelector('[data-misterio-fim]')!.textContent).toBe('O Mistério da feira foi encerrado; sua recompensa virou 2 Honra.');
    expect(onClaimed).toHaveBeenCalledWith({ emblems: 2, trophyId: null });
    a.unmount();
    // 2ª abertura com o MESMO recibo: nada de novo
    const b = render(<GuildSheet {...base} room="feira" onClaimed={onClaimed} cla={{ onReward: vi.fn() }} missao={{ state: null, onSend: vi.fn() }} />);
    await waitFor(() => expect(b.container.querySelector('[data-missao-historia]')).not.toBeNull());
    await new Promise(r => setTimeout(r, 50));
    expect(b.container.querySelector('[data-misterio-fim]')).toBeNull();
    expect(onClaimed).toHaveBeenCalledTimes(1);
  });

  it('Bits: credita pelo recibo (onReward) na mesma moeda', async () => {
    try { localStorage.clear(); } catch { /* */ }
    servir({ kind: 'bits', amount: 30, receipt: 'g1|misc|1|saveA' });
    const onReward = vi.fn();
    const { container } = render(<GuildSheet {...base} room="feira" cla={{ onReward }} missao={{ state: null, onSend: vi.fn() }} />);
    await waitFor(() => expect(container.querySelector('[data-misterio-fim]')).not.toBeNull());
    expect(onReward).toHaveBeenCalledWith('g1|misc|1|saveA', [{ kind: 'bits', amount: 30 }]);
    expect(container.querySelector('[data-misterio-fim]')!.textContent).toMatch(/virou 30 Bits/);
  });
});

describe('a Guerra no lote da Arena', () => {
  const guerraMock = (war: unknown, seek?: () => unknown) => {
    globalThis.fetch = vi.fn(async (url: string) => {
      const action = new URL(url, 'https://x.dev').searchParams.get('action');
      if (action === 'guildWar') return new Response(JSON.stringify({ war }), { status: 200 });
      if (action === 'guildWarSeek') return new Response(JSON.stringify(seek?.() ?? { state: 'waiting', war: { waiting: { size: 2 }, last: null } }), { status: 200 });
      if (action === 'guildRewards') return new Response(JSON.stringify({ rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 });
      return new Response(JSON.stringify({ guild: vista(casaVista()) }), { status: 200 });
    }) as never;
  };

  it('sem guerra: botão de procurar; ao tocar o servidor responde "na fila" e a tela diz que espera', async () => {
    guerraMock({ waiting: null, last: null });
    const { container } = render(<GuildSheet {...base} room="guerra" />);
    await waitFor(() => expect(container.querySelector('[data-guerra-buscar]')).not.toBeNull());
    expect(container.querySelector('[data-guerra-visor]')).not.toBeNull();
    fireEvent.click(container.querySelector('[data-guerra-buscar]')!);
    await waitFor(() => expect(container.querySelector('[data-guerra-esperando]')).not.toBeNull());
    expect(container.querySelector('[data-guerra-buscar]')).toBeNull();
  });

  it('com resultado de hoje: marcas por confronto (sem números), a frase e nenhum botão de novo', async () => {
    const hoje = playerDayKey(new Date(), undefined);
    guerraMock({ waiting: null, last: { day: hoje, outcome: 'loss', duels: ['win', 'loss'], size: 2, enemy: 'Rivais' } });
    const { container } = render(<GuildSheet {...base} room="guerra" />);
    await waitFor(() => expect(container.querySelector('[data-guerra-resultado="loss"]')).not.toBeNull());
    expect(container.querySelectorAll('[data-guerra-duelo]').length).toBe(2);
    expect(container.querySelector('[data-guerra-resultado]')!.textContent).toMatch(/Rivais/);
    expect(container.querySelector('[data-guerra-resultado]')!.textContent).toMatch(/seiva do mesmo jeito/);
    expect(container.querySelector('[data-guerra-buscar]')).toBeNull();
  });

  it('o servidor sem a rota da guerra: a sala simplesmente não aparece', async () => {
    globalThis.fetch = vi.fn(async (url: string) => {
      const action = new URL(url, 'https://x.dev').searchParams.get('action');
      if (action === 'guildWar') return new Response('{}', { status: 400 });
      return new Response(JSON.stringify({ guild: vista(casaVista()), rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 });
    }) as never;
    const { container } = render(<GuildSheet {...base} room="guerra" />);
    await new Promise(r => setTimeout(r, 30));
    expect(container.querySelector('[data-guild-room="guerra"]')).toBeNull();
  });
});

/** Card único do Bosque: o plantio vem do servidor (`claPlantio`); o resto segue o mock da vista. */
const PLANTIO_SIM = { season: 'primavera', seasonKey: '2026-primavera', species: 'cerejeira', planted: true, canPlant: false, stage: 1, mature: false, progress: 20, progressDays: 3, totalDays: 14, level: 1, tier: 1, mine: { wateredToday: false, canHarvest: false, task: null, canDraw: true } };
function comPlantio() {
  const antes = globalThis.fetch;
  globalThis.fetch = vi.fn(async (url: string, init?: any) => {
    if (new URL(url, 'https://x.dev').searchParams.get('action') === 'claPlantio') return new Response(JSON.stringify({ plantio: PLANTIO_SIM }), { status: 200 });
    return (antes as typeof fetch)(url, init);
  }) as never;
}

describe('D-55/D-56/D-57: sem visor vetorial; um card por assunto; o Clan Hall é o administrativo', () => {
  it('o desenho vetorial (retângulos de cobre/turquesa e o cristal em losango) sumiu da tela da Guilda', async () => {
    mockServer(casaVista());
    comPlantio();
    const { container } = render(<GuildSheet {...base} room="grove" cla={{ onReward: vi.fn() }} />);
    await waitFor(() => expect(container.querySelector('[data-grove-cena]')).not.toBeNull());
    expect(container.querySelector('[data-casa-visor], [data-casa-arvore], [data-casa-tronco], [data-casa-nucleo], [data-casa-cristal], [data-casa-folha], [data-casa-ramo]')).toBeNull();
    expect(container.querySelector('[data-grove-cena] svg')).toBeNull();
  });

  it('o Bosque (prédio Grove) tem os membros andando devagar (os dois da roda), sem nome na tela até tocar', async () => {
    mockServer(casaVista());
    comPlantio();
    const { container } = render(<GuildSheet {...base} room="grove" cla={{ onReward: vi.fn() }} />);
    await waitFor(() => expect(container.querySelectorAll('[data-grove-cena] [data-grove-creature]')).toHaveLength(2));
    expect(container.querySelector('[data-grove-nome]')).toBeNull();
  });

  it('D-107: o Clan Hall é só administrativo — sem Bosque, Feira nem Guerra (cada um mora no seu prédio)', async () => {
    mockServer({ ...casaVista() });
    globalThis.fetch = vi.fn(async (url: string) => {
      const action = new URL(url, 'https://x.dev').searchParams.get('action');
      if (action === 'guildWar') return new Response(JSON.stringify({ war: { waiting: null, last: null } }), { status: 200 });
      if (action === 'guildRewards') return new Response(JSON.stringify({ rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 });
      return new Response(JSON.stringify({ guild: { ...vista(casaVista()), raid: { weekKey: '2026-W41', phenomenon: 'mare', state: 'aberta', ferido: false, lastWeek: null, mine: {} } } }), { status: 200 });
    }) as never;
    const { container } = render(<GuildSheet {...base} />);
    await waitFor(() => expect(container.querySelector('[data-guild-room="casa"]')).not.toBeNull());
    await new Promise(r => setTimeout(r, 30)); // a guerra só é perguntada no lote da Arena
    for (const sel of ['[data-guild-room="bosque"]', '[data-guild-room="feira"]', '[data-guild-room="guerra"]', '[data-guild-bosque-entrar]', '[data-grove-cena]', '[data-guild-card="bosque"]', '[data-guild-card="feira"]', '[data-guild-card="guerra"]']) {
      expect(container.querySelector(sel), sel).toBeNull();
    }
    const cards = Array.from(container.querySelectorAll<HTMLElement>('.sm2-stats-card'));
    const donoDe = (sel: string) => cards.filter(c => c.querySelector(sel));
    for (const sel of ['[data-cla-info]', '[data-guild-room="casa"]', '[data-guild-room="roda"]', '[data-guild-room="mural"]']) expect(donoDe(sel), sel).toHaveLength(1);
    const [hall] = donoDe('[data-cla-info]');
    expect(hall.querySelector('[data-guild-room="roda"]')).not.toBeNull(); // membros: administrativo
    expect(hall.querySelector('[data-guild-room="casa"]')).toBeNull();
    expect(hall.querySelector('[data-guild-room="mural"]')).toBeNull();
  });

  it('o antigo CasaVisor.tsx não existe mais', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    expect(fs.existsSync(path.resolve(__dirname, 'CasaVisor.tsx'))).toBe(false);
  });
});
