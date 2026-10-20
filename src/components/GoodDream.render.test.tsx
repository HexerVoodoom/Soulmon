// @vitest-environment jsdom
/** O SONHO BOM (15/10/2026): modal curto, voz que encoraja, PT/EN, e a fiação do App paga a Honra UMA vez. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GoodDream } from './GoodDream';

afterEach(cleanup);
const montar = (language: 'pt-BR' | 'en-US', onClaim = vi.fn()) => {
  render(<GoodDream open honor={3} petStage="rookie" language={language} onClaim={onClaim} />);
  return onClaim;
};

describe('GoodDream', () => {
  it('PT: mostra o prêmio e o botão colhe', () => {
    const onClaim = montar('pt-BR');
    expect(document.querySelector('[data-good-dream]')?.textContent).toBe('Um sonho bom');
    expect(document.querySelector('[data-good-dream-honor]')?.textContent).toBe('+3 de Honra');
    fireEvent.click(screen.getByRole('button', { name: 'Que bom!' }));
    expect(onClaim).toHaveBeenCalledTimes(1);
  });
  it('EN: nada de português', () => {
    montar('en-US');
    expect(document.querySelector('[data-good-dream-honor]')?.textContent).toBe('+3 Honor');
    expect(document.body.textContent).not.toMatch(/Honra|sonho|Que bom/);
  });
  it('fechar (×) também colhe: é um presente, não uma tarefa', () => {
    const onClaim = montar('pt-BR');
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClaim).toHaveBeenCalled();
  });
});

describe('App — fiação do sonho bom', () => {
  const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8').replace(/\r\n/g, '\n');
  it('a Honra (emblems) e o reinício do ciclo saem do MESMO updater, via claimGoodDream (idempotente)', () => {
    const m = /const claimGoodDreamNow = useCallback\(([\s\S]*?)\n  \}, \[setGameState\]\);/.exec(app)?.[1] ?? '';
    expect(m).toMatch(/claimGoodDream\(prev\.nightmares/);
    expect(m).toMatch(/emblems: \(prev\.emblems \?\? 0\) \+ r\.honor/);
    expect(m).toMatch(/r\.honor <= 0\) return prev/);
  });
  it('o sonho bom ocupa o slot do pesadelo, sob o mesmo portão, e antes de qualquer luta nova', () => {
    expect(app).toMatch(/if \(hasPendingGoodDream\(gameState\.nightmares\)\) \{\s*setGoodDreamNow\(true\);/);
    expect(app.indexOf('setGoodDreamNow(true);')).toBeGreaterThan(app.indexOf('if (!nightmareGateOpen(gate))'));
  });
});
