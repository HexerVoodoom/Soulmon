// @vitest-environment jsdom
/**
 * Canvas Onboarding-oráculo — identidade (DECISÕES §31, D-Q1…D-Q13, 20/09/2026).
 *
 * O ritual como aparelho: a barra `.meter` SIS-07 a 8px, o voltar `arrow_back`
 * 24 pelado num alvo 44, as opções = cards 44 TONAIS (nunca placa cheia —
 * escolher avança), o campo inerte por FORMA (nunca opacidade), a bifurcação
 * com as duas portas em `outline`, o muro de idade sem alerta e sem vermelho.
 * Cada `it` é uma decisão do canvas; a régua é o DOM, não o desenho.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { writeOracleDraft, clearOracleDraft } from '../utils/oracleDraft';
import { ORACLE_QUESTIONS } from '../utils/oracle';
import { items as SOUL_TEST_ITEMS } from '../utils/soulProfile/personality/questions';

const CIDADE = { name: 'São Paulo', region: 'SP', country: 'BR', latitude: -23.55, longitude: -46.63, timeZone: 'America/Sao_Paulo' };
const CONSENT = { acceptedAt: '2026-09-20T10:00:00.000Z', termsVersion: '1', privacyVersion: '1' };

/** Os passos do ritual, como o componente os numera (`FAVORITE_STEP = 5`). */
const QUIZ_START = 6;
const REFINE_OFFER = QUIZ_START + ORACLE_QUESTIONS.length;
const DEEP_START = REFINE_OFFER + 1;

function rascunho(step: number, extra: Record<string, unknown> = {}) {
  return {
    mode: 'onboarding' as const, step, soulGoal: 'sleep earlier', soulStruggle: '',
    fullName: 'Jane Doe', birthDate: '1994-09-03', birthDateText: '03/09/1994', birthTime: '12:00',
    birthCity: CIDADE, timeUnknown: false, favoriteCreature: '', skipFavorite: false,
    answers: {}, testAnswers: {}, refine: null as boolean | null, consent: CONSENT, ...extra,
  };
}

const btn = (nome: string | RegExp) => screen.getByRole('button', { name: nome }) as HTMLButtonElement;
const variante = (b: HTMLElement) => b.style.getPropertyValue('--sm2-btn');

describe('ritual — o passo como aparelho (D-Q1…D-Q3)', () => {
  beforeEach(() => { vi.useFakeTimers(); installFakeStorage(); clearOracleDraft(); });
  afterEach(() => { vi.useRealTimers(); });

  it('D-Q1: a barra é o `.meter` SIS-07 (kit) a 8px, `role=progressbar` "Ritual progress"', () => {
    writeOracleDraft(rascunho(1));
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    const bar = screen.getByRole('progressbar', { name: 'Ritual progress' });
    expect(bar.className).toContain('sm2-kit-meter');
    expect(bar.className).toContain('sm2-ora-meter');
    expect(bar.querySelector('.sm2-kit-meter-fill')).toBeTruthy();
    // sem estilo inline de trilho: a peça é a do kit, não um `div` próprio
    expect(bar.style.height).toBe('');
    expect(Number(bar.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  });

  it('D-Q2: o voltar é `arrow_back` 24 pelado num alvo 44 com o rótulo só no nome acessível; "Continue" sem seta e inerte por SUPERFÍCIE', () => {
    writeOracleDraft(rascunho(1, { fullName: '' }));
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    const back = btn('Back');
    expect(back.className).toContain('sm2-ora-back');
    expect(back.textContent?.trim()).toBe('arrow_back'); // só a ligature, escondida
    expect(back.querySelector('.sm2-icon')?.getAttribute('aria-hidden')).toBe('true');
    const cont = btn('Continue');
    expect(cont.textContent?.trim()).toBe('Continue');
    expect(cont.getAttribute('aria-disabled')).toBe('true');
    expect(cont.tabIndex).toBe(-1);
    expect(variante(cont)).toBe('disabled');
    expect(cont.style.backgroundColor).toBe('var(--sm2-surface-2)');
    expect(cont.style.opacity).toBe('');
    fireEvent.change(screen.getByPlaceholderText('E.g.: Jane Doe'), { target: { value: 'Jane Doe' } });
    expect(variante(btn('Continue'))).toBe('primary');
    expect(btn('Continue').getAttribute('aria-disabled')).toBeNull();
  });

  it('D-Q3: a hora com "não sei" fica inerte por FORMA (tracejado + muted + aria-disabled, fora do Tab), nunca por opacidade', () => {
    writeOracleDraft(rascunho(3));
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    fireEvent.click(screen.getByText("I don't know my birth time"));
    const hora = screen.getByLabelText('Birth time') as HTMLInputElement;
    expect(hora.getAttribute('aria-disabled')).toBe('true');
    expect(hora.tabIndex).toBe(-1);
    expect(hora.readOnly).toBe(true);
    expect(hora.style.border).toBe('1px dashed var(--sm2-muted)');
    expect(hora.style.color).toBe('var(--sm2-muted)');
    expect(hora.style.opacity).toBe('');
    // e "Continue" segue vivo: "não sei" é resposta válida
    expect(variante(btn('Continue'))).toBe('primary');
  });

  it('muro de idade: título + linha + UM primário, sem `role=alert`, sem vermelho', () => {
    writeOracleDraft(rascunho(2, { birthDate: '', birthDateText: '' }));
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    const data = screen.getByPlaceholderText('__/__/____ (DD/MM/YYYY)');
    fireEvent.change(data, { target: { value: '03/09/2015' } });
    fireEvent.click(btn('Continue'));
    expect(screen.getByText('Not quite yet')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(document.body.innerHTML).not.toContain('danger');
    expect(variante(btn('Back to start'))).toBe('primary');
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });
});

describe('as 6 perguntas, a bifurcação e os 20 itens (D-Q4, D-Q5, D-Q12)', () => {
  beforeEach(() => { vi.useFakeTimers(); installFakeStorage(); clearOracleDraft(); });
  afterEach(() => { vi.useRealTimers(); });

  it('D-Q4: as opções são cards 44 com anel `muted`; a escolhida é TONAL (primary-soft + anel primary-ink), nunca placa cheia; `aria-pressed` fica', () => {
    writeOracleDraft(rascunho(QUIZ_START));
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    const opts = [...document.querySelectorAll('button[aria-pressed]')] as HTMLButtonElement[];
    expect(opts.length).toBe(ORACLE_QUESTIONS[0].options.length);
    for (const o of opts) {
      expect(o.style.minHeight).toBe('44px');
      expect(o.style.border).toBe('1px solid var(--sm2-muted)');
      expect(o.style.textAlign).toBe('center');
      expect(o.getAttribute('aria-pressed')).toBe('false');
    }
    fireEvent.click(opts[1]);
    const on = document.querySelectorAll('button[aria-pressed="true"]')[0] as HTMLButtonElement;
    expect(on.style.backgroundColor).toBe('var(--sm2-primary-soft)');
    expect(on.style.border).toBe('2px solid var(--sm2-primary-ink)');
    expect(on.style.color).toBe('var(--sm2-primary-ink)');
    expect(document.body.innerHTML).not.toContain('var(--sm2-on-primary)');
    // a dica é de ORIGEM (o hint da pergunta), abaixo das opções
    expect(document.body.textContent).toContain('Question 1 of 6');
  });

  it('§17 V2: a PRIMEIRA pergunta tem voltar (→ criatura favorita), pelado num alvo 44', () => {
    writeOracleDraft(rascunho(QUIZ_START));
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    const back = btn('Back');
    expect(back.className).toContain('sm2-ora-back');
    fireEvent.click(back);
    expect(screen.getByText("What's your favorite creature?")).toBeTruthy();
  });

  it('D-Q5: a bifurcação tem as DUAS portas em `outline`, o teste primeiro; o erro de geração é âmbar', () => {
    writeOracleDraft(rascunho(REFINE_OFFER - 1));
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    fireEvent.click(document.querySelector('button[aria-pressed]')!);
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByText('Want to sharpen the reading?')).toBeTruthy();
    const teste = btn(`Answer ${SOUL_TEST_ITEMS.length} more questions`);
    const agora = btn('Reveal my Soulmon now');
    expect(variante(teste)).toBe('outline');
    expect(variante(agora)).toBe('outline');
    expect(teste.compareDocumentPosition(agora) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.body.innerHTML).not.toContain('danger');
  });

  it('o teste de 20 itens usa o MESMO aparelho tonal, com voltar pelado do 1º item', () => {
    writeOracleDraft(rascunho(DEEP_START, { refine: true }));
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    expect(document.body.textContent).toContain(`Question 1 of ${SOUL_TEST_ITEMS.length}`);
    const opts = [...document.querySelectorAll('button[aria-pressed]')] as HTMLButtonElement[];
    expect(opts.length).toBeGreaterThanOrEqual(2);
    for (const o of opts) expect(o.style.border).toBe('1px solid var(--sm2-muted)');
    expect(btn('Back').className).toContain('sm2-ora-back');
    fireEvent.click(btn('Back'));
    expect(screen.getByText('Want to sharpen the reading?')).toBeTruthy();
  });
});

/* A leitura (astronomy-engine) nunca termina aqui: o que se mede é a tela
   de espera, não a geração. */
vi.mock('../utils/soulProfile', () => new Promise(() => {}));

describe('Gerando — a espera é ritual (D-Q6, D-Q11, R1, R3)', () => {
  beforeEach(() => { vi.useFakeTimers(); installFakeStorage(); clearOracleDraft(); });
  afterEach(() => { vi.useRealTimers(); });

  it('o `role=status` é o casulo `forming` 128 num vidro 192² pulsando por POSIÇÃO; `sync` 24 girando; sem corvo, sem spinner de sistema', () => {
    writeOracleDraft(rascunho(REFINE_OFFER));
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    fireEvent.click(btn('Reveal my Soulmon now'));
    const status = screen.getByRole('status');
    expect(status.textContent).toContain("Revealing your soul's creature…");
    const vidro = status.querySelector('.sm2-viewport-screen') as HTMLElement;
    expect(vidro.style.width).toBe('192px');
    expect(vidro.style.height).toBe('192px');
    const casulo = vidro.querySelector('img.sm2-ora-cocoon') as HTMLImageElement;
    expect(casulo.className).toContain('is-pulsing');
    expect(casulo.getAttribute('src')).toContain('forming');
    expect(casulo.width).toBe(128);
    expect(casulo.style.opacity).toBe('');
    expect(status.querySelector('.sm2-ora-spin .sm2-icon')?.textContent).toBe('sync');
    expect(status.querySelector('[data-sm-spin]')).toBeNull();
    expect(document.querySelector('img[src*="mascot-raven"]')).toBeNull();
    // a barra segue viva na espera (GENERATING < lastStep)
    expect(screen.getByRole('progressbar', { name: 'Ritual progress' })).toBeTruthy();
  });

  it('o pulso do casulo é por transform em steps(2) e para em reduced-motion; o sync idem (CSS)', async () => {
    const fs = await import(/* @vite-ignore */ 'node:fs');
    // jsdom: `import.meta.url` não é `file:` — o CSS vem pela raiz do repo.
    const css = fs.readFileSync(`${process.cwd()}/src/index.css`, 'utf8');
    const kf = css.slice(css.indexOf('@keyframes sm2-ora-cocoon'), css.indexOf('.sm2-ora-cocoon {'));
    expect(kf).toContain('translateY(-4px)');
    expect(kf).not.toContain('opacity');
    expect(css).toMatch(/\.sm2-ora-cocoon\.is-pulsing \{ animation: sm2-ora-cocoon 1\.6s steps\(2, end\) infinite; \}/);
    const reduzido = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduzido).toContain('.sm2-ora-cocoon.is-pulsing, .sm2-ora-spin { animation: none !important; }');
  });
});
