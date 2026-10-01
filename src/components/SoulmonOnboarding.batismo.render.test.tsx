// @vitest-environment jsdom
/**
 * O NOME DO JOGADOR e o BATISMO, percorridos de verdade pela tela.
 *
 * 01/10/2026 (checklist do dono, B1/B11): o apelido virou a PRIMEIRA pergunta
 * do onboarding ("What should we call you?"), sem a legenda explicativa
 * embaixo — o exemplo INVENTADO no placeholder é o que sobrou do conserto de
 * privacidade (quem lê um exemplo de nome real digita o nome real). O batismo
 * do Soulmon segue com o nome sugerido PREENCHIDO — manter é não fazer nada,
 * trocar é digitar por cima — sob o título solto "Name your Soulmon".
 *
 * PT e EN sempre, porque a copy É o conserto.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding, type OnboardingCompleteData } from './SoulmonOnboarding';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { PREMADE_CHARACTERS } from '../utils/monetization';
import { atravessarRevealDemo } from '../test/ritualDemo';
import { atravessarPerguntasIniciais } from '../test/metasOnboarding';

function passarPortao(pt: boolean) {
  fireEvent.click(screen.getByText(
    pt
      ? 'Li e concordo com os Termos de Uso e a Política de Privacidade'
      : 'I have read and agree to the Terms of Use and the Privacy Policy',
  ));
  fireEvent.click(screen.getByText(pt ? 'Tenho 18 anos ou mais' : 'I am 18 or older'));
  fireEvent.click(screen.getByRole('button', { name: pt ? 'Continuar' : 'Continue' }));
}

/** Caminho demo: portão -> nome -> ritual + teste -> metas -> grátis -> leitura -> personagem -> batismo. */
async function ateOCadastro(pt: boolean, nome = 'BlueRaven') {
  passarPortao(pt);
  await atravessarPerguntasIniciais(pt, nome);
  fireEvent.click(screen.getByText(pt ? 'Começar agora — é grátis' : 'Start now — it’s free'));
  await atravessarRevealDemo(pt);
  fireEvent.click(screen.getByText(PREMADE_CHARACTERS[0].name).closest('button')!);
}

// Aquecimento: a leitura demo carrega as famílias do Oráculo por `import()`
// dinâmico. Frio e sob a suíte inteira em paralelo, esse primeiro import passou
// de 15 s e derrubava o 1º teste do arquivo (e, em cascata, os seguintes).
// Carregar uma vez aqui, com folga, tira o custo frio de dentro dos casos.
beforeAll(async () => { await import('../utils/oracle/familias'); }, 120_000);

describe('nome do jogador primeiro, e Soulmon batizado', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-25T12:00:00Z'));
    installFakeStorage();
  });
  afterEach(() => { vi.useRealTimers(); });

  it('EN — o nome é a 1ª pergunta; o exemplo é inventado e não há legenda embaixo', () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    passarPortao(false);
    const campo = screen.getByLabelText('Your name') as HTMLInputElement;
    expect(campo.getAttribute('placeholder')).toBe('E.g.: BlueRaven');
    expect(screen.queryByText(/doesn't have to be your real name/i)).toBeNull();
  });

  it('PT — mesma pergunta, mesmo exemplo inventado', () => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'pt-BR');
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    passarPortao(true);
    expect(screen.getByText('Como podemos te chamar?')).toBeTruthy();
    expect((screen.getByLabelText('Seu nome') as HTMLInputElement).getAttribute('placeholder')).toBe('Ex.: CorvoAzul');
  });

  it('EN — o nome sugerido do Soulmon já vem preenchido: manter é não fazer nada', async () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    await ateOCadastro(false);
    const campo = screen.getByLabelText(/name your soulmon/i) as HTMLInputElement;
    expect(campo.value.trim().length).toBeGreaterThan(1);
  });

  it('PT — o campo do batismo existe e vem com a sugestão', async () => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'pt-BR');
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    await ateOCadastro(true);
    const campo = screen.getByLabelText(/dê nome ao seu soulmon/i) as HTMLInputElement;
    expect(campo.value.trim().length).toBeGreaterThan(1);
  });

  it('EN — manter o sugerido não exige toque nenhum no campo', async () => {
    let recebido: OnboardingCompleteData | null = null;
    renderWithCss(<SoulmonOnboarding onComplete={d => { recebido = d; }} />);
    await ateOCadastro(false, 'BlueRaven');
    const sugerido = (screen.getByLabelText(/name your soulmon/i) as HTMLInputElement).value;
    fireEvent.click(screen.getByRole('button', { name: /hatch/i }));
    await vi.waitFor(() => expect(recebido).not.toBeNull());
    expect(recebido!.userName).toBe('BlueRaven');
    expect(recebido!.petName).toBe(sugerido);
  });

  it('PT — trocar o nome do Soulmon é digitar por cima, e é o nome trocado que sai', async () => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'pt-BR');
    let recebido: OnboardingCompleteData | null = null;
    renderWithCss(<SoulmonOnboarding onComplete={d => { recebido = d; }} />);
    await ateOCadastro(true, 'CorvoAzul');
    fireEvent.change(screen.getByLabelText(/dê nome ao seu soulmon/i), { target: { value: 'Farofa' } });
    fireEvent.click(screen.getByRole('button', { name: /nascer/i }));
    await vi.waitFor(() => expect(recebido).not.toBeNull());
    expect(recebido!.petName).toBe('Farofa');
    expect(recebido!.userName).toBe('CorvoAzul');
  });

  it('apagar o campo do batismo volta ao sugerido — nunca fica sem nome', async () => {
    let recebido: OnboardingCompleteData | null = null;
    renderWithCss(<SoulmonOnboarding onComplete={d => { recebido = d; }} />);
    await ateOCadastro(false);
    const sugerido = (screen.getByLabelText(/name your soulmon/i) as HTMLInputElement).value;
    fireEvent.change(screen.getByLabelText(/name your soulmon/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /hatch/i }));
    await vi.waitFor(() => expect(recebido).not.toBeNull());
    expect(recebido!.petName).toBe(sugerido);
  });
});
