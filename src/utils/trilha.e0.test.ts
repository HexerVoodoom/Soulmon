/**
 * E0 (`docs/SOM.md` §2.1, S13 — peça extraída): dormindo, na janela de descanso
 * ou no mudo, a trilha NÃO toca — e os motivos são independentes.
 *
 * Achado S-1 da QA rodada 2 (22/09/2026): a pausa era um booleano só e vivia
 * dentro do gesto manual de dormir. Três furos, cada um com teste aqui:
 *  1. o sono AUTOMÁTICO trocava `isSleeping` sem pausar (o App agora pausa num
 *     `useEffect([isSleeping])` — este arquivo testa o módulo; a fiação do App
 *     é `grep -n "pausarTrilha('sono')" src/App.tsx`);
 *  2. o primeiro gesto sonoro de uma sessão aberta com o pet dormindo religava
 *     a trilha (`comecar()` não sabia de sono);
 *  3. desligar o mudo com o pet dormindo apagava a pausa do sono.
 *
 * O motor de áudio é FALSO (só o bastante para `comecar()` chegar a `start`):
 * o que se mede é `trilhaTocando()`, nunca som.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./audioBus', () => {
  const gain = () => ({ gain: { value: 1 }, connect: () => {}, disconnect: () => {} });
  const ctx = {
    state: 'running',
    currentTime: 0,
    resume: () => Promise.resolve(),
    createGain: gain,
    createBufferSource: () => ({
      buffer: null, loop: false, loopStart: 0, loopEnd: 0,
      connect: () => {}, disconnect: () => {}, start: () => {}, stop: () => {},
    }),
  };
  let ligada = false;
  return {
    garantirBarramento: () => ({ ctx, busTrilha: gain() }),
    definirTrilhaLigada: (v: boolean) => { ligada = v; },
    trilhaLigada: () => ligada,
  };
});
vi.mock('./sonsAssets', () => ({
  CAMADAS_DA_TRILHA: { base: { duracaoS: 10 }, ritmo: { duracaoS: 10 } },
  carregarAsset: async () => ({ duration: 11 }),
}));
vi.mock('./sounds', () => ({ isMuted: () => false }));

import {
  ligarTrilha, pausarTrilha, retomarTrilha, trilhaTocando, trilhaPausada,
  esquecerTrilha, aoGestoSonoro,
} from './trilha';

const tick = () => new Promise(r => setTimeout(r, 0));

beforeEach(() => { esquecerTrilha(); });

describe('E0 — a trilha obedece ao sono, à janela de descanso e ao mudo', () => {
  it('ligada por gesto, toca; dormir para; acordar retoma', async () => {
    ligarTrilha();
    await tick();
    expect(trilhaTocando()).toBe(true);
    pausarTrilha('sono');
    expect(trilhaTocando()).toBe(false);
    expect(trilhaPausada()).toBe(true);
    retomarTrilha('sono');
    await tick();
    expect(trilhaTocando()).toBe(true);
  });

  it('furo 2: com o pet já dormindo, o primeiro gesto sonoro NÃO religa a trilha', async () => {
    pausarTrilha('sono');
    ligarTrilha();          // preferência persistida + gesto
    await tick();
    expect(trilhaTocando()).toBe(false);
    aoGestoSonoro();
    await tick();
    expect(trilhaTocando()).toBe(false);
    retomarTrilha('sono');  // acordou
    await tick();
    expect(trilhaTocando()).toBe(true);
  });

  it('furo 3: desligar o mudo com o pet dormindo não acorda a trilha', async () => {
    ligarTrilha();
    await tick();
    pausarTrilha('sono');
    pausarTrilha('mudo');
    retomarTrilha('mudo');
    await tick();
    expect(trilhaTocando()).toBe(false);
    expect(trilhaPausada()).toBe(true);
    retomarTrilha('sono');
    await tick();
    expect(trilhaTocando()).toBe(true);
  });

  it('a janela de descanso é um motivo próprio: acordar dentro dela não religa', async () => {
    ligarTrilha();
    await tick();
    pausarTrilha('descanso');
    pausarTrilha('sono');
    retomarTrilha('sono');
    await tick();
    expect(trilhaTocando()).toBe(false);
    retomarTrilha('descanso');
    await tick();
    expect(trilhaTocando()).toBe(true);
  });

  it('retomar sem gesto prévio nesta sessão não toca nada (o gesto é o consentimento)', async () => {
    pausarTrilha('sono');
    retomarTrilha('sono');
    await tick();
    expect(trilhaTocando()).toBe(false);
  });
});
