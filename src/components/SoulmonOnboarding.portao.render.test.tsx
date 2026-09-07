// @vitest-environment jsdom
/**
 * O PORTÃO DE IDENTIDADE (07/09/2026)
 * ===================================
 *
 * Por que ele existe — e não é UX, é dinheiro:
 *
 * `handleUnlockFull` compra chamando `purchase()`, que manda o `saveId` como
 * `obfuscatedAccountId`. Antes do login esse saveId é um UUID ALEATÓRIO gerado
 * por `App.tsx` na primeira abertura; ao entrar, ele é SUBSTITUÍDO pelo
 * SHA-256 do e-mail. `isPlayPurchaseBoundTo` compara os dois por igualdade:
 *
 *     if (bound) return !!saveId && String(bound) === String(saveId);
 *
 * Como o campo vem PREENCHIDO, cai no ramo da igualdade e falha — a compra é
 * recusada INCLUSIVE com `PLAY_REQUIRE_ACCOUNT_BINDING` desligado. A pessoa
 * paga e não recebe.
 *
 * A ORDEM também é regra, não gosto:
 *
 *  · o portão vem DEPOIS do consentimento — e-mail é dado pessoal, e o
 *    `CONSENT_STEP` existe para os Termos virem antes da coleta (D-07);
 *  · e DEPOIS do 18+ — autenticar antes de conferir a idade seria abrir conta
 *    para quem o app não pode atender.
 *
 * FORMATO (decidido pelo dono em 07/09/2026): entrar com Google, ou e-mail +
 * senha com "Entrar" e "Criar conta". O Google importa porque não depende de
 * e-mail CHEGAR: o link deste projeto cai no spam do Gmail (remetente
 * `firebaseapp.com` sem domínio próprio, medido no mesmo dia).
 *
 * E o portão NÃO pode virar porta trancada: sem `VITE_FIREBASE_*` a auth não
 * existe, e um passo obrigatório que dependesse dela deixaria um build sem
 * `.env` sem abrir.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';

vi.mock('../utils/auth', async () => {
  const real = await vi.importActual<typeof import('../utils/auth')>('../utils/auth');
  return {
    ...real,
    isAuthConfigured: () => authLigada,
    getCurrentEmail: async () => emailAtual,
    entrarComSenha: async (e: string, s: string) => { chamadas.push(`entrar:${e}:${s}`); return resposta; },
    criarContaComSenha: async (e: string, s: string) => { chamadas.push(`criar:${e}:${s}`); return resposta; },
    entrarComGoogle: async () => { chamadas.push('google'); return resposta; },
    mandarResetDeSenha: async (e: string) => { chamadas.push(`reset:${e}`); return resposta; },
  };
});

let authLigada = true;
let emailAtual: string | null = null;
let resposta: { ok: boolean; email?: string; erro?: string } = { ok: true, email: 'a@b.com' };
let chamadas: string[] = [];

const ir = (t: string) => fireEvent.click(screen.getByText(t));
/** Clica por PAPEL. O título da tela e o botão principal têm o mesmo texto
 *  ("Entrar"/"Sign in", "Criar conta"/"Create account"), então `getByText`
 *  acha dois nós — e o `<h2>` não é clicável. */
const botao = (nome: string) => fireEvent.click(screen.getByRole('button', { name: nome }));

/** Monta e ESPERA a resolução da auth, que é assíncrona (efeito de montagem).
 *  Sem este flush o teste avançaria antes de o componente saber se o portão
 *  existe — e mediria um estado que o usuário real nunca vê. */
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

const campoEmail = () => screen.getByLabelText('Email');
const campoSenha = () => screen.getByLabelText('Password');

describe('portão de identidade', () => {
  beforeEach(() => {
    localStorage.clear();
    authLigada = true;
    emailAtual = null;
    resposta = { ok: true, email: 'a@b.com' };
    chamadas = [];
  });

  it('a escolha grátis/completo NÃO é alcançável antes do portão', async () => {
    await montar();
    // O passo 0 tem UMA ação, e nenhuma delas é comprar.
    expect(screen.queryByText(/Get the full game/)).toBeNull();
    expect(screen.queryByText('Start now — it’s free')).toBeNull();

    ateDepoisDoConsentimento();
    expect(screen.getByText('Continue with Google')).toBeTruthy();
    expect(screen.queryByText(/Get the full game/)).toBeNull();
  });

  it('o portão NÃO é alcançável antes do consentimento e do 18+', async () => {
    await montar();
    ir('Get started');
    ir('I’d rather not say right now');
    ir('I’d rather not say right now');
    expect(screen.getByText('Before we start')).toBeTruthy();
    expect(screen.queryByText('Continue with Google')).toBeNull();

    // Marcar a caixa sem informar a idade não passa.
    ir('I have read and agree to the Terms of Use and the Privacy Policy');
    expect((screen.getByText('Continue').closest('button') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText('Continue with Google')).toBeNull();
  });

  it('menor de 18 é barrado ANTES de qualquer autenticação', async () => {
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
    expect(screen.queryByText('Continue with Google')).toBeNull();
    // A regra que importa: NENHUMA conta foi tocada para um menor.
    expect(chamadas).toEqual([]);
  });

  it('entrar com senha: normaliza o e-mail e leva à escolha', async () => {
    await montar();
    ateDepoisDoConsentimento();
    fireEvent.change(campoEmail(), { target: { value: '  Alguem@Exemplo.COM ' } });
    fireEvent.change(campoSenha(), { target: { value: 'segredo123' } });
    await act(async () => { botao('Sign in'); });
    // Normalizado: o saveId é derivado do e-mail, então caixa e espaço não
    // podem gerar duas contas para a mesma pessoa.
    expect(chamadas).toEqual(['entrar:alguem@exemplo.com:segredo123']);
    expect(screen.getByText('Start now — it’s free')).toBeTruthy();
  });

  it('"Criar conta" é uma ação DIFERENTE de entrar', async () => {
    await montar();
    ateDepoisDoConsentimento();
    botao('Create account');
    fireEvent.change(campoEmail(), { target: { value: 'novo@exemplo.com' } });
    fireEvent.change(campoSenha(), { target: { value: 'segredo123' } });
    await act(async () => { botao('Create account'); });
    expect(chamadas).toEqual(['criar:novo@exemplo.com:segredo123']);
  });

  it('senha curta nem chega à rede', async () => {
    await montar();
    ateDepoisDoConsentimento();
    botao('Create account');
    fireEvent.change(campoEmail(), { target: { value: 'novo@exemplo.com' } });
    fireEvent.change(campoSenha(), { target: { value: '123' } });
    await act(async () => { botao('Create account'); });
    expect(chamadas).toEqual([]);
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('entrar com Google não pede e-mail nenhum', async () => {
    await montar();
    ateDepoisDoConsentimento();
    await act(async () => { botao('Continue with Google'); });
    expect(chamadas).toEqual(['google']);
    expect(screen.getByText('Start now — it’s free')).toBeTruthy();
  });

  it('falha de credencial mostra recado acionável e NÃO avança', async () => {
    resposta = { ok: false, erro: 'credencial-invalida' };
    await montar();
    ateDepoisDoConsentimento();
    fireEvent.change(campoEmail(), { target: { value: 'a@b.com' } });
    fireEvent.change(campoSenha(), { target: { value: 'errada' } });
    await act(async () => { botao('Sign in'); });
    expect(screen.getByRole('alert').textContent).toContain("Email or password don't match");
    expect(screen.queryByText('Start now — it’s free')).toBeNull();
    // O campo continua editável: nunca um beco sem saída.
    expect(campoSenha()).toBeTruthy();
  });

  it('recuperar senha responde IGUAL para conta existente e inexistente', async () => {
    // Dizer "não achamos esse e-mail" entregaria a quem perguntar quais
    // endereços têm conta no app.
    await montar();
    ateDepoisDoConsentimento();
    fireEvent.change(campoEmail(), { target: { value: 'a@b.com' } });
    await act(async () => { botao('I forgot my password'); });
    const comConta = screen.getByRole('status').textContent;

    resposta = { ok: false, erro: 'nao-encontrado' };
    // Desmonta o primeiro: sem isto os dois onboardings coexistem no mesmo
    // container e a busca acha dois botões com o mesmo nome.
    cleanup();
    localStorage.clear();
    await montar();
    ateDepoisDoConsentimento();
    fireEvent.change(campoEmail(), { target: { value: 'nao-existe@b.com' } });
    await act(async () => { botao('I forgot my password'); });
    expect(screen.getByRole('status').textContent).toBe(comConta);
  });

  it('sem auth configurada o portão NÃO EXISTE — o app não pode ficar trancado', async () => {
    authLigada = false;
    await montar();
    ateDepoisDoConsentimento();
    expect(screen.queryByText('Continue with Google')).toBeNull();
    expect(await screen.findByText('Start now — it’s free')).toBeTruthy();
  });

  it('quem já está autenticado não vê o portão', async () => {
    emailAtual = 'ja@logado.com';
    await montar();
    ateDepoisDoConsentimento();
    expect(screen.queryByText('Continue with Google')).toBeNull();
    expect(await screen.findByText('Start now — it’s free')).toBeTruthy();
  });

  it('a guarda da compra olha o E-MAIL, não a presença do saveId', () => {
    // O saveId SEMPRE existe: `App.tsx` gera um UUID aleatório na primeira
    // abertura. Guarda por presença de saveId nunca dispararia — e é esse UUID
    // descartável que quebra a compra.
    const fonte = readFileSync(resolve(process.cwd(), 'src/components/SoulmonOnboarding.tsx'), 'utf-8');
    expect(fonte).toMatch(/if \(authUsavel && !authEmail\) \{/);
  });

  it('a sessão é declarada PERSISTENTE — não se refaz login a cada abertura', () => {
    // O Firebase já usa `browserLocalPersistence` por padrão, mas "por padrão"
    // muda numa atualização de SDK sem ninguém notar, e o sintoma seria o pior
    // possível: perder o acesso ao save a cada abertura.
    const fonte = readFileSync(resolve(process.cwd(), 'src/utils/auth.ts'), 'utf-8');
    expect(fonte).toContain('browserLocalPersistence');
    for (const f of ['entrarComSenha', 'criarContaComSenha', 'entrarComGoogle']) {
      const corpo = fonte.slice(fonte.indexOf(`export async function ${f}`));
      expect(corpo.slice(0, 700)).toContain('garantirPersistencia');
    }
  });

  it('o texto do portão existe nos DOIS idiomas', () => {
    const fonte = readFileSync(resolve(process.cwd(), 'src/components/SoulmonOnboarding.tsx'), 'utf-8');
    for (const par of [
      ['Entrar com Google', 'Continue with Google'],
      ['Criar conta', 'Create account'],
      ['Esqueci minha senha', 'I forgot my password'],
      ['Senha', 'Password'],
      ['Como você quer começar?', 'How do you want to start?'],
    ]) {
      for (const t of par) expect(fonte).toContain(t);
    }
  });
});
