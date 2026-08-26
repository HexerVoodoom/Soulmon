// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import {
  emptySpriteLibrary, recordFailure, canManualRetry,
  SPRITE_MANUAL_RETRY_CAP, SPRITE_MANUAL_COOLDOWN_MS,
  type SpriteLibrary,
} from './spriteLibrary';
import { SpriteGenError } from './spriteGen';

// ---------------------------------------------------------------------------
// O BOTÃO "TENTAR DE NOVO" — inerte desde o commit 60b0c89b.
//
// Aquele commit criou o card de falha de credencial em `EvolutionPath.tsx` com
// a prop `onRetrySprite?: (formId: string) => void` e declarou a pendência por
// escrito: "o botão existe e é testado, mas fica inerte até a frente do App
// ligar `onRetrySprite`". A prop é OPCIONAL, então o botão sumia em silêncio —
// nada no TypeScript e nada na suíte notava a ponta solta.
//
// O caminho manual não é novo: `canManualRetry` já sabe tudo (teto vitalício da
// conta, teto por forma, teto MANUAL de 3 e cooldown de 60 s). O que faltava era
// alguém CHAMAR a geração obedecendo a ele — e chamar pela MESMA máquina do lote
// automático (`runSpriteBatch` dentro de `useSpriteGeneration`), nunca por um
// segundo caminho de geração, que é como um teto de dinheiro passa a ter duas
// contabilidades.
//
// Estes números são de DINHEIRO (`custo-geracao-sprite.md` §6) e nenhum teste
// daqui os redefine: todos vêm importados.
// ---------------------------------------------------------------------------

const requestSprite = vi.hoisted(() => vi.fn());
vi.mock('./spriteGen', async importOriginal => {
  const real = await importOriginal<typeof import('./spriteGen')>();
  return { ...real, requestSprite };
});

const FORMA = 'rookie';
const AGORA = Date.parse('2026-08-26T12:00:00Z');

/** Uma árvore mínima: o hook só precisa do prompt da forma. */
const stages = [
  { stage: FORMA, branch: 'harmonia', name: 'Rookie', imagePrompt: 'um bicho' },
];

function montar(over: { library?: SpriteLibrary; stages?: unknown } = {}) {
  let lib: SpriteLibrary = over.library ?? emptySpriteLibrary();
  const updateLibrary = (fn: (p: SpriteLibrary) => SpriteLibrary) => { lib = fn(lib); };
  const hook = renderHook(() => useSpriteGeneration({
    trigger: {
      evolutionStage: FORMA,
      currentBranch: 'data',
      unlockedEvolutions: [FORMA],
      perfectDays: 0,
      points: { virus: 0, data: 0, vaccine: 0 },
      reading: { confident: false, pattern: { id: 'constante' } },
    } as never,
    library: lib,
    updateLibrary,
    stages: (over.stages === undefined ? stages : over.stages) as never,
    dayKey: '2026-08-26',
    // `busy` desligado e `enabled` desligado: o LOTE AUTOMÁTICO fica fora do
    // caminho de propósito, para o que se mede aqui ser só o gesto do jogador.
    busy: false,
    enabled: false,
  }));
  return { hook, acervo: () => lib };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useSpriteGeneration: any;

beforeEach(async () => {
  requestSprite.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(AGORA);
  ({ useSpriteGeneration } = await import('../hooks/useSpriteGeneration'));
});
afterEach(() => { vi.useRealTimers(); });

/** Deixa o `requestIdleCallback`/`setTimeout` do `whenIdle` correr. */
async function ocioso() {
  await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
}

/** Uma falha de credencial (401) gravada há `ha` ms — o estado do card. */
function comFalhaAuth(ha: number, manuais = 0): SpriteLibrary {
  let lib = recordFailure(emptySpriteLibrary(), FORMA, 'auth', { at: AGORA - ha - 1 });
  for (let i = 0; i < manuais; i++) {
    lib = recordFailure(lib, FORMA, 'auth', { manual: true, at: AGORA - ha });
  }
  return lib;
}

describe('retentativa manual — o botão passa a fazer alguma coisa', () => {
  it('o hook EXPÕE um `retry` (sem ele o `onRetrySprite` não tem o que chamar)', () => {
    const { hook } = montar();
    expect(typeof hook.result.current.retry).toBe('function');
  });

  it('com o cooldown vencido, o gesto chama a geração UMA vez e grava o sprite', async () => {
    requestSprite.mockResolvedValue({ image: 'data:img', provider: 'teste' });
    const { hook, acervo } = montar({ library: comFalhaAuth(SPRITE_MANUAL_COOLDOWN_MS) });
    act(() => { hook.result.current.retry(FORMA); });
    await ocioso();
    expect(requestSprite).toHaveBeenCalledTimes(1);
    expect(acervo().sprites[FORMA]?.url).toBe('data:img');
  });

  it('DENTRO do cooldown de 60 s não gasta chamada nenhuma', async () => {
    const lib = comFalhaAuth(SPRITE_MANUAL_COOLDOWN_MS - 5_000);
    expect(canManualRetry(lib, FORMA, AGORA)).toBe(false);
    const { hook } = montar({ library: lib });
    act(() => { hook.result.current.retry(FORMA); });
    await ocioso();
    expect(requestSprite).not.toHaveBeenCalled();
  });

  it(`o teto manual de ${SPRITE_MANUAL_RETRY_CAP} fecha a porta`, async () => {
    const lib = comFalhaAuth(SPRITE_MANUAL_COOLDOWN_MS, SPRITE_MANUAL_RETRY_CAP);
    expect(canManualRetry(lib, FORMA, AGORA)).toBe(false);
    const { hook } = montar({ library: lib });
    act(() => { hook.result.current.retry(FORMA); });
    await ocioso();
    expect(requestSprite).not.toHaveBeenCalled();
  });

  it('a falha do gesto conta como MANUAL — senão o teto de 3 nunca chega', async () => {
    requestSprite.mockRejectedValue(new SpriteGenError('auth', 401, 'sem credencial'));
    const { hook, acervo } = montar({ library: comFalhaAuth(SPRITE_MANUAL_COOLDOWN_MS) });
    act(() => { hook.result.current.retry(FORMA); });
    // 401 tem orçamento de UMA retentativa automática (recuo de 60 s).
    await act(async () => { await vi.advanceTimersByTimeAsync(120_000); });
    expect(acervo().failures[FORMA]?.manual).toBe(1);
  });

  it('dois toques seguidos não viram duas gerações (um lote por vez, serial)', async () => {
    requestSprite.mockResolvedValue({ image: 'data:img', provider: 'teste' });
    const { hook } = montar({ library: comFalhaAuth(SPRITE_MANUAL_COOLDOWN_MS) });
    act(() => { hook.result.current.retry(FORMA); hook.result.current.retry(FORMA); });
    await ocioso();
    expect(requestSprite).toHaveBeenCalledTimes(1);
  });

  it('forma sem prompt na árvore não vira chamada de servidor', async () => {
    const { hook } = montar({ library: comFalhaAuth(SPRITE_MANUAL_COOLDOWN_MS), stages: [] });
    act(() => { hook.result.current.retry(FORMA); });
    await ocioso();
    expect(requestSprite).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// A PONTA SOLTA em si. `onRetrySprite` é OPCIONAL: sem este guard, apagar a
// linha do `App.tsx` compila, a suíte fica verde e o botão volta a sumir da
// tela sem que ninguém saiba — que é literalmente o defeito que se conserta
// aqui.
// ---------------------------------------------------------------------------
describe('App.tsx liga o botão no caminho manual', () => {
  const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
  const evolution = app.slice(app.indexOf('<EvolutionPath'), app.indexOf('</Suspense>', app.indexOf('<EvolutionPath')));

  it('o `<EvolutionPath>` recebe `onRetrySprite`', () => {
    expect(evolution).toMatch(/onRetrySprite=\{/);
  });

  it('a ligação vai para o `spriteGen`, e não para uma segunda geração no App', () => {
    expect(app).toMatch(/spriteGen\.retry\(/);
    // Nenhum `requestSprite`/`runSpriteBatch` direto no App: se aparecer, o
    // segundo caminho de geração nasceu e o teto passa a ter duas contas.
    expect(app).not.toMatch(/\brequestSprite\b|\brunSpriteBatch\b/);
  });
});
