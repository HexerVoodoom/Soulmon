// @vitest-environment jsdom
/**
 * REGRESSÃO (dono, 16/11/2026): "depois que enfrenta o inimigo pela primeira vez" a sala da Feira mostrava DOIS botões — "enfrentar o
 * chefe" (dava erro: o golpe do dia já saíra) e "ver o que ele achou" (reabria a cópia guardada, ainda com `canAttack`, entrava na luta e
 * cancelava). Causa: o desafio cumprido hoje continuava contando como "ativo" na sala (`desafioSt === 'done'` entrava em `desafioAtivo`,
 * que liga o botão do Mistério) e a volta guardada só era dada como VISTA quando fechava a folha do interstitial, não quando a luta
 * saía pela própria sala. Agora o dia fechado não tem ação: o mercador conta o dia e convida a investigar de novo amanhã.
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
import { recordFeiraVolta, readFeiraVolta, feiraVoltaPendente } from '../../utils/feiraVolta';
import { recordFeiraDesafio, markFeiraDesafioDone, readFeiraDesafio } from '../../utils/feiraDesafio';

const mid = (i: number) => `a1b2c3d4e5f6a7${i.toString(16).padStart(2, '0')}`;
const BOSS = { state: 'boss', level: 3, bossId: 'arauto-do-fim', bossHpPct: 62 };
function vista(): GuildView {
  return sanitizeGuildView({
    id: 'g1', name: 'Roda da manhã', weekKey: '2026-W40', code: 'ABCD2345', isHost: false, size: 3, full: false,
    members: [0, 1, 2].map(i => ({ id: mid(i), memberId: mid(i), name: ['Ana', 'Bia', 'Caio'][i], euMesmo: i === 0, apareceuHoje: false })),
    presence: null, threadedToday: null, mine: { cameToday: false, threadToday: false, gesturesSent: [] },
    bosque: { stage: 'clareira', stageIndex: 1, perto: false, ornaments: [] }, gestures: [], gestureReceived: null,
    raid: { weekKey: '2026-W40', phenomenon: 'nevoa', state: 'aberta', ferido: false, lastWeek: null, mine: { hitToday: true } },
    feira: BOSS,
  })!;
}
const sala = () => document.querySelector('[data-guild-room="feira"]') as HTMLElement;
const hoje = () => playerDayKey(new Date(), undefined);
const me = { sprite: 'me.png', name: 'Igni', element: 'neutro' };
const evento = { k: 1, kind: 'boss' as const, level: 3, bossId: 'arauto-do-fim', element: 'fogo', bossHpPct: 62, canAttack: true };
const montar = async (language: 'pt-BR' | 'en-US' = 'pt-BR', onVerAchado = vi.fn()) => {
  renderWithCss(<GuildSheet saveId="save-12345678" language={language} metaDoDiaCumprida room="feira" feira={{ me, onCredit: vi.fn() }}
    missao={{ state: null, onSend: vi.fn(), onVerAchado }} />);
  await waitFor(() => expect(screen.queryByText(GUILD_COPY['guild.salao.carregando'][0])).toBeNull());
  return onVerAchado;
};

beforeAll(async () => { aquecerRender(); await import('./FeiraEventoSheet'); }, 120_000);
beforeEach(() => {
  for (const f of [getGuild, getGuildRewards, getGuildFeira]) vi.mocked(f).mockReset();
  vi.mocked(getGuild).mockResolvedValue(vista());
  vi.mocked(getGuildRewards).mockResolvedValue({ pending: [], scenes: [], trophyOwned: false, trophyId: null, misterio: null });
  resetGroveMemoryForTests(); resetClaimMemoryForTests(); resetRaidTelemetryForTests(); localStorage.clear();
});
afterEach(() => { vi.restoreAllMocks(); cleanup(); });

describe('Feira: o dia fechado depois de enfrentar o inimigo', () => {
  it('ANTES de enfrentar: o desafio existe e o mercador ainda não fechou o dia', async () => {
    recordFeiraVolta({ day: hoje(), kind: 'evento', evento });
    recordFeiraDesafio(hoje(), 1);
    await montar();
    expect(sala().querySelector('[data-feira-misterio-abrir]')).not.toBeNull();
    expect(sala().querySelector('[data-feira-npc-hoje]')).toBeNull();
  });

  it.each([['pt-BR'], ['en-US']] as const)('%s: enfrentou (volta ainda "não vista" no aparelho): NENHUM botão de atacar nem de ver o achado; o mercador fala', async (lang) => {
    recordFeiraVolta({ day: hoje(), kind: 'evento', evento }); // não vista: a luta saiu pela sala, a folha do interstitial nunca fechou
    recordFeiraDesafio(hoje(), 1);
    markFeiraDesafioDone();
    const onVer = await montar(lang);
    expect(sala().querySelector('[data-feira-misterio-abrir]')).toBeNull();
    expect(sala().querySelector('[data-missao-ver-achado]')).toBeNull();
    // desafio cumprido: nenhum CTA de mandar (o "Investigar" desabilitado é só do dia fechado sem desafio; ver o teste "dia fechado sem desafio")
    expect(sala().querySelector('[data-missao-mandar]')).toBeNull();
    // nenhuma AÇÃO na sala (o único botão é o "i" da explicação do fenômeno)
    expect([...sala().querySelectorAll('button')].filter(b => !b.closest('[data-infotip], [data-info-tip]') && !/Como funciona|How the/.test(b.getAttribute('aria-label') ?? '')).length).toBe(0);
    // a fala do mercador mora no "i": fora da tela até tocar
    expect(document.querySelector('[data-feira-npc-hoje]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Como funciona|How the/ }));
    expect(document.querySelector('[data-feira-npc-hoje]')!.textContent).toMatch(lang === 'pt-BR' ? /Hoje .*Arauto do Fim.*enfrentou/ : /Today .*Herald of the End.*faced/);
    expect(document.querySelector('[data-feira-npc-cla]')!.textContent).toMatch(/62%/);
    expect(document.querySelector('[data-feira-npc-amanha]')!.textContent).toMatch(lang === 'pt-BR' ? /investigar de novo/ : /investigate again/);
    expect(onVer).not.toHaveBeenCalled();
    // a volta é dada como vista, então nada reabre o resultado velho
    await waitFor(() => expect(feiraVoltaPendente(readFeiraVolta(), hoje())).toBeNull());
  });

  it('o servidor diz que o golpe já saiu (a folha abre sem `canAttack`): o desafio fecha e o botão some, sem erro', async () => {
    recordFeiraVolta({ day: hoje(), kind: 'evento', evento });
    recordFeiraDesafio(hoje(), 1);
    vi.mocked(getGuildFeira).mockResolvedValue({ ...evento, canAttack: false });
    await montar();
    fireEvent.click(sala().querySelector('[data-feira-misterio-abrir]')!);
    await waitFor(() => expect(readFeiraDesafio()?.done).toBe(true), { timeout: 20000 });
  }, 40000);

  it('volta que já foi vista e não era desafio (Bits do chão): o mercador fala do dia, sem botão', async () => {
    recordFeiraVolta({ day: hoje(), kind: 'achado', achado: { bits: 12 }, seen: true });
    await montar();
    fireEvent.click(screen.getByRole('button', { name: /Como funciona|How the/ }));
    expect(document.querySelector('[data-feira-npc-hoje]')!.textContent).toMatch(/Bits/);
    expect(sala().querySelector('[data-missao-ver-achado]')).toBeNull();
  });

  it.each([['pt-BR'], ['en-US']] as const)('%s: dia fechado sem desafio (volta vista): só a frase curta e o "Investigar" desabilitado; tocar diz "Volte amanhã"', async (lang) => {
    const i = lang === 'pt-BR' ? 0 : 1;
    recordFeiraVolta({ day: hoje(), kind: 'achado', achado: { bits: 12 }, seen: true });
    renderWithCss(<GuildSheet saveId="save-12345678" language={lang} metaDoDiaCumprida room="feira" missao={{ state: null, onSend: vi.fn(), onVerAchado: vi.fn() }} />);
    await waitFor(() => expect(sala().querySelector('[data-missao-mandar]')).not.toBeNull());
    expect(sala().querySelector('[data-feira-recuou-curto]')!.textContent).toBe(GUILD_COPY['guild.feira.recuou.curto'][i]);
    const cta = sala().querySelector('[data-missao-mandar]') as HTMLElement;
    expect(cta.getAttribute('aria-disabled')).toBe('true');
    expect(cta.textContent).toMatch(new RegExp(GUILD_COPY['guild.missao.investigar'][i] + '$'));
    expect(sala().querySelectorAll('button[data-missao-mandar]').length).toBe(1);
    expect(sala().querySelector('[data-missao-ver-achado]')).toBeNull();
    expect(sala().querySelector('[data-feira-volte-amanha]')).toBeNull();
    fireEvent.click(cta);
    expect(sala().querySelector('[data-feira-volte-amanha]')!.textContent).toBe(GUILD_COPY['guild.missao.volteAmanha'][i]);
  });
});
