// @vitest-environment jsdom
/**
 * O PORTÃO DE IDENTIDADE — A PRIMEIRA TELA DO APP (rodada 3, 02/10/2026)
 * =====================================================================
 *
 * A2: o portão tem UM botão só, "Continue with Google". Conta existente entra
 * direto; conta nova é criada pelo próprio Firebase no primeiro login Google.
 * E-mail, senha, "New User" e link por e-mail não têm ponto de entrada na tela.
 *
 * A3: os Termos/Privacidade e o 18+ vêm DEPOIS do login. Sem aceitar não se
 * avança ao onboarding; quem já aceitou a versão atual não vê de novo.
 *
 * Por que o login vem antes de tudo (dinheiro): `handleUnlockFull` compra com
 * o `saveId` derivado do e-mail; antes do login ele é um UUID aleatório e a
 * compra seria recusada. Com a conta antes da escolha, isso deixa de existir.
 *
 * E o portão NÃO pode virar porta trancada: sem `VITE_FIREBASE_*` a auth não
 * existe e o fluxo segue direto para os termos (que não dependem do Firebase).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SoulmonOnboarding, GOOGLE_SEM_RESPOSTA_MS } from './SoulmonOnboarding';
import { buildConsentRecord, TERMS_VERSION } from '../utils/consent';
import { writeGateDraft } from '../utils/gateDraft';
import { STORAGE_KEYS } from '../utils/storageKeys';

vi.mock('../utils/auth', async () => {
  const real = await vi.importActual<typeof import('../utils/auth')>('../utils/auth');
  return {
    ...real,
    isAuthConfigured: () => authLigada,
    getCurrentEmail: async () => emailAtual,
    entrarComGoogle: async () => {
      chamadas.push('google');
      // `googlePendura` reproduz o caso que o COOP cria: a promessa NUNCA
      // termina, porque o `pollUserCancellation` do Firebase não consegue ler
      // `popup.closed`. Ver `GOOGLE_SEM_RESPOSTA_MS`.
      if (googlePendura) return new Promise<never>(() => {});
      return resposta;
    },
  };
});

let authLigada = true;
let emailAtual: string | null = null;
let resposta: { ok: boolean; email?: string; erro?: string } = { ok: true, email: 'a@b.com' };
let chamadas: string[] = [];
let googlePendura = false;

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

/** Aceite dos Termos + idade — a tela que vem DEPOIS do login (A3). */
function aceitarERevelarIdade() {
  ir('I am 18 or older');
  ir('I have read and agree to the Terms of Use and the Privacy Policy');
}

/** Toca o botão único do portão e espera a promessa. */
async function entrarComGoogleUi() {
  await act(async () => { botao('Continue with Google'); });
}

describe('portão de identidade', () => {
  beforeEach(() => {
    localStorage.clear();
    authLigada = true;
    emailAtual = null;
    resposta = { ok: true, email: 'a@b.com' };
    chamadas = [];
    googlePendura = false;
  });

  it('A2: a PRIMEIRA tela tem UM botão só — nada de e-mail, senha ou "New User"', async () => {
    await montar();
    expect(screen.getAllByRole('button', { name: 'Continue with Google' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'New User' })).toBeNull();
    expect(screen.queryByText('or')).toBeNull();
    expect(screen.queryByLabelText('Email')).toBeNull();
    expect(screen.queryByLabelText('Password')).toBeNull();
    expect(screen.queryByText(/password/i)).toBeNull();
    // Os termos NÃO estão no portão (A3), e a compra não é alcançável daqui.
    expect(screen.queryByText('I am 18 or older')).toBeNull();
    expect(screen.queryByText('Read the Terms of Use')).toBeNull();
    expect(screen.queryByText(/Get your own Soulmon/)).toBeNull();
    expect(btn('Continue with Google').disabled).toBe(false);
  });

  it('A2: o botão entra direto — sem aceite prévio — e chama o Google uma vez', async () => {
    await montar();
    await entrarComGoogleUi();
    expect(chamadas).toEqual(['google']);
  });

  it('A3: depois do login vêm os TERMOS; sem aceitar não se chega ao onboarding', async () => {
    await montar();
    await entrarComGoogleUi();
    expect(screen.getByText('Before we start')).toBeTruthy();
    expect(screen.getByText('Read the Terms of Use')).toBeTruthy();
    expect(screen.getByText('Read the Privacy Policy')).toBeTruthy();
    expect(screen.queryByText('What should we call you?')).toBeNull();
    // Sem nada marcado o botão fica apagado.
    expect(btn('Continue').disabled).toBe(true);
    // Só o aceite não basta — falta a idade.
    ir('I have read and agree to the Terms of Use and the Privacy Policy');
    expect(btn('Continue').disabled).toBe(true);
    ir('I am 18 or older');
    expect(btn('Continue').disabled).toBe(false);
    botao('Continue');
    expect(screen.getByText('What should we call you?')).toBeTruthy();
  });

  it('A3: dos termos NÃO se volta ao portão (a conta já existe)', async () => {
    await montar();
    await entrarComGoogleUi();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  it('A3: o carimbo do aceite sai NA TELA DOS TERMOS, com as versões atuais', async () => {
    await montar();
    await entrarComGoogleUi();
    aceitarERevelarIdade();
    botao('Continue');
    const gravado = JSON.parse(localStorage.getItem(STORAGE_KEYS.GATE_DRAFT) ?? 'null');
    expect(gravado?.consent?.termsVersion).toBe(TERMS_VERSION);
  });

  it('A3: já autenticado SEM aceite da versão atual → cai nos termos', async () => {
    emailAtual = 'ja@logado.com';
    await montar();
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).toBeNull();
    expect(screen.getByText('Before we start')).toBeTruthy();
    expect(btn('Continue').disabled).toBe(true);
    aceitarERevelarIdade();
    botao('Continue');
    expect(screen.getByText('What should we call you?')).toBeTruthy();
  });

  it('A3: quem JÁ aceitou a versão atual não vê os termos de novo', async () => {
    emailAtual = 'ja@logado.com';
    writeGateDraft({
      soulGoal: '', soulStruggle: '', consent: buildConsentRecord(),
      step: -10,
    } as Parameters<typeof writeGateDraft>[0]);
    await montar();
    expect(screen.queryByText('Before we start')).toBeNull();
    expect(screen.getByText('What should we call you?')).toBeTruthy();
  });

  it('A3: aceite de uma versão ANTIGA dos documentos pede o aceite de novo', async () => {
    emailAtual = 'ja@logado.com';
    writeGateDraft({
      soulGoal: '', soulStruggle: '',
      consent: { ...buildConsentRecord(), termsVersion: '2020-01-01' },
      step: -10,
    } as Parameters<typeof writeGateDraft>[0]);
    await montar();
    expect(screen.getByText('Before we start')).toBeTruthy();
    expect(screen.queryByText('What should we call you?')).toBeNull();
  });

  it('🔴 o botão do Google NÃO trava para sempre se a promessa não terminar', async () => {
    // O caso real: `accounts.google.com` manda COOP, o `popup.closed` fica
    // ilegível, e o `pollUserCancellation` do Firebase nunca conclui. Sem rede
    // de segurança o `authOcupado` fica preso em `true` e o botão morre
    // desabilitado na PRIMEIRA tela do app. Ver `GOOGLE_SEM_RESPOSTA_MS`.
    googlePendura = true;
    await montar();
    expect(btn('Continue with Google').disabled).toBe(false);
    // O relógio falso entra DEPOIS de montar: a resolução da auth na montagem
    // é assíncrona, e com o relógio já congelado a tela nem chega ao portão.
    vi.useFakeTimers();
    try {
      botao('Continue with Google');
      expect(chamadas).toEqual(['google']);
      expect(btn('Continue with Google').disabled).toBe(true);

      // Um pouco ANTES do prazo, continua esperando: a rede não pode encurtar
      // um login de verdade (escolher conta, senha, segundo fator).
      await act(async () => { vi.advanceTimersByTime(GOOGLE_SEM_RESPOSTA_MS - 1000); });
      expect(btn('Continue with Google').disabled).toBe(true);

      // Passado o prazo, a tela VOLTA e diz o que sabe.
      await act(async () => { vi.advanceTimersByTime(2000); });
      expect(btn('Continue with Google').disabled).toBe(false);
      expect(screen.getByText(/didn’t respond/i)).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('a rede NÃO dispara quando o login responde a tempo', async () => {
    await montar();
    vi.useFakeTimers();
    try {
      botao('Continue with Google');
      await act(async () => {});
      await act(async () => { vi.advanceTimersByTime(GOOGLE_SEM_RESPOSTA_MS + 5000); });
      expect(screen.queryByText(/didn’t respond/i)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('falha do Google mostra recado acionável e NÃO avança', async () => {
    resposta = { ok: false, erro: 'popup-fechado' };
    await montar();
    await entrarComGoogleUi();
    expect(screen.getByRole('alert').textContent).toContain('closed before finishing');
    expect(screen.queryByText('Before we start')).toBeNull();
    // O botão continua disponível: nunca um beco sem saída.
    expect(btn('Continue with Google').disabled).toBe(false);
  });

  it('as mensagens de erro não mandam para e-mail/senha (não existem mais)', async () => {
    for (const erro of ['popup-bloqueado', 'dominio-nao-autorizado']) {
      cleanup();
      resposta = { ok: false, erro };
      await montar();
      await entrarComGoogleUi();
      expect(screen.getByRole('alert').textContent).not.toMatch(/password|email and/i);
    }
  });

  it('sem auth configurada o portão NÃO TRANCA — vai direto aos termos, que ficam obrigatórios', async () => {
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
    expect(screen.getByText('What should we call you?')).toBeTruthy();
  });

  it('A1: sem idioma gravado a PRIMEIRA tela abre em INGLÊS, mesmo com o aparelho em PT', async () => {
    vi.stubGlobal('navigator', { ...navigator, language: 'pt-BR', languages: ['pt-BR'] });
    try {
      await montar();
      expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeTruthy();
      expect(screen.queryByText('Entrar com Google')).toBeNull();
      // Abrir em inglês não grava nada: a escolha ainda é da pessoa.
      expect(localStorage.getItem(STORAGE_KEYS.LANGUAGE)).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('A1: escolher Português troca o idioma e a escolha PERSISTE', async () => {
    await montar();
    fireEvent.click(screen.getByRole('button', { name: 'Português' }));
    expect(screen.getByRole('button', { name: 'Entrar com Google' })).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEYS.LANGUAGE)).toBe('pt-BR');
    // Remontar (nova abertura): continua em português.
    cleanup();
    await montar();
    expect(screen.getByRole('button', { name: 'Entrar com Google' })).toBeTruthy();
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
      ['Antes de começar', 'Before we start'],
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

/**
 * Canvas Onboarding-funil — identidade (DECISÕES §23, 20/09/2026): a marca no
 * slot-visor (D-O4/X3), a segunda porta `outline` (D-O5), os links legais
 * como ghost 44 sem separador (D-O6/X6), e-mail malformado em `role=alert`
 * âmbar + anel `warn` (X2/D-O7), `aria-busy` no envio (R7).
 */
describe('portão — identidade do canvas Onboarding-funil', () => {
  beforeEach(() => {
    localStorage.clear();
    authLigada = true;
    emailAtual = null;
    resposta = { ok: true, email: 'a@b.com' };
    chamadas = [];
    googlePendura = false;
  });

  it('A1 (01/10/2026): a marca é o LOGO do app, solto — sem slot-visor de gradiente, sem wordmark em texto', async () => {
    await montar();
    const marca = screen.getByRole('img', { name: 'Soulmon' }) as HTMLImageElement;
    expect(marca.tagName).toBe('IMG');
    expect(marca.hasAttribute('data-brand-logo')).toBe(true);
    expect(marca.closest('.sm2-viewport-screen')).toBeNull();
    expect(marca.width).toBeGreaterThanOrEqual(100);
    expect(document.querySelector('img[src*="mascot-raven"]')).toBeNull();
    expect(screen.queryByText('Soulmon', { selector: 'span' })).toBeNull();
  });

  it('o botão único é o primário do sistema', async () => {
    await montar();
    expect(btn('Continue with Google').style.getPropertyValue('--sm2-btn')).toBe('primary');
  });

  it('os links legais (tela dos termos) são ghost 44 em `primary-ink`, empilhados, sem "·"', async () => {
    await montar();
    await entrarComGoogleUi();
    const termos = screen.getByRole('link', { name: 'Read the Terms of Use' }) as HTMLAnchorElement;
    const priv = screen.getByRole('link', { name: 'Read the Privacy Policy' }) as HTMLAnchorElement;
    for (const a of [termos, priv]) {
      expect(a.style.getPropertyValue('--sm2-btn')).toBe('ghost');
      expect(a.style.minHeight).toBe('44px');
      expect(a.style.color).toBe('var(--sm2-primary-ink)');
      expect(a.target).toBe('_blank');
    }
    expect(termos.parentElement).toBe(priv.parentElement);
    expect(termos.parentElement!.textContent).not.toContain('·');
  });

  it('nenhum alerta do portão usa vermelho', async () => {
    resposta = { ok: false, erro: 'popup-bloqueado' };
    await montar();
    await entrarComGoogleUi();
    const alerta = screen.getByRole('alert');
    expect(alerta.style.borderLeft).toContain('var(--sm2-gold-ink)');
    expect(alerta.style.color).not.toContain('danger');
  });

  it('o envio declara `aria-busy` e mantém o nome acessível', async () => {
    googlePendura = true;
    await montar();
    botao('Continue with Google');
    await act(async () => {});
    const b = btn('Continue with Google');
    expect(b.getAttribute('aria-busy')).toBe('true');
    expect(b.disabled).toBe(true);
  });

  it('A4: o título do onboarding usa a fonte de TEXTO (Rubik), não a display (Cinzel)', async () => {
    emailAtual = 'ja@logado.com';
    await montar();
    const titulo = screen.getByText('Before we start');
    expect(titulo.style.fontFamily).toBe('var(--sm2-font-text)');
  });
});
