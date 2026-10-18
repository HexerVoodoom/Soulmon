/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { GuildSheet } from './GuildSheet';

const EU = 'a'.repeat(16);
const ELE = 'b'.repeat(16);
const vista = () => ({
  id: 'g1', name: 'Roda', weekKey: '2026-W42', code: 'ABCD2345', isHost: true, size: 2, full: false,
  members: [{ id: EU, name: 'Eu', euMesmo: true }, { id: ELE, name: 'Ele', euMesmo: false }],
  presence: [], threadedToday: null, mine: {}, bosque: { stage: 'clareira', stageIndex: 1, perto: false, tide: { key: null, size: 'petala' }, ornaments: [] },
  gestures: [], gestureReceived: null, raid: null,
  casa: { nivel: 'haste', nivelIndex: 1, perto: false, slots: [], mine: { slot: null, capReached: false } },
});
const praca = (over: Record<string, unknown> = {}) => ({
  slots: [0, 1, 2, 3].map(slot => ({ slot, item: null, by: null, mine: false })),
  gifts: [], mine: { sentToday: [] }, ...over,
});
const plantio = (over: Record<string, unknown> = {}) => ({
  season: 'primavera', seasonKey: '2026-primavera', species: 'girassol', planted: false, canPlant: true,
  stage: 0, mature: false, level: null, tier: null, today: { waterOk: false, protectedToday: false }, mine: { wateredToday: false, canHarvest: false }, ...over,
});
const misterio = (over: Record<string, unknown> = {}) => ({ bar: 30, round: 0, investigating: 0, mine: { sent: false, rewardPending: false, capReached: false }, ...over });

let calls: Array<{ action: string; body?: any }>;
let respostas: Record<string, (body: any) => { status?: number; json: unknown }>;
function mockServer(r: typeof respostas) {
  respostas = r;
  calls = [];
  globalThis.fetch = vi.fn(async (url: string, init?: any) => {
    const action = new URL(url, 'https://x.dev').searchParams.get('action')!;
    const body = init?.body ? JSON.parse(init.body) : undefined;
    calls.push({ action, body });
    if (action === 'guildRewards') return new Response(JSON.stringify({ rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 });
    const h = respostas[action];
    if (h) { const o = h(body); return new Response(JSON.stringify(o.json), { status: o.status ?? 200 }); }
    return new Response(JSON.stringify({ guild: vista() }), { status: 200 });
  }) as never;
}
beforeEach(() => { try { localStorage.clear(); } catch { /* */ } });
afterEach(cleanup);

const base = { saveId: 'x'.repeat(32), language: 'pt-BR' as const, metaDoDiaCumprida: false };
const casa = { bits: 0, ownedFurniture: ['furn-lamp', 'furn-rug'], equippedDecor: { rug: 'furn-rug' }, donatedItem: null, onSpend: vi.fn(), onSlot: vi.fn() };

async function abrir(container: HTMLElement, predio: string) {
  await waitFor(() => expect(container.querySelector(`[data-predio="${predio}"]`)).not.toBeNull());
  fireEvent.click(container.querySelector(`[data-predio="${predio}"]`)!);
}

describe('D-09: Informações do clã', () => {
  it('uma entrada rotulada com nome, membros e nível — sem duplicar a ficha', async () => {
    mockServer({});
    const { container } = render(<GuildSheet {...base} cla={{ onReward: vi.fn() }} />);
    await waitFor(() => expect(container.querySelector('[data-cla-info]')).not.toBeNull());
    const info = container.querySelector('[data-cla-info]')!;
    expect(info.getAttribute('aria-label')).toBe('Informações do clã');
    expect(info.textContent).toMatch(/Informações do clã/);
    expect(container.querySelector('[data-cla-info-nivel]')!.textContent).toMatch(/Haste/);
    expect(container.querySelector('[data-cla-info-membros]')!.textContent).toMatch(/2/);
    expect(container.querySelectorAll('[data-cla-info]').length).toBe(1);
  });
  it('em inglês diz Clan', async () => {
    mockServer({});
    const { container } = render(<GuildSheet {...base} language="en-US" cla={{ onReward: vi.fn() }} />);
    await waitFor(() => expect(container.querySelector('[data-cla-info]')).not.toBeNull());
    expect(container.querySelector('[data-cla-info]')!.getAttribute('aria-label')).toBe('Clan info');
  });
  it('os prédios só falam com o servidor depois de abertos', async () => {
    mockServer({ claPraca: () => ({ json: { praca: praca() } }) });
    const { container } = render(<GuildSheet {...base} cla={{ onReward: vi.fn() }} />);
    await waitFor(() => expect(container.querySelector('[data-predio="praca"]')).not.toBeNull());
    expect(calls.some(c => c.action === 'claPraca')).toBe(false);
    fireEvent.click(container.querySelector('[data-predio="praca"]')!);
    await waitFor(() => expect(calls.some(c => c.action === 'claPraca')).toBe(true));
  });
});

describe('Praça (D-11 + D-10)', () => {
  it('mostra o visor e os 4 lugares; pôr um item livre chama claPracaSlot', async () => {
    let atual = praca();
    mockServer({
      claPraca: () => ({ json: { praca: atual } }),
      claPracaSlot: (b) => { atual = praca({ slots: [0, 1, 2, 3].map(slot => ({ slot, item: slot === b.slot ? b.item : null, by: null, mine: slot === b.slot })) }); return { json: { praca: atual } }; },
    });
    const { container } = render(<GuildSheet {...base} casa={casa} cla={{ onReward: vi.fn() }} />);
    await abrir(container, 'praca');
    await waitFor(() => expect(container.querySelector('[data-praca-visor]')).not.toBeNull());
    expect(container.querySelectorAll('[data-praca-lugar-item]').length).toBe(4);
    fireEvent.click(container.querySelector('[data-praca-escolher="1"]')!);
    expect(container.querySelector('[data-praca-item="furn-rug"]')).toBeNull(); // equipado no cenário pessoal
    fireEvent.click(container.querySelector('[data-praca-item="furn-lamp"]')!);
    await waitFor(() => expect(calls.find(c => c.action === 'claPracaSlot')!.body).toMatchObject({ slot: 1, item: 'furn-lamp' }));
    await waitFor(() => expect(container.querySelector('[data-praca-lugar="1"]')!.getAttribute('data-ocupado')).toBe('true'));
    await waitFor(() => expect(container.querySelector('[data-praca-tirar="1"]')).not.toBeNull());
  });

  it('enviar presente: habilitado, chama claPresente com o id do membro e depois fica desabilitado', async () => {
    let enviados: string[] = [];
    mockServer({
      claPraca: () => ({ json: { praca: praca({ mine: { sentToday: enviados } }) } }),
      claPresente: (b) => { enviados = [b.to]; return { json: { sent: true, praca: praca({ mine: { sentToday: enviados } }) } }; },
    });
    const { container } = render(<GuildSheet {...base} cla={{ onReward: vi.fn() }} />);
    await abrir(container, 'praca');
    const sel = `[data-praca-presentear="${ELE}"]`;
    await waitFor(() => expect(container.querySelector(sel)).not.toBeNull());
    expect(container.querySelector(sel)!.hasAttribute('disabled')).toBe(false);
    fireEvent.click(container.querySelector(sel)!);
    await waitFor(() => expect(calls.find(c => c.action === 'claPresente')!.body.to).toBe(ELE));
    await waitFor(() => expect(container.querySelector(sel)!.hasAttribute('disabled')).toBe(true));
  });

  it('já enviou hoje: o botão chega desabilitado', async () => {
    mockServer({ claPraca: () => ({ json: { praca: praca({ mine: { sentToday: [ELE] } }) } }) });
    const { container } = render(<GuildSheet {...base} cla={{ onReward: vi.fn() }} />);
    await abrir(container, 'praca');
    await waitFor(() => expect(container.querySelector(`[data-praca-presentear="${ELE}"]`)).not.toBeNull());
    expect(container.querySelector(`[data-praca-presentear="${ELE}"]`)!.hasAttribute('disabled')).toBe(true);
  });

  it('presente recebido: "Abrir" credita pelo onReward com o recibo do servidor', async () => {
    const onReward = vi.fn();
    const gift = { from: ELE, day: '2026-10-18', item: { kind: 'chip', id: 'chip-power' }, id: `${ELE}|2026-10-18` };
    mockServer({
      claPraca: () => ({ json: { praca: praca({ gifts: [gift] }) } }),
      claPresenteClaim: () => ({ json: { claimed: { item: gift.item, receipt: 'rec-1' }, praca: praca() } }),
    });
    const { container } = render(<GuildSheet {...base} cla={{ onReward }} />);
    await abrir(container, 'praca');
    await waitFor(() => expect(container.querySelector('[data-praca-abrir]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-praca-abrir]')!);
    await waitFor(() => expect(onReward).toHaveBeenCalledWith('rec-1', [{ kind: 'chip', id: 'chip-power' }]));
    expect(calls.find(c => c.action === 'claPresenteClaim')!.body.giftId).toBe(gift.id);
    await waitFor(() => expect(container.querySelector('[data-praca-presente]')).toBeNull());
    expect(onReward).toHaveBeenCalledTimes(1);
  });

  it('falha de rede ao abrir: frase calma e botão de tentar de novo, sem crédito', async () => {
    globalThis.fetch = vi.fn(async (url: string) => {
      const action = new URL(url, 'https://x.dev').searchParams.get('action');
      if (action === 'claPraca') throw new TypeError('offline');
      if (action === 'guildRewards') return new Response(JSON.stringify({ rewards: { pending: [], scenes: [], trophyOwned: false } }), { status: 200 });
      return new Response(JSON.stringify({ guild: vista() }), { status: 200 });
    }) as never;
    const onReward = vi.fn();
    const { container } = render(<GuildSheet {...base} cla={{ onReward }} />);
    await abrir(container, 'praca');
    await waitFor(() => expect(container.querySelector('[data-praca-erro]')).not.toBeNull());
    expect(onReward).not.toHaveBeenCalled();
  });
});

describe('Plantio (D-14..D-17)', () => {
  it('terra vazia: espécie da estação e botão Plantar; plantar chama claPlantar', async () => {
    let atual: any = plantio();
    mockServer({
      claPlantio: () => ({ json: { plantio: atual } }),
      claPlantar: () => { atual = plantio({ planted: true, canPlant: false, stage: 0, progress: 0, level: 1, tier: 1 }); return { json: { plantio: atual } }; },
    });
    const { container } = render(<GuildSheet {...base} cla={{ onReward: vi.fn() }} />);
    await abrir(container, 'plantio');
    await waitFor(() => expect(container.querySelector('[data-plantio-especie]')).not.toBeNull());
    expect(container.querySelector('[data-plantio-especie]')!.textContent).toBe('Girassol');
    expect(container.querySelector('[data-plantio-estacao]')!.textContent).toBe('Primavera');
    fireEvent.click(container.querySelector('[data-plantio-plantar]')!);
    await waitFor(() => expect(calls.some(c => c.action === 'claPlantar')).toBe(true));
    await waitFor(() => expect(container.querySelector('[data-plantio-estagio]')).not.toBeNull());
    expect(container.querySelector('[data-plantio-arvore]')!.textContent).toMatch(/Nível/);
  });

  it('crescendo e atrasada: avisa com calma, oferece Regar e Proteger; regar fica "você regou hoje"', async () => {
    let atual: any = plantio({ planted: true, canPlant: false, stage: 2, progress: 50, delayed: true, level: 2, tier: 1 });
    mockServer({
      claPlantio: () => ({ json: { plantio: atual } }),
      claRegar: () => { atual = { ...atual, mine: { wateredToday: true, canHarvest: false } }; return { json: { plantio: atual } }; },
      claProteger: () => { atual = { ...atual, today: { waterOk: false, protectedToday: true } }; return { json: { plantio: atual } }; },
    });
    const { container } = render(<GuildSheet {...base} cla={{ onReward: vi.fn() }} />);
    await abrir(container, 'plantio');
    await waitFor(() => expect(container.querySelector('[data-plantio-atrasada]')).not.toBeNull());
    expect(container.querySelector('[data-plantio-colher]')).toBeNull();
    fireEvent.click(container.querySelector('[data-plantio-regar]')!);
    await waitFor(() => expect(container.querySelector('[data-plantio-regado]')).not.toBeNull());
    expect(container.querySelector('[data-plantio-regar]')).toBeNull();
    fireEvent.click(container.querySelector('[data-plantio-proteger]')!);
    await waitFor(() => expect(container.querySelector('[data-plantio-protegido]')).not.toBeNull());
  });

  it('madura: colher UMA vez por semana credita o fruto pelo recibo e depois diz que já colheu', async () => {
    const onReward = vi.fn();
    let atual: any = plantio({ planted: true, canPlant: false, stage: 4, mature: true, progress: 100, level: 1, tier: 1, mine: { wateredToday: false, canHarvest: true } });
    mockServer({
      claPlantio: () => ({ json: { plantio: atual } }),
      claColher: () => {
        atual = { ...atual, mine: { wateredToday: false, canHarvest: false } };
        return { json: { plantio: atual, fruit: { id: 'fruto-girassol-t1', especie: 'girassol', tier: 1, bits: 5 }, receipt: 'g1|2026-W42|2026-primavera' } };
      },
    });
    const { container } = render(<GuildSheet {...base} cla={{ onReward }} />);
    await abrir(container, 'plantio');
    await waitFor(() => expect(container.querySelector('[data-plantio-colher]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-plantio-colher]')!);
    await waitFor(() => expect(onReward).toHaveBeenCalledOnce());
    const [receipt, rewards] = onReward.mock.calls[0];
    expect(receipt).toBe('g1|2026-W42|2026-primavera');
    expect(rewards[0]).toEqual({ kind: 'bits', amount: 5 });
    expect(rewards[1]).toMatchObject({ kind: 'decor' });
    await waitFor(() => expect(container.querySelector('[data-plantio-colhido]')).not.toBeNull());
    expect(container.querySelector('[data-plantio-colher]')).toBeNull();
  });

  it('409 (já feito em outro aparelho) é estado: relê em silêncio, sem frase de erro', async () => {
    let planta: any = plantio({ planted: true, canPlant: false, stage: 1, progress: 10, level: 1, tier: 1 });
    mockServer({
      claPlantio: () => ({ json: { plantio: planta } }),
      claRegar: () => { planta = { ...planta, mine: { wateredToday: true, canHarvest: false } }; return { status: 409, json: { error: 'already watered' } }; },
    });
    const { container } = render(<GuildSheet {...base} cla={{ onReward: vi.fn() }} />);
    await abrir(container, 'plantio');
    await waitFor(() => expect(container.querySelector('[data-plantio-regar]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-plantio-regar]')!);
    await waitFor(() => expect(container.querySelector('[data-plantio-regado]')).not.toBeNull());
    expect(container.querySelector('[data-plantio-erro]')).toBeNull();
  });
});

describe('Mistério (D-18)', () => {
  it('mandar investigar chama claMisterioEnviar e passa a dizer que está investigando', async () => {
    let atual: any = misterio();
    mockServer({
      claMisterio: () => ({ json: { misterio: atual } }),
      claMisterioEnviar: () => { atual = misterio({ investigating: 1, mine: { sent: true, rewardPending: false, capReached: false } }); return { json: { misterio: atual } }; },
    });
    const { container } = render(<GuildSheet {...base} cla={{ onReward: vi.fn() }} />);
    await abrir(container, 'misterio');
    await waitFor(() => expect(container.querySelector('[data-misterio-mandar]')).not.toBeNull());
    expect(container.querySelector('[data-misterio-barra]')).not.toBeNull();
    expect(container.querySelector('[data-misterio-criatura]')).not.toBeNull();
    fireEvent.click(container.querySelector('[data-misterio-mandar]')!);
    await waitFor(() => expect(container.querySelector('[data-misterio-enviado]')).not.toBeNull());
    expect(container.querySelector('[data-misterio-mandar]')).toBeNull();
    expect(container.querySelector('[data-misterio-criatura]')).toBeNull();
  });

  it('barra cheia: resgatar a recompensa credita pelo recibo e o botão some', async () => {
    const onReward = vi.fn();
    let atual: any = misterio({ mine: { sent: false, rewardPending: true, capReached: false } });
    mockServer({
      claMisterio: () => ({ json: { misterio: atual } }),
      claMisterioClaim: () => { atual = misterio({ bar: 0, round: 1 }); return { json: { claimed: { reward: { kind: 'bits', amount: 30 }, receipt: 'g1|mis|0|aaaaaaaa' }, misterio: atual } }; },
    });
    const { container } = render(<GuildSheet {...base} cla={{ onReward }} />);
    await abrir(container, 'misterio');
    await waitFor(() => expect(container.querySelector('[data-misterio-resgatar]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-misterio-resgatar]')!);
    await waitFor(() => expect(onReward).toHaveBeenCalledWith('g1|mis|0|aaaaaaaa', [{ kind: 'bits', amount: 30 }]));
    await waitFor(() => expect(container.querySelector('[data-misterio-resgatar]')).toBeNull());
    expect(onReward).toHaveBeenCalledTimes(1);
  });

  it('a barra não escreve número: só luz', async () => {
    mockServer({ claMisterio: () => ({ json: { misterio: misterio({ bar: 47 }) } }) });
    const { container } = render(<GuildSheet {...base} cla={{ onReward: vi.fn() }} />);
    await abrir(container, 'misterio');
    await waitFor(() => expect(container.querySelector('[data-misterio-barra]')).not.toBeNull());
    expect(container.querySelector('[data-misterio-barra]')!.textContent).toBe('');
    expect(container.querySelector('[data-guild-room="misterio"]')!.textContent).not.toMatch(/47/);
  });
});

describe('o Salão sem a ponte `cla` segue como antes', () => {
  it('sem a prop, nenhuma porta de prédio é desenhada', async () => {
    mockServer({});
    const { container } = render(<GuildSheet {...base} />);
    await waitFor(() => expect(container.querySelector('[data-cla-info]')).not.toBeNull());
    expect(container.querySelector('[data-predio]')).toBeNull();
  });
});
