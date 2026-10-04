// @vitest-environment jsdom
/**
 * A GUILDA na tela (fatia A do cliente, `docs/PLANO-GUILDA.md`).
 *
 * Não conferem se "funciona" — conferem o que, se cair, faz a Guilda virar o que
 * a pesquisa do projeto manda evitar (02-psicologia §7.2, LV-G1/G2/G5):
 *
 *  1. nenhum número por pessoa e nenhuma barra de progresso; presença nominal SÓ
 *     com até 4 membros, só em quem veio, sem ordenar; com 5+, silêncio ou uma
 *     frase qualitativa — nunca `{n}`;
 *  2. sair é um toque, sem diálogo;
 *  3. falha de carga NÃO é "sem roda" (achado ALTO #16 do QA) e 401 não é formulário morto;
 *  4. cada erro tem a própria frase, PT e EN;
 *  5. teclado: o foco nunca cai em `<body>`, o fundo fica inerte e o voltar do
 *     Android fecha a folha de verdade.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent, cleanup, act, within } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';

vi.mock('../../utils/community', async (orig) => {
  const real = await orig<typeof import('../../utils/community')>();
  return {
    ...real,
    getGuild: vi.fn(), createGuild: vi.fn(), joinGuild: vi.fn(), guildThread: vi.fn(), guildGesture: vi.fn(),
    leaveGuild: vi.fn(), renameGuild: vi.fn(), newGuildCode: vi.fn(),
  };
});
vi.mock('../../utils/telemetry', async (orig) => ({ ...(await orig<typeof import('../../utils/telemetry')>()), track: vi.fn() }));

import {
  GuildError, sanitizeGuildView, getGuild, createGuild, joinGuild, guildThread, guildGesture, leaveGuild,
  renameGuild, newGuildCode, type GuildView, type GuildErrorKind,
} from '../../utils/community';
import { track } from '../../utils/telemetry';
import { GuildSheet } from './GuildSheet';
import { AreaView, type AreaViewProps } from '../nav/AreaView';
import { closeTopBackLayer } from '../../utils/backStack';
import { GUILD_COPY } from '../../utils/guildCopy';
import { resetGroveMemoryForTests } from '../../utils/groveLocal';
import { resetClaimMemoryForTests } from '../../utils/guildClaimLocal';

const PT = (k: keyof typeof GUILD_COPY) => GUILD_COPY[k][0];
const EN = (k: keyof typeof GUILD_COPY) => GUILD_COPY[k][1];

/** Uma vista como o SERVIDOR a monta (`vistaDaGuilda`), passada pelo higienizador do cliente. */
/** O id OPACO do membro que o servidor manda (`memberId`, 16 hex por guilda) — a vista não tem mais `pid`. */
const mid = (i: number) => `a1b2c3d4e5f6a7${i.toString(16).padStart(2, '0')}`;
const membros = (n: number, veio: number[] = [], eu = 0) =>
  Array.from({ length: n }, (_, i) => ({
    id: mid(i), memberId: mid(i), name: ['Ana', 'Bia', 'Caio', 'Dani', 'Edu', 'Fabi', 'Gil', 'Hana', 'Ivo', 'Jade', 'Kai', 'Lia'][i],
    euMesmo: i === eu, ...(n <= 4 ? { apareceuHoje: veio.includes(i) } : {}),
  }));

function vista(n: number, over: Record<string, unknown> = {}, veio: number[] = []): GuildView {
  return sanitizeGuildView({
    id: 'g1', name: 'Roda da manhã', weekKey: '2026-W40', code: 'ABCD2345', isHost: false, size: n, full: n >= 12,
    members: membros(n, veio),
    presence: n <= 4 ? membros(n, veio).map(m => ({ memberId: m.memberId, cameToday: m.apareceuHoje })) : null,
    threadedToday: null, mine: { cameToday: veio.includes(0), threadToday: veio.includes(0) }, progress: 3, target: n * 5,
    bosque: { stage: null, stageIndex: 0, perto: false, tide: { key: 'T1', size: null }, ornaments: [] }, gestures: [],
    ...over,
  })!;
}

const props = (over: Partial<React.ComponentProps<typeof GuildSheet>> = {}) => ({
  saveId: 'save-12345678', language: 'pt-BR' as const, metaDoDiaCumprida: true, ...over,
});
const erro = (kind: GuildErrorKind, guild?: GuildView | null) => new GuildError(kind, 0, guild);
const montar = async (over = {}) => {
  const r = renderWithCss(<GuildSheet {...props(over)} />);
  await waitFor(() => expect(screen.queryByText(PT('guild.salao.carregando'))).toBeNull());
  return r;
};

beforeEach(() => {
  for (const f of [getGuild, createGuild, joinGuild, guildThread, guildGesture, leaveGuild, renameGuild, newGuildCode]) vi.mocked(f).mockReset();
  vi.mocked(track).mockReset();
  localStorage.clear();
  resetGroveMemoryForTests();
  resetClaimMemoryForTests();
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe('sem roda', () => {
  it('não ter roda NÃO é erro: convite a criar e a entrar, sem alerta', async () => {
    vi.mocked(getGuild).mockResolvedValue(null);
    await montar();
    expect(screen.getByText(PT('guild.salao.vazio.corpo'))).toBeTruthy();
    expect(screen.getByText(PT('guild.criar.botao'))).toBeTruthy();
    expect(screen.getByText(PT('guild.entrar.botao.abrir'))).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    // entra-se por CÓDIGO: nenhum campo de busca
    expect(screen.queryByPlaceholderText(/buscar|search/i)).toBeNull();
  });

  it('carregando: texto de espera e a região viva já montada', async () => {
    vi.mocked(getGuild).mockReturnValue(new Promise(() => {}));
    renderWithCss(<GuildSheet {...props()} />);
    expect(screen.getByText(PT('guild.salao.carregando'))).toBeTruthy();
    expect(document.querySelector('[data-guild-status][role="status"]')).toBeTruthy();
  });

  it('criar exige nome; cria com o dia do jogador e mostra a roda de UM com o convite', async () => {
    vi.mocked(getGuild).mockResolvedValue(null);
    vi.mocked(createGuild).mockResolvedValue(vista(1, { isHost: true }));
    const tz = { tz: 'America/Sao_Paulo', offsetMs: -10_800_000 } as never;
    await montar({ playerDayTz: tz });
    const botao = screen.getByText(PT('guild.criar.botao')).closest('button')!;
    expect(botao.disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText(PT('guild.criar.nome.placeholder')), { target: { value: '  Roda nova ' } });
    expect(botao.disabled).toBe(false);
    fireEvent.click(botao);
    await screen.findByRole('heading', { name: 'Roda da manhã' });
    expect(createGuild).toHaveBeenCalledWith('save-12345678', 'Roda nova', tz);
    expect(screen.getByText('Compartilhe este código com até 11 pessoas.')).toBeTruthy();
    expect(screen.getByText('ABCD2345')).toBeTruthy();
  });

  it('código: só o alfabeto do código (sem 0/O/1/I), 8 posições; inválido vira a frase própria', async () => {
    vi.mocked(getGuild).mockResolvedValue(null);
    vi.mocked(joinGuild).mockRejectedValue(erro('invalidCode'));
    await montar();
    fireEvent.click(screen.getByText(PT('guild.entrar.botao.abrir')));
    const campo = await screen.findByPlaceholderText('ABCD2345') as HTMLInputElement;
    await waitFor(() => expect(document.activeElement).toBe(campo));
    fireEvent.change(campo, { target: { value: 'o0i1-abcd234' } });
    expect(campo.value).toBe('ABCD234');
    const entrar = screen.getByText(PT('guild.entrar.botao')).closest('button')!;
    expect(entrar.disabled).toBe(true);
    fireEvent.change(campo, { target: { value: 'ABCD2345' } });
    expect(entrar.disabled).toBe(false);
    fireEvent.click(entrar);
    expect((await screen.findByRole('alert')).textContent).toBe(PT('guild.erro.codigo'));
    expect(campo.value).toBe('ABCD2345'); // preservado
  });

  it.each<[GuildErrorKind, keyof typeof GUILD_COPY]>([
    ['full', 'guild.erro.cheia'],
    ['collision', 'guild.erro.colisao'],
    ['rateLimit', 'guild.erro.muitosToques'],
    ['unavailable', 'guild.erro.semRede'],
    ['server', 'guild.erro.generico'],
    ['invalidName', 'guild.erro.nome'],
  ])('erro %s → a própria frase (PT e EN), em âmbar, nunca genérica onde há texto', async (kind, chave) => {
    vi.mocked(getGuild).mockResolvedValue(null);
    vi.mocked(joinGuild).mockRejectedValue(erro(kind));
    for (const [language, txt] of [['pt-BR', PT], ['en-US', EN]] as const) {
      cleanup();
      await montar({ language });
      fireEvent.click(screen.getByText(txt('guild.entrar.botao.abrir')));
      fireEvent.change(await screen.findByPlaceholderText('ABCD2345'), { target: { value: 'ABCD2345' } });
      fireEvent.click(screen.getByText(txt('guild.entrar.botao')));
      const alerta = await screen.findByRole('alert');
      expect(alerta.textContent).toBe(txt(chave));
      expect(alerta.className).toContain('sm2-lib-alert'); // âmbar (`gold-ink`), nunca `danger`
    }
  });

  it('409 já em outra: MOSTRA a roda que já tem, com a saída à mão (#10)', async () => {
    vi.mocked(getGuild).mockResolvedValue(null);
    vi.mocked(createGuild).mockRejectedValue(erro('alreadyIn', vista(2, { name: 'A que eu tinha' })));
    await montar();
    fireEvent.change(screen.getByPlaceholderText(PT('guild.criar.nome.placeholder')), { target: { value: 'Nova' } });
    fireEvent.click(screen.getByText(PT('guild.criar.botao')));
    await screen.findByRole('heading', { name: 'A que eu tinha' });
    expect(screen.getByRole('alert').textContent).toBe(PT('guild.erro.jaEmOutra'));
    expect(screen.getByText(PT('guild.sair.botao'))).toBeTruthy();
    expect(screen.queryByText(PT('guild.criar.botao'))).toBeNull(); // sem beco
  });

  it('409 já em outra SEM vista (entrar por código): recarrega e mostra a roda', async () => {
    vi.mocked(getGuild).mockResolvedValueOnce(null).mockResolvedValue(vista(2, { name: 'Recarregada' }));
    vi.mocked(joinGuild).mockRejectedValue(erro('alreadyIn'));
    await montar();
    fireEvent.click(screen.getByText(PT('guild.entrar.botao.abrir')));
    fireEvent.change(await screen.findByPlaceholderText('ABCD2345'), { target: { value: 'ABCD2345' } });
    fireEvent.click(screen.getByText(PT('guild.entrar.botao')));
    await screen.findByRole('heading', { name: 'Recarregada' });
    expect(screen.getByRole('alert').textContent).toBe(PT('guild.erro.jaEmOutra'));
  });

  it('a roda sumiu com a folha aberta (404 no fio): conta o fato e volta ao começo', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(2, {}, []));
    vi.mocked(guildThread).mockRejectedValue(erro('noGuild'));
    await montar();
    fireEvent.click(screen.getByText(PT('guild.bosque.fio.botao')));
    expect((await screen.findByRole('alert')).textContent).toBe(PT('guild.esvaziada.mundo'));
    expect(screen.getByText(PT('guild.criar.botao'))).toBeTruthy();
  });
});

describe('falha de carga NÃO é "sem roda" (#16)', () => {
  it('rede/5xx ao abrir: só o alerta e "tentar de novo" — nenhum formulário de criar', async () => {
    vi.mocked(getGuild).mockRejectedValueOnce(erro('unavailable')).mockResolvedValue(vista(2));
    await montar();
    expect(screen.getByRole('alert').textContent).toBe(PT('guild.erro.semRede'));
    expect(screen.queryByText(PT('guild.criar.botao'))).toBeNull();
    expect(screen.queryByText(PT('guild.entrar.botao.abrir'))).toBeNull();
    fireEvent.click(screen.getByText(PT('guild.erro.tentar')));
    await screen.findByRole('heading', { name: 'Roda da manhã' });
    expect(getGuild).toHaveBeenCalledTimes(2);
  });

  it('429 ao abrir tem a frase de espera, não a de "servidor"', async () => {
    vi.mocked(getGuild).mockRejectedValue(erro('rateLimit'));
    await montar();
    expect(screen.getByRole('alert').textContent).toBe(PT('guild.erro.muitosToques'));
    expect(screen.getByText(PT('guild.erro.tentar'))).toBeTruthy();
  });

  it('offline (fetch rejeitou) nos dois idiomas', async () => {
    vi.mocked(getGuild).mockRejectedValue(erro('unavailable'));
    await montar({ language: 'en-US' });
    expect(screen.getByRole('alert').textContent).toBe(EN('guild.erro.semRede'));
    expect(screen.getByText(EN('guild.erro.tentar'))).toBeTruthy();
  });

  it('401: NUNCA é beco — texto, caminho até Entrar e "tentar de novo"; SEM formulário morto (L3 A1)', async () => {
    vi.mocked(getGuild).mockRejectedValue(erro('login'));
    const onLogin = vi.fn();
    await montar({ onLogin });
    expect(screen.getByRole('alert').textContent).toBe(PT('guild.erro.semLogin'));
    expect(screen.queryByRole('textbox')).toBeNull();
    fireEvent.click(screen.getByText(PT('guild.erro.entrar')));
    expect(onLogin).toHaveBeenCalledTimes(1);
    // "Tentar de novo" serve a quem acabou de entrar: relê e, com sessão, mostra a roda.
    vi.mocked(getGuild).mockResolvedValue(null);
    fireEvent.click(screen.getByText(PT('guild.erro.tentar')));
    await screen.findByText(PT('guild.criar.botao'));
    expect(getGuild).toHaveBeenCalledTimes(2);
  });

  it('401 de conta DEMO: a frase é a do demo e o convite é o `UnlockNudge` (nunca abre sozinho)', async () => {
    vi.mocked(getGuild).mockRejectedValue(erro('login'));
    const onUnlock = vi.fn();
    await montar({ accountTier: 'demo', onUnlock, onLogin: vi.fn() });
    expect(screen.getByRole('alert').textContent).toBe(PT('guild.erro.demo'));
    const nudge = document.querySelector('[data-guild-unlock] button') as HTMLButtonElement;
    expect(nudge).toBeTruthy();
    expect(onUnlock).not.toHaveBeenCalled();
    fireEvent.click(nudge);
    expect(onUnlock).toHaveBeenCalledTimes(1);
    // conta paga sem sessão: só o texto de entrar (sem convite de compra)
    cleanup();
    await montar({ accountTier: 'paid', onUnlock, onLogin: vi.fn() });
    expect(document.querySelector('[data-guild-unlock]')).toBeNull();
    expect(screen.getByRole('alert').textContent).toBe(PT('guild.erro.semLogin'));
  });

  it('401 no meio de uma ação leva à mesma tela', async () => {
    vi.mocked(getGuild).mockResolvedValue(null);
    vi.mocked(createGuild).mockRejectedValue(erro('login'));
    await montar();
    fireEvent.change(screen.getByPlaceholderText(PT('guild.criar.nome.placeholder')), { target: { value: 'X' } });
    fireEvent.click(screen.getByText(PT('guild.criar.botao')));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(PT('guild.erro.semLogin')));
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});

describe('a roda por tamanho', () => {
  const textoDaRoda = () => screen.getByRole('region', { name: 'Roda' });

  it('1 membro: texto de convite (teto − 1), sem barra e sem marca de presença', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(1, { isHost: true }));
    await montar();
    expect(screen.getByText('Compartilhe este código com até 11 pessoas.')).toBeTruthy();
    expect(screen.getByText('1 na roda')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('4 membros: a marca é SÓ em quem veio; quem não veio fica sem marca, na ordem de chegada', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(4, {}, [0, 2]));
    await montar();
    const itens = within(textoDaRoda()).getAllByRole('listitem');
    expect(itens.map(li => li.querySelector('.t')!.textContent)).toEqual(['Ana', 'Bia', 'Caio', 'Dani']);
    expect(itens.map(li => !!li.querySelector('.sm2-guild-pres'))).toEqual([true, false, true, false]);
    // nenhum estado de ausência, nenhum ícone de estado, nenhum número por pessoa
    expect(textoDaRoda().textContent).not.toMatch(/ainda n[aã]o|not yet|ausen|absent|falt/i);
    expect(itens[1].querySelector('.material-symbols-rounded, [data-icon], svg')).toBeNull();
    expect(itens.map(li => li.textContent).join(' ').replace('4 na roda', '')).not.toMatch(/\d/);
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByText('4 na roda')).toBeTruthy();
  });

  it('4 membros, ninguém veio: nenhuma marca em ninguém (silêncio, não uma lista de "não")', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(4, {}, []));
    await montar();
    expect(document.querySelectorAll('.sm2-guild-pres').length).toBe(0);
  });

  it('presença de outro dia NÃO aparece (só o dia corrente): a vista veio de um dia e agora é outro', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-29T12:00:00Z'));
    vi.mocked(getGuild).mockResolvedValue(vista(4, { isHost: true }, [0, 1]));
    renderWithCss(<GuildSheet {...props()} />);
    await screen.findByRole('heading', { name: 'Roda da manhã' });
    expect(document.querySelectorAll('.sm2-guild-pres').length).toBe(2);
    vi.setSystemTime(new Date('2026-09-30T12:00:00Z'));
    // qualquer re-render depois da virada (aqui, abrir os ajustes) não pode reviver a presença antiga
    fireEvent.click(screen.getByLabelText(PT('guild.ajustes.aria')));
    expect(document.querySelectorAll('.sm2-guild-pres').length).toBe(0);
  });

  it('5 membros SEM fio hoje: só nomes — SILÊNCIO, nenhuma frase de agregado', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(5, { threadedToday: null }));
    await montar();
    expect(document.querySelectorAll('.sm2-guild-pres').length).toBe(0);
    expect(document.querySelector('[data-guild-agregado]')).toBeNull();
    expect(screen.queryByText(PT('guild.bosque.agregado.um'))).toBeNull();
  });

  it('5 membros COM fio: UMA frase qualitativa, sem número, sem {n}', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(5, { threadedToday: true }));
    await montar();
    const frase = screen.getByText(PT('guild.bosque.agregado.um'));
    expect(frase.textContent).not.toMatch(/\d|\{/);
    expect(document.body.textContent).not.toMatch(/\{n\}/);
  });

  it('5 membros: mesmo que o servidor mande presença por pessoa, a UI NÃO a desenha (LV-G2)', async () => {
    const cru = { ...vista(5) } as GuildView;
    cru.members = cru.members.map((m, i) => ({ ...m, apareceuHoje: i < 3 }));
    vi.mocked(getGuild).mockResolvedValue(cru);
    await montar();
    expect(document.querySelectorAll('.sm2-guild-pres').length).toBe(0);
  });

  it('12 membros: a roda inteira em ordem de chegada, sem estado, sem número por pessoa', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(12, { threadedToday: true }));
    await montar();
    const itens = within(textoDaRoda()).getAllByRole('listitem');
    expect(itens).toHaveLength(12);
    expect(itens[0].textContent).toContain('Ana');
    expect(itens[11].textContent).toContain('Lia');
    expect(document.querySelectorAll('.sm2-guild-pres').length).toBe(0);
    expect(screen.getByText('12 na roda')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});

describe('o fio (presença de quem pergunta)', () => {
  it('sem a meta própria do dia: SILÊNCIO — nenhum botão, nenhuma frase de explicação', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(2, {}, []));
    await montar({ metaDoDiaCumprida: false });
    expect(screen.queryByText(PT('guild.bosque.fio.botao'))).toBeNull();
    // a frase de explicação do CoopPanel ('Vale quando você cumprir…') saiu; a regra sóbria do Bosque é linha FIXA, não estado
    expect(screen.queryByText(/Vale quando|Counts once/i)).toBeNull();
    // O visor existe (o cenário nasce antes de tudo), mas o fio NÃO fala: nem botão, nem "hoje", nem título de estado.
    expect(screen.queryByRole('button', { name: PT('guild.aria.fio') })).toBeNull();
    expect(screen.queryByText(PT('guild.bosque.fio.hoje'))).toBeNull();
  });

  it('com a meta cumprida: firma, anuncia na região viva e mostra "seu fio firmou hoje"', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(2, {}, []));
    vi.mocked(guildThread).mockResolvedValue(vista(2, {}, [0]));
    await montar();
    fireEvent.click(screen.getByText(PT('guild.bosque.fio.botao')));
    await screen.findByText(PT('guild.bosque.fio.hoje'));
    expect(screen.queryByText(PT('guild.bosque.fio.botao'))).toBeNull();
    expect(document.querySelector('[data-guild-status]')!.textContent).toBe(PT('guild.bosque.fio.toast'));
    expect(guildThread).toHaveBeenCalledWith('save-12345678', undefined, undefined);
  });

  it('duplo toque no mesmo frame chama o servidor UMA vez (trava síncrona)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(2, {}, []));
    vi.mocked(guildThread).mockImplementation(() => new Promise(() => {}));
    await montar();
    const b = screen.getByText(PT('guild.bosque.fio.botao')).closest('button')!;
    // Dois toques no MESMO lote do React: o `disabled` ainda não chegou ao DOM.
    act(() => { b.click(); b.click(); });
    expect(guildThread).toHaveBeenCalledTimes(1);
  });

  it('já firmado hoje: sem botão de novo', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(2, {}, [0]));
    await montar();
    expect(screen.queryByText(PT('guild.bosque.fio.botao'))).toBeNull();
    expect(screen.getByText(PT('guild.bosque.fio.hoje'))).toBeTruthy();
  });
});

describe('anfitrião × membro, e ajustes', () => {
  it('membro não vê ajustes, renomear nem código novo', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(3));
    await montar();
    expect(screen.queryByLabelText(PT('guild.ajustes.aria'))).toBeNull();
    expect(screen.queryByText(PT('guild.ajustes.codigoNovo'))).toBeNull();
  });

  it('anfitrião: ajustes abrem, renomeia e gera código novo', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(3, { isHost: true }));
    vi.mocked(renameGuild).mockResolvedValue(vista(3, { isHost: true, name: 'Outro nome' }));
    vi.mocked(newGuildCode).mockResolvedValue(vista(3, { isHost: true, code: 'ZZZZ9999' }));
    await montar();
    const engrenagem = screen.getByLabelText(PT('guild.ajustes.aria'));
    expect(engrenagem.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(engrenagem);
    expect(engrenagem.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(PT('guild.ajustes.somenteAbriu'))).toBeTruthy();
    const salvar = screen.getByText(PT('guild.ajustes.renomear.salvar')).closest('button')!;
    expect(salvar.disabled).toBe(true); // mesmo nome
    fireEvent.change(screen.getByLabelText(PT('guild.ajustes.renomear')), { target: { value: 'Outro nome' } });
    fireEvent.click(salvar);
    await screen.findByRole('heading', { name: 'Outro nome' });
    expect(renameGuild).toHaveBeenCalledWith('save-12345678', 'Outro nome', undefined);
    fireEvent.click(screen.getByText(PT('guild.ajustes.codigoNovo')));
    await screen.findByText('ZZZZ9999');
    expect(screen.getByText(PT('guild.ajustes.codigoNovo.nota'))).toBeTruthy();
  });

  it('nome recusado (400) no renomear: alerta próprio, nome preservado', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(3, { isHost: true }));
    vi.mocked(renameGuild).mockRejectedValue(erro('invalidName'));
    await montar();
    fireEvent.click(screen.getByLabelText(PT('guild.ajustes.aria')));
    fireEvent.change(screen.getByLabelText(PT('guild.ajustes.renomear')), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText(PT('guild.ajustes.renomear.salvar')));
    expect((await screen.findByRole('alert')).textContent).toBe(PT('guild.erro.nome'));
  });

  it('403 not host (o papel passou): recarrega, sem dizer que a pessoa errou', async () => {
    vi.mocked(getGuild).mockResolvedValueOnce(vista(3, { isHost: true })).mockResolvedValue(vista(3, { isHost: false }));
    vi.mocked(newGuildCode).mockRejectedValue(erro('notHost'));
    await montar();
    fireEvent.click(screen.getByLabelText(PT('guild.ajustes.aria')));
    fireEvent.click(screen.getByText(PT('guild.ajustes.codigoNovo')));
    await waitFor(() => expect(screen.queryByLabelText(PT('guild.ajustes.aria'))).toBeNull());
  });
});

describe('sair é limpo (LV-G5)', () => {
  it('um toque, SEM diálogo de confirmação, e a tela volta a oferecer criar/entrar', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(getGuild).mockResolvedValue(vista(3));
    vi.mocked(leaveGuild).mockResolvedValue({ ok: true });
    await montar();
    // "Sair" está na primeira tela, sem abrir ajustes nem rolar por um menu
    fireEvent.click(screen.getByText(PT('guild.sair.botao')));
    await screen.findByText(PT('guild.criar.botao'));
    expect(leaveGuild).toHaveBeenCalledTimes(1);
    expect(leaveGuild).toHaveBeenCalledWith('save-12345678');
    expect(confirmar).not.toHaveBeenCalled();
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('a nota é só o fato', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(3));
    await montar();
    expect(screen.getByText(PT('guild.sair.nota'))).toBeTruthy();
  });

  it('sair com 500: a roda permanece e o alerta é âmbar', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(3));
    vi.mocked(leaveGuild).mockRejectedValue(erro('server'));
    await montar();
    fireEvent.click(screen.getByText(PT('guild.sair.botao')));
    expect((await screen.findByRole('alert')).textContent).toBe(PT('guild.erro.generico'));
    expect(screen.getByRole('heading', { name: 'Roda da manhã' })).toBeTruthy();
  });
});

describe('copiar o código, sem setState depois de desmontar', () => {
  it('mostra "Copiado" por ~2 s, anuncia e volta', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    vi.mocked(getGuild).mockResolvedValue(vista(3));
    renderWithCss(<GuildSheet {...props()} />);
    await screen.findByRole('heading', { name: 'Roda da manhã' });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await act(async () => { fireEvent.click(screen.getByLabelText(PT('guild.aria.codigo.copiar'))); });
    expect(writeText).toHaveBeenCalledWith('ABCD2345');
    expect(screen.getByText(PT('guild.codigo.copiado'), { selector: 'span[aria-hidden]' })).toBeTruthy();
    expect(document.querySelector('[data-guild-status]')!.textContent).toBe(PT('guild.codigo.copiado'));
    await act(async () => { vi.advanceTimersByTime(2100); });
    expect(screen.queryByText(PT('guild.codigo.copiado'), { selector: 'span[aria-hidden]' })).toBeNull();
  });

  it('fechar a folha antes dos 2 s não deixa timer nem setState órfão', async () => {
    const erros = vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
    vi.mocked(getGuild).mockResolvedValue(vista(3));
    const r = renderWithCss(<GuildSheet {...props()} />);
    await screen.findByRole('heading', { name: 'Roda da manhã' });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await act(async () => { fireEvent.click(screen.getByLabelText(PT('guild.aria.codigo.copiar'))); });
    r.unmount();
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => { vi.advanceTimersByTime(3000); });
    expect(erros).not.toHaveBeenCalled();
  });

  it('desmontar com a requisição em voo não faz setState nem console.error', async () => {
    const erros = vi.spyOn(console, 'error').mockImplementation(() => {});
    let resolver!: (v: GuildView) => void;
    vi.mocked(getGuild).mockResolvedValue(vista(2, {}, []));
    vi.mocked(guildThread).mockImplementation(() => new Promise(r => { resolver = r; }));
    const r = renderWithCss(<GuildSheet {...props()} />);
    fireEvent.click(await screen.findByText(PT('guild.bosque.fio.botao')));
    r.unmount();
    await act(async () => { resolver(vista(2, {}, [0])); });
    expect(erros).not.toHaveBeenCalled();
  });
});

describe('voltar ao app recarrega (visibilitychange)', () => {
  it('só com a página visível, e uma falha silenciosa não derruba a tela boa', async () => {
    vi.mocked(getGuild).mockResolvedValueOnce(vista(4, {}, [0])).mockResolvedValueOnce(vista(4, {}, [0, 1]));
    await montar();
    expect(document.querySelectorAll('.sm2-guild-pres').length).toBe(1);
    const oculto = vi.spyOn(document, 'hidden', 'get');
    oculto.mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(getGuild).toHaveBeenCalledTimes(1);
    oculto.mockReturnValue(false);
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    await waitFor(() => expect(document.querySelectorAll('.sm2-guild-pres').length).toBe(2));
    vi.mocked(getGuild).mockRejectedValue(erro('unavailable'));
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(document.querySelectorAll('.sm2-guild-pres').length).toBe(2);
  });
});

describe('layout: nome longo e "· você" (#4, #14)', () => {
  it('o nome quebra em qualquer ponto e o card pode encolher', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(2, { name: 'WWWWWWWWWWWWWWWWWWWWWWWW' }));
    await montar();
    const h = screen.getByRole('heading', { name: 'WWWWWWWWWWWWWWWWWWWWWWWW' });
    const css = getComputedStyle(h);
    expect(css.overflowWrap).toBe('anywhere');
    expect(css.minWidth).toBe('0px');
    expect(getComputedStyle(h.closest('.sm2-stats-card')!).minWidth).toBe('0px');
  });

  it('o "· você" é IRMÃO do nome truncável, nunca filho (não é cortado junto)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(2, {}, []));
    await montar();
    const t = document.querySelector('.sm2-coop-mem li .t')!;
    expect(t.textContent).toBe('Ana');
    const voce = t.nextElementSibling as HTMLElement;
    // O ponto é enfeite (aria-hidden); o leitor de tela lê só "você" (L3-copy).
    expect(voce.querySelector('[aria-hidden="true"]')!.textContent).toBe(PT('guild.roda.voce'));
    expect(voce.querySelector('.sm2-guild-sr')!.textContent).toBe('você');
    expect(getComputedStyle(voce).flexShrink).toBe('0');
    expect(getComputedStyle(t).textOverflow).toBe('ellipsis');
  });

  it('membro sem apelido vira "Alguém"/"Someone"', async () => {
    const v = vista(2);
    v.members[1] = { ...v.members[1], name: null };
    vi.mocked(getGuild).mockResolvedValue(v);
    await montar({ language: 'en-US' });
    expect(screen.getByText('Someone')).toBeTruthy();
  });
});

describe('a folha aberta de verdade (Hall → Salão da Guilda): foco, fundo inerte e o voltar', () => {
  // jsdom não faz layout: `offsetParent` é sempre null e o `useDialogA11y` (que
  // ignora o que está escondido) não enxergaria NENHUM focável. O stub diz "tudo
  // que está no documento é visível" — a pergunta do teste é o trap, não o layout.
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent');
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', { get() { return this.parentNode; }, configurable: true });
  });
  afterEach(() => {
    if (original) Object.defineProperty(HTMLElement.prototype, 'offsetParent', original);
    else delete (HTMLElement.prototype as { offsetParent?: unknown }).offsetParent;
  });

  const hall = (over: Partial<AreaViewProps> = {}) => (
    <AreaView
      {...({ area: 'hall', language: 'pt-BR', guild: { saveId: 'save-12345678', metaDoDiaCumprida: true }, hallContent: () => null } as unknown as AreaViewProps)}
      {...over}
    />
  );

  async function abrir() {
    vi.mocked(getGuild).mockResolvedValue(vista(4, { isHost: true }, [0]));
    const r = renderWithCss(<div id="app"><button id="antes">antes</button>{hall()}</div>);
    const lote = r.container.querySelector('[data-area-lot="guilda"]') as HTMLElement;
    expect(lote).toBeTruthy();
    lote.focus();
    fireEvent.click(lote);
    await screen.findByRole('heading', { name: 'Roda da manhã' });
    return { r, lote };
  }

  it('a folha é um diálogo modal nomeado, com o fechar de 44 px e o foco DENTRO', async () => {
    await abrir();
    const dialogo = screen.getByRole('dialog');
    expect(dialogo.getAttribute('aria-modal')).toBe('true');
    const fechar = document.querySelector('[data-area-sheet-close]') as HTMLElement;
    expect(getComputedStyle(fechar).width).toBe('44px');
    expect(getComputedStyle(fechar).height).toBe('44px');
    expect(dialogo.contains(document.activeElement)).toBe(true);
  });

  it('o fundo fica inerte enquanto a folha está aberta e volta ao fechar', async () => {
    const { r } = await abrir();
    const irmao = document.getElementById('antes')!;
    const temInerte = (el: Element) => (el as HTMLElement & { inert?: boolean }).inert === true || el.getAttribute('aria-hidden') === 'true';
    expect(temInerte(irmao)).toBe(true);
    await act(async () => { closeTopBackLayer(); });
    expect(temInerte(irmao)).toBe(false);
    r.unmount();
  });

  it('Tab não escapa da folha: do último focável volta ao primeiro (e Shift+Tab ao contrário)', async () => {
    await abrir();
    const dialogo = screen.getByRole('dialog');
    const focaveis = Array.from(dialogo.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'));
    expect(focaveis.length).toBeGreaterThan(3);
    focaveis[focaveis.length - 1].focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(focaveis[0]);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(focaveis[focaveis.length - 1]);
  });

  it('o voltar do Android (`closeTopBackLayer`) fecha a Guilda e devolve o foco ao lote, nunca ao body', async () => {
    const { lote } = await abrir();
    let consumiu = false;
    await act(async () => { consumiu = closeTopBackLayer(); });
    expect(consumiu).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(lote);
    expect(document.activeElement).not.toBe(document.body);
  });

  it('Escape também fecha só a folha e devolve o foco ao lote', async () => {
    const { lote } = await abrir();
    await act(async () => { fireEvent.keyDown(document, { key: 'Escape' }); });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(lote);
  });

  it('firmar o fio por teclado: o botão some e o foco NÃO cai em <body>', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(4, {}, []));
    vi.mocked(guildThread).mockResolvedValue(vista(4, {}, [0]));
    const r = renderWithCss(hall());
    fireEvent.click(r.container.querySelector('[data-area-lot="guilda"]')!);
    const b = await screen.findByText(PT('guild.bosque.fio.botao'));
    (b.closest('button') as HTMLElement).focus();
    fireEvent.click(b);
    await screen.findByText(PT('guild.bosque.fio.hoje'));
    await waitFor(() => expect(document.activeElement).not.toBe(document.body));
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });

  it('sair por teclado: o foco fica dentro da folha', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(3));
    vi.mocked(leaveGuild).mockResolvedValue({ ok: true });
    const r = renderWithCss(hall());
    fireEvent.click(r.container.querySelector('[data-area-lot="guilda"]')!);
    const b = await screen.findByText(PT('guild.sair.botao'));
    (b.closest('button') as HTMLElement).focus();
    fireEvent.click(b);
    await screen.findByText(PT('guild.criar.botao'));
    await waitFor(() => expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true));
  });

  it('o NPC do Salão fala a frase nova (não "grupo pequeno")', async () => {
    await abrir();
    const fala = document.querySelector('[data-area-sheet-npc-line]')!.textContent!;
    expect(fala).toContain(PT('guild.npc.hall'));
    expect(fala).not.toMatch(/grupo pequeno|small group/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FATIA B1 — o Bosque (visor, estágio, criaturas), o fio, os gestos, o Mural, a
// memória do aparelho, a telemetria e o movimento reduzido.
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import { GROVE_STAGES } from '../../utils/guildRules';
import { readGroveLocal } from '../../utils/groveLocal';
import { STORAGE_KEYS } from '../../utils/storageKeys';

const NOME_PT = ['Clareira', 'Ramagem', 'Copa', 'Mata', 'Bosque antigo'];
const NOME_EN = ['Clearing', 'Boughs', 'Canopy', 'Thicket', 'Old grove'];

/** Vista com o Bosque num estágio (1..5; 0 = ainda sem estágio). */
const noEstagio = (n: number, idx: number, over: Record<string, unknown> = {}, bosque: Record<string, unknown> = {}, mine: Record<string, unknown> = {}, veio: number[] = []) =>
  vista(n, {
    bosque: {
      stage: idx > 0 ? GROVE_STAGES[idx - 1] : null, stageIndex: idx, perto: false,
      tide: { key: 'T1', size: null }, ornaments: [], ...bosque,
    },
    mine: { cameToday: veio.includes(0), threadToday: veio.includes(0), groveScenes: false, gesturesSent: [], ...mine },
    ...over,
  }, veio);

const visor = () => document.querySelector('[data-guild-visor]') as HTMLElement;
const criaturas = () => Array.from(document.querySelectorAll<HTMLImageElement>('[data-grove-creature]'));

describe('o Bosque por estágio', () => {
  it.each([1, 2, 3, 4, 5])('estágio %i: visor do cenário certo, nome e linha em PT e EN, aria do vidro com o estágio', async (idx) => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, idx));
    for (const [language, nomes] of [['pt-BR', NOME_PT], ['en-US', NOME_EN]] as const) {
      cleanup();
      localStorage.clear();
      await montar({ language });
      expect(visor().getAttribute('data-stage')).toBe(GROVE_STAGES[idx - 1]);
      expect(screen.getByRole('heading', { name: nomes[idx - 1] })).toBeTruthy();
      const chaveLinha = ['clareira', 'ramagem', 'copa', 'mata', 'bosqueAntigo'][idx - 1];
      const linha = GUILD_COPY[`guild.bosque.estagio.${chaveLinha}.linha` as keyof typeof GUILD_COPY][language === 'pt-BR' ? 0 : 1];
      expect(screen.getByText(linha)).toBeTruthy();
      expect(visor().getAttribute('role')).toBe('img');
      expect(visor().getAttribute('aria-label')).toBe(language === 'pt-BR' ? `Bosque da roda, estágio ${nomes[idx - 1]}` : `The circle’s grove, stage ${nomes[idx - 1]}`);
    }
  });

  it('o pixel art fica DENTRO do vidro (`.sm2-viewport-screen`) e o texto do estágio FORA dele', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, 3));
    await montar();
    expect(visor().classList.contains('sm2-viewport-screen')).toBe(true);
    expect(visor().contains(screen.getByRole('heading', { name: 'Copa' }))).toBe(false);
    expect(criaturas().every(c => visor().contains(c))).toBe(true);
  });

  it('ainda sem estágio (índice 0): o chão da Clareira existe, mas NENHUM nome, nenhuma linha e nenhuma faixa', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, 0));
    await montar();
    expect(visor()).toBeTruthy();
    expect(visor().getAttribute('data-stage')).toBe('');
    expect(visor().getAttribute('role')).toBeNull();
    expect(document.querySelector('[data-guild-stage]')).toBeNull();
    expect(document.querySelector('[data-guild-perto]')).toBeNull();
  });

  it('`perto` é UMA frase binária que aponta para o PRÓXIMO estágio, sem número, sem razão, sem barra', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 2, {}, { perto: true }));
    await montar();
    const frase = screen.getByText('Perto de Copa.');
    expect(frase.textContent).not.toMatch(/\d|%|faltam|falta/i);
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(document.body.textContent).not.toMatch(/\{estagio\}/);
  });

  it('`perto` em inglês, e sem `perto` nada é escrito (silêncio, não "longe")', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 1, {}, { perto: true }));
    await montar({ language: 'en-US' });
    expect(screen.getByText('Near Boughs.')).toBeTruthy();
    cleanup();
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 1, {}, { perto: false }));
    await montar({ language: 'en-US' });
    expect(document.querySelector('[data-guild-perto]')).toBeNull();
    expect(screen.queryByText(/Near|Far|far/)).toBeNull();
  });

  it('no Bosque antigo não há próximo: mesmo que o servidor mande `perto`, a UI cala', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 5, {}, { perto: true }));
    await montar();
    expect(document.querySelector('[data-guild-perto]')).toBeNull();
  });

  it('a regra sóbria é linha FIXA do Bosque, nos dois idiomas', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, 1));
    await montar();
    // K6: a regra mora atrás do "?" (InfoTip) — um toque a lê.
    fireEvent.click(screen.getByRole('button', { name: 'Como o bosque cresce' }));
    expect(screen.getByText(PT('guild.bosque.regra'))).toBeTruthy();
    cleanup();
    await montar({ language: 'en-US' });
    fireEvent.click(screen.getByRole('button', { name: 'How the grove grows' }));
    expect(screen.getByText(EN('guild.bosque.regra'))).toBeTruthy();
  });

  it('nenhum número de progresso em lugar nenhum da sala, com qualquer estágio (o servidor nem o manda)', async () => {
    for (const idx of [0, 1, 2, 3, 4, 5]) {
      cleanup();
      vi.mocked(getGuild).mockResolvedValue(noEstagio(6, idx, { progress: 41, target: 90 }, { perto: idx < 5, progressCru: 41.5 }));
      await montar();
      const sala = document.querySelector('[data-guild-room="bosque"]')!.textContent!;
      expect(sala).not.toMatch(/\d/);
      expect(sala).not.toMatch(/41|90/);
    }
  });

  it('um estágio inventado pelo servidor não vira cenário: o índice manda', async () => {
    const v = sanitizeGuildView({ ...noEstagio(2, 0), bosque: { stage: 'floresta-do-mal', stageIndex: 99, perto: true, ornaments: [] } })!;
    expect(v.bosque.stageIndex).toBe(5);
    expect(v.bosque.stage).toBe('bosque-antigo');
    expect(v.bosque.perto).toBe(false);
  });
});

describe('o palco do Bosque: quem aparece no visor', () => {
  it('1 membro: só a SUA criatura, no centro, em 128 (escala inteira)', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(1, 1, { isHost: true }));
    await montar();
    expect(criaturas()).toHaveLength(1);
    expect(criaturas()[0].getAttribute('data-grove-creature')).toBe('own');
    expect(criaturas()[0].width).toBe(128);
  });

  it('até 4: TODOS, na ordem de chegada — a sua em 128, as dos outros em 64 (também escala inteira)', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(4, 2));
    await montar();
    const c = criaturas();
    expect(c).toHaveLength(4);
    expect(c.map(x => x.getAttribute('data-grove-creature'))).toEqual(['own', 'other', 'other', 'other']);
    expect(c.map(x => x.width)).toEqual([128, 64, 64, 64]);
    const xs = c.map(x => parseFloat(x.style.left));
    expect(xs).toEqual([...xs].sort((a, b) => a - b)); // da esquerda para a direita, na ordem da roda
    // 256 e 384 dividem por 128 e por 64 sem resto: pixel art sem meio pixel
    for (const px of [128, 64]) { expect(256 % px).toBe(0); expect(384 % px).toBe(0); }
  });

  it('a criatura dos outros é a MESMA sempre (hash do id) e nunca uma URL vinda do servidor', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 2));
    await montar();
    const antes = criaturas().map(c => c.src);
    cleanup();
    await montar();
    expect(criaturas().map(c => c.src)).toEqual(antes.map((s, i) => (i === 0 ? criaturas()[0].src : s)));
    for (const c of criaturas().slice(1)) expect(c.src).not.toMatch(/^https?:\/\/(?!localhost)/);
  });

  it('presença NÃO mexe no palco: quem veio e quem não veio ganham a mesma criatura, sem opacidade, sem reordenar', async () => {
    const dom = async (veio: number[]) => {
      cleanup();
      vi.mocked(getGuild).mockResolvedValue(noEstagio(4, 2, {}, {}, {}, veio));
      await montar();
      return criaturas().map(c => [c.src, c.style.left, c.style.opacity, c.style.filter, c.className]);
    };
    const nenhum = await dom([]);
    const alguns = await dom([1, 3]);
    // só a criatura PRÓPRIA pode variar com o fio próprio (nada: o palco nem lê presença)
    expect(alguns).toEqual(nenhum);
    for (const [, , opacity, filter] of nenhum) { expect(opacity).toBe(''); expect(filter).toBe(''); }
  });

  it.each([5, 8, 12])('%i membros: SÓ a sua criatura (a fileira com lacunas é a sala de aula que LV-G2 veta)', async (n) => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(n, 3, { threadedToday: true }));
    await montar();
    expect(criaturas()).toHaveLength(1);
    expect(criaturas()[0].getAttribute('data-grove-creature')).toBe('own');
    expect(parseFloat(criaturas()[0].style.left)).toBe(50);
  });

  it('o vidro não desenha texto nenhum (nomes, contagens e estados ficam fora dele)', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(4, 3, {}, {}, {}, [0, 1]));
    await montar();
    expect(visor().textContent).toBe('');
  });

  it('a criatura própria é a que o App manda (o estágio dela), com a rookie só como reserva', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, 1));
    await montar({ mySprite: '/meu-sprite.png' });
    expect(criaturas()[0].getAttribute('src')).toBe('/meu-sprite.png');
  });
});

describe('o fio (guildThread) — fora de updater, com a meta como o servidor a confere', () => {
  const meta = { done: 2, heart: 2, full: 3 };

  it('firma com `goal`, o dia do jogador e anuncia; a telemetria conta a 1ª vez do dia (kind 0)', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, 1));
    vi.mocked(guildThread).mockResolvedValue(noEstagio(2, 1, {}, {}, {}, [0]));
    const tz = { tz: 'America/Sao_Paulo', offsetMs: -10_800_000 } as never;
    await montar({ fioGoal: meta, playerDayTz: tz });
    fireEvent.click(screen.getByText(PT('guild.bosque.fio.botao')));
    await screen.findByText(PT('guild.bosque.fio.hoje'));
    expect(guildThread).toHaveBeenCalledWith('save-12345678', meta, tz);
    expect(document.querySelector('[data-guild-status]')!.textContent).toBe(PT('guild.bosque.fio.toast'));
    expect(vi.mocked(track).mock.calls.filter(([e]) => e === 'guild_thread')).toEqual([['guild_thread', { kind: 0 }]]);
  });

  it('o servidor recusa a meta de coração (400 goal not met): SILÊNCIO — recarrega, nenhum alerta, nenhuma frase', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, 1));
    vi.mocked(guildThread).mockRejectedValue(erro('goalNotMet'));
    await montar({ fioGoal: meta });
    fireEvent.click(screen.getByText(PT('guild.bosque.fio.botao')));
    await waitFor(() => expect(getGuild).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(vi.mocked(track).mock.calls.filter(([e]) => e === 'guild_thread')).toEqual([]);
  });

  it('o toque NÃO dispara sozinho: sem gesto, nada é enviado (o fio é afirmação, não efeito)', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, 1));
    await montar({ fioGoal: meta });
    expect(guildThread).not.toHaveBeenCalled();
  });

  it('meta de CORAÇÃO basta: o App manda `metaDoDiaCumprida` pela régua de coração, e a folha só obedece', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, 1));
    await montar({ metaDoDiaCumprida: true, fioGoal: { done: 2, heart: 2, full: 4 } });
    expect(screen.getByText(PT('guild.bosque.fio.botao'))).toBeTruthy();
  });
});

describe('os gestos: três, fixos, anônimos, sem push', () => {
  const botoes = () => Array.from(document.querySelectorAll<HTMLButtonElement>('[data-gesto]'));

  it('roda de UM: ninguém para gesticular — a fileira não é desenhada', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(1, 1));
    await montar();
    expect(document.querySelector('[data-guild-gestos]')).toBeNull();
  });

  it('com 2+: exatamente três botões, na ordem Aceno · Luz · Descanso, com nome e aria em PT e EN', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, 1));
    await montar();
    expect(botoes().map(b => b.dataset.gesto)).toEqual(['aceno', 'luz', 'descanso']);
    expect(botoes().map(b => b.textContent)).toEqual(['pan_toolAceno', 'light_modeLuz', 'bedtimeDescanso']);
    expect(botoes().map(b => b.getAttribute('aria-label'))).toEqual(['Enviar Aceno para a roda', 'Enviar Luz para a roda', 'Enviar Descanso para a roda']);
    cleanup();
    await montar({ language: 'en-US' });
    expect(botoes().map(b => b.getAttribute('aria-label'))).toEqual(['Send Wave to the circle', 'Send Light to the circle', 'Send Rest to the circle']);
    expect(screen.getByRole('group', { name: 'Gestures' })).toBeTruthy();
  });

  it('os ícones estão NO INVENTÁRIO do subset (senão renderizam um <span> vazio) e sem molde de fundo', async () => {
    const tokens = fs.readFileSync(path.resolve(__dirname, '../../styles/tokens.md'), 'utf8');
    const inventario = /Inventário atual[\s\S]*?`([^`]+)`/.exec(tokens)![1].split(/[,\s]+/).filter(Boolean);
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, 1));
    await montar();
    const nomes = botoes().map(b => b.querySelector('.sm2-icon')!.textContent!);
    expect(nomes).toHaveLength(3);
    for (const n of nomes) expect(inventario, n).toContain(n);
    for (const b of botoes()) {
      const ic = b.querySelector('.sm2-icon') as HTMLElement;
      expect(ic.style.background).toBe('');
      expect(ic.style.border).toBe('');
      expect(ic.className).not.toMatch(/box|plate|frame/);
    }
  });

  it('enviar: chama o servidor com o tipo e o dia do jogador, anuncia e o botão vira "enviado" (desabilitado, sem "amanhã")', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 1));
    vi.mocked(guildGesture).mockResolvedValue(noEstagio(3, 1, {}, {}, { gesturesSent: ['luz'] }));
    await montar();
    fireEvent.click(botoes()[1]);
    await waitFor(() => expect(botoes()[1].getAttribute('aria-disabled')).toBe('true'));
    expect(guildGesture).toHaveBeenCalledWith('save-12345678', 'luz', undefined);
    expect(botoes()[1].textContent).toContain('Luz enviada.');
    expect(botoes()[1].getAttribute('aria-label')).toBe('Luz já enviado hoje');
    expect(document.querySelector('[data-guild-status]')!.textContent).toBe('Luz enviada.');
    expect(botoes()[0].getAttribute('aria-disabled')).toBeNull(); // os outros dois seguem à mão
    expect(document.body.textContent).not.toMatch(/amanh[ãa]|tomorrow/i);
  });

  it('o que já foi mandado hoje (talvez de outro aparelho) chega desabilitado', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 1, {}, {}, { gesturesSent: ['aceno', 'descanso'] }));
    await montar();
    expect(botoes().map(b => b.getAttribute('aria-disabled') === 'true')).toEqual([true, false, true]);
  });

  it('429 daily limit: o gesto já saiu — recarrega em SILÊNCIO, sem alerta', async () => {
    vi.mocked(getGuild).mockResolvedValueOnce(noEstagio(3, 1)).mockResolvedValue(noEstagio(3, 1, {}, {}, { gesturesSent: ['aceno'] }));
    vi.mocked(guildGesture).mockRejectedValue(erro('dailyLimit'));
    await montar();
    fireEvent.click(botoes()[0]);
    await waitFor(() => expect(botoes()[0].getAttribute('aria-disabled')).toBe('true'));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('duplo toque no mesmo frame manda UM gesto', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 1));
    vi.mocked(guildGesture).mockImplementation(() => new Promise(() => {}));
    await montar();
    act(() => { botoes()[0].click(); botoes()[0].click(); });
    expect(guildGesture).toHaveBeenCalledTimes(1);
  });

  it('recebidos: chegam EM LOTE, só o tipo — sem quem, sem quantos — e nada quando não veio nenhum', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(4, 1, { gestures: ['luz', 'descanso'] }));
    await montar();
    const lote = document.querySelector('[data-guild-recebidos]')!;
    expect(Array.from(lote.querySelectorAll('li')).map(li => li.lastElementChild!.textContent)).toEqual(['Alguém deixou uma luz.', 'Alguém desejou bom descanso.']);
    // NO TOPO, colados ao visor do Bosque (não abaixo da lista de nomes) e com estilo próprio, nunca o de um membro (L3 M3/B7)
    expect(lote.closest('[data-guild-room="bosque"]')).toBeTruthy();
    expect(lote.classList.contains('sm2-grove-recv')).toBe(true);
    expect(lote.closest('.sm2-coop-mem')).toBeNull();
    expect(lote.textContent).not.toMatch(/\d|Ana|Bia|Caio|Dani/);
    cleanup();
    vi.mocked(getGuild).mockResolvedValue(noEstagio(4, 1, { gestures: [] }));
    await montar();
    expect(document.querySelector('[data-guild-recebidos]')).toBeNull();
  });

  it('roda de 2: o servidor NÃO manda o tipo (B5) — só o fato; a UI diz "alguém deixou um gesto", sem tipo, sem ícone', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, 1, { gestures: [], gestureReceived: true }));
    await montar();
    const linha = document.querySelector('[data-guild-recebidos]')!;
    expect(linha.textContent).toBe('Alguém deixou um gesto para a roda.');
    expect(linha.textContent).not.toMatch(/luz|aceno|descanso|light|wave|rest/i);
    cleanup();
    await montar({ language: 'en-US' });
    expect(document.querySelector('[data-guild-recebidos]')!.textContent).toBe('Someone left a gesture for the circle.');
  });

  it('nenhum gesto (gestureReceived falso): SILÊNCIO nas duas formas', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, 1, { gestures: [], gestureReceived: false }));
    await montar();
    expect(document.querySelector('[data-guild-recebidos]')).toBeNull();
    expect(document.body.textContent).not.toMatch(/gesto para a roda/);
  });

  it('com 3+ a lista de TIPOS vence o agregado (nunca as duas coisas juntas)', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 1, { gestures: ['luz'], gestureReceived: true }));
    await montar();
    expect(document.querySelectorAll('[data-guild-recebidos]')).toHaveLength(1);
    expect(document.body.textContent).toContain('Alguém deixou uma luz.');
    expect(document.body.textContent).not.toContain('Alguém fez um gesto');
  });

  it('recebidos em inglês, e um tipo desconhecido do servidor é descartado', async () => {
    const v = sanitizeGuildView({ ...noEstagio(3, 1), gestures: ['aceno', 'soco', 'luz'] })!;
    expect(v.gestures).toEqual(['aceno', 'luz']);
    vi.mocked(getGuild).mockResolvedValue(v);
    await montar({ language: 'en-US' });
    expect(Array.from(document.querySelectorAll('[data-guild-recebidos] li')).map(li => li.lastElementChild!.textContent))
      .toEqual(['Someone waved at the circle.', 'Someone left a little light.']);
  });

  it('o foco FICA no botão que enviou (aria-disabled, nunca `disabled`) — nem <body>, nem a raiz da folha (L3 M6)', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 1));
    vi.mocked(guildGesture).mockResolvedValue(noEstagio(3, 1, {}, {}, { gesturesSent: ['aceno'] }));
    const { container } = await montar();
    botoes()[0].focus();
    fireEvent.click(botoes()[0]);
    await waitFor(() => expect(botoes()[0].getAttribute('aria-disabled')).toBe('true'));
    await waitFor(() => expect(document.activeElement).toBe(botoes()[0]));
    expect(botoes()[0].hasAttribute('disabled')).toBe(false);
    expect(container.contains(document.activeElement)).toBe(true);
    // tocar de novo no que já foi enviado é inerte (não chama o servidor outra vez)
    fireEvent.click(botoes()[0]);
    expect(guildGesture).toHaveBeenCalledTimes(1);
  });

  it('sem chat: nenhum campo de texto livre na sala', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(4, 2));
    await montar();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(document.querySelector('textarea')).toBeNull();
  });
});

describe('o Mural: marcos e peças de maré', () => {
  const mural = () => document.querySelector('[data-guild-room="mural"]');

  it('vazio é SILÊNCIO: sem estágio e sem peça, nem o título é desenhado', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 0));
    await montar();
    expect(mural()).toBeNull();
    expect(screen.queryByText(PT('guild.mural.titulo'))).toBeNull();
    expect(document.body.textContent).not.toMatch(/nada ainda|nothing yet/i);
  });

  it('marcos com a DATA que este aparelho viu; estágio que ele NÃO presenciou fica de fora — sem data é silêncio (L3 B3)', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 3));
    await montar();
    const itens = Array.from(mural()!.querySelectorAll('li')).map(li => li.textContent!);
    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatch(/^Copa, \d{1,2} de \w+ de \d{4}$/);
    expect(mural()!.textContent).not.toMatch(/Clareira|Ramagem/);
    expect(screen.getByRole('region', { name: 'Mural da roda' })).toBeTruthy();
  });

  it('peças de maré: os três tamanhos, com nome próprio e data — UM texto para os três', async () => {
    const ornaments = [
      { tide: 'T1', size: 'petala', day: '2026-08-10' },
      { tide: 'T2', size: 'corola', day: '2026-09-21' },
      { tide: 'T3', size: 'floracao', day: '2026-10-05' },
    ];
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 1, {}, { ornaments }));
    await montar();
    const pecas = Array.from(mural()!.querySelectorAll('[data-mural-mare]')).map(li => li.textContent!);
    expect(pecas).toEqual([
      'Pétala · Floração colhida, 10 de agosto de 2026',
      'Corola · Floração colhida, 21 de setembro de 2026',
      'Floração cheia · Floração colhida, 5 de outubro de 2026',
    ]);
    cleanup();
    localStorage.clear();
    await montar({ language: 'en-US' });
    expect(Array.from(mural()!.querySelectorAll('[data-mural-mare]')).map(li => li.textContent!.split(' · ')[0])).toEqual(['Petal', 'Corolla', 'Full bloom']);
  });

  it('só peças, sem estágio: o Mural aparece (a peça é permanente)', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 0, {}, { ornaments: [{ tide: 'T1', size: 'petala', day: '2026-08-10' }] }));
    await montar();
    expect(mural()).toBeTruthy();
  });

  it('nenhum número por pessoa, nenhum nome de membro, ninguém que chegou ou saiu', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(4, 4, {}, { ornaments: [{ tide: 'T1', size: 'floracao', day: '2026-09-01' }] }, {}, [0, 1]));
    await montar();
    const txt = mural()!.textContent!;
    expect(txt).not.toMatch(/Ana|Bia|Caio|Dani/);
    expect(txt).not.toMatch(/chegou|saiu|entrou|joined|left/i);
    expect(txt.replace(/\d{1,2} de \w+ de \d{4}/g, '')).not.toMatch(/\d/);
  });

  it('uma peça com tamanho inventado pelo servidor é descartada', () => {
    const v = sanitizeGuildView({ ...noEstagio(2, 1), bosque: { stageIndex: 1, ornaments: [{ tide: 'T1', size: 'gigante', day: '2026-08-10' }, { tide: 'T2', size: 'corola', day: '2026-08-17' }] } })!;
    expect(v.bosque.ornaments).toEqual([{ tide: 'T2', size: 'corola', day: '2026-08-17' }]);
  });

  it('o Mural não ordena nem reverte (a ordem é a do servidor)', () => {
    const fonte = fs.readFileSync(path.resolve(__dirname, 'GuildSheet.tsx'), 'utf8');
    expect(fonte).not.toMatch(/\.sort\(|\.toSorted\(|\.reverse\(/);
  });
});

describe('a memória do aparelho e a telemetria do Bosque', () => {
  it('1ª vez que o aparelho vê a roda é BASELINE: guarda o estágio e NÃO deixa marco pendente', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, 3));
    await montar();
    const l = readGroveLocal()!;
    expect(l.index).toBe(3);
    expect(l.pending).toBeNull();
    expect(vi.mocked(track).mock.calls.filter(([e]) => e === 'guild_stage')).toEqual([['guild_stage', { level: 3 }]]);
  });

  it('o estágio SOBE entre duas vistas: vira marco pendente (Ramagem em diante) e a telemetria conta o novo', async () => {
    vi.mocked(getGuild).mockResolvedValueOnce(noEstagio(2, 1)).mockResolvedValue(noEstagio(2, 2));
    await montar();
    expect(readGroveLocal()!.pending).toBeNull();
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    await waitFor(() => expect(readGroveLocal()!.pending?.index).toBe(2));
    expect(vi.mocked(track).mock.calls.filter(([e]) => e === 'guild_stage').map(c => c[1])).toEqual([{ level: 1 }, { level: 2 }]);
  });

  it('a Clareira nova NÃO tem cerimônia (não há marco na copy) e uma vista repetida não repete a telemetria', async () => {
    vi.mocked(getGuild).mockResolvedValueOnce(noEstagio(2, 0)).mockResolvedValue(noEstagio(2, 1));
    await montar();
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    await waitFor(() => expect(readGroveLocal()!.index).toBe(1));
    expect(readGroveLocal()!.pending).toBeNull();
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(vi.mocked(track).mock.calls.filter(([e]) => e === 'guild_stage')).toHaveLength(1);
  });

  it('a memória NUNCA vai para o save nem carrega nome, contagem ou progresso — só o id público, índices e datas', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 2));
    await montar();
    const cru = localStorage.getItem(STORAGE_KEYS.GUILD_LAST_STAGE)!;
    expect(Object.keys(JSON.parse(cru)).sort()).toEqual(['base', 'gid', 'index', 'joinedDay', 'marks', 'pending', 'scenes', 'tracked']);
    expect(cru).not.toMatch(/Roda da manhã|Ana|ABCD2345/);
    expect(localStorage.getItem('soulmon_state_v1')).toBeNull();
  });

  it('`mine.groveScenes` libera os cenários na memória (o App os entrega ao save); sem ele, nada', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, 3, {}, {}, { groveScenes: true }));
    await montar();
    expect(readGroveLocal()!.scenes).toBe(3);
    cleanup();
    localStorage.clear();
    vi.mocked(getGuild).mockResolvedValue(noEstagio(2, 3, {}, {}, { groveScenes: false }));
    await montar();
    expect(readGroveLocal()!.scenes).toBe(0);
  });

  it('sair apaga a memória do aparelho (o que foi ganho já está no save) e conta a saída em FAIXA, sem id', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(4, 2));
    vi.mocked(leaveGuild).mockResolvedValue({ ok: true });
    await montar();
    expect(readGroveLocal()).not.toBeNull();
    fireEvent.click(screen.getByText(PT('guild.sair.botao')));
    await screen.findByText(PT('guild.criar.botao'));
    expect(readGroveLocal()).toBeNull();
    expect(vi.mocked(track).mock.calls.filter(([e]) => e === 'guild_leave')).toEqual([['guild_leave', { size: 3, weeks: 0 }]]);
  });

  it('criar e entrar contam `guild_create` e `guild_join` (só o tamanho, nunca id)', async () => {
    vi.mocked(getGuild).mockResolvedValue(null);
    vi.mocked(createGuild).mockResolvedValue(noEstagio(1, 0, { isHost: true }));
    await montar();
    fireEvent.change(screen.getByPlaceholderText(PT('guild.criar.nome.placeholder')), { target: { value: 'Roda' } });
    fireEvent.click(screen.getByText(PT('guild.criar.botao')));
    await screen.findByRole('heading', { name: 'Roda da manhã' });
    expect(vi.mocked(track).mock.calls.filter(([e]) => e === 'guild_create')).toEqual([['guild_create']]);
    cleanup();
    localStorage.clear();
    vi.mocked(getGuild).mockResolvedValue(null);
    vi.mocked(joinGuild).mockResolvedValue(noEstagio(5, 1));
    await montar();
    fireEvent.click(screen.getByText(PT('guild.entrar.botao.abrir')));
    fireEvent.change(await screen.findByPlaceholderText('ABCD2345'), { target: { value: 'ABCD2345' } });
    fireEvent.click(screen.getByText(PT('guild.entrar.botao')));
    await screen.findByRole('heading', { name: 'Roda da manhã' });
    expect(vi.mocked(track).mock.calls.filter(([e]) => e === 'guild_join')).toEqual([['guild_join', { size: 5 }]]);
  });

  it('nenhuma chamada de telemetria da Guilda leva id, nome ou código', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(4, 3, {}, {}, {}, [0]));
    vi.mocked(guildGesture).mockResolvedValue(noEstagio(4, 3));
    await montar();
    fireEvent.click(document.querySelector<HTMLElement>('[data-gesto="aceno"]')!);
    await waitFor(() => expect(guildGesture).toHaveBeenCalled());
    expect(JSON.stringify(vi.mocked(track).mock.calls)).not.toMatch(/g1|Roda da manhã|ABCD2345|a1b2c3d4e5f6a7|Ana/);
  });
});

describe('movimento reduzido reduz o movimento, nunca a informação', () => {
  const comMediaQuery = (reduce: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (q: string) => ({ matches: reduce && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
    });
  };
  afterEach(() => { delete (window as { matchMedia?: unknown }).matchMedia; });

  it('sem preferência: as criaturas batem (2 quadros); com `reduce`: paradas, e o MESMO cenário, nome e criaturas', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 3));
    comMediaQuery(false);
    await montar();
    const normal = criaturas().map(c => c.className);
    expect(normal.every(c => c.includes('sm2-grove-bob'))).toBe(true);
    expect(visor().getAttribute('data-reduced-motion')).toBeNull();
    cleanup();
    localStorage.clear();
    comMediaQuery(true);
    await montar();
    await waitFor(() => expect(visor().getAttribute('data-reduced-motion')).toBe('true'));
    expect(criaturas()).toHaveLength(3);
    expect(criaturas().every(c => !c.className.includes('sm2-grove-bob'))).toBe(true);
    expect(screen.getByRole('heading', { name: 'Copa' })).toBeTruthy();
    expect(visor().getAttribute('data-stage')).toBe('copa');
  });

  it('o CSS também corta a batida no bloco canônico de movimento reduzido', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../index.css'), 'utf8');
    const ultimo = css.slice(css.lastIndexOf('@media (prefers-reduced-motion'));
    expect(ultimo).toMatch(/\.sm2-grove-bob\s*\{\s*animation:\s*none\s*!important/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RODADA L4 (29/09/2026) — o que o QA de experiência do L3 reabriu.
// ─────────────────────────────────────────────────────────────────────────────
describe('L4: sem roda mostra a Clareira e explica por que o botão está inerte', () => {
  it('M1: o vazio tem o VISOR do Bosque (Clareira, sem membro de outro) acima do formulário', async () => {
    vi.mocked(getGuild).mockResolvedValue(null);
    await montar();
    const v = document.querySelector('[data-guild-visor]') as HTMLElement;
    expect(v).toBeTruthy();
    expect(v.getAttribute('aria-hidden')).toBe('true'); // decorativo: o texto abaixo é quem fala
    expect(document.querySelectorAll('[data-grove-creature]')).toHaveLength(1);
    expect(document.querySelector('[data-grove-creature="other"]')).toBeNull();
    // o visor vem ANTES do texto e do formulário
    const corpo = screen.getByText(PT('guild.salao.vazio.corpo'));
    expect(v.compareDocumentPosition(corpo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // sem placa/slot marcado: nada de "+" nem de vaga vazia
    expect(document.querySelector('.sm2-guild')!.textContent).not.toMatch(/\+|vaga|slot/i);
  });

  it('#7: o código curto e o nome vazio deixam a RAZÃO escrita (`aria-describedby`), sem número à mão', async () => {
    vi.mocked(getGuild).mockResolvedValue(null);
    await montar();
    const nome = screen.getByPlaceholderText(PT('guild.criar.nome.placeholder'));
    const dicaNome = document.getElementById(nome.getAttribute('aria-describedby')!)!;
    expect(dicaNome.textContent).toBe(PT('guild.criar.nome.dica'));
    fireEvent.change(nome, { target: { value: 'X' } });
    expect(nome.getAttribute('aria-describedby')).toBeNull(); // com nome, a razão some
    fireEvent.click(screen.getByText(PT('guild.entrar.botao.abrir')));
    const codigo = document.querySelector('input[autocapitalize="characters"]') as HTMLInputElement;
    const dica = document.getElementById(codigo.getAttribute('aria-describedby')!)!;
    expect(dica.textContent).toBe('O código tem 8 caracteres.');
    expect(dica.classList.contains('sm2-guild-sr')).toBe(false); // VISÍVEL, não só no leitor de tela
    cleanup();
    await montar({ language: 'en-US' });
    fireEvent.click(screen.getByText(EN('guild.entrar.botao.abrir')));
    expect(document.body.textContent).toContain('The code has 8 characters.');
  });

  it('M1 (Feira): a Feira sem roda diz o que é ANTES do formulário (uma linha), e o Salão não a repete', async () => {
    vi.mocked(getGuild).mockResolvedValue(null);
    await montar({ room: 'feira' });
    const linha = screen.getByText(PT('guild.feira.semroda'));
    expect(linha.compareDocumentPosition(screen.getByText(PT('guild.criar.botao'))) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    cleanup();
    await montar({ room: 'salao' });
    expect(screen.queryByText(PT('guild.feira.semroda'))).toBeNull();
  });
});

describe('L4 M5: "Seguir o próprio caminho" fica SEMPRE ao alcance (rodapé da folha, não no fim de 3 telas)', () => {
  it.each([4, 12])('roda de %i: a saída está no rodapé fixo (`sticky`), fora do cartão que rola, com a nota ao lado', async (n) => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(n, 2));
    const { container } = await montar();
    const foot = container.querySelector('[data-guild-foot]') as HTMLElement;
    expect(foot).toBeTruthy();
    expect(getComputedStyle(foot).position).toBe('sticky');
    expect(within(foot).getByText(PT('guild.sair.botao'))).toBeTruthy();
    expect(within(foot).getByText(PT('guild.sair.nota'))).toBeTruthy();
    expect(foot.closest('.sm2-stats-card')).toBeNull();
    // é o ÚLTIMO filho da folha: fica colado ao fim do scroll
    expect(container.querySelector('.sm2-guild')!.lastElementChild).toBe(foot);
    // continua sendo UM toque, sem diálogo
    vi.mocked(leaveGuild).mockResolvedValue({ ok: true });
    fireEvent.click(within(foot).getByText(PT('guild.sair.botao')));
    await screen.findByText(PT('guild.criar.botao'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(leaveGuild).toHaveBeenCalledWith('save-12345678');
  });
});

describe('L4: cenários só com o servidor, folha registrada, telemetria única', () => {
  it('B1: `onScenes` só recebe ids quando a vista trouxe `mine.groveScenes` (nunca do que está no disco)', async () => {
    const onScenes = vi.fn();
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 2, {}, {}, { groveScenes: false }));
    await montar({ onScenes });
    expect(onScenes).not.toHaveBeenCalled();
    cleanup();
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 2, {}, {}, { groveScenes: true }));
    await montar({ onScenes });
    await waitFor(() => expect(onScenes).toHaveBeenCalledWith(['bg-guild-clareira', 'bg-guild-ramagem']));
  });

  it('M5: a folha se declara ABERTA enquanto montada (o hook fica quieto) e fecha a declaração ao desmontar', async () => {
    const { isGuildSheetOpen } = await import('../../utils/groveLocal');
    vi.mocked(getGuild).mockResolvedValue(null);
    const { unmount } = await montar();
    expect(isGuildSheetOpen()).toBe(true);
    unmount();
    expect(isGuildSheetOpen()).toBe(false);
  });

  it('M5: voltar ao app com a folha aberta faz UMA `getGuild` por volta', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 2));
    await montar();
    expect(getGuild).toHaveBeenCalledTimes(1);
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(getGuild).toHaveBeenCalledTimes(2);
  });

  it('B5: `guild_stage` do mesmo estágio sai UMA vez mesmo que a vista chegue duas vezes', async () => {
    vi.mocked(getGuild).mockResolvedValue(noEstagio(3, 2));
    await montar();
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    await waitFor(() => expect(getGuild).toHaveBeenCalledTimes(2));
    const niveis = vi.mocked(track).mock.calls.filter(c => c[0] === 'guild_stage').map(c => (c[1] as { level: number }).level);
    expect(niveis).toEqual([2]);
  });
});
