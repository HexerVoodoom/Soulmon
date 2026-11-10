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
    const first = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} onGrants={onGrants} />);
    await waitFor(() => expect((q(first.container, '[data-focus-start]') as HTMLButtonElement).disabled).toBe(false));
    await act(async () => { fireEvent.click(q(first.container, '[data-focus-start]')!); });
    await waitFor(() => expect(document.querySelector('[data-journey]')).not.toBeNull());
    expect((server.active as { keys: string[] }).keys).toEqual(['pena']);
    first.unmount();
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} onGrants={onGrants} />);
    await waitFor(() => expect(q(container, '[data-focus-return]')).not.toBeNull());
    fireEvent.click(q(container, '[data-focus-return]')!);
    fireEvent.click(document.querySelector('[data-journey-end]')!);
    await act(async () => { fireEvent.click(document.querySelector('[data-journey-end-confirm]')!); });
    await waitFor(() => expect(q(container, '[data-focus-done]')).not.toBeNull());
    expect(onGrants).toHaveBeenCalledWith(DIA, { 's1:0': [{ kind: 'material', id: 'moss', qty: 1 }] }, undefined);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.FOCO_JOURNEY_KEYS)!)).toEqual([]);
  });
  it('a jornada: só o relógio (sem "Foco"), chaves, três botões redondos em linha, pausa vira play e sem trilha', async () => {
    localStorage.setItem(STORAGE_KEYS.FOCO_JOURNEY_KEYS, JSON.stringify(['pena']));
    const { container } = render(<FocusBoard language="pt-BR" todayKey={DIA} saveId={ID} onGrants={() => {}} />);
    await waitFor(() => expect((q(container, '[data-focus-start]') as HTMLButtonElement).disabled).toBe(false));
    await act(async () => { fireEvent.click(q(container, '[data-focus-start]')!); });
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
