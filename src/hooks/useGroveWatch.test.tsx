// @vitest-environment jsdom
/**
 * O App olha o Bosque: só pergunta a quem já tem roda NESTE aparelho, sem timer,
 * e entrega os cenários ao save uma vez (idempotente).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';

vi.mock('../utils/community', async (orig) => ({ ...(await orig<typeof import('../utils/community')>()), getGuild: vi.fn() }));
vi.mock('../utils/telemetry', async (orig) => ({ ...(await orig<typeof import('../utils/telemetry')>()), track: vi.fn() }));

import { getGuild, sanitizeGuildView } from '../utils/community';
import { track } from '../utils/telemetry';
import { useGroveWatch } from './useGroveWatch';
import { observeGrove, readGroveLocal, acknowledgeGroveMilestone } from '../utils/groveLocal';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { GROVE_STAGES } from '../utils/guildRules';

const vista = (idx: number, groveScenes = false) => sanitizeGuildView({
  id: 'g1', name: 'R', weekKey: 'w', code: 'ABCD2345', isHost: false, size: 2, full: false,
  members: [{ id: 'a', name: 'A', euMesmo: true }, { id: 'b', name: 'B', euMesmo: false }], presence: [], threadedToday: null,
  mine: { threadToday: false, groveScenes, gesturesSent: [] },
  bosque: { stage: idx > 0 ? GROVE_STAGES[idx - 1] : null, stageIndex: idx, perto: false, ornaments: [] }, gestures: [],
})!;
const D = 'Tue Sep 29 2026';
const semear = (idx: number, scenes = false) =>
  localStorage.setItem(STORAGE_KEYS.GUILD_LAST_STAGE, JSON.stringify(observeGrove(null, { gid: 'g1', stageIndex: idx, groveScenes: scenes }, D).next));

afterEach(() => cleanup());
beforeEach(() => { localStorage.clear(); vi.mocked(getGuild).mockReset(); vi.mocked(track).mockReset(); });

describe('useGroveWatch', () => {
  it('SEM memória de roda neste aparelho: nenhuma requisição (quem nunca abriu a Guilda não paga a rede)', async () => {
    renderHook(() => useGroveWatch({ saveId: 's', onScenes: () => {} }));
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise(r => setTimeout(r, 20));
    expect(getGuild).not.toHaveBeenCalled();
  });

  it('COM memória: olha ao montar e ao voltar ao app; estágio subiu → marco pendente no retorno do hook', async () => {
    semear(1);
    vi.mocked(getGuild).mockResolvedValue(vista(2));
    const { result } = renderHook(() => useGroveWatch({ saveId: 's', onScenes: () => {} }));
    await waitFor(() => expect(result.current?.pending?.index).toBe(2));
    expect(getGuild).toHaveBeenCalledTimes(1);
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(getGuild).toHaveBeenCalledTimes(2);
  });

  it('página oculta não consulta; falha de rede fica em silêncio e mantém a memória', async () => {
    semear(1);
    vi.mocked(getGuild).mockRejectedValue(new Error('rede'));
    const oculto = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    const { result } = renderHook(() => useGroveWatch({ saveId: 's', onScenes: () => {} }));
    await new Promise(r => setTimeout(r, 10));
    expect(getGuild).not.toHaveBeenCalled();
    oculto.mockReturnValue(false);
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(getGuild).toHaveBeenCalledTimes(1);
    expect(result.current?.index).toBe(1);
    oculto.mockRestore();
  });

  it('a pessoa saiu da roda em outro aparelho (vista nula): a memória acaba', async () => {
    semear(3);
    vi.mocked(getGuild).mockResolvedValue(null);
    const { result } = renderHook(() => useGroveWatch({ saveId: 's', onScenes: () => {} }));
    await waitFor(() => expect(result.current).toBeNull());
    expect(readGroveLocal()).toBeNull();
  });

  it('fechar a cerimônia reconhece o estágio e o hook vê (sem nova requisição)', async () => {
    semear(1);
    vi.mocked(getGuild).mockResolvedValue(vista(3));
    const { result } = renderHook(() => useGroveWatch({ saveId: 's', onScenes: () => {} }));
    await waitFor(() => expect(result.current?.pending?.index).toBe(3));
    act(() => acknowledgeGroveMilestone());
    await waitFor(() => expect(result.current?.pending).toBeNull());
    expect(result.current?.index).toBe(3);
  });

  it('cenários liberados vão ao save por `onScenes`, com os ids certos, e só quando há cenário', async () => {
    semear(2);
    vi.mocked(getGuild).mockResolvedValue(vista(2, true));
    const onScenes = vi.fn();
    renderHook(() => useGroveWatch({ saveId: 's', onScenes }));
    await waitFor(() => expect(onScenes).toHaveBeenCalledWith(['bg-guild-clareira', 'bg-guild-ramagem']));
    onScenes.mockClear();
    localStorage.clear();
    semear(2, false);
    vi.mocked(getGuild).mockResolvedValue(vista(2, false));
    renderHook(() => useGroveWatch({ saveId: 's', onScenes }));
    await new Promise(r => setTimeout(r, 20));
    expect(onScenes).not.toHaveBeenCalled();
  });

  it('não há timer: nenhum setInterval', () => {
    const spy = vi.spyOn(globalThis, 'setInterval');
    semear(1);
    vi.mocked(getGuild).mockResolvedValue(vista(1));
    renderHook(() => useGroveWatch({ saveId: 's', onScenes: () => {} }));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
