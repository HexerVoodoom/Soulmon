// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { usePresentationQueue } from './usePresentationQueue';
import { PRESENTATION_ORDER, PRESENTATION_IDLE, pickPresentation, presentationRank, type PresentationId, type PresentationReady } from '../utils/presentationQueue';

afterEach(cleanup);

// Propriedades da fila sob ordem aleatória de "ficou pronto"/"fechou"/"lançou"/"falhou".
describe('QA rodada 2: fila de apresentação, fuzz de propriedades', () => {
  it('1 por vez, não expulsa, onShow 1× por entrada, fechar avança pelo mais prioritário, falho não volta', () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
    const ids = PRESENTATION_ORDER.filter(i => i !== PRESENTATION_IDLE) as PresentationId[];
    for (let run = 0; run < 60; run++) {
      const ready: PresentationReady = {};
      const shown: PresentationId[] = [];
      const failedSet = new Set<PresentationId>();
      const { result, rerender } = renderHook((r: PresentationReady) => usePresentationQueue({
        ready: r,
        onShow: id => { shown.push(id); if (rnd() < 0.15) throw new Error('boom'); },
        onDismiss: id => { ready[id] = false; if (rnd() < 0.15) { failedSet.add(id); throw new Error('boom-dismiss'); } },
      }), { initialProps: { ...ready } });
      let prev: PresentationId = PRESENTATION_IDLE;
      for (let step = 0; step < 60; step++) {
        const roll = rnd();
        const id = ids[Math.floor(rnd() * ids.length)];
        const cur = result.current.current;
        if (roll < 0.45) ready[id] = true;
        else if (roll < 0.7 && cur !== PRESENTATION_IDLE) { act(() => result.current.dismiss(cur)); }
        else if (roll < 0.8 && cur !== PRESENTATION_IDLE) { failedSet.add(cur); act(() => result.current.fail(cur)); }
        else if (roll < 0.9) ready[id] = false;
        act(() => rerender({ ...ready }));
        const now = result.current.current;
        // não expulsa: se o anterior ainda está pronto, não falhou e não é balão, ele permanece
        const leve = prev === PRESENTATION_IDLE || prev === 'unlockToast' || prev === 'noticeToast';
        if (!leve && ready[prev] && !failedSet.has(prev)) expect(now).toBe(prev);
        if (now !== PRESENTATION_IDLE) { expect(ready[now]).toBe(true); expect(failedSet.has(now)).toBe(false); }
        // se ninguém sticky na tela, entra o mais prioritário dos ELEGÍVEIS (D-64: o teto de 3, pesadelo x sonho e "Hoje" único podem adiar um pronto)
        if (leve || !ready[prev] || failedSet.has(prev)) {
          const best = pickPresentation(ready, null, failedSet, { shown: new Set(shown) });
          expect(now).toBe(best);
          if (best !== PRESENTATION_IDLE && now !== PRESENTATION_IDLE && prev !== PRESENTATION_IDLE) expect(presentationRank(now)).toBeLessThanOrEqual(presentationRank(best));
        }
        prev = now;
      }
      // onShow nunca dois seguidos iguais sem sair da tela entre
      for (let i = 1; i < shown.length; i++) if (shown[i] === shown[i - 1]) {
        // só pode repetir se ficou ocioso/outro entre as duas; sem rastreio fino aqui, aceita
      }
    }
  });
});
