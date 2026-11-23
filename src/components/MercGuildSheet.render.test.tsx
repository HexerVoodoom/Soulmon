// @vitest-environment jsdom
/** A folha do líder (dono, 05/11/2026): primeiro o que é a missão; pegar a missão ou decidir depois; uma por dia, de um dos três. */
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
    const t = sortearMerc(DIA, 'rompente')!;
    expect(document.querySelector('[data-merc-beneficio]')!.textContent).toBe(t.benefit.en);
    const botoes = [...document.querySelectorAll('button')].map(b => b.textContent);
    expect(botoes).toContain('Take the mission');
    expect(botoes).toContain('Decide later');
    fireEvent.click(document.querySelector('[data-merc-aceito]')!);
    expect(onAccept).toHaveBeenCalledWith('rompente');
  });

  it('"Decidir depois" chama onThink e não aceita', () => {
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
  it('PT: botões "Pegar missão" e "Decidir depois" e o benefício em português', () => {
    render(<MercGuildSheet {...base} language="pt-BR" ordem="filtrador" hoje={null} />);
    const botoes = [...document.querySelectorAll('button')].map(b => b.textContent);
    expect(botoes).toContain('Pegar missão');
    expect(botoes).toContain('Decidir depois');
    expect(document.querySelector('[data-merc-beneficio]')!.textContent).toBe(sortearMerc(DIA, 'filtrador')!.benefit.pt);
  });
  it('save antigo com hábito pendente: mostra a tarefa nova de um dia, nunca "por semana"', () => {
    render(<MercGuildSheet {...base} ordem="rompente" hoje={{ day: DIA, ordem: 'rompente', activityId: 'hidratacao-agua', done: false }} />);
    const t = sortearMerc(DIA, 'rompente')!;
    expect(document.querySelector('[data-merc-atividade]')!.textContent).toContain(t.target.en);
    expect(document.querySelector('[data-merc-atividade]')!.textContent).not.toMatch(/week/i);
  });
});
