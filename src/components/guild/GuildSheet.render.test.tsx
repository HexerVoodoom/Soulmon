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
    getGuild: vi.fn(), createGuild: vi.fn(), joinGuild: vi.fn(), guildCheckin: vi.fn(),
    leaveGuild: vi.fn(), renameGuild: vi.fn(), newGuildCode: vi.fn(),
  };
});

import {
  GuildError, sanitizeGuildView, getGuild, createGuild, joinGuild, guildCheckin, leaveGuild,
  renameGuild, newGuildCode, type GuildView, type GuildErrorKind,
} from '../../utils/community';
import { GuildSheet } from './GuildSheet';
import { AreaView, type AreaViewProps } from '../nav/AreaView';
import { closeTopBackLayer } from '../../utils/backStack';
import { GUILD_COPY } from '../../utils/guildCopy';

const PT = (k: keyof typeof GUILD_COPY) => GUILD_COPY[k][0];
const EN = (k: keyof typeof GUILD_COPY) => GUILD_COPY[k][1];

/** Uma vista como o SERVIDOR a monta (`vistaDaGuilda`), passada pelo higienizador do cliente. */
const membros = (n: number, veio: number[] = [], eu = 0) =>
  Array.from({ length: n }, (_, i) => ({
    id: `pid-${i}`, pid: `pid-${i}`, name: ['Ana', 'Bia', 'Caio', 'Dani', 'Edu', 'Fabi', 'Gil', 'Hana', 'Ivo', 'Jade', 'Kai', 'Lia'][i],
    euMesmo: i === eu, ...(n <= 4 ? { apareceuHoje: veio.includes(i) } : {}),
  }));

function vista(n: number, over: Record<string, unknown> = {}, veio: number[] = []): GuildView {
  return sanitizeGuildView({
    id: 'g1', name: 'Roda da manhã', weekKey: '2026-W40', code: 'ABCD2345', isHost: false, size: n, full: n >= 12,
    members: membros(n, veio),
    presence: n <= 4 ? membros(n, veio).map(m => ({ pid: m.pid, cameToday: m.apareceuHoje })) : null,
    threadedToday: null, mine: { cameToday: veio.includes(0) }, progress: 3, target: n * 5,
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
  for (const f of [getGuild, createGuild, joinGuild, guildCheckin, leaveGuild, renameGuild, newGuildCode]) vi.mocked(f).mockReset();
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
    vi.mocked(guildCheckin).mockRejectedValue(erro('noGuild'));
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

  it('401: convite a entrar na conta, SEM formulário morto e sem tentar de novo', async () => {
    vi.mocked(getGuild).mockRejectedValue(erro('login'));
    await montar();
    expect(screen.getByRole('alert').textContent).toBe(PT('guild.erro.semLogin'));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
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
    expect(screen.queryByText(/Vale quando|própria meta|your own daily goal/i)).toBeNull();
    expect(document.querySelector('[data-guild-room="bosque"]')).toBeNull();
  });

  it('com a meta cumprida: firma, anuncia na região viva e mostra "seu fio firmou hoje"', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(2, {}, []));
    vi.mocked(guildCheckin).mockResolvedValue(vista(2, {}, [0]));
    await montar();
    fireEvent.click(screen.getByText(PT('guild.bosque.fio.botao')));
    await screen.findByText(PT('guild.bosque.fio.hoje'));
    expect(screen.queryByText(PT('guild.bosque.fio.botao'))).toBeNull();
    expect(document.querySelector('[data-guild-status]')!.textContent).toBe(PT('guild.bosque.fio.toast'));
    expect(guildCheckin).toHaveBeenCalledWith('save-12345678', undefined);
  });

  it('duplo toque no mesmo frame chama o servidor UMA vez (trava síncrona)', async () => {
    vi.mocked(getGuild).mockResolvedValue(vista(2, {}, []));
    vi.mocked(guildCheckin).mockImplementation(() => new Promise(() => {}));
    await montar();
    const b = screen.getByText(PT('guild.bosque.fio.botao')).closest('button')!;
    // Dois toques no MESMO lote do React: o `disabled` ainda não chegou ao DOM.
    act(() => { b.click(); b.click(); });
    expect(guildCheckin).toHaveBeenCalledTimes(1);
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
    vi.mocked(guildCheckin).mockImplementation(() => new Promise(r => { resolver = r; }));
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
    expect(voce.textContent).toBe(PT('guild.roda.voce'));
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
    vi.mocked(guildCheckin).mockResolvedValue(vista(4, {}, [0]));
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
