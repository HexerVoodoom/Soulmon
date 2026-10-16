// @vitest-environment jsdom
/**
 * O NOVO ONBOARDING (REGISTRO §81, pedido do dono por voz, 15/10/2026):
 *
 *   Termos -> AMBRA se apresenta (NpcSequence) -> perguntas -> OVO-CRISTAL (toque balança; ~5 toques = dois botões)
 *     · "Conhecer o seu Soulmon" (primário) abre o modal de compra existente, SEM confirmação;
 *       comprou: os botões somem, fica "Chocar"; luz branca expande, fade out, e entra o ritual pago;
 *     · "Me empreste um Soulmon guia" (secundário) escolhe entre os 5 iniciais e PEDE CONFIRMAÇÃO (Sim/Voltar);
 *       "Sim": a Ambra fala de novo e o app entra na demo/gratuito de sempre.
 *
 * Cada `it` é uma frase do pedido; a régua é o DOM (jsdom não anima nem faz layout: movimento reduzido é checado pelo
 * NOME da animação escolhida, não por quadros).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { LUZ_EXPANDE_MS, LUZ_SOME_MS, LUZ_REDUZIDA_MS, OVO_TOQUES_PARA_BOTOES } from './OnboardingOvo';
import { PREMADE_CHARACTERS } from '../utils/monetization';
import { atravessarPerguntasIniciais, passarApresentacaoDaAmbra } from '../test/metasOnboarding';
import { tocarOvo, abrirGuias, escolherGuiaEConfirmar, passarDespedidaDaAmbra } from '../test/ovoOnboarding';
import { pendingTelemetry, resetTelemetryForTest, TELEMETRY_UNLOCK_REASON } from '../utils/telemetry';
import { paidArrivalVitals, hungerAt, tierOf, hungerLevelOf, starvingSince, HUNGER_FAIR_MIN, maxEnergyOf } from '../utils/hunger';

const compra = vi.hoisted(() => ({ purchase: vi.fn() }));
vi.mock('../utils/playBilling', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../utils/playBilling')>();
  return {
    ...orig,
    isBillingAvailable: () => true,
    useStoreOpen: () => true,
    purchase: (...a: unknown[]) => compra.purchase(...a),
  };
});

const btn = (nome: string | RegExp) => screen.getByRole('button', { name: nome }) as HTMLButtonElement;
const only = (event: string) => pendingTelemetry().filter(r => r.e === event);

function passarTermos(pt = false) {
  fireEvent.click(screen.getByText(pt
    ? 'Li e concordo com os Termos de Uso e a Política de Privacidade'
    : 'I have read and agree to the Terms of Use and the Privacy Policy'));
  fireEvent.click(screen.getByText(pt ? 'Tenho 18 anos ou mais' : 'I am 18 or older'));
  fireEvent.click(btn(pt ? 'Continuar' : 'Continue'));
}

function movimentoReduzido(reduzido: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: reduzido && q.includes('prefers-reduced-motion'), media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeAll(async () => { await import('../utils/oracle/familias'); await import('../utils/oracle/motor'); }, 120_000);

describe('§81 — a Ambra depois dos Termos', () => {
  beforeEach(() => { vi.useFakeTimers(); installFakeStorage(); resetTelemetryForTest(); movimentoReduzido(false); });
  afterEach(() => { vi.useRealTimers(); });

  it('EN — a apresentação é a NpcSequence (Ambra grande, janela de texto, Skip no canto), com o texto do dono', () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    passarTermos();
    const seq = document.querySelector('[data-npc-sequence]') as HTMLElement;
    expect(seq).toBeTruthy();
    expect(seq.querySelector('[data-npc-name]')?.textContent).toBe('Ambra');
    expect((seq.querySelector('[data-npc-art]') as HTMLImageElement).getAttribute('src')).toContain('npc-onboarding');
    expect(seq.textContent).toContain('Welcome. I am Ambra. Here you will find the depths of your soul and evolve alongside your Soulmon.');
    expect(seq.textContent).toContain("Let's get to know you first.");
    expect(seq.querySelector('[data-npc-skip]')?.textContent).toBe('Skip');
    // ainda não é a pergunta do nome
    expect(screen.queryByText('What should we call you?')).toBeNull();
  });

  it('PT — a fala sai em português, palavra por palavra', () => {
    localStorage.setItem('soulmon-language', 'pt-BR');
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    passarTermos(true);
    const seq = document.querySelector('[data-npc-sequence]') as HTMLElement;
    expect(seq.textContent).toContain('Bem-vindo. Eu sou a Ambra. Aqui você vai encontrar as profundezas da sua alma e evoluir junto ao seu Soulmon. Vamos te conhecer primeiro.');
    expect(seq.querySelector('[data-npc-skip]')?.textContent).toBe('Pular');
  });

  it('tocar na tela OU "Skip" levam ao mesmo lugar: a 1ª pergunta (o nome)', () => {
    const a = renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    passarTermos();
    passarApresentacaoDaAmbra();
    expect(screen.getByText('What should we call you?')).toBeTruthy();
    a.unmount();
    installFakeStorage();
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    passarTermos();
    fireEvent.click(document.querySelector('[data-npc-skip]')!);
    expect(screen.getByText('What should we call you?')).toBeTruthy();
  });

  it('quem retoma de um passo já gravado NÃO revê a apresentação', async () => {
    const a = renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    passarTermos();
    await atravessarPerguntasIniciais(false, 'Ana Lua'); // grava o rascunho do portão até o ovo
    a.unmount();
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(document.querySelector('[data-npc-sequence]')).toBeNull();
  });
});

describe('§81 — o ovo-cristal', () => {
  beforeEach(async () => {
    vi.useFakeTimers(); installFakeStorage(); resetTelemetryForTest(); movimentoReduzido(false);
    compra.purchase.mockReset();
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), configurable: true, writable: true });
  });
  afterEach(() => { vi.useRealTimers(); });

  async function ateOOvo(pt = false) {
    if (pt) localStorage.setItem('soulmon-language', 'pt-BR');
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    passarTermos(pt);
    await atravessarPerguntasIniciais(pt);
  }

  it('o fim das perguntas é o ovo: o cristal com a silhueta (dormant), sem a escolha grátis/completo nem reveal demo', async () => {
    await ateOOvo();
    const cristal = document.querySelector('[data-ovo-cristal]') as HTMLButtonElement;
    expect(cristal).toBeTruthy();
    expect(cristal.getAttribute('aria-label')).toBe('Crystal with a sleeping being inside. Tap to wake it.');
    expect((cristal.querySelector('[data-ovo-arte]') as HTMLElement).getAttribute('data-ovo-arte')).toBe('dormant');
    expect((cristal.querySelector('img') as HTMLImageElement).getAttribute('src')).toContain('dormant');
    expect(screen.queryByText('How do you want to start?')).toBeNull();
    expect(screen.queryByText(/Start now/)).toBeNull();
    expect(screen.queryByText('Your soul\'s creature')).toBeNull();
    // alvo de toque >= 44 (o cristal) e dica em região viva
    expect(parseInt(cristal.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
    expect(document.querySelector('[data-ovo-dica]')?.getAttribute('role')).toBe('status');
  });

  it('cada toque balança (a animação reinicia), acende o cristal no 3º e vibra de leve; com 5 toques aparecem os dois botões', async () => {
    await ateOOvo();
    const vibra = navigator.vibrate as unknown as ReturnType<typeof vi.fn>;
    const pulso = () => document.querySelector('[data-ovo-pulso]') as HTMLElement;
    expect(pulso().style.animation).toBe('none');
    tocarOvo(1);
    expect(pulso().style.animation).toContain('sm-ovo-balanco');
    expect(pulso().getAttribute('data-ovo-pulso')).toBe('1');
    tocarOvo(1);
    expect(pulso().getAttribute('data-ovo-pulso')).toBe('2');
    expect((document.querySelector('[data-ovo-arte]') as HTMLElement).getAttribute('data-ovo-arte')).toBe('dormant');
    tocarOvo(1);
    expect((document.querySelector('[data-ovo-arte]') as HTMLElement).getAttribute('data-ovo-arte')).toBe('forming');
    expect(screen.queryByRole('button', { name: 'Meet your Soulmon' })).toBeNull();
    tocarOvo(OVO_TOQUES_PARA_BOTOES - 3);
    expect(vibra).toHaveBeenCalledTimes(OVO_TOQUES_PARA_BOTOES);
    expect(btn('Meet your Soulmon')).toBeTruthy();
    expect(btn('Lend me a guide Soulmon')).toBeTruthy();
    // botões grandes o bastante (sm2Button md = 48)
    expect(parseInt(btn('Meet your Soulmon').style.minHeight, 10)).toBeGreaterThanOrEqual(44);
    expect(parseInt(btn('Lend me a guide Soulmon').style.minHeight, 10)).toBeGreaterThanOrEqual(44);
  });

  it('movimento reduzido: sem balanço e sem vibração — só um fade curto; os botões aparecem igual', async () => {
    movimentoReduzido(true);
    await ateOOvo();
    const vibra = navigator.vibrate as unknown as ReturnType<typeof vi.fn>;
    tocarOvo(OVO_TOQUES_PARA_BOTOES);
    const pulso = document.querySelector('[data-ovo-pulso]') as HTMLElement;
    expect(pulso.style.animation).toContain('sm-ovo-fade');
    expect(pulso.style.animation).not.toContain('balanco');
    expect(vibra).not.toHaveBeenCalled();
    expect(btn('Meet your Soulmon')).toBeTruthy();
  });

  it('PT — os rótulos são os do dono', async () => {
    await ateOOvo(true);
    tocarOvo();
    expect(btn('Conhecer o seu Soulmon')).toBeTruthy();
    expect(btn('Me empreste um Soulmon guia')).toBeTruthy();
  });

  it('o PRIMÁRIO abre o modal de compra existente SEM pedir confirmação; "Not now" o fecha e conta o dismiss na faixa herdada', async () => {
    await ateOOvo();
    tocarOvo();
    fireEvent.click(btn('Meet your Soulmon'));
    expect(screen.queryByText(/Are you sure/)).toBeNull();
    expect(screen.getByText('Your Soulmon grows because you do')).toBeTruthy();
    expect(screen.getByText(/The crystal holds a Soulmon made from who you are/)).toBeTruthy();
    expect(btn(/^Unlock/)).toBeTruthy();
    expect(btn('Already bought — restore')).toBeTruthy(); // §49: o "Restaurar" existe no modal
    expect(only('unlock_view').map(r => r.p?.reason)).toEqual([TELEMETRY_UNLOCK_REASON.revealDemo]);
    fireEvent.click(btn('Not now'));
    expect(screen.queryByText('Your Soulmon grows because you do')).toBeNull();
    expect(only('unlock_dismiss').map(r => r.p?.reason)).toEqual([TELEMETRY_UNLOCK_REASON.revealDemo]);
    // e o ovo continua lá, com os dois botões
    expect(btn('Meet your Soulmon')).toBeTruthy();
  });

  it('compra cancelada: o modal avisa e a tela do ovo segue igual (nada some)', async () => {
    compra.purchase.mockResolvedValue({ ok: false, reason: 'cancelled' });
    await ateOOvo();
    tocarOvo();
    fireEvent.click(btn('Meet your Soulmon'));
    await act(async () => { fireEvent.click(btn(/^Unlock/)); });
    expect(screen.getByText('Purchase cancelled.')).toBeTruthy();
    fireEvent.click(btn('Not now'));
    expect(btn('Meet your Soulmon')).toBeTruthy();
    expect(btn('Lend me a guide Soulmon')).toBeTruthy();
  });

  describe('comprou', () => {
    async function ateACompra() {
      compra.purchase.mockResolvedValue({ ok: true, ent: { tier: 'paid' } });
      await ateOOvo();
      tocarOvo();
      fireEvent.click(btn('Meet your Soulmon'));
      await act(async () => { fireEvent.click(btn(/^Unlock/)); });
    }

    it('os dois botões SOMEM, aparece o CTA único "Chocar", e não se volta atrás do que foi pago', async () => {
      await ateACompra();
      expect(screen.queryByRole('button', { name: 'Meet your Soulmon' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Lend me a guide Soulmon' })).toBeNull();
      expect(btn('Hatch')).toBeTruthy();
      expect(document.querySelector('[data-back-arrow]')).toBeNull();
      expect(compra.purchase).toHaveBeenCalledTimes(1); // o modal de compra existente cobrou UMA vez
      // o cristal já está aceso e parou de reagir ao toque
      expect((document.querySelector('[data-ovo-arte]') as HTMLElement).getAttribute('data-ovo-arte')).toBe('forming');
    });

    it('"Hatch": uma LUZ BRANCA no meio expande até cobrir a tela, o ritual pago entra por baixo, e ela faz fade out', async () => {
      await ateACompra();
      fireEvent.click(btn('Hatch'));
      const luz = () => document.querySelector('[data-luz-branca]') as HTMLElement | null;
      expect(luz()?.getAttribute('data-luz-branca')).toBe('expande');
      const disco = luz()!.querySelector('div') as HTMLElement;
      expect(disco.style.left).toBe('50%');
      expect(disco.style.top).toBe('50%');
      expect(disco.style.animation).toContain('sm-luz-expande');
      // enquanto expande, a tela de baixo ainda é o ovo e nada mais é tocável
      expect(document.querySelector('[data-ovo]')).toBeTruthy();
      expect((document.querySelector('[data-ovo-chocar]') as HTMLButtonElement).disabled).toBe(true);
      await act(async () => { await vi.advanceTimersByTimeAsync(LUZ_EXPANDE_MS); });
      // coberta: troca de tela (o caminho PAGO começa no nome completo) e a luz passa a sumir
      expect(luz()?.getAttribute('data-luz-branca')).toBe('some');
      expect(luz()!.style.animation).toContain('sm-luz-some');
      expect(screen.getByText('What is your full name?')).toBeTruthy();
      await act(async () => { await vi.advanceTimersByTimeAsync(LUZ_SOME_MS); });
      expect(luz()).toBeNull();
      expect(screen.getByText('What is your full name?')).toBeTruthy();
    });

    it('movimento reduzido: sem expansão — a tela inteira vira branca num fade simples e desfaz', async () => {
      movimentoReduzido(true);
      await ateACompra();
      fireEvent.click(btn('Hatch'));
      const luz = () => document.querySelector('[data-luz-branca]') as HTMLElement | null;
      expect(luz()!.style.animation).toContain('sm-luz-entra');
      expect(luz()!.querySelector('div')).toBeNull(); // sem o disco que expande
      await act(async () => { await vi.advanceTimersByTimeAsync(LUZ_REDUZIDA_MS); });
      expect(luz()!.style.animation).toContain('sm-luz-some');
      expect(screen.getByText('What is your full name?')).toBeTruthy();
      await act(async () => { await vi.advanceTimersByTimeAsync(LUZ_REDUZIDA_MS); });
      expect(luz()).toBeNull();
    });
  });

  describe('Soulmon guia (a demo)', () => {
    it('SÓ o secundário confirma: escolher abre "Are you sure…?" com Yes/Back; "Back" fica na grade', async () => {
      await ateOOvo();
      abrirGuias();
      expect(screen.getByText('Choose your guide Soulmon')).toBeTruthy();
      expect(document.querySelectorAll('button[data-demo-char]').length).toBe(5);
      fireEvent.click(screen.getByText(PREMADE_CHARACTERS[0].name).closest('button')!);
      expect(screen.getByText('Are you sure you want to try the game in the demo version?')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Yes' })).toBeTruthy();
      const voltar = screen.getAllByRole('button', { name: 'Back' });
      fireEvent.click(voltar[voltar.length - 1]);
      expect(screen.queryByText(/Are you sure/)).toBeNull();
      expect(screen.getByText('Choose your guide Soulmon')).toBeTruthy();
    });

    it('PT — a pergunta e os botões do dono: "Sim" e "Voltar"', async () => {
      await ateOOvo(true);
      abrirGuias(true);
      fireEvent.click(screen.getByText(PREMADE_CHARACTERS[1].name).closest('button')!);
      expect(screen.getByText('Você tem certeza que quer experimentar o jogo na versão demo?')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Sim' })).toBeTruthy();
      expect(screen.getAllByRole('button', { name: 'Voltar' }).length).toBeGreaterThan(0);
    });

    it('"Sim": a Ambra aparece de novo com a fala do dono e, ao tocar, o app entra na demo/gratuito com o guia escolhido', async () => {
      const onComplete = vi.fn();
      renderWithCss(<SoulmonOnboarding onComplete={onComplete} />);
      passarTermos();
      await atravessarPerguntasIniciais(false, 'Ana Lua');
      abrirGuias();
      escolherGuiaEConfirmar(false, 2);
      const seq = document.querySelector('[data-npc-sequence]') as HTMLElement;
      expect(seq.textContent).toContain('Well done! You can meet your Soulmon at any time. Welcome.');
      expect(onComplete).not.toHaveBeenCalled();
      passarDespedidaDaAmbra();
      expect(onComplete).toHaveBeenCalledTimes(1);
      const data = onComplete.mock.calls[0][0];
      expect(data.mode).toBe('demo');
      expect(data.demoCharacterId).toBe(PREMADE_CHARACTERS[2].id);
      expect(data.userName).toBe('Ana Lua');
    });

    it('PT — "Muito bem! Você pode conhecer o seu Soulmon a qualquer momento. Bem-vindo."', async () => {
      localStorage.setItem('soulmon-language', 'pt-BR');
      renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
      passarTermos(true);
      await atravessarPerguntasIniciais(true);
      abrirGuias(true);
      escolherGuiaEConfirmar(true);
      expect(document.querySelector('[data-npc-sequence]')!.textContent).toContain('Muito bem! Você pode conhecer o seu Soulmon a qualquer momento. Bem-vindo.');
    });

    it('"Skip" na despedida também entra na demo (pular a fala não cancela a escolha)', async () => {
      const onComplete = vi.fn();
      renderWithCss(<SoulmonOnboarding onComplete={onComplete} />);
      passarTermos();
      await atravessarPerguntasIniciais();
      abrirGuias();
      escolherGuiaEConfirmar();
      fireEvent.click(document.querySelector('[data-npc-skip]')!);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});

describe('§81 — o Soulmon pago chega com vida e energia cheias e fome vazia (o relógio da fome já contando)', () => {
  const now = Date.UTC(2026, 9, 15, 12);

  it('energia no máximo do Rookie, fome 0 medida AGORA, relógio da energia ancorado agora', () => {
    const v = paidArrivalVitals(now);
    expect(v.energyPoints).toBe(maxEnergyOf({ evolutionStage: 'rookie' }));
    expect(v.energyPoints).toBeGreaterThan(0);
    expect(v.hunger).toEqual({ v: 0, at: now });
    expect(v.energyClock).toEqual({ at: now, carry: 0 });
  });

  it('a fome é "faminto" (1/3, a escala da tela) já na chegada, e a contagem das 12 h parte do nascimento', () => {
    const v = paidArrivalVitals(now);
    expect(hungerAt(v.hunger, now)).toBe(0);
    expect(tierOf(hungerAt(v.hunger, now))).toBe('starving');
    expect(hungerLevelOf('starving')).toBe(1);
    expect(starvingSince(v.hunger)).toBe(now);
    expect(HUNGER_FAIR_MIN).toBeGreaterThan(0);
  });

  it('a fonte do App liga isto SÓ no nascimento pago (o oráculo do onboarding), não na demo nem no upgrade', async () => {
    const fs = await import(/* @vite-ignore */ 'node:fs');
    const src = fs.readFileSync(`${process.cwd()}/src/App.tsx`, 'utf8');
    expect(src.match(/paidArrivalVitals\(Date\.now\(\)\)/g)).toHaveLength(1);
    const inicio = src.indexOf('const handleCompleteOnboarding');
    const demo = src.indexOf("if (data.mode === 'demo') {", inicio);
    const pago = src.indexOf('paidArrivalVitals(Date.now())', inicio);
    expect(pago).toBeGreaterThan(demo); // depois do ramo demo (que retorna antes)
    const upgrade = src.indexOf('const handleUpgradeRevealed');
    expect(src.slice(upgrade, upgrade + 2500)).not.toContain('paidArrivalVitals');
    expect(src.slice(demo, pago)).toContain("accountTier: 'demo'");
  });
});

describe('§81 — a fila de modais fica inerte durante o onboarding', () => {
  it('a fonte do App passa `!hasCompletedOnboarding` ao readyFor da fila de apresentação', async () => {
    const fs = await import(/* @vite-ignore */ 'node:fs');
    const src = fs.readFileSync(`${process.cwd()}/src/App.tsx`, 'utf8');
    expect(src).toContain('ready: readyFor(demo || !hasCompletedOnboarding, {');
  });
});
