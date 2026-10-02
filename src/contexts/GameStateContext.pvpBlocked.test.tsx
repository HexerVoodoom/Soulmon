// @vitest-environment jsdom
/**
 * O jogador acha que está no PvP, e não está.
 *
 * O servidor ganhou o gate de Vínculo (`BOND_PVP_MIN_LEVEL` = 5,
 * `functions/api/community.js`, ação `profile`): quem pede para LIGAR o PvP
 * abaixo do nível 5 tem o pedido recusado — o perfil é gravado com
 * `pvpEnabled: false` e a resposta traz `pvpBlocked: true`, `bondLevel` e
 * `minBondLevel`. O comentário do servidor diz, na letra, para que essa
 * resposta existe: *"para o app poder explicar em vez de sumir com o botão em
 * silêncio"*.
 *
 * O app não explicava nada. `pushProfile` tipava o retorno como `{ ok: true }`
 * e o ponto de chamada terminava em `.catch(() => {})` — a recusa era jogada
 * fora inteira. O estado local seguia com `pvpEnabled: true`, o interruptor
 * seguia ligado, e o jogador não aparecia para ninguém.
 *
 * ⚠️ POR QUE ISSO ACONTECE COM QUEM JÁ TEM O NÍVEL — o gate do cliente
 * (`meetsPvpBond(totalXP)`, `TournamentPage`) lê o XP LOCAL, e o servidor lê o
 * XP do save NA NUVEM. Os dois saem no MESMO timer deste provider, e o
 * `pushProfile` não espera o `cloudSaveComRetry`. Quem acabou de cruzar o
 * nível 5 e liga o PvP no mesmo minuto tem boa chance de ser avaliado contra o
 * save anterior — a recusa é uma CORRIDA, não um caso de borda exótico. E se o
 * cloud save estiver falhando (o provider já trata esse caso), a divergência
 * dura enquanto a falha durar.
 *
 * A reconciliação aqui é segura, e a razão é específica deste campo: desligar
 * `pvpEnabled` FECHA o portão que dispara o POST (`if (!gameState.pvpEnabled)
 * return`, logo acima do `pushProfile`). O ciclo morre no passo seguinte em vez
 * de se realimentar — que é exatamente o oposto do 409 de conflito de save, o
 * caso que a nota R-1 do provider proíbe.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

const { perfis, resposta, avisos } = vi.hoisted(() => ({
  perfis: [] as Array<Record<string, unknown>>,
  resposta: { atual: { ok: true } as Record<string, unknown> },
  avisos: [] as string[],
}));

vi.mock('../utils/cloudSave', () => ({
  cloudSave: () => Promise.resolve({ ok: true }),
  cloudSaveComRetry: () => Promise.resolve({ ok: true }),
  emailToSaveId: async () => 'x',
  adoptCloudSave: async () => false,
}));
vi.mock('../utils/community', () => ({
  pushProfile: (p: Record<string, unknown>) => {
    perfis.push(p);
    return Promise.resolve(resposta.atual);
  },
}));
// O aviso é `toast`, e não estado de jogo — a nota R-1 do provider permite
// avisar daqui. Capturado para o caso da explicação, abaixo.
vi.mock('sonner', () => ({
  toast: {
    warning: (m: string) => { avisos.push(m); },
    error: (m: string) => { avisos.push(m); },
    success: (m: string) => { avisos.push(m); },
    info: (m: string) => { avisos.push(m); },
  },
}));

function Espiao() {
  const { gameState, setGameState } = useGameState();
  return (
    <>
      <pre data-testid="estado">{JSON.stringify(gameState)}</pre>
      <button onClick={() => setGameState(s => ({ ...s, gamePoints: (s.gamePoints ?? 0) + 1 }))}>mais</button>
    </>
  );
}

function abrirComSave(save: unknown) {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(save));
  render(<GameStateProvider><Espiao /></GameStateProvider>);
}

const estado = () => JSON.parse(screen.getByTestId('estado').textContent!);

/** O save de quem ligou o PvP no cliente. */
const COM_PVP_LIGADO = {
  activities: [], tasks: [], pvpEnabled: true, totalXP: 4000,
  soulmonMeta: { baseName: 'Fagulha' },
};

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  perfis.length = 0;
  avisos.length = 0;
  resposta.atual = { ok: true };
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('recusa de PvP do servidor (H13: sem interruptor, nada a desfazer)', () => {
  const BLOQUEADO = { ok: true, pvpEnabled: false, pvpBlocked: true, bondLevel: 3, minBondLevel: 5 };

  async function gesto() {
    act(() => { screen.getByText('mais').click(); });
    await act(async () => { vi.advanceTimersByTime(3000); await Promise.resolve(); });
    // A promessa do `pushProfile` resolve num microtask depois do timer.
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  }

  it('servidor responde pvpBlocked → o save local NÃO é mexido e ninguém é "avisado" de algo que não pediu', async () => {
    vi.useFakeTimers();
    try {
      resposta.atual = BLOQUEADO;
      abrirComSave(COM_PVP_LIGADO);
      await gesto();
      expect(perfis).toHaveLength(1);
      expect(estado().pvpEnabled).toBe(true);
      expect(avisos).toHaveLength(0);
    } finally { vi.useRealTimers(); }
  });

  it('a recusa NAO se realimenta: sem setGameState na resposta, nao sai outro perfil', async () => {
    vi.useFakeTimers();
    try {
      resposta.atual = BLOQUEADO;
      abrirComSave(COM_PVP_LIGADO);
      await gesto();
      expect(perfis).toHaveLength(1);
      // Se a resposta tocasse o estado, o efeito reagendaria e reenviaria o POST
      // (nota R-1). Se algum dia isto virar 2, virou loop.
      await act(async () => { vi.advanceTimersByTime(30000); await Promise.resolve(); });
      expect(perfis).toHaveLength(1);
    } finally { vi.useRealTimers(); }
  });

  it('abaixo do Vínculo 5 (XP local) o perfil nem sobe: nada a recusar', async () => {
    vi.useFakeTimers();
    try {
      abrirComSave({ ...COM_PVP_LIGADO, totalXP: 100 });
      await gesto();
      expect(perfis).toHaveLength(0);
      expect(estado().pvpEnabled).toBe(true);
    } finally { vi.useRealTimers(); }
  });

  it('save antigo com pvpEnabled:false (ou sem o campo) carrega LIGADO (migração do H13)', () => {
    abrirComSave({ activities: [], tasks: [], pvpEnabled: false, totalXP: 0 });
    expect(estado().pvpEnabled).toBe(true);
  });

  it('resposta NORMAL (sem pvpBlocked) nao mexe em nada', async () => {
    vi.useFakeTimers();
    try {
      resposta.atual = { ok: true, pvpEnabled: true };
      abrirComSave(COM_PVP_LIGADO);
      act(() => { screen.getByText('mais').click(); });
      await act(async () => { vi.advanceTimersByTime(3000); await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); await Promise.resolve(); });

      expect(estado().pvpEnabled).toBe(true);
      expect(avisos).toHaveLength(0);
    } finally { vi.useRealTimers(); }
  });

  it('servidor velho (responde so ok) nao desliga o PvP de ninguem', async () => {
    // Retrocompatibilidade: enquanto a versao publicada do endpoint nao tiver o
    // campo, a ausencia dele NAO pode ser lida como recusa. O `pvpBlocked` tem
    // que ser exigido explicitamente `=== true`.
    vi.useFakeTimers();
    try {
      resposta.atual = { ok: true };
      abrirComSave(COM_PVP_LIGADO);
      act(() => { screen.getByText('mais').click(); });
      await act(async () => { vi.advanceTimersByTime(3000); await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); await Promise.resolve(); });

      expect(estado().pvpEnabled).toBe(true);
      expect(avisos).toHaveLength(0);
    } finally { vi.useRealTimers(); }
  });
});
