/**
 * REGISTRO 13.19 (canvas Onboarding-oráculo §31): o caminho GRÁTIS vê o
 * REVEAL DEMO — a leitura de quem a pessoa seria, feita das 6 respostas do
 * ritual — antes de escolher o personagem.
 *
 * ⚠️ 01/10/2026: as 6 perguntas (e os 20 itens) passaram a vir ANTES da
 * escolha grátis/próprio, para todo mundo (`metasOnboarding.ts`). Aqui sobrou
 * só a espera: o toque em "Start now" gera a leitura por
 * `generateOracleAsync` (famílias por `import()` dinâmico), e o reveal demo
 * aparece quando o import assenta.
 */
import { act, fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';

/** Depois do toque em "Start now": espera a leitura demo e para no reveal. */
export async function esperarRevealDemo(): Promise<void> {
  for (let i = 0; i < 50; i++) {
    await act(async () => {
      await vi.dynamicImportSettled();
      if (vi.isFakeTimers()) await vi.advanceTimersByTimeAsync(10);
      else await new Promise(r => setTimeout(r, 10));
    });
    if (document.querySelector('[data-nudge]')) return;
  }
  throw new Error('reveal demo: a leitura não apareceu');
}

/** Do reveal demo à escolha do personagem pela saída que não custa (13.1). */
export async function atravessarRevealDemo(pt = false): Promise<void> {
  await esperarRevealDemo();
  fireEvent.click(screen.getByRole('button', {
    name: pt ? 'Continuar com um personagem demo' : 'Continue with a demo character',
  }));
}
