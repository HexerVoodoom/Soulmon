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
import { pickCrossing } from '../../utils/travessias';
import { travessiaTitle } from '../../utils/travessiaTitles';
import { AREA_ICON } from './TravessiaIcon';

afterEach(cleanup);

const FORA = REGIONS.filter(r => r.id !== HOME_REGION);
const R1 = FORA[0];
const C1 = R1.challenges[0];
const ativa: CrossingsState = pickCrossing(CROSSINGS_EMPTY, R1.id, C1.id);

/** A folha com estado de verdade (o `App` aplica as funções puras sobre `prev`). */
function Viva({ inicial, dia, language = 'pt-BR' }: { inicial: CrossingsState; dia: string; language?: 'pt-BR' | 'en-US' }) {
  const [c, set] = useState(inicial);
  return createElement(PasseioSheet, { language, crossings: c, onChange: f => set(f), todayKey: dia });
}

describe('F2 — a tela mostra só a Travessia em uso', () => {
  it('com ativa: um card, sem a lista das outras; o modal tem as 21 e fecha', () => {
    const { container } = render(createElement(Viva, { inicial: ativa, dia: '2026-10-02' }));
    expect(container.querySelectorAll('[data-travessia-ativa]').length).toBe(1);
    expect(container.querySelector('[data-travessia-card]')).toBeNull();
    const card = container.querySelector('[data-travessia-ativa]')!;
    expect(card.textContent).toContain(travessiaTitle(C1.id, true)!);
    expect(card.textContent).toContain(C1.textPt);
    expect(card.querySelector('[data-travessia-postal]')).toBeTruthy();
    expect(card.querySelector(`[data-travessia-area="${C1.area}"]`)).toBeTruthy();

    fireEvent.click(container.querySelector('[data-travessia-trocar]')!);
    expect(container.querySelector('[role="dialog"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-travessia-card]').length).toBe(21);
    const fechar = Array.from(container.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Fechar')!;
    fireEvent.click(fechar);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('trocar pelo modal muda o card e fecha o modal', () => {
    const outra = R1.challenges[1];
    const { container } = render(createElement(Viva, { inicial: ativa, dia: '2026-10-02' }));
    fireEvent.click(container.querySelector('[data-travessia-trocar]')!);
    fireEvent.click(container.querySelector(`[data-travessia-abrir="${outra.id}"]`)!);
    fireEvent.click(container.querySelector(`[data-travessia-escolher="${outra.id}"]`)!);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector(`[data-travessia-ativa="${outra.id}"]`)).toBeTruthy();
  });
});

describe('F3 — Recuar no lugar de "Deixar pra lá"', () => {
  it('não existe mais o botão antigo; Recuar solta a ativa sem apagar nada', () => {
    const { container } = render(createElement(Viva, { inicial: { ...ativa, doneDay: '2026-10-02' }, dia: '2026-10-02' }));
    expect(container.querySelector('[data-travessia-deixar]')).toBeNull();
    expect(container.textContent).not.toMatch(/deixar pra l[aá]|deixa pra depois/i);
    fireEvent.click(container.querySelector('[data-travessia-recuar]')!);
    expect(container.querySelector('[data-travessia-ativa]')).toBeNull();
    expect(container.querySelector('[data-travessia-vazia]')).toBeTruthy();
  });
});

describe('F4/F5 — "Fiz" dá retorno claro, uma vez por dia', () => {
  it('marca, confirma e diz o que muda no mapa (região da névoa); vira o dia e vale de novo', () => {
    const { container, rerender } = render(createElement(Viva, { inicial: ativa, dia: '2026-10-02' }));
    const mapa = () => container.querySelector('[data-travessia-mapa]')!.textContent!;
    expect(mapa()).toContain(R1.namePt);
    expect(mapa()).toMatch(/abre/);

    const fiz = container.querySelector<HTMLButtonElement>('[data-travessia-fiz]')!;
    expect(fiz.disabled).toBe(false);
    fireEvent.click(fiz);

    const hoje = container.querySelector('[data-travessia-hoje]')!;
    expect(hoje.getAttribute('role')).toBe('status');
    expect(hoje.textContent).toMatch(/Registrado por hoje/);
    expect(container.querySelector('[data-travessia-ativa]')!.getAttribute('data-travessia-feito')).toBe('sim');
    expect(container.querySelector<HTMLButtonElement>('[data-travessia-fiz]')!.disabled).toBe(true);
    expect(mapa()).toContain(R1.namePt);
    expect(mapa()).toMatch(/próxima noite/);

    // Virou o dia (o App passa outro `todayKey`): o "Fiz" volta, a Travessia continua lá.
    rerender(createElement(PasseioSheet, {
      language: 'pt-BR',
      crossings: { ...ativa, doneDay: '2026-10-02', pending: [R1.id] },
      onChange: () => {},
      todayKey: '2026-10-03',
    }));
    expect(container.querySelector('[data-travessia-ativa]')!.getAttribute('data-travessia-feito')).toBe('nao');
    expect(container.querySelector<HTMLButtonElement>('[data-travessia-fiz]')!.disabled).toBe(false);
  });

  it('região já aberta: a linha do mapa diz que repetir não muda o mapa (nada farmável)', () => {
    const aberta: CrossingsState = { ...CROSSINGS_EMPTY, opened: [{ region: R1.id, day: '2026-09-01' }] };
    const { container } = render(createElement(Viva, { inicial: pickCrossing(aberta, R1.id, C1.id), dia: '2026-10-02' }));
    expect(container.querySelector('[data-travessia-mapa]')!.textContent).toMatch(/já está no seu mapa/);
  });

  it('EN: o mesmo caminho em inglês, sem "challenge"', () => {
    const { container } = render(createElement(Viva, { inicial: ativa, dia: '2026-10-02', language: 'en-US' }));
    fireEvent.click(container.querySelector('[data-travessia-fiz]')!);
    expect(container.querySelector('[data-travessia-hoje]')!.textContent).toMatch(/Noted for today/);
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
