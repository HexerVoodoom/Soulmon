// @vitest-environment jsdom
/**
 * O PORTÃO DE IDENTIDADE (07/09/2026)
 * ===================================
 *
 * Por que ele existe — e não é UX, é dinheiro:
 *
 * `handleUnlockFull` compra chamando `purchase()`, que manda o `saveId` como
 * `obfuscatedAccountId`. O `saveId` **só existe derivado do e-mail**
 * (`emailToSaveId` = SHA-256 de `soulmon:<email>`); não há id anônimo nem por
 * aparelho. Enquanto a escolha grátis/completo morava no passo 0, um usuário
 * novo comprava com `saveId: undefined` e a compra chegava ao Google Play sem
 * `obfuscatedExternalAccountId`. No dia em que `PLAY_REQUIRE_ACCOUNT_BINDING`
 * for ligado (`functions/api/_billing.js`), essa compra é RECUSADA no resgate:
 * a pessoa paga e não recebe.
 *
 * A ORDEM também é regra, não gosto:
 *
 *  · o portão vem DEPOIS do consentimento — e-mail é dado pessoal, e o
 *    `CONSENT_STEP` existe justamente para os Termos virem antes da coleta
 *    (D-07);
 *  · e DEPOIS do 18+ — mandar link de acesso antes de conferir a idade seria
 *    escrever para quem o app não pode atender.
 *
 * E o portão NÃO pode virar porta trancada: sem `VITE_FIREBASE_*` a auth não
 * existe, e um passo obrigatório que depende dela deixaria um build sem `.env`
 * sem abrir.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';

vi.mock('../utils/auth', async () => {
  const real = await vi.importActual<typeof import('../utils/auth')>('../utils/auth');
  return {
    ...real,
    isAuthConfigured: () => authLigada,
    getCurrentEmail: async () => emailAtual,
    sendLoginLink: async (e: string) => { enviados.push(e); return envioOk; },
  };
});

let authLigada = true;
let emailAtual: string | null = null;
let envioOk: { ok: boolean; error?: string } = { ok: true };
let enviados: string[] = [];

const ir = (t: string) => fireEvent.click(screen.getByText(t));

/** Monta e ESPERA a resolução da auth.
 *
 *  `isAuthConfigured`/`getCurrentEmail` são resolvidos num efeito assíncrono;
 *  `fireEvent` é síncrono. Sem este flush o teste avançaria o consentimento
 *  antes de o componente saber se o portão existe — e mediria um estado que
 *  o usuário real nunca vê, porque para ele o efeito termina na montagem,
 *  muito antes de a mão chegar ao botão. */
async function montar() {
  renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
  await act(async () => {});
}

/** Intro → objetivo → dificuldade → consentimento + 18+ → (portão | escolha). */
function ateDepoisDoConsentimento() {
  ir('Get started');
  ir('I’d rather not say right now');
  ir('I’d rather not say right now');
  ir('I have read and agree to the Terms of Use and the Privacy Policy');
  fireEvent.change(screen.getByLabelText('What month and year were you born?'), {
    target: { value: '011990' },
  });
  fireEvent.click(screen.getByText('Continue').closest('button')!);
}

describe('portão de identidade', () => {
  beforeEach(() => {
    localStorage.clear();
    authLigada = true;
    emailAtual = null;
    envioOk = { ok: true };
    enviados = [];
  });

  it('a escolha grátis/completo NÃO é alcançável antes do portão', async () => {
    await montar();
    // O passo 0 tem UMA ação, e nenhuma delas é comprar.
    expect(screen.queryByText(/Get the full game/)).toBeNull();
    expect(screen.queryByText('Start now — it’s free')).toBeNull();

    ateDepoisDoConsentimento();
    // Caiu no portão, não na escolha.
    expect(screen.getByText('Send sign-in link')).toBeTruthy();
    expect(screen.queryByText(/Get the full game/)).toBeNull();
  });

  it('o portão NÃO é alcançável antes do consentimento e do 18+', async () => {
    await montar();
    ir('Get started');
    ir('I’d rather not say right now');
    ir('I’d rather not say right now');
    // Está no consentimento, e o portão ainda não existe na tela.
    expect(screen.getByText('Before we start')).toBeTruthy();
    expect(screen.queryByText('Send sign-in link')).toBeNull();

    // Marcar a caixa sem informar a idade não passa.
    ir('I have read and agree to the Terms of Use and the Privacy Policy');
    expect((screen.getByText('Continue').closest('button') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText('Send sign-in link')).toBeNull();
  });

  it('menor de 18 é barrado ANTES de qualquer link sair', async () => {
    await montar();
    ir('Get started');
    ir('I’d rather not say right now');
    ir('I’d rather not say right now');
    ir('I have read and agree to the Terms of Use and the Privacy Policy');
    fireEvent.change(screen.getByLabelText('What month and year were you born?'), {
      target: { value: '032015' },
    });
    fireEvent.click(screen.getByText('Continue').closest('button')!);
    expect(screen.getByText('Not quite yet')).toBeTruthy();
    expect(screen.queryByText('Send sign-in link')).toBeNull();
    // A regra que importa: NENHUM e-mail foi enviado para um menor.
    expect(enviados).toEqual([]);
  });

  it('manda o link e explica a espera; e-mail inválido não sai', async () => {
    await montar();
    ateDepoisDoConsentimento();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nao-e-email' } });
    ir('Send sign-in link');
    expect(enviados).toEqual([]);
    expect(screen.getByText('Enter a valid email.')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: '  Alguem@Exemplo.COM ' } });
    ir('Send sign-in link');
    // Normalizado: o saveId é derivado do e-mail, então caixa e espaço não
    // podem gerar duas contas para a mesma pessoa.
    expect(enviados).toEqual(['alguem@exemplo.com']);
  });

  it('falha no envio não é beco sem saída — dá para corrigir e tentar de novo', async () => {
    envioOk = { ok: false, error: 'boom' };
    await montar();
    ateDepoisDoConsentimento();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    ir('Send sign-in link');
    expect(await screen.findByRole('alert')).toBeTruthy();
    // O campo continua lá, editável.
    expect(screen.getByLabelText('Email')).toBeTruthy();
  });

  it('sem auth configurada o portão NÃO EXISTE — o app não pode ficar trancado', async () => {
    authLigada = false;
    await montar();
    ateDepoisDoConsentimento();
    expect(screen.queryByText('Send sign-in link')).toBeNull();
    expect(await screen.findByText('Start now — it’s free')).toBeTruthy();
  });

  it('quem já está autenticado não vê o portão', async () => {
    emailAtual = 'ja@logado.com';
    await montar();
    ateDepoisDoConsentimento();
    expect(screen.queryByText('Send sign-in link')).toBeNull();
    expect(await screen.findByText('Start now — it’s free')).toBeTruthy();
  });

  it('a guarda da compra olha o E-MAIL, não a presença do saveId', () => {
    // O saveId SEMPRE existe: `App.tsx` gera um UUID aleatório na primeira
    // abertura. Uma guarda por presença de saveId nunca dispararia — e é
    // exatamente esse UUID descartável que quebra a compra, porque o login
    // troca o saveId pelo SHA-256 do e-mail e `isPlayPurchaseBoundTo` compara
    // os dois por igualdade.
    const fonte = readFileSync(resolve(process.cwd(), 'src/components/SoulmonOnboarding.tsx'), 'utf-8');
    expect(fonte).toMatch(/if \(authUsavel && !authEmail\) \{/);
    expect(fonte).not.toMatch(/if \(authUsavel && !readLocal\(STORAGE_KEYS\.SAVE_ID\)\)/);
  });

  it('o texto do portão existe nos DOIS idiomas', () => {
    const fonte = readFileSync(resolve(process.cwd(), 'src/components/SoulmonOnboarding.tsx'), 'utf-8');
    for (const par of [
      ['Enviar link de acesso', 'Send sign-in link'],
      ['Confira seu e-mail', 'Check your email'],
      ['Usar outro e-mail', 'Use a different email'],
      ['Como você quer começar?', 'How do you want to start?'],
    ]) {
      for (const t of par) expect(fonte).toContain(t);
    }
  });
});
