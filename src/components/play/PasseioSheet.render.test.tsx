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
    // 11/10/2026 (dono): o card da tarefa não tem ícone — nem o da área, nem o "?" de andamento.
    expect(card.querySelector(`[data-travessia-area="${C1.area}"]`)).toBeNull();
    expect(card.querySelector('[data-mission-mark="progress"]')).toBeNull();
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
    // Beta-2 (5.1): o "Passeio livre" saiu — o destino é o da missão, mesmo com região aberta.
    expect(container.querySelector('[data-passeio-destino]')).toBeNull();
    expect(container.textContent).not.toMatch(/Passeio livre|Free stroll/);
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

  it('5.1: cada proposta mostra a MISSÃO (título) e o DESTINO que ela justifica, em destaque discreto', () => {
    const { container } = render(createElement(Viva, { inicial: CROSSINGS_EMPTY, dia: DIA }));
    for (const m of hoje3) {
      const card = container.querySelector(`[data-travessia-card="${m.challenge.id}"]`)!;
      expect(card.textContent).toContain(travessiaTitle(m.challenge.id, true)!);
      const dest = card.querySelector('[data-passeio-destino-nome]') as HTMLElement;
      expect(dest.textContent).toBe(`Destino${m.region.namePt}`);
      // destaque pelo token dourado da paleta, nunca hex
      expect((dest.lastElementChild as HTMLElement).style.color).toBe('var(--sm2-gold-ink)');
    }
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

describe('o card da missão em uso (11/10/2026) — cabeçalho legível, sem emoji de enfeite', () => {
  it('5.1: UMA escolha — a missão é o principal e o destino (com a imagem) vem logo abaixo, sem duas etapas', () => {
    const { container } = render(createElement(Viva, { inicial: ativa, dia: DIA }));
    const card = container.querySelector('[data-travessia-ativa]')!;
    const destino = card.querySelector('[data-passeio-destino-card]') as HTMLElement;
    expect(destino.textContent).toBe(`Destino${R1.namePt}`);
    expect(destino.querySelector('[data-travessia-postal]')).toBeTruthy();
    expect(card.textContent).not.toMatch(/Destino de hoje à noite|Faça isto hoje, para o Soulmon/);
    const faca = card.querySelector('[data-passeio-faca]') as HTMLElement;
    // a missão vem ANTES do destino
    expect(faca.compareDocumentPosition(destino) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(faca.querySelector('img, svg, .sm2-icon, [data-travessia-glifo], [data-mission-mark]')).toBeNull();
    const titulo = faca.querySelector('[data-travessia-titulo]') as HTMLElement;
    expect(titulo.textContent).toBe(travessiaTitle(C1.id, true)!);
    expect(card.querySelector('[data-mission-mark="progress"]')).toBeNull();
  });

  it('a região guardada não usa emoji (🌄) — ícone do sistema', () => {
    const pend: CrossingsState = { ...CROSSINGS_EMPTY, pending: [FORA[0].id] };
    const { container } = render(createElement(Viva, { inicial: pend, dia: DIA }));
    const li = container.querySelector('[data-travessia-pendente]')!;
    expect(li.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(li.querySelector('.sm2-icon')).toBeTruthy();
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
