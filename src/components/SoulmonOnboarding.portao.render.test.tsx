// @vitest-environment jsdom
/**
 * O PORTÃO DE IDENTIDADE — A PRIMEIRA TELA DO APP (07/09/2026)
 * ===========================================================
 *
 * Pedido do dono: logo depois do carregamento, o app pergunta e-mail e senha
 * ou login com Google, com a opção de criar conta, ANTES de entrar no jogo.
 *
 * Por que isso também é dinheiro, e não só UX:
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
 * paga e não recebe. Com a conta antes da escolha, isso deixa de existir.
 *
 * OS TERMOS E O 18+ VIVEM DENTRO DESTA TELA, e não numa anterior: criar conta
 * é coletar dado pessoal, então o aceite precisa vir antes dela (D-07), e
 * abrir conta para menor é o que o 18+ existe para impedir. Foi assim que deu
 * para atender "a conta é a primeira coisa" sem perder nenhuma das duas
 * proteções.
 *
 * E o portão NÃO pode virar porta trancada: sem `VITE_FIREBASE_*` a auth não
 * existe, e um passo obrigatório que dependesse dela deixaria um build sem
 * `.env` sem abrir. Falta de configuração vira ausência de conta — o aceite e
 * a idade continuam obrigatórios, porque não dependem do Firebase.
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
const btn = (nome: string) => screen.getByRole('button', { name: nome }) as HTMLButtonElement;

/** Monta e ESPERA a resolução da auth, que é assíncrona (efeito de montagem).
 *  Sem este flush o teste mediria um estado que o usuário real nunca vê. */
async function montar() {
  renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
  await act(async () => {});
}

/** Aceite dos Termos + idade. Vive nas telas que CRIAM conta (Google e
 *  e-mail), não na primeira — a primeira mostra só as duas portas. */
function aceitarERevelarIdade() {
  ir('I am 18 or older');
  ir('I have read and agree to the Terms of Use and the Privacy Policy');
}

/** TELA 1 → formulário de e-mail e senha, por "New User". */
function abrirFormulario() {
  botao('New User');
  aceitarERevelarIdade();
}

/** TELA 1 → tela do Google. */
function abrirGoogle() {
  botao('Continue with Google');
  aceitarERevelarIdade();
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

  it('a PRIMEIRA tela tem só as duas portas — nada de formulário', async () => {
    await montar();
    expect(screen.getByText('Continue with Google')).toBeTruthy();
    expect(screen.getByText('or')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New User' })).toBeTruthy();
    // O formulário mudou de tela: empilhar tudo numa só era o que o dono
    // pediu para desfazer.
    expect(screen.queryByLabelText('Email')).toBeNull();
    expect(screen.queryByLabelText('Password')).toBeNull();
    // E a compra não é alcançável daqui.
    expect(screen.queryByText(/Get the full game/)).toBeNull();
    expect(screen.queryByText('Start now — it’s free')).toBeNull();
  });

  it('"New User" leva ao formulário, já em modo de CRIAR conta', async () => {
    await montar();
    botao('New User');
    expect(campoEmail()).toBeTruthy();
    expect(campoSenha()).toBeTruthy();
    expect(btn('Create account')).toBeTruthy();
    // O aceite e a idade acompanham a tela que cria a conta.
    expect(screen.getByText('Read the Terms of Use')).toBeTruthy();
    expect(screen.getByText('I am 18 or older')).toBeTruthy();
  });

  it('o caminho do GOOGLE também passa pelo aceite e pelo 18+', async () => {
    // Entrar com Google CRIA conta. Se o aceite morasse só no caminho do
    // e-mail, este lado da bifurcação abriria conta sem aceite e sem idade.
    await montar();
    botao('Continue with Google');
    expect(screen.getByText('Read the Terms of Use')).toBeTruthy();
    expect(screen.getByText('I am 18 or older')).toBeTruthy();
    expect(btn('Continue with Google').disabled).toBe(true);
    expect(chamadas).toEqual([]);
  });

  it('das duas telas de conta dá para VOLTAR à primeira', async () => {
    await montar();
    botao('New User');
    botao('Back');
    expect(btn('New User')).toBeTruthy();
    botao('Continue with Google');
    botao('Back');
    expect(btn('New User')).toBeTruthy();
  });

  it('sem aceite dos Termos e sem idade, NENHUMA conta nasce', async () => {
    await montar();
    botao('New User');
    expect(btn('Create account').disabled).toBe(true);

    // Só o aceite não basta — falta a idade.
    ir('I have read and agree to the Terms of Use and the Privacy Policy');
    expect(btn('Create account').disabled).toBe(true);

    fireEvent.click(screen.getByText('I am 18 or older'));
    expect(btn('Create account').disabled).toBe(false);
    // E nada foi tocado na rede enquanto os requisitos não estavam completos.
    expect(chamadas).toEqual([]);
  });

  it('sem declarar maioridade NENHUMA conta nasce — nem pelo Google', async () => {
    // Com uma CAIXA no lugar do campo de data não existe "declarar
    // menoridade" a interceptar: quem não tem a idade simplesmente não marca,
    // e sem a marca nada avança. A trava mudou de forma, não de efeito — e o
    // Google é o caminho que cria conta sem passar por formulário nenhum.
    await montar();
    botao('Continue with Google');
    ir('I have read and agree to the Terms of Use and the Privacy Policy');
    expect(btn('Continue with Google').disabled).toBe(true);
    await act(async () => { botao('Continue with Google'); });
    expect(chamadas).toEqual([]);
  });

  it('entrar com senha: normaliza o e-mail e leva ao "porquê"', async () => {
    await montar();
    abrirFormulario();
    botao('I already have an account — sign in');
    fireEvent.change(campoEmail(), { target: { value: '  Alguem@Exemplo.COM ' } });
    fireEvent.change(campoSenha(), { target: { value: 'segredo123' } });
    await act(async () => { botao('Sign in'); });
    // Normalizado: o saveId é derivado do e-mail, então caixa e espaço não
    // podem gerar duas contas para a mesma pessoa.
    expect(chamadas).toEqual(['entrar:alguem@exemplo.com:segredo123']);
    expect(screen.getByText('What do you want to improve in your life?')).toBeTruthy();
  });

  it('"Criar conta" é uma ação DIFERENTE de entrar', async () => {
    await montar();
    abrirFormulario();
    fireEvent.change(campoEmail(), { target: { value: 'novo@exemplo.com' } });
    fireEvent.change(campoSenha(), { target: { value: 'segredo123' } });
    await act(async () => { botao('Create account'); });
    expect(chamadas).toEqual(['criar:novo@exemplo.com:segredo123']);
  });

  it('senha curta nem chega à rede', async () => {
    await montar();
    abrirFormulario();
    fireEvent.change(campoEmail(), { target: { value: 'novo@exemplo.com' } });
    fireEvent.change(campoSenha(), { target: { value: '123' } });
    await act(async () => { botao('Create account'); });
    expect(chamadas).toEqual([]);
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('entrar com Google não pede e-mail nenhum', async () => {
    await montar();
    abrirGoogle();
    await act(async () => { botao('Continue with Google'); });
    expect(chamadas).toEqual(['google']);
    expect(screen.getByText('What do you want to improve in your life?')).toBeTruthy();
  });

  it('falha de credencial mostra recado acionável e NÃO avança', async () => {
    resposta = { ok: false, erro: 'credencial-invalida' };
    await montar();
    abrirFormulario();
    botao('I already have an account — sign in');
    fireEvent.change(campoEmail(), { target: { value: 'a@b.com' } });
    fireEvent.change(campoSenha(), { target: { value: 'errada' } });
    await act(async () => { botao('Sign in'); });
    expect(screen.getByRole('alert').textContent).toContain("Email or password don't match");
    expect(screen.queryByText('What do you want to improve in your life?')).toBeNull();
    // O campo continua editável: nunca um beco sem saída.
    expect(campoSenha()).toBeTruthy();
  });

  it('recuperar senha responde IGUAL para conta existente e inexistente', async () => {
    // Dizer "não achamos esse e-mail" entregaria a quem perguntar quais
    // endereços têm conta no app.
    await montar();
    abrirFormulario();
    botao('I already have an account — sign in');
    fireEvent.change(campoEmail(), { target: { value: 'a@b.com' } });
    await act(async () => { botao('I forgot my password'); });
    const comConta = screen.getByRole('status').textContent;

    resposta = { ok: false, erro: 'nao-encontrado' };
    cleanup();
    localStorage.clear();
    await montar();
    abrirFormulario();
    botao('I already have an account — sign in');
    fireEvent.change(campoEmail(), { target: { value: 'nao-existe@b.com' } });
    await act(async () => { botao('I forgot my password'); });
    expect(screen.getByRole('status').textContent).toBe(comConta);
  });

  it('sem auth configurada o portão NÃO TRANCA — mas o aceite e o 18+ ficam', async () => {
    authLigada = false;
    await montar();
    // Nenhuma forma de conta é oferecida...
    expect(screen.queryByText('Continue with Google')).toBeNull();
    expect(screen.queryByRole('button', { name: 'New User' })).toBeNull();
    expect(screen.queryByLabelText('Password')).toBeNull();
    // ...e mesmo assim os Termos e a idade continuam obrigatórios, porque não
    // dependem do Firebase.
    expect(btn('Continue').disabled).toBe(true);
    aceitarERevelarIdade();
    expect(btn('Continue').disabled).toBe(false);
    await act(async () => { botao('Continue'); });
    expect(screen.getByText('What do you want to improve in your life?')).toBeTruthy();
  });

  it('quem já está autenticado não vê formulário de conta nenhum', async () => {
    emailAtual = 'ja@logado.com';
    await montar();
    expect(screen.queryByText('Continue with Google')).toBeNull();
    expect(screen.queryByRole('button', { name: 'New User' })).toBeNull();
    expect(screen.queryByLabelText('Password')).toBeNull();
    // Mas o aceite continua sendo pedido: sem prova local dele, presumir
    // consentimento seria inventar a prova que o CONSENT existe para produzir.
    expect(btn('Continue').disabled).toBe(true);
    aceitarERevelarIdade();
    await act(async () => { botao('Continue'); });
    expect(screen.getByText('What do you want to improve in your life?')).toBeTruthy();
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
      ['Novo usuário', 'New User'],
      ['Senha', 'Password'],
      ['Li e concordo com os Termos de Uso e a Política de Privacidade',
        'I have read and agree to the Terms of Use and the Privacy Policy'],
    ]) {
      for (const t of par) expect(fonte).toContain(t);
    }
    // A caixa de maioridade interpola `MIN_AGE_YEARS` em vez de fixar "18":
    // o numero mora em `utils/consent.ts` e nao pode ser copiado para a tela,
    // senao os dois divergem no dia em que a idade minima mudar.
    expect(fonte).toContain('Tenho ${MIN_AGE_YEARS} anos ou mais');
    expect(fonte).toContain('I am ${MIN_AGE_YEARS} or older');
  });
});
