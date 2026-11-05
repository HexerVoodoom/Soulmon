// @vitest-environment jsdom
/** A cena do Passeio em tela cheia (05/11/2026): cenário → "espera, tem algo ali" → desliza → descoberta → OK → volta → fecha. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, cleanup, fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DailyReportModal } from './DailyReportModal';
import { ADVENTURE_CATALOG } from '../utils/adventure';
import { ENEMY_ROSTER } from '../utils/enemyRoster';

afterEach(() => { cleanup(); vi.useRealTimers(); });

const rel = { date: 'Tue Nov 04 2026', done: 4, total: 6, required: 6, heartsLost: 0, wasPerfect: false, perfectDays: 3, degenerated: false } as never;
const stroll = { missionTitle: 'Observar o céu', destination: 'Campina' };

function abrir(onDiscover = vi.fn(), over: Record<string, unknown> = {}) {
  const onClose = vi.fn();
  renderWithCss(
    <DailyReportModal report={rel} adventure={ADVENTURE_CATALOG[0]} stroll={stroll} spriteUrl="/x.png" onClose={onClose} language="pt-BR"
      strollScene={{ regionId: 'campina', bgId: 'bg-campina', bestiary: [], onDiscover }} {...over} />,
  );
  fireEvent.click(screen.getByRole('button', { name: /continuar|continue/i })); // ontem → aventura
  return { onDiscover, onClose };
}
const q = (s: string) => document.querySelector<HTMLElement>(s)!;

describe('cena do Passeio', () => {
  it('com Passeio, o passo da aventura vira a cena em tela cheia, com o texto em cima e o Soulmon do jogador', () => {
    abrir();
    const cena = q('[data-stroll-scene]');
    expect(cena.style.position).toBe('fixed');
    expect(q('[data-scene-card="intro"]').textContent).toMatch(/Da aventura de ontem/);
    expect(q('[data-scene-card="intro"]').textContent).toMatch(/Observar o céu/);
    expect(q('[data-scene-pet="player"]')).toBeTruthy();
    expect(q('[data-scene-pet="found"]')).toBeTruthy();
  });
  it('o fluxo todo: espera → desliza → descoberta → OK grava UMA vez → volta → fecha', () => {
    vi.useFakeTimers();
    const { onDiscover, onClose } = abrir();
    fireEvent.click(q('[data-scene-next="intro"]'));
    expect(q('[data-scene-card="notice"]').textContent).toMatch(/Espera… tem alguma coisa ali/);
    fireEvent.click(q('[data-scene-next="notice"]'));
    expect(q('[data-stroll-scene]').getAttribute('data-phase')).toBe('pan-out');
    expect(onDiscover).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1600); });
    expect(q('[data-stroll-scene]').getAttribute('data-phase')).toBe('found');
    expect(q('[data-scene-card="found"]').textContent).toMatch(/Um novo Soulmon foi descoberto/);
    const nome = q('[data-scene-found-name]').textContent!;
    expect(ENEMY_ROSTER.some(e => e.name === nome)).toBe(true);
    fireEvent.click(q('[data-scene-next="found"]'));
    expect(onDiscover).toHaveBeenCalledTimes(1);
    expect(ENEMY_ROSTER.some(e => e.key === onDiscover.mock.calls[0][0] && e.name === nome)).toBe(true);
    act(() => { vi.advanceTimersByTime(1600); });
    expect(q('[data-stroll-scene]').getAttribute('data-phase')).toBe('back');
    fireEvent.click(q('[data-scene-next="back"]'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('sem Passeio no dia, é a folha de sempre (nada de cena)', () => {
    abrir(vi.fn(), { stroll: null });
    expect(document.querySelector('[data-stroll-scene]')).toBeNull();
  });
  it('Drive completo: sem descoberta, a cena só mostra o passeio e fecha', () => {
    const { onClose } = abrir(vi.fn(), { strollScene: { regionId: 'campina', bgId: 'bg-campina', bestiary: ENEMY_ROSTER.map(e => e.key), onDiscover: vi.fn() } });
    expect(document.querySelector('[data-scene-pet="found"]')).toBeNull();
    fireEvent.click(q('[data-scene-next="intro"]'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('a cena nasce muda: nenhuma chamada de som no componente', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(`${__dirname}/StrollScene.tsx`, 'utf8');
    expect(src).not.toMatch(/\bplay[A-Z]\w+\(|sounds'|audioBus/);
  });
});
