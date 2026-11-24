// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { FocusBoard } from './FocusBoard';
import { STORAGE_KEYS } from '../../utils/storageKeys';

vi.mock('../../utils/auth', () => ({ authHeaders: async () => ({}) }));

const ID = 'b'.repeat(32);
const DIA = '2026-11-08';
let server: { active: unknown; grants: Record<string, unknown[]> };
beforeEach(() => {
  localStorage.clear();
  server = { active: null, grants: {} };
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    const now = Date.now();
    if (body?.action === 'start') {
      server.active = { sid: 's1', seed: 7, mode: body.mode, env: body.env, keys: body.keys, day: body.day, startAt: now, pausedMs: 0, pausedAt: null, pauses: 0 };
    } else if (body?.action === 'pause' && server.active) {
      server.active = { ...(server.active as object), pausedAt: now, pauses: 1 };
    } else if (body?.action === 'end') {
      server.grants = { 's1:0': [{ kind: 'material', id: 'moss', qty: 1 }] };
      server.active = null;
    }
    return new Response(JSON.stringify({ active: server.active, ledger: { day: DIA, items: 1, ess: 0, done: 0 }, grants: server.grants, now }), { status: 200 });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const q = (c: HTMLElement, s: string) => c.querySelector(s) as HTMLElement | null;
const TASKS = [{ id: 't1', name: 'Escrever o relatório', completed: false }, { id: 't2', name: 'Pagar a conta', completed: false }];
/** Começar abre o modal de escolha da tarefa (§300): escolhe a primeira e confirma. */
const startWithTask = async (c: HTMLElement) => {
  await waitFor(() => expect((q(c, '[data-focus-start]') as HTMLButtonElement).disabled).toBe(false));
  await act(async () => { fireEvent.click(q(c, '[data-focus-start]')!); });
  fireEvent.click(document.querySelector('[data-focus-pick="t1"]')!);
  await act(async () => { fireEvent.click(document.querySelector('[data-focus-pick-go]')!); });
};

describe('quadro da Oficina (§247)', () => {
  it('card de chave: sem fazer a técnica não dá chave; feita, a chave aparece no card', async () => {
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} onGrants={() => {}} />);
    fireEvent.click(q(container, '[data-focus-card="elo"]')!);
    fireEvent.click(q(container, '[data-oficina-take-key]')!);
    expect(q(container, '[data-oficina-key-missing]')).not.toBeNull();
    const [cue, actn] = container.querySelectorAll('[data-oficina-if-then] input');
    fireEvent.change(cue, { target: { value: 'Se eu sentar' } });
    fireEvent.change(actn, { target: { value: 'abro a lista' } });
    fireEvent.click(q(container, '[data-oficina-take-key]')!);
    expect(q(container, '[data-focus-card="elo"]')!.getAttribute('data-has-key')).toBe('true');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.FOCO_JOURNEY_KEYS)!)).toEqual(['elo']);
  });
  it('sem tarefas, o card de tarefa dá a chave com "Não tenho tarefas agora" (D-3)', () => {
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} onGrants={() => {}} />);
    fireEvent.click(q(container, '[data-focus-card="brejo"]')!);
    fireEvent.click(q(container, '[data-oficina-no-tasks]')!);
    expect(q(container, '[data-focus-card="brejo"]')!.getAttribute('data-has-key')).toBe('true');
  });
  it('começar abre a jornada; ao reabrir com jornada ativa, o card vira "Voltar à jornada"; encerrar credita e limpa as chaves', async () => {
    localStorage.setItem(STORAGE_KEYS.FOCO_JOURNEY_KEYS, JSON.stringify(['pena']));
    const onGrants = vi.fn();
    const first = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} tasks={TASKS} onGrants={onGrants} />);
    await startWithTask(first.container);
    await waitFor(() => expect(document.querySelector('[data-journey]')).not.toBeNull());
    expect((server.active as { keys: string[] }).keys).toEqual(['pena']);
    first.unmount();
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} onGrants={onGrants} />);
    await waitFor(() => expect(q(container, '[data-focus-return]')).not.toBeNull());
    fireEvent.click(q(container, '[data-focus-return]')!);
    fireEvent.click(document.querySelector('[data-journey-end]')!);
    expect(document.querySelector('[data-end-session]')).not.toBeNull();
    expect(document.body.textContent).toContain('Deseja encerrar a sessão?');
    fireEvent.click(document.querySelector('[data-end-session-no]')!);
    expect(document.querySelector('[data-end-session]')).toBeNull();
    expect(document.querySelector('[data-journey]')).not.toBeNull();
    fireEvent.click(document.querySelector('[data-journey-end]')!);
    await act(async () => { fireEvent.click(document.querySelector('[data-end-session-yes]')!); });
    await waitFor(() => expect(q(container, '[data-focus-done]')).not.toBeNull());
    expect(onGrants).toHaveBeenCalledWith(DIA, { 's1:0': [{ kind: 'material', id: 'moss', qty: 1 }] }, undefined);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.FOCO_JOURNEY_KEYS)!)).toEqual([]);
  });
  it('a jornada: só o relógio (sem "Foco"), chaves, três botões redondos em linha, pausa vira play e sem trilha', async () => {
    localStorage.setItem(STORAGE_KEYS.FOCO_JOURNEY_KEYS, JSON.stringify(['pena']));
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} tasks={TASKS} onGrants={() => {}} />);
    await startWithTask(container);
    await waitFor(() => expect(document.querySelector('[data-journey]')).not.toBeNull());
    const card = document.querySelector('[data-journey-modal]') as HTMLElement;
    expect(card.style.top).not.toBe('');
    expect(card.style.bottom).toBe('');
    expect(card.style.background).toContain('80%');
    expect(document.querySelector('[data-journey-clock]')!.textContent).toMatch(/^\d{1,2}:\d{2}$/);
    expect(card.textContent).not.toMatch(/Foco|Focus/);
    // as chaves saíram do card para o canto inferior direito (pedido do dono, 10/11/2026)
    const keys = document.querySelector('[data-journey-keys]') as HTMLElement;
    expect(card.contains(keys)).toBe(false);
    expect(keys.querySelector('[data-key-glyph="pena"]')).not.toBeNull();
    expect(keys.style.right).not.toBe('');
    expect(keys.style.bottom).not.toBe('');
    const order = Array.from(card.querySelectorAll('[data-journey-actions] button')).map(b => b.getAttribute('aria-label'));
    expect(order).toEqual(['Sair para a Oficina (a jornada continua)', 'Pausar', 'Encerrar']);
    expect(document.querySelector('[data-journey-scene] path[stroke="#5c8f84"][stroke-width="2.6"]')).toBeNull();
    expect(document.querySelectorAll('[data-journey-scene] path[stroke-width="4.2"]').length).toBe(0);
    await act(async () => { fireEvent.click(document.querySelector('[data-journey-pause]')!); });
    await waitFor(() => expect(document.querySelector('[data-journey-resume]')).not.toBeNull());
    expect(document.querySelector('[data-journey-pause]')).toBeNull();
    fireEvent.click(document.querySelector('[data-journey-close]')!);
    expect(document.querySelector('[data-journey]')).toBeNull();
  });
  it('sem conexão, começar fica desativado com o motivo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} onGrants={() => {}} />);
    await waitFor(() => expect(q(container, '[data-focus-offline]')).not.toBeNull());
    expect((q(container, '[data-focus-start]') as HTMLButtonElement).disabled).toBe(true);
    // Ação que a pessoa veio buscar: tom `acao` (arte cheia em repouso; desativado mantém a arte própria).
    expect(q(container, '[data-focus-start]')!.getAttribute('data-cta-tone')).toBe('acao');
  });
});

describe('escolher a tarefa e o baú da sessão (§300)', () => {
  it('começar SEMPRE abre o modal de escolha; sem tarefa escolhida não há como começar', async () => {
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} tasks={TASKS} onGrants={() => {}} />);
    await waitFor(() => expect((q(container, '[data-focus-start]') as HTMLButtonElement).disabled).toBe(false));
    await act(async () => { fireEvent.click(q(container, '[data-focus-start]')!); });
    expect(document.querySelector('[data-focus-picker]')).not.toBeNull();
    expect((document.querySelector('[data-focus-pick-go]') as HTMLButtonElement).disabled).toBe(true);
    expect(server.active).toBeNull();
    fireEvent.click(document.querySelector('[data-focus-pick="t2"]')!);
    expect((document.querySelector('[data-focus-pick-go]') as HTMLButtonElement).disabled).toBe(false);
    // o ✓ aparece na linha marcada (o check turquesa não pode sumir sobre o fill do botão)
    const marcada = document.querySelector('[data-focus-pick="t2"]') as HTMLElement;
    expect([...marcada.querySelectorAll('.sm2-icon')].some(e => e.textContent === 'check' && !!e.querySelector('svg path'))).toBe(true);
    expect(marcada.style.backgroundColor).not.toBe('var(--sm2-primary-fill)');
    await act(async () => { fireEvent.click(document.querySelector('[data-focus-pick-go]')!); });
    await waitFor(() => expect(document.querySelector('[data-journey]')).not.toBeNull());
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.FOCO_SESSION)!).taskId).toBe('t2');
    // o dock mostra SÓ a escolhida, sem etiqueta nem cabeçalho
    expect(document.querySelector('[data-focus-dock-chosen]')).toBeNull();
    expect(document.querySelectorAll('[data-focus-dock] > div > ul > li').length).toBe(1);
    expect(document.querySelector('[data-focus-dock]')!.textContent).not.toContain('Em foco');
  });
  it('sem tarefas abertas, o modal oferece criar uma na hora', async () => {
    const onCreateTask = vi.fn(() => true);
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} tasks={[]} onCreateTask={onCreateTask} onGrants={() => {}} />);
    await waitFor(() => expect((q(container, '[data-focus-start]') as HTMLButtonElement).disabled).toBe(false));
    await act(async () => { fireEvent.click(q(container, '[data-focus-start]')!); });
    expect(document.querySelector('[data-focus-picker-empty]')).not.toBeNull();
    fireEvent.change(document.querySelector('[data-focus-pick-new] input')!, { target: { value: 'Estudar inglês' } });
    fireEvent.click(document.querySelector('[data-focus-pick-add]')!);
    expect(onCreateTask).toHaveBeenCalledWith('Estudar inglês');
  });
  it('fechar o modal (Voltar) não começa a jornada', async () => {
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} tasks={TASKS} onGrants={() => {}} />);
    await waitFor(() => expect((q(container, '[data-focus-start]') as HTMLButtonElement).disabled).toBe(false));
    await act(async () => { fireEvent.click(q(container, '[data-focus-start]')!); });
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(document.querySelector('[data-focus-picker]')).toBeNull());
    expect(server.active).toBeNull();
  });
  it('o baú do canto esquerdo abre o tooltip com os itens coletados e fecha ao tocar fora', async () => {
    localStorage.setItem(STORAGE_KEYS.FOCO_SESSION, JSON.stringify({ taskId: 't1', taskName: 'Escrever', collected: [{ kind: 'material', id: 'moss', qty: 2 }, { kind: 'food', id: '🍎', qty: 1 }], cycles: 0 }));
    server.active = { sid: 's1', seed: 7, mode: 'p25', env: 'forest', keys: [], day: DIA, startAt: Date.now(), pausedMs: 0, pausedAt: null, pauses: 0 };
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} tasks={TASKS} onGrants={() => {}} />);
    await waitFor(() => expect(q(container, '[data-focus-return]')).not.toBeNull());
    fireEvent.click(q(container, '[data-focus-return]')!);
    const bag = document.querySelector('[data-journey-bag]') as HTMLElement;
    const keys = document.querySelector('[data-journey-bag-box]') as HTMLElement;
    expect(keys.style.left).toBe('16px');
    expect(document.querySelector('[data-journey-bag-count]')!.textContent).toBe('3');
    expect(document.querySelector('[data-journey-bag-tip]')).toBeNull();
    fireEvent.click(bag);
    const tip = document.querySelector('[data-journey-bag-tip]')!;
    expect(tip.textContent).toContain('Musgo');
    expect(tip.textContent).toContain('×2');
    expect(tip.querySelector('[data-journey-bag-item="moss"] [data-item-icon]')).not.toBeNull();
    fireEvent.pointerDown(document.body);
    expect(document.querySelector('[data-journey-bag-tip]')).toBeNull();
    // não há mais a soma "Baú aberto" embaixo
    expect(document.querySelector('[data-journey-toast]')).toBeNull();
  });
  it('item novo vira voo do baú do mapa ao baú do canto; sem Web Animations (ou movimento reduzido) o contador só atualiza', async () => {
    server.active = { sid: 's1', seed: 7, mode: 'p25', env: 'forest', keys: [], day: DIA, startAt: Date.now() - 20 * 60_000, pausedMs: 0, pausedAt: null, pauses: 0 };
    server.grants = { 's1:0': [{ kind: 'material', id: 'moss', qty: 1 }] };
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} tasks={TASKS} onGrants={() => {}} />);
    await waitFor(() => expect(q(container, '[data-focus-return]')).not.toBeNull());
    localStorage.setItem(STORAGE_KEYS.FOCO_SESSION, JSON.stringify({ taskId: 't1', taskName: 'Escrever', collected: [], cycles: 0 }));
    fireEvent.click(q(container, '[data-focus-return]')!);
    await waitFor(() => expect(document.querySelector('[data-journey]')).not.toBeNull());
    expect(document.querySelector('[data-journey-flying]')).toBeNull(); // jsdom: chega na hora
  });
});


describe('sala de descanso e ciclos (§301, §312)', () => {
  const key = (k: string) => JSON.parse(localStorage.getItem(k) ?? 'null');
  /** Servidor com `claim`: ao fim do foco devolve o baú de conclusão e a chave do Calabouço, e a jornada some. */
  const stubServer = () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      const now = Date.now();
      if (body?.action === 'start') {
        server.active = { sid: 's' + now, seed: 7, mode: body.mode, env: body.env, keys: body.keys, day: body.day, startAt: now, pausedMs: 0, pausedAt: null, pauses: 0 };
      } else if (body?.action === 'claim' && server.active) {
        const a = server.active as { startAt: number };
        if (now - a.startAt >= 25 * 60_000) { server.grants = { done1: [{ kind: 'material', id: 'ore', qty: 1 }] }; server.active = null; return new Response(JSON.stringify({ active: null, ledger: { day: DIA, items: 1, ess: 0, done: 1 }, grants: server.grants, dungeonKeyDay: DIA, now }), { status: 200 }); }
      }
      return new Response(JSON.stringify({ active: server.active, ledger: { day: DIA, items: 0, ess: 0, done: 0 }, grants: server.grants, now }), { status: 200 });
    }));
  };
  const finished = (minAgo = 26) => ({ sid: 's0', seed: 7, mode: 'p25', env: 'cavern', keys: [], day: DIA, startAt: Date.now() - minAgo * 60_000, pausedMs: 0, pausedAt: null, pauses: 0 });
  const seedSession = (cycles = 0) => localStorage.setItem(STORAGE_KEYS.FOCO_SESSION, JSON.stringify({ taskId: 't1', taskName: 'Escrever o relatório', collected: [], cycles }));
  const openJourney = async (container: HTMLElement) => {
    await waitFor(() => expect(q(container, '[data-focus-return]')).not.toBeNull());
    await act(async () => { fireEvent.click(q(container, '[data-focus-return]')!); });
  };

  it('a sala de descanso chega quando o foco acaba, com o Baú aberto e a chave dentro dela', async () => {
    stubServer(); seedSession(); server.active = finished();
    const onFocusCycle = vi.fn();
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} tasks={TASKS} onGrants={() => {}} onFocusCycle={onFocusCycle} />);
    await openJourney(container);
    await waitFor(() => expect(document.querySelector('[data-rest-room]')).not.toBeNull());
    expect(document.querySelector('[data-journey]')).toBeNull();
    expect(document.querySelector('[data-rest-art="cavern"], [data-rest-fallback="cavern"]')).not.toBeNull(); // arte instalada (§361) ou, sem ela, o fundo gerado em código
    expect(document.querySelector('[data-rest-key]')!.textContent).toContain('chave do Calabouço');
    expect(document.querySelector('[data-rest-chest]')!.textContent).toContain('Minério');
    expect(document.querySelector('[data-rest-cycles]')!.textContent).toBe('1 foco concluído');
    expect(onFocusCycle).toHaveBeenCalledTimes(1);
    // o descanso começou no FIM do foco (há ~1 min), não agora
    expect(document.querySelector('[data-rest-clock]')!.textContent).toMatch(/^0[34]:[0-5]\d$/);
    expect(key(STORAGE_KEYS.FOCO_REST).mode).toBe('p25');
    expect(Math.abs(key(STORAGE_KEYS.FOCO_REST).startedAt - (Date.now() - 60_000))).toBeLessThan(5_000);
  });
  it('não existe porta nem quadrado de chegada no mapa (§312): o fim do trajeto é o fim de uma seção', async () => {
    server.active = finished(5);
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} tasks={TASKS} onGrants={() => {}} />);
    await openJourney(container);
    expect(document.querySelector('[data-journey-door]')).toBeNull();
    expect(document.querySelector('[data-journey-arrival]')).toBeNull();
    expect(document.querySelector('[data-journey-leave]')!.getAttribute('data-leaving')).toBe('false');
  });
  it('ao chegar ao fim o mapa se dissolve e a sala de descanso assume em tela cheia, sem caixa nem placeholder', async () => {
    stubServer(); seedSession();
    server.active = { ...finished(), startAt: Date.now() - 25 * 60_000 + 400 };
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} tasks={TASKS} onGrants={() => {}} />);
    await openJourney(container);
    expect(document.querySelector('[data-journey-leave]')!.getAttribute('data-leaving')).toBe('false');
    await waitFor(() => expect(document.querySelector('[data-journey-leave]')!.getAttribute('data-leaving')).toBe('true'), { timeout: 3000 });
    await waitFor(() => expect(document.querySelector('[data-rest-room]')).not.toBeNull(), { timeout: 4000 });
    const room = document.querySelector('[data-rest-room]') as HTMLElement;
    expect(room.style.position).toBe('fixed');
    expect(room.style.inset).toMatch(/^0/);
    expect(document.querySelector('[data-rest-bg] [data-rest-art], [data-rest-bg] [data-rest-fallback]')).not.toBeNull(); // arte (§361) ou fundo em código
    expect(document.querySelector('[data-journey]')).toBeNull();
    expect(document.querySelector('[data-journey-door], [data-journey-arrival]')).toBeNull();
  });
  it('o descanso é por timestamp: voltar depois do fim mostra «concluído», e o card da Oficina leva de volta a ele', async () => {
    seedSession(1);
    localStorage.setItem(STORAGE_KEYS.FOCO_REST, JSON.stringify({ startedAt: Date.now() - 6 * 60_000, mode: 'p25', env: 'forest', items: [], key: false }));
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} tasks={TASKS} onGrants={() => {}} />);
    await waitFor(() => expect(q(container, '[data-focus-return-rest]')).not.toBeNull());
    expect(q(container, '[data-focus-rest-line]')!.textContent).toContain('00:00');
    fireEvent.click(q(container, '[data-focus-return-rest]')!);
    expect(document.querySelector('[data-rest-room]')!.getAttribute('data-rest-over')).toBe('true');
    expect(document.querySelector('[data-rest-clock]')!.textContent).toBe('00:00');
    // sair da sala não encerra o descanso
    fireEvent.click(document.querySelector('[data-rest-close]')!);
    expect(document.querySelector('[data-rest-room]')).toBeNull();
    expect(key(STORAGE_KEYS.FOCO_REST)).not.toBeNull();
  });
  it('«Seguir» começa outro foco na mesma sessão; «Concluir a missão» encerra tudo com o resumo', async () => {
    stubServer(); seedSession(); server.active = finished();
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} tasks={TASKS} onGrants={() => {}} />);
    await openJourney(container);
    await waitFor(() => expect(document.querySelector('[data-rest-room]')).not.toBeNull());
    await act(async () => { fireEvent.click(document.querySelector('[data-rest-next]')!); });
    await waitFor(() => expect(document.querySelector('[data-journey]')).not.toBeNull());
    expect(document.querySelector('[data-rest-room]')).toBeNull();
    expect(key(STORAGE_KEYS.FOCO_REST)).toBeNull();
    expect(key(STORAGE_KEYS.FOCO_SESSION).taskId).toBe('t1'); // a tarefa continua
    expect(key(STORAGE_KEYS.FOCO_SESSION).cycles).toBe(1);
    expect((server.active as { mode: string }).mode).toBe('p25');
    expect((server.active as { env: string }).env).toBe('cavern');
    // segundo ciclo acaba: de novo a sala, agora com 2 focos
    server.active = finished();
    fireEvent.click(document.querySelector('[data-journey-close]')!);
    await act(async () => { fireEvent.click(q(container, '[data-focus-return]')!); });
    await waitFor(() => expect(document.querySelector('[data-rest-room]')).not.toBeNull());
    expect(document.querySelector('[data-rest-cycles]')!.textContent).toBe('2 focos concluídos');
    // §316c: ao lado do CTA «Seguir», as secundárias são SÓ TEXTO (sem fundo, sem borda).
    expect(document.querySelector('[data-rest-next]')!.hasAttribute('data-cta-button')).toBe(true);
    for (const sel of ['[data-rest-finish]', '[data-rest-close]']) expect(document.querySelector(sel)!.hasAttribute('data-cta-texto')).toBe(true);
    await act(async () => { fireEvent.click(document.querySelector('[data-rest-finish]')!); });
    expect(document.querySelector('[data-end-session]')).not.toBeNull();
    expect(document.querySelector('[data-rest-room]')).not.toBeNull();
    await act(async () => { fireEvent.click(document.querySelector('[data-end-session-no]')!); });
    expect(document.querySelector('[data-end-session]')).toBeNull();
    expect(document.querySelector('[data-rest-room]')).not.toBeNull();
    await act(async () => { fireEvent.click(document.querySelector('[data-rest-finish]')!); });
    await act(async () => { fireEvent.keyDown(document, { key: 'Escape' }); });
    expect(document.querySelector('[data-end-session]')).toBeNull();
    expect(document.querySelector('[data-rest-room]')).not.toBeNull();
    await act(async () => { fireEvent.click(document.querySelector('[data-rest-finish]')!); });
    await act(async () => { fireEvent.click(document.querySelector('[data-end-session-yes]')!); });
    expect(document.querySelector('[data-rest-room]')).toBeNull();
    expect(q(container, '[data-focus-done]')!.textContent).toContain('Missão concluída: 2 focos');
    expect(q(container, '[data-focus-done]')!.textContent).toContain('chave do Calabouço');
    expect(key(STORAGE_KEYS.FOCO_REST)).toBeNull();
    expect(key(STORAGE_KEYS.FOCO_SESSION)).toBeNull();
    expect(q(container, '[data-focus-start]')).not.toBeNull();
  });
});

describe('aviso do baú', () => {
  it('mostra o nome do material e da essência, não o id', async () => {
    const { itemLabel } = await import('./JourneyScreen');
    expect(itemLabel({ kind: 'material', id: 'moss', qty: 1 }, true)).toContain('Musgo');
    expect(itemLabel({ kind: 'material', id: 'moss', qty: 1 }, false)).toContain('Moss');
    expect(itemLabel({ kind: 'essence', id: 'planta', qty: 2 }, true)).not.toContain('planta ×');
  });
});

describe('chaves esmaecidas e modal do cenário', () => {
  it('chave não conquistada aparece como a própria chave com opacidade baixa, pixelada, com rótulo "bloqueada" (sem cadeado)', () => {
    localStorage.setItem(STORAGE_KEYS.FOCO_JOURNEY_KEYS, JSON.stringify(['pena']));
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} onGrants={() => {}} />);
    const mudo = q(container, '[data-focus-card="elo"] img[data-key-glyph="elo"]') as HTMLImageElement;
    expect(mudo.getAttribute('data-key-muted')).toBe('true');
    expect(Number(mudo.style.opacity)).toBeGreaterThanOrEqual(0.35);
    expect(Number(mudo.style.opacity)).toBeLessThanOrEqual(0.45);
    expect(mudo.style.imageRendering).toBe('pixelated');
    expect(mudo.alt).toContain('bloqueada');
    const cheio = q(container, '[data-focus-card="pena"] img[data-key-glyph="pena"]') as HTMLImageElement;
    expect(cheio.style.opacity).toBe('1');
  });
  it('tocar no cenário abre o modal com as opções; escolher fecha e atualiza', () => {
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} onGrants={() => {}} />);
    expect(q(container, '[data-focus-env]')!.getAttribute('data-focus-env')).toBe('forest');
    expect(document.querySelector('[data-focus-env-modal]')).toBeNull();
    fireEvent.click(q(container, '[data-focus-env-open]')!);
    expect(document.querySelectorAll('[data-focus-env-option]').length).toBe(6);
    expect(document.querySelector('[data-focus-env-option="forest"]')!.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(document.querySelector('[data-focus-env-option="cavern"]')!);
    expect(document.querySelector('[data-focus-env-modal]')).toBeNull();
    expect(q(container, '[data-focus-env]')!.getAttribute('data-focus-env')).toBe('cavern');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.FOCO_JOURNEY_PREFS)!).env).toBe('cavern');
  });
});
