// @vitest-environment jsdom
/**
 * O NOME DO JOGADOR e o BATISMO, percorridos de verdade pela tela.
 *
 * 01/10/2026 (checklist do dono, B1/B11): o apelido virou a PRIMEIRA pergunta
 * do onboarding ("What should we call you?"), sem a legenda explicativa
 * embaixo — o exemplo INVENTADO no placeholder é o que sobrou do conserto de
 * privacidade (quem lê um exemplo de nome real digita o nome real). O batismo
 * do Soulmon (o campo "Name your Soulmon", sugerido PREENCHIDO) mora só no reveal
 * do caminho PAGO desde o §81 (sem render de teste até ali: exige geração real); a demo entra com o guia já nomeado.
 *
 * PT e EN sempre, porque a copy É o conserto.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding, type OnboardingCompleteData } from './SoulmonOnboarding';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { PREMADE_CHARACTERS } from '../utils/monetization';
import { entrarNaDemoPeloOvo } from '../test/ovoOnboarding';
import { atravessarPerguntasIniciais, passarApresentacaoDaAmbra } from '../test/metasOnboarding';

function passarPortao(pt: boolean) {
  fireEvent.click(screen.getByText(
    pt
      ? 'Li e concordo com os Termos de Uso e a Política de Privacidade'
      : 'I have read and agree to the Terms of Use and the Privacy Policy',
  ));
  fireEvent.click(screen.getByText(pt ? 'Tenho 18 anos ou mais' : 'I am 18 or older'));
  fireEvent.click(screen.getByRole('button', { name: pt ? 'Continuar' : 'Continue' }));
  passarApresentacaoDaAmbra(); // §81: a Ambra se apresenta entre os Termos e o nome
}

/** Caminho demo (§81): portão -> Ambra -> nome -> ritual + teste -> metas -> ovo -> guia -> confirmar -> Ambra. */
async function ateADemo(pt: boolean, nome = 'BlueRaven') {
  passarPortao(pt);
  await atravessarPerguntasIniciais(pt, nome);
  entrarNaDemoPeloOvo(pt);
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

  /* §81 (15/10/2026): o batismo da DEMO saiu — o Soulmon guia entra com o nome dele, sem tela de cadastro. O campo "Name your
     Soulmon" continua só no reveal do caminho PAGO (depois do "Chocar" e da geração). */
  it('EN — a demo não tem tela de batismo: o guia entra com o próprio nome, e o nome do jogador sai', async () => {
    let recebido: OnboardingCompleteData | null = null;
    renderWithCss(<SoulmonOnboarding onComplete={d => { recebido = d; }} />);
    await ateADemo(false, 'BlueRaven');
    await vi.waitFor(() => expect(recebido).not.toBeNull());
    expect(screen.queryByLabelText(/name your soulmon/i)).toBeNull();
    expect(recebido!.userName).toBe('BlueRaven');
    expect(recebido!.petName).toBe(PREMADE_CHARACTERS[0].name);
  });

  it('PT — idem em português', async () => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'pt-BR');
    let recebido: OnboardingCompleteData | null = null;
    renderWithCss(<SoulmonOnboarding onComplete={d => { recebido = d; }} />);
    await ateADemo(true, 'CorvoAzul');
    await vi.waitFor(() => expect(recebido).not.toBeNull());
    expect(screen.queryByLabelText(/dê nome ao seu soulmon/i)).toBeNull();
    expect(recebido!.userName).toBe('CorvoAzul');
    expect(recebido!.petName).toBe(PREMADE_CHARACTERS[0].name);
  });
});
