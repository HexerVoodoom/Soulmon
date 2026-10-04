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

describe('F3 — Recuar no lugar de "Deixar pra lá"', () => {
  it('não existe mais o botão antigo; Recuar solta a escolha e as três voltam', () => {
    const { container } = render(createElement(Viva, { inicial: ativa, dia: DIA }));
    expect(container.querySelector('[data-travessia-deixar]')).toBeNull();
    expect(container.querySelector('[data-travessia-trocar]')).toBeNull();
    expect(container.textContent).not.toMatch(/deixar pra l[aá]|deixa pra depois/i);
    fireEvent.click(container.querySelector('[data-travessia-recuar]')!);
    expect(container.querySelector('[data-travessia-ativa]')).toBeNull();
    expect(container.querySelectorAll('[data-travessia-card]').length).toBe(3);
  });

  it('depois do "Fiz" não há Recuar (a missão de hoje já foi)', () => {
    const { container } = render(createElement(Viva, { inicial: ativa, dia: DIA }));
    fireEvent.click(container.querySelector('[data-travessia-fiz]')!);
    expect(container.querySelector('[data-travessia-recuar]')).toBeNull();
  });
});

describe('F4/F5 — "Fiz" dá retorno claro, uma vez por dia', () => {
  it('marca, confirma, diz para onde o Soulmon viaja e o que muda no mapa; o total aparece discreto', () => {
    const { container } = render(createElement(Viva, { inicial: ativa, dia: DIA }));
    const mapa = () => container.querySelector('[data-travessia-mapa]')!.textContent!;
    expect(mapa()).toContain(R1.namePt);
    expect(mapa()).toMatch(/abre/);
    expect(container.querySelector('[data-marcos]')).toBeNull(); // 0 não aparece: sem número cobrando

    const fiz = container.querySelector<HTMLButtonElement>('[data-travessia-fiz]')!;
    expect(fiz.disabled).toBe(false);
    fireEvent.click(fiz);

    const hoje = container.querySelector('[data-travessia-hoje]')!;
    expect(hoje.getAttribute('role')).toBe('status');
    expect(hoje.textContent).toMatch(/Registrado por hoje/);
    expect(hoje.textContent).toContain(`viaja para ${R1.namePt}`);
    expect(container.querySelector('[data-travessia-ativa]')!.getAttribute('data-travessia-feito')).toBe('sim');
    expect(container.querySelector<HTMLButtonElement>('[data-travessia-fiz]')!.disabled).toBe(true);
    expect(container.querySelector('[data-mission-mark]')).toBeNull();
    expect(mapa()).toMatch(/próxima noite/);
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

  it('região já aberta: a linha do mapa diz que repetir não muda o mapa (nada farmável)', () => {
    const aberta: CrossingsState = { ...ativa, opened: [{ region: R1.id, day: '2026-09-01' }] };
    const { container } = render(createElement(Viva, { inicial: aberta, dia: DIA }));
    expect(container.querySelector('[data-travessia-mapa]')!.textContent).toMatch(/já está no seu mapa/);
  });

  it('EN: o mesmo caminho em inglês, sem "challenge"', () => {
    const { container } = render(createElement(Viva, { inicial: ativa, dia: DIA, language: 'en-US' }));
    fireEvent.click(container.querySelector('[data-travessia-fiz]')!);
    expect(container.querySelector('[data-travessia-hoje]')!.textContent).toMatch(/Noted for today/);
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
