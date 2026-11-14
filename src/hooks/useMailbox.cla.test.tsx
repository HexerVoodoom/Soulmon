// @vitest-environment jsdom
/** §358: "Entrar no clã" da carta de convite usa o MESMO `joinGuild` do Salão (código da carta) e mantém a caixa coerente. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { MailItem } from '../utils/mensageiro';

const h = vi.hoisted(() => ({ joinGuild: vi.fn(), deleteMail: vi.fn(async () => ({ removed: 1, blocked: [] })), getMail: vi.fn() }));
vi.mock('../utils/community', async () => {
  class GuildError extends Error { constructor(public readonly kind: string, public readonly status: number) { super(kind); } }
  return { GuildError, joinGuild: h.joinGuild, deleteMail: h.deleteMail, getMail: h.getMail };
});
import { useMailbox } from './useMailbox';
import { GuildError } from '../utils/community';

const cla: MailItem = { mid: 'ginv:g1:2026-11-13', kind: 'guild-invite', guildCode: 'ABCD2345', bodyPt: 'x', bodyEn: 'x', bits: 0, emblems: 0, at: 2 };
const antigo: MailItem = { mid: 'ginv:g2:2026-11-12', bodyPt: 'velho', bodyEn: 'old', bits: 0, emblems: 0, at: 1 };
const amizade: MailItem = { mid: 'invite:p:1', kind: 'friend-invite', fromPid: 'pidx00000000000000000001', bodyPt: 'a', bodyEn: 'a', bits: 0, emblems: 0, at: 3 };

async function montar() {
  h.getMail.mockResolvedValue({ mail: [cla, antigo, amizade] });
  const tz = { offsetMin: -180 };
  const setState = vi.fn();
  const getState = () => ({ playerDayTz: tz }) as never;
  const r = renderHook(() => useMailbox({ saveId: 's'.repeat(32), demo: false, getState, setState }));
  await waitFor(() => expect(r.result.current.mail).toHaveLength(3));
  return { r, tz };
}

beforeEach(() => { h.joinGuild.mockReset(); h.deleteMail.mockClear(); });

describe('useMailbox › joinGuildFromLetter', () => {
  it('entrou: chama joinGuild com o código da carta e tira todos os convites de clã da caixa (fica o de amizade)', async () => {
    const { r, tz } = await montar();
    h.joinGuild.mockResolvedValue({ size: 3 });
    let res = '';
    await act(async () => { res = await r.result.current.joinGuildFromLetter(cla); });
    expect(res).toBe('joined');
    expect(h.joinGuild).toHaveBeenCalledWith('s'.repeat(32), 'ABCD2345', tz);
    expect(r.result.current.mail.map(m => m.mid)).toEqual([amizade.mid]);
  });

  it('clã cheio: a carta fica; código morto ou já em clã: a carta sai; sem rede: lança', async () => {
    const { r } = await montar();
    h.joinGuild.mockRejectedValueOnce(new GuildError('full', 409));
    await act(async () => { expect(await r.result.current.joinGuildFromLetter(cla)).toBe('full'); });
    expect(r.result.current.mail).toHaveLength(3);
    h.joinGuild.mockRejectedValueOnce(new GuildError('unavailable', 0));
    await act(async () => { await expect(r.result.current.joinGuildFromLetter(cla)).rejects.toThrow(); });
    expect(r.result.current.mail).toHaveLength(3);
    h.joinGuild.mockRejectedValueOnce(new GuildError('invalidCode', 404));
    await act(async () => { expect(await r.result.current.joinGuildFromLetter(cla)).toBe('gone'); });
    expect(r.result.current.mail.map(m => m.mid)).not.toContain(cla.mid);
    expect(h.deleteMail).toHaveBeenCalledWith('s'.repeat(32), [cla.mid], true);
  });
});
