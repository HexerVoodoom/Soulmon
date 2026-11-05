// @vitest-environment jsdom
/** A folha do líder (dono, 05/11/2026): primeiro o que é a missão; aceitar ou pensar; uma por dia, de um dos três. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MercGuildSheet } from './MercGuildSheet';
import { sortearMerc } from '../utils/mercMission';

const DIA = '2026-11-05';
const base = { onClose: () => {}, dayKey: DIA, language: 'en-US' as const, onAccept: () => {}, onThink: () => {}, onConfirm: () => {} };

describe('MercGuildSheet', () => {
  afterEach(cleanup);

  it('mostra a missão ANTES de aceitar, com o NPC em cima, e aceitar grava a Ordem do líder', () => {
    const onAccept = vi.fn();
    render(<MercGuildSheet {...base} ordem="rompente" hoje={null} onAccept={onAccept} />);
    expect(document.querySelector('[data-area-sheet-npc]')).toBeTruthy();
    expect(document.querySelector('[data-merc-atividade]')!.textContent).toContain(sortearMerc(DIA, 'rompente')!.name.en);
    fireEvent.click(document.querySelector('[data-merc-aceito]')!);
    expect(onAccept).toHaveBeenCalledWith('rompente');
  });

  it('"Vou pensar" chama onThink e não aceita', () => {
    const onAccept = vi.fn(); const onThink = vi.fn();
    render(<MercGuildSheet {...base} ordem="tecelao" hoje={null} onAccept={onAccept} onThink={onThink} />);
    fireEvent.click(document.querySelector('[data-merc-pensar]')!);
    expect(onThink).toHaveBeenCalledTimes(1);
    expect(onAccept).not.toHaveBeenCalled();
  });

  it('com a missão aceita, pergunta se fez; "sim" confirma', () => {
    const item = sortearMerc(DIA, 'filtrador')!;
    const onConfirm = vi.fn();
    render(<MercGuildSheet {...base} ordem="filtrador" onConfirm={onConfirm} hoje={{ day: DIA, ordem: 'filtrador', activityId: item.id, done: false }} />);
    fireEvent.click(document.querySelector('[data-merc-resp="sim"]')!);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('os outros dois líderes não oferecem nada: uma por dia', () => {
    const item = sortearMerc(DIA, 'filtrador')!;
    render(<MercGuildSheet {...base} ordem="rompente" hoje={{ day: DIA, ordem: 'filtrador', activityId: item.id, done: false }} />);
    expect(document.querySelector('[data-merc-aceito]')).toBeNull();
    expect(document.querySelector('[data-merc-uma-por-dia]')).toBeTruthy();
  });

  it('o BB fica de fora', () => {
    render(<MercGuildSheet {...base} ordem="rompente" bb hoje={null} />);
    expect(document.querySelector('[data-merc-aceito]')).toBeNull();
  });
});
