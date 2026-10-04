// @vitest-environment jsdom
/**
 * QA3 — o anel corria no relógio de PAREDE: abrir "Sair?" (que pausa a luta) com o anel na
 * tela deixava o anel vencer sozinho (nota `ruim`) e o especial se perdia. Pausado, o anel congela.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import { SpecialRing } from './PveMechanics';
import { ringSpec } from '../../utils/energia';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('SpecialRing pausado', () => {
  it('não vence enquanto pausado e o toque depois mede só o tempo de luta', () => {
    const spec = ringSpec(4, 0);
    let t = 1000;
    const now = () => t;
    const onGrade = vi.fn();
    const el = (p: boolean) => <SpecialRing spec={spec} x={120} y={140} size={150} onGrade={onGrade} label="Golpear" now={now} paused={p} />;
    const avanca = (ms: number) => { act(() => { t += ms; vi.advanceTimersByTime(ms); }); };
    const r = render(el(false));
    avanca(spec.targetMs - 20);
    r.rerender(el(true));
    avanca(spec.ms + 5000); // muito além do fim do anel
    expect(onGrade).not.toHaveBeenCalled();
    r.rerender(el(false));
    avanca(20); // chega no alvo em tempo de luta
    fireEvent.pointerDown(document.body);
    expect(onGrade).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls[0][0]).toBe('otimo');
  });
});
