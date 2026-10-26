// @vitest-environment jsdom
/**
 * "Gerar de novo" a aparência (rodada 5, REGISTRO §34b) — a cópia diz a verdade (sorteio pago, sem garantia, cobra antes, devolve se falhar),
 * a compra pede um 2º toque, sem saldo vai para os Créditos, e a escolha entre a atual e a nova tem as duas saídas. EN primeiro, PT ao lado.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { RegenAparencia } from './RegenAparencia';
import type { RegenAparencia as Estado } from '../../hooks/useRegenAparencia';

installDomGlobals();
afterEach(cleanup);

const base = (over: Partial<Estado> = {}): Estado => ({
  availability: 'ok', working: false, confirming: false, notice: null,
  ask: vi.fn(), cancel: vi.fn(), confirm: vi.fn(), keepCurrent: vi.fn(), useNew: vi.fn(), ...over,
});

describe('RegenAparencia', () => {
  it('conta não paga / sem 1ª geração: a seção nem existe', () => {
    const { container } = render(<RegenAparencia language="en-US" state={base({ availability: 'hidden' })} />);
    expect(container.firstChild).toBeNull();
  });

  it('EN: diz que é um novo sorteio sem garantia, o preço, que cobra antes e devolve se não sair, 1 por forma por mês', () => {
    const { container } = render(<RegenAparencia language="en-US" state={base()} />);
    const t = container.textContent ?? '';
    expect(t).toMatch(/fresh draw/i);
    expect(t).toMatch(/not guaranteed/i);
    expect(t).toMatch(/50 Credits/);
    expect(t).toMatch(/charged up front/i);
    expect(t).toMatch(/returned automatically/i);
    expect(t).toMatch(/One per form each month/i);
  });

  it('PT: o mesmo, com "Créditos"', () => {
    const { container } = render(<RegenAparencia language="pt-BR" state={base()} />);
    const t = container.textContent ?? '';
    expect(t).toMatch(/novo sorteio/i);
    expect(t).toMatch(/50 Créditos/);
    expect(t).toMatch(/cobrados antes/i);
    expect(t).toMatch(/devolvidos sozinhos/i);
    expect(t).toMatch(/Um por forma a cada mês/i);
  });

  it('o 1º toque só pede confirmação (não gera): ask; o 2º confirma', () => {
    const s = base();
    const { container, rerender } = render(<RegenAparencia language="en-US" state={s} />);
    fireEvent.click(container.querySelector('[data-regen-ask]')!);
    expect(s.ask).toHaveBeenCalledTimes(1);
    expect(s.confirm).not.toHaveBeenCalled();
    const c = base({ confirming: true });
    rerender(<RegenAparencia language="en-US" state={c} />);
    expect(container.querySelector('[data-regen-ask]')).toBeNull();
    fireEvent.click(container.querySelector('[data-regen-yes]')!);
    expect(c.confirm).toHaveBeenCalledTimes(1);
    fireEvent.click(container.querySelector('[data-regen-no]')!);
    expect(c.cancel).toHaveBeenCalledTimes(1);
  });

  it('sem saldo: o botão leva aos Créditos (ask) e não pede confirmação', () => {
    const s = base({ availability: 'no-credits' });
    const { container } = render(<RegenAparencia language="en-US" state={s} />);
    const b = container.querySelector('[data-regen-ask]') as HTMLButtonElement;
    expect(b.textContent).toMatch(/Get Credits/);
    fireEvent.click(b);
    expect(s.ask).toHaveBeenCalled();
  });

  it('mês usado e gerando: o botão fica desligado, com a frase calma', () => {
    for (const av of ['month-used', 'busy'] as const) {
      const { container, unmount } = render(<RegenAparencia language="en-US" state={base({ availability: av })} />);
      expect((container.querySelector('[data-regen-ask]') as HTMLButtonElement).disabled).toBe(true);
      unmount();
    }
  });

  it('falha: a frase só diz "de volta" quando o saldo do servidor mostra isso', () => {
    const { container, rerender } = render(<RegenAparencia language="en-US" state={base({ notice: { why: 'failed', refunded: true } })} />);
    expect(container.querySelector('[data-regen-notice]')!.textContent).toMatch(/50 Credits are back/);
    rerender(<RegenAparencia language="en-US" state={base({ notice: { why: 'failed', refunded: null } })} />);
    const t = container.querySelector('[data-regen-notice]')!.textContent ?? '';
    expect(t).not.toMatch(/are back/);
    expect(t).toMatch(/comes back on its own/);
  });

  it('a escolha: duas imagens (atual e nova) e as duas saídas', () => {
    const s = base({ availability: 'choosing' });
    const { container } = render(<RegenAparencia language="en-US" state={s} currentUrl="https://images.higgs.ai/a.png" newUrl="https://images.higgs.ai/b.png" />);
    expect(container.querySelectorAll('img')).toHaveLength(2);
    fireEvent.click(container.querySelector('[data-regen-keep]')!);
    fireEvent.click(container.querySelector('[data-regen-use]')!);
    expect(s.keepCurrent).toHaveBeenCalledTimes(1);
    expect(s.useNew).toHaveBeenCalledTimes(1);
  });

  it('copy sem cobrança nem culpa: nenhuma frase com a pessoa como sujeito de veredito', () => {
    const { container } = render(<RegenAparencia language="en-US" state={base({ notice: { why: 'month-used', refunded: false } })} />);
    expect(container.textContent).not.toMatch(/you (should|must|failed|forgot|wasted)|too late|hurry|last chance/i);
  });
});
