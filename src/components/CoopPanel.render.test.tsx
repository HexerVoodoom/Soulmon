// @vitest-environment jsdom
/**
 * O painel do modo cooperativo (Fase 4.3, `docs/PLANO-COOP.md`).
 *
 * Estes testes não conferem se a tela "funciona" — conferem as quatro coisas
 * que, se caírem, transformam o modo cooperativo no que a pesquisa do próprio
 * projeto manda evitar:
 *
 *  1. **Nenhuma comparação individual na tela.** O item 4.2 do
 *     `docs/PLANO-EVOLUCAO.md` registra 31,3% de efeito psicológico negativo
 *     de comparação em ambiente de leaderboard. Presença é binária; o número é
 *     do grupo.
 *  2. **Sair é um toque, sem diálogo de confirmação.** Um "tem certeza?" aqui
 *     é o app negociando com quem já decidiu sair.
 *  3. **O check-in só vale com a meta PRÓPRIA cumprida** — e quando não está,
 *     o texto diz o que falta, nunca o que a pessoa deixou de fazer.
 *  4. **PT e EN**, como todo texto do app.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import type { CoopGroup } from '../utils/community';

vi.mock('../utils/community', async (orig) => {
  const real = await orig<typeof import('../utils/community')>();
  return {
    ...real,
    getCoop: vi.fn(), createCoop: vi.fn(), joinCoop: vi.fn(),
    coopCheckin: vi.fn(), leaveCoop: vi.fn(),
  };
});

import { CoopPanel } from './CoopPanel';
import { getCoop, coopCheckin, leaveCoop, createCoop } from '../utils/community';

const grupo = (over: Partial<CoopGroup> = {}): CoopGroup => ({
  id: 'g1', name: 'Time da manhã', weekKey: '2026-W37', code: 'ABCD2345',
  members: [
    { id: 'pid-a', name: 'Ana', stage: 'rookie', apareceuHoje: true, euMesmo: true },
    { id: 'pid-b', name: 'Bia', stage: 'rookie', apareceuHoje: false, euMesmo: false },
  ],
  progress: 3, target: 10, full: false,
  ...over,
});

const props = (over: Partial<React.ComponentProps<typeof CoopPanel>> = {}) => ({
  saveId: 'save-1',
  language: 'pt-BR' as const,
  metaDoDiaCumprida: true,
  ...over,
});

beforeEach(() => {
  vi.mocked(getCoop).mockReset();
  vi.mocked(coopCheckin).mockReset();
  vi.mocked(leaveCoop).mockReset();
  vi.mocked(createCoop).mockReset();
});

describe('CoopPanel — sem grupo', () => {
  it('não ter grupo NÃO é erro: mostra criar e entrar', async () => {
    vi.mocked(getCoop).mockResolvedValue(null);
    renderWithCss(<CoopPanel {...props()} />);
    expect(await screen.findByText('Criar')).toBeTruthy();
    expect(screen.getByText('Entrar')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('entra-se por CÓDIGO — não há busca de grupos', async () => {
    // Grupo achável é raide de estranho. Se um campo de busca aparecer aqui,
    // o convite deixou de ser a única porta.
    vi.mocked(getCoop).mockResolvedValue(null);
    renderWithCss(<CoopPanel {...props()} />);
    await screen.findByText('Criar');
    expect(screen.getByPlaceholderText('ABCD2345')).toBeTruthy();
    expect(screen.queryByPlaceholderText(/Buscar/)).toBeNull();
  });

  it('criar exige um nome — botão desabilitado enquanto vazio', async () => {
    vi.mocked(getCoop).mockResolvedValue(null);
    renderWithCss(<CoopPanel {...props()} />);
    const botao = await screen.findByText('Criar');
    expect((botao as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText('Nome do grupo'), { target: { value: 'Time' } });
    expect((screen.getByText('Criar') as HTMLButtonElement).disabled).toBe(false);
  });
});

describe('CoopPanel — a comparação individual não existe', () => {
  it('mostra presença binária, e o número só do GRUPO', async () => {
    vi.mocked(getCoop).mockResolvedValue(grupo());
    renderWithCss(<CoopPanel {...props()} />);
    expect(await screen.findByText('3 de 10 nesta semana')).toBeTruthy();
    expect(screen.getByText('apareceu hoje')).toBeTruthy();
    expect(screen.getByText('ainda não hoje')).toBeTruthy();
  });

  it('a barra é do grupo, e é acessível como uma só', async () => {
    vi.mocked(getCoop).mockResolvedValue(grupo());
    renderWithCss(<CoopPanel {...props()} />);
    const barras = await screen.findAllByRole('progressbar');
    expect(barras).toHaveLength(1);
    expect(barras[0].getAttribute('aria-valuenow')).toBe('3');
    expect(barras[0].getAttribute('aria-valuemax')).toBe('10');
  });

  it('grupo de UMA pessoa tem texto próprio — não é uma barra órfã', async () => {
    vi.mocked(getCoop).mockResolvedValue(grupo({
      members: [{ id: 'pid-a', name: 'Ana', stage: 'rookie', apareceuHoje: false, euMesmo: true }],
      progress: 0, target: 5,
    }));
    renderWithCss(<CoopPanel {...props()} />);
    expect(await screen.findByText(/Por enquanto é só você/)).toBeTruthy();
  });
});

describe('CoopPanel — check-in', () => {
  it('sem a meta própria do dia, o botão não age e o texto diz o que FALTA', async () => {
    vi.mocked(getCoop).mockResolvedValue(grupo({
      members: [{ id: 'pid-a', name: 'Ana', stage: 'rookie', apareceuHoje: false, euMesmo: true }],
    }));
    renderWithCss(<CoopPanel {...props({ metaDoDiaCumprida: false })} />);
    const botao = await screen.findByText('Avisar que apareci hoje');
    expect((botao as HTMLButtonElement).disabled).toBe(true);
    // Nada de "você não fez": diz o que vale, no futuro.
    expect(screen.getByText(/Vale quando você cumprir a sua própria meta do dia/)).toBeTruthy();
    fireEvent.click(botao);
    expect(coopCheckin).not.toHaveBeenCalled();
  });

  it('quem já apareceu hoje não vê o botão de novo', async () => {
    vi.mocked(getCoop).mockResolvedValue(grupo());
    renderWithCss(<CoopPanel {...props()} />);
    await screen.findByText('Time da manhã');
    expect(screen.queryByText('Avisar que apareci hoje')).toBeNull();
  });

  it('com a meta cumprida, avisa o servidor e a tela acompanha', async () => {
    vi.mocked(getCoop).mockResolvedValue(grupo({
      members: [{ id: 'pid-a', name: 'Ana', stage: 'rookie', apareceuHoje: false, euMesmo: true }],
      progress: 0, target: 5,
    }));
    vi.mocked(coopCheckin).mockResolvedValue(grupo({
      members: [{ id: 'pid-a', name: 'Ana', stage: 'rookie', apareceuHoje: true, euMesmo: true }],
      progress: 1, target: 5,
    }));
    renderWithCss(<CoopPanel {...props()} />);
    fireEvent.click(await screen.findByText('Avisar que apareci hoje'));
    await waitFor(() => expect(coopCheckin).toHaveBeenCalledWith('save-1'));
    expect(await screen.findByText('1 de 5 nesta semana')).toBeTruthy();
  });
});

describe('CoopPanel — sair é limpo', () => {
  it('um toque, SEM diálogo de confirmação', async () => {
    vi.mocked(getCoop).mockResolvedValue(grupo());
    vi.mocked(leaveCoop).mockResolvedValue({ ok: true });
    renderWithCss(<CoopPanel {...props()} />);
    fireEvent.click(await screen.findByText('Sair do grupo'));
    await waitFor(() => expect(leaveCoop).toHaveBeenCalledWith('save-1'));
    // Sem confirmação: já saiu, e a tela volta a oferecer criar/entrar.
    expect(await screen.findByText('Criar')).toBeTruthy();
  });
});

describe('CoopPanel — erro e idioma', () => {
  it('código inválido vira frase humana, não o texto do servidor', async () => {
    vi.mocked(getCoop).mockResolvedValue(null);
    vi.mocked(createCoop).mockRejectedValue(new Error('already in a group'));
    renderWithCss(<CoopPanel {...props()} />);
    fireEvent.change(await screen.findByPlaceholderText('Nome do grupo'), { target: { value: 'Time' } });
    fireEvent.click(screen.getByText('Criar'));
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toBe('Você já está num grupo.');
  });

  it('fala os dois idiomas', async () => {
    vi.mocked(getCoop).mockResolvedValue(grupo());
    renderWithCss(<CoopPanel {...props()} />);
    expect(await screen.findByText('3 de 10 nesta semana')).toBeTruthy();
    expect(screen.getByText('Sair do grupo')).toBeTruthy();
    cleanup();
    renderWithCss(<CoopPanel {...props({ language: 'en-US' })} />);
    expect(await screen.findByText('3 of 10 this week')).toBeTruthy();
    expect(screen.getByText('Leave the group')).toBeTruthy();
    expect(screen.getByText('showed up today')).toBeTruthy();
  });
});
