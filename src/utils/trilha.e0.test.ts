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
 * O loop saiu em 20/10/2026 (REGISTRO §136): "livre para tocar" = `trilhaConsentida() && !trilhaPausada()`.
 * O que se mede é o estado, nunca som.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./audioBus', () => {
  let ligada = false;
  return {
    definirTrilhaLigada: (v: boolean) => { ligada = v; },
    trilhaLigada: () => ligada,
  };
});
const M_STREAM = vi.hoisted(() => ({
  nome: 'x', duracaoS: 1, pausaEntreVoltasS: 1, fadeInS: 1, origem: '', geradoEm: '',
  formatos: [{ url: '/x.webm', mime: 'audio/webm', sha256: '', bytes: 0 }],
}));
vi.mock('./sonsAssets', () => ({
  CROSSFADE_MUSICA_S: 1.2,
  // O tema e as músicas de combate (streaming) são importados de verdade por `trilha.ts`; aqui só precisam de forma.
  TEMA_DO_JOGO: M_STREAM, MUSICAS_DE_COMBATE: { combate: M_STREAM, pesadelo: M_STREAM },
}));
vi.mock('./sounds', () => ({ isMuted: () => false }));

import {
  ligarTrilha, pausarTrilha, retomarTrilha, trilhaConsentida, trilhaPausada,
  esquecerTrilha, aoGestoSonoro,
} from './trilha';

const tick = () => new Promise(r => setTimeout(r, 0));
const livre = () => trilhaConsentida() && !trilhaPausada();

beforeEach(() => { esquecerTrilha(); });

describe('E0 — a trilha obedece ao sono, à janela de descanso e ao mudo', () => {
  it('ligada por gesto, toca; dormir para; acordar retoma', async () => {
    ligarTrilha();
    await tick();
    expect(livre()).toBe(true);
    pausarTrilha('sono');
    expect(livre()).toBe(false);
    expect(trilhaPausada()).toBe(true);
    retomarTrilha('sono');
    await tick();
    expect(livre()).toBe(true);
  });

  it('furo 2: com o pet já dormindo, o primeiro gesto sonoro NÃO religa a trilha', async () => {
    pausarTrilha('sono');
    ligarTrilha();          // preferência persistida + gesto
    await tick();
    expect(livre()).toBe(false);
    aoGestoSonoro();
    await tick();
    expect(livre()).toBe(false);
    retomarTrilha('sono');  // acordou
    await tick();
    expect(livre()).toBe(true);
  });

  it('furo 3: desligar o mudo com o pet dormindo não acorda a trilha', async () => {
    ligarTrilha();
    await tick();
    pausarTrilha('sono');
    pausarTrilha('mudo');
    retomarTrilha('mudo');
    await tick();
    expect(livre()).toBe(false);
    expect(trilhaPausada()).toBe(true);
    retomarTrilha('sono');
    await tick();
    expect(livre()).toBe(true);
  });

  it('a janela de descanso é um motivo próprio: acordar dentro dela não religa', async () => {
    ligarTrilha();
    await tick();
    pausarTrilha('descanso');
    pausarTrilha('sono');
    retomarTrilha('sono');
    await tick();
    expect(livre()).toBe(false);
    retomarTrilha('descanso');
    await tick();
    expect(livre()).toBe(true);
  });

  it('retomar sem gesto prévio nesta sessão não toca nada (o gesto é o consentimento)', async () => {
    pausarTrilha('sono');
    retomarTrilha('sono');
    await tick();
    expect(livre()).toBe(false);
  });
});
