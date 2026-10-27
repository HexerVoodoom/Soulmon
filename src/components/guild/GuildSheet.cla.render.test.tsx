/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { GuildSheet } from './GuildSheet';

// A vitória da defesa é decisão do cliente: aqui ela é determinística (o combate em si tem teste próprio).
vi.mock('../../utils/plantioDefesa', async (orig) => ({ ...(await orig<typeof import('../../utils/plantioDefesa')>()), lutarDefesa: () => ({ won: true, fightsWon: 3 }) }));

const EU = 'a'.repeat(16);
const ELE = 'b'.repeat(16);
const vista = () => ({
  id: 'g1', name: 'Roda', weekKey: '2026-W42', code: 'ABCD2345', isHost: true, size: 2, full: false,
  members: [{ id: EU, name: 'Eu', euMesmo: true }, { id: ELE, name: 'Ele', euMesmo: false }],
  presence: [], threadedToday: null, mine: {}, bosque: { stage: 'clareira', stageIndex: 1, perto: false, tide: { key: null, size: 'petala' }, ornaments: [] },
  gestures: [], gestureReceived: null, raid: null,
  casa: { nivel: 'haste', nivelIndex: 1, perto: false, slots: [], mine: { slot: null, capReached: false } },
});
const plantio = (over: Record<string, unknown> = {}) => ({
  season: 'primavera', seasonKey: '2026-primavera', species: 'girassol', planted: false, canPlant: true,
  stage: 0, mature: false, level: null, tier: null, today: { waterOk: false, protectedToday: false }, mine: { wateredToday: false, canHarvest: false }, ...over,
});

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
});

describe('Praça e Casa: ocultas no Clan Hall (L5-D1), não apagadas', () => {
  it('sem porta da Praça, sem "Place an Item" e sem nenhuma chamada à Praça', async () => {
    mockServer({});
    const { container } = render(<GuildSheet {...base} casa={casa} cla={{ onReward: vi.fn() }} />);
    await waitFor(() => expect(container.querySelector('[data-cla-info]')).not.toBeNull());
    await waitFor(() => expect(container.querySelector('[data-guild-card="casa"]')).not.toBeNull());
    expect(container.querySelector('[data-guild-card="predios"]')).toBeNull();
    expect(container.querySelector('[data-predio="praca"]')).toBeNull();
    expect(container.querySelector('[data-casa-escolher]')).toBeNull();
    expect(container.querySelector('[data-praca-visor]')).toBeNull();
    expect(calls.some(c => c.action === 'claPraca')).toBe(false);
  });
});

describe('Plantio / Jardim (L5-D2)', () => {
  const ingles = { language: 'en-US' as const };
  const crescendo = (over: Record<string, unknown> = {}) => plantio({
    species: 'cerejeira', planted: true, canPlant: false, stage: 1, progress: 21, progressDays: 3, totalDays: 14, level: 1, tier: 1,
    underAttack: true, mine: { wateredToday: false, canHarvest: false, task: null, canDraw: true }, ...over,
  });
  const comTarefa = (task: 'water' | 'protect' | null, extra: Record<string, unknown> = {}) =>
    crescendo({ mine: { wateredToday: false, canHarvest: false, task, canDraw: false, ...extra } });

  it('o jardim abre direto: sem porta nem "Fechar", e lê o servidor na hora', async () => {
    mockServer({ claPlantio: () => ({ json: { plantio: crescendo() } }) });
    const { container } = render(<GuildSheet {...base} room="grove" cla={{ onReward: vi.fn() }} />);
    await waitFor(() => expect(container.querySelector('[data-plantio-especie]')).not.toBeNull());
    expect(container.querySelector('[data-guild-room="plantio"]')).not.toBeNull();
    expect(container.querySelector('[data-predio]')).toBeNull();
    expect(container.querySelector('[data-predio-fechar]')).toBeNull();
    expect(calls.some(c => c.action === 'claPlantio')).toBe(true);
    expect(container.querySelector('[data-plantio-especie]')!.textContent).toBe('Cerejeira e acácia');
    expect(container.querySelector('[data-plantio-estacao]')!.textContent).toBe('Primavera');
  });

  it('terra vazia: planta sozinha (claPlantar), sem o jogador abrir nada', async () => {
    let atual: any = plantio({ species: 'cerejeira' });
    mockServer({
      claPlantio: () => ({ json: { plantio: atual } }),
      claPlantar: () => { atual = crescendo({ stage: 0, progress: 0, progressDays: 0 }); return { json: { plantio: atual } }; },
    });
    const { container } = render(<GuildSheet {...base} room="grove" cla={{ onReward: vi.fn() }} />);
    await waitFor(() => expect(calls.some(c => c.action === 'claPlantar')).toBe(true));
    await waitFor(() => expect(container.querySelector('[data-plantio-estagio]')).not.toBeNull());
    expect(calls.filter(c => c.action === 'claPlantar')).toHaveLength(1);
    expect(container.querySelector('[data-plantio-arvore]')!.textContent).toMatch(/Nível/);
  });

  it('a semente mostra "x / y" dias e o botão da ação do dia é "Tend the garden" (nada de Regar/Proteger)', async () => {
    mockServer({ claPlantio: () => ({ json: { plantio: crescendo() } }) });
    const { container } = render(<GuildSheet {...base} {...ingles} room="grove" cla={{ onReward: vi.fn() }} />);
    await waitFor(() => expect(container.querySelector('[data-plantio-dias]')).not.toBeNull());
    expect(container.querySelector('[data-plantio-dias]')!.textContent).toBe('3 / 14');
    expect(container.querySelector('[data-plantio-cuidar]')!.textContent).toMatch(/Tend the garden/);
    expect(container.querySelector('[data-plantio-regar]')).toBeNull();
    expect(container.querySelector('[data-plantio-proteger]')).toBeNull();
    expect(container.querySelector('[data-plantio-colher]')).toBeNull();
  });

  it('"Tend the garden" dispara claSortear; sorteado aguar: regar (claRegar) na hora e vira "regou hoje"', async () => {
    let atual: any = crescendo();
    mockServer({
      claPlantio: () => ({ json: { plantio: atual } }),
      claSortear: () => { atual = comTarefa('water'); return { json: { plantio: atual, task: 'water' } }; },
      claRegar: () => { atual = crescendo({ mine: { wateredToday: true, canHarvest: false, task: null, canDraw: false } }); return { json: { plantio: atual } }; },
    });
    const { container } = render(<GuildSheet {...base} {...ingles} room="grove" cla={{ onReward: vi.fn() }} />);
    await waitFor(() => expect(container.querySelector('[data-plantio-cuidar]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-plantio-cuidar]')!);
    await waitFor(() => expect(calls.some(c => c.action === 'claSortear')).toBe(true));
    await waitFor(() => expect(calls.some(c => c.action === 'claRegar')).toBe(true));
    await waitFor(() => expect(container.querySelector('[data-plantio-regado]')).not.toBeNull());
    expect(calls.some(c => c.action === 'claProteger')).toBe(false);
    expect(container.querySelector('[data-plantio-cuidar]')).toBeNull();
    expect(container.querySelector('[data-plantio-erro]')).toBeNull();
  });

  it('sorteado proteger: a defesa mostra 3 inimigos; vencer chama claProteger (a vitória é do cliente)', async () => {
    let atual: any = crescendo();
    mockServer({
      claPlantio: () => ({ json: { plantio: atual } }),
      claSortear: () => { atual = comTarefa('protect'); return { json: { plantio: atual, task: 'protect' } }; },
      claProteger: () => { atual = crescendo({ today: { waterOk: false, protectedToday: true }, mine: { wateredToday: false, canHarvest: false, task: null, canDraw: false } }); return { json: { plantio: atual } }; },
    });
    const { container } = render(<GuildSheet {...base} {...ingles} room="grove" cla={{ onReward: vi.fn() }} />);
    await waitFor(() => expect(container.querySelector('[data-plantio-cuidar]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-plantio-cuidar]')!);
    await waitFor(() => expect(container.querySelector('[data-plantio-defesa]')).not.toBeNull());
    expect(container.querySelectorAll('[data-plantio-defesa] li img')).toHaveLength(3);
    expect(calls.some(c => c.action === 'claProteger')).toBe(false); // abrir o combate não protege
    fireEvent.click(container.querySelector('[data-plantio-lutar]')!);
    await waitFor(() => expect(calls.some(c => c.action === 'claProteger')).toBe(true));
    await waitFor(() => expect(container.querySelector('[data-plantio-protegido]')).not.toBeNull());
    expect(container.querySelector('[data-plantio-defesa]')).toBeNull();
  });

  it('o servidor recusa regar sem sorteio (409 "no draw"): relê em silêncio, sem frase de erro e sem "regou hoje"', async () => {
    mockServer({
      claPlantio: () => ({ json: { plantio: comTarefa('water') } }), // vista velha: ainda acha que sorteou
      claRegar: () => ({ status: 409, json: { error: 'no draw' } }),
    });
    const { container } = render(<GuildSheet {...base} {...ingles} room="grove" cla={{ onReward: vi.fn() }} />);
    await waitFor(() => expect(container.querySelector('[data-plantio-cuidar]')).not.toBeNull());
    const leituras = () => calls.filter(c => c.action === 'claPlantio').length;
    const antes = leituras();
    fireEvent.click(container.querySelector('[data-plantio-cuidar]')!);
    await waitFor(() => expect(calls.some(c => c.action === 'claRegar')).toBe(true));
    await waitFor(() => expect(leituras()).toBeGreaterThan(antes));
    expect(container.querySelector('[data-plantio-regado]')).toBeNull();
    expect(container.querySelector('[data-plantio-erro]')).toBeNull();
  });

  it('madura: colher UMA vez por semana credita o fruto pelo recibo e depois diz que já colheu', async () => {
    const onReward = vi.fn();
    let atual: any = plantio({ species: 'cerejeira', planted: true, canPlant: false, stage: 4, mature: true, progress: 100, level: 1, tier: 1, mine: { wateredToday: false, canHarvest: true } });
    mockServer({
      claPlantio: () => ({ json: { plantio: atual } }),
      claColher: () => {
        atual = { ...atual, mine: { wateredToday: false, canHarvest: false } };
        return { json: { plantio: atual, fruit: { id: 'fruto-cerejeira-t1', especie: 'cerejeira', tier: 1, bits: 5 }, receipt: 'g1|2026-W42|2026-primavera' } };
      },
    });
    const { container } = render(<GuildSheet {...base} room="grove" cla={{ onReward }} />);
    await waitFor(() => expect(container.querySelector('[data-plantio-colher]')).not.toBeNull());
    expect(container.querySelector('[data-plantio-cuidar]')).toBeNull();
    fireEvent.click(container.querySelector('[data-plantio-colher]')!);
    await waitFor(() => expect(onReward).toHaveBeenCalledOnce());
    const [receipt, rewards] = onReward.mock.calls[0];
    expect(receipt).toBe('g1|2026-W42|2026-primavera');
    expect(rewards[0]).toEqual({ kind: 'bits', amount: 5 });
    await waitFor(() => expect(container.querySelector('[data-plantio-colhido]')).not.toBeNull());
    expect(container.querySelector('[data-plantio-colher]')).toBeNull();
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
