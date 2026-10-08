// @vitest-environment jsdom
/**
 * A folha do Passeio redesenhada (02/10/2026, F1–F5 de
 * `docs/AJUSTES-NAVEGACAO-2026-10-02.md`): só a Travessia em uso na tela, as
 * outras no modal, "Recuar" no lugar de "Deixar pra lá", feedback do "Fiz"
 * com a recompensa real, e "Fiz" uma vez por dia.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { createElement, useState } from 'react';
import { PasseioSheet } from './PasseioSheet';
import { CROSSINGS_EMPTY, HOME_REGION, type CrossingsState } from '../../types/travessias';
import { REGIONS } from '../../data/travessiasCatalog';
import { dailyOffer, markDone, pickMission } from '../../utils/travessias';
import { travessiaTitle } from '../../utils/travessiaTitles';
import { AREA_ICON } from './TravessiaIcon';

afterEach(cleanup);

const FORA = REGIONS.filter(r => r.id !== HOME_REGION);

const DIA = '2026-10-02';
const SEED = 'save-teste';
const hoje3 = dailyOffer(DIA, SEED);
const M1 = hoje3[0];
const ativa: CrossingsState = pickMission(CROSSINGS_EMPTY, DIA, SEED, M1.region.id, M1.challenge.id);
const C1 = M1.challenge;
const R1 = M1.region;

/** A folha com estado de verdade (o `App` aplica as funções puras sobre `prev`). */
function Viva({ inicial, dia, language = 'pt-BR' }: { inicial: CrossingsState; dia: string; language?: 'pt-BR' | 'en-US' }) {
  const [c, set] = useState(inicial);
  return createElement(PasseioSheet, { language, crossings: c, onChange: f => set(f), todayKey: dia, seed: SEED });
}

describe('missões do dia (04/10/2026) — a tela mostra as TRÊS e se escolhe UMA', () => {
  it('sem escolha: três cards fechados e o "!"; abrir mostra o ato e o "Escolher esta"', () => {
    const { container } = render(createElement(Viva, { inicial: CROSSINGS_EMPTY, dia: DIA }));
    const cards = container.querySelectorAll('[data-travessia-card]');
    expect(cards.length).toBe(3);
    expect([...cards].map(c => c.getAttribute('data-travessia-card'))).toEqual(hoje3.map(m => m.challenge.id));
    expect(container.querySelector('[data-mission-mark="available"]')).toBeTruthy();
    expect(container.querySelector('[data-mission-mark="progress"]')).toBeNull();
    expect(container.querySelector('[data-travessia-ativa]')).toBeNull();
    expect(container.querySelector('[data-travessia-escolher]')).toBeNull();
    const abrir = cards[0].querySelector('[data-travessia-abrir]') as HTMLElement;
    expect(abrir.getAttribute('aria-expanded')).toBe('false');
    expect(abrir.textContent!.trim().length).toBeGreaterThan(0);
    // Cada card traz o postal da região do cenário.
    for (const c of cards) expect(c.querySelector('[data-travessia-postal]')).toBeTruthy();
    fireEvent.click(abrir);
    expect(container.querySelectorAll('[data-travessia-escolher]').length).toBe(1);
  });

  it('o texto explicativo mora atrás de um "?" (InfoTip), não solto na tela', () => {
    const { container } = render(createElement(Viva, { inicial: CROSSINGS_EMPTY, dia: DIA }));
    expect(container.textContent).not.toMatch(/Todo dia saem três missões/);
    expect(container.querySelector('button[aria-label="Sobre o Passeio"]')).toBeTruthy();
  });

  it('escolher troca as três pelo card da missão, com o "?" (em andamento)', () => {
    const { container } = render(createElement(Viva, { inicial: CROSSINGS_EMPTY, dia: DIA }));
    fireEvent.click(container.querySelector(`[data-travessia-abrir="${C1.id}"]`)!);
    fireEvent.click(container.querySelector(`[data-travessia-escolher="${C1.id}"]`)!);
    expect(container.querySelector('[data-travessia-card]')).toBeNull();
    const card = container.querySelector('[data-travessia-ativa]')!;
    expect(card.getAttribute('data-travessia-ativa')).toBe(C1.id);
    expect(card.textContent).toContain(travessiaTitle(C1.id, true)!);
    expect(card.textContent).toContain(C1.textPt);
    expect(card.querySelector('[data-travessia-postal]')).toBeTruthy();
    expect(card.querySelector(`[data-travessia-area="${C1.area}"]`)).toBeTruthy();
    expect(card.querySelector(`[data-travessia-icone="${C1.id}"] img[data-pixel-icon]`)).toBeTruthy();
    expect(card.querySelector('[data-mission-mark="progress"]')).toBeTruthy();
    expect(container.querySelector('[data-mission-mark="available"]')).toBeNull();
  });

  it('escolhida de ONTEM não vale hoje: voltam as três (sem culpa, sem marca de atraso)', () => {
    const ontem = pickMission(CROSSINGS_EMPTY, '2026-10-01', SEED, dailyOffer('2026-10-01', SEED)[0].region.id, dailyOffer('2026-10-01', SEED)[0].challenge.id);
    const { container } = render(createElement(Viva, { inicial: ontem, dia: DIA }));
    expect(container.querySelector('[data-travessia-ativa]')).toBeNull();
    expect(container.querySelectorAll('[data-travessia-card]').length).toBe(3);
  });
});

describe('rodada 7 (M1–M4, M7) — escolhida, só a missão; sem Recuar, sem Esconder; relógio de 24 h', () => {
  it('escolhida: some o "para onde ele vai hoje"; não há Recuar, Trocar nem Esconder Travessias', () => {
    const aberta: CrossingsState = { ...CROSSINGS_EMPTY, opened: [{ region: R1.id, day: '2026-09-01' }] };
    const { container } = render(createElement(Viva, { inicial: aberta, dia: DIA }));
    // Com uma região aberta há o que escolher: o destino aparece, rotulado — até escolher a missão.
    expect(container.querySelector('[data-passeio-destino]')).toBeTruthy();
    expect(container.textContent).toMatch(/Passeio livre/);
    fireEvent.click(container.querySelector(`[data-travessia-abrir="${C1.id}"]`)!);
    fireEvent.click(container.querySelector(`[data-travessia-escolher="${C1.id}"]`)!);
    expect(container.querySelector('[data-passeio-destino]')).toBeNull();
    expect(container.textContent).not.toMatch(/Para onde ele vai hoje|Passeio livre/);
    expect(container.querySelector('[data-travessia-recuar]')).toBeNull();
    expect(container.querySelector('[data-travessia-trocar]')).toBeNull();
    expect(container.querySelector('[data-travessias-esconder]')).toBeNull();
    expect(container.querySelectorAll('[data-travessia-card]').length).toBe(0);
    expect(container.textContent).not.toMatch(/Recuar|Step back|Esconder|Hide/);
  });

  it('só a casa aberta: não há "destino" para escolher (o chip sem sentido saiu)', () => {
    const { container } = render(createElement(Viva, { inicial: CROSSINGS_EMPTY, dia: DIA }));
    expect(container.querySelector('[data-passeio-destino]')).toBeNull();
  });

  it('o card diz quantas horas restam, sem "prazo"; o texto longo do mapa saiu', () => {
    const T0 = Date.UTC(2026, 9, 2, 12, 0, 0);
    const c = pickMission(CROSSINGS_EMPTY, DIA, SEED, M1.region.id, M1.challenge.id, T0);
    const { container } = render(createElement(PasseioSheet, {
      language: 'pt-BR', crossings: c, onChange: () => {}, todayKey: DIA, seed: SEED, now: T0 + 5 * 3_600_000,
    }));
    expect(container.querySelector('[data-travessia-tempo]')!.textContent).toBe('Vale por mais 19 h.');
    expect(container.querySelector('[data-travessia-mapa]')).toBeNull();
    expect(container.textContent).not.toMatch(/No mapa|pressa/i);
  });

  it('passadas as 24 h a missão some e voltam as três do dia', () => {
    const T0 = Date.UTC(2026, 9, 2, 12, 0, 0);
    const c = pickMission(CROSSINGS_EMPTY, DIA, SEED, M1.region.id, M1.challenge.id, T0);
    const { container } = render(createElement(PasseioSheet, {
      language: 'pt-BR', crossings: c, onChange: () => {}, todayKey: '2026-10-03', seed: SEED, now: T0 + 24 * 3_600_000,
    }));
    expect(container.querySelector('[data-travessia-ativa]')).toBeNull();
    expect(container.querySelectorAll('[data-travessia-card]').length).toBe(3);
  });
});

describe('rodada 7 (M5, M6) — celebração e registro', () => {
  it('o "Fiz" solta a celebração (decorativa, aria-hidden); o registro lista a missão feita', () => {
    const { container } = render(createElement(Viva, { inicial: ativa, dia: DIA }));
    expect(container.querySelector('[data-celebration]')).toBeNull();
    expect(container.querySelector('[data-travessias-registro]')).toBeNull();
    fireEvent.click(container.querySelector('[data-travessia-fiz]')!);
    const fx = container.querySelector('[data-celebration]')!;
    expect(fx.getAttribute('aria-hidden')).toBe('true');
    const abrir = container.querySelector('[data-registro-abrir]') as HTMLElement;
    expect(abrir.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(abrir);
    const item = container.querySelector(`[data-registro-item="${C1.id}"]`)!;
    expect(item.textContent).toContain(travessiaTitle(C1.id, true)!);
  });
});

describe('F4/F5 — "Fiz" dá retorno claro, uma vez por dia', () => {
  it('marca, confirma, diz para onde o Soulmon viaja e o que muda no mapa; o total aparece discreto', () => {
    const { container } = render(createElement(Viva, { inicial: ativa, dia: DIA }));
    expect(container.querySelector('[data-marcos]')).toBeNull(); // 0 não aparece: sem número cobrando

    const fiz = container.querySelector<HTMLButtonElement>('[data-travessia-fiz]')!;
    expect(fiz.disabled).toBe(false);
    fireEvent.click(fiz);

    const hoje = container.querySelector('[data-travessia-hoje]')!;
    expect(hoje.getAttribute('role')).toBe('status');
    expect(hoje.textContent).toMatch(/Feita\./);
    expect(hoje.textContent).toContain(`viaja para ${R1.namePt}`);
    expect(container.querySelector('[data-travessia-ativa]')!.getAttribute('data-travessia-feito')).toBe('sim');
    expect(container.querySelector<HTMLButtonElement>('[data-travessia-fiz]')!.disabled).toBe(true);
    expect(container.querySelector('[data-mission-mark]')).toBeNull();
    expect(container.querySelector('[data-marcos]')!.textContent).toMatch(/Marcos de Aventura · 1/);
  });

  it('vira o dia (o App passa outro `todayKey`): a de ontem sai e saem três novas', () => {
    const feita = markDone(ativa, DIA);
    const { container, rerender } = render(createElement(PasseioSheet, {
      language: 'pt-BR', crossings: feita, onChange: () => {}, todayKey: DIA, seed: SEED,
    }));
    expect(container.querySelector('[data-travessia-ativa]')!.getAttribute('data-travessia-feito')).toBe('sim');
    rerender(createElement(PasseioSheet, {
      language: 'pt-BR', crossings: feita, onChange: () => {}, todayKey: '2026-10-03', seed: SEED,
    }));
    expect(container.querySelector('[data-travessia-ativa]')).toBeNull();
    expect(container.querySelectorAll('[data-travessia-card]').length).toBe(3);
    expect(container.querySelector('[data-marcos]')!.textContent).toMatch(/· 1/); // o total fica
  });

  it('EN: o mesmo caminho em inglês, sem "challenge"', () => {
    const { container } = render(createElement(Viva, { inicial: ativa, dia: DIA, language: 'en-US' }));
    fireEvent.click(container.querySelector('[data-travessia-fiz]')!);
    expect(container.querySelector('[data-travessia-hoje]')!.textContent).toMatch(/Done\. Tonight/);
    expect(container.querySelector('[data-marcos]')!.textContent).toMatch(/Adventure Milestones/);
    expect(container.textContent).not.toMatch(/challenge/i);
  });
});

describe('F1 — todo desafio do catálogo tem sinal visual', () => {
  it('toda área tem glifo, e região + área é único dentro de cada região', () => {
    for (const r of FORA) {
      const areas = r.challenges.map(c => c.area);
      expect(new Set(areas).size, r.id).toBe(areas.length);
      for (const a of areas) expect(AREA_ICON[a], `${r.id}/${a}`).toBeTruthy();
    }
  });
});
