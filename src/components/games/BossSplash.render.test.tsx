// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BossSplash } from './BossSplash';
import { Match3Game } from '../Match3Game';
import { SoulBarrage } from '../SoulBarrage';
import { isBossMatch } from '../../utils/match3Boss';

afterEach(() => cleanup());
const NORMAL_SEED = [1, 2, 3, 4, 5, 6, 7, 8].find(s => !isBossMatch(s))!;

describe('BossSplash', () => {
  it('mostra monstro e cartões; toque em qualquer lugar pula', () => {
    const done = vi.fn();
    render(<BossSplash monster="Corallume" art="x.png" kicker="Boss" title="T" cards={[{ id: 'a', name: 'Regra A', line: 'linha' }]} okLabel="OK" tapHint="tap" onDone={done} />);
    expect(screen.getByText('Corallume')).toBeTruthy();
    expect(document.querySelectorAll('[data-m3-boss-rule-card]')).toHaveLength(1);
    fireEvent.click(screen.getByRole('dialog'));
    expect(done).toHaveBeenCalledTimes(1);
  });
  it('sem cartões (boss especial da Chuva) não há lista de regras', () => {
    render(<BossSplash monster="M" art="" kicker="k" title="T" okLabel="OK" tapHint="t" onDone={() => {}} />);
    expect(document.querySelector('[data-m3-boss-rules]')).toBeNull();
  });
  it('Fusion: o splash só aparece na partida de boss', () => {
    render(<Match3Game language="en-US" evolutionStage="rookie" onEarnPoints={() => {}} onExit={() => {}} seed={NORMAL_SEED} rankSaveId="t" initialMode="pve" />);
    expect(document.querySelector('[data-boss-splash]')).toBeNull();
    cleanup();
    render(<Match3Game language="en-US" evolutionStage="rookie" onEarnPoints={() => {}} onExit={() => {}} seed={74} rankSaveId="t" initialMode="pve" />);
    expect(document.querySelector('[data-boss-splash]')).not.toBeNull();
    expect(document.querySelectorAll('[data-m3-boss-rule-card]')).toHaveLength(3);
  });
  it('Fusion: sem escolher o modo (tutorial, Masmorra) o boss nunca nasce, nem com semente de boss', () => {
    render(<Match3Game language="en-US" evolutionStage="rookie" onEarnPoints={() => {}} onExit={() => {}} seed={74} />);
    expect(isBossMatch(74)).toBe(true);
    expect(document.querySelector('[data-boss-splash]')).toBeNull();
  });
  it('sem o retrato 9:16 o splash cai no sprite; com ele, cobre a tela', () => {
    render(<BossSplash monster="M" art="s.png" okLabel="OK" kicker="k" title="T" tapHint="t" onDone={() => {}} />);
    expect(document.querySelector('[data-boss-splash]')!.getAttribute('data-boss-splash-art-kind')).toBe('sprite');
    cleanup();
    render(<BossSplash monster="M" art="s.png" portrait="p.webp" okLabel="OK" kicker="k" title="T" tapHint="t" onDone={() => {}} />);
    expect(document.querySelector('[data-boss-splash]')!.getAttribute('data-boss-splash-art-kind')).toBe('portrait');
  });
  it('Chuva de Almas: sem splash antes do boss especial', () => {
    render(<SoulBarrage language="en-US" evolutionStage="rookie" onEarnPoints={() => {}} onExit={() => {}} />);
    expect(document.querySelector('[data-boss-splash]')).toBeNull();
  });
});
