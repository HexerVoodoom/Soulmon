// @vitest-environment jsdom
/**
 * O requisito de Vínculo do Torneio, no CLIENTE — que é experiência, não trava.
 *
 * H13 (02/10/2026): o interruptor "Participar do PvP" SAIU — o personagem já
 * nasce no PvP. Sobrou o requisito (Vínculo 5, `BOND_PVP_MIN_LEVEL`): abaixo
 * dele a aba Desafiar EXPLICA por que não abre e o que falta (em vez de parecer
 * quebrada); a trava inforjável continua sendo a do servidor
 * (`functions/api/community.js` + `_bond.js`).
 *
 * E o outro lado, que não é sobre nível nenhum: estar no PvP põe o NICK DA
 * PESSOA numa lista pública (`action=players` devolve `name` para qualquer um).
 * O aviso fica na tela — informação, já que não há mais gesto de consentimento.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render as rtlRender, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { TournamentPage } from './TournamentPage';
import { xpForLevel, BOND_PVP_MIN_LEVEL } from '../utils/bond';

/** R8: o "i" ÚNICO da página (canto superior direito) explica tudo; abre por este botão. */
const abrirInfo = () => fireEvent.click(screen.getByRole('button', { name: /Sobre o Torneio|About the Tournament/ }));

/** A folha abre na Faixa; o requisito e o aviso moram na aba Desafiar. */
function render(ui: Parameters<typeof rtlRender>[0]) {
  const r = rtlRender(ui);
  fireEvent.click(screen.getByRole('tab', { name: /Desafiar|Challenge/ }));
  return r;
}

const props = {
  saveId: 'a'.repeat(32),
  petStage: 'rookie',
  onMatchPlayed: () => {},
  trophies: [],
  language: 'pt-BR',
  emblems: 0,
  onEarnEmblems: () => {},
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
/** A aba Faixa busca o ranking ao abrir; o que importa aqui é a busca de OPONENTES. */
const buscouOponentes = () => vi.mocked(fetch).mock.calls.some(c => /opponents/.test(String(c[0])));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('não existe mais interruptor de PvP', () => {
  it.each([0, xpForLevel(BOND_PVP_MIN_LEVEL)])('com totalXP=%i, nenhum switch na tela', totalXP => {
    render(<TournamentPage {...props} totalXP={totalXP} />);
    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.queryByText(/Participar do PvP|Join PvP/)).toBeNull();
  });
});

describe('abaixo do Vínculo 5 a aba EXPLICA, não parece quebrada', () => {
  it('diz que o Torneio abre no Vínculo 5, onde a pessoa está e quanto falta', () => {
    render(<TournamentPage {...props} totalXP={0} />);
    const card = document.querySelector('[data-torneio-requisito]') as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.textContent).toMatch(new RegExp(`Vínculo ${BOND_PVP_MIN_LEVEL}`));
    expect(card.textContent).toMatch(/faltam \d+ XP/);
    // R8: o "sem pressa" (progresso, nunca dívida) mora no "i" único da página.
    abrirInfo();
    expect(document.body.textContent).toMatch(/sem pressa/i);
    expect(card.querySelector('[role="progressbar"]')).not.toBeNull();
  });

  it('o porquê (é social) está dito atrás do "?"', () => {
    render(<TournamentPage {...props} totalXP={0} />);
    abrirInfo();
    expect(document.querySelector('[data-torneio-social]')?.textContent).toMatch(/lista pública/i);
  });

  it('em inglês, tudo em inglês', () => {
    render(<TournamentPage {...props} language="en-US" totalXP={0} />);
    const card = document.querySelector('[data-torneio-requisito]') as HTMLElement;
    expect(card.textContent).toMatch(new RegExp(`opens at Bond ${BOND_PVP_MIN_LEVEL}`));
    expect(card.textContent).toMatch(/XP to go/);
    expect(card.textContent).not.toMatch(/Vínculo|faltam/);
  });

  it('não procura oponentes enquanto o requisito não é cumprido', async () => {
    render(<TournamentPage {...props} totalXP={0} />);
    await new Promise(r => setTimeout(r, 50));
    expect(buscouOponentes()).toBe(false); // (a aba Faixa já busca o ranking, e isso é outra coisa)
  });
});

describe('a partir do Vínculo 5 o Desafiar abre, sem passo nenhum antes', () => {
  it('sem card de requisito; procura oponentes; mostra o aviso do apelido público', async () => {
    render(<TournamentPage {...props} totalXP={xpForLevel(BOND_PVP_MIN_LEVEL)} />);
    expect(document.querySelector('[data-torneio-requisito]')).toBeNull();
    expect(screen.queryByText(/Ative o PvP|Enable PvP/)).toBeNull();
    abrirInfo();
    expect(document.querySelector('[data-torneio-aviso-publico]')?.textContent).toMatch(/lista pública/i);
    await waitFor(() => expect(buscouOponentes()).toBe(true));
  });

  it('TORC-5: quem saiu da lista pública lê "Você está oculto da lista pública" (e continua com o Desafiar)', async () => {
    render(<TournamentPage {...props} ocultoDaLista totalXP={xpForLevel(BOND_PVP_MIN_LEVEL)} />);
    abrirInfo();
    const aviso = document.querySelector('[data-torneio-aviso-publico]')?.textContent ?? '';
    expect(aviso).toMatch(/oculto da lista pública/);
    expect(aviso).not.toMatch(/aparecem numa lista/);
    await waitFor(() => expect(buscouOponentes()).toBe(true));
  });

  it('o aviso está em inglês quando o idioma é inglês', () => {
    render(<TournamentPage {...props} language="en-US" totalXP={xpForLevel(BOND_PVP_MIN_LEVEL)} />);
    abrirInfo();
    expect(document.querySelector('[data-torneio-aviso-publico]')?.textContent).toMatch(/public list/i);
  });
});

describe('o treino aparece nos dois casos e a legenda da torcida mora no "i" único', () => {
  it.each([0, xpForLevel(BOND_PVP_MIN_LEVEL)])('totalXP=%i', totalXP => {
    render(<TournamentPage {...props} totalXP={totalXP} />);
    expect(document.querySelector('[data-torneio-treino]')).not.toBeNull();
    abrirInfo();
    expect(document.querySelector('[data-torcida-legenda]')).not.toBeNull();
  });
});
