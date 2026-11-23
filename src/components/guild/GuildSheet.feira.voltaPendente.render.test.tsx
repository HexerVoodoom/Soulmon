// @vitest-environment jsdom
/**
 * REGRESSÃO (dono, 12/11/2026): o Soulmon investigou e voltou; ao abrir a Feira apareceu "Mandar investigar" de novo em vez do que
 * ele achou. Causas: (1) passada a hora de voltar e antes do registro, a sala oferecia investigar; (2) o resultado da volta não
 * ficava guardado, então não havia como vê-lo; (3) a releitura silenciosa da vista podia vir velha (`hitToday` falso).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { aquecerRender, renderWithCss } from '../../test/renderEnv';

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
import { playerDayKey } from '../../utils/playerDay';
import { recordFeiraVolta, readFeiraVolta, markFeiraVoltaSeen, feiraVoltaPendente } from '../../utils/feiraVolta';

const mid = (i: number) => `a1b2c3d4e5f6a7${i.toString(16).padStart(2, '0')}`;
function vista(hitToday: boolean): GuildView {
  return sanitizeGuildView({
    id: 'g1', name: 'Roda da manhã', weekKey: '2026-W40', code: 'ABCD2345', isHost: false, size: 3, full: false,
    members: [0, 1, 2].map(i => ({ id: mid(i), memberId: mid(i), name: ['Ana', 'Bia', 'Caio'][i], euMesmo: i === 0, apareceuHoje: false })),
    presence: null, threadedToday: null, mine: { cameToday: false, threadToday: false, gesturesSent: [] },
    bosque: { stage: 'clareira', stageIndex: 1, perto: false, ornaments: [] }, gestures: [], gestureReceived: null,
    raid: { weekKey: '2026-W40', phenomenon: 'nevoa', state: 'aberta', ferido: false, lastWeek: null, mine: { hitToday } },
  })!;
}
const sala = () => document.querySelector('[data-guild-room="feira"]') as HTMLElement;
const hoje = () => playerDayKey(new Date(), undefined);
const montar = async (missao: { state: { day: string; returnAt: number } | null; onSend?: () => void; onVerAchado?: () => void }) => {
  renderWithCss(<GuildSheet saveId="save-12345678" language="pt-BR" metaDoDiaCumprida room="feira" missao={{ onSend: vi.fn(), ...missao }} />);
  await waitFor(() => expect(screen.queryByText(GUILD_COPY['guild.salao.carregando'][0])).toBeNull());
};

beforeAll(() => { aquecerRender(); }, 120_000);
beforeEach(() => {
  for (const f of [getGuild, getGuildRewards, getGuildFeira]) vi.mocked(f).mockReset();
  vi.mocked(getGuildRewards).mockResolvedValue({ pending: [], scenes: [], trophyOwned: false, trophyId: null, misterio: null });
  resetGroveMemoryForTests(); resetClaimMemoryForTests(); resetRaidTelemetryForTests(); localStorage.clear();
});
afterEach(() => { vi.restoreAllMocks(); cleanup(); });

describe('Feira × volta da Missão', () => {
  it('passou da hora de voltar e o registro ainda espera: NÃO oferece "Mandar investigar"', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(false));
    await montar({ state: { day: hoje(), returnAt: Date.now() - 60_000 } });
    expect(sala().querySelector('[data-missao-registrando]')).not.toBeNull();
    expect(sala().querySelector('[data-missao-mandar]')).toBeNull();
  });

  it('vista velha (hitToday falso) mas a volta de hoje está guardada: mostra o que achou, nunca "Mandar investigar"', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(false));
    recordFeiraVolta({ day: hoje(), kind: 'achado', achado: { bits: 12 }, seen: false });
    const onVer = vi.fn();
    await montar({ state: null, onVerAchado: onVer });
    expect(sala().querySelector('[data-missao-mandar]')).toBeNull();
    const ver = sala().querySelector('[data-missao-ver-achado]') as HTMLElement;
    expect(ver).not.toBeNull();
    fireEvent.click(ver);
    expect(onVer).toHaveBeenCalledTimes(1);
  });

  it('o resultado fica pendente até ser visto; visto, o botão de ver some (e o "Investigar" fica desabilitado até o dia seguinte)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(true));
    recordFeiraVolta({ day: hoje(), kind: 'achado', achado: { bits: 12 }, seen: false });
    expect(feiraVoltaPendente(readFeiraVolta(), hoje())).not.toBeNull();
    markFeiraVoltaSeen();
    expect(feiraVoltaPendente(readFeiraVolta(), hoje())).toBeNull();
    await montar({ state: null, onVerAchado: vi.fn() });
    expect(sala().querySelector('[data-missao-ver-achado]')).toBeNull();
    // dia fechado (dono, 23/11/2026): o "Investigar" segue na sala, mas DESABILITADO; só volta a valer no dia seguinte
    const cta = sala().querySelector('[data-missao-mandar]') as HTMLElement;
    expect(cta).not.toBeNull();
    expect(cta.getAttribute('aria-disabled')).toBe('true');
    expect(sala().querySelector('[data-missao-feita]')).not.toBeNull();
  });

  it('volta de ONTEM guardada não conta: sem volta hoje, a sala oferece investigar normalmente', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(false));
    recordFeiraVolta({ day: '1999-01-01', kind: 'nada' });
    await montar({ state: null });
    expect(sala().querySelector('[data-missao-mandar]')).not.toBeNull();
  });
});
