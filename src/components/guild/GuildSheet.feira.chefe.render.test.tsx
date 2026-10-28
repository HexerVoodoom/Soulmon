// @vitest-environment jsdom
/**
 * A SALA DA FEIRA com o mistério do Chefe (`docs/PLANO-FEIRA-CHEFE.md`, F-09): só o agregado do clã e o gesto de reabrir a folha.
 * Com a Feira DESLIGADA (a vista sem `feira`) a sala é exatamente a de antes: nenhum bloco novo.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';

vi.mock('../../utils/community', async (orig) => {
  const real = await orig<typeof import('../../utils/community')>();
  return { ...real, getGuild: vi.fn(), getGuildRewards: vi.fn(), getGuildFeira: vi.fn(), hitGuildRaid: vi.fn() };
});
vi.mock('../../utils/telemetry', async (orig) => ({ ...(await orig<typeof import('../../utils/telemetry')>()), track: vi.fn() }));

import { sanitizeGuildView, getGuild, getGuildRewards, getGuildFeira, type GuildView } from '../../utils/community';
import { GuildSheet, resetRaidTelemetryForTests } from './GuildSheet';
import { GUILD_COPY } from '../../utils/guildCopy';
import { resetClaimMemoryForTests } from '../../utils/guildClaimLocal';
import { resetGroveMemoryForTests } from '../../utils/groveLocal';
import { feiraText } from '../../utils/feiraCopy';

const mid = (i: number) => `a1b2c3d4e5f6a7${i.toString(16).padStart(2, '0')}`;
function vista(feira?: unknown): GuildView {
  return sanitizeGuildView({
    id: 'g1', name: 'Roda da manhã', weekKey: '2026-W40', code: 'ABCD2345', isHost: false, size: 3, full: false,
    members: [0, 1, 2].map(i => ({ id: mid(i), memberId: mid(i), name: ['Ana', 'Bia', 'Caio'][i], euMesmo: i === 0, apareceuHoje: false })),
    presence: null, threadedToday: null, mine: { cameToday: false, threadToday: false, gesturesSent: [] },
    bosque: { stage: 'clareira', stageIndex: 1, perto: false, ornaments: [] }, gestures: [], gestureReceived: null,
    raid: { weekKey: '2026-W40', phenomenon: 'nevoa', state: 'aberta', ferido: false, lastWeek: null, mine: { hitToday: false } },
    ...(feira ? { feira } : {}),
  })!;
}
const sala = () => document.querySelector('[data-guild-room="feira"]') as HTMLElement;
const me = { sprite: 'me.png', name: 'Igni', element: 'neutro' };
const montar = async (feira = true) => {
  const r = renderWithCss(<GuildSheet saveId="save-12345678" language="pt-BR" metaDoDiaCumprida room="feira" feira={feira ? { me, onCredit: vi.fn() } : undefined} />);
  await waitFor(() => expect(screen.queryByText(GUILD_COPY['guild.salao.carregando'][0])).toBeNull());
  return r;
};

beforeEach(() => {
  for (const f of [getGuild, getGuildRewards, getGuildFeira]) vi.mocked(f).mockReset();
  vi.mocked(getGuildRewards).mockResolvedValue({ pending: [], scenes: [], trophyOwned: false, trophyId: null, misterio: null });
  resetGroveMemoryForTests(); resetClaimMemoryForTests(); resetRaidTelemetryForTests(); localStorage.clear();
});
afterEach(() => { vi.restoreAllMocks(); cleanup(); });

describe('sala da Feira × mistério', () => {
  it('chefe: nome + nível + barra agregada; nada por membro; abrir relê o evento e monta a folha', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista({ state: 'boss', level: 3, bossId: 'arauto-do-fim', bossHpPct: 62, hitters: ['Ana'] }));
    vi.mocked(getGuildFeira).mockResolvedValue({ k: 1, kind: 'boss', level: 3, bossId: 'arauto-do-fim', element: 'fogo', bossHpPct: 62, canAttack: true });
    await montar();
    const bloco = document.querySelector('[data-feira-misterio]') as HTMLElement;
    expect(bloco.getAttribute('data-feira-estado')).toBe('boss');
    expect(bloco.textContent).toContain(feiraText('pt-BR', 'room.boss', { name: 'Arauto do Fim', level: 3 }));
    expect(document.querySelector('[data-feira-misterio-pool]')!.getAttribute('data-feira-misterio-pool')).toBe('62');
    for (const nome of ['Ana', 'Bia', 'Caio']) expect(bloco.textContent).not.toContain(nome);
    fireEvent.click(document.querySelector('[data-feira-misterio-abrir]')!);
    await waitFor(() => expect(document.querySelector('[data-feira-evento="boss"]')).not.toBeNull(), { timeout: 20000 });
    expect(getGuildFeira).toHaveBeenCalledTimes(1);
  });

  it('trilha e descanso: uma linha calma, sem barra', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista({ state: 'trail', level: 2, marks: 2 }));
    await montar();
    expect(document.querySelector('[data-feira-misterio-pool]')).toBeNull();
    expect(document.querySelector('[data-feira-misterio-linha]')!.textContent).toBe(feiraText('pt-BR', 'room.trail'));
    cleanup();
    vi.mocked(getGuild).mockResolvedValue(vista({ state: 'rest', level: 2 }));
    await montar();
    expect(document.querySelector('[data-feira-misterio-linha]')!.textContent).toBe(feiraText('pt-BR', 'room.rest'));
  });

  it('Feira DESLIGADA (vista sem `feira`): nenhum bloco novo, a sala é a de sempre', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    await montar();
    expect(sala()).not.toBeNull();
    expect(document.querySelector('[data-feira-misterio]')).toBeNull();
    expect(getGuildFeira).not.toHaveBeenCalled();
  });

  it('o App não passou a ponte `feira`: mesmo com a vista, nada aparece (inerte)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista({ state: 'boss', level: 1, bossId: 'arauto-do-fim', bossHpPct: 90 }));
    await montar(false);
    expect(document.querySelector('[data-feira-misterio]')).toBeNull();
  });

  it('reabrir falhando (rede): silêncio, a sala segue', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista({ state: 'boss', level: 1, bossId: 'arauto-do-fim', bossHpPct: 90 }));
    vi.mocked(getGuildFeira).mockRejectedValue(new Error('offline'));
    await montar();
    fireEvent.click(document.querySelector('[data-feira-misterio-abrir]')!);
    await waitFor(() => expect(getGuildFeira).toHaveBeenCalled());
    expect(document.querySelector('[data-feira-evento]')).toBeNull();
    expect((document.querySelector('[data-feira-misterio-abrir]') as HTMLButtonElement).disabled).toBe(false);
  });
});
