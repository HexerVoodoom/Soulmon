// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MercGuildSheet } from './MercGuildSheet';

const hoje = { day: 'x', ordem: 'tecelao' as const, activityId: 'sono-horario-fixo', done: false };

afterEach(cleanup);

describe('MercGuildSheet', () => {
  it('sem missão: mostra os 3 Desbravadores e escolhe um', () => {
    const onChoose = vi.fn();
    const { container } = render(<MercGuildSheet open onClose={() => {}} hoje={null} onChoose={onChoose} onConfirm={() => {}} />);
    expect(container.ownerDocument.querySelectorAll('[data-merc-ordem]').length).toBe(3);
    fireEvent.click(container.ownerDocument.querySelector('[data-merc-ordem="rompente"]')!);
    expect(onChoose).toHaveBeenCalledWith('rompente');
  });
  it('com missão: pergunta de honestidade; "Ainda não" não custa nada e "Sim" confirma', () => {
    const onConfirm = vi.fn();
    const { container } = render(<MercGuildSheet open language="en-US" onClose={() => {}} hoje={hoje} onChoose={() => {}} onConfirm={onConfirm} />);
    const d = container.ownerDocument;
    expect(screen.getByText('Did you really do it?')).toBeTruthy();
    fireEvent.click(d.querySelector('[data-merc-resp="nao"]')!);
    expect(d.querySelector('[data-merc-espera]')).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(d.querySelector('[data-merc-resp="sim"]')!);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
  it('BB: só o convite para voltar, sem escolha', () => {
    const { container } = render(<MercGuildSheet open bb onClose={() => {}} hoje={null} onChoose={() => {}} onConfirm={() => {}} />);
    const d = container.ownerDocument;
    expect(d.querySelector('[data-merc-bb]')).toBeTruthy();
    expect(d.querySelector('[data-merc-ordem]')).toBeNull();
  });
});
