// @vitest-environment jsdom
/**
 * Canvas Onboarding-funil — identidade (DECISÕES §23, 20/09/2026), o caminho
 * grátis, REESCRITO pelo checklist do dono de 01/10/2026:
 *  · B1 o nome do jogador é a 1ª pergunta depois da conta, sem copy embaixo;
 *  · B2/B3/B4/B5 o "porquê" virou objetivo (opções do catálogo), obrigatório,
 *    sem "prefiro não responder", e ganhou forças + ponto de partida;
 *  · B6 o voltar é a seta no canto superior esquerdo (`BackArrow`);
 *  · B7 "Get your own Soulmon"; B10 sem tonalidade; B11 "Name your Soulmon".
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { PREMADE_CHARACTERS } from '../utils/monetization';
import { atravessarRevealDemo } from '../test/ritualDemo';
import { responderNome, atravessarPerguntasIniciais } from '../test/metasOnboarding';

const btn = (nome: string | RegExp) => screen.getByRole('button', { name: nome }) as HTMLButtonElement;
const variante = (b: HTMLElement) => b.style.getPropertyValue('--sm2-btn');

function passarPortao() {
  fireEvent.click(screen.getByText('I have read and agree to the Terms of Use and the Privacy Policy'));
  fireEvent.click(screen.getByText('I am 18 or older'));
  fireEvent.click(btn('Continue'));
}

// Aquecimento: a leitura demo carrega as famílias do Oráculo por `import()`
// dinâmico. Frio e sob a suíte inteira em paralelo, esse primeiro import passou
// de 15 s e derrubava o 1º teste do arquivo (e, em cascata, os seguintes).
// Carregar uma vez aqui, com folga, tira o custo frio de dentro dos casos.
beforeAll(async () => { await import('../utils/oracle/familias'); }, 120_000);

describe('funil grátis — identidade do canvas', () => {
  const onComplete = vi.fn();
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-20T12:00:00Z'));
    installFakeStorage();
    onComplete.mockReset();
    renderWithCss(<SoulmonOnboarding onComplete={onComplete} />);
    passarPortao();
  });
  afterEach(() => { vi.useRealTimers(); });

  it('B1: o NOME é a primeira pergunta, sem copy embaixo, sem voltar, obrigatório', () => {
    expect(screen.getByText('What should we call you?')).toBeTruthy();
    expect(document.querySelector('[data-back-arrow]')).toBeNull();
    const cont = btn('Continue');
    expect(cont.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(cont);
    expect(screen.getByText('What should we call you?')).toBeTruthy();
    // nenhuma legenda sob o título
    expect(screen.getByText('What should we call you?').nextElementSibling?.tagName).not.toBe('P');
  });

  it('B2/B3/B5: metas objetivas, ≥1 obrigatório, sem "prefiro não responder"; seta de voltar no topo', () => {
    responderNome();
    expect(screen.getByText('What do you want to improve?')).toBeTruthy();
    expect(screen.queryByText(/rather not say/)).toBeNull();
    expect(document.querySelector('textarea')).toBeNull();
    const cont = btn('Continue');
    fireEvent.click(cont);
    expect(screen.getByText('What do you want to improve?')).toBeTruthy();
    // a seta é o PRIMEIRO elemento da coluna, acima do título
    const seta = document.querySelector('[data-back-arrow]') as HTMLElement;
    expect(seta).toBeTruthy();
    expect(seta.compareDocumentPosition(screen.getByText('What do you want to improve?')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getByRole('group').querySelector('button')!);
    fireEvent.click(btn('Continue'));
    expect(screen.getByText('What gets in your way the most?')).toBeTruthy();
    fireEvent.click(screen.getByRole('group').querySelector('button')!);
    fireEvent.click(btn('Continue'));
    expect(screen.getByText("What's already a strength?")).toBeTruthy();
    fireEvent.click(btn('Continue'));
    expect(screen.getByText("What's already a strength?")).toBeTruthy();
    fireEvent.click(screen.getByRole('group').querySelector('button')!);
    fireEvent.click(btn('Continue'));
    expect(screen.getByText('Your starting point')).toBeTruthy();
    // voltar pela seta
    fireEvent.click(btn('Back'));
    expect(screen.getByText("What's already a strength?")).toBeTruthy();
  });

  it('ponto de partida: tudo vem marcado; desmarcar tudo trava o avanço', () => {
    responderNome();
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('group').querySelector('button')!);
      fireEvent.click(btn('Continue'));
    }
    const caixas = Array.from(document.querySelectorAll('[data-starter-item] input[type=checkbox]')) as HTMLInputElement[];
    expect(caixas.length).toBeGreaterThan(0);
    expect(caixas.every(c => c.checked)).toBe(true);
    for (const c of caixas) fireEvent.click(c);
    expect(screen.getByText('Keep at least one.')).toBeTruthy();
    fireEvent.click(btn('Continue'));
    expect(screen.getByText('Your starting point')).toBeTruthy();
  });

  it('B7 Escolha: grátis primário, "Get your own Soulmon" outline (sem dourado), voltar pela seta', () => {
    atravessarPerguntasIniciais();
    expect(variante(btn('Start now — it’s free'))).toBe('primary');
    const pago = btn(/Get your own Soulmon/);
    expect(variante(pago)).toBe('outline');
    expect(pago.style.color).toBe('var(--sm2-ink)');
    expect(screen.queryByText(/Get the full game/)).toBeNull();
    fireEvent.click(btn('Back'));
    expect(screen.getByText('Your starting point')).toBeTruthy();
  });

  it('EscolherPersonagem: os 6 de PREMADE_CHARACTERS, cada um num vidro 128² com anel, em grade 2 colunas', async () => {
    atravessarPerguntasIniciais();
    fireEvent.click(btn('Start now — it’s free'));
    await atravessarRevealDemo();
    const cards = document.querySelectorAll('button[data-demo-char]');
    expect(cards.length).toBe(PREMADE_CHARACTERS.length);
    expect(cards.length).toBe(6);
    expect((cards[0].parentElement as HTMLElement).style.gridTemplateColumns).toContain('repeat(2');
    for (const c of cards) {
      const anel = c.querySelector('.sm2-viewport')!;
      const vidro = c.querySelector('.sm2-viewport-screen') as HTMLElement;
      expect(anel).toBeTruthy();
      expect(vidro.style.width).toBe('128px');
      expect(vidro.style.height).toBe('128px');
      const img = vidro.querySelector('img') as HTMLImageElement;
      expect(img.width).toBe(128);
      expect(c.getAttribute('aria-label')).toContain(' — ');
    }
  });

  it('CadastroDemo: heroína 128 num vidro 192²; SEM tonalidade (B10); "Name your Soulmon" solto (B11); voltar aos personagens', async () => {
    atravessarPerguntasIniciais();
    fireEvent.click(btn('Start now — it’s free'));
    await atravessarRevealDemo();
    fireEvent.click(screen.getByText(PREMADE_CHARACTERS[0].name).closest('button')!);
    const nome = PREMADE_CHARACTERS[0].name;
    const hero = screen.getByRole('img', { name: nome });
    const vidro = hero.querySelector('.sm2-viewport-screen') as HTMLElement;
    expect(vidro.style.width).toBe('192px');
    const img = vidro.querySelector('img[data-hero]') as HTMLImageElement;
    expect(img.style.width).toBe('128px');
    expect(img.style.filter).toBe('');
    expect(screen.queryByRole('group', { name: 'Tint' })).toBeNull();
    expect(screen.queryByText('Last details')).toBeNull();
    expect(screen.queryByText(/Your nickname/)).toBeNull();
    const titulo = screen.getByText('Name your Soulmon');
    expect(titulo.tagName).toBe('LABEL');
    expect(titulo.className).toContain('sm2-title');
    fireEvent.click(btn('Back'));
    expect(screen.getByText('Choose your Soulmon')).toBeTruthy();
  });

  it('o nome do começo vira o userName e as metas viajam em catalogChoice', async () => {
    atravessarPerguntasIniciais(false, 'Ana Lua');
    fireEvent.click(btn('Start now — it’s free'));
    await atravessarRevealDemo();
    fireEvent.click(screen.getByText(PREMADE_CHARACTERS[0].name).closest('button')!);
    fireEvent.click(btn(`Hatch ${PREMADE_CHARACTERS[0].name}`));
    expect(onComplete).toHaveBeenCalledTimes(1);
    const data = onComplete.mock.calls[0][0];
    expect(data.userName).toBe('Ana Lua');
    expect(data.demoTint).toBeUndefined();
    expect(data.catalogChoice.areas.length).toBe(1);
    expect(data.catalogChoice.struggles.length).toBe(1);
    expect(data.catalogChoice.strengths.length).toBe(1);
    expect(data.catalogChoice.itemIds.length).toBeGreaterThan(0);
    expect(data.soulGoal.length).toBeGreaterThan(0);
    expect(data.soulStruggle.length).toBeGreaterThan(0);
  });
});
