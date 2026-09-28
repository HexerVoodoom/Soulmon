/**
 * REGISTRO 13.19 (canvas Onboarding-oráculo §31): o caminho GRÁTIS passou a
 * responder as 6 perguntas do ritual e a ver o REVEAL DEMO antes de escolher
 * o personagem. Todo teste que antes clicava em "Start now" e caía direto em
 * "Choose your Soulmon" atravessa isto — num lugar só, para o dia em que o
 * número de perguntas mudar não virar seis testes quebrados.
 *
 * Exige `vi.useFakeTimers()` no chamador: cada opção avança em 180 ms.
 * Assíncrono desde a Fase 2 do Oráculo: a leitura demo nasce de
 * `generateOracleAsync` (famílias por `import()` dinâmico), então a última
 * resposta espera o import assentar antes de o reveal aparecer.
 */
import { act, fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ORACLE_QUESTIONS } from '../utils/oracle';

/** Responde as 6 perguntas (sempre a 1ª opção) e para no reveal demo. */
export async function responderRitualDemo(): Promise<void> {
  for (let i = 0; i < ORACLE_QUESTIONS.length; i++) {
    const opcao = document.querySelector('button[aria-pressed]');
    if (!opcao) throw new Error(`ritual demo: pergunta ${i + 1} sem opções na tela`);
    fireEvent.click(opcao);
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
  }
  await act(async () => { await vi.dynamicImportSettled(); });
}

/** Do reveal demo à escolha do personagem pela saída que não custa (13.1). */
export async function atravessarRevealDemo(pt = false): Promise<void> {
  await responderRitualDemo();
  fireEvent.click(screen.getByRole('button', {
    name: pt ? 'Continuar com um personagem demo' : 'Continue with a demo character',
  }));
}
