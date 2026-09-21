// @vitest-environment jsdom
/**
 * O NICK e o BATISMO, percorridos de verdade pela tela de cadastro.
 *
 * Duas coisas que nenhum teste de unidade alcança:
 *
 * 1. O campo de apelido JÁ existia, mas a moldura dizia só "visível para
 *    outros jogadores" e o exemplo era um primeiro nome ("Ex.: Mateus").
 *    Quem lê isso digita o nome real — e o nome real é o que a auditoria
 *    encontrou no diretório público. O conserto é de COPY: dizer, sem susto,
 *    que dá para inventar. Só o render enxerga copy.
 * 2. O batismo do Soulmon não existia: o bicho nascia com o nome do oráculo e
 *    pronto. Agora o nome sugerido vem PREENCHIDO — manter é não fazer nada,
 *    trocar é digitar por cima.
 *
 * PT e EN sempre, porque a copy É o conserto.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding, type OnboardingCompleteData } from './SoulmonOnboarding';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { PREMADE_CHARACTERS } from '../utils/monetization';
import { atravessarRevealDemo } from '../test/ritualDemo';

/** Caminho demo: portão (aceite + idade) -> objetivo -> dificuldade ->
 *  escolha grátis/completo -> personagem -> cadastro. O mais curto até o
 *  batismo, na ordem de 07/09/2026. */
function ateOCadastro(pt: boolean) {
  // Portão primeiro: aceite + idade vivem nele, e ele abre o app.
  fireEvent.click(screen.getByText(
    pt
      ? 'Li e concordo com os Termos de Uso e a Política de Privacidade'
      : 'I have read and agree to the Terms of Use and the Privacy Policy',
  ));
  fireEvent.click(screen.getByText(pt ? 'Tenho 18 anos ou mais' : 'I am 18 or older'));
  fireEvent.click(screen.getByRole('button', { name: pt ? 'Continuar' : 'Continue' }));
  const pular = pt ? 'Prefiro não responder agora' : 'I’d rather not say right now';
  fireEvent.click(screen.getByText(pular)); // objetivo
  fireEvent.click(screen.getByText(pular)); // dificuldade
  // A escolha grátis/completo desceu do passo 0 para DEPOIS do consentimento e
  // do portão de e-mail (07/09/2026) — com a auth desligada no teste, o portão
  // não existe e o consentimento cai direto aqui.
  fireEvent.click(screen.getByText(pt ? 'Começar agora — é grátis' : 'Start now — it’s free'));
  // 13.19: o grátis responde as 6 perguntas e vê o reveal demo antes do personagem.
  atravessarRevealDemo(pt);
  // Escolhe o primeiro personagem pré-pronto — leva direto ao cadastro.
  fireEvent.click(screen.getByText(PREMADE_CHARACTERS[0].name).closest('button')!);
}

describe('cadastro: apelido enquadrado e Soulmon batizado', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-25T12:00:00Z'));
    installFakeStorage();
  });
  afterEach(() => { vi.useRealTimers(); });

  it('EN — o apelido diz que pode ser inventado, e o exemplo não é um nome real', () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    ateOCadastro(false);
    const nick = screen.getByLabelText('Your nickname') as HTMLInputElement;
    expect(nick).toBeTruthy();
    // A oferta: não precisa ser o nome real. Convite, nunca aviso de perigo.
    expect(screen.getByText(/doesn't have to be your real name/i)).toBeTruthy();
    expect(nick.getAttribute('placeholder')).not.toMatch(/Matt/);
  });

  it('PT — mesma oferta, mesma moldura', () => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'pt-BR');
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    ateOCadastro(true);
    expect(screen.getByLabelText('Seu apelido')).toBeTruthy();
    expect(screen.getByText(/não precisa ser seu nome real/i)).toBeTruthy();
  });

  it('EN — o nome sugerido do Soulmon já vem preenchido: manter é não fazer nada', () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    ateOCadastro(false);
    const campo = screen.getByLabelText(/name your soulmon/i) as HTMLInputElement;
    // Sugerido, não vazio: um formulário em branco obrigaria a inventar.
    expect(campo.value.trim().length).toBeGreaterThan(1);
  });

  it('PT — o campo do batismo existe e vem com a sugestão', () => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'pt-BR');
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    ateOCadastro(true);
    const campo = screen.getByLabelText(/batize seu soulmon/i) as HTMLInputElement;
    expect(campo.value.trim().length).toBeGreaterThan(1);
  });

  it('EN — manter o sugerido não exige toque nenhum no campo', async () => {
    let recebido: OnboardingCompleteData | null = null;
    renderWithCss(<SoulmonOnboarding onComplete={d => { recebido = d; }} />);
    ateOCadastro(false);
    const sugerido = (screen.getByLabelText(/name your soulmon/i) as HTMLInputElement).value;
    fireEvent.change(screen.getByLabelText('Your nickname'), { target: { value: 'BlueRaven' } });
    fireEvent.click(screen.getByRole('button', { name: /hatch/i }));
    await vi.waitFor(() => expect(recebido).not.toBeNull());
    expect(recebido!.userName).toBe('BlueRaven');
    expect(recebido!.petName).toBe(sugerido);
  });

  it('PT — trocar o nome do Soulmon é digitar por cima, e é o nome trocado que sai', async () => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'pt-BR');
    let recebido: OnboardingCompleteData | null = null;
    renderWithCss(<SoulmonOnboarding onComplete={d => { recebido = d; }} />);
    ateOCadastro(true);
    fireEvent.change(screen.getByLabelText(/batize seu soulmon/i), { target: { value: 'Farofa' } });
    fireEvent.change(screen.getByLabelText('Seu apelido'), { target: { value: 'CorvoAzul' } });
    fireEvent.click(screen.getByRole('button', { name: /nascer/i }));
    await vi.waitFor(() => expect(recebido).not.toBeNull());
    expect(recebido!.petName).toBe('Farofa');
  });

  it('apagar o campo do batismo volta ao sugerido — nunca fica sem nome', async () => {
    let recebido: OnboardingCompleteData | null = null;
    renderWithCss(<SoulmonOnboarding onComplete={d => { recebido = d; }} />);
    ateOCadastro(false);
    const sugerido = (screen.getByLabelText(/name your soulmon/i) as HTMLInputElement).value;
    fireEvent.change(screen.getByLabelText(/name your soulmon/i), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('Your nickname'), { target: { value: 'BlueRaven' } });
    fireEvent.click(screen.getByRole('button', { name: /hatch/i }));
    await vi.waitFor(() => expect(recebido).not.toBeNull());
    expect(recebido!.petName).toBe(sugerido);
  });
});
