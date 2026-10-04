// @vitest-environment jsdom
/**
 * A FEIRA na tela (fatia B2 do cliente, `docs/PLANO-GUILDA.md` §3, §6, §9).
 *
 * O que estes testes seguram — o que, se cair, faz a Feira virar raide com placar:
 *  1. o fenômeno tem 3 estados visuais (aberto/ferido/dissipado) e 4 tipos, e NENHUM número de
 *     HP/dano/contagem existe no render (nem na fonte);
 *  2. UM botão por dia; depois dele o estado "rodada feita" em silêncio, e quem não golpeou não lê
 *     texto de cobrança; `recuou` não culpa ninguém;
 *  3. o resgate credita UMA vez (por recibo), a rede caindo NÃO credita e permite tentar de novo, e
 *     409 é silêncio;
 *  4. sem guilda, a Feira é o convite do Salão — nada de cobrança.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent, cleanup, act } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { renderWithCss } from '../../test/renderEnv';

vi.mock('../../utils/community', async (orig) => {
  const real = await orig<typeof import('../../utils/community')>();
  return {
    ...real,
    getGuild: vi.fn(), hitGuildRaid: vi.fn(), getGuildRewards: vi.fn(), claimGuildReward: vi.fn(), leaveGuild: vi.fn(),
  };
});
vi.mock('../../utils/telemetry', async (orig) => ({ ...(await orig<typeof import('../../utils/telemetry')>()), track: vi.fn() }));

import {
  GuildError, sanitizeGuildView, getGuild, hitGuildRaid, getGuildRewards, claimGuildReward, leaveGuild,
  type GuildView, type GuildClaim, type GuildRewards,
} from '../../utils/community';
import { track } from '../../utils/telemetry';
import { GuildSheet, resetRaidTelemetryForTests } from './GuildSheet';
import { AreaView, type AreaViewProps } from '../nav/AreaView';
import { closeTopBackLayer } from '../../utils/backStack';
import { GUILD_COPY } from '../../utils/guildCopy';
import { RAID_EMBLEMS, RAID_EMBLEMS_FLOOR, RAID_PHENOMENA, RAID_TROPHY_ID } from '../../utils/guildRules';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { resetGroveMemoryForTests } from '../../utils/groveLocal';
import { resetClaimMemoryForTests } from '../../utils/guildClaimLocal';

const PT = (k: keyof typeof GUILD_COPY) => GUILD_COPY[k][0];
const EN = (k: keyof typeof GUILD_COPY) => GUILD_COPY[k][1];
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

const mid = (i: number) => `a1b2c3d4e5f6a7${i.toString(16).padStart(2, '0')}`;
type RaidOver = Partial<{ phenomenon: string; state: string; ferido: boolean; lastWeek: string | null; hitToday: boolean; weekKey: string }>;

/** Uma vista como o SERVIDOR a monta, com a Feira, passada pelo higienizador do cliente. */
function vista(raid: RaidOver = {}, n = 3): GuildView {
  const { hitToday = false, ...r } = raid;
  return sanitizeGuildView({
    id: 'g1', name: 'Roda da manhã', weekKey: '2026-W40', code: 'ABCD2345', isHost: false, size: n, full: false,
    members: Array.from({ length: n }, (_, i) => ({ id: mid(i), memberId: mid(i), name: ['Ana', 'Bia', 'Caio'][i], euMesmo: i === 0, apareceuHoje: false })),
    presence: null, threadedToday: null, mine: { cameToday: false, threadToday: false, gesturesSent: [] },
    bosque: { stage: 'clareira', stageIndex: 1, perto: false, ornaments: [] }, gestures: [], gestureReceived: null,
    raid: { weekKey: '2026-W40', phenomenon: 'nevoa', state: 'aberta', ferido: false, lastWeek: null, mine: { hitToday }, ...r },
  })!;
}

const semPendencia: GuildRewards = { pending: [], scenes: [], trophyOwned: false, trophyId: null };
const recibo = (over: Partial<GuildClaim> = {}): GuildClaim => ({ week: '2026-W39', outcome: 'dissipada', emblems: RAID_EMBLEMS, trophy: false, trophyId: null, receipt: 'rc-1', ...over });
const pendente = (outcome: 'dissipada' | 'recuou' = 'dissipada', week = '2026-W39'): GuildRewards => ({
  ...semPendencia, pending: [{ week, outcome, emblems: outcome === 'dissipada' ? RAID_EMBLEMS : RAID_EMBLEMS_FLOOR }],
});

const props = (over: Partial<React.ComponentProps<typeof GuildSheet>> = {}) => ({
  saveId: 'save-12345678', language: 'pt-BR' as const, metaDoDiaCumprida: true, room: 'feira' as const, ...over,
});
const montar = async (over = {}) => {
  const r = renderWithCss(<GuildSheet {...props(over)} />);
  await waitFor(() => expect(screen.queryByText(PT('guild.salao.carregando'))).toBeNull());
  return r;
};
const visor = () => document.querySelector('[data-fair-visor]') as HTMLElement;
const sala = () => document.querySelector('[data-guild-room="feira"]') as HTMLElement;
const botao = () => document.querySelector('[data-feira-rodada]') as HTMLButtonElement | null;

beforeEach(() => {
  for (const f of [getGuild, hitGuildRaid, getGuildRewards, claimGuildReward, leaveGuild]) vi.mocked(f).mockReset();
  resetGroveMemoryForTests();
  resetClaimMemoryForTests();
  vi.mocked(getGuildRewards).mockResolvedValue(semPendencia);
  vi.mocked(track).mockReset();
  resetRaidTelemetryForTests();
  localStorage.clear();
});
afterEach(() => { vi.restoreAllMocks(); cleanup(); });

describe('o fenômeno: 3 estados × 4 tipos, sem número nenhum', () => {
  it('aberto: o visor é uma imagem nomeada pelo tipo, o cabeçalho é o da abertura e a linha sóbria usa as CONSTANTES', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    await montar();
    expect(visor().getAttribute('data-state')).toBe('aberto');
    expect(visor().getAttribute('role')).toBe('img');
    expect(visor().getAttribute('aria-label')).toBe(fill(PT('guild.aria.feira'), { nome: 'Névoa' }));
    expect(screen.getByText(PT('guild.feira.aberta.mundo'))).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Névoa' })).toBeTruthy();
    expect(screen.getByText(PT('guild.feira.fenomeno.nevoa.linha'))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Como funciona a Feira' }));
    expect(screen.getByText(PT('guild.feira.legenda'))).toBeTruthy();
    // A8: para um leigo — o que é (legenda), o que se faz (como) e o que se ganha (ganho), tudo no InfoTip único.
    expect(screen.getByText(PT('guild.feira.como'))).toBeTruthy();
    expect(screen.getByText(PT('guild.feira.ganho'))).toBeTruthy();
    expect(screen.getByText(fill(PT('guild.feira.sobria'), { cheio: RAID_EMBLEMS, piso: RAID_EMBLEMS_FLOOR }))).toBeTruthy();
    expect(botao()!.textContent).toContain(PT('guild.feira.rodada.botao'));
    expect(botao()!.disabled).toBe(false);
  });

  it('ferido: só o DESENHO muda (mesmo texto, mesmo botão) — `ferido` é o único sinal, e é booleano', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista({ ferido: true }));
    await montar();
    expect(visor().getAttribute('data-state')).toBe('ferido');
    expect(screen.getByText(PT('guild.feira.aberta.mundo'))).toBeTruthy();
    expect(botao()).toBeTruthy();
    // ...mas o NOME ACESSÍVEL do visor diz o estado (M2), com "luz entre as camadas" e NUNCA HP/ferido/metade.
    const aria = visor().getAttribute('aria-label')!;
    expect(aria).toBe(fill(PT('guild.aria.feira.ferido'), { nome: 'Névoa' }));
    expect(aria).not.toMatch(/ferid|metade|quase|hp|dano|damage|half|hurt|wounded/i);
  });

  it('ferido em inglês: "with light showing between its layers" (dissipado: "come apart")', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista({ ferido: true }));
    await montar({ language: 'en-US' });
    expect(visor().getAttribute('aria-label')).toBe(fill(EN('guild.aria.feira.ferido'), { nome: 'Mist' }));
    cleanup();
    vi.mocked(getGuild).mockResolvedValue(vista({ state: 'dissipada' }));
    await montar({ language: 'en-US' });
    expect(visor().getAttribute('aria-label')).toBe(fill(EN('guild.aria.feira.dissipado'), { nome: 'Mist' }));
  });

  it('a frase do resgate NÃO se repete uma linha acima do visor (L3 B2)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista({ state: 'dissipada' }));
    vi.mocked(getGuildRewards).mockResolvedValue(pendente());
    await montar();
    await waitFor(() => expect(document.querySelector('[data-feira-resgate]')).toBeTruthy());
    expect(screen.getAllByText(PT('guild.feira.dissipado.mundo'))).toHaveLength(1);
  });

  it('dissipado: cabeçalho de "se desfez", sem botão e sem "ferido" (estado próprio)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista({ state: 'dissipada', ferido: true }));
    await montar();
    expect(visor().getAttribute('data-state')).toBe('dissipado');
    expect(visor().getAttribute('aria-label')).toBe(fill(PT('guild.aria.feira.dissipado'), { nome: 'Névoa' }));
    expect(screen.getByText(PT('guild.feira.dissipado.mundo'))).toBeTruthy();
    expect(botao()).toBeNull();
    expect(screen.queryByText(PT('guild.feira.aberta.mundo'))).toBeNull();
  });

  it.each(RAID_PHENOMENA.map(p => [p] as const))('tipo %s: nome e linha PT+EN, FX próprio no vidro', async (p) => {
    const nomePT = PT(`guild.feira.fenomeno.${p}.nome` as keyof typeof GUILD_COPY);
    const nomeEN = EN(`guild.feira.fenomeno.${p}.nome` as keyof typeof GUILD_COPY);
    vi.mocked(getGuild).mockResolvedValue(vista({ phenomenon: p }));
    await montar();
    expect(visor().getAttribute('data-phenomenon')).toBe(p);
    expect(visor().querySelector(`[data-fair-fx="${p}"]`)).toBeTruthy();
    expect(screen.getByRole('heading', { name: nomePT })).toBeTruthy();
    cleanup();
    await montar({ language: 'en-US' });
    expect(screen.getByRole('heading', { name: nomeEN })).toBeTruthy();
    expect(screen.getByText(EN(`guild.feira.fenomeno.${p}.linha` as keyof typeof GUILD_COPY))).toBeTruthy();
  });

  it('o visor não tem rosto, olho, barra nem texto: só as lajes (arte da rodada 3 por tipo × estado; sem <text>)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    await montar();
    expect(visor().querySelectorAll('image, text, progress, [role="progressbar"], [role="meter"]')).toHaveLength(0);
    // Rodada 3 (30/09/2026): a arte real substituiu o SVG de lajes (que segue como fallback).
    const ph = visor().getAttribute('data-phenomenon');
    expect(visor().querySelector(`img[data-fair-fenomeno="${ph}-aberto"]`)).toBeTruthy();
    expect(visor().textContent).toBe('');
    // nenhuma cor magenta/roxa/rosa no placeholder
    expect(visor().innerHTML).not.toMatch(/#(?:f0f|ff00ff|8b5cf6|a855f7|ec4899|d946ef)/i);
  });

  it('NENHUM número no render da Feira além das constantes da linha sóbria (nada de HP, dano, contagem, quem)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista({ ferido: true, lastWeek: 'recuou', hitToday: true }));
    await montar();
    const texto = sala().textContent!.replace(fill(PT('guild.feira.sobria'), { cheio: RAID_EMBLEMS, piso: RAID_EMBLEMS_FLOOR }), '');
    expect(texto).not.toMatch(/\d/);
    expect(sala().querySelectorAll('progress, [role="progressbar"], [role="meter"], [aria-valuenow]')).toHaveLength(0);
    expect(texto).not.toMatch(/\b(hp|dano|damage|vida|golpes?|acertou|quem)\b/i);
  });
});

describe('a rodada do dia', () => {
  it('golpe: chama o servidor com o id, avisa a região viva, conta `guild_raid` 0 e vira "rodada feita" (desabilitado)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(hitGuildRaid).mockResolvedValue(vista({ hitToday: true }));
    await montar();
    fireEvent.click(botao()!);
    await waitFor(() => expect(botao()!.disabled).toBe(true));
    expect(hitGuildRaid).toHaveBeenCalledTimes(1);
    expect(vi.mocked(hitGuildRaid).mock.calls[0][0]).toBe('save-12345678');
    expect(botao()!.textContent).toContain(PT('guild.feira.rodada.feita'));
    expect(document.querySelector('[data-guild-status]')!.textContent).toBe(PT('guild.feira.rodada.feita'));
    expect(track).toHaveBeenCalledWith('guild_raid', { outcome: 0 });
  });

  it('duplo toque no mesmo instante: UMA chamada', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(hitGuildRaid).mockReturnValue(new Promise(() => {}));
    await montar();
    fireEvent.click(botao()!);
    fireEvent.click(botao()!);
    expect(hitGuildRaid).toHaveBeenCalledTimes(1);
  });

  it('quem já fez a rodada hoje (outro aparelho) abre com o botão desabilitado; quem NÃO fez não lê texto de cobrança', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista({ hitToday: true }));
    await montar();
    expect(botao()!.disabled).toBe(true);
    cleanup();
    vi.mocked(getGuild).mockResolvedValue(vista({ hitToday: false }));
    await montar();
    const t = sala().textContent!;
    expect(t).not.toContain(PT('guild.feira.rodada.feita'));
    expect(t).not.toMatch(/ainda n[ãa]o|volte|amanh|faltam?|not yet|come back|tomorrow|\bleft\b|missing|hoje/i);
  });

  it('429 daily limit e 409 raid closed: SILÊNCIO (sem alerta) e a vista é relida', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    await montar();
    for (const kind of ['dailyLimit', 'raidClosed'] as const) {
      vi.mocked(hitGuildRaid).mockRejectedValueOnce(new GuildError(kind, 0));
      vi.mocked(getGuild).mockClear();
      fireEvent.click(botao()!);
      await waitFor(() => expect(getGuild).toHaveBeenCalled());
      expect(screen.queryByRole('alert')).toBeNull();
    }
  });

  it('sem rede no golpe: a frase de "sem conexão" e o botão continua ali', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(hitGuildRaid).mockRejectedValue(new GuildError('unavailable', 0));
    await montar();
    fireEvent.click(botao()!);
    expect((await screen.findByRole('alert')).textContent).toBe(PT('guild.erro.semRede'));
    expect(botao()!.disabled).toBe(false);
  });
});

describe('o resultado da semana que fechou', () => {
  it('dissipada: a frase de "se desfez", sem "campeões" nem nome', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista({ lastWeek: 'dissipada' }));
    await montar();
    const l = document.querySelector('[data-feira-semana-passada="dissipada"]')!;
    expect(l.textContent).toBe(PT('guild.feira.dissipado.mundo'));
  });

  it('recuou: a frase de voltar à névoa — não culpa, não absolve, não nomeia ninguém', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista({ lastWeek: 'recuou' }));
    await montar();
    const l = document.querySelector('[data-feira-semana-passada="recuou"]')!;
    expect(l.textContent).toBe(PT('guild.feira.recuou.mundo'));
    expect(sala().textContent).not.toMatch(/culpa|falhou|perderam|fault|failed|lost|n[ãa]o foi/i);
    expect(sala().textContent).not.toMatch(/Ana|Bia|Caio/);
  });

  it('semana corrente já dissipada: o resultado da PASSADA não aparece junto (uma frase de desfecho só)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista({ state: 'dissipada', lastWeek: 'recuou' }));
    await montar();
    expect(document.querySelector('[data-feira-semana-passada]')).toBeNull();
    expect(screen.queryByText(PT('guild.feira.recuou.mundo'))).toBeNull();
    expect(screen.getByText(PT('guild.feira.dissipado.mundo'))).toBeTruthy();
  });

  it('lastWeek nulo (ninguém golpeou): nada sobre a semana passada', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista({ lastWeek: null }));
    await montar();
    expect(document.querySelector('[data-feira-semana-passada]')).toBeNull();
  });

  it('telemetria de leitura: 1 = viu dissipada, 2 = viu recuou — UMA vez por semana/estado (relê não repete)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista({ state: 'dissipada' }));
    await montar();
    cleanup();
    await montar();
    expect(vi.mocked(track).mock.calls.filter(c => c[0] === 'guild_raid' && (c[1] as { outcome: number }).outcome === 1)).toHaveLength(1);
    cleanup();
    vi.mocked(getGuild).mockResolvedValue(vista({ lastWeek: 'recuou', weekKey: '2026-W41' }));
    await montar();
    cleanup();
    await montar();
    expect(vi.mocked(track).mock.calls.filter(c => c[0] === 'guild_raid' && (c[1] as { outcome: number }).outcome === 2)).toHaveLength(1);
  });
});

describe('o resgate', () => {
  const colhe = () => document.querySelector('[data-feira-colher]') as HTMLButtonElement | null;

  it('sem direito: nenhum cartão (silêncio)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    await montar();
    await waitFor(() => expect(getGuildRewards).toHaveBeenCalled());
    expect(document.querySelector('[data-feira-resgate]')).toBeNull();
  });

  it('feliz: mostra o cartão, colhe UMA vez, credita pelo `onClaimed`, guarda o recibo e diz o fato', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockResolvedValue(pendente());
    vi.mocked(claimGuildReward).mockResolvedValue(recibo());
    const onClaimed = vi.fn();
    await montar({ onClaimed });
    const b = await waitFor(() => { expect(colhe()).toBeTruthy(); return colhe()!; });
    expect(b.textContent).toContain(PT('guild.feira.colher.botao'));
    // O cartão só CONSTATA o desfecho: nenhuma frase de cobrança antes ou depois dele.
    const cartao = document.querySelector('[data-feira-resgate]')!;
    expect(cartao.querySelector('p')!.textContent).toBe(PT('guild.feira.dissipado.mundo'));
    expect(cartao.textContent).not.toMatch(/ainda|not yet|volte|come back|amanh|tomorrow|perde|expira|last chance|\bhoje\b|\btoday\b/i);
    fireEvent.click(b);
    await waitFor(() => expect(document.querySelector('[data-feira-colhido]')!.textContent).toBe(fill(PT('guild.feira.colhido'), { n: RAID_EMBLEMS })));
    expect(onClaimed).toHaveBeenCalledTimes(1);
    expect(onClaimed).toHaveBeenCalledWith({ emblems: RAID_EMBLEMS, trophyId: null });
    expect(vi.mocked(claimGuildReward).mock.calls[0][1]).toBe('2026-W39');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.GUILD_CLAIMED)!).filter((e: string) => !e.startsWith('~'))).toEqual(['rc-1']);
    expect(colhe()).toBeNull();
  });

  it('recuou também paga (o piso) e o cartão diz o fato, sem culpa', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockResolvedValue(pendente('recuou'));
    vi.mocked(claimGuildReward).mockResolvedValue(recibo({ outcome: 'recuou', emblems: RAID_EMBLEMS_FLOOR, receipt: 'rc-2' }));
    const onClaimed = vi.fn();
    await montar({ onClaimed });
    await waitFor(() => expect(colhe()).toBeTruthy());
    expect(document.querySelector('[data-feira-resgate]')!.textContent).toContain(PT('guild.feira.recuou.mundo'));
    fireEvent.click(colhe()!);
    await waitFor(() => expect(document.querySelector('[data-feira-colhido]')!.textContent).toBe(fill(PT('guild.feira.colhido'), { n: RAID_EMBLEMS_FLOOR })));
    expect(onClaimed).toHaveBeenCalledWith({ emblems: RAID_EMBLEMS_FLOOR, trophyId: null });
  });

  it('a Concha da Maré chega pelo mesmo `onClaimed` (com o id) e a frase dela aparece', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockResolvedValue(pendente());
    vi.mocked(claimGuildReward).mockResolvedValue(recibo({ trophy: true, trophyId: RAID_TROPHY_ID }));
    const onClaimed = vi.fn();
    await montar({ onClaimed });
    await waitFor(() => expect(colhe()).toBeTruthy());
    fireEvent.click(colhe()!);
    await screen.findByText(PT('guild.concha.chegou'));
    expect(onClaimed).toHaveBeenCalledWith({ emblems: RAID_EMBLEMS, trophyId: RAID_TROPHY_ID });
  });

  it('rede caindo no claim: NADA é creditado, o cartão fica, dá para tentar de novo — e a segunda credita UMA vez', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockResolvedValue(pendente());
    vi.mocked(claimGuildReward).mockRejectedValueOnce(new GuildError('unavailable', 0)).mockResolvedValueOnce(recibo());
    const onClaimed = vi.fn();
    await montar({ onClaimed });
    await waitFor(() => expect(colhe()).toBeTruthy());
    fireEvent.click(colhe()!);
    expect((await screen.findByRole('alert')).textContent).toBe(PT('guild.erro.semRede'));
    expect(onClaimed).not.toHaveBeenCalled();
    // Só a TENTATIVA ficou (é ela que autoriza o 409 a creditar depois); nenhum recibo.
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.GUILD_CLAIMED)!)).toEqual(['~2026-W39']);
    expect(colhe()!.disabled).toBe(false);
    fireEvent.click(colhe()!);
    await waitFor(() => expect(document.querySelector('[data-feira-colhido]')!.textContent).toBe(fill(PT('guild.feira.colhido'), { n: RAID_EMBLEMS })));
    expect(onClaimed).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('recibo duplicado (200 repetido de outro POP): NÃO credita de novo e não diz "colhidos" outra vez', async () => {
    localStorage.setItem(STORAGE_KEYS.GUILD_CLAIMED, JSON.stringify(['rc-1']));
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockResolvedValue(pendente());
    vi.mocked(claimGuildReward).mockResolvedValue(recibo());
    const onClaimed = vi.fn();
    await montar({ onClaimed });
    await waitFor(() => expect(colhe()).toBeTruthy());
    fireEvent.click(colhe()!);
    await waitFor(() => expect(colhe()).toBeNull());
    expect(onClaimed).not.toHaveBeenCalled();
    expect(screen.queryByText(/colhidos|collected/)).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.GUILD_CLAIMED)!).filter((e: string) => !e.startsWith('~'))).toEqual(['rc-1']);
  });

  // ── L3-codigo A1: a resposta do 200 se perdeu; o 409 devolve o resgate e é ELE que credita ─────────
  const conflito = (claim: GuildClaim | null) => Object.assign(new GuildError('alreadyClaimed', 409, undefined, claim), {});

  it('A1: 200 perdido na rede → o 409 traz o resgate e credita UMA vez (só quem tentou aqui)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockResolvedValue(pendente());
    vi.mocked(claimGuildReward)
      .mockRejectedValueOnce(new GuildError('unavailable', 0))
      .mockRejectedValueOnce(conflito(recibo({ trophy: true, trophyId: RAID_TROPHY_ID, receipt: 'rc-perdido' })));
    const onClaimed = vi.fn();
    await montar({ onClaimed });
    await waitFor(() => expect(colhe()).toBeTruthy());
    fireEvent.click(colhe()!);
    expect((await screen.findByRole('alert')).textContent).toBe(PT('guild.erro.semRede'));
    expect(onClaimed).not.toHaveBeenCalled();
    fireEvent.click(colhe()!);
    await waitFor(() => expect(onClaimed).toHaveBeenCalledTimes(1));
    expect(onClaimed).toHaveBeenCalledWith({ emblems: RAID_EMBLEMS, trophyId: RAID_TROPHY_ID });
    expect(document.querySelector('[data-feira-colhido]')!.textContent).toBe(fill(PT('guild.feira.colhido'), { n: RAID_EMBLEMS }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.GUILD_CLAIMED)!)).toContain('rc-perdido');
  });

  it('A1: 409 com o recibo JÁ guardado neste aparelho → silêncio, nada creditado', async () => {
    localStorage.setItem(STORAGE_KEYS.GUILD_CLAIMED, JSON.stringify(['rc-1']));
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockResolvedValue(pendente());
    vi.mocked(claimGuildReward).mockRejectedValue(conflito(recibo()));
    const onClaimed = vi.fn();
    await montar({ onClaimed });
    await waitFor(() => expect(colhe()).toBeTruthy());
    fireEvent.click(colhe()!);
    await waitFor(() => expect(colhe()).toBeNull());
    expect(onClaimed).not.toHaveBeenCalled();
    expect(screen.queryByText(/colhidos|collected/)).toBeNull();
  });

  it('A1: 409 sem `claimed` (registro sumiu entre as leituras) → silêncio, nada creditado', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockResolvedValue(pendente());
    vi.mocked(claimGuildReward).mockRejectedValueOnce(new GuildError('unavailable', 0)).mockRejectedValueOnce(conflito(null));
    const onClaimed = vi.fn();
    await montar({ onClaimed });
    await waitFor(() => expect(colhe()).toBeTruthy());
    fireEvent.click(colhe()!);
    await screen.findByRole('alert');
    fireEvent.click(colhe()!);
    await waitFor(() => expect(colhe()).toBeNull());
    expect(onClaimed).not.toHaveBeenCalled();
  });

  it('A1: 409 de OUTRO aparelho (esta tela nunca tentou) → silêncio: tela velha não credita em dobro', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockResolvedValue(pendente());
    // o primeiro pedido já é o 409: não houve resposta perdida aqui — mas `markClaimAttempt` marca ao pedir.
    // Simula o aparelho B: a tentativa é apagada logo depois de marcada (nunca chegou a gravar).
    localStorage.setItem(STORAGE_KEYS.GUILD_CLAIMED, JSON.stringify([]));
    vi.mocked(claimGuildReward).mockImplementation(async () => { localStorage.removeItem(STORAGE_KEYS.GUILD_CLAIMED); throw conflito(recibo({ receipt: 'rc-outro' })); });
    const onClaimed = vi.fn();
    await montar({ onClaimed });
    await waitFor(() => expect(colhe()).toBeTruthy());
    fireEvent.click(colhe()!);
    await waitFor(() => expect(colhe()).toBeNull());
    expect(onClaimed).not.toHaveBeenCalled();
  });

  it('toque duplo: UMA chamada ao servidor', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockResolvedValue(pendente());
    vi.mocked(claimGuildReward).mockReturnValue(new Promise(() => {}));
    await montar({ onClaimed: vi.fn() });
    await waitFor(() => expect(colhe()).toBeTruthy());
    fireEvent.click(colhe()!);
    fireEvent.click(colhe()!);
    expect(claimGuildReward).toHaveBeenCalledTimes(1);
  });

  it.each([['alreadyClaimed', 409], ['nothingToClaim', 404]] as const)('%s (%i): SILÊNCIO — o cartão some, sem alerta e sem crédito', async (kind, status) => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockResolvedValue(pendente());
    vi.mocked(claimGuildReward).mockRejectedValue(new GuildError(kind, status));
    const onClaimed = vi.fn();
    await montar({ onClaimed });
    await waitFor(() => expect(colhe()).toBeTruthy());
    fireEvent.click(colhe()!);
    await waitFor(() => expect(colhe()).toBeNull());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onClaimed).not.toHaveBeenCalled();
  });

  it('fechar a folha no meio do pedido NÃO perde o crédito (é do App)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockResolvedValue(pendente());
    let resolver!: (c: GuildClaim) => void;
    vi.mocked(claimGuildReward).mockReturnValue(new Promise(r => { resolver = r; }));
    const onClaimed = vi.fn();
    const r = await montar({ onClaimed });
    await waitFor(() => expect(colhe()).toBeTruthy());
    fireEvent.click(colhe()!);
    r.unmount();
    await act(async () => { resolver(recibo()); });
    expect(onClaimed).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(STORAGE_KEYS.GUILD_CLAIMED)).toContain('rc-1');
  });

  it('falha ao PERGUNTAR o que há para colher é silêncio (nada de tela de erro por isso)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockRejectedValue(new GuildError('unavailable', 0));
    await montar();
    await waitFor(() => expect(getGuildRewards).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(botao()).toBeTruthy();
  });

  it('a rodada que dissipa abre o direito da semana corrente: as recompensas são perguntadas de novo', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(hitGuildRaid).mockResolvedValue(vista({ state: 'dissipada', hitToday: true }));
    await montar();
    await waitFor(() => expect(getGuildRewards).toHaveBeenCalledTimes(1));
    fireEvent.click(botao()!);
    await waitFor(() => expect(getGuildRewards).toHaveBeenCalledTimes(2));
  });

  it('os cenários que o servidor diz liberados vão ao App (`onScenes`), só ids do Bosque', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockResolvedValue({ ...semPendencia, scenes: ['bg-guild-clareira', 'bg-guild-ramagem'] });
    const onScenes = vi.fn();
    await montar({ onScenes });
    await waitFor(() => expect(onScenes).toHaveBeenCalledWith(['bg-guild-clareira', 'bg-guild-ramagem']));
  });
});

describe('salas: a Feira e o Salão não se misturam', () => {
  it('sem guilda na Feira: uma linha diz o que a Feira é, depois o convite do Salão (criar/entrar), sem fenômeno e sem cobrança', async () => {
    vi.mocked(getGuild).mockResolvedValue(null);
    await montar();
    expect(screen.getByText(PT('guild.feira.semroda'))).toBeTruthy();
    expect(screen.getByText(PT('guild.salao.vazio.corpo'))).toBeTruthy();
    expect(screen.getByText(PT('guild.criar.botao'))).toBeTruthy();
    expect(visor()).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('sem guilda, o direito continua: quem SAIU ainda vê o cartão de colher (o direito é da pessoa — L3 A-1)', async () => {
    vi.mocked(getGuild).mockResolvedValue(null);
    vi.mocked(getGuildRewards).mockResolvedValue(pendente());
    vi.mocked(claimGuildReward).mockResolvedValue(recibo());
    const colhe = () => document.querySelector('[data-feira-colher]') as HTMLButtonElement | null;
    const onClaimed = vi.fn();
    await montar({ onClaimed });
    await waitFor(() => expect(colhe()).toBeTruthy());
    fireEvent.click(colhe()!);
    await waitFor(() => expect(onClaimed).toHaveBeenCalledWith({ emblems: RAID_EMBLEMS, trophyId: null }));
    // ... e o mesmo no Salão sem roda
    cleanup();
    vi.mocked(getGuildRewards).mockResolvedValue(pendente('recuou', '2026-W38'));
    await montar({ room: 'salao', onClaimed: vi.fn() });
    await waitFor(() => expect(colhe()).toBeTruthy());
  });

  it('L3 A-1: SAIR da roda com a folha aberta pergunta o resgate de novo — o direito sobrevive à saída', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockResolvedValueOnce(semPendencia).mockResolvedValue(pendente());
    vi.mocked(leaveGuild).mockResolvedValue({ ok: true });
    await montar({ room: 'salao' });
    await waitFor(() => expect(getGuildRewards).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText(PT('guild.sair.botao')));
    await waitFor(() => expect(screen.getByText(PT('guild.criar.botao'))).toBeTruthy());
    await waitFor(() => expect(document.querySelector('[data-feira-colher]')).toBeTruthy());
    expect(getGuildRewards).toHaveBeenCalledTimes(2);
  });

  it('a Feira não desenha Bosque, Roda, Mural nem sair; o Salão não desenha a Feira', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    await montar();
    for (const s of ['bosque', 'roda', 'mural']) expect(document.querySelector(`[data-guild-room="${s}"]`)).toBeNull();
    expect(screen.queryByText(PT('guild.sair.botao'))).toBeNull();
    cleanup();
    await montar({ room: 'salao' });
    expect(document.querySelector('[data-guild-room="feira"]')).toBeNull();
    expect(document.querySelector('[data-guild-room="bosque"]')).toBeTruthy();
  });

  it('o resgate também aparece no Salão (a pessoa colhe onde abrir primeiro)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    vi.mocked(getGuildRewards).mockResolvedValue(pendente());
    await montar({ room: 'salao' });
    await waitFor(() => expect(document.querySelector('[data-feira-colher]')).toBeTruthy());
  });
});

describe('o lote Feira da Arena abre a sala Feira, e o voltar fecha a folha certa', () => {
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent');
  beforeEach(() => { Object.defineProperty(HTMLElement.prototype, 'offsetParent', { get() { return this.parentNode; }, configurable: true }); });
  afterEach(() => {
    if (original) Object.defineProperty(HTMLElement.prototype, 'offsetParent', original);
    else delete (HTMLElement.prototype as { offsetParent?: unknown }).offsetParent;
  });
  const arena = () => (
    <AreaView {...({ area: 'arena', language: 'pt-BR', guild: { saveId: 'save-12345678', metaDoDiaCumprida: true }, tournament: {}, ownership: {}, actions: {} } as unknown as AreaViewProps)} />
  );

  it('o lote `feira` da Arena (e só ele) abre a Feira; não existe mais o lote `guilda` na Arena', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    const r = renderWithCss(arena());
    expect(r.container.querySelector('[data-area-lot="guilda"]')).toBeNull();
    const lote = r.container.querySelector('[data-area-lot="feira"]') as HTMLElement;
    expect(lote.getAttribute('aria-label')).toBe(PT('guild.lote.feira.aria'));
    fireEvent.click(lote);
    await waitFor(() => expect(visor()).toBeTruthy());
    expect(document.querySelector('[data-guild-room-open="feira"]')).toBeTruthy();
    expect(document.querySelector('[data-area-sheet-npc-line]')!.textContent).toContain(PT('guild.npc.feira'));
    expect(document.querySelector('[data-area-sheet-npc-line]')!.textContent).toContain('Fanfare');
  });

  it('o voltar do Android fecha a Feira e devolve o foco ao lote', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista());
    const r = renderWithCss(arena());
    const lote = r.container.querySelector('[data-area-lot="feira"]') as HTMLElement;
    lote.focus();
    fireEvent.click(lote);
    await waitFor(() => expect(visor()).toBeTruthy());
    let consumiu = false;
    await act(async () => { consumiu = closeTopBackLayer(); });
    expect(consumiu).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(lote);
  });
});

describe('fonte: nada de HP/dano/contagem na Feira e o FX para no movimento reduzido', () => {
  const ler = (rel: string) => fs.readFileSync(path.resolve(__dirname, rel), 'utf8');

  it('o tipo GuildRaid e a folha não têm onde carregar dano, HP, contagem de rodadas nem quem bateu', () => {
    const community = ler('../../utils/community.ts');
    const raid = community.slice(community.indexOf('export interface GuildRaid'), community.indexOf('export type GuildErrorKind'));
    expect(raid.length).toBeGreaterThan(100);
    expect(raid).not.toMatch(/\b(hp|dmg|damage|dano|hits?|hitters|count|total|percent|hpBand|band)\b\s*[?:]/i);
    for (const rel of ['./GuildSheet.tsx', './FeiraVisor.tsx', '../../utils/fairArt.ts']) {
      const codigo = ler(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      expect(codigo, rel).not.toMatch(/\b(hpBand|dmg|damage|hitters|raidHp|dano)\b/i);
      expect(codigo, rel).not.toMatch(/<progress|role="(progressbar|meter)"|aria-valuenow/);
    }
  });

  it('o CSS corta o FX no bloco canônico de movimento reduzido', () => {
    const css = ler('../../index.css');
    const ultimo = css.slice(css.lastIndexOf('@media (prefers-reduced-motion'));
    expect(ultimo).toMatch(/\.sm2-fair-fx\s*\{\s*animation:\s*none\s*!important/);
  });
});
