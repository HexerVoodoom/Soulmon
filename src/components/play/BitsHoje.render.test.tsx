// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

vi.mock('../../contexts/GameStateContext', async (orig) => ({
  ...(await orig<typeof import('../../contexts/GameStateContext')>()),
  useGameStateOptional: () => ({ gameState: { playerDayTz: 'UTC' } }),
}));
vi.mock('../../utils/currencies', async (orig) => ({
  ...(await orig<typeof import('../../utils/currencies')>()),
  minigameBitsCategoryToday: () => 8,
}));

import { BitsHoje } from './PlaySheets';

afterEach(cleanup);

describe('BitsHoje: "Hoje: 8 [Bits] de 75"', () => {
  it.each([['pt-BR', 'Hoje: 8 '], ['en-US', 'Today: 8 ']] as const)('%s: linha curta com o ícone de Bits, sem frase longa nem nota de jogos abertos', (lang, ini) => {
    const { container } = render(<BitsHoje language={lang} earned={150} category="minigames" hideTotal />);
    const linha = container.querySelector('[data-bits-categoria]')!;
    expect(linha.textContent!.startsWith(ini)).toBe(true);
    expect(linha.querySelector('[data-bits-kind]')).not.toBeNull();
    const t = container.textContent!;
    expect(t).not.toMatch(/tipo de atividade|kind of activity|abertos|stay open|amanhã|tomorrow/);
  });
});
