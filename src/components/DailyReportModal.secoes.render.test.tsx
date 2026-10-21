// @vitest-environment jsdom
/**
 * Beta-2, itens 4.2 / 4.3 / 4.4 do backlog — o resumo pós-dia em UMA FOLHA POR SEÇÃO.
 *
 *  4.2  sem `Evolution Path`; `Yesterday Tasks`; 3 corações; o coração cobrado treme, quebra e vira PRETO;
 *       a animação representa o resultado real do dia e NÃO repete ao reabrir.
 *  4.3  `From Yesterday's Adventure`; `New` no dourado da paleta; vínculo explícito com a missão e o
 *       destino do Passeio escolhido ontem; folha independente com o NPC do Passeio.
 *  4.4  uma folha por seção; NPC só na da aventura; sem NPC em `Stretch Closed`.
 *  14/10/2026 (dono): "como foi o dia anterior" + corações viram UM modal só, CENTRALIZADO (não bottom sheet); a aventura
 *       segue separada (tem o NPC do scroll) e HOJE também.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { screen, cleanup, fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DailyReportModal } from './DailyReportModal';
import { HEART_SHAKE_MS, HEART_SNAP_MS } from './DayHearts';
import { ADVENTURE_CATALOG } from '../utils/adventure';

const ACHADO = ADVENTURE_CATALOG[0];
const STROLL = { missionTitle: 'A Stretch Without Screens', destination: 'Desert Mind' };

const relatorio = (over: Record<string, unknown> = {}) => ({
  date: 'Tue Oct 13 2026', done: 4, total: 6, required: 4, heartsLost: 0, wasPerfect: false, perfectDays: 3, degenerated: false,
  gaugeGain: 3, evolutionPoints: 12,
  ...over,
}) as never;

function abrir(over: Record<string, unknown> = {}, props: Record<string, unknown> = {}, language: 'pt-BR' | 'en-US' = 'en-US') {
  const onClose = vi.fn();
  const r = renderWithCss(
    <DailyReportModal report={relatorio(over)} adventure={ACHADO} onClose={onClose} language={language} {...props} />,
  );
  return { ...r, onClose };
}
const proximo = () => fireEvent.click(document.querySelector('[data-report-next]') as HTMLElement);
const hearts = () => document.querySelector('[data-day-hearts]') as HTMLElement;
const npc = () => document.querySelector('[data-area-sheet-npc]');

beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('4.2 — o resumo não mostra mais o Evolution Path', () => {
  it('nem na linha do dia, nem no modo acolhida — mesmo com gauge ganho no relatório', () => {
    abrir({ gaugeGain: 5, evolutionPoints: 40 });
    expect(document.body.textContent).not.toMatch(/Evolution path|Path kept/i);
    cleanup();
    abrir({ welcomeBack: true, daysAway: 5, done: 0, gaugeGain: 0, evolutionPoints: 40 });
    expect(document.body.textContent).not.toMatch(/Evolution path|Path kept|Caminho/i);
  });

  it('mantém `Yesterday Tasks` (EN) / `Tarefas de ontem` (PT)', () => {
    abrir();
    expect(screen.getByText('Yesterday Tasks')).toBeTruthy();
    expect(screen.getByText('4 of 6')).toBeTruthy();
    cleanup();
    abrir({}, {}, 'pt-BR');
    expect(screen.getByText('Tarefas de ontem')).toBeTruthy();
  });
});

describe('4.4 — uma seção por vez; o NPC só no Passeio; nenhum em `Stretch Closed`', () => {
  it('a ordem é ontem (tarefas + corações) → aventura → hoje, UMA seção visível por vez', () => {
    abrir({ heartsLost: 1 }, { onPickMood: () => {}, showOffer: true, onOpenOffer: () => {} });
    const secao = () => document.querySelector('[data-report-step]')!.getAttribute('data-report-step');
    expect(secao()).toBe('yesterday');
    expect(document.querySelectorAll('[data-report-step]')).toHaveLength(1);
    // tarefas de ontem e corações moram no MESMO modal — e o HUMOR também (19/10/2026, REGISTRO 111: resumo + humor numa tela só)
    expect(document.querySelector('[data-report-step="yesterday"] [data-day-hearts]')).not.toBeNull();
    expect(document.querySelector('[data-report-step="yesterday"] [data-report-section="mood"] [role="group"]')).not.toBeNull();
    expect(document.body.textContent).toContain('Yesterday Tasks');
    proximo(); expect(secao()).toBe('adventure');
    proximo(); expect(secao()).toBe('today');
    expect(document.querySelectorAll('[data-report-step]')).toHaveLength(1);
    // o humor é pedido UMA vez: o passo "hoje" (convite/memórias) não o repete
    expect(document.querySelector('[data-report-step="today"] [role="group"][aria-label="Mood"]')).toBeNull();
  });

  it('sem convite nem memórias não há passo "hoje": o humor não cria uma terceira tela', () => {
    abrir({}, { onPickMood: () => {}, adventure: null });
    expect(document.querySelectorAll('[data-report-step]')).toHaveLength(1);
    expect((document.querySelector('[data-report-next]') as HTMLElement).getAttribute('data-report-next')).toBe('start');
  });

  it('`Stretch Closed` (dia completo) não tem NPC; os corações também não', () => {
    abrir({ wasPerfect: true, done: 6 });
    expect(screen.getByText('A stretch closed.')).toBeTruthy();
    expect(npc()).toBeNull();
    expect(document.querySelector('[data-report-section="hearts"]')).not.toBeNull();
    expect(npc()).toBeNull();
  });

  it('só a aventura traz o NPC — o do Passeio — numa folha própria', () => {
    abrir();
    proximo();
    expect(npc()).not.toBeNull();
    expect(document.querySelector('[data-area-sheet]')).not.toBeNull();
    // a fala/nome do NPC do Passeio (Amandha)
    expect(document.body.textContent).toContain('Amandha');
    // e nada de tarefas misturado nessa folha
    expect(document.querySelector('[data-area-sheet]')!.textContent).not.toMatch(/Yesterday Tasks|Hearts/);
  });

  it('14/10/2026: ontem (tarefas + corações) e hoje são o modal CENTRALIZADO, nunca a folha de baixo', () => {
    abrir({}, { onPickMood: () => {}, showOffer: true, onOpenOffer: () => {} });
    const centrado = () => {
      const dlg = document.querySelector('[data-modal-backdrop] [role="dialog"]') as HTMLElement;
      expect(dlg.getAttribute('data-placement')).toBe('center');
      expect(dlg.className).not.toContain('sm2-sheet-rise');
      expect((document.querySelector('[data-modal-backdrop]') as HTMLElement).style.alignItems).toBe('center');
    };
    centrado(); // ontem
    proximo(); // aventura (AreaSheet, com o NPC do scroll)
    expect(document.querySelector('[data-modal-backdrop]')).toBeNull();
    proximo();
    centrado(); // hoje
  });

  it('o último passo é "Start the day"; fechar por fora/✕ fecha o resumo todo', () => {
    const { onClose } = abrir();
    proximo();
    const fim = document.querySelector('[data-report-next]') as HTMLElement;
    expect(fim.getAttribute('data-report-next')).toBe('start');
    expect(fim.textContent).toBe('Start the day');
    fireEvent.click(fim);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sem aventura nem "hoje", o único passo é o de ontem e já é o "Start the day"', () => {
    const { onClose } = abrir({}, { adventure: null });
    expect((document.querySelector('[data-report-next]') as HTMLElement).textContent).toBe('Start the day');
    proximo();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('as notas dos corações moram na SEÇÃO dos corações do modal, não na das tarefas', () => {
    abrir({ restDayUsed: true, heartsLost: 0 });
    const secao = document.querySelector('[data-report-section="hearts"]') as HTMLElement;
    expect(secao.textContent).toMatch(/The tide absorbed yesterday/);
    expect(document.querySelector('[data-report-step="yesterday"]')!.textContent).toMatch(/The tide absorbed yesterday/);
  });
});

describe('4.2 — os corações: tremor → quebra → coração preto', () => {
  it('são 3 corações; sem perda, nenhum quebra e a fileira fica estática', () => {
    abrir({ heartsLost: 0 });
    expect(hearts().querySelectorAll('[data-heart]')).toHaveLength(3);
    expect(hearts().getAttribute('data-hearts-kept')).toBe('3');
    expect([...hearts().querySelectorAll('[data-heart]')].every(h => h.getAttribute('data-heart') === 'whole')).toBe(true);
    expect(hearts().getAttribute('aria-label')).toBe('Hearts: 3 of 3');
  });

  it('perdeu 1: o coração cobrado treme, quebra e vira preto; os outros 2 ficam intactos', () => {
    vi.useFakeTimers();
    abrir({ heartsLost: 1 });
    expect(hearts().getAttribute('data-hearts-phase')).toBe('shake');
    expect(hearts().querySelectorAll('.sm2-heart-shake')).toHaveLength(1);
    act(() => { vi.advanceTimersByTime(HEART_SHAKE_MS + 5); });
    expect(hearts().getAttribute('data-hearts-phase')).toBe('snap');
    expect(hearts().querySelectorAll('.sm2-heart-snap')).toHaveLength(1);
    act(() => { vi.advanceTimersByTime(HEART_SNAP_MS + 5); });
    expect(hearts().getAttribute('data-hearts-phase')).toBe('black');
    const estados = [...hearts().querySelectorAll('[data-heart]')].map(h => h.getAttribute('data-heart'));
    expect(estados).toEqual(['whole', 'whole', 'black']);
    expect(hearts().getAttribute('aria-label')).toBe('Hearts: 2 of 3');
  });

  it('representa o resultado REAL: 2 corações perdidos quebram 2', () => {
    vi.useFakeTimers();
    abrir({ heartsLost: 2 });
    act(() => { vi.advanceTimersByTime(HEART_SHAKE_MS + 5); });
    act(() => { vi.advanceTimersByTime(HEART_SNAP_MS + 5); });
    expect([...hearts().querySelectorAll('[data-heart]')].map(h => h.getAttribute('data-heart'))).toEqual(['whole', 'black', 'black']);
  });

  it('a animação avisa que começou UMA vez (para o App gravar "já vista")', () => {
    const onHeartsAnimSeen = vi.fn();
    abrir({ heartsLost: 1 }, { onHeartsAnimSeen });
    expect(onHeartsAnimSeen).toHaveBeenCalledTimes(1);
  });

  it('NÃO repete ao reabrir: com `heartsAnimSeen`, o coração cobrado já nasce preto, sem tremor, e nada é regravado', () => {
    const onHeartsAnimSeen = vi.fn();
    abrir({ heartsLost: 1 }, { heartsAnimSeen: true, onHeartsAnimSeen });
    expect(hearts().getAttribute('data-hearts-phase')).toBe('black');
    expect(hearts().querySelector('.sm2-heart-shake, .sm2-heart-snap')).toBeNull();
    expect([...hearts().querySelectorAll('[data-heart]')].map(h => h.getAttribute('data-heart'))).toEqual(['whole', 'whole', 'black']);
    expect(onHeartsAnimSeen).not.toHaveBeenCalled();
  });

  it('movimento reduzido: pula direto para o coração preto (sem tremor), e ainda marca como vista', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    const onHeartsAnimSeen = vi.fn();
    abrir({ heartsLost: 1 }, { onHeartsAnimSeen });
    expect(hearts().getAttribute('data-hearts-phase')).toBe('black');
    expect(onHeartsAnimSeen).toHaveBeenCalledTimes(1);
  });

  it('modo acolhida: nada é cobrado, então nenhum coração quebra (mesmo que o relatório traga perda)', () => {
    abrir({ welcomeBack: true, daysAway: 4, heartsLost: 1 });
    expect(hearts().getAttribute('data-hearts-lost')).toBe('0');
  });

  it('a fileira acompanha o HP máximo do estágio', () => {
    abrir({ heartsLost: 1 }, { maxHearts: 5 });
    expect(hearts().querySelectorAll('[data-heart]')).toHaveLength(5);
  });

  it('o coração preto usa o ícone do HUD escurecido por filtro (nenhuma arte nova)', () => {
    abrir({ heartsLost: 1 }, { heartsAnimSeen: true });
    const preto = hearts().querySelector('[data-heart="black"] img') as HTMLElement;
    expect(preto.getAttribute('data-pixel-icon')).toBe('hp');
    expect(preto.style.filter).toMatch(/grayscale\(1\)/);
  });
});

describe('4.3 — From Yesterday’s Adventure, `New` dourado, vínculo com o Passeio de ontem', () => {
  const irAteAventura = () => { proximo(); };

  it('título EN/PT; a folha é independente e sem textos de tarefa', () => {
    abrir();
    irAteAventura();
    expect(screen.getByText("From Yesterday's Adventure")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/From today's adventure|Front Today/i);
    cleanup();
    abrir({}, {}, 'pt-BR');
    irAteAventura();
    expect(screen.getByText('Da aventura de ontem')).toBeTruthy();
  });

  it('`New` só quando inédito, e com os tokens do dourado da paleta (nunca hex)', () => {
    abrir({}, { adventureIsNew: false });
    irAteAventura();
    expect(document.querySelector('[data-adventure-new]')).toBeNull();
    cleanup();
    abrir({}, { adventureIsNew: true });
    irAteAventura();
    const novo = document.querySelector('[data-adventure-new]') as HTMLElement;
    expect(novo.textContent).toBe('New');
    expect(novo.style.backgroundColor).toBe('var(--sm2-gold-fill)');
    expect(novo.style.color).toBe('var(--sm2-on-gold)');
  });

  it('liga o achado ao Passeio escolhido ontem: missão + destino em destaque', () => {
    abrir({}, { stroll: STROLL });
    irAteAventura();
    const elo = document.querySelector('[data-stroll-link]') as HTMLElement;
    expect(elo.querySelector('[data-stroll-mission]')!.textContent).toBe(STROLL.missionTitle);
    const destino = elo.querySelector('[data-stroll-destination]') as HTMLElement;
    expect(destino.textContent).toBe('Desert Mind');
    expect(destino.style.color).toBe('var(--sm2-gold-ink)');
    expect(elo.textContent).toMatch(/Mission/);
    expect(elo.textContent).toMatch(/Destination/);
  });

  it('PT-BR: "Missão" e "Destino"', () => {
    abrir({}, { stroll: { missionTitle: 'Um Trecho sem Tela', destination: 'Mente do Deserto' } }, 'pt-BR');
    irAteAventura();
    const elo = document.querySelector('[data-stroll-link]') as HTMLElement;
    expect(elo.textContent).toMatch(/Missão/);
    expect(elo.textContent).toMatch(/Destino/);
  });

  it('sem missão cumprida ontem, só o achado — sem bloco de vínculo inventado', () => {
    abrir({}, { stroll: null });
    irAteAventura();
    expect(document.querySelector('[data-stroll-link]')).toBeNull();
    expect(screen.getByText(ACHADO.titleEn)).toBeTruthy();
  });
});

describe('P2 (beta-2) — a folha da aventura', () => {
  it('o ✕ mora DENTRO da folha (acima do título), como nas outras folhas do resumo — e fecha o resumo', () => {
    const { onClose } = abrir();
    proximo();
    const folha = document.querySelector('[data-area-sheet]') as HTMLElement;
    const x = document.querySelector('[data-area-sheet-close]') as HTMLElement;
    expect(folha.contains(x)).toBe(true);
    expect(document.querySelectorAll('[data-area-sheet-close]')).toHaveLength(1); // sem o anel sobre a cena
    expect(x.compareDocumentPosition(folha.querySelector('h2')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(x);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('com o Passeio de ontem, o bloco Missão/Destino aparece (destino em destaque); sem Passeio, não há bloco vazio', () => {
    abrir({}, { stroll: STROLL });
    proximo();
    expect(document.querySelector('[data-stroll-mission]')!.textContent).toBe('A Stretch Without Screens');
    expect(document.querySelector('[data-stroll-destination]')!.textContent).toBe('Desert Mind');
    cleanup();
    abrir();
    proximo();
    expect(document.querySelector('[data-stroll-link]')).toBeNull();
  });
  it('os corações NÃO têm mais folha própria (a altura mínima de 40vh da folha dos corações saiu junto)', () => {
    abrir({ heartsLost: 0 });
    expect(document.querySelector('[data-report-step="hearts"]')).toBeNull();
    expect(document.querySelector('[data-report-step="tasks"]')).toBeNull();
    expect((document.querySelector('[data-report-step="yesterday"]') as HTMLElement).style.minHeight).toBe('');
  });
});

describe('14/10/2026 (dono) — fome no resumo e dia completo só por tarefas', () => {
  it('a fome que tirou meio coração aparece na folha dos corações, em voz calma (PT e EN), e a fileira conta o coração quebrado', () => {
    abrir({ hungerHeartsLost: 0.5 }, {}, 'pt-BR');
    expect(document.body.textContent).toMatch(/perdeu meio coração/);
    expect(document.body.textContent).not.toMatch(/culpa|falhou|deveria/i);
    expect(hearts()).toBeTruthy();
    cleanup();
    abrir({ hungerHeartsLost: 0.5 });
    expect(document.body.textContent).toMatch(/lost half a heart/);
  });

  it('sem fome cobrada, a nota não existe', () => {
    abrir({ hungerHeartsLost: 0 });
    expect(document.body.textContent).not.toMatch(/half a heart/);
  });

  it('a dica antiga "encher a energia também fecha o dia completo" SAIU (dia completo é só tarefas)', () => {
    abrir({ done: 4, required: 4, energyWasFull: false });
    expect(document.body.textContent).not.toMatch(/energy bar also seals|encher a energia/i);
    expect(document.body.textContent).not.toMatch(/energy bar also seals|encher a energia/i);
  });
});
