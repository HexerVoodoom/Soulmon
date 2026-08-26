// @vitest-environment jsdom
/**
 * R-1, R-3 e R-4 no PROVIDER — o lado que o preparo da fatia 1 chamou de
 * "perda silenciosa" (§A.3.3) e de "inanição do debounce" (§A.4).
 *
 * Hoje `GameStateContext.tsx:1050` chama `cloudSave(saveId!, gameState)` **sem
 * `await`, sem `.then`, sem `.catch`**. O `false` é jogado fora. Não existe
 * retry, não existe fila, não existe aviso: o jogador vê "não sincronizado" e
 * mais nada acontece até a próxima mutação. Um 403 permanente (o cenário que a
 * fatia 1 cria — ver `cloudSave.reconcile.test.ts`) é invisível.
 *
 * Estes casos travam três coisas no provider:
 *
 * **R-3 — o retorno é LIDO.** Falha que a política manda avisar chega ao
 * jogador; falha transitória não vira ruído.
 *
 * **R-1 — o caminho de erro NÃO passa por `setGameState`.** Este é o requisito
 * mais sutil e o mais caro de errar: o efeito de save depende de `[gameState]`
 * e devolve `clearTimeout`. Se o tratamento de um 409 tocasse o estado, ele
 * reiniciaria o debounce, que reagendaria o POST que causou o 409 — e **cada
 * gesto do jogador aceleraria o ciclo**. O 409 ainda não existe (o `revision` é
 * da fatia 1); o que se trava aqui é que o CAMINHO por onde ele vai chegar já
 * nasce fora do `setGameState`.
 *
 * **R-4 — invariante contra inanição.** O debounce é de CAUDA e reinicia a cada
 * mutação: um fluxo sustentado de mutações a menos de 3 s de distância nunca
 * dispara o POST, e a nuvem para de receber em silêncio, indefinidamente. Hoje
 * isso está fechado **por acidente** — o único gesto com cadência de ~2 s é o
 * carinho, e ele tem teto de 2 concessões por dia (`careRules.ts:60-61`). No dia
 * em que esse teto mudar (é discussão viva de produto), o cloud save para sem
 * ninguém ver. O teto de espera fecha isso por DESENHO.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import {
  GameStateProvider,
  useGameState,
  CLOUD_SAVE_DEBOUNCE_MS,
  CLOUD_SAVE_MAX_WAIT_MS,
} from './GameStateContext';

const { chamadas, resultado, avisos } = vi.hoisted(() => ({
  chamadas: [] as Array<{ id: string; state: Record<string, unknown> }>,
  resultado: { atual: { ok: true } as Record<string, unknown> },
  avisos: [] as string[],
}));

vi.mock('../utils/cloudSave', () => ({
  cloudSave: () => Promise.resolve({ ok: true }),
  cloudSaveComRetry: (id: string, state: Record<string, unknown>) => {
    chamadas.push({ id, state });
    return Promise.resolve(resultado.atual);
  },
  emailToSaveId: async () => 'x',
  adoptCloudSave: () => 'ok',
}));
vi.mock('../utils/community', () => ({ pushProfile: () => Promise.resolve() }));
vi.mock('sonner', () => ({
  toast: Object.assign(
    (m: string) => { avisos.push(m); },
    {
      warning: (m: string) => { avisos.push(m); },
      error: (m: string) => { avisos.push(m); },
      success: (m: string) => { avisos.push(m); },
    },
  ),
}));

let mutacoesDeEstado = 0;

function Espiao() {
  const { gameState, setGameState } = useGameState();
  mutacoesDeEstado += 1;
  return (
    <>
      <span data-testid="pontos">{gameState.gamePoints}</span>
      <button onClick={() => setGameState(s => ({ ...s, gamePoints: (s.gamePoints ?? 0) + 1 }))}>mais</button>
    </>
  );
}

function abrir() {
  render(<GameStateProvider><Espiao /></GameStateProvider>);
}

/** Um gesto do jogador: muda o estado e deixa o React assentar. */
function gesto() {
  act(() => { screen.getByText('mais').click(); });
}

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  chamadas.length = 0;
  avisos.length = 0;
  mutacoesDeEstado = 0;
  resultado.atual = { ok: true };
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────── R-3: o retorno é LIDO

describe('R-3 — a falha do cloud save deixa de ser silenciosa', () => {
  it('falha que a política manda avisar chega ao jogador', async () => {
    abrir();
    resultado.atual = { ok: false, kind: 'identity', status: 403, retentavel: false, avisaJogador: true };
    gesto();
    await act(async () => { await vi.advanceTimersByTimeAsync(CLOUD_SAVE_DEBOUNCE_MS + 10); });

    expect(chamadas).toHaveLength(1);
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatch(/\S/);
  });

  it('falha transitória (5xx) NÃO vira ruído — o retry já cuidou', async () => {
    abrir();
    resultado.atual = { ok: false, kind: 'server', status: 500, retentavel: true, avisaJogador: false };
    gesto();
    await act(async () => { await vi.advanceTimersByTimeAsync(CLOUD_SAVE_DEBOUNCE_MS + 10); });

    expect(chamadas).toHaveLength(1);
    expect(avisos).toHaveLength(0);
  });

  it('sucesso não avisa nada', async () => {
    abrir();
    gesto();
    await act(async () => { await vi.advanceTimersByTimeAsync(CLOUD_SAVE_DEBOUNCE_MS + 10); });
    expect(avisos).toHaveLength(0);
  });

  it('um aviso por vez, não um por gesto: a mesma falha não empilha toast', async () => {
    abrir();
    resultado.atual = { ok: false, kind: 'identity', status: 403, retentavel: false, avisaJogador: true };
    for (let i = 0; i < 4; i += 1) {
      gesto();
      await act(async () => { await vi.advanceTimersByTimeAsync(CLOUD_SAVE_DEBOUNCE_MS + 10); });
    }
    expect(chamadas.length).toBeGreaterThan(1);
    expect(avisos).toHaveLength(1);
  });
});

// ─────────────────────────────────────────── R-1: sem auto-alimentação

describe('R-1 — o caminho de erro não pode passar por setGameState', () => {
  it('um 409 não produz render novo nem reagenda POST (auto-alimentação)', async () => {
    abrir();
    resultado.atual = { ok: false, kind: 'conflict', status: 409, retentavel: false, avisaJogador: false };
    gesto();
    await act(async () => { await vi.advanceTimersByTimeAsync(CLOUD_SAVE_DEBOUNCE_MS + 10); });

    const rendersDepoisDoGesto = mutacoesDeEstado;
    const postsDepoisDoGesto = chamadas.length;

    // Deixa passar MUITO tempo sem nenhum gesto novo. Se o tratamento do 409
    // tivesse tocado o estado, o efeito `[gameState]` teria rodado de novo e
    // reagendado o POST — o ciclo que cada gesto aceleraria.
    await act(async () => { await vi.advanceTimersByTimeAsync(CLOUD_SAVE_MAX_WAIT_MS * 4); });

    expect(mutacoesDeEstado).toBe(rendersDepoisDoGesto);
    expect(chamadas.length).toBe(postsDepoisDoGesto);
  });

  it('vale para TODA classe de falha, não só para o 409', async () => {
    for (const kind of ['identity', 'auth', 'server', 'too-large', 'offline'] as const) {
      cleanup();
      localStorage.clear();
      chamadas.length = 0;
      avisos.length = 0;
      resultado.atual = { ok: false, kind, status: 500, retentavel: false, avisaJogador: false };
      abrir();
      gesto();
      await act(async () => { await vi.advanceTimersByTimeAsync(CLOUD_SAVE_DEBOUNCE_MS + 10); });
      const posts = chamadas.length;
      await act(async () => { await vi.advanceTimersByTimeAsync(CLOUD_SAVE_MAX_WAIT_MS * 4); });
      expect(chamadas.length).toBe(posts);
    }
  });
});

// ─────────────────────────────────────────── R-4: inanição do debounce

describe('R-4 — invariante: o debounce não pode ser adiado para sempre', () => {
  it('o teto de espera é MAIOR que o debounce, senão o debounce não existe', () => {
    expect(CLOUD_SAVE_DEBOUNCE_MS).toBe(3000);
    expect(CLOUD_SAVE_MAX_WAIT_MS).toBeGreaterThan(CLOUD_SAVE_DEBOUNCE_MS);
  });

  it('mutações sustentadas a menos de 3 s AINDA assim gravam na nuvem', async () => {
    abrir();
    // O cenário que hoje só não acontece pelo teto de carinho: um gesto a cada
    // 2 s, sem parar. Com debounce de cauda puro, o POST nunca sai.
    const passo = 2000;
    const passos = Math.ceil((CLOUD_SAVE_MAX_WAIT_MS / passo)) + 2;
    for (let i = 0; i < passos; i += 1) {
      gesto();
      await act(async () => { await vi.advanceTimersByTimeAsync(passo); });
    }
    expect(chamadas.length).toBeGreaterThan(0);
  });

  it('o POST forçado leva o estado do MOMENTO em que disparou, não o do começo da rajada', async () => {
    abrir();
    const passo = 2000;
    const passos = Math.ceil((CLOUD_SAVE_MAX_WAIT_MS / passo)) + 2;
    for (let i = 0; i < passos; i += 1) {
      gesto();
      await act(async () => { await vi.advanceTimersByTimeAsync(passo); });
    }
    const primeiro = chamadas[0];
    const agora = Number(screen.getByTestId('pontos').textContent);
    // Nem o estado do 1º gesto (a rajada não foi congelada no começo)…
    expect(primeiro.state.gamePoints).toBeGreaterThan(1);
    // …nem um estado do futuro. O corpo é o snapshot do render que agendou.
    expect(primeiro.state.gamePoints).toBeLessThanOrEqual(agora);
  });

  it('gesto isolado continua esperando o debounce inteiro — o teto não o encurta', async () => {
    abrir();
    gesto();
    await act(async () => { await vi.advanceTimersByTimeAsync(CLOUD_SAVE_DEBOUNCE_MS - 200); });
    expect(chamadas).toHaveLength(0);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(chamadas).toHaveLength(1);
  });

  it('rajada curta continua colapsando em UM POST — o amortecedor não foi perdido', async () => {
    abrir();
    // Cinco gestos em menos de um debounce: o preparo (§A.3.2) mostra que este
    // colapso é o que impede a densidade de gesto de virar densidade de escrita.
    for (let i = 0; i < 5; i += 1) {
      gesto();
      await act(async () => { await vi.advanceTimersByTimeAsync(200); });
    }
    await act(async () => { await vi.advanceTimersByTimeAsync(CLOUD_SAVE_DEBOUNCE_MS + 10); });
    expect(chamadas).toHaveLength(1);
  });
});
