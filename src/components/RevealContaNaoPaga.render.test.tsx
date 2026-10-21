// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { RevealContaNaoPaga } from './RevealContaNaoPaga';

afterEach(cleanup);

/** QA (dono, 21/10/2026): geração recusada por CONTA NÃO PAGA não deixa o cristal mudo. */
describe('RevealContaNaoPaga', () => {
  it('diz o porquê e oferece o desbloqueio, em EN e PT, sem culpa nem cobrança', () => {
    for (const [isPt, texto, botao] of [[false, /needs the full account/, 'Unlock the account'], [true, /pede a conta completa/, 'Desbloquear a conta']] as const) {
      const onDesbloquear = vi.fn();
      const { container, unmount } = render(<RevealContaNaoPaga isPt={isPt} onDesbloquear={onDesbloquear} />);
      expect(container.textContent).toMatch(texto);
      expect(container.textContent).not.toMatch(/erro|falhou|error|failed|still being made|ainda está sendo feito/i);
      const b = container.querySelector('[data-reveal-desbloquear]') as HTMLElement;
      expect(b.textContent).toBe(botao);
      fireEvent.click(b);
      expect(onDesbloquear).toHaveBeenCalledTimes(1);
      expect(container.querySelector('[role="status"]')).toBeTruthy();
      unmount();
    }
  });
});

describe('o reveal do onboarding liga o aviso à recusa 402 (contrato de ligação)', () => {
  const src = readFileSync('src/components/SoulmonOnboarding.tsx', 'utf8');
  it("o catch da geração marca a conta não paga só para a razão 'paid-required'", () => {
    expect(src).toContain("(err as { reason?: string } | null)?.reason === 'paid-required') setRevealContaNaoPaga(true)");
  });
  it('o aviso aparece no lugar da frase "ainda está sendo feito" e o botão abre o MESMO modal de compra (reason "ovo")', () => {
    expect(src).toContain('{!revealSprite && !revealEsperando && revealContaNaoPaga && (');
    expect(src).toContain('<RevealContaNaoPaga isPt={isPt} onDesbloquear={() => setRevealCompraAberta(true)} />');
    expect(src).toContain('{!revealSprite && !revealEsperando && !revealContaNaoPaga && (');
    expect(src).toMatch(/<UnlockAccountModal\s+language=\{lang\}\s+reason="ovo"\s+onUnlocked=\{\(\) => \{ setRevealCompraAberta\(false\); setRevealContaNaoPaga\(false\)/);
  });
  it('depois de desbloquear, a geração do reveal é pedida de novo', () => {
    expect(src).toContain('if (result) iniciarCerimoniaDoReveal(result)');
  });
});
